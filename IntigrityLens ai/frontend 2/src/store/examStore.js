// store/examStore.js
// This is the shared brain of the app.
// Any component can import these to read or update global state.

import { useState, useCallback } from 'react';

// ── Default state shape ──────────────────────────────────────────
const initialState = {
  candidateName: 'Candidate',
  examStartTime: null,
  riskScore: 0,
  events: [],          // array of { id, event_type, severity, confidence, timestamp, description }
  faceCount: 1,
  gazeDirection: 'CENTER',
  tabSwitches: 0,
  audioSpikes: 0,
  examComplete: false,
  answers: {},         // { questionId: selectedOption }
};

// ── Singleton state (module-level so it persists across re-renders) ──
let _state = { ...initialState };
let _listeners = [];

function notify() {
  _listeners.forEach(fn => fn({ ..._state }));
}

// ── Public API ───────────────────────────────────────────────────

export function getState() {
  return { ..._state };
}

export function setCandidateName(name) {
  _state.candidateName = name;
  notify();
}

export function startExam() {
  _state.examStartTime = new Date().toISOString();
  notify();
}

export function completeExam() {
  _state.examComplete = true;
  notify();
}

export function setAnswer(questionId, option) {
  _state.answers[questionId] = option;
  notify();
}

// ── The core: log a violation event ─────────────────────────────
export function logEvent(event_type, severity = 'LOW', confidence = 1.0, description = '') {
  const WEIGHTS = {
    MULTIPLE_FACES:    40,
    TAB_SWITCH:        25,
    FACE_NOT_DETECTED: 20,
    AUDIO_SPIKE:       15,
    GAZE_DEVIATION:    10,
  };

  const weight   = WEIGHTS[event_type] || 5;
  const modifier = severity === 'HIGH' ? 1.2 : severity === 'MEDIUM' ? 1.0 : 0.7;
  const delta    = weight * confidence * modifier;

  const newEvent = {
    id: Date.now(),
    event_type,
    severity,
    confidence,
    description,
    timestamp: new Date().toISOString(),
  };

  _state.events = [..._state.events, newEvent];
  _state.riskScore = Math.min(100, Math.round(_state.riskScore + delta));

  // Update counters
  if (event_type === 'TAB_SWITCH')        _state.tabSwitches += 1;
  if (event_type === 'AUDIO_SPIKE')       _state.audioSpikes += 1;
  if (event_type === 'MULTIPLE_FACES')    _state.faceCount = 2;
  if (event_type === 'FACE_NOT_DETECTED') _state.faceCount = 0;

  notify();

  // Also send to backend (non-blocking)
  fetch('http://localhost:8000/log-event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newEvent),
  }).catch(() => {}); // silently ignore if backend not running

  return newEvent;
}

export function setFaceCount(count) {
  _state.faceCount = count;
  notify();
}

export function setGazeDirection(dir) {
  _state.gazeDirection = dir;
  notify();
}

// ── React hook to subscribe to store ────────────────────────────
export function useExamStore() {
  const [state, setState] = useState({ ..._state });

  const subscribe = useCallback((listener) => {
    _listeners.push(listener);
    return () => { _listeners = _listeners.filter(l => l !== listener); };
  }, []);

  useState(() => {
    const unsub = subscribe(setState);
    return unsub;
  });

  return state;
}
