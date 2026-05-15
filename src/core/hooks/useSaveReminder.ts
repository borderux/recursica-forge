/**
 * useSaveReminder
 *
 * Surfaces a "you have unsaved changes" reminder when:
 *   - 100 cssVarsUpdated batches have accumulated since the last export, OR
 *   - 30 minutes have passed since the first post-export change
 *     AND at least one change has been made.
 *
 * State is persisted in sessionStorage so a page refresh doesn't reset the
 * counter. It resets fully on export or on the "Reset all" action.
 *
 * Call resetSaveReminder() after a successful export.
 * Call resetSaveReminder() after a full reset-all.
 */

import { useEffect, useRef, useState, useCallback } from 'react'

const STORAGE_KEY_COUNT   = 'recursica_reminder_change_count'
const STORAGE_KEY_START   = 'recursica_reminder_session_start'
const CHANGE_THRESHOLD    = 100
const TIME_THRESHOLD_MS   = 30 * 60 * 1000  // 30 minutes

function readCount(): number {
  try { return parseInt(sessionStorage.getItem(STORAGE_KEY_COUNT) ?? '0', 10) || 0 } catch { return 0 }
}
function readStart(): number {
  try { return parseInt(sessionStorage.getItem(STORAGE_KEY_START) ?? '0', 10) || 0 } catch { return 0 }
}
function writeCount(n: number) {
  try { sessionStorage.setItem(STORAGE_KEY_COUNT, String(n)) } catch { /* noop */ }
}
function writeStart(t: number) {
  try { sessionStorage.setItem(STORAGE_KEY_START, String(t)) } catch { /* noop */ }
}
function clearStorage() {
  try {
    sessionStorage.removeItem(STORAGE_KEY_COUNT)
    sessionStorage.removeItem(STORAGE_KEY_START)
  } catch { /* noop */ }
}

export function useSaveReminder(onExport: () => void) {
  const [visible, setVisible] = useState(false)

  // Threshold snapshot at the moment the reminder was last shown.
  // When dismissed the reminder rearms at the NEXT threshold crossing.
  const lastShownAtRef = useRef<{ count: number; time: number }>({ count: 0, time: 0 })

  const maybeTrigger = useCallback(() => {
    const count = readCount()
    const start = readStart()
    const now   = Date.now()

    const countThresholdCrossed = count > 0 && count % CHANGE_THRESHOLD === 0
    const timeThresholdCrossed  = start > 0 && count > 0 && (now - start) >= TIME_THRESHOLD_MS

    if (!countThresholdCrossed && !timeThresholdCrossed) return

    // Don't re-show for the same crossing we already showed
    const alreadyShown =
      countThresholdCrossed && lastShownAtRef.current.count === count ||
      timeThresholdCrossed  && lastShownAtRef.current.time  === Math.floor((now - start) / TIME_THRESHOLD_MS)

    if (!alreadyShown) {
      lastShownAtRef.current = {
        count: countThresholdCrossed ? count : lastShownAtRef.current.count,
        time:  timeThresholdCrossed  ? Math.floor((now - start) / TIME_THRESHOLD_MS) : lastShownAtRef.current.time,
      }
      setVisible(true)
    }
  }, [])

  useEffect(() => {
    const handleChange = () => {
      const prev  = readCount()
      const count = prev + 1
      writeCount(count)

      // Record the start of this editing session (first change after export/reset)
      if (prev === 0) writeStart(Date.now())

      maybeTrigger()
    }

    window.addEventListener('cssVarsUpdated', handleChange)
    return () => window.removeEventListener('cssVarsUpdated', handleChange)
  }, [maybeTrigger])

  // Dev convenience: ?remind=1 immediately shows the toast for testing.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('remind') === '1') {
      setVisible(true)
      params.delete('remind')
      const clean = params.toString()
      window.history.replaceState(null, '', window.location.pathname + (clean ? `?${clean}` : ''))
    }
  }, [])

  // Re-check time threshold on a regular tick (every 60 s) so the reminder
  // fires even when the user is editing slowly but continuously.
  useEffect(() => {
    const id = setInterval(maybeTrigger, 60_000)
    return () => clearInterval(id)
  }, [maybeTrigger])

  const dismiss = useCallback(() => {
    setVisible(false)
  }, [])

  const handleExport = useCallback(() => {
    setVisible(false)
    onExport()
  }, [onExport])

  const resetSaveReminder = useCallback(() => {
    clearStorage()
    lastShownAtRef.current = { count: 0, time: 0 }
    setVisible(false)
  }, [])

  return { visible, dismiss, handleExport, resetSaveReminder }
}
