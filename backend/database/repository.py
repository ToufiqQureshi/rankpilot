"""
FILE PURPOSE:
- Ye file database operations (CRUD) handle karti hai.
- Business logic ko direct SQL queries se alag rakhti hai.

CONNECTED FILES:
- backend/database/models.py: Tables information lene ke liye.
- backend/services/chat_service.py: Ye repository ko use karta hai data fetch/save karne ke liye.

CHANGE IMPACT:
- Agar yahan koi query change ki toh multiple services/routes affect ho sakte hain.
- DB errors yahan se debug hote hain (Select/Insert issues).

FLOW POSITION:
- Service layer aur Database layer ke beech ka bridge hai.

DEPENDENCY IMPACT:
- Direct dependencies: sqlalchemy, database.models
- Indirect dependencies: Chat state persistence, session history loading
"""

from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from database.models import ChatSession, ChatMessage
import uuid
from datetime import datetime, timezone

class ChatRepository:
    """
    Database ki saari 'bat-cheet' (queries) ye class handle karti hai.
    Isko AsyncSession chahiye kaam karne ke liye.
    """
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_session(self, title: str, user_id: Optional[str] = None) -> ChatSession:
        """Naya chat session DB mein insert karta hai"""
        session = ChatSession(id=uuid.uuid4(), title=title, user_id=user_id)
        self.db.add(session)
        await self.db.commit()
        await self.db.refresh(session)
        return session

    async def get_session(self, session_id: uuid.UUID) -> Optional[ChatSession]:
        """ID ke basis pe session ki details nikaalta hai"""
        result = await self.db.execute(select(ChatSession).where(ChatSession.id == session_id, ChatSession.is_deleted == False))
        return result.scalars().first()

    async def list_sessions(self, user_id: Optional[str] = None) -> List[ChatSession]:
        """Saare active sessions ki list laata hai, latest wala sabse upar (updated_at desc)"""
        query = select(ChatSession).where(ChatSession.is_deleted == False)
        if user_id:
            query = query.where(ChatSession.user_id == user_id)
        query = query.order_by(ChatSession.updated_at.desc())
        result = await self.db.execute(query)
        return result.scalars().all()

    async def delete_session(self, session_id: uuid.UUID) -> bool:
        """Session ko delete nahi karta, bas 'is_deleted' flag true kar deta hai (Soft Delete)"""
        await self.db.execute(
            update(ChatSession)
            .where(ChatSession.id == session_id)
            .values(is_deleted=True)
        )
        await self.db.commit()
        return True

    async def add_message(self, session_id: uuid.UUID, role: str, content: str) -> ChatMessage:
        """Kise bhi session mein naya message (User/AI) save karta hai"""
        message = ChatMessage(id=uuid.uuid4(), session_id=session_id, role=role, content=content)
        self.db.add(message)
        
        # Session ka updated_at timestamp bhi update kar rahe hain takay wo list mein upar aa jaye
        await self.db.execute(
            update(ChatSession)
            .where(ChatSession.id == session_id)
            .values(updated_at=datetime.now(timezone.utc))
        )
        
        await self.db.commit()
        await self.db.refresh(message)
        return message

    async def get_messages(self, session_id: uuid.UUID, limit: int = 20) -> List[ChatMessage]:
        """Ek session ke purane messages laata hai context ke liye"""
        query = (
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.asc())
        )
        result = await self.db.execute(query)
        messages = result.scalars().all()
        # Sirf last N messages return karte hain limit ke basis pe
        return messages[-limit:] if limit else messages
