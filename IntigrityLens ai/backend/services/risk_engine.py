# backend/services/risk_engine.py
# ─────────────────────────────────────────────
# MUKESH'S FILE
#
# The risk scoring engine — exactly as defined in your pitch:
# Risk Score = Σ (Weight × Duration × Confidence × Context Modifier)
#
# This is a pure Python function — no database access.
# Called by the events route every time a new event is logged.
# ─────────────────────────────────────────────

# ── Weight for each event type
# Higher = more suspicious = bigger score impact
WEIGHTS = {
    "MULTIPLE_FACES":    40,
    "TAB_SWITCH":        25,
    "FACE_NOT_DETECTED": 20,
    "AUDIO_SPIKE":       15,
    "GAZE_DEVIATION":    10,
}

# ── Context modifier per severity level
SEVERITY_MODIFIER = {
    "HIGH":   1.2,
    "MEDIUM": 1.0,
    "LOW":    0.7,
}


def calculate_increment(event_type: str, severity: str, confidence: float, duration: int) -> float:
    """
    Calculate the score increment for a single event.

    Formula: Weight × Duration × Confidence × Context Modifier

    Args:
        event_type : "TAB_SWITCH", "GAZE_DEVIATION", etc.
        severity   : "LOW", "MEDIUM", "HIGH"
        confidence : 0.0 to 1.0
        duration   : seconds the event lasted

    Returns:
        float — the score increment (added to running total)
    """
    weight   = WEIGHTS.get(event_type, 5)
    modifier = SEVERITY_MODIFIER.get(severity, 1.0)
    return weight * duration * confidence * modifier


def calculate_total_score(events: list) -> int:
    """
    Recalculate the total risk score from ALL events.
    Used when generating the final report.

    Args:
        events: list of EventModel objects from database

    Returns:
        int — final score capped at 100
    """
    total = 0.0
    for ev in events:
        total += calculate_increment(
            ev.event_type,
            ev.severity,
            ev.confidence,
            ev.duration
        )
    return min(100, round(total))


def get_verdict(score: int) -> str:
    """
    Convert a numeric risk score into a verdict string.

    Returns:
        "CLEAR"   — score < 30  (no review needed)
        "REVIEW"  — 30 <= score < 70  (manual review recommended)
        "FLAGGED" — score >= 70  (high risk, review required)
    """
    if score < 30:
        return "CLEAR"
    elif score < 70:
        return "REVIEW"
    else:
        return "FLAGGED"


def get_breakdown(events: list) -> dict:
    """
    Count how many times each event type occurred.
    Used in the report's signal breakdown section.

    Returns dict like:
        { "TAB_SWITCH": 2, "GAZE_DEVIATION": 5, ... }
    """
    breakdown = {
        "TAB_SWITCH":        0,
        "GAZE_DEVIATION":    0,
        "MULTIPLE_FACES":    0,
        "FACE_NOT_DETECTED": 0,
        "AUDIO_SPIKE":       0,
    }
    for ev in events:
        if ev.event_type in breakdown:
            breakdown[ev.event_type] += 1
    return breakdown
