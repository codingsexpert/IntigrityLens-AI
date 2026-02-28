// src/services/api.js
// ─────────────────────────────────────────────
// MUKESH'S FILE
//
// ALL calls to the FastAPI backend live here.
// No component should ever write fetch() directly —
// they import and call these functions instead.
//
// Base URL is /api — Vite proxies this to localhost:8000
// (see vite.config.js)
// ─────────────────────────────────────────────
import axios from 'axios'

const BASE = '/api'

const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
})

// ── LOG a proctoring event to the backend
// Called every time a violation is detected.
// event = { event_type, severity, confidence, duration, label, timestamp }
export async function logEvent(event) {
  try {
    const res = await api.post('/log-event', event)
    return res.data
  } catch (err) {
    console.error('logEvent failed:', err)
    // Don't crash the exam if API is down — just log locally
    return null
  }
}

// ── GET the current report for a session
export async function getReport(sessionId) {
  try {
    const res = await api.get(`/report/${sessionId}`)
    return res.data
  } catch (err) {
    console.error('getReport failed:', err)
    return null
  }
}

// ── GET exam questions
export async function getQuestions() {
  try {
    const res = await api.get('/questions')
    return res.data
  } catch (err) {
    console.error('getQuestions failed:', err)
    // Return hardcoded fallback so exam still works if backend is down
    return FALLBACK_QUESTIONS
  }
}

// ── GENERATE and download PDF report
export async function downloadPDF(sessionId) {
  try {
    const res = await api.get(`/report/${sessionId}/pdf`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const a   = document.createElement('a')
    a.href    = url
    a.download = `IntegrityLens_${sessionId}.pdf`
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error('downloadPDF failed:', err)
    alert('PDF generation failed. Check that the backend is running.')
  }
}

// ── Fallback questions if backend is offline
const FALLBACK_QUESTIONS = [
  {
    id: 'q1',
    text: 'What is the time complexity of binary search?',
    options: ['O(n)', 'O(log n)', 'O(n²)', 'O(n log n)'],
    answer: 'B'
  },
  {
    id: 'q2',
    text: 'Which data structure uses LIFO ordering?',
    options: ['Queue', 'Linked List', 'Stack', 'Tree'],
    answer: 'C'
  },
  {
    id: 'q3',
    text: 'In a max-heap, which element is at the root?',
    options: ['Smallest', 'Median', 'Random', 'Largest'],
    answer: 'D'
  },
  {
    id: 'q4',
    text: 'Best algorithm for shortest path in a weighted graph?',
    options: ['Bubble Sort', "Dijkstra's", 'BFS only', 'DFS only'],
    answer: 'B'
  },
  {
    id: 'q5',
    text: 'Which sort has best average-case O(n log n)?',
    options: ['Bubble Sort', 'Selection Sort', 'Quick Sort', 'Insertion Sort'],
    answer: 'C'
  },
]
