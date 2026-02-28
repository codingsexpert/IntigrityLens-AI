# backend/database.py
# ─────────────────────────────────────────────
# MUKESH'S FILE
#
# Sets up the SQLite database connection using SQLAlchemy.
# Defines the ONE table we need: "events"
#
# SQLite is a single file (integritylens.db) — no server
# needed, perfect for a hackathon.
# ─────────────────────────────────────────────
from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime
import os

# ── Database file path
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./integritylens.db")

# ── Create the async engine (async = non-blocking, good for FastAPI)
engine = create_async_engine(
    DATABASE_URL,
    echo=False,           # set True to see every SQL query in terminal
    connect_args={"check_same_thread": False}
)

# ── Session factory — use this to get a DB session in route handlers
AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# ── Base class for all models
Base = declarative_base()


# ══════════════════════════════════════
# DATABASE TABLE: events
# One row per proctoring event
# ══════════════════════════════════════
class EventModel(Base):
    __tablename__ = "events"

    id          = Column(Integer, primary_key=True, index=True)
    session_id  = Column(String, index=True)        # e.g. "IL-2026-00342"
    event_type  = Column(String)                     # "TAB_SWITCH", "GAZE_DEVIATION" etc
    severity    = Column(String)                     # "LOW", "MEDIUM", "HIGH"
    confidence  = Column(Float)                      # 0.0 to 1.0
    duration    = Column(Integer, default=1)         # seconds
    label       = Column(String)                     # human readable description
    timestamp   = Column(String)                     # exam time e.g "04:32"
    created_at  = Column(DateTime, default=datetime.utcnow)


# ══════════════════════════════════════
# DATABASE TABLE: sessions
# One row per exam session
# ══════════════════════════════════════
class SessionModel(Base):
    __tablename__ = "sessions"

    id             = Column(Integer, primary_key=True, index=True)
    session_id     = Column(String, unique=True, index=True)
    candidate_name = Column(String, default="Mukesh R.")
    exam_name      = Column(String, default="CS-401 Algorithms")
    risk_score     = Column(Integer, default=0)
    started_at     = Column(DateTime, default=datetime.utcnow)
    finished_at    = Column(DateTime, nullable=True)


# ── Create all tables on startup
async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Database tables created")


# ── Dependency injection helper
# Use this in route handlers:  db: AsyncSession = Depends(get_db)
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
