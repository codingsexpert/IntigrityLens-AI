# backend/schemas.py
# ─────────────────────────────────────────────
# MUKESH'S FILE
#
# Pydantic schemas — these define the SHAPE of data
# that comes IN from the frontend and goes OUT in responses.
#
# FastAPI uses these to:
#   1. Automatically validate incoming JSON
#   2. Auto-generate API documentation at /docs
#   3. Return properly shaped responses
# ─────────────────────────────────────────────
from pydantic import BaseModel, Field
from typing   import Optional, List
from datetime import datetime


# ══════════════════════════════════════
# INCOMING: What the frontend sends us
# ══════════════════════════════════════

class EventIn(BaseModel):
    """
    Shape of a proctoring event from the frontend.
    Called when Chanchal's hooks detect a violation.
    """
    session_id  : str   = "IL-2026-00342"
    event_type  : str                           # "TAB_SWITCH" | "GAZE_DEVIATION" | etc
    severity    : str                           # "LOW" | "MEDIUM" | "HIGH"
    confidence  : float = Field(ge=0.0, le=1.0)# must be between 0 and 1
    duration    : int   = 1                     # seconds
    label       : str   = ""                   # human readable
    timestamp   : str   = ""                   # exam elapsed time e.g "04:32"

    class Config:
        # Allow extra fields from frontend without crashing
        extra = "ignore"


class SessionIn(BaseModel):
    """Start a new exam session."""
    session_id     : str
    candidate_name : str = "Mukesh R."
    exam_name      : str = "CS-401 Algorithms"


# ══════════════════════════════════════
# OUTGOING: What we send back
# ══════════════════════════════════════

class EventOut(BaseModel):
    """A single event returned in reports."""
    id          : int
    session_id  : str
    event_type  : str
    severity    : str
    confidence  : float
    duration    : int
    label       : str
    timestamp   : str
    created_at  : datetime

    class Config:
        from_attributes = True   # allows reading from SQLAlchemy models


class ReportOut(BaseModel):
    """Full exam report — returned by GET /report/{session_id}"""
    session_id     : str
    candidate_name : str
    exam_name      : str
    risk_score     : int
    verdict        : str        # "CLEAR" | "REVIEW" | "FLAGGED"
    total_events   : int
    events         : List[EventOut]
    breakdown      : dict       # count per event type


class LogEventResponse(BaseModel):
    """Response after logging an event."""
    status      : str
    event_id    : int
    new_score   : int
    total_events: int


class QuestionOut(BaseModel):
    """A single exam question."""
    id      : str
    text    : str
    options : List[str]
    answer  : str
