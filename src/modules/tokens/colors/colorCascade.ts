import { clamp, hexToHsv, hsvToHex } from './colorUtils'

export const LEVELS_ASC = [0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]
export const IDX_MAP: Record<number, number> = { 0: 0, 50: 1, 100: 2, 200: 3, 300: 4, 400: 5, 500: 6, 600: 7, 700: 8, 800: 9, 900: 10, 1000: 11 }

export function parseLevel(levelStr: string): number {
  if (levelStr === '000') return 0
  if (levelStr === '050') return 50
  const n = Number(levelStr)
  return Number.isFinite(n) ? n : NaN
}

export function cascadeColor(
  tokenName: string,
  hex: string,
  cascadeDown: boolean,
  cascadeUp: boolean,
  onChange: (name: string, hex: string) => void
): void {
  const parts = tokenName.split('/')
  if (parts.length !== 3) return
  
  // Detect whether token uses "color" (singular) or "colors" (plural) format
  const category = parts[0] // "color" or "colors"
  const family = parts[1]
  const levelStrRaw = parts[2]
  const levelNum = parseLevel(levelStrRaw)
  if (!Number.isFinite(levelNum)) return

  const baseHsv = hexToHsv(hex)
  const startIdx = IDX_MAP[levelNum]
  if (startIdx === undefined) return

  const endS000 = 0.02
  const endV000 = 0.98
  const endS1000 = clamp(baseHsv.s * 1.2, 0, 1)
  const endV1000 = clamp(Math.max(0.03, baseHsv.v * 0.08), 0, 1)
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t

  if (cascadeDown && startIdx > 0) {
    const span = startIdx
    for (let i = startIdx - 1; i >= 0; i -= 1) {
      const t = i / span
      const s = clamp(lerp(endS000, baseHsv.s, t), 0, 1)
      const v = clamp(lerp(endV000, baseHsv.v, t), 0, 1)
      // Preserve the original category format (color or colors)
      const name = `${category}/${family}/${String(LEVELS_ASC[i]).padStart(3, '0')}`
      const nextHex = hsvToHex(baseHsv.h, s, v)
      onChange(name, nextHex)
    }
  }

  if (cascadeUp && startIdx < LEVELS_ASC.length - 1) {
    const span = (LEVELS_ASC.length - 1) - startIdx
    for (let i = startIdx + 1; i < LEVELS_ASC.length; i += 1) {
      const t = (i - startIdx) / span
      const s = clamp(lerp(baseHsv.s, endS1000, t), 0, 1)
      const v = clamp(lerp(baseHsv.v, endV1000, t), 0, 1)
      // Preserve the original category format (color or colors)
      const name = `${category}/${family}/${String(LEVELS_ASC[i]).padStart(3, '0')}`
      const nextHex = hsvToHex(baseHsv.h, s, v)
      onChange(name, nextHex)
    }
  }
}

export function computeLevel500Hex(
  tokenName: string,
  hex: string,
  levelNum: number,
  cascadeDown: boolean,
  cascadeUp: boolean,
  startIdx: number,
  values: Record<string, string | number>
): string | undefined {
  const parts = tokenName.split('/')
  if (parts.length !== 3) return undefined
  // Detect whether token uses "color" (singular) or "colors" (plural) format
  const category = parts[0] // "color" or "colors"
  const family = parts[1]

  const normHex = (h: string | undefined) => {
    if (!h) return undefined
    const m = h.match(/^#?[0-9a-fA-F]{6}$/)
    if (!m) return undefined
    return h.startsWith('#') ? h.toLowerCase() : (`#${h}`).toLowerCase()
  }

  const baseHsv = hexToHsv(hex)
  const targetIdx = 6 // 500 level index
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t

  if (levelNum === 500) {
    return normHex(hex)
  }

  // If cascade touched 500, compute it consistently with the interpolation
  if (cascadeDown && targetIdx < startIdx) {
    const t = targetIdx / startIdx
    const s = clamp(lerp(0.02, baseHsv.s, t), 0, 1)
    const v = clamp(lerp(0.98, baseHsv.v, t), 0, 1)
    return hsvToHex(baseHsv.h, s, v)
  } else if (cascadeUp && targetIdx > startIdx) {
    const span = (LEVELS_ASC.length - 1) - startIdx
    const t = (targetIdx - startIdx) / span
    const s = clamp(lerp(baseHsv.s, clamp(baseHsv.s * 1.2, 0, 1), t), 0, 1)
    const v = clamp(lerp(baseHsv.v, clamp(Math.max(0.03, baseHsv.v * 0.08), 0, 1), t), 0, 1)
    return hsvToHex(baseHsv.h, s, v)
  } else {
    // Preserve the original category format (color or colors)
    const fiveKey = `${category}/${family}/500`
    return normHex(String(values[fiveKey] as any))
  }
}

