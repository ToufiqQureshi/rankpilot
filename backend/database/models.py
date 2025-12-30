"""
FILE PURPOSE:
- Ye file database ki tables ka 'blueprint' ya 'schema' define karti hai.
- SQLAlchemy model classes yahan primary source of truth hain for DB structure.

CONNECTED FILES:
- backend/database/session.py: Tables create karne ke liye metadata use karta hai.
- backend/database/repository.py: In models ko queries mein use karta hai.

CHANGE IMPACT:
- Agar yahan koi column add/remove kiya toh database schema mismatch ho jayega.
- Manual recreation ya migration ki zarurat pad sakti hai.

FLOW POSITION:
- System ki foundation (Data Layer) hai. Jab message save hota hai, toh inhi models ka object banta hai.

DEPENDENCY IMPACT:
- Direct dependencies: sqlalchemy, postgresql dialect, uuid
- Indirect dependencies: Pura chat system persistence (Saving/Loading)
"""

import uuid
import os
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

# SQLAlchemy ki base class takay models register ho sakein
Base = declarative_base()

def get_utc_now():
    """Current time in UTC format return karta hai consistency ke liye"""
    return datetime.now(timezone.utc)

class ChatSession(Base):
    """
    Ek poore chat conversation ka container.
    - Title: Sidebar mein jo naam dikhta hai.
    - UUID: Har chat ki apni unique identity.
    """
    __tablename__ = "chat_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String, nullable=True, index=True) # Multitenancy ke liye
    title = Column(String(255), nullable=False, default="New Chat")
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)
    is_deleted = Column(Boolean, default=False, index=True) # Soft delete support

    # Relation setup: Ek session ke multiple messages ho sakte hain
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")

class ChatMessage(Base):
    """
    Har individual message (User ka ya AI ka).
    - Session ID: Ye batata hai ke message kis conversation ka part hai.
    - Role: User, Assistant (AI), ya System.
    """
    __tablename__ = "chat_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(50), nullable=False) # user, assistant, system
    content = Column(Text, nullable=False) # Actual message text
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    # Message ko uske session object se link karta hai
    session = relationship("ChatSession", back_populates="messages")
