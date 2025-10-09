import json
import os
import asyncio
import websockets
from typing import Optional, Dict, Any, AsyncGenerator
import base64
from dotenv import load_dotenv
from app.config.production import ProductionConfig

load_dotenv()

class StreamingDeepgramTTSService:
    def __init__(self):
        self.api_key = ProductionConfig.DEEPGRAM_API_KEY
        self.base_url = "wss://api.deepgram.com/v1/speak"
        self.model = ProductionConfig.DEEPGRAM_TTS_MODEL
        self.encoding = ProductionConfig.DEEPGRAM_TTS_ENCODING
        self.sample_rate = ProductionConfig.DEEPGRAM_TTS_SAMPLE_RATE
        self.timeout = ProductionConfig.TTS_STREAMING_TIMEOUT
        
    async def stream_speech(self, text: str) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Stream TTS audio data as it's generated for real-time playback
        Yields: dict with audio_data (base64), audio_mime_type, and status
        """
        if not self.api_key:
            raise ValueError("DEEPGRAM_API_KEY not found in environment variables")
        
        if not text or not text.strip():
            yield {
                "audio_data": "",
                "audio_mime_type": "audio/linear16; rate=48000; channels=1",
                "text": text,
                "status": "empty"
            }
            return
        
        # Clean the text for TTS
        clean_text = text.strip()
        
        # Build WebSocket URL with parameters
        url = f"{self.base_url}?model={self.model}&encoding={self.encoding}&sample_rate={self.sample_rate}"
        
        headers = {
            "Authorization": f"Token {self.api_key}"
        }
        
        try:
            async with websockets.connect(url, additional_headers=headers) as websocket:
                print(f"🔊 Streaming TTS for: '{clean_text[:50]}...'")
                
                # Send the text to synthesize
                message = {
                    "type": "Speak",
                    "text": clean_text
                }
                await websocket.send(json.dumps(message))
                
                # Send flush to complete the request
                await websocket.send(json.dumps({"type": "Flush"}))
                
                # Stream audio data as it arrives
                timeout = self.timeout
                start_time = asyncio.get_event_loop().time()
                completion_received = False
                
                while not completion_received:
                    try:
                        # Check timeout
                        if asyncio.get_event_loop().time() - start_time > timeout:
                            print("⚠️ TTS streaming timeout reached")
                            break
                            
                        # Wait for message with timeout
                        message = await asyncio.wait_for(websocket.recv(), timeout=1.0)
                        
                        if isinstance(message, str):
                            # JSON status message
                            try:
                                status = json.loads(message)
                                print(f"📊 TTS Status: {status}")
                                
                                if status.get('type') == 'Complete':
                                    completion_received = True
                                    yield {
                                        "audio_data": "",
                                        "audio_mime_type": "audio/linear16; rate=48000; channels=1",
                                        "text": clean_text,
                                        "status": "complete"
                                    }
                                elif status.get('type') == 'Error':
                                    print(f"❌ TTS Error: {status}")
                                    yield {
                                        "audio_data": "",
                                        "audio_mime_type": "audio/linear16; rate=48000; channels=1",
                                        "text": clean_text,
                                        "status": "error",
                                        "error": f"TTS Error: {status}"
                                    }
                                    return
                            except json.JSONDecodeError:
                                print(f"📝 TTS Message: {message}")
                                
                        elif isinstance(message, bytes):
                            # Audio data - stream it immediately
                            audio_base64 = base64.b64encode(message).decode('utf-8')
                            print(f"🎵 Streaming audio chunk: {len(message)} bytes")
                            
                            yield {
                                "audio_data": audio_base64,
                                "audio_mime_type": f"audio/linear16; rate={self.sample_rate}; channels=1",
                                "text": clean_text,
                                "status": "streaming"
                            }
                            
                    except asyncio.TimeoutError:
                        # No message received in timeout period
                        if completion_received:
                            break
                        continue
                    except websockets.exceptions.ConnectionClosed:
                        print("🔌 TTS WebSocket connection closed")
                        break
                        
        except Exception as e:
            print(f"❌ Streaming TTS Service Error: {e}")
            yield {
                "audio_data": "",
                "audio_mime_type": "audio/linear16; rate=48000; channels=1",
                "text": text,
                "status": "error",
                "error": f"Streaming TTS Service Error: {str(e)}"
            }

# Global instance
streaming_tts_service = StreamingDeepgramTTSService()
