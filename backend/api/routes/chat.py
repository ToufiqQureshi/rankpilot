import uuid
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from sqlalchemy import text
import json
from backend.core.agent.agent_config import create_agent
from backend.core.db import auth_engine
from backend.core.schemas import ChatRequest

router = APIRouter(prefix="/api", tags=["Chat"])

from backend.core.celery_app import celery_app
from backend.worker import test_task # In future, this will be generate_task

def get_brand_voice_prompt(voice_id: str) -> str | None:
    try:
        with auth_engine.connect() as conn:
            result = conn.execute(text("SELECT system_prompt FROM brand_voices WHERE id = :vid"), {"vid": voice_id}).fetchone()
            return result[0] if result else None
    except Exception:
        return None

@router.post("/chat/async")
def chat_async(request: ChatRequest):
    """
    Triggers a background generation task.
    Returns a task_id immediately.
    """
    # 0. Get Brand Voice (if any)
    system_prompt = None
    if request.brand_voice_id:
        system_prompt = get_brand_voice_prompt(request.brand_voice_id)

    # Trigger Celery Task (Passing system_prompt if needed)
    # Note: We need to update the worker task to accept system_prompt
    task = test_task.delay(request.message) # TODO: Pass system_prompt
    
    return {"task_id": task.id, "status": "processing"}





@router.post("/chat")
def chat_endpoint(request: ChatRequest):
    chat_id = request.session_id
    user_id = request.user_id # Email in our case
    
    # 1. Ensure Chat Exists in New DB
    try:
        with auth_engine.connect() as conn:
            # Check if chat exists
            exists = conn.execute(text("SELECT 1 FROM chats WHERE id = :cid"), {"cid": chat_id}).fetchone()
            
            if not exists:
                # Generate Title
                title_words = request.message.split()
                generated_title = " ".join(title_words[:6])
                if len(title_words) > 6: generated_title += "..."
                
                conn.execute(text("""
                    INSERT INTO chats (id, user_id_str, title) VALUES (:cid, :uid, :title)
                """), {"cid": chat_id, "uid": user_id, "title": generated_title})
                conn.commit()
            
            # 2. Persist USER Message
            conn.execute(text("""
                INSERT INTO chat_messages (chat_id, role, content) 
                VALUES (:cid, 'user', :content)
            """), {"cid": chat_id, "content": request.message})
            conn.commit()
            
    except Exception as e:
        print(f"DB Error (User Msg): {e}")

    # 3. Generator for Streaming Response + Persistence
    def event_generator():
        combined_response = ""
        
        # We might want to send the title if it was just created, but frontend usually handles list refresh.
        # Just in case:
        # yield json.dumps({"type": "title", "title": ...}) + "\n"
            
        try:
            import time
            start_time = time.time()
            # Create a fresh agent instance for this request to ensure thread safety and state isolation
            # Create a fresh agent instance for this request to ensure thread safety and state isolation
            agent = create_agent()
            
            # Inject Brand Voice if present
            if request.brand_voice_id:
                voice_prompt = get_brand_voice_prompt(request.brand_voice_id)
                if voice_prompt:
                    # We can prepend this to the message OR set it as agent instruction if supported.
                    # For Agno, we can often pass 'description' or update instructions.
                    # Or simpler: Prepend to user message as a "System Note".
                    # Better: If agent supports 'instruction', set it.
                    # Let's prepend to message for now for robust compatibility.
                    request.message = f"System Instruction: Adopt the following persona:\n{voice_prompt}\n\nUser Query: {request.message}"

            print(f"DEBUG: Agent creation took {time.time() - start_time:.4f}s")
            
            stream = agent.run(
                request.message, 
                stream=True, 
                stream_events=True, 
                session_id=chat_id, # Keeping this for agent context, even if we store manually
                user_id=user_id
            )
            print(f"DEBUG: Stream started after {time.time() - start_time:.4f}s")
            
            for chunk in stream:
                event_type = getattr(chunk, 'event', None)
                event_type_str = str(event_type)

                if event_type_str == "ToolCallStarted":
                    tool_data = getattr(chunk, 'tool', None)
                    yield json.dumps({
                        "type": "tool_start",
                        "tool": getattr(tool_data, 'tool_name', 'Unknown'),
                        "args": getattr(tool_data, 'tool_args', {})
                    }, default=str) + "\n"
                    continue

                elif event_type_str == "ToolCallCompleted":
                    tool_data = getattr(chunk, 'tool', None)
                    tool_result = getattr(tool_data, 'result', '')
                    
                    sources = []
                    try:
                        parsed_result = tool_result if isinstance(tool_result, (dict, list)) else json.loads(str(tool_result))
                        if isinstance(parsed_result, list): sources = parsed_result
                    except: pass

                    yield json.dumps({
                        "type": "tool_end",
                        "sources": sources
                    }, default=str) + "\n"
                    continue
                
                if hasattr(chunk, 'content') and chunk.content:
                    if event_type_str in ["RunResponse", "RunCompleted"]: continue
                    content_chunk = chunk.content
                    combined_response += content_chunk
                    yield json.dumps({
                        "type": "content", 
                        "content": content_chunk
                    }, default=str) + "\n"
            
            # 4. Persist ASSISTANT Message (Full Response)
            try:
                with auth_engine.connect() as conn:
                    conn.execute(text("""
                        INSERT INTO chat_messages (chat_id, role, content) 
                        VALUES (:cid, 'assistant', :content)
                    """), {"cid": chat_id, "content": combined_response})
                    conn.commit()
            except Exception as e:
                print(f"DB Error (Assistant Msg Persistence): {e}")
                yield json.dumps({"type": "error", "error": f"Persistence Failed: {e}"}) + "\n"

        except Exception as e:
            yield json.dumps({"type": "error", "error": str(e)}) + "\n"

    return StreamingResponse(event_generator(), media_type="application/x-ndjson")
