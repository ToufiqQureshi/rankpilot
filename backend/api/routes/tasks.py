from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.core.db import auth_engine
from backend.core.celery_app import celery_app
from celery.result import AsyncResult

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])

@router.get("/{task_id}")
def get_task_status(task_id: str):
    task_result = AsyncResult(task_id, app=celery_app)
    
    response = {
        "task_id": task_id,
        "status": task_result.status,
        "result": task_result.result if task_result.ready() else None
    }
    return response
