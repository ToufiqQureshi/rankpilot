
import os
from sqlalchemy import create_engine, text
from agno.db.postgres import PostgresDb
from agno.db.sqlite import SqliteDb
from agno.tracing import setup_tracing
from dotenv import load_dotenv

load_dotenv()

# Database setup (Chef ki memory book)
db_url = os.getenv("DATABASE_URL", "postgresql+psycopg://ai:ai@localhost:5532/ai")

# Agno Agent DB Memory
db = PostgresDb(db_url=db_url, session_table="agent_sessions")

# Dedicated Engine for Custom Tables (Auth, Users)
auth_engine = create_engine(db_url)

# Tracing Setup (Observability)
tracing_db = SqliteDb(db_file="tmp/traces.db")
setup_tracing(db=tracing_db)
print("✅ Agent Tracing Enabled (tmp/traces.db)")

def init_custom_tables():
    """
    Checks and creates necessary tables 'users' and 'chat_titles' if they don't exist.
    """
    try:
        with auth_engine.connect() as conn:
            # Users Table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    full_name VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """))
            
            # Chat Titles Table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS chat_titles (
                    session_id VARCHAR(255) PRIMARY KEY,
                    user_id VARCHAR(255) NOT NULL,
                    title TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """))
            
            # --- NEW TABLES INITIALIZATION ---
            # We are using raw SQL here to ensure tables exist without full migration tool yet
            # Ideally usage of Alembic is recommended for production.
            
            # Chats
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS chats (
                    id VARCHAR(255) PRIMARY KEY,
                    user_id_str VARCHAR(255),
                    title TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """))

            # Messages
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS chat_messages (
                    id SERIAL PRIMARY KEY,
                    chat_id VARCHAR(255) NOT NULL,
                    role VARCHAR(50) NOT NULL,
                    content TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    meta JSONB DEFAULT '{}'::jsonb,
                    FOREIGN KEY (chat_id) REFERENCES chats(id)
                );
            """))

            # Tasks
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS tasks (
                    id VARCHAR(255) PRIMARY KEY,
                    chat_id VARCHAR(255) NOT NULL,
                    type VARCHAR(100) NOT NULL,
                    status VARCHAR(50) DEFAULT 'pending',
                    result JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (chat_id) REFERENCES chats(id)
                );
            """))

            # Brand Voices
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS brand_voices (
                    id VARCHAR(255) PRIMARY KEY,
                    user_id VARCHAR(255),
                    name VARCHAR(255) NOT NULL,
                    description VARCHAR(255),
                    system_prompt TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """))

            # Campaigns
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS campaigns (
                    id VARCHAR(255) PRIMARY KEY,
                    user_id VARCHAR(255),
                    name VARCHAR(255) NOT NULL,
                    description VARCHAR(255),
                    status VARCHAR(50) DEFAULT 'active',
                    start_date TIMESTAMP,
                    end_date TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """))

            # Posts
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS posts (
                    id VARCHAR(255) PRIMARY KEY,
                    campaign_id VARCHAR(255) REFERENCES campaigns(id) ON DELETE CASCADE,
                    content TEXT NOT NULL,
                    platform VARCHAR(50) DEFAULT 'linkedin',
                    scheduled_date TIMESTAMP,
                    status VARCHAR(50) DEFAULT 'draft',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """))
            # ---------------------------------
            
            conn.commit()
            print("Custom tables (users, chat_titles, chats, chat_messages, tasks) checked/created.")
    except Exception as e:
        print(f"Error initializing custom tables: {e}")
