from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings
from app.core.logging import logger

def normalize_db_url(url: str) -> str:
    if url.startswith("sqlite://"):
        return url.replace("sqlite://", "sqlite+aiosqlite://")
    if url.startswith("postgres://"):
        url = "postgresql+asyncpg://" + url[11:]
    elif url.startswith("postgresql://") and not url.startswith("postgresql+"):
        url = "postgresql+asyncpg://" + url[13:]
    
    if "sslmode=" in url:
        url = url.replace("sslmode=", "ssl=")
    if "&channel_binding=" in url:
        url = url.split("&channel_binding=")[0]
    elif "?channel_binding=" in url:
        url = url.split("?channel_binding=")[0]
    return url

db_url = normalize_db_url(settings.DATABASE_URL)

engine = create_async_engine(
    db_url,
    echo=settings.LOG_LEVEL.upper() == "DEBUG",
    future=True,
    pool_pre_ping=True if "postgresql" in db_url else False
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

class Base(DeclarativeBase):
    pass

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception as e:
            await session.rollback()
            logger.error(f"Database session rollback due to error: {e}")
            raise
        finally:
            await session.close()
