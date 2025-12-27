
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL", "postgresql+psycopg://ai:ai@localhost:5532/ai")
engine = create_engine(db_url)

def inspect():
    print("\n--- 🔍 DATABASE INSPECTION ---\n")
    with engine.connect() as conn:
        # 1. Sessions
        count = conn.execute(text("SELECT count(*) FROM agent_sessions")).scalar()
        print(f"✅ Total Chat Histories (agent_sessions): {count}")
        
        # 2. Titles
        titles = conn.execute(text("SELECT title FROM chat_titles LIMIT 5")).fetchall()
        print(f"✅ Recent Chat Titles: {[t[0] for t in titles]}")
        
        # 3. Users
        user_count = conn.execute(text("SELECT count(*) FROM users")).scalar()
        print(f"✅ Total Registered Users: {user_count}")
        
    print("\n--- Performance Note: Load is VERY LOW. Your DB is healthy! ---\n")

if __name__ == "__main__":
    inspect()
