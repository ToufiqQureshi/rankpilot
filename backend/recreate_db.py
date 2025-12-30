import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from database.models import Base
from config import settings

async def recreate_tables():
    print(f"Connecting to {settings.DATABASE_URL}...")
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    
    async with engine.begin() as conn:
        print("Dropping existing tables...")
        await conn.run_sync(Base.metadata.drop_all)
        print("Creating new tables...")
        await conn.run_sync(Base.metadata.create_all)
    
    await engine.dispose()
    print("Database schema recreated successfully!")

if __name__ == "__main__":
    asyncio.run(recreate_tables())
