"""Async Postgres access via a shared connection pool."""

from datetime import date
from typing import Optional

from psycopg.rows import dict_row
from psycopg_pool import AsyncConnectionPool

from app.config.settings import settings

_pool: Optional[AsyncConnectionPool] = None


async def open_pool() -> None:
    global _pool
    if _pool is None:
        _pool = AsyncConnectionPool(
            conninfo=settings.DATABASE_URL,
            min_size=0,
            max_size=5,
            open=False,
            kwargs={"row_factory": dict_row},
        )
        await _pool.open()


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


def pool() -> AsyncConnectionPool:
    if _pool is None:
        raise RuntimeError("Database pool is not open")
    return _pool


async def get_user(user_id: str) -> Optional[dict]:
    async with pool().connection() as conn:
        cur = await conn.execute(
            'SELECT "userId", name, plans, "messageCount", "lastMessageDate" '
            'FROM users WHERE "userId" = %s LIMIT 1',
            (user_id,),
        )
        return await cur.fetchone()


async def reserve_message(user_id: str) -> Optional[dict]:
    """Atomically consume one daily message.

    Returns {"plans", "messageCount"} after the increment, or None when the
    free daily limit is already used up. A single UPDATE avoids the
    check-then-increment race the old code had.
    """
    today = date.today()
    async with pool().connection() as conn:
        cur = await conn.execute(
            '''
            UPDATE users
            SET "messageCount" = CASE
                    WHEN "lastMessageDate" IS NULL OR "lastMessageDate" < %s THEN 1
                    ELSE "messageCount" + 1
                END,
                "lastMessageDate" = %s
            WHERE "userId" = %s
              AND (
                    plans = 'PRO'
                    OR "lastMessageDate" IS NULL
                    OR "lastMessageDate" < %s
                    OR "messageCount" < %s
              )
            RETURNING plans, "messageCount"
            ''',
            (today, today, user_id, today, settings.FREE_DAILY_LIMIT),
        )
        return await cur.fetchone()


async def get_recent_messages(user_id: str, limit: int) -> list[dict]:
    """Most recent messages in chronological order."""
    async with pool().connection() as conn:
        cur = await conn.execute(
            '''
            SELECT role, message FROM (
                SELECT role, message, "createdAt"
                FROM messages
                WHERE "userId" = %s
                ORDER BY "createdAt" DESC
                LIMIT %s
            ) recent
            ORDER BY "createdAt" ASC
            ''',
            (user_id, limit),
        )
        return await cur.fetchall()


async def save_message(user_id: str, role: str, text: str) -> None:
    async with pool().connection() as conn:
        await conn.execute(
            'INSERT INTO messages ("userId", message, role) VALUES (%s, %s, %s::message_role)',
            (user_id, text, role),
        )


async def get_latest_summary(user_id: str) -> Optional[str]:
    async with pool().connection() as conn:
        cur = await conn.execute(
            'SELECT summary FROM summary WHERE "userId" = %s ORDER BY "createdAt" DESC LIMIT 1',
            (user_id,),
        )
        row = await cur.fetchone()
        return row["summary"] if row else None
