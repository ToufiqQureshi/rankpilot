from fastapi import APIRouter
from sqlalchemy import text
from backend.core.db import auth_engine

router = APIRouter(prefix="/api", tags=["History"])

@router.get("/sessions/{user_id}")
async def get_user_sessions(user_id: str):
    """
    Fetch user chat sessions from 'chats' table.
    """
    try:
        with auth_engine.connect() as conn:
            # Query the new 'chats' table
            query = text("""
                SELECT id, title, created_at
                FROM chats
                WHERE user_id_str = :uid
                ORDER BY created_at DESC
            """)
            result = conn.execute(query, {"uid": user_id})
            
            sessions = [{"session_id": row[0], "title": row[1]} for row in result]
            
        return {"sessions": sessions}
    except Exception as e:
        print(f"Error fetching sessions: {e}")
        return {"sessions": [], "error": str(e)}

@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    try:
        with auth_engine.connect() as conn:
            # Cascading delete is handled in DB if configured, but let's be explicit and safe
            conn.execute(text("DELETE FROM chat_messages WHERE chat_id = :sid"), {"sid": session_id})
            conn.execute(text("DELETE FROM tasks WHERE chat_id = :sid"), {"sid": session_id})
            conn.execute(text("DELETE FROM chats WHERE id = :sid"), {"sid": session_id})
            
            # Also clean up old tables just in case
            conn.execute(text("DELETE FROM agent_sessions WHERE session_id = :sid"), {"sid": session_id})
            conn.execute(text("DELETE FROM chat_titles WHERE session_id = :sid"), {"sid": session_id})
            
            conn.commit()
        return {"status": "success", "message": f"Session {session_id} deleted"}
    except Exception as e:
        print(f"Error deleting session: {e}")
        return {"status": "error", "message": str(e)}

@router.get("/history/{session_id}")
async def get_history(session_id: str):
    """
    Fetch persistent chat history from 'chat_messages'.
    """
    try:
        history = []
        with auth_engine.connect() as conn:
            query = text("""
                SELECT id, role, content, meta 
                FROM chat_messages 
                WHERE chat_id = :sid 
                ORDER BY id ASC
            """)
            result = conn.execute(query, {"sid": session_id})
            
            for row in result:
                history.append({
                    "id": row[0],
                    "role": row[1],
                    "content": row[2],
                    "isLoading": False
                })
                            
        return {"history": history}
    except Exception as e:
        print(f"Error fetching history: {e}")
        return {"history": [], "error": str(e)}
