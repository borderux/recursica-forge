// Color utility functions

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let h = (hex || '').trim()
  if (!h.startsWith('#')) h = '#' + h
  if (h.length === 4) {
    const r = h[1], g = h[2], b = h[3]
    h = `#${r}${r}${g}${g}${b}${b}`
  }
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h)
  if (!m) return { r: 0, g: 0, b: 0 }
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
}

export function rgbToHexSafe(r: number, g: number, b: number): string {
  const toHex = (v: number) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

export function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d === 0) h = 0
  else if (max === r) h = ((g - b) / d + (g < b ? 6 : 0))
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  h *= 60
  const s = max === 0 ? 0 : d / max
  const v = max
  return { h, s, v }
}

export function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  let r1 = 0, g1 = 0, b1 = 0
  if (0 <= h && h < 60) { r1 = c; g1 = x; b1 = 0 }
  else if (60 <= h && h < 120) { r1 = x; g1 = c; b1 = 0 }
  else if (120 <= h && h < 180) { r1 = 0; g1 = c; b1 = x }
  else if (180 <= h && h < 240) { r1 = 0; g1 = x; b1 = c }
  else if (240 <= h && h < 300) { r1 = x; g1 = 0; b1 = c }
  else { r1 = c; g1 = 0; b1 = x }
  const r = (r1 + m) * 255
  const g = (g1 + m) * 255
  const b = (b1 + m) * 255
  return { r, g, b }
}

export function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const { r, g, b } = hexToRgb(hex)
  return rgbToHsv(r, g, b)
}

export function hsvToHex(h: number, s: number, v: number): string {
  const { r, g, b } = hsvToRgb(h, s, v)
  return rgbToHexSafe(r, g, b)
}

export function toTitleCase(label: string): string {
  return (label || '').replace(/[-_/]+/g, ' ').replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()).trim()
}

export function toKebabCase(label: string): string {
  return (label || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

export function fallbackHueNameFromHex(hex: string): string {
  const { h, s, v } = hexToHsv(hex)
  if (s < 0.05) {
    // near grayscale
    if (v > 0.9) return 'White'
    if (v < 0.1) return 'Black'
    return 'Gray'
  }
  const hue = ((h % 360) + 360) % 360
  if (hue >= 345 || hue < 15) return 'Red'
  if (hue < 45) return 'Orange'
  if (hue < 65) return 'Yellow'
  if (hue < 170) return 'Green'
  if (hue < 200) return 'Cyan'
  if (hue < 255) return 'Blue'
  if (hue < 290) return 'Indigo'
  if (hue < 330) return 'Violet'
  return 'Magenta'
}

