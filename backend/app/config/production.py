"""
Production configuration for voice chat application
"""
import os
from dotenv import load_dotenv

load_dotenv()

class ProductionConfig:
    # Deepgram Configuration
    DEEPGRAM_API_KEY = os.getenv('DEEPGRAM_API_KEY')
    DEEPGRAM_STT_MODEL = "nova-3"  # Latest model for best accuracy
    DEEPGRAM_TTS_MODEL = "aura-2-thalia-en"  # High-quality voice
    DEEPGRAM_TTS_ENCODING = "linear16"
    DEEPGRAM_TTS_SAMPLE_RATE = 48000
    
    # Gemini Configuration
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    GEMINI_MODEL = "gemini-2.5-flash"  # Fast and efficient
    
    # WebSocket Configuration
    WS_TIMEOUT = 30  # seconds
    WS_MAX_CONNECTIONS = 100
    
    # Audio Configuration
    AUDIO_CHUNK_SIZE = 8000  # Optimized for real-time
    AUDIO_SAMPLE_RATE = 16000  # STT sample rate
    AUDIO_CHANNELS = 1
    
    # TTS Streaming Configuration
    TTS_STREAMING_TIMEOUT = 10  # seconds
    TTS_CHUNK_SIZE = 1024  # bytes per chunk
    
    # Performance Settings
    MAX_CONCURRENT_REQUESTS = 50
    REQUEST_TIMEOUT = 30  # seconds
    
    # Error Handling
    MAX_RETRIES = 3
    RETRY_DELAY = 1  # seconds
    
    # Logging
    LOG_LEVEL = "INFO"
    LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    @classmethod
    def validate(cls):
        """Validate required environment variables"""
        required_vars = ['DEEPGRAM_API_KEY', 'GEMINI_API_KEY']
        missing = [var for var in required_vars if not getattr(cls, var)]
        
        if missing:
            raise ValueError(f"Missing required environment variables: {missing}")
        
        return True
