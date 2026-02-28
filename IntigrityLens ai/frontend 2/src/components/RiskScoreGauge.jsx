// src/components/RiskScoreGauge.jsx
// ─────────────────────────────────────────────
// Circular arc gauge showing risk score 0-100.
// Color transitions: green → amber → red
// Props:
//   score (number)  — 0 to 100
// ─────────────────────────────────────────────
import React from 'react'
import styles from './RiskScoreGauge.module.css'

function RiskScoreGauge({ score = 0 }) {
  // Arc math: total arc length is 173 (semi-circle path)
  const ARC_LENGTH = 173
  const offset = ARC_LENGTH - (ARC_LENGTH * Math.min(score, 100)) / 100

  // Color based on score
  const color =
    score < 30 ? 'var(--safe)' :
    score < 70 ? 'var(--warn)' :
                 'var(--danger)'

  const statusText =
    score < 30 ? 'ALL CLEAR' :
    score < 70 ? 'REVIEW NEEDED' :
                 'HIGH RISK'

  return (
    <div className={styles.wrapper}>
      <div className={styles.label}>INTEGRITY RISK SCORE</div>

      {/* SVG Arc Gauge */}
      <div className={styles.gaugeWrap}>
        <svg className={styles.svg} viewBox="0 0 140 80">
          {/* Background track */}
          <path
            className={styles.track}
            d="M 15 75 A 55 55 0 0 1 125 75"
          />
          {/* Colored fill */}
          <path
            className={styles.fill}
            d="M 15 75 A 55 55 0 0 1 125 75"
            style={{
              stroke: color,
              strokeDasharray: ARC_LENGTH,
              strokeDashoffset: offset,
              transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1), stroke 0.5s'
            }}
          />
        </svg>
      </div>

      {/* Numeric value */}
      <div className={styles.value} style={{ color }}>
        {score}
      </div>
      <div className={styles.sublabel}>{statusText}</div>

      {/* 4 live signal indicators */}
      <SignalGrid />
    </div>
  )
}

// ── Inner component: shows face/gaze/tab/audio status
// These values come from the exam store in real usage.
// For now accepts signals as props from parent.
export function SignalGrid({ signals = {} }) {
  const defaults = {
    face:  { val: 'DETECTED', cls: 'safe' },
    gaze:  { val: 'FORWARD',  cls: 'safe' },
    tab:   { val: 'ACTIVE',   cls: 'safe' },
    audio: { val: 'NORMAL',   cls: 'safe' },
    ...signals
  }
  return (
    <div className={styles.signalGrid}>
      {[
        { key: 'face',  name: 'FACE'  },
        { key: 'gaze',  name: 'GAZE'  },
        { key: 'tab',   name: 'TAB'   },
        { key: 'audio', name: 'AUDIO' },
      ].map(({ key, name }) => (
        <div key={key} className={styles.signalItem}>
          <div className={styles.signalName}>{name}</div>
          <div className={`${styles.signalVal} ${styles[defaults[key].cls]}`}>
            {defaults[key].val}
          </div>
        </div>
      ))}
    </div>
  )
}

export default RiskScoreGauge
