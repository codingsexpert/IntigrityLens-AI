// src/hooks/useTabMonitor.js
// ─────────────────────────────────────────────
// CHANCHAL'S FILE — COMPLETE & WORKING
//
// Detects tab switching using the browser's native
// Page Visibility API. Zero external dependencies.
//
// Also detects window blur (user Alt+Tabs to another app)
// which face-api cannot catch.
//
// HOW TO USE:
//   const { tabSwitchCount, isTabActive } = useTabMonitor(onSwitchCallback)
// ─────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react'

function useTabMonitor(onSwitchCallback) {
  const [tabSwitchCount, setTabSwitchCount] = useState(0)
  const [isTabActive,    setIsTabActive]    = useState(true)
  const countRef    = useRef(0)
  const lastFired   = useRef(0)
  const COOLDOWN_MS = 2000  // don't fire twice within 2 seconds

  useEffect(() => {
    // ── Handler 1: Tab switch (Ctrl+T, clicking another browser tab)
    function handleVisibilityChange() {
      if (document.hidden) {
        setIsTabActive(false)
        triggerSwitch()
      } else {
        setIsTabActive(true)
      }
    }

    // ── Handler 2: Window blur (Alt+Tab to another app, opening DevTools)
    function handleWindowBlur() {
      if (!document.hidden) {
        // document is not hidden but window lost focus — Alt+Tab scenario
        setIsTabActive(false)
        triggerSwitch()
      }
    }

    function handleWindowFocus() {
      setIsTabActive(true)
    }

    function triggerSwitch() {
      const now = Date.now()
      if (now - lastFired.current < COOLDOWN_MS) return
      lastFired.current = now

      countRef.current += 1
      setTabSwitchCount(countRef.current)

      if (onSwitchCallback) {
        onSwitchCallback({
          event_type:  'TAB_SWITCH',
          severity:    'HIGH',
          confidence:  1.0,
          duration:    1,
          label:       'Tab switch / window focus lost',
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur',  handleWindowBlur)
    window.addEventListener('focus', handleWindowFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur',  handleWindowBlur)
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [onSwitchCallback])

  return { tabSwitchCount, isTabActive }
}

export default useTabMonitor
