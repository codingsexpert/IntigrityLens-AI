# backend/services/report_generator.py
# ─────────────────────────────────────────────
# MUKESH'S FILE
#
# Generates a PDF audit report using ReportLab.
# Called when frontend hits GET /report/{session_id}/pdf
#
# Returns a BytesIO object (in-memory PDF file)
# which FastAPI streams back as a file download.
# ─────────────────────────────────────────────
from reportlab.lib.pagesizes  import A4
from reportlab.lib            import colors
from reportlab.lib.styles     import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units      import cm
from reportlab.platypus       import (
    SimpleDocTemplate, Paragraph, Spacer,
    Table, TableStyle, HRFlowable
)
from reportlab.lib.enums      import TA_LEFT, TA_CENTER, TA_RIGHT
from datetime                 import datetime
from io                       import BytesIO


# ── Color palette (matches the frontend's dark theme)
C_BG      = colors.HexColor("#080c10")
C_ACCENT  = colors.HexColor("#00d4ff")
C_SAFE    = colors.HexColor("#00e676")
C_WARN    = colors.HexColor("#ffab00")
C_DANGER  = colors.HexColor("#ff3d57")
C_TEXT    = colors.HexColor("#e8edf2")
C_DIM     = colors.HexColor("#5a6a78")
C_SURFACE = colors.HexColor("#0e1318")
C_WHITE   = colors.white
C_BLACK   = colors.black


def generate_pdf_report(report_data: dict, events: list) -> BytesIO:
    """
    Generate a PDF audit report.

    Args:
        report_data : dict with keys: session_id, candidate_name,
                      exam_name, risk_score, verdict, total_events, breakdown
        events      : list of EventModel objects

    Returns:
        BytesIO — in-memory PDF ready to stream
    """
    buffer = BytesIO()
    doc    = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2*cm, leftMargin=2*cm,
        topMargin=2*cm,   bottomMargin=2*cm
    )

    styles = getSampleStyleSheet()
    story  = []

    # ── Verdict color
    score   = report_data["risk_score"]
    verdict = report_data["verdict"]
    verdict_color = C_SAFE if verdict == "CLEAR" else C_WARN if verdict == "REVIEW" else C_DANGER

    # ════════════════════════════════════════
    # HEADER
    # ════════════════════════════════════════
    header_style = ParagraphStyle(
        "Header",
        fontName="Helvetica-Bold", fontSize=28,
        textColor=C_BLACK, spaceAfter=4
    )
    sub_style = ParagraphStyle(
        "Sub",
        fontName="Helvetica", fontSize=10,
        textColor=C_DIM, spaceAfter=2
    )

    story.append(Paragraph("INTEGRITYLENS AI", header_style))
    story.append(Paragraph("Automated Proctoring Audit Report", sub_style))
    story.append(HRFlowable(width="100%", thickness=1, color=C_DIM))
    story.append(Spacer(1, 0.4*cm))

    # ── Session metadata table
    meta_data = [
        ["Session ID",     report_data["session_id"]],
        ["Candidate",      report_data["candidate_name"]],
        ["Examination",    report_data["exam_name"]],
        ["Date",           datetime.now().strftime("%d %B %Y, %H:%M")],
        ["Total Events",   str(report_data["total_events"])],
    ]
    meta_table = Table(meta_data, colWidths=[5*cm, 12*cm])
    meta_table.setStyle(TableStyle([
        ("FONTNAME",    (0,0), (0,-1), "Helvetica-Bold"),
        ("FONTNAME",    (1,0), (1,-1), "Helvetica"),
        ("FONTSIZE",    (0,0), (-1,-1), 10),
        ("TEXTCOLOR",   (0,0), (0,-1), C_DIM),
        ("TEXTCOLOR",   (1,0), (1,-1), C_BLACK),
        ("TOPPADDING",  (0,0), (-1,-1), 4),
        ("BOTTOMPADDING",(0,0), (-1,-1), 4),
        ("LINEBELOW",   (0,-1), (-1,-1), 0.5, C_DIM),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 0.6*cm))

    # ════════════════════════════════════════
    # VERDICT BANNER
    # ════════════════════════════════════════
    verdict_text = {
        "CLEAR":   f"✓  EXAM CLEARED — Risk Score: {score}/100",
        "REVIEW":  f"⚠  FLAGGED FOR REVIEW — Risk Score: {score}/100",
        "FLAGGED": f"✕  HIGH RISK — Risk Score: {score}/100 — Immediate Review Required",
    }[verdict]

    verdict_table = Table([[verdict_text]], colWidths=[17*cm])
    verdict_table.setStyle(TableStyle([
        ("FONTNAME",     (0,0), (-1,-1), "Helvetica-Bold"),
        ("FONTSIZE",     (0,0), (-1,-1), 13),
        ("TEXTCOLOR",    (0,0), (-1,-1), verdict_color),
        ("BACKGROUND",   (0,0), (-1,-1), colors.HexColor("#f8f8f8")),
        ("BOX",          (0,0), (-1,-1), 1.5, verdict_color),
        ("TOPPADDING",   (0,0), (-1,-1), 12),
        ("BOTTOMPADDING",(0,0), (-1,-1), 12),
        ("LEFTPADDING",  (0,0), (-1,-1), 16),
    ]))
    story.append(verdict_table)
    story.append(Spacer(1, 0.6*cm))

    # ════════════════════════════════════════
    # SIGNAL BREAKDOWN
    # ════════════════════════════════════════
    section_style = ParagraphStyle(
        "Section",
        fontName="Helvetica-Bold", fontSize=11,
        textColor=C_BLACK, spaceBefore=8, spaceAfter=6
    )
    story.append(Paragraph("SIGNAL BREAKDOWN", section_style))

    breakdown = report_data.get("breakdown", {})
    breakdown_rows = [
        ["Signal Type", "Count", "Weight", "Impact"]
    ]
    weights = {
        "MULTIPLE_FACES": 40, "TAB_SWITCH": 25,
        "FACE_NOT_DETECTED": 20, "AUDIO_SPIKE": 15, "GAZE_DEVIATION": 10
    }
    for event_type, count in breakdown.items():
        if count > 0:
            w = weights.get(event_type, 5)
            breakdown_rows.append([
                event_type.replace("_", " "),
                str(count),
                str(w),
                "HIGH" if w >= 25 else "MEDIUM" if w >= 15 else "LOW"
            ])

    if len(breakdown_rows) == 1:
        breakdown_rows.append(["No violations recorded", "", "", ""])

    bd_table = Table(breakdown_rows, colWidths=[8*cm, 3*cm, 3*cm, 3*cm])
    bd_table.setStyle(TableStyle([
        ("FONTNAME",     (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTNAME",     (0,1), (-1,-1), "Helvetica"),
        ("FONTSIZE",     (0,0), (-1,-1), 10),
        ("BACKGROUND",   (0,0), (-1,0), colors.HexColor("#f0f0f0")),
        ("TEXTCOLOR",    (0,0), (-1,0), C_BLACK),
        ("GRID",         (0,0), (-1,-1), 0.5, colors.HexColor("#dddddd")),
        ("TOPPADDING",   (0,0), (-1,-1), 6),
        ("BOTTOMPADDING",(0,0), (-1,-1), 6),
        ("LEFTPADDING",  (0,0), (-1,-1), 8),
        ("ALIGN",        (1,0), (-1,-1), "CENTER"),
    ]))
    story.append(bd_table)
    story.append(Spacer(1, 0.6*cm))

    # ════════════════════════════════════════
    # EVENT TIMELINE
    # ════════════════════════════════════════
    story.append(Paragraph("EVENT TIMELINE", section_style))

    if not events:
        story.append(Paragraph("No events recorded during this exam session.", sub_style))
    else:
        event_rows = [["Time", "Event Type", "Severity", "Confidence", "Duration", "Description"]]
        for ev in events:
            sev_color = C_DANGER if ev.severity == "HIGH" else C_WARN if ev.severity == "MEDIUM" else C_DIM
            event_rows.append([
                ev.timestamp or "",
                ev.event_type.replace("_", " "),
                ev.severity,
                f"{ev.confidence:.2f}",
                f"{ev.duration}s",
                ev.label or "",
            ])

        ev_table = Table(
            event_rows,
            colWidths=[2*cm, 4*cm, 2.5*cm, 2.5*cm, 2*cm, 4*cm]
        )
        ev_table.setStyle(TableStyle([
            ("FONTNAME",     (0,0), (-1,0), "Helvetica-Bold"),
            ("FONTNAME",     (0,1), (-1,-1), "Helvetica"),
            ("FONTSIZE",     (0,0), (-1,-1), 8.5),
            ("BACKGROUND",   (0,0), (-1,0), colors.HexColor("#f0f0f0")),
            ("GRID",         (0,0), (-1,-1), 0.5, colors.HexColor("#dddddd")),
            ("TOPPADDING",   (0,0), (-1,-1), 5),
            ("BOTTOMPADDING",(0,0), (-1,-1), 5),
            ("LEFTPADDING",  (0,0), (-1,-1), 6),
            ("ROWBACKGROUNDS",(0,1),(-1,-1), [colors.white, colors.HexColor("#fafafa")]),
        ]))
        story.append(ev_table)

    story.append(Spacer(1, 0.8*cm))

    # ════════════════════════════════════════
    # FOOTER
    # ════════════════════════════════════════
    story.append(HRFlowable(width="100%", thickness=0.5, color=C_DIM))
    footer_style = ParagraphStyle(
        "Footer",
        fontName="Helvetica", fontSize=8,
        textColor=C_DIM, spaceAfter=2, alignment=TA_CENTER
    )
    story.append(Spacer(1, 0.2*cm))
    story.append(Paragraph(
        f"Generated by IntegrityLens AI — BUILDX 2026 — {datetime.now().strftime('%d %b %Y %H:%M')}",
        footer_style
    ))
    story.append(Paragraph(
        "Risk Score Formula: Σ (Weight × Duration × Confidence × Context Modifier)",
        footer_style
    ))

    # ── Build the PDF into buffer
    doc.build(story)
    buffer.seek(0)
    return buffer
