"""Long-term memory backed by mem0 (hosted, free tier).

Falls back to the latest stored conversation summary when MEM0_API_KEY is not
configured, so the app keeps working without the service.
"""

import asyncio
import logging

from app.config.settings import settings
from app import db

logger = logging.getLogger(__name__)

try:
    from mem0 import AsyncMemoryClient
except ImportError:  # pragma: no cover
    AsyncMemoryClient = None


class MemoryService:
    def __init__(self):
        self._client = None
        if settings.MEM0_API_KEY and AsyncMemoryClient is not None:
            self._client = AsyncMemoryClient(api_key=settings.MEM0_API_KEY)
            logger.info("mem0 memory enabled")
        else:
            logger.info("MEM0_API_KEY not set — falling back to stored summaries")

    @property
    def enabled(self) -> bool:
        return self._client is not None

    async def recall(self, user_id: str) -> str:
        """Fetch what we know about the user, formatted for the system prompt."""
        if self._client is None:
            summary = await db.get_latest_summary(user_id)
            return summary or ""
        try:
            result = await asyncio.wait_for(
                self._client.search(
                    "the user's life, personality, relationships, work, and current situation",
                    filters={"user_id": user_id},
                    top_k=10,
                ),
                timeout=settings.MEMORY_SEARCH_TIMEOUT,
            )
            items = result.get("results", result) if isinstance(result, dict) else result
            memories = [item.get("memory", "") for item in items if isinstance(item, dict)]
            return "\n".join(f"- {m}" for m in memories if m)
        except Exception as e:
            logger.warning("mem0 recall failed: %s", e)
            return ""

    async def remember(self, user_id: str, user_text: str, agent_text: str) -> None:
        """Store one exchange. Called fire-and-forget — never blocks a reply."""
        if self._client is None:
            return
        try:
            await self._client.add(
                [
                    {"role": "user", "content": user_text},
                    {"role": "assistant", "content": agent_text},
                ],
                user_id=user_id,
            )
        except Exception as e:
            logger.warning("mem0 remember failed: %s", e)


memory_service = MemoryService()
