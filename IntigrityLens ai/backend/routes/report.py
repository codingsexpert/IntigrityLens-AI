# backend/routes/report.py
# ─────────────────────────────────────────────
# MUKESH'S FILE
#
# Handles report generation endpoints.
#
# Endpoints:
#   GET /report/{session_id}      — JSON report data
#   GET /report/{session_id}/pdf  — download PDF report
# ─────────────────────────────────────────────
from fastapi                  import APIRouter, Depends, HTTPException
from fastapi.responses        import StreamingResponse
from sqlalchemy.ext.asyncio   import AsyncSession
from sqlalchemy               import select
from database                 import get_db, EventModel, SessionModel
from schemas                  import ReportOut
from services.risk_engine     import calculate_total_score, get_verdict, get_breakdown
from services.report_generator import generate_pdf_report

router = APIRouter()


# ══════════════════════════════════════
# GET /report/{session_id}
# Returns JSON report used by the Report page.
# ══════════════════════════════════════
@router.get("/report/{session_id}", response_model=ReportOut)
async def get_report(session_id: str, db: AsyncSession = Depends(get_db)):
    """
    Get the complete exam report for a session.
    Called by Report.jsx to display the final audit.
    """

    # ── Fetch session info
    sess_result = await db.execute(
        select(SessionModel).where(SessionModel.session_id == session_id)
    )
    session = sess_result.scalar_one_or_none()

    # ── Fetch all events
    ev_result = await db.execute(
        select(EventModel)
        .where(EventModel.session_id == session_id)
        .order_by(EventModel.created_at)
    )
    events = ev_result.scalars().all()

    # Recalculate score from all events (source of truth)
    risk_score = calculate_total_score(events)
    verdict    = get_verdict(risk_score)
    breakdown  = get_breakdown(events)

    return ReportOut(
        session_id     = session_id,
        candidate_name = session.candidate_name if session else "Unknown",
        exam_name      = session.exam_name      if session else "Unknown",
        risk_score     = risk_score,
        verdict        = verdict,
        total_events   = len(events),
        events         = events,
        breakdown      = breakdown,
    )


# ══════════════════════════════════════
# GET /report/{session_id}/pdf
# Generates and streams a PDF file download.
# ══════════════════════════════════════
@router.get("/report/{session_id}/pdf")
async def download_report_pdf(session_id: str, db: AsyncSession = Depends(get_db)):
    """
    Generate and return a PDF audit report.
    The browser will download it as a file.
    """

    # ── Fetch all data
    sess_result = await db.execute(
        select(SessionModel).where(SessionModel.session_id == session_id)
    )
    session = sess_result.scalar_one_or_none()

    ev_result = await db.execute(
        select(EventModel)
        .where(EventModel.session_id == session_id)
        .order_by(EventModel.created_at)
    )
    events = ev_result.scalars().all()

    risk_score = calculate_total_score(events)
    verdict    = get_verdict(risk_score)
    breakdown  = get_breakdown(events)

    # ── Build report data dict for PDF generator
    report_data = {
        "session_id":     session_id,
        "candidate_name": session.candidate_name if session else "Unknown",
        "exam_name":      session.exam_name      if session else "Unknown",
        "risk_score":     risk_score,
        "verdict":        verdict,
        "total_events":   len(events),
        "breakdown":      breakdown,
    }

    # ── Generate PDF (returns BytesIO)
    pdf_buffer = generate_pdf_report(report_data, events)

    filename = f"IntegrityLens_{session_id}.pdf"

    print(f"📄 PDF report generated for session: {session_id}")

    # ── Stream the PDF back as a file download
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )
