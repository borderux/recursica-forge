import { contrastRatio } from '../../modules/theme/contrastUtil'
import type { JsonLike } from './tokens'
import { buildTokenIndex } from './tokens'
import { readCssVar } from '../css/readCssVar'

// Helper to blend foreground over background with opacity
function blendHexOverBg(fgHex?: string, bgHex?: string, opacity?: number): string | undefined {
  if (!fgHex || !bgHex) return undefined
  try {
    const toRgb = (h: string): [number, number, number] => {
      const s = h.startsWith('#') ? h.slice(1) : h
      const r = parseInt(s.slice(0, 2), 16)
      const g = parseInt(s.slice(2, 4), 16)
      const b = parseInt(s.slice(4, 6), 16)
      return [r, g, b]
    }
    const clamp01 = (n: number) => Math.max(0, Math.min(1, n))
    const a = clamp01(typeof opacity === 'number' ? opacity : 1)
    const [fr, fg, fb] = toRgb(fgHex.replace('#',''))
    const [br, bgc, bb] = toRgb(bgHex.replace('#',''))
    const rr = Math.round(a * fr + (1 - a) * br)
    const rg = Math.round(a * fg + (1 - a) * bgc)
    const rb = Math.round(a * fb + (1 - a) * bb)
    const toHex = (n: number) => n.toString(16).padStart(2, '0')
    return `#${toHex(rr)}${toHex(rg)}${toHex(rb)}`
  } catch { return fgHex }
}

// Helper to resolve CSS var to hex (recursively)
function resolveCssVarToHex(cssVar: string, tokenIndex: Map<string, any>, depth = 0): string | null {
  if (depth > 10) return null
  try {
    const trimmed = cssVar.trim()
    // If it's already a hex, return it
    if (/^#?[0-9a-f]{6}$/i.test(trimmed)) {
      const h = trimmed.toLowerCase()
      return h.startsWith('#') ? h : `#${h}`
    }
    
    // If it's a var(), extract the var name and resolve
    const varMatch = trimmed.match(/var\s*\(\s*(--[^)]+)\s*\)/)
    if (varMatch) {
      const varName = varMatch[1]
      const value = readCssVar(varName)
      if (value) {
        return resolveCssVarToHex(value, tokenIndex, depth + 1)
      }
    }
    
    // Try to get from token index if it's a token reference
    const tokenMatch = trimmed.match(/--recursica-tokens-color-([a-z0-9-]+)-(\d+|050|000)/)
    if (tokenMatch) {
      const [, family, level] = tokenMatch
      const normalizedLevel = level === '000' ? '050' : level
      const hex = tokenIndex.get(`color/${family}/${normalizedLevel}`)
      if (typeof hex === 'string') {
        const h = hex.startsWith('#') ? hex.toLowerCase() : `#${hex.toLowerCase()}`
        return h
      }
    }
    
    // Try palette var reference
    const paletteMatch = trimmed.match(/--recursica-brand-light-palettes-([a-z0-9-]+)-(\d+|primary)-(tone|on-tone)/)
    if (paletteMatch) {
      const [, paletteKey, level, type] = paletteMatch
      const paletteVarName = `--recursica-brand-light-palettes-${paletteKey}-${level}-${type}`
      const paletteValue = readCssVar(paletteVarName)
      if (paletteValue) {
        return resolveCssVarToHex(paletteValue, tokenIndex, depth + 1)
      }
    }
  } catch {}
  return null
}

/**
 * Finds an AA-compliant color by stepping through a color scale.
 * 
 * @param surfaceHex - The background surface color in hex format
 * @param coreToken - The core token reference { family, level } to start from
 * @param opacity - The opacity value (0-1) to apply to the foreground color
 * @param tokens - The tokens JSON to build the token index from
 * @returns The CSS variable reference for an AA-compliant color, or null if none found
 */
export function findAaCompliantColor(
  surfaceHex: string,
  coreToken: { family: string; level: string } | null,
  opacity: number,
  tokens: JsonLike
): string | null {
  const AA = 4.5
  const LEVELS = ['000', '050', '100', '200', '300', '400', '500', '600', '700', '800', '900']
  const tokenIndex = buildTokenIndex(tokens)
  
  // If no core token, try white/black
  if (!coreToken) {
    const whiteHex = resolveCssVarToHex('var(--recursica-brand-light-palettes-core-white)', tokenIndex) || '#ffffff'
    const blackHex = resolveCssVarToHex('var(--recursica-brand-light-palettes-core-black)', tokenIndex) || '#000000'
    
    const whiteFinal = blendHexOverBg(whiteHex, surfaceHex, opacity) || whiteHex
    const blackFinal = blendHexOverBg(blackHex, surfaceHex, opacity) || blackHex
    
    const whiteContrast = contrastRatio(surfaceHex, whiteFinal)
    const blackContrast = contrastRatio(surfaceHex, blackFinal)
    
    if (whiteContrast >= AA) {
      return 'var(--recursica-brand-light-palettes-core-white)'
    }
    if (blackContrast >= AA) {
      return 'var(--recursica-brand-light-palettes-core-black)'
    }
    // Use the one with higher contrast
    return whiteContrast >= blackContrast
      ? 'var(--recursica-brand-light-palettes-core-white)'
      : 'var(--recursica-brand-light-palettes-core-black)'
  }
  
  const normalizedStartLevel = coreToken.level === '000' ? '050' : coreToken.level
  const startIdx = LEVELS.indexOf(normalizedStartLevel)
  if (startIdx === -1) return null
  
  // First, try stepping lighter (lower index = lighter)
  for (let i = startIdx - 1; i >= 0; i--) {
    const level = LEVELS[i]
    const normalizedLevel = level === '000' ? '050' : level
    const hex = tokenIndex.get(`color/${coreToken.family}/${normalizedLevel}`)
    if (typeof hex === 'string') {
      const h = hex.startsWith('#') ? hex.toLowerCase() : `#${hex.toLowerCase()}`
      const final = blendHexOverBg(h, surfaceHex, opacity) || h
      const c = contrastRatio(surfaceHex, final)
      if (c >= AA) {
        return `var(--recursica-tokens-color-${coreToken.family}-${normalizedLevel})`
      }
    }
  }
  
  // If lighter didn't work, try darker (higher index = darker)
  for (let i = startIdx + 1; i < LEVELS.length; i++) {
    const level = LEVELS[i]
    const normalizedLevel = level === '000' ? '050' : level
    const hex = tokenIndex.get(`color/${coreToken.family}/${normalizedLevel}`)
    if (typeof hex === 'string') {
      const h = hex.startsWith('#') ? hex.toLowerCase() : `#${hex.toLowerCase()}`
      const final = blendHexOverBg(h, surfaceHex, opacity) || h
      const c = contrastRatio(surfaceHex, final)
      if (c >= AA) {
        return `var(--recursica-tokens-color-${coreToken.family}-${normalizedLevel})`
      }
    }
  }
  
  // If no token level works, try white/black
  const whiteHex = resolveCssVarToHex('var(--recursica-brand-light-palettes-core-white)', tokenIndex) || '#ffffff'
  const blackHex = resolveCssVarToHex('var(--recursica-brand-light-palettes-core-black)', tokenIndex) || '#000000'
  
  const whiteFinal = blendHexOverBg(whiteHex, surfaceHex, opacity) || whiteHex
  const blackFinal = blendHexOverBg(blackHex, surfaceHex, opacity) || blackHex
  
  const whiteContrast = contrastRatio(surfaceHex, whiteFinal)
  const blackContrast = contrastRatio(surfaceHex, blackFinal)
  
  if (whiteContrast >= AA) {
    return 'var(--recursica-brand-light-palettes-core-white)'
  }
  if (blackContrast >= AA) {
    return 'var(--recursica-brand-light-palettes-core-black)'
  }
  // Use the one with higher contrast
  return whiteContrast >= blackContrast
    ? 'var(--recursica-brand-light-palettes-core-white)'
    : 'var(--recursica-brand-light-palettes-core-black)'
}

