import { readCssVar, readCssVarResolved, readCssVarNumber } from '../css/readCssVar'
import { updateCssVar } from '../css/updateCssVar'
import { buildTokenIndex } from '../resolvers/tokens'
import type { JsonLike } from '../resolvers/tokens'
import { contrastRatio, hexToRgb } from '../../modules/theme/contrastUtil'
import { resolveCssVarToHex, findColorFamilyAndLevel } from './layerColorStepping'
import { parseTokenReference, type TokenReferenceContext } from '../utils/tokenReferenceParser'

const LEVELS = ['000', '050', '100', '200', '300', '400', '500', '600', '700', '800', '900', '1000']
const AA = 4.5

// Helper to blend foreground over background with opacity
function blendHexOver(fgHex: string, bgHex: string, opacity: number): string {
  const fg = hexToRgb(fgHex)
  const bg = hexToRgb(bgHex)
  if (!fg || !bg) return fgHex
  const a = Math.max(0, Math.min(1, opacity))
  const r = Math.round(a * fg.r + (1 - a) * bg.r)
  const g = Math.round(a * fg.g + (1 - a) * bg.g)
  const b = Math.round(a * fg.b + (1 - a) * bg.b)
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`
}

/**
 * Finds AA-compliant on-tone color using alternating pattern:
 * Start at level → +100 → -100 → +200 → -200 → +300 → -300 → etc.
 * Pattern: 500 → 600 → 400 → 700 → 300 → 800 → 200 → 900 → 100 → 1000 → 050 → 000
 * 
 * @param toneHex - The base color tone hex value
 * @param coreToneRef - The core tone reference (black or white) with { family, level }
 * @param opacity - The opacity value (0-1) to apply
 * @param tokens - The tokens JSON
 * @param mode - The theme mode ('light' or 'dark')
 * @param coreColorName - The name of the core color ('black' or 'white') to determine which CSS var to return
 * @returns The CSS variable reference for an AA-compliant color, or null if none found
 */
function findAaCompliantWithAlternatingPattern(
  toneHex: string,
  coreToneRef: { family: string; level: string },
  opacity: number,
  tokens: JsonLike,
  mode: 'light' | 'dark',
  coreColorName: 'black' | 'white'
): string | null {
  const tokenIndex = buildTokenIndex(tokens)
  const normalizedStartLevel = coreToneRef.level === '000' ? '050' : coreToneRef.level
  const startIdx = LEVELS.indexOf(normalizedStartLevel)
  if (startIdx === -1) return null
  
  // Build alternating pattern: start → +100 → -100 → +200 → -200 → etc.
  // Pattern: 500 → 600 → 400 → 700 → 300 → 800 → 200 → 900 → 100 → 1000 → 050 → 000
  const pattern: string[] = [normalizedStartLevel]
  let offset = 100
  while (pattern.length < LEVELS.length) {
    const upIdx = startIdx + offset / 100
    const downIdx = startIdx - offset / 100
    
    // Add higher index first, then lower index (alternating pattern)
    if (upIdx < LEVELS.length && !pattern.includes(LEVELS[upIdx])) {
      pattern.push(LEVELS[upIdx])
    }
    if (downIdx >= 0 && !pattern.includes(LEVELS[downIdx])) {
      pattern.push(LEVELS[downIdx])
    }
    
    offset += 100
    if (offset / 100 > LEVELS.length) break
  }
  
  // Try each level in the alternating pattern
  for (const level of pattern) {
    const normalizedLevel = level === '000' ? '050' : level
    // Try new format first (colors/family/level), then old format (color/family/level)
    let hex = tokenIndex.get(`colors/${coreToneRef.family}/${normalizedLevel}`)
    if (typeof hex !== 'string') {
      hex = tokenIndex.get(`color/${coreToneRef.family}/${normalizedLevel}`)
    }
    
    if (typeof hex === 'string') {
      const h = hex.startsWith('#') ? hex.toLowerCase() : `#${hex.toLowerCase()}`
      const blended = blendHexOver(h, toneHex, opacity)
      const contrast = contrastRatio(toneHex, blended)
      
      if (contrast >= AA) {
        // Return CSS var reference for the specific token level that passed
        // This should reference the black or white tone at the specific level
        const tokenCssVar = `var(--recursica-tokens-colors-${coreToneRef.family}-${normalizedLevel})`
        return tokenCssVar
      }
    }
  }
  
  return null
}

/**
 * Finds the core tone reference (black or white) from theme JSON
 */
function getCoreToneRef(
  coreColor: 'black' | 'white',
  tokens: JsonLike,
  theme: JsonLike,
  mode: 'light' | 'dark'
): { family: string; level: string } | null {
  try {
    const root: any = theme?.brand ? theme.brand : theme
    const themes = root?.themes || root
    const coreColors = themes?.[mode]?.palettes?.['core-colors']?.$value || themes?.[mode]?.palettes?.['core-colors']
    const colorDef = coreColors?.[coreColor]
    if (!colorDef) return null
    
    const toneRef = colorDef.tone?.$value || colorDef.tone
    if (!toneRef || typeof toneRef !== 'string') return null
    
    const context: TokenReferenceContext = {
      currentMode: mode,
      tokenIndex: buildTokenIndex(tokens),
      theme
    }
    
    const parsed = parseTokenReference(toneRef, context)
    if (parsed && parsed.type === 'token' && parsed.path.length >= 3 && parsed.path[0] === 'colors') {
      return { family: parsed.path[1], level: parsed.path[2] }
    }
  } catch {}
  return null
}

/**
 * Updates core color on-tone values for AA compliance with alternating pattern
 * For high/low emphasis: tries black tone first, then white tone if black fails
 * For interactive: only uses interactive tone scale
 */
export function updateCoreColorOnTonesForCompliance(
  coreColorName: 'black' | 'white' | 'alert' | 'warning' | 'success',
  toneHex: string,
  tokens: JsonLike,
  theme: JsonLike,
  setTheme: (theme: JsonLike) => void,
  mode: 'light' | 'dark',
  forceUpdate: boolean = false
): void {
  const tokenIndex = buildTokenIndex(tokens)
  const modeLower = mode.toLowerCase()
  
  // Get emphasis opacity values
  const highEmphasisOpacity = readCssVarNumber(`--recursica-brand-themes-${modeLower}-text-emphasis-high`) || 1
  const lowEmphasisOpacity = readCssVarNumber(`--recursica-brand-themes-${modeLower}-text-emphasis-low`) || 0.6
  
  // Get black and white tone references from theme
  const blackToneRef = getCoreToneRef('black', tokens, theme, mode)
  const whiteToneRef = getCoreToneRef('white', tokens, theme, mode)
  
  // Update high emphasis on-tone
  const highOnToneVar = `--recursica-brand-themes-${modeLower}-palettes-core-${coreColorName}-on-tone`
  
  // First, check if the current on-tone value already passes AA compliance
  // If forceUpdate is true, skip this check and always search for a new value
  const currentOnToneValue = readCssVar(highOnToneVar)
  let currentPasses = false
  
  if (!forceUpdate && currentOnToneValue) {
    // Resolve current on-tone to hex
    const currentOnToneHex = resolveCssVarToHex(currentOnToneValue, tokenIndex)
    if (currentOnToneHex) {
      // Check if current value passes with opacity
      const blended = blendHexOver(currentOnToneHex, toneHex, highEmphasisOpacity)
      const currentContrast = contrastRatio(toneHex, blended)
      currentPasses = currentContrast >= AA
    }
  }
  
  // Only search for a new value if current one doesn't pass, or if forceUpdate is true
  if (!currentPasses || forceUpdate) {
    let highOnToneCssVar: string | null = null
    
    // Try black tone first with alternating pattern
    if (blackToneRef) {
      highOnToneCssVar = findAaCompliantWithAlternatingPattern(toneHex, blackToneRef, highEmphasisOpacity, tokens, mode, 'black')
    }
    
    // If black tone failed, try white tone
    if (!highOnToneCssVar && whiteToneRef) {
      highOnToneCssVar = findAaCompliantWithAlternatingPattern(toneHex, whiteToneRef, highEmphasisOpacity, tokens, mode, 'white')
    }
    
    // Update CSS var if found
    if (highOnToneCssVar) {
      updateCssVar(highOnToneVar, highOnToneCssVar)
    }
  }
  // If current value passes and not forcing update, don't change it
  
  // Update low emphasis on-tone (same process but with low opacity)
  // Note: low emphasis uses the same CSS var as high emphasis, but with different opacity
  // The opacity is applied via the emphasis CSS var, so we use the same on-tone CSS var
  // So we don't need to update it separately - it's already updated above
}

/**
 * Updates interactive on-tone value for a core color using only interactive tone scale
 */
export function updateCoreColorInteractiveOnToneForCompliance(
  coreColorName: 'black' | 'white' | 'alert' | 'warning' | 'success',
  toneHex: string,
  tokens: JsonLike,
  theme: JsonLike,
  setTheme: (theme: JsonLike) => void,
  mode: 'light' | 'dark'
): void {
  const tokenIndex = buildTokenIndex(tokens)
  const modeLower = mode.toLowerCase()
  
  // Get interactive tone reference
  const interactiveToneVar = `--recursica-brand-themes-${modeLower}-palettes-core-interactive-default-tone`
  const interactiveToneValue = readCssVar(interactiveToneVar)
  const interactiveToneHex = interactiveToneValue 
    ? (resolveCssVarToHex(interactiveToneValue, tokenIndex) || '#000000')
    : '#000000'
  
  // Find the family and level of the interactive tone
  const interactiveToneRef = findColorFamilyAndLevel(interactiveToneHex, tokens)
  if (!interactiveToneRef) return
  
  // Use alternating pattern on interactive tone scale
  const normalizedStartLevel = interactiveToneRef.level === '000' ? '050' : interactiveToneRef.level
  const startIdx = LEVELS.indexOf(normalizedStartLevel)
  if (startIdx === -1) return
  
  // Build alternating pattern
  const pattern: string[] = [normalizedStartLevel]
  let offset = 100
  while (pattern.length < LEVELS.length) {
    const upIdx = startIdx + offset / 100
    const downIdx = startIdx - offset / 100
    
    if (upIdx < LEVELS.length && !pattern.includes(LEVELS[upIdx])) {
      pattern.push(LEVELS[upIdx])
    }
    if (downIdx >= 0 && !pattern.includes(LEVELS[downIdx])) {
      pattern.push(LEVELS[downIdx])
    }
    
    offset += 100
    if (offset / 100 > LEVELS.length) break
  }
  
  // Try each level in the alternating pattern
  for (const level of pattern) {
    const normalizedLevel = level === '000' ? '050' : level
    let hex = tokenIndex.get(`colors/${interactiveToneRef.family}/${normalizedLevel}`)
    if (typeof hex !== 'string') {
      hex = tokenIndex.get(`color/${interactiveToneRef.family}/${normalizedLevel}`)
    }
    
    if (typeof hex === 'string') {
      const h = hex.startsWith('#') ? hex.toLowerCase() : `#${hex.toLowerCase()}`
      const contrast = contrastRatio(toneHex, h)
      
      if (contrast >= AA) {
        // Use the token CSS var for the level that passed (this is the interactive TONE, not on-tone)
        // The interactive property for base colors should reference the interactive tone color directly
        const tokenCssVar = `var(--recursica-tokens-colors-${interactiveToneRef.family}-${normalizedLevel})`
        const interactiveVar = `--recursica-brand-themes-${modeLower}-palettes-core-${coreColorName}-interactive`
        updateCssVar(interactiveVar, tokenCssVar)
        
        // Only update theme JSON if setTheme is provided and not a no-op
        // During AA compliance checks, setTheme is a no-op, so JSON is never updated
        // Only user-initiated changes should update JSON
        if (setTheme && theme && setTheme.toString() !== '() => {}') {
          try {
            const themeCopy = JSON.parse(JSON.stringify(theme))
            const root: any = themeCopy?.brand ? themeCopy.brand : themeCopy
            const themes = root?.themes || root
            const coreColors = themes?.[mode]?.palettes?.['core-colors']?.$value || themes?.[mode]?.palettes?.['core-colors']
            const colorDef = coreColors?.[coreColorName]
            if (colorDef) {
              const tokenRef = `{tokens.colors.${interactiveToneRef.family}.${normalizedLevel}}`
              if (!colorDef.interactive) colorDef.interactive = {}
              colorDef.interactive.$value = tokenRef
              setTheme(themeCopy)
            }
          } catch (err) {
            console.error('Failed to update interactive in theme JSON:', err)
          }
        }
        return
      }
    }
  }
  
  // If no level passes, don't update (will show warning)
}
