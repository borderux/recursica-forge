// Color naming utilities using NTC (Name That Color)

// Bundled from npm instead of loaded from chir.ag at runtime, so no third-party script runs on the page.
import ntc from 'ntcjs'
import { fallbackHueNameFromHex, toTitleCase } from '../tokens/colors/colorUtils'

export async function getNtcName(hex: string): Promise<string> {
  try {
    const res = ntc.name(hex)
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

