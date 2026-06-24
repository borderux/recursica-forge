/**
 * useVersionCheck
 *
 * Detects when a new version of the app has been deployed by polling the live
 * /index.html and comparing the fingerprinted main JS entry chunk filename
 * against the one that was present when the page first loaded.
 *
 * Vite content-hashes all JS chunks on every build, so the `index-[hash].js`
 * script src changes with every new deploy – making it a reliable staleness
 * signal with zero backend requirements.
 *
 * Disabled entirely in development (import.meta.env.DEV).
 *
 * Poll interval: 7 minutes.
 * When stale: visible = true on every subsequent poll cycle until the user
 * reloads the page.
 *
 * checkNow() can be called imperatively to trigger an immediate check (e.g.
 * after the user resets all changes – a natural moment to catch them up).
 * It is a no-op in dev mode.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

const POLL_INTERVAL_MS = 7 * 60 * 1000 // 7 minutes

function extractMainScriptSrc(html: string): string | null {
  const match = html.match(/src="(\/assets\/index-[^"]+\.js)"/)
  return match ? match[1] : null
}

function captureCurrentScriptSrc(): string | null {
  for (let i = 0; i < document.scripts.length; i++) {
    const src = document.scripts[i].src
    if (/\/assets\/index-[^/]+\.js$/.test(src)) {
      return new URL(src).pathname
    }
  }
  return null
}

export function useVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const bootSrcRef = useRef<string | null>(null)
  const dismissedRef = useRef(false)

  const checkNow = useCallback(async () => {
    if (import.meta.env.DEV) return
    dismissedRef.current = false
    try {
      const res = await fetch('/index.html', { cache: 'no-store' })
      if (!res.ok) return
      const html = await res.text()
      const latestSrc = extractMainScriptSrc(html)
      if (!latestSrc || !bootSrcRef.current) return
      if (latestSrc !== bootSrcRef.current) {
        setUpdateAvailable(true)
      }
    } catch {
      // Network failure – silently ignore, try again next poll cycle.
    }
  }, [])

  useEffect(() => {
    if (import.meta.env.DEV) return

    bootSrcRef.current = captureCurrentScriptSrc()

    const id = setInterval(checkNow, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [checkNow])

  const dismissUpdate = useCallback(() => {
    dismissedRef.current = true
    setUpdateAvailable(false)
  }, [])

  const simulateUpdate = import.meta.env.DEV
    ? () => setUpdateAvailable((prev) => !prev)
    : undefined

  return { updateAvailable, checkNow, dismissUpdate, simulateUpdate }
}
