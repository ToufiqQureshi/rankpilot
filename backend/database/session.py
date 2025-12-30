"""
FILE PURPOSE:
- Ye file SQLAlchemy ke through database connection aur session management handle karti hai.
- Async database calls ke liye 'Engine' aur 'SessionLocal' yahan define hote hain.

CONNECTED FILES:
- backend/config.py: DATABASE_URL lene ke liye.
- backend/database/models.py: Tables create karne ke liye (Metadata).
- backend/routers/chat.py: API endpoints mein database session inject karne ke liye.

CHANGE IMPACT:
- Agar yahan pool settings ya driver change kiya toh DB performance aur connectivity affect hogi.
- Pura app ka persistent state isi connectivity pe depend karta hai.

FLOW POSITION:
- Backend services aur routers database use karne se pehle yahan se session lete hain.

DEPENDENCY IMPACT:
- Direct dependencies: sqlalchemy, asyncpg, config.py
- Indirect dependencies: All CRUD operations in ChatRepository
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from config import settings

# Async Database URL fetch kar rahe hain settings se
async_db_url = settings.DATABASE_URL

# Async Engine create ho raha hai (Non-blocking DB connection)
# Pool size 20 rakha hai takay multiple concurrent requests handle ho sakein
engine = create_async_engine(
    async_db_url,
    echo=False,  # SQL logging off rakhi hai production clarity ke liye
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True # Connection stale hone se pehle check karta hai
)

# Har request ke liye naya session banane wala factory function
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Ye dependency hai jo FastAPI endpoints mein inject hoti hai
async def get_db():
    """Ye function har request pe ek fresh DB session deta hai aur baad mein close karta hai"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

# Startup pe tables automatically banane ke liye utility function
async def create_tables():
    """Saari defined SQLAlchemy models/tables database mein create karta hai"""
    from database.models import Base
    async with engine.begin() as conn:
        # Base.metadata saari tables ki information hold karta hai
        await conn.run_sync(Base.metadata.create_all)
