import React, { createContext, useContext, useReducer } from 'react'

const initialState = {
  candidateName: 'Mukesh R.',
  examName: 'CS-401 Algorithms',
  sessionId: 'IL-2026-00342',
  riskScore: 0,
  events: [],
  answers: {},
  examStarted: false,
  examFinished: false,
  timerSeconds: 28 * 60,
  signals: {
    face:  { val: 'DETECTED', cls: 'safe' },
    gaze:  { val: 'FORWARD',  cls: 'safe' },
    tab:   { val: 'ACTIVE',   cls: 'safe' },
    audio: { val: 'NORMAL',   cls: 'safe' },
  }
}

const WEIGHTS = {
  MULTIPLE_FACES: 40, TAB_SWITCH: 25,
  FACE_NOT_DETECTED: 20, GAZE_DEVIATION: 10, AUDIO_SPIKE: 15,
}

function calcIncrement(event) {
  const w   = WEIGHTS[event.event_type] || 5
  const dur = event.duration || 1
  const con = parseFloat(event.confidence) || 1.0
  const mod = event.severity === 'HIGH' ? 1.2 : event.severity === 'MEDIUM' ? 1.0 : 0.7
  return w * dur * con * mod
}

function reducer(state, action) {
  switch (action.type) {
    case 'START_EXAM':    return { ...state, examStarted: true }
    case 'FINISH_EXAM':   return { ...state, examFinished: true }
    case 'SET_ANSWER':    return { ...state, answers: { ...state.answers, [action.payload.qId]: action.payload.answer } }
    case 'TICK_TIMER':    return { ...state, timerSeconds: Math.max(0, state.timerSeconds - 1) }
    case 'LOG_EVENT': {
      const inc      = calcIncrement(action.payload)
      const newScore = Math.min(100, Math.round(state.riskScore + inc))
      return { ...state, riskScore: newScore, events: [...state.events, action.payload] }
    }
    case 'UPDATE_SIGNAL':
      return { ...state, signals: { ...state.signals, [action.payload.key]: { val: action.payload.val, cls: action.payload.cls } } }
    case 'RESET': return { ...initialState }
    default: return state
  }
}

const ExamContext = createContext(null)

export function ExamProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return <ExamContext.Provider value={{ state, dispatch }}>{children}</ExamContext.Provider>
}

export function useExam() {
  const ctx = useContext(ExamContext)
  if (!ctx) throw new Error('useExam must be inside ExamProvider')
  return ctx
}
