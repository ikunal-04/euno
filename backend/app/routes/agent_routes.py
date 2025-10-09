from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
import asyncio
import json
import os
import base64
from typing import Optional
import threading
from dotenv import load_dotenv
from deepgram import (
    DeepgramClient,
    DeepgramClientOptions,
    LiveTranscriptionEvents,
    LiveOptions,
    SpeakWebSocketEvents,
    SpeakOptions,
)
from app.agent.agent import generate_response

load_dotenv()

router = APIRouter()

deepgram: DeepgramClient = DeepgramClient(os.getenv('DEEPGRAM_API_KEY'))

@router.websocket("/ws/audio")
async def websocket_audio_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    dg_connection = None
    
    try:
        dg_connection = deepgram.listen.websocket.v("1")
        
        options = LiveOptions(
            model="nova-3",
            language="en-US",
            smart_format=True,
            encoding="linear16",
            channels=1,
            sample_rate=16000,
            interim_results=True,
            utterance_end_ms="1000",
            vad_events=True,
            endpointing=300
        )
        
        loop = asyncio.get_running_loop()

        def on_message(self, result, **_):
            try:
                sentence = result.channel.alternatives[0].transcript
                if len(sentence) == 0:
                    return
                
                print(f"🎤 Received transcript: '{sentence}' (final: {result.is_final})")
                
                response = {
                    "type": "transcription",
                    "text": sentence,
                    "is_final": result.is_final,
                }

                try:
                    asyncio.run_coroutine_threadsafe(
                        websocket.send_text(json.dumps(response)), loop
                    )
                except Exception as ws_error:
                    print(f"❌ Failed to send transcript to frontend: {ws_error}")
                
                if result.is_final:
                    print(f"🔄 Generating streaming TTS via Deepgram SDK for: '{sentence}'")
                    try:
                        # Generate response text
                        from app.services.agent_service import agent_service
                        llm_text = agent_service.generate_response(sentence)

                        dg_speak = deepgram.speak.websocket.v("1")

                        def on_open(self, open_event, **kwargs):
                            print("🔊 TTS WebSocket opened")

                        def on_binary(self, data: bytes, **kwargs):
                            try:
                                b64 = base64.b64encode(data).decode('utf-8')
                                msg = {
                                    "type": "agent_response",
                                    "text": llm_text,
                                    "audio_data": b64,
                                    "audio_mime_type": "audio/linear16; rate=48000; channels=1",
                                    "status": "streaming",
                                    "is_final": False
                                }
                                asyncio.run_coroutine_threadsafe(websocket.send_text(json.dumps(msg)), loop)
                            except Exception as e:
                                print(f"❌ TTS proxy error: {e}")

                        def on_close(self, close_event, **_):
                            done = {
                                "type": "agent_response",
                                "text": llm_text,
                                "audio_data": "",
                                "audio_mime_type": "audio/linear16; rate=48000; channels=1",
                                "status": "complete",
                                "is_final": True
                            }
                            asyncio.run_coroutine_threadsafe(websocket.send_text(json.dumps(done)), loop)
                            print("✅ TTS streaming complete")

                        dg_speak.on(SpeakWebSocketEvents.Open, on_open)
                        dg_speak.on(SpeakWebSocketEvents.AudioData, on_binary)
                        dg_speak.on(SpeakWebSocketEvents.Close, on_close)

                        # Some SDK versions expect a plain dict for start(options)
                        opts_dict = {
                            "model": "aura-2-thalia-en",
                            "encoding": "linear16",
                            "sample_rate": 48000,
                        }
                        if dg_speak.start(opts_dict) is False:
                            print("❌ Failed to start TTS")
                            return

                        dg_speak.send_text(llm_text)
                        dg_speak.flush()

                        # Ensure connection finishes after a grace period
                        def finish_later():
                            try:
                                dg_speak.finish()
                            except Exception as e:
                                print(f"TTS finish error: {e}")

                        threading.Timer(8.0, finish_later).start()

                    except Exception as agent_error:
                        print(f"❌ Error generating SDK streaming TTS: {agent_error}")
                
            except Exception as e:
                print(f"❌ Error in transcription handler: {e}")
        
        def on_error(self, error, **_):
            print(f"❌ Deepgram error: {error}")
        
        def on_open(self, open_event, **_):
            print("✅ Deepgram connection opened successfully")
        
        def on_close(self, close_event, **_):
            print("🔌 Deepgram connection closed")
        
        # Register event handlers
        dg_connection.on(LiveTranscriptionEvents.Open, on_open)
        dg_connection.on(LiveTranscriptionEvents.Transcript, on_message)
        dg_connection.on(LiveTranscriptionEvents.Error, on_error)
        dg_connection.on(LiveTranscriptionEvents.Close, on_close)
        
        # Start Deepgram connection
        if dg_connection.start(options) is False:
            print("Failed to start Deepgram connection")
            await websocket.close(code=1000)
            return
        
        print("Deepgram connection started successfully")
        
        # Listen for audio data from frontend
        audio_chunk_count = 0
        while True:
            try:
                # Receive audio data from frontend
                audio_data = await websocket.receive_bytes()
                audio_chunk_count += 1
                
                # Send audio data to Deepgram
                if dg_connection and len(audio_data) > 0:
                    dg_connection.send(audio_data)
                        
            except WebSocketDisconnect:
                print("🔌 WebSocket disconnected")
                break
            except Exception as e:
                print(f"❌ Error receiving audio data: {e}")
                break
    
    except Exception as e:
        print(f"Error in WebSocket endpoint: {e}")
    
    finally:
        if dg_connection:
            try:
                # Wait a few seconds for all results to arrive
                await asyncio.sleep(2)
                dg_connection.finish()
                print("Deepgram connection closed")
            except Exception as e:
                print(f"Error closing Deepgram connection: {e}")
        try:
            await websocket.close()
        except Exception as e:
            print(f"Error closing WebSocket: {e}")


@router.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Agent routes are working"}