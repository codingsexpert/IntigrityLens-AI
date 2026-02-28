# backend/routes/exam.py
# ─────────────────────────────────────────────
# MUKESH'S FILE
#
# Serves exam questions to the frontend.
#
# Endpoints:
#   GET /questions  — returns the list of exam questions
#   POST /session   — start a new exam session
# ─────────────────────────────────────────────
from fastapi              import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database             import get_db, SessionModel
from schemas              import QuestionOut, SessionIn
from typing               import List

router = APIRouter()


# ── Hardcoded questions
# In a real system, these would come from a database.
# For the hackathon, hardcoding is totally fine.
QUESTIONS = [
    {
        "id": "q1",
        "text": "What is the time complexity of binary search on a sorted array of n elements?",
        "options": ["O(n)", "O(log n)", "O(n²)", "O(n log n)"],
        "answer": "B"
    },
    {
        "id": "q2",
        "text": "Which data structure uses LIFO (Last In First Out) ordering?",
        "options": ["Queue", "Linked List", "Stack", "Tree"],
        "answer": "C"
    },
    {
        "id": "q3",
        "text": "In a max-heap, which element is always at the root?",
        "options": ["The smallest element", "The median element", "A random element", "The largest element"],
        "answer": "D"
    },
    {
        "id": "q4",
        "text": "What algorithm is best suited for finding the shortest path in a weighted graph?",
        "options": ["Bubble Sort", "Dijkstra's Algorithm", "BFS only", "DFS only"],
        "answer": "B"
    },
    {
        "id": "q5",
        "text": "Which sorting algorithm has the best average-case time complexity?",
        "options": ["Bubble Sort — O(n²)", "Selection Sort — O(n²)", "Quick Sort — O(n log n)", "Insertion Sort — O(n²)"],
        "answer": "C"
    },
]


# ══════════════════════════════════════
# GET /questions
# Returns exam questions to the frontend.
# ══════════════════════════════════════
@router.get("/questions", response_model=List[QuestionOut])
async def get_questions():
    """Return all exam questions."""
    return QUESTIONS


# ══════════════════════════════════════
# POST /session
# Called when a candidate starts the exam.
# Creates a session record in the database.
# ══════════════════════════════════════
@router.post("/session")
async def create_session(session: SessionIn, db: AsyncSession = Depends(get_db)):
    """Create a new exam session record."""
    new_session = SessionModel(
        session_id     = session.session_id,
        candidate_name = session.candidate_name,
        exam_name      = session.exam_name,
        risk_score     = 0,
    )
    db.add(new_session)
    await db.commit()
    print(f"🎓 Session started: {session.session_id} — {session.candidate_name}")
    return {
        "status":     "created",
        "session_id": session.session_id,
    }
