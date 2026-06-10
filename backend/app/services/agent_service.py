"""Conversation engine: Gemini chat sessions with memory and quota handling."""

import asyncio
import logging
from dataclasses import dataclass, field
from typing import Optional

from google import genai
from google.genai import types

from app.agent.prompt import build_system_prompt
from app.config.settings import settings
from app.services.memory_service import memory_service
from app import db

logger = logging.getLogger(__name__)


@dataclass
class TurnResult:
    text: str
    limit_reached: bool = False
    remaining: Optional[int] = None  # None means unlimited (PRO)


@dataclass
class ChatSession:
    user_id: str
    user_name: str
    chat: object
    background_tasks: set = field(default_factory=set)

    def spawn(self, coro) -> None:
        """Run persistence/memory work without blocking the reply path."""
        task = asyncio.get_running_loop().create_task(coro)
        self.background_tasks.add(task)
        task.add_done_callback(self.background_tasks.discard)


FALLBACK_REPLY = "Sorry, I spaced out for a second there. Say that again?"

LIMIT_REPLY = (
    "Hey, we've hit the free daily limit for today. I'd love to keep talking — "
    "you can upgrade to Pro for unlimited conversations, or I'll be right here tomorrow."
)


class AgentService:
    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)

    async def start_session(self, user_id: str) -> ChatSession:
        """Build a chat session: user profile + long-term memory + recent history."""
        user, memories, recent = await asyncio.gather(
            db.get_user(user_id),
            memory_service.recall(user_id),
            db.get_recent_messages(user_id, settings.HISTORY_MESSAGES),
            return_exceptions=True,
        )
        if isinstance(user, Exception):
            logger.error("failed to load user %s: %s", user_id, user)
            user = None
        if isinstance(memories, Exception):
            memories = ""
        if isinstance(recent, Exception):
            recent = []

        user_name = (user or {}).get("name") or "friend"
        first_name = user_name.split(" ")[0]

        history = [
            types.Content(
                role="user" if m["role"] == "user" else "model",
                parts=[types.Part(text=m["message"])],
            )
            for m in recent
            if m.get("message")
        ]

        config = types.GenerateContentConfig(
            system_instruction=build_system_prompt(first_name, memories),
            # No thinking, no tools: this is a realtime voice conversation and
            # every added second of latency breaks the illusion of presence.
            thinking_config=types.ThinkingConfig(thinking_budget=0),
            max_output_tokens=settings.MAX_OUTPUT_TOKENS,
            temperature=1.0,
        )

        chat = self.client.aio.chats.create(
            model=settings.GEMINI_MODEL,
            config=config,
            history=history,
        )
        return ChatSession(user_id=user_id, user_name=first_name, chat=chat)

    async def reply(self, session: ChatSession, user_text: str) -> TurnResult:
        """One conversational turn. Quota is consumed only on successful replies."""
        reservation = await db.reserve_message(session.user_id)
        if reservation is None:
            return TurnResult(text=LIMIT_REPLY, limit_reached=True, remaining=0)

        is_pro = reservation.get("plans") == "PRO"
        remaining = (
            None
            if is_pro
            else max(0, settings.FREE_DAILY_LIMIT - (reservation.get("messageCount") or 0))
        )

        try:
            response = await session.chat.send_message(user_text)
            text = (response.text or "").strip() if response else ""
        except Exception as e:
            logger.error("gemini error for %s: %s", session.user_id, e)
            text = ""

        if not text:
            # Don't charge the user for a turn we failed to answer.
            await db.refund_message(session.user_id)
            if remaining is not None:
                remaining = min(settings.FREE_DAILY_LIMIT, remaining + 1)
            return TurnResult(text=FALLBACK_REPLY, remaining=remaining)

        session.spawn(db.save_message(session.user_id, "user", user_text))
        session.spawn(db.save_message(session.user_id, "assistant", text))
        session.spawn(memory_service.remember(session.user_id, user_text, text))

        return TurnResult(text=text, remaining=remaining)

    async def close(self) -> None:
        await self.client.aio.aclose()


agent_service = AgentService()
