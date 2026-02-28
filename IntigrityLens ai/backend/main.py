# backend/main.py
# ─────────────────────────────────────────────
# MUKESH'S FILE — THE MAIN ENTRY POINT
#
# This is the file you run to start the server:
#   uvicorn main:app --reload
#
# It:
#   1. Creates the FastAPI app
#   2. Adds CORS so frontend can talk to it
#   3. Connects all route files
#   4. Creates database tables on startup
# ─────────────────────────────────────────────
from fastapi             import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib          import asynccontextmanager
from dotenv              import load_dotenv
from database            import create_tables
from routes              import events, report, exam
import os

# Load .env file
load_dotenv()


# ── Startup/shutdown lifecycle
@asynccontextmanager
async def lifespan(app: FastAPI):
    # On startup — create database tables if they don't exist
    print("🚀 IntegrityLens AI Backend starting...")
    await create_tables()
    print("✅ Ready at http://localhost:8000")
    print("📖 API docs at http://localhost:8000/docs")
    yield
    # On shutdown
    print("👋 Server shutting down")


# ── Create the FastAPI app
app = FastAPI(
    title       = "IntegrityLens AI — Proctoring Backend",
    description = "AI-powered proctoring platform by Team Coding's Expert — BUILDX 2026",
    version     = "1.0.0",
    lifespan    = lifespan,
)


# ── CORS middleware
# This MUST be added so the React frontend (port 5173)
# can call this backend (port 8000) without browser errors.
app.add_middleware(
    CORSMiddleware,
    allow_origins  = ["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods  = ["*"],
    allow_headers  = ["*"],
)


# ── Register all routes
# All routes will be prefixed with nothing here because
# Vite proxies /api → localhost:8000
# So frontend calls /api/log-event → hits /log-event here
app.include_router(events.router, tags=["Events"])
app.include_router(report.router, tags=["Report"])
app.include_router(exam.router,   tags=["Exam"])


# ── Health check endpoint
@app.get("/", tags=["Health"])
async def root():
    return {
        "status":  "running",
        "service": "IntegrityLens AI Backend",
        "team":    "Coding's Expert — BUILDX 2026",
        "docs":    "/docs",
    }

@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok"}
