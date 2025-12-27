import uuid
from fastapi import APIRouter
from sqlalchemy import text
from pydantic import BaseModel
from backend.core.db import auth_engine
from datetime import datetime

router = APIRouter(prefix="/api/brand-voices", tags=["Brand Voice"])

class BrandVoiceCreate(BaseModel):
    user_id: str
    name: str
    description: str | None = None
    system_prompt: str

@router.post("/")
async def create_brand_voice(voice: BrandVoiceCreate):
    voice_id = str(uuid.uuid4())
    try:
        with auth_engine.connect() as conn:
            conn.execute(text("""
                INSERT INTO brand_voices (id, user_id, name, description, system_prompt, created_at)
                VALUES (:id, :uid, :name, :desc, :prompt, :created)
            """), {
                "id": voice_id,
                "uid": voice.user_id,
                "name": voice.name,
                "desc": voice.description,
                "prompt": voice.system_prompt,
                "created": datetime.utcnow()
            })
            conn.commit()
            return {"success": True, "id": voice_id}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.get("/{user_id}")
async def get_brand_voices(user_id: str):
    try:
        with auth_engine.connect() as conn:
            result = conn.execute(text("""
                SELECT id, name, description, system_prompt 
                FROM brand_voices 
                WHERE user_id = :uid 
                ORDER BY created_at DESC
            """), {"uid": user_id}).fetchall()
            
            voices = [
                {
                    "id": row[0],
                    "name": row[1],
                    "description": row[2],
                    "system_prompt": row[3]
                }
                for row in result
            ]
            return {"success": True, "voices": voices}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.delete("/{voice_id}")
async def delete_brand_voice(voice_id: str):
    try:
        with auth_engine.connect() as conn:
            conn.execute(text("DELETE FROM brand_voices WHERE id = :vid"), {"vid": voice_id})
            conn.commit()
            return {"success": True, "message": "Deleted successfully"}
    except Exception as e:
        return {"success": False, "error": str(e)}
