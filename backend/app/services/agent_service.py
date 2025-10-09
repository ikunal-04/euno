import os
from google import genai
from google.genai import types
from app.agent.prompt import THINKING_AGENT
from dotenv import load_dotenv

load_dotenv()

class AgentService:
    def __init__(self):
        self.client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))
        
        # Configure grounding tool for web search
        grounding_tool = types.Tool(
            google_search=types.GoogleSearch()
        )
        
        self.config = types.GenerateContentConfig(
            system_instruction=THINKING_AGENT,
            thinking_config=types.ThinkingConfig(thinking_budget=-1),
            tools=[grounding_tool]
        )
    
    def generate_response(self, user_input: str) -> str:
        """
        Generate a conversational response using Gemini
        Returns: Clean text response
        """
        try:
            print(f"🤖 Generating response for: '{user_input[:50]}...'")
            
            # Generate response using Gemini
            response = self.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=user_input,
                config=self.config
            )
            
            # Extract text from response
            if response and response.text:
                clean_text = response.text.strip()
                print(f"✅ Generated response: '{clean_text[:100]}...'")
                return clean_text
            else:
                print("⚠️ No response generated")
                return "I'm sorry, I didn't catch that. Could you please repeat?"
                
        except Exception as e:
            print(f"❌ Agent Service Error: {e}")
            return "I'm having trouble processing that right now. Could you try again?"

    def chunk_text_by_sentence(self, text: str) -> list[str]:
        """
        Basic sentence chunking recommended by Deepgram docs.
        Splits on . ! ? while preserving the punctuation.
        """
        import re
        sentences = re.split(r'(?<=[.!?])\s+', text.strip())
        return [s for s in sentences if s]

# Global instance
agent_service = AgentService()
