import asyncio
from app.services.agent_service import agent_service
from app.services.streaming_tts_service import streaming_tts_service
from app.services.tts_service import tts_service

async def generate_response(question: str) -> dict:
    """
    Generate a complete response with both text and audio
    """
    try:
        # Generate text response using agent service
        text_response = agent_service.generate_response(question)

        tts_result = await tts_service.synthesize_speech(text_response)
        
        # Combine results
        result = {
            "text": text_response,
            "audio_data": tts_result.get("audio_data", ""),
            "audio_mime_type": tts_result.get("audio_mime_type", "audio/linear16; rate=48000; channels=1")
        }
        
        # Add error info if present
        if "error" in tts_result:
            result["error"] = tts_result["error"]
            
        return result
        
    except Exception as e:
        print(f"❌ Error in generate_response: {e}")
        return {
            "text": "I'm sorry, I'm having trouble right now. Please try again.",
            "audio_data": "",
            "audio_mime_type": "audio/linear16; rate=48000; channels=1",
            "error": str(e)
        }

async def stream_response(question: str):
    """
    Stream response with real-time TTS for low latency
    """
    try:
        # Generate text response using agent service
        text_response = agent_service.generate_response(question)
        
        # Stream TTS audio as it's generated
        async for audio_chunk in streaming_tts_service.stream_speech(text_response):
            yield {
                "text": text_response,
                "audio_data": audio_chunk.get("audio_data", ""),
                "audio_mime_type": audio_chunk.get("audio_mime_type", "audio/linear16; rate=48000; channels=1"),
                "status": audio_chunk.get("status", "streaming")
            }
            
    except Exception as e:
        print(f"❌ Error in stream_response: {e}")
        yield {
            "text": "I'm sorry, I'm having trouble right now. Please try again.",
            "audio_data": "",
            "audio_mime_type": "audio/linear16; rate=48000; channels=1",
            "status": "error",
            "error": str(e)
        }
