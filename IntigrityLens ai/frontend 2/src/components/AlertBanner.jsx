// src/components/AlertBanner.jsx
// ─────────────────────────────────────────────
// Fixed banner that slides down from top when
// a violation is detected during the exam.
// Props:
//   message (string)   — alert text
//   visible (boolean)  — show/hide
// ─────────────────────────────────────────────
import React from 'react'
import styles from './AlertBanner.module.css'

function AlertBanner({ message = '', visible = false }) {
  return (
    <div className={`${styles.banner} ${visible ? styles.show : ''}`}>
      <span className={styles.icon}>⚠</span>
      <span>{message}</span>
    </div>
  )
}

export default AlertBanner
