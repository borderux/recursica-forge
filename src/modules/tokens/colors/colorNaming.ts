// Color naming utilities using NTC (Name That Color)

import { fallbackHueNameFromHex, toTitleCase } from './colorUtils'

let ntcReadyPromise: Promise<void> | null = null

function ensureNtcLoaded(): Promise<void> {
  if ((window as any).ntc) return Promise.resolve()
  if (ntcReadyPromise) return ntcReadyPromise
  ntcReadyPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://chir.ag/projects/ntc/ntc.js'
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load ntc.js'))
    document.head.appendChild(s)
  })
  return ntcReadyPromise
}

export async function getNtcName(hex: string): Promise<string> {
  try {
    await ensureNtcLoaded()
    const res = (window as any).ntc.name(hex)
    if (Array.isArray(res) && typeof res[1] === 'string') return res[1]
  } catch {}
  return hex.toUpperCase()
}

export async function getFriendlyNamePreferNtc(hex: string): Promise<string> {
  try {
    const label = await getNtcName(hex)
    if (label && label.trim() && !/^#/.test(label)) return toTitleCase(label.trim())
  } catch {}
  return toTitleCase(fallbackHueNameFromHex(hex))
}

