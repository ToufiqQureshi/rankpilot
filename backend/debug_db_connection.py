
import os
import signal
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import time

# Timeout handler
def handler(signum, frame):
    raise TimeoutError("Connection timed out!")

# Windows doesn't support signal.alarm, so we use a different approach or just print progress
# For simplicity on Windows, we'll just print checkpoints.

load_dotenv()
db_url = os.getenv("DATABASE_URL", "postgresql+psycopg://ai:ai@localhost:5532/ai")
print(f"Target DB URL: {db_url}")

try:
    print("1. Creating engine...")
    engine = create_engine(db_url, connect_args={'connect_timeout': 5})
    
    print("2. Connecting to DB (Timeout 5s)...")
    with engine.connect() as conn:
        print("3. Connection Successful!")
        print("4. Executing simple query...")
        result = conn.execute(text("SELECT 1")).scalar()
        print(f"5. Query Result: {result}")
        
except Exception as e:
    print(f"❌ ERROR: {e}")
