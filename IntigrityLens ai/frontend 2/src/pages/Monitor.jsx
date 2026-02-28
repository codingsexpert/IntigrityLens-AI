// src/pages/Monitor.jsx
// ─────────────────────────────────────────────
// SHIVANGI'S PAGE
//
// Page 3: Admin/Institution dashboard.
// Shows all candidates, their risk scores, and event counts.
// ─────────────────────────────────────────────
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Monitor.module.css'

const CANDIDATES = [
  { name:'Mukesh R.',   initials:'MR', score:12, events:2,  status:'clear'  },
  { name:'Sana C.',     initials:'SC', score:54, events:7,  status:'review' },
  { name:'Arjun K.',    initials:'AK', score:82, events:15, status:'flagged'},
  { name:'Priya G.',    initials:'PG', score:8,  events:1,  status:'clear'  },
  { name:'Shivangi J.', initials:'SJ', score:38, events:4,  status:'review' },
]

const STATUS_LABEL = { clear:'CLEAR', review:'REVIEW', flagged:'FLAGGED' }
const STATUS_CLS   = { clear:'safe',  review:'warn',   flagged:'danger'  }

function Monitor() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all'
    ? CANDIDATES
    : CANDIDATES.filter(c => c.status === filter)

  return (
    <div className={`${styles.page} page-enter`}>
      <div className={styles.layout}>

        {/* Header */}
        <div className={styles.header}>
          <div>
            <div className={styles.title}>LIVE<br /><span>MONITOR</span></div>
            <div className={styles.sub}>ADMIN DASHBOARD — CS-401 ALGORITHMS EXAM — 28 FEB 2026</div>
          </div>
          <div className={styles.pills}>
            <div className={styles.pill}><span className={styles.dotSafe} /> 24 Active</div>
            <div className={styles.pill}><span className={styles.dotWarn} /> 3 Review</div>
            <div className={styles.pill}><span className={styles.dotDanger} /> 1 Flagged</div>
          </div>
        </div>

        {/* Metric cards */}
        <div className={styles.metricGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricIcon}>👥</div>
            <div className={styles.metricVal} style={{color:'var(--accent)'}}>28</div>
            <div className={styles.metricLabel}>Total Candidates</div>
            <div className={styles.metricTrend} style={{color:'var(--safe)'}}>↑ All verified pre-exam</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricIcon}>⚠️</div>
            <div className={styles.metricVal} style={{color:'var(--warn)'}}>47</div>
            <div className={styles.metricLabel}>Events Flagged (Total)</div>
            <div className={styles.metricTrend} style={{color:'var(--text-dim)'}}>Across all candidates</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricIcon}>🎯</div>
            <div className={styles.metricVal} style={{color:'var(--safe)'}}>91%</div>
            <div className={styles.metricLabel}>False Positive Reduction</div>
            <div className={styles.metricTrend} style={{color:'var(--safe)'}}>↑ vs. rule-based systems</div>
          </div>
        </div>

        {/* Candidates table */}
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <div className={styles.tableTitle}>CANDIDATE RISK OVERVIEW</div>
            <div className={styles.filters}>
              {['all','review','flagged'].map(f => (
                <button
                  key={f}
                  className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <table className={styles.table}>
            <thead>
              <tr>
                <th>CANDIDATE</th>
                <th>RISK SCORE</th>
                <th>EVENTS</th>
                <th>STATUS</th>
                <th>SCORE BAR</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => {
                const cls = STATUS_CLS[c.status]
                return (
                  <tr key={i}>
                    <td>
                      <div className={styles.candidateName}>
                        <div className={styles.avatar}>{c.initials}</div>
                        {c.name}
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.riskBadge} ${styles[cls]}`}>
                        {c.score} — {c.status.toUpperCase()}
                      </span>
                    </td>
                    <td className={styles.mono}>{c.events} events</td>
                    <td>
                      <span className={`tag tag-${cls}`}>● {STATUS_LABEL[c.status]}</span>
                    </td>
                    <td>
                      <div className={styles.miniBar}>
                        <div className={styles.miniBarFill} style={{
                          width: c.score + '%',
                          background: c.status === 'clear' ? 'var(--safe)' : c.status === 'review' ? 'var(--warn)' : 'var(--danger)'
                        }} />
                      </div>
                    </td>
                    <td>
                      <button
                        className={styles.actionBtn}
                        onClick={() => navigate('/report')}
                      >
                        Report →
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}

export default Monitor
