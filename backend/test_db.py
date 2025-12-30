import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from config import settings

async def test_conn():
    url = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
    print(f"Testing connection to: {url}")
    try:
        engine = create_async_engine(url)
        async with engine.connect() as conn:
            print("Successfully connected!")
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_conn())
