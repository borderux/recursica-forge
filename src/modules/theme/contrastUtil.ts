// Contrast utilities and AA helpers
export type PaletteStep = { level: string; hex: string }

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  try {
    let h = (hex || '').trim()
    if (!h) return null
    if (!h.startsWith('#')) h = `#${h}`
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h)
    if (!m) return null
    return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
  } catch { return null }
}

export function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex)
  if (!rgb) return 0
  const srgb = [rgb.r, rgb.g, rgb.b].map((c) => c / 255)
  const lin = srgb.map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))) as number[]
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]
}

export function contrastRatio(hex1?: string, hex2?: string): number {
  if (!hex1 || !hex2) return 0
  const L1 = relativeLuminance(hex1)
  const L2 = relativeLuminance(hex2)
  const lighter = Math.max(L1, L2)
  const darker = Math.min(L1, L2)
  return (lighter + 0.05) / (darker + 0.05)
}

// Choose black/white that best satisfies WCAG AA (4.5:1); if neither meets, choose higher contrast
export function pickAAOnTone(toneHex?: string): string {
  const black = '#000000'
  const white = '#ffffff'
  if (!toneHex) return black
  const cBlack = contrastRatio(toneHex, black)
  const cWhite = contrastRatio(toneHex, white)
  const AA = 4.5
  if (cBlack >= AA && cWhite >= AA) return cBlack >= cWhite ? black : white
  if (cBlack >= AA) return black
  if (cWhite >= AA) return white
  return cBlack >= cWhite ? black : white
}

// Given a background hex and a set of steps (levels) for a palette family,
// return the first AA-compliant step based on preferred order, else the step with max contrast.
export function pickAAColorStepInFamily(
  bgHex: string,
  steps: Array<PaletteStep>,
  preferredLevel?: string
): PaletteStep {
  const AA = 4.5
  const byLevel: Record<string, PaletteStep> = {}
  steps.forEach((s) => { byLevel[s.level] = s })
  if (preferredLevel && byLevel[preferredLevel]) {
    const s = byLevel[preferredLevel]
    if (contrastRatio(bgHex, s.hex) >= AA) return s
  }
  const compliant = steps.find((s) => contrastRatio(bgHex, s.hex) >= AA)
  if (compliant) return compliant
  // fallback: pick the highest contrast step
  let best = steps[0] || { level: '', hex: '#000000' }
  let bestC = -1
  steps.forEach((s) => {
    const c = contrastRatio(bgHex, s.hex)
    if (c > bestC) { best = s; bestC = c }
  })
  return best
}


