// src/pages/Exam.jsx
// Exam page — connects Shivangi's UI with Chanchal's AI hooks
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import RiskScoreGauge  from '../components/RiskScoreGauge.jsx'
import EventLog         from '../components/EventLog.jsx'
import AlertBanner      from '../components/AlertBanner.jsx'
import WebcamFeed       from '../components/WebcamFeed.jsx'   // ← Chanchal's component
import useTabMonitor    from '../hooks/useTabMonitor.js'
import useAudioMonitor  from '../hooks/useAudioMonitor.js'
import { logEvent }     from '../services/api.js'
import styles           from './Exam.module.css'

const QUESTIONS = [
  { id:'q1', text:'What is the time complexity of binary search on a sorted array of n elements?',
    options:['O(n)', 'O(log n)', 'O(n²)', 'O(n log n)'], answer:'B' },
  { id:'q2', text:'Which data structure uses LIFO (Last In First Out) ordering?',
    options:['Queue', 'Linked List', 'Stack', 'Tree'], answer:'C' },
  { id:'q3', text:'In a max-heap, which element is always at the root?',
    options:['The smallest element', 'The median element', 'A random element', 'The largest element'], answer:'D' },
  { id:'q4', text:"What algorithm is best for shortest path in a weighted graph?",
    options:["Bubble Sort", "Dijkstra's Algorithm", "BFS only", "DFS only"], answer:'B' },
  { id:'q5', text:'Which sorting algorithm has the best average-case time complexity?',
    options:['Bubble Sort — O(n²)', 'Selection Sort — O(n²)', 'Quick Sort — O(n log n)', 'Insertion Sort — O(n²)'], answer:'C' },
]

const TOTAL_TIME = 28 * 60

function Exam() {
  const navigate = useNavigate()
  const [currentQ,  setCurrentQ]  = useState(0)
  const [answers,   setAnswers]   = useState({})
  const [timeLeft,  setTimeLeft]  = useState(TOTAL_TIME)
  const [riskScore, setRiskScore] = useState(0)
  const [events,    setEvents]    = useState([])
  const [signals,   setSignals]   = useState({})
  const [alert,     setAlert]     = useState({ visible: false, message: '' })
  const examStartRef = useRef(Date.now())

  // ── Timestamp helper
  function getTimestamp() {
    const elapsed = Math.floor((Date.now() - examStartRef.current) / 1000)
    const mm = String(Math.floor(elapsed / 60)).padStart(2,'0')
    const ss = String(elapsed % 60).padStart(2,'0')
    return `${mm}:${ss}`
  }

  // ── Central event handler — called by ALL 3 of Chanchal's hooks
  const WEIGHTS = { MULTIPLE_FACES:40, TAB_SWITCH:25, FACE_NOT_DETECTED:20, GAZE_DEVIATION:10, AUDIO_SPIKE:15 }

  const addEvent = useCallback((ev) => {
    const eventWithTime = { ...ev, timestamp: getTimestamp() }
    const w   = WEIGHTS[ev.event_type] || 5
    const mod = ev.severity === 'HIGH' ? 1.2 : ev.severity === 'MEDIUM' ? 1.0 : 0.7
    const inc = w * (ev.duration || 1) * parseFloat(ev.confidence || 1) * mod
    setRiskScore(prev => Math.min(100, Math.round(prev + inc)))
    setEvents(prev => [...prev, eventWithTime])
    logEvent(eventWithTime)
    showAlert(ev.label || ev.event_type)
  }, [])

  function showAlert(msg) {
    setAlert({ visible: true, message: msg })
    setTimeout(() => setAlert({ visible: false, message: '' }), 3500)
  }

  // ── TAB MONITOR — Chanchal's hook
  useTabMonitor(useCallback((ev) => {
    addEvent(ev)
    setSignals(s => ({ ...s, tab: { val: 'SWITCHED', cls: 'danger' } }))
    setTimeout(() => setSignals(s => ({ ...s, tab: { val: 'ACTIVE', cls: 'safe' } })), 3000)
  }, [addEvent]))

  // ── AUDIO MONITOR — Chanchal's hook
  const { startListening } = useAudioMonitor(useCallback((ev) => {
    addEvent(ev)
    setSignals(s => ({ ...s, audio: { val: 'SPIKE!', cls: 'danger' } }))
    setTimeout(() => setSignals(s => ({ ...s, audio: { val: 'NORMAL', cls: 'safe' } })), 3000)
  }, [addEvent]))

  useEffect(() => { startListening() }, [])

  // ── FACE VIOLATION HANDLER — passed into WebcamFeed → useFaceDetection
  const handleFaceViolation = useCallback((ev) => {
    addEvent(ev)

    // Update the correct signal indicator
    if (ev.event_type === 'MULTIPLE_FACES') {
      setSignals(s => ({ ...s, face: { val: 'MULTIPLE!', cls: 'danger' } }))
      setTimeout(() => setSignals(s => ({ ...s, face: { val: 'DETECTED', cls: 'safe' } })), 4000)
    }
    if (ev.event_type === 'FACE_NOT_DETECTED') {
      setSignals(s => ({ ...s, face: { val: 'MISSING!', cls: 'danger' } }))
      setTimeout(() => setSignals(s => ({ ...s, face: { val: 'DETECTED', cls: 'safe' } })), 4000)
    }
    if (ev.event_type === 'GAZE_DEVIATION') {
      setSignals(s => ({ ...s, gaze: { val: ev.label.includes('left') ? 'LEFT' : 'RIGHT', cls: 'warn' } }))
      setTimeout(() => setSignals(s => ({ ...s, gaze: { val: 'FORWARD', cls: 'safe' } })), 4000)
    }
  }, [addEvent])

  // ── Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timer); handleSubmit(); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const mm = String(Math.floor(timeLeft / 60)).padStart(2,'0')
  const ss = String(timeLeft % 60).padStart(2,'0')
  const timerCls = timeLeft < 300 ? styles.timerWarn : timeLeft < 60 ? styles.timerDanger : ''

  function handleAnswer(optionIndex) {
    const letter = ['A','B','C','D'][optionIndex]
    setAnswers(prev => ({ ...prev, [QUESTIONS[currentQ].id]: letter }))
  }
  function nextQ()  { if (currentQ < QUESTIONS.length - 1) setCurrentQ(q => q + 1) }
  function prevQ()  { if (currentQ > 0) setCurrentQ(q => q - 1) }
  function handleSubmit() {
    sessionStorage.setItem('examEvents',    JSON.stringify(events))
    sessionStorage.setItem('examRiskScore', riskScore)
    navigate('/report')
  }

  const q        = QUESTIONS[currentQ]
  const selected = answers[q.id]
  const progress = ((currentQ + 1) / QUESTIONS.length) * 100

  return (
    <div className={`${styles.page} page-enter`}>
      <AlertBanner visible={alert.visible} message={alert.message} />

      <div className={styles.layout}>
        {/* LEFT: Questions */}
        <div className={styles.main}>
          <div className={styles.examHeader}>
            <div>
              <div className={styles.examTitle}>EXAM SESSION</div>
              <div className={styles.examSub}>CANDIDATE: MUKESH R. &nbsp;|&nbsp; CS-401 ALGORITHMS</div>
            </div>
            <div className={`${styles.timer} ${timerCls}`}>{mm}:{ss}</div>
          </div>

          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: progress + '%' }} />
          </div>

          <div className={styles.questionCard}>
            <div className={styles.qNumber}>QUESTION {currentQ + 1} / {QUESTIONS.length}</div>
            <div className={styles.qText}>{q.text}</div>
            <div className={styles.options}>
              {q.options.map((opt, i) => {
                const letter = ['A','B','C','D'][i]
                return (
                  <div
                    key={i}
                    className={`${styles.option} ${selected === letter ? styles.selected : ''}`}
                    onClick={() => handleAnswer(i)}
                  >
                    <span className={styles.optLetter}>{letter}</span>
                    {opt}
                  </div>
                )
              })}
            </div>
          </div>

          <div className={styles.examNav}>
            <button className={styles.navBtn} onClick={prevQ} disabled={currentQ === 0}>← Prev</button>
            <button className={`${styles.navBtn} ${styles.primary}`} onClick={nextQ} disabled={currentQ === QUESTIONS.length - 1}>Next →</button>
            <button className={`${styles.navBtn} ${styles.endBtn}`} onClick={handleSubmit}>Submit Exam</button>
          </div>
        </div>

        {/* RIGHT: Monitoring Sidebar */}
        <div className={styles.sidebar}>
          <RiskScoreGauge score={riskScore} signals={signals} />

          {/* ── WebcamFeed: Chanchal's component, fully wired */}
          <WebcamFeed
            onViolation={handleFaceViolation}
            compact={true}
          />

          <EventLog events={events} />
        </div>
      </div>
    </div>
  )
}

export default Exam
