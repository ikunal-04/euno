import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # API keys
    DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY", "")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    MEM0_API_KEY = os.getenv("MEM0_API_KEY", "")
    DATABASE_URL = os.getenv("DATABASE_URL", "")

    # Auth — must match the secret the Next.js app signs voice tokens with
    VOICE_JWT_SECRET = os.getenv("VOICE_JWT_SECRET") or os.getenv("NEXTAUTH_SECRET", "")
    VOICE_JWT_AUDIENCE = "euno-voice"

    # CORS — comma-separated list of allowed origins
    ALLOWED_ORIGINS = [
        o.strip()
        for o in os.getenv(
            "ALLOWED_ORIGINS", "http://localhost:3000,https://www.euno.live,https://euno.live"
        ).split(",")
        if o.strip()
    ]

    # Models
    GEMINI_MODEL = "gemini-2.5-flash"
    STT_MODEL = "nova-3"
    TTS_MODEL = "aura-2-thalia-en"
    TTS_SAMPLE_RATE = 48000

    # Conversation
    HISTORY_MESSAGES = 20          # past messages seeded into a new chat session
    MAX_OUTPUT_TOKENS = 300        # keep replies short — it's a voice conversation
    FREE_DAILY_LIMIT = 5
    MEMORY_SEARCH_TIMEOUT = 2.5    # seconds — never let memory lookups stall a reply

    @classmethod
    def validate(cls) -> list[str]:
        missing = []
        for var in ("DEEPGRAM_API_KEY", "GEMINI_API_KEY", "DATABASE_URL", "VOICE_JWT_SECRET"):
            if not getattr(cls, var):
                missing.append(var)
        return missing


settings = Settings()
