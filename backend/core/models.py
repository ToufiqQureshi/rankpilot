from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    chats = relationship("Chat", back_populates="user")

class Chat(Base):
    __tablename__ = 'chats'
    
    id = Column(String(255), primary_key=True) # UUID
    user_id = Column(Integer, ForeignKey('users.id')) # Use numeric ID if User uses numeric, or string if Auth uses string. 
    # NOTE: The existing schema had users.id as SERIAL (Integer). 
    # But API requests use email as user_id often. 
    # Let's align: The auth_engine used create_engine locally. 
    # We will assume user_id is a string (email) for now based on current logic, 
    # OR we need to map email to ID.
    # Looking at `routes/chat.py`, `request.user_id` is passed. In `App.jsx`, it's email.
    # So `user_id` here should probably be String for now to match `api` usage,
    # OR we strictly enforce the Foreign Key to the `users` table which has `id` (int) and `email` (str).
    # To keep it simple and robust with existing auth:
    user_id_str = Column(String(255), index=True) # Storing email/auth_id directly
    
    title = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    messages = relationship("Message", back_populates="chat", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="chat", cascade="all, delete-orphan")
    
    # Optional: Relationship to User table if we want to enforce FK
    # user = relationship("User", back_populates="chats") 

class Message(Base):
    __tablename__ = 'chat_messages'
    
    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(String(255), ForeignKey('chats.id'), nullable=False)
    role = Column(String(50), nullable=False) # 'user', 'assistant'
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Extra metadata for UI (optional, but good for "isSearching" etc if persisted)
    meta = Column(JSON, default={}) 
    
    chat = relationship("Chat", back_populates="messages")

class Task(Base):
    __tablename__ = 'tasks'
    
    id = Column(String(255), primary_key=True)
    chat_id = Column(String(255), ForeignKey('chats.id'), nullable=False)
    type = Column(String(100), nullable=False) # 'research', 'generate', etc.
    status = Column(String(50), default='pending') # pending, running, completed, failed
    result = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    chat = relationship("Chat", back_populates="tasks")

class BrandVoice(Base):
    __tablename__ = 'brand_voices'

    id = Column(String(255), primary_key=True)
    user_id = Column(String(255), index=True)
    name = Column(String(255), nullable=False)
    description = Column(String(255), nullable=True)
    system_prompt = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Campaign(Base):
    __tablename__ = 'campaigns'

    id = Column(String(255), primary_key=True)
    user_id = Column(String(255), index=True)
    name = Column(String(255), nullable=False)
    description = Column(String(255), nullable=True)
    status = Column(String(50), default='active') # active, archived
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    posts = relationship("Post", back_populates="campaign", cascade="all, delete-orphan")

class Post(Base):
    __tablename__ = 'posts'

    id = Column(String(255), primary_key=True)
    campaign_id = Column(String(255), ForeignKey('campaigns.id'), nullable=False)
    content = Column(Text, nullable=False)
    platform = Column(String(50), default='linkedin') # linkedin, twitter, etc
    scheduled_date = Column(DateTime, nullable=True)
    status = Column(String(50), default='draft') # draft, scheduled, published
    created_at = Column(DateTime, default=datetime.utcnow)

    campaign = relationship("Campaign", back_populates="posts")
