"""
FILE PURPOSE:
- Ye file poore chat logic ki 'Brain' hai. Service layer yahan define hoti hai jo frontend requests aur AI agent ke beech coordination karti hai.
- Ye file decide karti hai ke kab naya session banana hai, kab purana load karna hai, aur messages ko DB mein kaise save karna hai.

CONNECTED FILES:
- backend/database/repository.py: Database queries chalane ke liye.
- backend/content_agent.py: AI Agent instance lene ke liye.
- backend/routers/chat.py: Jo is service ko request pass karte hain.

CHANGE IMPACT:
- Agar yahan bug aaya toh streaming fail ho jayegi, messages save nahi honge, ya multi-chat isolation toot jayegi.
- Response buffer management (full_content) yahan handle hota hai.

FLOW POSITION:
- API Router ke theek baad. Router sirf request valid karta hai, actual logic ChatService mein hota hai.

DEPENDENCY IMPACT:
- Direct dependencies: ChatRepository, get_content_agent
- Indirect dependencies: Frontend UI (SSE updates), Database integrity

MULTI-CHAT ISOLATION EXPLANATION:
- Yahan har function (run_chat, stream_chat) me `session_id` pass hota hai.
- `get_content_agent(session_id)` har request ke liye ek isolated AI context banata hai.
- Frontend se data aate hi hum target session ko lock kar dete hain, isliye parallel chats smoothly chalti hain.
"""

import asyncio
import uuid
import json
import logging
from typing import AsyncGenerator, List, Optional
from datetime import datetime
from database.repository import ChatRepository
from content_agent import get_content_agent

logger = logging.getLogger(__name__)

class ChatService:
    """
    Ye class saari high-level chat management handle karti hai.
    Isko repository object chahiye data access ke liye.
    """
    def __init__(self, repository: ChatRepository):
        self.repository = repository

    async def get_chat_history(self, session_id: str, limit: int = 10) -> List[dict]:
        """AI ko conversation ki 'purani yaadein' (history) dene ke liye"""
        messages = await self.repository.get_messages(uuid.UUID(session_id), limit=limit)
        return [{"role": msg.role, "content": msg.content} for msg in messages]

    async def run_chat(self, content: str, session_id: Optional[str] = None) -> dict:
        """Simple chat generation (Bina streaming ke)"""
        # 1. Check kar rahe hain ke purana session hai ya naya banana hai
        if not session_id:
            session = await self.repository.create_session(title=content[:50])
            session_id = str(session.id)
        else:
            session_uuid = uuid.UUID(session_id)
            session = await self.repository.get_session(session_uuid)
            if not session:
                session = await self.repository.create_session(title=content[:50])
                session_id = str(session.id)

        # 2. User ka message pehle hi DB mein save kar lete hain
        await self.repository.add_message(uuid.UUID(session_id), "user", content)

        # 3. History laa rahe hain AI ko context dene ke liye
        history = await self.get_chat_history(session_id)
        
        # 4. Agent ko execute kar rahe hain ek separate thread mein (takay event loop block na ho)
        agent = get_content_agent(session_id)
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None, 
            lambda: agent.run(content)
        )
        
        ai_content = response.content if hasattr(response, 'content') else str(response)

        # 5. AI ka response bhi DB mein save kar rahe hain
        assistant_msg = await self.repository.add_message(uuid.UUID(session_id), "assistant", ai_content)

        return {
            "session_id": session_id,
            "message": {
                "id": str(assistant_msg.id),
                "role": "assistant",
                "content": ai_content,
                "timestamp": assistant_msg.created_at.isoformat()
            },
            "session_title": session.title
        }

    async def stream_chat(self, content: str, session_id: Optional[str] = None) -> AsyncGenerator[str, None]:
        """ChatGPT-style tokens ko ek-ek karke stream karta hai frontend pe"""
        # 1. Session integrity check
        if not session_id:
            session = await self.repository.create_session(title=content[:50])
            session_id = str(session.id)
        else:
            session_uuid = uuid.UUID(session_id)
            session = await self.repository.get_session(session_uuid)
            if not session:
                session = await self.repository.create_session(title=content[:50])
                session_id = str(session.id)

        # 2. User message save kar rahe hain
        await self.repository.add_message(uuid.UUID(session_id), "user", content)

        # 3. Streaming start kar rahe hain
        try:
            agent = get_content_agent(session_id)
            # agent.run(stream=True) ek python generator return karta hai
            response_stream = agent.run(content, stream=True)
            
            full_content = ""
            
            for chunk in response_stream:
                # Agar AI koi tool (Search) use kar raha hai toh uska event frontend ko bhejte hain
                if hasattr(chunk, 'tools') and chunk.tools:
                    for tool in chunk.tools:
                        yield f"data: {json.dumps({'event': 'tool_start', 'tool': tool.name, 'session_id': session_id})}\n\n"
                        await asyncio.sleep(0.1)
                
                # Naye tokens ko full_content buffer mein add kar rahe hain
                if hasattr(chunk, 'content') and chunk.content:
                    full_content += chunk.content
                    yield f"data: {json.dumps({'event': 'content', 'delta': chunk.content, 'session_id': session_id})}\n\n"
                
                # AI provider ke variations handle kar rahe hain chunk structure mein
                elif hasattr(chunk, 'run_response') and chunk.run_response.content:
                    full_content += chunk.run_response.content
                    yield f"data: {json.dumps({'event': 'content', 'delta': chunk.run_response.content, 'session_id': session_id})}\n\n"
                
                await asyncio.sleep(0.01) # UI ko thoda saas lene ka waqt de rahe hain

            # 4. Pure content ko ek sath last mein save karte hain DB performance ke liye
            assistant_msg = await self.repository.add_message(uuid.UUID(session_id), "assistant", full_content)
            
            # Frontend ko bata rahe hain ke streaming khatam ho gayi
            yield f"data: {json.dumps({
                'event': 'done', 
                'session_id': session_id, 
                'message': {
                    'id': str(assistant_msg.id),
                    'role': 'assistant',
                    'content': full_content,
                    'timestamp': assistant_msg.created_at.isoformat()
                }
            })}\n\n"

        except Exception as e:
            # Agar beech mein koi accident ho jaye toh error event bhejte hain
            logger.error(f"Streaming error in service: {e}")
            yield f"data: {json.dumps({'event': 'error', 'message': str(e), 'session_id': session_id})}\n\n"
