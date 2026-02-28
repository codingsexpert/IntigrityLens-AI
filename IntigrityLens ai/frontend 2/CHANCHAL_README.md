# CHANCHAL — Your Complete Setup Guide

## Your Files (Only Touch These)

```
src/hooks/useFaceDetection.js   ← Main AI brain
src/hooks/useTabMonitor.js      ← Tab switching detection
src/hooks/useAudioMonitor.js    ← Audio spike detection
src/components/WebcamFeed.jsx   ← Webcam + canvas component
src/components/WebcamFeed.module.css
download-models.js              ← Run this once to get model files
```

---

## Step 1 — Download AI Model Files (Do This First!)

```bash
node download-models.js
```

If that fails (network issue), manually download these 4 files
from: https://github.com/justadudewhohacks/face-api.js/tree/master/weights

Files to download:
- tiny_face_detector_model-weights_manifest.json
- tiny_face_detector_model-shard1
- face_landmark_68_model-weights_manifest.json
- face_landmark_68_model-shard1

Put all 4 in: frontend/public/models/

---

## Step 2 — Install packages

```bash
npm install
```

---

## Step 3 — Run and test

```bash
npm run dev
```

Open http://localhost:5173/exam in Chrome.
You should see:
- Camera turning on in the sidebar
- "Loading AI models..." while it initializes
- Your face inside a glowing cyan bounding box
- Cyan dots on your facial landmarks (eyes, nose, jaw)

---

## How Each File Works

### useFaceDetection.js
Runs every 300ms. Each frame:
1. Reads the webcam video element
2. Runs face-api.js to find all faces
3. Draws green bounding box + cyan landmark dots on canvas
4. Counts how many faces appear
5. Estimates gaze direction (nose vs eye center)
6. Fires onViolation() callback when:
   - > 1 face detected (MULTIPLE_FACES)
   - No face for 5+ consecutive frames (FACE_NOT_DETECTED)
   - Gaze off center for 5+ consecutive frames (GAZE_DEVIATION)

### useTabMonitor.js
Listens for:
- document.visibilitychange → catches Ctrl+T, clicking other tabs
- window.blur → catches Alt+Tab to another application
Fires immediately when either is detected.

### useAudioMonitor.js
Uses rolling baseline averaging:
- Measures microphone volume every animation frame
- Builds a baseline average of recent volume
- Fires only when current volume is 2.5x above baseline
- Ignores quiet room noise (min threshold of level 20/100)

### WebcamFeed.jsx
Just a component wrapper:
- Starts the webcam stream via getUserMedia()
- Passes videoRef + canvasRef to useFaceDetection
- Shows loading spinner while models load
- Shows face count + gaze status in the status bar

---

## Testing Each Feature

**Test tab detection:**
Start the exam, press Ctrl+T to open a new tab.
You should see a red alert banner and the tab signal turn red.

**Test audio detection:**
Start the exam, clap loudly near the microphone.
You should see the AUDIO signal briefly flash SPIKE!

**Test face detection:**
Start the exam, move your face out of frame.
After ~1.5 seconds you should see the FACE signal flash MISSING!
Move a second person in front of the camera — you should see MULTIPLE!

**Test gaze detection:**
Start the exam, look to the far left for 2+ seconds.
You should see the GAZE signal flash LEFT.

---

## Common Errors and Fixes

**"Camera access denied"**
→ Click the camera icon in Chrome's address bar → Allow

**"Models not found" / "Failed to load face-api models"**
→ Run: node download-models.js
→ Or manually put files in /public/models/

**"faceapi is not defined"**
→ Run: npm install (face-api.js may not be installed)

**Canvas draws in wrong position**
→ The video must be playing before detection starts.
  Video readyState < 2 check handles this — wait 2-3 seconds.

**Detection is slow / laggy**
→ This is normal during first run while browser JIT-compiles.
  Reduce inputSize from 224 to 160 in useFaceDetection.js line 68.
