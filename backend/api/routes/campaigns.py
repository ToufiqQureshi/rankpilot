from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from typing import List, Optional
import uuid
from datetime import datetime
from backend.core.db import auth_engine

router = APIRouter(prefix="/api/campaigns", tags=["Campaigns"])

# Pydantic Models
class CampaignCreate(BaseModel):
    user_id: str
    name: str
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class PostCreate(BaseModel):
    campaign_id: str
    content: str
    platform: str = "linkedin"
    scheduled_date: Optional[datetime] = None

# Routes
@router.get("/{user_id}")
def get_campaigns(user_id: str):
    try:
        with auth_engine.connect() as conn:
            result = conn.execute(
                text("SELECT * FROM campaigns WHERE user_id = :uid ORDER BY created_at DESC"),
                {"uid": user_id}
            ).fetchall()
            
            campaigns = []
            for row in result:
                # Basic dict conversion
                campaigns.append({
                    "id": row.id,
                    "name": row.name,
                    "description": row.description,
                    "status": row.status,
                    "created_at": row.created_at
                })
            return {"success": True, "campaigns": campaigns}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.post("/")
def create_campaign(campaign: CampaignCreate):
    try:
        new_id = str(uuid.uuid4())
        with auth_engine.connect() as conn:
            conn.execute(text("""
                INSERT INTO campaigns (id, user_id, name, description, start_date, end_date)
                VALUES (:id, :uid, :name, :desc, :start, :end)
            """), {
                "id": new_id,
                "uid": campaign.user_id,
                "name": campaign.name,
                "desc": campaign.description,
                "start": campaign.start_date,
                "end": campaign.end_date
            })
            conn.commit()
        return {"success": True, "id": new_id}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.get("/{campaign_id}/posts")
def get_campaign_posts(campaign_id: str):
    try:
        with auth_engine.connect() as conn:
            result = conn.execute(
                text("SELECT * FROM posts WHERE campaign_id = :cid ORDER BY created_at DESC"),
                {"cid": campaign_id}
            ).fetchall()
            
            posts = []
            for row in result:
                posts.append({
                    "id": row.id,
                    "content": row.content,
                    "platform": row.platform,
                    "scheduled_date": row.scheduled_date,
                    "status": row.status
                })
            return {"success": True, "posts": posts}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.post("/posts")
def create_post(post: PostCreate):
    try:
        new_id = str(uuid.uuid4())
        with auth_engine.connect() as conn:
            conn.execute(text("""
                INSERT INTO posts (id, campaign_id, content, platform, scheduled_date, status)
                VALUES (:id, :cid, :content, :platform, :scheduled, :status)
            """), {
                "id": new_id,
                "cid": post.campaign_id,
                "content": post.content,
                "platform": post.platform,
                "scheduled": post.scheduled_date,
                "status": "draft"
            })
            conn.commit()
        return {"success": True, "id": new_id}
    except Exception as e:
        return {"success": False, "error": str(e)}
