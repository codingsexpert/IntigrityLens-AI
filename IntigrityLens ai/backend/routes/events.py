# backend/routes/events.py
# ─────────────────────────────────────────────
# MUKESH'S FILE
#
# Handles all proctoring event API endpoints.
#
# Endpoints:
#   POST /log-event          — save one event from frontend
#   GET  /events/{session_id} — get all events for a session
#   DELETE /events/{session_id} — clear events (for testing)
# ─────────────────────────────────────────────
from fastapi             import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy          import select, delete
from database            import get_db, EventModel, SessionModel
from schemas             import EventIn, LogEventResponse
from services.risk_engine import calculate_increment, get_verdict

router = APIRouter()


# ══════════════════════════════════════
# POST /log-event
# Called by frontend every time a violation is detected.
# ══════════════════════════════════════
@router.post("/log-event", response_model=LogEventResponse)
async def log_event(event: EventIn, db: AsyncSession = Depends(get_db)):
    """
    Save a proctoring event and update the session risk score.

    The frontend (Exam.jsx → api.js) calls this automatically
    whenever Chanchal's hooks detect a violation.
    """

    # ── Save the event to database
    new_event = EventModel(
        session_id  = event.session_id,
        event_type  = event.event_type,
        severity    = event.severity,
        confidence  = event.confidence,
        duration    = event.duration,
        label       = event.label,
        timestamp   = event.timestamp,
    )
    db.add(new_event)

    # ── Update the session's risk score
    # First, find or create the session
    result  = await db.execute(
        select(SessionModel).where(SessionModel.session_id == event.session_id)
    )
    session = result.scalar_one_or_none()

    if not session:
        # Create session on first event
        session = SessionModel(session_id=event.session_id)
        db.add(session)

    # Calculate score increment using risk formula
    increment = calculate_increment(
        event.event_type,
        event.severity,
        event.confidence,
        event.duration
    )
    session.risk_score = min(100, round(session.risk_score + increment))

    await db.commit()
    await db.refresh(new_event)

    # Count total events for this session
    count_result = await db.execute(
        select(EventModel).where(EventModel.session_id == event.session_id)
    )
    total = len(count_result.scalars().all())

    print(f"📝 Event logged: {event.event_type} | Score: {session.risk_score} | Session: {event.session_id}")

    return LogEventResponse(
        status       = "logged",
        event_id     = new_event.id,
        new_score    = session.risk_score,
        total_events = total
    )


# ══════════════════════════════════════
# GET /events/{session_id}
# Get all events for a specific session.
# ══════════════════════════════════════
@router.get("/events/{session_id}")
async def get_events(session_id: str, db: AsyncSession = Depends(get_db)):
    """Return all events for a session, ordered by creation time."""
    result = await db.execute(
        select(EventModel)
        .where(EventModel.session_id == session_id)
        .order_by(EventModel.created_at)
    )
    events = result.scalars().all()
    return {"session_id": session_id, "events": events, "count": len(events)}


# ══════════════════════════════════════
# DELETE /events/{session_id}
# Clear all events — useful for testing / new exam run.
# ══════════════════════════════════════
@router.delete("/events/{session_id}")
async def clear_events(session_id: str, db: AsyncSession = Depends(get_db)):
    """Delete all events for a session. Use for resetting during testing."""
    await db.execute(
        delete(EventModel).where(EventModel.session_id == session_id)
    )
    # Also reset the risk score
    result  = await db.execute(
        select(SessionModel).where(SessionModel.session_id == session_id)
    )
    session = result.scalar_one_or_none()
    if session:
        session.risk_score = 0

    await db.commit()
    return {"status": "cleared", "session_id": session_id}
