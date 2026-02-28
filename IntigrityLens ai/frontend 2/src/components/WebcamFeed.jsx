// src/components/WebcamFeed.jsx
// ─────────────────────────────────────────────
// CHANCHAL'S COMPONENT
//
// Shows a live webcam feed with a canvas overlay
// for drawing face detection results on top.
//
// This is the component Shivangi places in the sidebar.
// Chanchal wires useFaceDetection into it.
//
// Props:
//   onViolation  (function) — called when face detection finds something
//   compact      (boolean)  — true = small sidebar version
// ─────────────────────────────────────────────
import React, { useRef, useEffect, useState } from 'react'
import useFaceDetection from '../hooks/useFaceDetection.js'
import styles from './WebcamFeed.module.css'

function WebcamFeed({ onViolation, compact = false }) {
  const videoRef  = useRef(null)
  const canvasRef = useRef(null)
  const [camError,  setCamError]  = useState(null)
  const [camReady,  setCamReady]  = useState(false)

  // ── Connect face detection hook
  const { faceCount, gazeDir, isLoaded, loadError } = useFaceDetection(
    videoRef,
    canvasRef,
    onViolation   // fires when violations detected
  )

  // ── Start webcam stream on mount
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width:       { ideal: 640 },
            height:      { ideal: 480 },
            facingMode:  'user',        // front camera
            frameRate:   { ideal: 15 } // 15fps is enough
          },
          audio: false  // audio handled separately by useAudioMonitor
        })

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadeddata = () => setCamReady(true)
        }
      } catch (err) {
        console.error('Camera access denied:', err)
        setCamError('Camera access denied. Please allow camera permissions and refresh.')
      }
    }
    startCamera()

    // Cleanup: stop the camera stream when component unmounts
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop())
      }
    }
  }, [])

  // ── Status label shown below the feed
  const faceStatus =
    !camReady   ? 'STARTING...' :
    !isLoaded   ? 'LOADING AI...' :
    faceCount === 0 ? '⚠ NO FACE' :
    faceCount >  1  ? `⚠ ${faceCount} FACES` :
    gazeDir !== 'FORWARD' ? `👁 GAZE ${gazeDir}` :
    '✓ VERIFIED'

  const statusCls =
    faceCount === 0 || faceCount > 1 ? styles.statusDanger :
    gazeDir !== 'FORWARD'             ? styles.statusWarn :
    styles.statusSafe

  return (
    <div className={`${styles.wrapper} ${compact ? styles.compact : ''}`}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.title}>LIVE FEED</span>
        <span className={`${styles.dot} ${camReady ? styles.dotLive : ''}`}>
          {camReady ? '● LIVE' : '○ INIT'}
        </span>
      </div>

      {/* Feed area — video + canvas stacked */}
      <div className={styles.feedArea}>
        {camError ? (
          <div className={styles.error}>{camError}</div>
        ) : (
          <>
            {/* The actual webcam video */}
            <video
              ref={videoRef}
              className={styles.video}
              autoPlay
              muted
              playsInline
            />

            {/* Canvas overlay — face detection draws here */}
            <canvas
              ref={canvasRef}
              className={styles.canvas}
            />

            {/* Loading overlay while models load */}
            {!isLoaded && (
              <div className={styles.loadingOverlay}>
                <div className={styles.spinner} />
                <span>Loading AI models...</span>
              </div>
            )}

            {/* Model load error notice */}
            {loadError && (
              <div className={styles.errorOverlay}>
                ⚠ Models not found.<br />
                Add files to /public/models/
              </div>
            )}
          </>
        )}
      </div>

      {/* Status bar */}
      <div className={`${styles.statusBar} ${statusCls}`}>
        <span>{faceStatus}</span>
        {faceCount === 1 && isLoaded && (
          <span className={styles.gazeInfo}>GAZE: {gazeDir}</span>
        )}
      </div>
    </div>
  )
}

export default WebcamFeed
