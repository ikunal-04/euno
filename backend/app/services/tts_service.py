import json
import os
import asyncio
import websockets
from typing import Optional, Dict, Any
import base64
from dotenv import load_dotenv

load_dotenv()

class DeepgramTTSService:
    def __init__(self):
        self.api_key = os.getenv('DEEPGRAM_API_KEY')
        self.base_url = "wss://api.deepgram.com/v1/speak"
        self.model = "aura-2-thalia-en"
        self.encoding = "linear16"
        self.sample_rate = 48000
        
    async def synthesize_speech(self, text: str) -> Dict[str, Any]:
        """
        Convert text to speech using Deepgram TTS WebSocket API
        Returns: dict with audio_data (base64), audio_mime_type, and text
        """
        if not self.api_key:
            raise ValueError("DEEPGRAM_API_KEY not found in environment variables")
        
        if not text or not text.strip():
            return {
                "audio_data": "",
                "audio_mime_type": "audio/linear16; rate=48000; channels=1",
                "text": text
            }
        
        # Clean the text for TTS
        clean_text = text.strip()
        
        # Build WebSocket URL with parameters
        # Ask Deepgram to return WAV so browsers can play it directly
        url = (
            f"{self.base_url}?model={self.model}"
            f"&encoding={self.encoding}"
            f"&sample_rate={self.sample_rate}"
            f"&container=wav"
        )
        
        headers = {
            "Authorization": f"Token {self.api_key.strip()}",
            "User-Agent": "talking-app-tts/1.0"
        }
        
        try:
            async with websockets.connect(url, extra_headers=headers) as websocket:
                print(f"🔊 Connected to Deepgram TTS for: '{clean_text[:50]}...'")
                
                # Send the text to synthesize
                message = {
                    "type": "Speak",
                    "text": clean_text
                }
                await websocket.send(json.dumps(message))
                
                # Send flush to complete the request
                await websocket.send(json.dumps({"type": "Flush"}))
                
                # Collect audio data
                audio_chunks = []
                completion_received = False
                
                # Set a reasonable timeout
                timeout = 10.0  # 10 seconds max
                start_time = asyncio.get_event_loop().time()
                
                while not completion_received:
                    try:
                        # Check timeout
                        if asyncio.get_event_loop().time() - start_time > timeout:
                            print("⚠️ TTS timeout reached")
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
                                    print("✅ TTS synthesis completed")
                                elif status.get('type') == 'Error':
                                    print(f"❌ TTS Error: {status}")
                                    return {
                                        "audio_data": "",
                                        "audio_mime_type": "audio/linear16; rate=48000; channels=1",
                                        "text": text,
                                        "error": f"TTS Error: {status}"
                                    }
                            except json.JSONDecodeError:
                                print(f"📝 TTS Message: {message}")
                                
                        elif isinstance(message, bytes):
                            # Audio data
                            audio_chunks.append(message)
                            print(f"🎵 Received audio chunk: {len(message)} bytes")
                            
                    except asyncio.TimeoutError:
                        # No message received in timeout period
                        if audio_chunks and completion_received:
                            break
                        continue
                    except websockets.exceptions.ConnectionClosed:
                        print("🔌 TTS WebSocket connection closed")
                        break
                
                # Combine all audio chunks
                if audio_chunks:
                    combined_audio = b''.join(audio_chunks)
                    audio_base64 = base64.b64encode(combined_audio).decode('utf-8')
                    print(f"🎯 TTS Complete: {len(combined_audio)} bytes audio")
                    
                    return {
                        "audio_data": audio_base64,
                        "audio_mime_type": "audio/wav",
                        "text": text
                    }
                else:
                    print("⚠️ No audio data received from TTS")
                    return {
                        "audio_data": "",
                        "audio_mime_type": "audio/wav",
                        "text": text,
                        "error": "No audio data received"
                    }
                    
        except Exception as e:
            print(f"❌ TTS Service Error: {e}")
            return {
                "audio_data": "",
                "audio_mime_type": "audio/linear16; rate=48000; channels=1",
                "text": text,
                "error": f"TTS Service Error: {str(e)}"
            }

# Global instance
tts_service = DeepgramTTSService()
