"""Verification of short-lived voice tokens minted by the Next.js app."""

from typing import Optional

from jose import jwt, JWTError

from app.config.settings import settings


def verify_voice_token(token: str) -> Optional[str]:
    """Return the userId the token was issued for, or None if invalid/expired."""
    if not token or not settings.VOICE_JWT_SECRET:
        return None
    try:
        claims = jwt.decode(
            token,
            settings.VOICE_JWT_SECRET,
            algorithms=["HS256"],
            audience=settings.VOICE_JWT_AUDIENCE,
        )
        return claims.get("sub") or None
    except JWTError:
        return None
