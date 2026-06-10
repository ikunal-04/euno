"""Realtime voice pipeline: browser audio -> Deepgram STT -> Gemini -> Deepgram TTS.

All state lives on a per-connection VoiceSession, so any number of users can
talk concurrently. Auth is a short-lived JWT minted by the Next.js app.
"""

import asyncio
import base64
import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from deepgram import (
    DeepgramClient,
    LiveTranscriptionEvents,
    LiveOptions,
    SpeakWebSocketEvents,
)

from app import db
from app.auth import verify_voice_token
from app.config.settings import settings
from app.services.agent_service import agent_service, ChatSession

logger = logging.getLogger(__name__)

router = APIRouter()

deepgram = DeepgramClient(settings.DEEPGRAM_API_KEY)

TTS_CHUNK_TIMEOUT = 15  # seconds without TTS audio before giving up on a turn


class VoiceSession:
    def __init__(self, websocket: WebSocket, user_id: str):
        self.websocket = websocket
        self.user_id = user_id
        self.loop = asyncio.get_running_loop()
        self.events: asyncio.Queue = asyncio.Queue()
        self.chat: ChatSession | None = None
        self.dg_connection = None

        self.utterance_parts: list[str] = []
        self.pending_utterance: str | None = None
        self.turn_task: asyncio.Task | None = None
        self.speaking = False  # agent audio is currently streaming to the client
        self.closed = False

    # ---- outbound messages -------------------------------------------------

    async def send(self, payload: dict) -> None:
        if self.closed:
            return
        try:
            await self.websocket.send_text(json.dumps(payload))
        except Exception:
            self.closed = True

    # ---- Deepgram STT ------------------------------------------------------

    def _queue_event(self, kind: str, data) -> None:
        self.loop.call_soon_threadsafe(self.events.put_nowait, (kind, data))

    async def start_stt(self) -> bool:
        connection = deepgram.listen.websocket.v("1")
        options = LiveOptions(
            model=settings.STT_MODEL,
            language="en-US",
            smart_format=True,
            encoding="linear16",
            channels=1,
            sample_rate=16000,
            interim_results=True,
            vad_events=True,
            endpointing=300,
            utterance_end_ms="1200",
        )

        connection.on(
            LiveTranscriptionEvents.Transcript,
            lambda _self, result, **kw: self._queue_event("transcript", result),
        )
        connection.on(
            LiveTranscriptionEvents.UtteranceEnd,
            lambda _self, utterance_end, **kw: self._queue_event("utterance_end", None),
        )
        connection.on(
            LiveTranscriptionEvents.Error,
            lambda _self, error, **kw: logger.error("deepgram STT error: %s", error),
        )

        started = await asyncio.to_thread(connection.start, options)
        if started is False:
            return False
        self.dg_connection = connection
        return True

    # ---- conversation turns ------------------------------------------------

    async def handle_transcript(self, result) -> None:
        try:
            alternative = result.channel.alternatives[0]
        except (AttributeError, IndexError):
            return
        text = (alternative.transcript or "").strip()
        if not text:
            return

        await self.send({"type": "transcript", "text": text, "is_final": bool(result.is_final)})

        # Barge-in: the user started talking over the agent's voice.
        if self.speaking and self.turn_task and not self.turn_task.done():
            self.turn_task.cancel()
            await self.send({"type": "interrupt"})

        if result.is_final:
            self.utterance_parts.append(text)
            if getattr(result, "speech_final", False):
                self.commit_utterance()

    def commit_utterance(self) -> None:
        if not self.utterance_parts:
            return
        utterance = " ".join(self.utterance_parts)
        self.utterance_parts = []

        if self.turn_task and not self.turn_task.done():
            # A turn is mid-flight (LLM phase). Hold the new utterance and fold
            # it into the next turn instead of talking over ourselves.
            self.pending_utterance = (
                f"{self.pending_utterance} {utterance}" if self.pending_utterance else utterance
            )
            return

        self.turn_task = self.loop.create_task(self.run_turn(utterance))

    async def run_turn(self, utterance: str) -> None:
        try:
            await self.send({"type": "user_message", "text": utterance})

            result = await agent_service.reply(self.chat, utterance)

            await self.send({"type": "agent_text", "text": result.text})
            if result.limit_reached:
                await self.send({"type": "limit_reached"})

            await self.speak(result.text)

            await self.send({"type": "agent_done"})
            if result.remaining is not None:
                await self.send(
                    {"type": "limit", "remaining": result.remaining, "limit": settings.FREE_DAILY_LIMIT}
                )
        except asyncio.CancelledError:
            raise
        except Exception as e:
            logger.exception("turn failed for %s: %s", self.user_id, e)
            await self.send({"type": "error", "message": "Something went wrong, please try again."})
        finally:
            self.speaking = False
            # If the user said something while we were replying, answer it now.
            if self.pending_utterance and not self.closed:
                next_utterance, self.pending_utterance = self.pending_utterance, None
                self.turn_task = self.loop.create_task(self.run_turn(next_utterance))

    # ---- Deepgram TTS ------------------------------------------------------

    async def speak(self, text: str) -> None:
        """Stream TTS audio for one reply. Ends when Deepgram flushes, not on a timer."""
        audio_queue: asyncio.Queue = asyncio.Queue()
        done = object()

        tts = deepgram.speak.websocket.v("1")
        tts.on(
            SpeakWebSocketEvents.AudioData,
            lambda _self, data, **kw: self.loop.call_soon_threadsafe(audio_queue.put_nowait, data),
        )
        tts.on(
            SpeakWebSocketEvents.Flushed,
            lambda _self, flushed, **kw: self.loop.call_soon_threadsafe(audio_queue.put_nowait, done),
        )
        tts.on(
            SpeakWebSocketEvents.Close,
            lambda _self, close, **kw: self.loop.call_soon_threadsafe(audio_queue.put_nowait, done),
        )

        started = await asyncio.to_thread(
            tts.start,
            {
                "model": settings.TTS_MODEL,
                "encoding": "linear16",
                "sample_rate": settings.TTS_SAMPLE_RATE,
            },
        )
        if started is False:
            logger.error("failed to start TTS connection")
            return

        self.speaking = True
        try:
            await asyncio.to_thread(tts.send_text, text)
            await asyncio.to_thread(tts.flush)

            while True:
                chunk = await asyncio.wait_for(audio_queue.get(), timeout=TTS_CHUNK_TIMEOUT)
                if chunk is done:
                    break
                await self.send(
                    {
                        "type": "agent_audio",
                        "audio": base64.b64encode(chunk).decode("ascii"),
                        "sample_rate": settings.TTS_SAMPLE_RATE,
                    }
                )
        except asyncio.TimeoutError:
            logger.warning("TTS timed out waiting for audio")
        finally:
            self.speaking = False
            try:
                await asyncio.to_thread(tts.finish)
            except Exception:
                pass

    # ---- lifecycle ---------------------------------------------------------

    async def pump_microphone(self) -> None:
        while True:
            data = await self.websocket.receive_bytes()
            if self.dg_connection and data:
                self.dg_connection.send(data)

    async def pump_events(self) -> None:
        while True:
            kind, data = await self.events.get()
            if kind == "transcript":
                await self.handle_transcript(data)
            elif kind == "utterance_end":
                # Silence fallback when speech_final never arrived.
                self.commit_utterance()

    async def close(self) -> None:
        self.closed = True
        if self.turn_task and not self.turn_task.done():
            self.turn_task.cancel()
        if self.dg_connection:
            try:
                await asyncio.to_thread(self.dg_connection.finish)
            except Exception:
                pass


@router.websocket("/ws/audio")
async def websocket_audio_endpoint(websocket: WebSocket):
    await websocket.accept()

    token = websocket.query_params.get("token", "")
    user_id = verify_voice_token(token)
    if not user_id:
        await websocket.close(code=4003, reason="Invalid or expired token")
        return

    session = VoiceSession(websocket, user_id)

    try:
        chat, stt_ok = await asyncio.gather(
            agent_service.start_session(user_id),
            session.start_stt(),
        )
        if not stt_ok:
            await websocket.close(code=1011, reason="Speech service unavailable")
            return
        session.chat = chat

        remaining = None
        user = await db.get_user(user_id)
        if user and user.get("plans") != "PRO":
            count = user.get("messageCount") or 0
            last = user.get("lastMessageDate")
            if last is None or last < db.today():
                count = 0
            remaining = max(0, settings.FREE_DAILY_LIMIT - count)
        await session.send(
            {"type": "ready", "remaining": remaining, "limit": settings.FREE_DAILY_LIMIT}
        )

        pumps = [
            asyncio.create_task(session.pump_microphone()),
            asyncio.create_task(session.pump_events()),
        ]
        try:
            await asyncio.gather(*pumps)
        finally:
            for task in pumps:
                task.cancel()

    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.exception("voice session error for %s: %s", user_id, e)
    finally:
        await session.close()
        try:
            await websocket.close()
        except Exception:
            pass


@router.get("/health")
async def health_check():
    return {"status": "healthy"}
