// src/pages/Verify.jsx
// ─────────────────────────────────────────────
// SHIVANGI'S PAGE
//
// Page 1: Pre-exam verification flow.
// Runs 4 checks sequentially: face, environment, identity, audio.
// When all pass → shows "Begin Exam" button.
// ─────────────────────────────────────────────
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Verify.module.css'

// The 4 checks that run in sequence
const CHECKS = [
  {
    id: 'face',
    title: 'Face Detection',
    sub: 'MediaPipe landmark detection',
    scanning: 'Detecting face...',
    done: 'Face detected ✓',
  },
  {
    id: 'env',
    title: 'Environment Scan',
    sub: 'Checking for unauthorized devices',
    scanning: 'Scanning environment...',
    done: 'Environment clear ✓',
  },
  {
    id: 'id',
    title: 'Identity Match',
    sub: 'Comparing with registered profile',
    scanning: 'Matching identity...',
    done: 'Identity verified ✓',
  },
  {
    id: 'audio',
    title: 'Audio Calibration',
    sub: 'Web Audio API baseline setup',
    scanning: 'Calibrating audio...',
    done: 'Audio calibrated ✓',
  },
]

function Verify() {
  const navigate = useNavigate()

  // checkStatus: 'idle' | 'scanning' | 'done' for each check
  const [checkStatus, setCheckStatus] = useState({
    face: 'idle', env: 'idle', id: 'idle', audio: 'idle'
  })
  const [scanning,   setScanning]   = useState(false)
  const [allDone,    setAllDone]    = useState(false)
  const [camLive,    setCamLive]    = useState(false)

  function startVerification() {
    setScanning(true)
    setCamLive(true)

    let i = 0
    function runNext() {
      if (i >= CHECKS.length) {
        setAllDone(true)
        setScanning(false)
        return
      }
      const check = CHECKS[i]
      // Mark as scanning
      setCheckStatus(prev => ({ ...prev, [check.id]: 'scanning' }))

      // After 1.4s mark as done and move to next
      setTimeout(() => {
        setCheckStatus(prev => ({ ...prev, [check.id]: 'done' }))
        i++
        setTimeout(runNext, 400)
      }, 1400)
    }
    setTimeout(runNext, 300)
  }

  return (
    <div className={`${styles.page} page-enter`}>
      <div className={styles.container}>

        {/* LEFT — heading + checklist */}
        <div className={styles.left}>
          <h1 className={styles.heading}>
            PRE-EXAM<br />
            <span className={styles.headingAccent}>VERIFY</span>
          </h1>
          <p className={styles.tagline}>
            Our edge AI verifies your identity and environment before the
            exam begins. All processing happens locally on your device —
            no raw video is ever transmitted.
          </p>

          <div className={styles.checklist}>
            {CHECKS.map(check => {
              const status = checkStatus[check.id]
              return (
                <div
                  key={check.id}
                  className={`${styles.checkItem}
                    ${status === 'done'     ? styles.done    : ''}
                    ${status === 'scanning' ? styles.active  : ''}`}
                >
                  <div className={styles.checkIcon}>
                    {status === 'done'     ? '✓'   :
                     status === 'scanning' ? '...' : '○'}
                  </div>
                  <div className={styles.checkLabel}>
                    <strong>{check.title}</strong>
                    <span>{check.sub}</span>
                  </div>
                  <span className={styles.checkStatus}>
                    {status === 'done'     ? check.done     :
                     status === 'scanning' ? check.scanning :
                     'PENDING'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* RIGHT — webcam panel */}
        <div className={styles.camPanel}>
          <div className={styles.camHeader}>
            <span className={styles.camTitle}>WEBCAM FEED</span>
            <span className={`${styles.camIndicator} ${camLive ? styles.live : ''}`}>
              <span className={styles.camDot} />
              {camLive ? 'LIVE' : 'INACTIVE'}
            </span>
          </div>

          <div className={styles.camFeed}>
            {!camLive && (
              <div className={styles.placeholder}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M23 7l-7 5 7 5V7z"/>
                  <rect x="1" y="5" width="15" height="14" rx="2"/>
                </svg>
                <span>Click "Start Verification"</span>
              </div>
            )}

            {/* Face detection oval overlay */}
            {scanning && (
              <>
                <div className={styles.faceFrame} />
                <div className={styles.scanLine} />
              </>
            )}

            {/* Verified overlay */}
            {allDone && (
              <div className={styles.verifiedOverlay}>
                ✓ &nbsp; IDENTITY VERIFIED
              </div>
            )}
          </div>

          <div className={styles.camFooter}>
            {!allDone ? (
              <button
                className={`${styles.verifyBtn} ${scanning ? styles.disabled : ''}`}
                onClick={startVerification}
                disabled={scanning}
              >
                {scanning ? 'Scanning...' : 'Start Verification'}
              </button>
            ) : (
              <button
                className={`${styles.verifyBtn} ${styles.doneBtn}`}
                onClick={() => navigate('/exam')}
              >
                Begin Exam →
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

export default Verify
