
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.core.db import init_custom_tables

# Import Routers
from backend.api.routes import auth, chat, history, brand_voice

# App Init
app = FastAPI(title="Unified Content Agent API")

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"], # Explicitly allow frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup Event: DB Check
@app.on_event("startup")
def on_startup():
    init_custom_tables()

# Register Routes
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(history.router)
app.include_router(brand_voice.router)
from backend.api.routes import editor
app.include_router(editor.router)
from backend.api.routes import campaigns
app.include_router(campaigns.router)
from backend.api.routes import tasks
app.include_router(tasks.router)

# Health Check
@app.get("/")
def read_root():
    return {"message": "Content Creation Agent API is Running", "status": "active"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
