import os
from google import genai
from google.genai import types
from app.agent.prompt import THINKING_AGENT
from dotenv import load_dotenv
import psycopg
from psycopg.rows import dict_row

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
        
        # Chat instances for each user
        self.user_chats = {}
    
    def get_user_context(self, user_id: str) -> tuple[str, str]:
        """
        Fetch user name and chat summary from the database
        Returns: (user_name, chat_summary)
        """
        try:
            database_url = os.getenv('DATABASE_URL')
            
            if not database_url:
                print("⚠️ DATABASE_URL not found")
                return "Friend", "No previous conversation context available."
            
            user_name = "Friend"
            chat_summary = "No previous conversation context available."

            with psycopg.connect(database_url, row_factory=dict_row) as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        'SELECT name FROM users WHERE "userId" = %s LIMIT 1',
                        (user_id,),
                    )
                    user_data = cur.fetchone()
                    if user_data:
                        user_name = user_data.get('name') or "Friend"

                    cur.execute(
                        'SELECT summary FROM summary WHERE "userId" = %s ORDER BY "createdAt" DESC LIMIT 1',
                        (user_id,),
                    )
                    summary_data = cur.fetchone()
                    if summary_data:
                        chat_summary = summary_data.get('summary') or chat_summary
            
            return user_name, chat_summary
            
        except Exception as e:
            print(f"❌ Error fetching user context: {e}")
            return "Friend", "No previous conversation context available."
    
    def generate_response(self, user_input: str, user_id: str = None) -> str:
        """
        Generate a conversational response using Gemini Chat
        Returns: Clean text response
        """
        try:
            print(f"🤖 Generating response for: '{user_input[:50]}...'")
            
            # Get user context if user_id is provided
            user_name = "Friend"
            chat_summary = "No previous conversation context available."
            
            if user_id:
                user_name, chat_summary = self.get_user_context(user_id)
            
            # Format the prompt with user context
            formatted_prompt = THINKING_AGENT.format(
                user_name=user_name,
                chat_summary=chat_summary,
                user_query=user_input
            )
            
            # Get or create chat instance for this user
            if user_id and user_id in self.user_chats:
                chat = self.user_chats[user_id]
            else:
                # Create new chat instance
                chat = self.client.chats.create(
                    model="gemini-2.5-flash",
                    config=self.config
                )
                if user_id:
                    self.user_chats[user_id] = chat
            
            # Send message to chat
            response = chat.send_message(formatted_prompt)
            
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
