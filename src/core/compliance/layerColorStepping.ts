import { readCssVar } from '../css/readCssVar'
import { buildTokenIndex } from '../resolvers/tokens'
import type { JsonLike } from '../resolvers/tokens'
import { contrastRatio } from '../../modules/theme/contrastUtil'
import { hexToHsv, hsvToHex } from '../../modules/tokens/colors/colorUtils'

const LEVELS = ['000', '050', '100', '200', '300', '400', '500', '600', '700', '800', '900', '1000']

/**
 * Resolves a CSS variable to its hex value, following var() references recursively
 */
export function resolveCssVarToHex(cssVar: string, tokenIndex: Map<string, any>, depth = 0): string | null {
  if (depth > 10) return null
  try {
    const trimmed = cssVar.trim()
    if (/^#?[0-9a-f]{6}$/i.test(trimmed)) {
      const h = trimmed.toLowerCase()
      return h.startsWith('#') ? h : `#${h}`
    }
    
    const varMatch = trimmed.match(/var\s*\(\s*(--[^)]+)\s*\)/)
    if (varMatch) {
      const varName = varMatch[1]
      const value = readCssVar(varName)
      if (value) {
        return resolveCssVarToHex(value, tokenIndex, depth + 1)
      }
    }
    
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
 * Finds the color family and level for a given hex value in tokens
 */
export function findColorFamilyAndLevel(hex: string, tokens: JsonLike): { family: string; level: string } | null {
  const tokenIndex = buildTokenIndex(tokens)
  const normalizedHex = hex.startsWith('#') ? hex.toLowerCase() : `#${hex.toLowerCase()}`
  
  // Search through all color families and levels
  const jsonColors: any = (tokens as any)?.tokens?.color || {}
  for (const [family, levels] of Object.entries(jsonColors)) {
    if (family === 'translucent') continue
    const familyObj = levels as any
    for (const [level, value] of Object.entries(familyObj)) {
      const tokenValue = (value as any)?.$value || value
      if (typeof tokenValue === 'string') {
        const tokenHex = tokenValue.startsWith('#') ? tokenValue.toLowerCase() : `#${tokenValue.toLowerCase()}`
        if (tokenHex === normalizedHex) {
          return { family, level }
        }
      }
    }
  }
  return null
}

/**
 * Gets one step darker or lighter color from the token scale, or adjusts HSV if not found
 */
export function getSteppedColor(
  hex: string,
  direction: 'darker' | 'lighter',
  tokens: JsonLike
): string | null {
  const found = findColorFamilyAndLevel(hex, tokens)
  if (!found) {
    // If not found in tokens, adjust HSV directly
    const hsv = hexToHsv(hex)
    if (direction === 'darker') {
      hsv.v = Math.max(0, hsv.v - 0.1)
    } else {
      hsv.v = Math.min(1, hsv.v + 0.1)
    }
    return hsvToHex(hsv.h, hsv.s, hsv.v)
  }
  
  const { family, level } = found
  const normalizedLevel = level === '000' ? '050' : level
  const currentIdx = LEVELS.indexOf(normalizedLevel)
  
  if (currentIdx === -1) {
    // Fallback to HSV adjustment
    const hsv = hexToHsv(hex)
    if (direction === 'darker') {
      hsv.v = Math.max(0, hsv.v - 0.1)
    } else {
      hsv.v = Math.min(1, hsv.v + 0.1)
    }
    return hsvToHex(hsv.h, hsv.s, hsv.v)
  }
  
  let targetIdx: number
  if (direction === 'darker') {
    targetIdx = Math.min(LEVELS.length - 1, currentIdx + 1)
  } else {
    targetIdx = Math.max(0, currentIdx - 1)
  }
  
  const targetLevel = LEVELS[targetIdx]
  const tokenIndex = buildTokenIndex(tokens)
  const targetHex = tokenIndex.get(`color/${family}/${targetLevel}`)
  
  if (typeof targetHex === 'string') {
    return targetHex.startsWith('#') ? targetHex.toLowerCase() : `#${targetHex.toLowerCase()}`
  }
  
  // Fallback to HSV adjustment
  const hsv = hexToHsv(hex)
  if (direction === 'darker') {
    hsv.v = Math.max(0, hsv.v - 0.1)
  } else {
    hsv.v = Math.min(1, hsv.v + 0.1)
  }
  return hsvToHex(hsv.h, hsv.s, hsv.v)
}

/**
 * Keeps stepping in a direction until AA compliance is met or we run out of steps.
 * If the preferred direction doesn't work, tries the opposite direction.
 */
export function stepUntilAACompliant(
  startHex: string,
  surfaceHex: string,
  direction: 'darker' | 'lighter',
  tokens: JsonLike,
  maxSteps: number = 10,
  triedOpposite: boolean = false
): string {
  const AA = 4.5
  let currentHex = startHex
  let steps = 0
  
  while (steps < maxSteps) {
    const contrast = contrastRatio(surfaceHex, currentHex)
    if (contrast >= AA) {
      return currentHex
    }
    
    const steppedHex = getSteppedColor(currentHex, direction, tokens)
    if (!steppedHex || steppedHex === currentHex) {
      // Can't step further in this direction
      break
    }
    
    currentHex = steppedHex
    steps++
  }
  
  // If we couldn't meet AA by stepping in the preferred direction, try the opposite (only once)
  if (!triedOpposite) {
    const oppositeDirection = direction === 'darker' ? 'lighter' : 'darker'
    return stepUntilAACompliant(startHex, surfaceHex, oppositeDirection, tokens, maxSteps, true)
  }
  
  // If we've tried both directions and still can't meet AA, return the best we found
  return currentHex
}

/**
 * Converts a hex color to a CSS variable reference if possible, otherwise returns the hex
 */
export function hexToCssVarRef(hex: string, tokens: JsonLike): string {
  const found = findColorFamilyAndLevel(hex, tokens)
  if (found) {
    const normalizedLevel = found.level === '000' ? '050' : found.level
    return `var(--recursica-tokens-color-${found.family}-${normalizedLevel})`
  }
  // Custom color not in tokens - return hex directly
  return hex
}

