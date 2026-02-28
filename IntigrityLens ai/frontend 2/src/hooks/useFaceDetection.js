// src/hooks/useFaceDetection.js
// ─────────────────────────────────────────────
// CHANCHAL'S MAIN FILE — COMPLETE & WORKING
//
// What this does:
//   1. Loads face-api.js AI models from /public/models/
//   2. Reads webcam frames every 300ms
//   3. Detects ALL faces in the frame
//   4. Draws bounding boxes + landmarks on canvas overlay
//   5. Estimates gaze direction from nose/eye landmark positions
//   6. Fires callbacks when violations are detected:
//      - More than 1 face  → onViolation("MULTIPLE_FACES")
//      - No face found     → onViolation("FACE_NOT_DETECTED")
//      - Looking left/right → onViolation("GAZE_DEVIATION")
//
// HOW TO USE IN Exam.jsx:
//   const videoRef  = useRef(null)
//   const canvasRef = useRef(null)
//   const { faceCount, gazeDir, isLoaded } = useFaceDetection(videoRef, canvasRef, onViolation)
// ─────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from 'react'
import * as faceapi from 'face-api.js'

const MODEL_URL = '/models'

// How many consecutive frames must trigger before we fire a violation
// (prevents single-frame false positives)
const GAZE_FRAMES_THRESHOLD  = 5   // ~1.5 seconds of looking away
const FACE_FRAMES_THRESHOLD  = 4   // ~1.2 seconds of no face

function useFaceDetection(videoRef, canvasRef, onViolation) {
  const [isLoaded,  setIsLoaded]  = useState(false)
  const [faceCount, setFaceCount] = useState(0)
  const [gazeDir,   setGazeDir]   = useState('FORWARD')
  const [loadError, setLoadError] = useState(null)

  // Persistent counters across frames (useRef so they don't cause re-renders)
  const gazeFrameCount  = useRef(0)    // how many consecutive frames gaze was off
  const noFaceFrameCount = useRef(0)   // how many consecutive frames no face found
  const lastGazeFired   = useRef(0)    // timestamp of last gaze violation fired
  const lastFaceFired   = useRef(0)    // timestamp of last face violation fired
  const intervalRef     = useRef(null)

  // Cooldown between firing the same violation type (ms)
  const COOLDOWN_MS = 6000

  // ── STEP 1: Load AI models once on mount
  useEffect(() => {
    async function loadModels() {
      try {
        console.log('⏳ Loading face-api.js models...')
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        ])
        setIsLoaded(true)
        console.log('✅ face-api.js models loaded successfully')
      } catch (err) {
        console.error('❌ Model load failed:', err)
        setLoadError('Models failed to load. Check /public/models/ folder.')
        // Still mark loaded so app doesn't block forever
        setIsLoaded(true)
      }
    }
    loadModels()
  }, [])

  // ── STEP 2: Start detection loop after models load
  useEffect(() => {
    if (!isLoaded) return

    intervalRef.current = setInterval(async () => {
      const video  = videoRef.current
      const canvas = canvasRef.current

      // Don't run if video isn't ready yet
      if (!video || !canvas || video.readyState < 2) return

      try {
        // ── Detect faces with landmarks
        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({
            inputSize: 224,        // smaller = faster, good for 300ms interval
            scoreThreshold: 0.5    // minimum confidence to count as a face
          }))
          .withFaceLandmarks()

        // ── Match canvas dimensions to video stream
        faceapi.matchDimensions(canvas, {
          width:  video.videoWidth,
          height: video.videoHeight
        })

        // ── Draw detections onto canvas overlay
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        const resized = faceapi.resizeResults(detections, {
          width:  video.videoWidth,
          height: video.videoHeight
        })

        // Custom drawing — green boxes and cyan landmarks
        drawCustomDetections(ctx, resized)

        // ── Update face count
        const count = detections.length
        setFaceCount(count)

        // ── Handle MULTIPLE FACES
        if (count > 1) {
          fireViolation('MULTIPLE_FACES', {
            event_type:  'MULTIPLE_FACES',
            severity:    'HIGH',
            confidence:  0.95,
            duration:    2,
            label:       `Multiple faces detected (${count} faces)`,
          })
        }

        // ── Handle NO FACE
        if (count === 0) {
          noFaceFrameCount.current++
          if (noFaceFrameCount.current >= FACE_FRAMES_THRESHOLD) {
            fireViolation('FACE_NOT_DETECTED', {
              event_type:  'FACE_NOT_DETECTED',
              severity:    'MEDIUM',
              confidence:  0.9,
              duration:    Math.floor(noFaceFrameCount.current * 0.3),
              label:       'Face not visible in frame',
            })
          }
        } else {
          noFaceFrameCount.current = 0  // reset counter when face returns
        }

        // ── Handle GAZE DEVIATION (only when exactly 1 face)
        if (count === 1) {
          const gaze = estimateGaze(detections[0].landmarks)
          setGazeDir(gaze)

          if (gaze !== 'FORWARD') {
            gazeFrameCount.current++
            if (gazeFrameCount.current >= GAZE_FRAMES_THRESHOLD) {
              fireViolation('GAZE_DEVIATION', {
                event_type:  'GAZE_DEVIATION',
                severity:    gazeFrameCount.current > 10 ? 'MEDIUM' : 'LOW',
                confidence:  0.78,
                duration:    Math.floor(gazeFrameCount.current * 0.3),
                label:       `Gaze deviation — looking ${gaze.toLowerCase()}`,
              })
            }
          } else {
            gazeFrameCount.current = 0  // reset when looking forward again
          }
        }

      } catch (err) {
        // Silent fail — never crash the exam for a detection error
      }
    }, 300)  // Every 300ms = ~3 frames per second (lightweight)

    return () => clearInterval(intervalRef.current)
  }, [isLoaded, videoRef, canvasRef])

  // ── Fire violation with cooldown (don't spam same event)
  function fireViolation(type, eventData) {
    const now = Date.now()
    const lastFired = type === 'GAZE_DEVIATION' ? lastGazeFired.current : lastFaceFired.current

    if (now - lastFired < COOLDOWN_MS) return  // still in cooldown

    // Update the right timestamp
    if (type === 'GAZE_DEVIATION') lastGazeFired.current = now
    else lastFaceFired.current = now

    // Reset frame counter after firing
    if (type === 'GAZE_DEVIATION')    gazeFrameCount.current  = 0
    if (type === 'FACE_NOT_DETECTED') noFaceFrameCount.current = 0

    if (onViolation) onViolation(eventData)
  }

  return { faceCount, gazeDir, isLoaded, loadError }
}

// ── Custom canvas drawing
// Draws green bounding boxes and cyan dot landmarks
function drawCustomDetections(ctx, resized) {
  resized.forEach(det => {
    const box = det.detection.box

    // Green bounding box
    ctx.strokeStyle = '#00d4ff'
    ctx.lineWidth   = 2
    ctx.strokeRect(box.x, box.y, box.width, box.height)

    // Corner accents (like a targeting reticle)
    const c = 12  // corner length
    ctx.strokeStyle = '#00e676'
    ctx.lineWidth   = 3
    // Top-left
    ctx.beginPath(); ctx.moveTo(box.x, box.y + c); ctx.lineTo(box.x, box.y); ctx.lineTo(box.x + c, box.y); ctx.stroke()
    // Top-right
    ctx.beginPath(); ctx.moveTo(box.x + box.width - c, box.y); ctx.lineTo(box.x + box.width, box.y); ctx.lineTo(box.x + box.width, box.y + c); ctx.stroke()
    // Bottom-left
    ctx.beginPath(); ctx.moveTo(box.x, box.y + box.height - c); ctx.lineTo(box.x, box.y + box.height); ctx.lineTo(box.x + c, box.y + box.height); ctx.stroke()
    // Bottom-right
    ctx.beginPath(); ctx.moveTo(box.x + box.width - c, box.y + box.height); ctx.lineTo(box.x + box.width, box.y + box.height); ctx.lineTo(box.x + box.width, box.y + box.height - c); ctx.stroke()

    // Landmark dots
    if (det.landmarks) {
      ctx.fillStyle = 'rgba(0, 212, 255, 0.6)'
      det.landmarks.positions.forEach(pt => {
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, 1.5, 0, 2 * Math.PI)
        ctx.fill()
      })
    }
  })
}

// ── Gaze estimation
// Compares nose tip position vs eye midpoint.
// If nose shifts significantly left/right → candidate is looking away.
function estimateGaze(landmarks) {
  const pts = landmarks.positions

  // 68-point model key indices:
  // 30 = nose tip
  // 36 = left eye outer corner
  // 45 = right eye outer corner
  const noseTip  = pts[30]
  const leftEye  = pts[36]
  const rightEye = pts[45]

  const eyeCenterX = (leftEye.x + rightEye.x) / 2
  const faceWidth  = Math.abs(rightEye.x - leftEye.x)

  if (faceWidth < 1) return 'FORWARD'  // avoid divide by zero

  const offset = (noseTip.x - eyeCenterX) / faceWidth

  if (offset < -0.18) return 'LEFT'
  if (offset >  0.18) return 'RIGHT'
  return 'FORWARD'
}

export default useFaceDetection
