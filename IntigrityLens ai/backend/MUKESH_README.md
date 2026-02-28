# MUKESH — Your Complete Backend Guide

## Your Files

```
backend/
├── main.py                        ← Entry point — START HERE
├── database.py                    ← Tables: events + sessions
├── schemas.py                     ← Data shapes (in/out)
├── requirements.txt               ← Python packages
├── .env                           ← Config values
├── routes/
│   ├── events.py                  ← POST /log-event
│   ├── report.py                  ← GET /report + PDF download
│   └── exam.py                    ← GET /questions
└── services/
    ├── risk_engine.py             ← Risk score formula
    └── report_generator.py        ← PDF generation
```

---

## Step 1 — First Time Setup (Do This Once)

```bash
cd integritylens/backend

# Create virtual environment
python -m venv venv

# Activate it — Windows:
venv\Scripts\activate

# Activate it — Mac/Linux:
source venv/bin/activate

# Install all packages
pip install -r requirements.txt
```

You'll see `(venv)` in your terminal — that means it's active.

---

## Step 2 — Run the Server

```bash
# Make sure venv is active first!
uvicorn main:app --reload
```

You should see:
```
🚀 IntegrityLens AI Backend starting...
✅ Database tables created
✅ Ready at http://localhost:8000
📖 API docs at http://localhost:8000/docs
```

---

## Step 3 — Test It's Working

Open Chrome and go to: **http://localhost:8000/docs**

You'll see a beautiful interactive API page where you can
test every endpoint by clicking "Try it out".

Test the health check:
```
GET http://localhost:8000/
```
Should return: `{"status": "running", ...}`

---

## Step 4 — Test With Frontend

1. Start backend:  `uvicorn main:app --reload`  (port 8000)
2. Start frontend: `npm run dev`                 (port 5173)
3. Open exam, complete it
4. Watch the terminal — you'll see logs like:
   ```
   📝 Event logged: TAB_SWITCH | Score: 25 | Session: IL-2026-00342
   📝 Event logged: GAZE_DEVIATION | Score: 32 | Session: IL-2026-00342
   📄 PDF report generated for session: IL-2026-00342
   ```

---

## Your API Endpoints — What Each One Does

| Method | URL | What it does |
|--------|-----|--------------|
| GET | / | Health check |
| POST | /log-event | Save one proctoring event |
| GET | /events/{session_id} | Get all events for session |
| DELETE | /events/{session_id} | Clear events (for testing) |
| GET | /questions | Get exam questions |
| POST | /session | Start a new exam session |
| GET | /report/{session_id} | Get JSON report |
| GET | /report/{session_id}/pdf | Download PDF report |

---

## Risk Score Formula (Your Main Feature to Explain)

```python
# In services/risk_engine.py
Score = Weight × Duration × Confidence × Context Modifier

WEIGHTS = {
    "MULTIPLE_FACES":    40,   # Most suspicious
    "TAB_SWITCH":        25,
    "FACE_NOT_DETECTED": 20,
    "AUDIO_SPIKE":       15,
    "GAZE_DEVIATION":    10,   # Least suspicious
}

SEVERITY_MODIFIER = {
    "HIGH":   1.2,
    "MEDIUM": 1.0,
    "LOW":    0.7,
}
```

When a judge asks "how does the score work?" — show them
this file. It's exactly what you showed in the pitch deck.

---

## Common Errors and Fixes

**"ModuleNotFoundError: No module named 'fastapi'"**
→ Virtual environment is not active.
  Run: `venv\Scripts\activate` (Windows)

**"Address already in use"**
→ Port 8000 is taken. Kill whatever is using it or:
  `uvicorn main:app --reload --port 8001`
  Then update VITE proxy in vite.config.js to 8001.

**"CORS error" in browser console**
→ Make sure the backend is running before the frontend.
  The CORS middleware is already set up in main.py.

**Database file not found**
→ The .db file creates itself automatically on first run.
  Just make sure you're in the /backend folder when running.

---

## Resetting the Database (Useful for Testing)

Just delete the file:
```bash
del integritylens.db     # Windows
rm integritylens.db      # Mac/Linux
```

Then restart the server — it creates a fresh database.
