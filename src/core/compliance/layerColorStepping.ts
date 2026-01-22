import { readCssVar } from '../css/readCssVar'
import { buildTokenIndex, type TokenIndex } from '../resolvers/tokens'
import type { JsonLike } from '../resolvers/tokens'
import { contrastRatio } from '../../modules/theme/contrastUtil'
import { hexToHsv, hsvToHex } from '../../modules/tokens/colors/colorUtils'
import { tokenToCssVar } from '../css/tokenRefs'

const LEVELS = ['000', '050', '100', '200', '300', '400', '500', '600', '700', '800', '900', '1000']

/**
 * Resolves a CSS variable to its hex value, following var() references recursively
 */
export function resolveCssVarToHex(cssVar: string, tokenIndex: TokenIndex | Map<string, any>, depth = 0): string | null {
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
    
    // Support both old format (--recursica-tokens-color-...) and new format (--recursica-tokens-colors-...)
    const tokenMatch = trimmed.match(/--recursica-tokens-colors?-([a-z0-9-]+)-(\d+|050|000)/)
    if (tokenMatch) {
      const [, family, level] = tokenMatch
      const normalizedLevel = level === '000' ? '050' : level
      // Try new format first (colors/family/level), then old format (color/family/level) for backwards compatibility
      let hex = tokenIndex.get(`colors/${family}/${normalizedLevel}`)
      if (typeof hex !== 'string') {
        hex = tokenIndex.get(`color/${family}/${normalizedLevel}`)
      }
      if (typeof hex === 'string') {
        const h = hex.startsWith('#') ? hex.toLowerCase() : `#${hex.toLowerCase()}`
        return h
      }
    }
    
    // Try palette var reference (both light and dark modes)
    const paletteMatch = trimmed.match(/--recursica-brand-(light|dark)-palettes-([a-z0-9-]+)-(\d+|primary)-(tone|on-tone)/)
    if (paletteMatch) {
      const [, paletteMode, paletteKey, level, type] = paletteMatch
      const paletteVarName = `--recursica-brand-${paletteMode}-palettes-${paletteKey}-${level}-${type}`
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
 * Returns scale keys (e.g., "scale-01") instead of aliases, since Brand.json doesn't use aliases
 */
export function findColorFamilyAndLevel(hex: string, tokens: JsonLike): { family: string; level: string } | null {
  const tokenIndex = buildTokenIndex(tokens)
  const normalizedHex = hex.startsWith('#') ? hex.toLowerCase() : `#${hex.toLowerCase()}`
  
  // Search through new colors structure (colors.scale-XX.level)
  const jsonColors: any = (tokens as any)?.tokens?.colors || {}
  for (const [scaleKey, scale] of Object.entries(jsonColors)) {
    if (!scaleKey.startsWith('scale-')) continue
    const scaleObj = scale as any
    
    // Skip the alias property
    for (const [level, value] of Object.entries(scaleObj)) {
      if (level === 'alias') continue
      const tokenValue = (value as any)?.$value || value
      if (typeof tokenValue === 'string') {
        const tokenHex = tokenValue.startsWith('#') ? tokenValue.toLowerCase() : `#${tokenValue.toLowerCase()}`
        if (tokenHex === normalizedHex) {
          // Return scale key directly, not alias
          return { family: scaleKey, level }
        }
      }
    }
  }
  
  // Fallback: search through old color structure for backwards compatibility
  // Note: Old structure may not have scale keys, but we still return what we find
  const oldColors: any = (tokens as any)?.tokens?.color || {}
  for (const [family, levels] of Object.entries(oldColors)) {
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
  // Try new format first (colors/family/level), then old format (color/family/level) for backwards compatibility
  let targetHex = tokenIndex.get(`colors/${family}/${targetLevel}`)
  if (typeof targetHex !== 'string') {
    targetHex = tokenIndex.get(`color/${family}/${targetLevel}`)
  }
  
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
 * Calculates the color distance between two hex colors (Euclidean distance in RGB space)
 */
function colorDistance(hex1: string, hex2: string): number {
  try {
    const toRgb = (h: string): [number, number, number] => {
      const s = h.startsWith('#') ? h.slice(1) : h
      return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)]
    }
    const [r1, g1, b1] = toRgb(hex1)
    const [r2, g2, b2] = toRgb(hex2)
    return Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2))
  } catch {
    return Infinity
  }
}

/**
 * Finds the closest matching color token for a given hex value
 * Returns scale keys (e.g., "scale-01") instead of aliases, since Brand.json doesn't use aliases
 */
function findClosestColorToken(hex: string, tokens: JsonLike): { family: string; level: string } | null {
  const normalizedHex = hex.startsWith('#') ? hex.toLowerCase() : `#${hex.toLowerCase()}`
  let closest: { family: string; level: string; distance: number } | null = null
  
  // Search through new colors structure (colors.scale-XX.level)
  const jsonColors: any = (tokens as any)?.tokens?.colors || {}
  for (const [scaleKey, scale] of Object.entries(jsonColors)) {
    if (!scaleKey.startsWith('scale-')) continue
    const scaleObj = scale as any
    
    for (const [level, value] of Object.entries(scaleObj)) {
      if (level === 'alias') continue
      const tokenValue = (value as any)?.$value || value
      if (typeof tokenValue === 'string') {
        const tokenHex = tokenValue.startsWith('#') ? tokenValue.toLowerCase() : `#${tokenValue.toLowerCase()}`
        const distance = colorDistance(normalizedHex, tokenHex)
        if (!closest || distance < closest.distance) {
          // Return scale key directly, not alias
          closest = { family: scaleKey, level, distance }
        }
      }
    }
  }
  
  // Fallback: search through old color structure
  const oldColors: any = (tokens as any)?.tokens?.color || {}
  for (const [family, levels] of Object.entries(oldColors)) {
    if (family === 'translucent') continue
    const familyObj = levels as any
    for (const [level, value] of Object.entries(familyObj)) {
      const tokenValue = (value as any)?.$value || value
      if (typeof tokenValue === 'string') {
        const tokenHex = tokenValue.startsWith('#') ? tokenValue.toLowerCase() : `#${tokenValue.toLowerCase()}`
        const distance = colorDistance(normalizedHex, tokenHex)
        if (!closest || distance < closest.distance) {
          closest = { family, level, distance }
        }
      }
    }
  }
  
  return closest ? { family: closest.family, level: closest.level } : null
}

/**
 * Converts a hex color to a CSS variable reference if possible, otherwise finds the closest match
 */
export function hexToCssVarRef(hex: string, tokens: JsonLike): string {
  // First try to find an exact match
  let found = findColorFamilyAndLevel(hex, tokens)
  
  // If no exact match, find the closest matching token
  if (!found) {
    found = findClosestColorToken(hex, tokens)
  }
  
  if (found) {
    const normalizedLevel = found.level === '000' ? '050' : found.level
    // found.family is now always a scale key (e.g., "scale-01"), not an alias
    const tokenName = `colors/${found.family}/${normalizedLevel}`
    const cssVar = tokenToCssVar(tokenName, tokens)
    if (cssVar) {
      return cssVar
    }
    // Direct fallback: found.family should already be a scale key
    if (found.family.startsWith('scale-')) {
      return `var(--recursica-tokens-colors-${found.family}-${normalizedLevel})`
    }
  }
  
  // If we still can't find a match, this shouldn't happen, but return a fallback
  // Use a default token reference (scale-02-500, which is typically gray) as a last resort
  console.warn(`[hexToCssVarRef] Could not find token for hex ${hex}, using fallback`)
  // Try to find scale-02 (gray) 500 level
  const tokensRoot: any = (tokens as any)?.tokens || tokens || {}
  const colorsRoot: any = tokensRoot?.colors || {}
  const grayScale = Object.keys(colorsRoot).find(key => {
    if (!key.startsWith('scale-')) return false
    const scale = colorsRoot[key]
    return scale && typeof scale === 'object' && scale.alias === 'gray'
  })
  if (grayScale) {
    return `var(--recursica-tokens-colors-${grayScale}-500)`
  }
  return `var(--recursica-tokens-colors-scale-02-500)` // Hardcoded fallback - scale-02 is typically gray
}

