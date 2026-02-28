// src/hooks/useAudioMonitor.js
// ─────────────────────────────────────────────
// CHANCHAL'S FILE — COMPLETE & WORKING
//
// Monitors microphone using Web Audio API.
// Detects sudden volume spikes (whispering, phone calls, etc.)
// Uses a rolling baseline so normal ambient noise is ignored.
//
// HOW TO USE:
//   const { audioLevel, isListening, startListening, stopListening }
//     = useAudioMonitor(onSpikeCallback)
// ─────────────────────────────────────────────
import { useState, useRef, useCallback } from 'react'

const SPIKE_MULTIPLIER = 2.5   // spike = current volume is 2.5x the baseline
const MIN_SPIKE_LEVEL  = 20    // don't fire below this absolute level (avoids silent room noise)
const COOLDOWN_MS      = 5000  // minimum gap between spike events
const BASELINE_SAMPLES = 30    // rolling average over last 30 readings

function useAudioMonitor(onSpikeCallback) {
  const [audioLevel,  setAudioLevel]  = useState(0)
  const [isListening, setIsListening] = useState(false)

  const streamRef       = useRef(null)
  const audioCtxRef     = useRef(null)
  const animFrameRef    = useRef(null)
  const lastSpikeRef    = useRef(0)
  const baselineRef     = useRef([])   // rolling array of recent levels

  const startListening = useCallback(async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false,  // we WANT to detect noise
          sampleRate: 44100
        },
        video: false
      })
      streamRef.current = stream

      // Set up Web Audio API analyser
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      const source   = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize            = 256
      analyser.smoothingTimeConstant = 0.8  // smoothing for stable readings
      source.connect(analyser)
      audioCtxRef.current = audioCtx

      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      function measure() {
        analyser.getByteFrequencyData(dataArray)

        // Average across all frequency bins → normalize 0-100
        const sum = dataArray.reduce((a, b) => a + b, 0)
        const avg = sum / dataArray.length
        const level = Math.round((avg / 255) * 100)
        setAudioLevel(level)

        // Update rolling baseline
        baselineRef.current.push(level)
        if (baselineRef.current.length > BASELINE_SAMPLES) {
          baselineRef.current.shift()
        }

        // Calculate baseline average (ignore top 20% to exclude spikes from baseline)
        const sorted    = [...baselineRef.current].sort((a, b) => a - b)
        const cutoff    = Math.floor(sorted.length * 0.8)
        const baseSamples = sorted.slice(0, cutoff)
        const baseline  = baseSamples.reduce((a, b) => a + b, 0) / (baseSamples.length || 1)

        // Detect spike: current level is much higher than baseline
        const now = Date.now()
        const isSpike = level > MIN_SPIKE_LEVEL &&
                        level > baseline * SPIKE_MULTIPLIER &&
                        (now - lastSpikeRef.current) > COOLDOWN_MS

        if (isSpike) {
          lastSpikeRef.current = now
          const severity = level > 60 ? 'HIGH' : 'LOW'
          if (onSpikeCallback) {
            onSpikeCallback({
              event_type:  'AUDIO_SPIKE',
              severity,
              confidence:  parseFloat(Math.min(level / 100, 0.99).toFixed(2)),
              duration:    1,
              label:       `Audio spike detected (level: ${level})`,
            })
          }
        }

        animFrameRef.current = requestAnimationFrame(measure)
      }

      measure()
      setIsListening(true)
      console.log('🎤 Audio monitoring started')

    } catch (err) {
      // Microphone denied — exam still works, just without audio monitoring
      console.warn('🎤 Microphone access denied:', err.message)
    }
  }, [onSpikeCallback])

  const stopListening = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close()
    }
    setIsListening(false)
    setAudioLevel(0)
    console.log('🎤 Audio monitoring stopped')
  }, [])

  return { audioLevel, isListening, startListening, stopListening }
}

export default useAudioMonitor
