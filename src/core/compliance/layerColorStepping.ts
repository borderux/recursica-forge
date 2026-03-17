import { readCssVar } from '../css/readCssVar'
import { tokenColors } from '../css/cssVarBuilder'
import { buildTokenIndex, type TokenIndex } from '../resolvers/tokens'
import type { JsonLike } from '../resolvers/tokens'
import { contrastRatio } from '../../modules/theme/contrastUtil'
// HSV imports removed — suggestions must only use exact token values
import { tokenToCssVar } from '../css/tokenRefs'

const LEVELS = ['000', '050', '100', '200', '300', '400', '500', '600', '700', '800', '900', '1000']

/**
 * Traces a CSS var to find the terminal --recursica_tokens_colors_* token reference.
 * Follows var() chain: brand → palette → token. Returns the token family/level
 * that the CSS var actually references, avoiding the blind hex-match ambiguity
 * of findColorFamilyAndLevel (which fails when multiple scales share the same hex).
 */
export function traceToTokenRef(cssVarName: string): { family: string; level: string } | null {
  let current = readCssVar(cssVarName)
  let depth = 0
  while (current && depth < 10) {
    // Check if current value is a token var reference
    const tokenMatch = current.match(/var\s*\(\s*(--recursica_tokens_colors?[_-]([a-z0-9_-]+)[_-](\d{3,4}|050|000))\s*/)
    if (tokenMatch) {
      return { family: tokenMatch[2], level: tokenMatch[3] }
    }
    // Follow nested var() references
    const varMatch = current.match(/var\s*\(\s*(--[^),]+)/)
    if (varMatch) {
      current = readCssVar(varMatch[1])
      depth++
    } else {
      break
    }
  }
  return null
}

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

    // Support both old format (--recursica_tokens_color_...) and new format (--recursica_tokens_colors_...)
    const tokenMatch = trimmed.match(/--recursica_tokens_colors?[_-]([a-z0-9_-]+)[_-](\d+|050|000)/)
    if (tokenMatch) {
      const [, family, level] = tokenMatch
      // Try new format first (colors/family/level), then old format (color/family/level) for backwards compatibility
      let hex = tokenIndex.get(`colors/${family}/${level}`)
      if (typeof hex !== 'string') {
        hex = tokenIndex.get(`color/${family}/${level}`)
      }
      if (typeof hex === 'string') {
        const h = hex.startsWith('#') ? hex.toLowerCase() : `#${hex.toLowerCase()}`
        return h
      }
    }

    // Try palette var reference (both light and dark modes)
    const paletteMatch = trimmed.match(/--recursica_brand_(light|dark)-palettes-([a-z0-9-]+)-(\d+|primary)-(tone|on-tone)/)
    if (paletteMatch) {
      const [, paletteMode, paletteKey, level, type] = paletteMatch
      const paletteVarName = `--recursica_brand_${paletteMode}-palettes-${paletteKey}-${level}-${type}`
      const paletteValue = readCssVar(paletteVarName)
      if (paletteValue) {
        return resolveCssVarToHex(paletteValue, tokenIndex, depth + 1)
      }
    }
  } catch { }
  return null
}

/**
 * Finds the color family and level for a given hex value in tokens
 * Returns scale keys (e.g., "scale-01") instead of aliases, since recursica_brand.json doesn't use aliases
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
 * Gets one step darker or lighter color from the token scale.
 * Returns null if the color is not found in tokens or there's no adjacent level.
 * Never falls back to computed/HSV values.
 */
export function getSteppedColor(
  hex: string,
  direction: 'darker' | 'lighter',
  tokens: JsonLike
): string | null {
  const found = findColorFamilyAndLevel(hex, tokens)
  if (!found) return null

  const { family, level } = found
  const currentIdx = LEVELS.indexOf(level)
  if (currentIdx === -1) return null

  let targetIdx: number
  if (direction === 'darker') {
    targetIdx = Math.min(LEVELS.length - 1, currentIdx + 1)
  } else {
    targetIdx = Math.max(0, currentIdx - 1)
  }

  if (targetIdx === currentIdx) return null // already at the edge

  const targetLevel = LEVELS[targetIdx]
  const tokenIndex = buildTokenIndex(tokens)
  let targetHex = tokenIndex.get(`colors/${family}/${targetLevel}`)
  if (typeof targetHex !== 'string') {
    targetHex = tokenIndex.get(`color/${family}/${targetLevel}`)
  }

  if (typeof targetHex === 'string') {
    return targetHex.startsWith('#') ? targetHex.toLowerCase() : `#${targetHex.toLowerCase()}`
  }

  return null
}

/**
 * Gets ALL colors in a token family (scale), ordered from lightest to darkest.
 * Returns array of { hex, family, level } for every level in the scale.
 */
export function getAllFamilyColors(
  hex: string,
  tokens: JsonLike
): { hex: string; family: string; level: string }[] {
  const found = findColorFamilyAndLevel(hex, tokens)
  if (!found) return []

  return getAllFamilyColorsByKey(found.family, tokens)
}

/**
 * Gets all colors in a family by its scale key.
 */
export function getAllFamilyColorsByKey(
  family: string,
  tokens: JsonLike
): { hex: string; family: string; level: string }[] {
  const tokenIndex = buildTokenIndex(tokens)
  const results: { hex: string; family: string; level: string }[] = []

  for (const level of LEVELS) {
    let colorHex = tokenIndex.get(`colors/${family}/${level}`)
    if (typeof colorHex !== 'string') {
      colorHex = tokenIndex.get(`color/${family}/${level}`)
    }
    if (typeof colorHex === 'string') {
      const h = colorHex.startsWith('#') ? colorHex.toLowerCase() : `#${colorHex.toLowerCase()}`
      results.push({ hex: h, family, level })
    }
  }

  return results
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
 * Returns scale keys (e.g., "scale-01") instead of aliases, since recursica_brand.json doesn't use aliases
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
/**
 * Converts a hex color to a CSS variable reference.
 * Only returns exact token matches. Returns null if no exact match found.
 */
export function hexToCssVarRef(hex: string, tokens: JsonLike): string | null {
  const found = findColorFamilyAndLevel(hex, tokens)
  if (!found) {
    return null
  }

  const tokenName = `colors/${found.family}/${found.level}`
  const cssVar = tokenToCssVar(tokenName, tokens)
  if (cssVar) return cssVar

  // Direct fallback for scale keys
  if (found.family.startsWith('scale-')) {
    return `var(${tokenColors(found.family, found.level)})`
  }

  return null
}

