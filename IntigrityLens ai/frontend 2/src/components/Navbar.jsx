// src/components/Navbar.jsx
// ─────────────────────────────────────────────
// The top navigation bar shown on every page.
// Shows the logo, step indicators, and live status badge.
// ─────────────────────────────────────────────
import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import styles from './Navbar.module.css'

const STEPS = [
  { id: 'verify',  label: 'VERIFY'  },
  { id: 'exam',    label: 'EXAM'    },
  { id: 'monitor', label: 'MONITOR' },
  { id: 'report',  label: 'REPORT'  },
]

function Navbar() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const current   = location.pathname.replace('/', '') // e.g. "exam"

  // A step is "done" if it comes before the current step
  const currentIdx = STEPS.findIndex(s => s.id === current)

  return (
    <nav className={styles.nav}>
      {/* LOGO */}
      <div className={styles.logo}>
        <div className={styles.logoIcon} />
        INTEGRITYLENS
        <span className={styles.logoBadge}>AI</span>
      </div>

      {/* STEP INDICATORS */}
      <div className={styles.steps}>
        {STEPS.map((step, idx) => {
          const isActive = step.id === current
          const isDone   = idx < currentIdx
          return (
            <button
              key={step.id}
              className={`${styles.stepItem} ${isActive ? styles.active : ''} ${isDone ? styles.done : ''}`}
              onClick={() => navigate('/' + step.id)}
            >
              <span className={styles.stepDot} />
              {step.label}
            </button>
          )
        })}
      </div>

      {/* LIVE BADGE */}
      <span className="tag tag-accent">● LIVE SESSION</span>
    </nav>
  )
}

export default Navbar
