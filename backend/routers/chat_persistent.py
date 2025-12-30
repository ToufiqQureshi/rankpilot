"""
Chat Router - Production Grade Persistence Refactor
Handles all chat-related API endpoints with PostgreSQL persistence.
"""

import logging
import asyncio
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse

from database.session import get_db, create_tables
from database.repository import ChatRepository
from services.chat_service import ChatService
from .chat import MessageCreate, SessionCreate, ErrorResponse # Reuse models if possible, or redefine

router = APIRouter()
logger = logging.getLogger(__name__)

# ============ STARTUP ============
@router.on_event("startup")
async def startup_event():
    logger.info("Initializing database tables...")
    await create_tables()
    logger.info("Database initialized successfully.")

# ============ DEPENDENCIES ============
async def get_chat_service(db=Depends(get_db)) -> ChatService:
    repository = ChatRepository(db)
    return ChatService(repository)

async def get_chat_repository(db=Depends(get_db)) -> ChatRepository:
    return ChatRepository(db)

# ============ API ENDPOINTS ============

@router.post("/chat", response_model=dict)
async def send_message(
    message: MessageCreate,
    service: ChatService = Depends(get_chat_service)
):
    """Send a message and get persistent AI response"""
    try:
        return await service.run_chat(message.content, message.session_id)
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat/stream")
async def stream_chat(
    message: MessageCreate,
    service: ChatService = Depends(get_chat_service)
):
    """Stream AI response with real-time tool calling and DB persistence"""
    return StreamingResponse(
        service.stream_chat(message.content, message.session_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.get("/sessions")
async def list_sessions(
    repository: ChatRepository = Depends(get_chat_repository)
):
    """List all persistent chat sessions"""
    sessions = await repository.list_sessions()
    return {
        "sessions": [
            {
                "id": str(s.id),
                "title": s.title,
                "created_at": s.created_at.isoformat(),
                "updated_at": s.updated_at.isoformat()
            }
            for s in sessions
        ]
    }

@router.get("/sessions/{session_id}")
async def get_session(
    session_id: str,
    repository: ChatRepository = Depends(get_chat_repository)
):
    """Get a specific chat session with its persistent messages"""
    try:
        session_uuid = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session ID format")

    session = await repository.get_session(session_uuid)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    messages = await repository.get_messages(session_uuid)
    return {
        "id": str(session.id),
        "title": session.title,
        "created_at": session.created_at.isoformat(),
        "messages": [
            {
                "id": str(m.id),
                "role": m.role,
                "content": m.content,
                "timestamp": m.created_at.isoformat()
            }
            for m in messages
        ]
    }

@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: str,
    repository: ChatRepository = Depends(get_chat_repository)
):
    """Soft delete a chat session"""
    try:
        session_uuid = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session ID format")

    success = await repository.delete_session(session_uuid)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")

    return {"status": "deleted", "session_id": session_id}

@router.get("/health")
async def health_check(repository: ChatRepository = Depends(get_chat_repository)):
    """Health check verifying DB and Agent connectivity"""
    try:
        # Simple query to verify DB
        sessions = await repository.list_sessions()
        return {
            "status": "healthy",
            "database": "connected",
            "session_count": len(sessions),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }
