# IntegrityLens AI — Frontend

## How to Run (Do This First)

```bash
cd integritylens/frontend
npm install
npm run dev
```

Then open: http://localhost:5173

---

## Folder Structure — Who Owns What

```
src/
├── pages/
│   ├── Verify.jsx        ← SHIVANGI  (Pre-exam check screen)
│   ├── Exam.jsx          ← SHIVANGI  (Exam UI) + CHANCHAL (AI hooks)
│   ├── Monitor.jsx       ← SHIVANGI  (Admin dashboard)
│   └── Report.jsx        ← SHIVANGI  (Audit report)
│
├── components/
│   ├── Navbar.jsx        ← SHIVANGI
│   ├── RiskScoreGauge.jsx← SHIVANGI
│   ├── EventLog.jsx      ← SHIVANGI
│   └── AlertBanner.jsx   ← SHIVANGI
│
├── hooks/
│   ├── useFaceDetection.js ← CHANCHAL  ⭐ Main AI file
│   ├── useTabMonitor.js    ← CHANCHAL
│   └── useAudioMonitor.js  ← CHANCHAL
│
├── services/
│   └── api.js            ← MUKESH  (All backend calls)
│
└── store/
    └── examStore.jsx     ← MUKESH  (Shared state)
```

---

## Face Detection Models (Chanchal must do this)

Download these files and put them in `public/models/`:

1. Go to: https://github.com/justadudewhohacks/face-api.js/tree/master/weights
2. Download these 4 files:
   - `tiny_face_detector_model-weights_manifest.json`
   - `tiny_face_detector_model-shard1`
   - `face_landmark_68_model-weights_manifest.json`
   - `face_landmark_68_model-shard1`
3. Place all 4 in `/public/models/`

---

## Backend Connection (Mukesh)

The frontend calls the backend via `/api/*` which Vite proxies to `http://localhost:8000`.

Make sure FastAPI is running before testing API features:
```bash
cd ../backend
venv\Scripts\activate   # Windows
uvicorn main:app --reload
```

If backend is offline, the app still works — it uses fallback data.

---

## Hackathon Day Checklist

- [ ] `npm install` done on all 3 machines
- [ ] Models downloaded into `/public/models/`
- [ ] Backend running on port 8000
- [ ] Tab switch detection works (open exam, press Ctrl+T)
- [ ] Face detected in webcam feed
- [ ] Risk score updates when violations happen
- [ ] Report page shows correct events after exam
- [ ] PDF downloads
