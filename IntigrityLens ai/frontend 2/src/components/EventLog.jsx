// src/components/EventLog.jsx
// ─────────────────────────────────────────────
// Live-updating list of flagged proctoring events.
// New events slide in from the top.
// Props:
//   events  (array)  — from examStore
// ─────────────────────────────────────────────
import React from 'react'
import styles from './EventLog.module.css'

function EventLog({ events = [] }) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>FLAGGED EVENTS</span>
        <span className={styles.count}>{events.length}</span>
      </div>

      <div className={styles.list}>
        {events.length === 0 ? (
          <div className={styles.empty}>No violations detected</div>
        ) : (
          // Show newest first
          [...events].reverse().map((ev, i) => (
            <div
              key={i}
              className={`${styles.item} ${styles[ev.severity?.toLowerCase()]}`}
            >
              <div className={styles.time}>{ev.timestamp}</div>
              <div className={styles.body}>
                <div className={styles.desc}>{ev.label}</div>
                <div className={`${styles.sev} ${styles[ev.severity?.toLowerCase() === 'high' ? 'sevHigh' : 'sevLow']}`}>
                  {ev.severity} · conf {parseFloat(ev.confidence).toFixed(2)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default EventLog
