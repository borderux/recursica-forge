import type { JsonLike } from './tokens'
import { buildTokenIndex, resolveBraceRef } from './tokens'
import { extractBraceContent, parseTokenReference, resolveTokenReferenceToCssVar, type TokenReferenceContext } from '../utils/tokenReferenceParser'

// Dynamically import fontUtils to avoid circular dependencies
let getCachedFontFamilyName: ((name: string) => string) | null = null
let fontUtilsImportPromise: Promise<void> | null = null

// Initialize the import promise once
if (typeof window !== 'undefined') {
  fontUtilsImportPromise = import('../../modules/type/fontUtils').then(module => {
    getCachedFontFamilyName = module.getCachedFontFamilyName
  }).catch(() => {
    // Fallback: provide a simple function that returns just the font name
    getCachedFontFamilyName = (name: string) => {
      if (!name || !name.trim()) return name
      const trimmed = name.trim()
      return trimmed.includes(' ') ? `"${trimmed}"` : trimmed
    }
  })
}

// Helper function to safely get cached font family name
function safeGetCachedFontFamilyName(name: string): string {
  if (getCachedFontFamilyName) {
    return getCachedFontFamilyName(name)
  }
  // Fallback if not loaded yet - preserve the fallback if present
  if (!name || !name.trim()) return name
  const trimmed = name.trim()
  if (trimmed.includes(',')) {
    // Has fallback - quote the font name part if it has spaces, keep fallback as-is
    const [fontPart, ...fallbackParts] = trimmed.split(',').map(s => s.trim())
    const fallback = fallbackParts.join(',').trim()
    const quotedFontPart = fontPart.includes(' ') ? `"${fontPart}"` : fontPart
    return fallback ? `${quotedFontPart}, ${fallback}` : quotedFontPart
  }
  // No fallback - just add quotes if font name has spaces
  return trimmed.includes(' ') ? `"${trimmed}"` : trimmed
}

export type TypographyChoices = Record<string, { family?: string; size?: string; weight?: string; spacing?: string; lineHeight?: string }>

export function buildTypographyVars(tokens: JsonLike, theme: JsonLike, overrides: Record<string, any> | undefined, choices: TypographyChoices | undefined): { vars: Record<string, string>; familiesToLoad: string[] } {
  const PREFIXES = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'subtitle-1', 'subtitle-2', 'body-1', 'body-2', 'caption', 'overline']
  const tokenIndex = buildTokenIndex(tokens)
  const troot: any = (theme as any)?.brand ? (theme as any).brand : theme
  const ttyp: any = troot?.typography || {}
  const usedFamilies = new Set<string>()
  const vars: Record<string, string> = {}
  const readChoices = choices || {}

  // Read overrides from localStorage if not provided
  const readOverrides = (): Record<string, any> => {
    if (overrides) return overrides
    try {
      if (typeof window === 'undefined' || !window.localStorage) return {}
      const raw = localStorage.getItem('token-overrides')
      if (!raw) return {}
      return JSON.parse(raw) || {}
    } catch {
      return {}
    }
  }
  const effectiveOverrides = readOverrides()

  // Map of category names to their plural forms
  const pluralMap: Record<string, string> = {
    'size': 'sizes',
    'sizes': 'sizes',
    'weight': 'weights',
    'weights': 'weights',
    'letter-spacing': 'letter-spacings',
    'letter-spacings': 'letter-spacings',
    'line-height': 'line-heights',
    'line-heights': 'line-heights',
    'typeface': 'typefaces',
    'typefaces': 'typefaces',
    'cases': 'cases',
    'decorations': 'decorations',
    'styles': 'styles',
    'family': 'family' // Keep family as-is
  }

  // Emit CSS variables for font tokens so Brand can reference them via var(--recursica-tokens-font-*)
  // Check for deleted font families to skip creating CSS variables for them
  const readDeletedFontFamilies = (): Record<string, true> => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return {}
      const raw = localStorage.getItem('font-families-deleted')
      if (!raw) return {}
      const obj = JSON.parse(raw)
      if (obj && typeof obj === 'object') return obj as Record<string, true>
    } catch { }
    return {}
  }
  const deletedFamilies = readDeletedFontFamilies()

  try {
    const src: any = (tokens as any)?.tokens?.font || {}
    const emitCategory = (category: string, unitHint?: string) => {
      const pluralCategory = pluralMap[category] || category
      // Try plural first, then singular for backwards compatibility
      const cat: any = src?.[pluralCategory] || src?.[category] || {}
      Object.keys(cat).forEach((short) => {
        if (short.startsWith('$')) return
        // Skip if this font family/typeface is marked as deleted
        const tokenName = `font/${category}/${short}`
        if (deletedFamilies[tokenName]) {
          // Skip creating CSS variable for deleted font family
          return
        }

        // Check if there's an override value first
        const overrideKey = `font/${category}/${short}`
        const overrideValue = effectiveOverrides[overrideKey]

        // Use override value if it exists, otherwise use token value
        let valueStr: string | undefined = undefined
        if (overrideValue !== undefined && overrideValue !== null && String(overrideValue).trim()) {
          valueStr = String(overrideValue)
        } else {
          const raw = cat[short]?.$value
          // Handle array values for font families (e.g., ["Lexend", "sans-serif"]) - take first element
          if (category === 'family' || category === 'typeface' || category === 'typefaces') {
            if (Array.isArray(raw) && raw.length > 0) {
              valueStr = typeof raw[0] === 'string' ? raw[0] : ''
            } else if (typeof raw === 'string') {
              valueStr = raw
            }
          } else if (typeof raw === 'string') {
            valueStr = raw
          } else if (typeof raw === 'number') {
            valueStr = unitHint ? `${raw}${unitHint}` : String(raw)
          } else if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
            const val: any = (raw as any).value
            const unit: any = (raw as any).unit
            if (typeof val === 'number') valueStr = unit ? `${val}${unit}` : (unitHint ? `${val}${unitHint}` : String(val))
            else if (typeof val === 'string') valueStr = unit ? `${val}${unit}` : String(val)
          }
        }

        // For font families/typefaces, skip if:
        // 1. Explicitly deleted (in deletedFamilies)
        // 2. Override is explicitly null/empty (user deleted it)
        // 3. No value found (neither override nor token has a value)
        if (category === 'family' || category === 'typeface' || category === 'typefaces') {
          if (overrideValue === null || (overrideValue !== undefined && String(overrideValue).trim() === '')) {
            return
          }
          if (!valueStr) {
            return
          }
        }
        if (typeof valueStr === 'string' && valueStr) {
          // For font families/typefaces, use the cached actual font-family name from CSS
          if (category === 'family' || category === 'typeface' || category === 'typefaces') {
            // Strip any existing quotes from the value before formatting
            // The value might have quotes from JSON, but we want to format it fresh
            const cleanValue = valueStr.trim().replace(/^["']|["']$/g, '')
            valueStr = safeGetCachedFontFamilyName(cleanValue)
          }
          // Use plural form for CSS var name
          vars[`--recursica-tokens-font-${pluralCategory}-${short}`] = valueStr
        }
      })
    }
    emitCategory('family')            // string font-family stack
    emitCategory('typefaces')         // specific font family name (plural)
    emitCategory('sizes', 'px')       // numeric → px (plural)
    emitCategory('weights')            // numeric or named (plural)
    emitCategory('letter-spacings', 'em') // (plural)
    emitCategory('line-heights')      // unitless or string (plural)
    emitCategory('cases')             // text case values
    emitCategory('decorations')       // text decoration values
    emitCategory('styles')            // font style values
  } catch { }

  // Also emit CSS variables from overrides for font families/typefaces
  // This ensures custom-added font families and overridden values get CSS variables
  // Only create CSS variables for font families that exist in overrides
  try {
    Object.keys(effectiveOverrides).forEach((name) => {
      if (name.startsWith('font/typeface/') || name.startsWith('font/family/')) {
        const key = name.replace('font/typeface/', '').replace('font/family/', '')
        const category = name.startsWith('font/typeface/') ? 'typeface' : 'family'
        const overrideValue = effectiveOverrides[name]

        // Handle array values (e.g., ["Lexend", "sans-serif"]) - take first element
        let value = ''
        if (Array.isArray(overrideValue) && overrideValue.length > 0) {
          value = typeof overrideValue[0] === 'string' ? overrideValue[0] : ''
        } else {
          value = String(overrideValue || '')
        }

        // Skip if deleted
        const tokenName = `font/${category}/${key}`
        if (deletedFamilies[tokenName]) return

        // Only create CSS variable if value is not empty
        // Empty values mean the font family was deleted
        if (value && value.trim()) {
          // For font families/typefaces, use the cached actual font-family name from CSS
          if (category === 'family' || category === 'typeface' || category === 'typefaces') {
            // Strip any existing quotes from the value before formatting
            // The value might be stored with quotes, but we want to format it fresh
            const cleanValue = value.trim().replace(/^["']|["']$/g, '')
            const finalValue = safeGetCachedFontFamilyName(cleanValue)
            const pluralCategory = category === 'typeface' ? 'typefaces' : category
            vars[`--recursica-tokens-font-${pluralCategory}-${key}`] = finalValue
          } else {
            const pluralCategory = category === 'typeface' ? 'typefaces' : category
            vars[`--recursica-tokens-font-${pluralCategory}-${key}`] = value
            // Backwards compatibility
            if (pluralCategory !== category) {
              vars[`--recursica-tokens-font-${category}-${key}`] = value
            }
          }
        }
      }
    })
  } catch { }

  const getFontToken = (path: string): any => {
    // Allow overrides of font tokens using the same flat key naming used elsewhere
    const parts = path.split('/')
    const name = (() => {
      const [kind, key] = [parts[0], parts[1]]
      if (!kind || !key) return undefined
      return `font/${kind}/${key}`
    })()
    if (name && effectiveOverrides && Object.prototype.hasOwnProperty.call(effectiveOverrides, name)) return effectiveOverrides[name]
    return tokenIndex.get(`font/${parts[0]}/${parts[1]}`)
  }

  const toCssValue = (v: any, unitIfNumber?: string) => {
    if (v == null) return undefined
    if (v && typeof v === 'object') {
      const anyV: any = v
      if (Object.prototype.hasOwnProperty.call(anyV, 'value')) {
        const val: any = anyV.value
        const unit: any = anyV.unit
        if (typeof val === 'number') return unit ? `${val}${unit}` : (unitIfNumber ? `${val}${unitIfNumber}` : String(val))
        return unit ? `${val}${unit}` : String(val)
      }
      return String(anyV)
    }
    if (typeof v === 'number') return unitIfNumber ? `${v}${unitIfNumber}` : String(v)
    return String(v)
  }

  const familyTokens: Record<string, string> = (() => {
    const src: any = (tokens as any)?.tokens?.font?.family || {}
    const map: Record<string, string> = {}
    Object.keys(src).forEach((short) => { const val = String(src[short]?.$value || ''); if (val) map[short] = val })
    return map
  })()
  const findOverrideForFamilyLiteral = (literal?: string): string | undefined => {
    if (!literal) return undefined
    const entry = Object.entries(familyTokens).find(([, val]) => val === literal)
    if (!entry) return undefined
    const short = entry[0]
    const ov = overrides ? (overrides as any)[`font/family/${short}`] : undefined
    return typeof ov === 'string' && ov.trim() ? ov : undefined
  }

  const extractTokenRef = (ref: any): { category: 'family' | 'typeface' | 'size' | 'weight' | 'letter-spacing' | 'line-height'; suffix: string } | null => {
    try {
      const s = typeof ref === 'string' ? ref.trim() : (ref && typeof ref === 'object') ? String(((ref as any).$value ?? (ref as any).value) || '').trim() : ''
      if (!s) return null
      const inner = extractBraceContent(s) || s
      // Map of categories to their plural forms for matching
      const catMap: Array<{ singular: 'family' | 'typeface' | 'size' | 'weight' | 'letter-spacing' | 'line-height'; plural: string }> = [
        { singular: 'family', plural: 'families' },
        { singular: 'typeface', plural: 'typefaces' },
        { singular: 'size', plural: 'sizes' },
        { singular: 'weight', plural: 'weights' },
        { singular: 'letter-spacing', plural: 'letter-spacings' },
        { singular: 'line-height', plural: 'line-heights' }
      ]
      for (const { singular, plural } of catMap) {
        // Try both singular and plural forms (e.g., tokens.font.typeface.primary or tokens.font.typefaces.primary)
        const re = new RegExp(`^(?:tokens|token)\\.font\\.(?:${singular}|${plural})\\.([a-z0-9\\-_]+)$`, 'i')
        const m = inner.match(re)
        if (m) return { category: singular, suffix: m[1] }
        const varRe = new RegExp(`^var\\(\\s*--tokens-font-(?:${singular}|${plural})-([a-z0-9\\-_]+)\\s*\\)\\s*$`, 'i')
        const mv = s.match(varRe)
        if (mv) return { category: singular, suffix: mv[1] }
      }
    } catch { }
    return null
  }

  const resolveTokenRef = (ref: any) => {
    try {
      if (typeof ref === 'string') {
        const parsed = parseTokenReference(ref)
        if (parsed && parsed.type === 'token' && parsed.path.length >= 2 && parsed.path[0] === 'font') {
          const path = parsed.path.slice(1).join('/')
          return getFontToken(path)
        }
      }
    } catch { }
    return resolveBraceRef(ref, tokenIndex)
  }

  const findTokenByCategoryAndValue = (value: any, category: string): string | null => {
    if (value == null) return null
    const valStr = String(value).trim()
    if (!valStr) return null
    
    // If it's a token reference string (e.g., {tokens.font.decorations.none}), resolve it to CSS variable
    if (valStr.startsWith('{') && valStr.endsWith('}')) {
      try {
        const context: TokenReferenceContext = {
          theme,
          currentMode: 'light'
        }
        const cssVar = resolveTokenReferenceToCssVar(valStr, context)
        if (cssVar) return cssVar
      } catch { }
    }
    
    // If it's already a CSS variable, return as-is
    if (valStr.startsWith('var(')) {
      return valStr
    }
    
    // Otherwise, try to find token by matching value
    try {
      const pluralCategory = pluralMap[category] || category
      const src: any = (tokens as any)?.tokens?.font?.[pluralCategory] || (tokens as any)?.tokens?.font?.[category] || {}
      for (const [key, token] of Object.entries(src)) {
        if (key.startsWith('$')) continue
        const tokenVal = (token as any)?.['$value']
        if (tokenVal == null) continue
        if (String(tokenVal).trim() === valStr) {
          return `var(--recursica-tokens-font-${pluralCategory}-${key})`
        }
      }
    } catch { }
    return null
  }

  PREFIXES.forEach((p) => {
    const mapKey: Record<string, string> = { 'subtitle-1': 'subtitle', 'subtitle-2': 'subtitle-small', 'body-1': 'body', 'body-2': 'body-small' }
    const brandKey = mapKey[p] || p
    const spec: any = ttyp?.[brandKey]?.$value
    const ch = readChoices[p] || {}
    // Use brandKey for CSS variable names to match Brand.json naming
    const cssVarPrefix = brandKey

    const familyFromChoice = (() => {
      const v = (ch as any).family
      return (typeof v === 'string' && v.trim()) ? v : undefined
    })()
    const familyResolvedFromTokenRef = (() => {
      const v: any = spec?.fontFamily
      if (v && typeof v === 'object') {
        if (v.collection === 'Tokens' && typeof v.name === 'string') {
          const name = v.name.replace(/^token\./, '')
          const parts = name.split('/').slice(1) // drop leading 'font'
          if (parts[0] === 'typeface' && parts[1]) return getFontToken(`typeface/${parts[1]}`)
          if (parts[0] === 'family' && parts[1]) return getFontToken(`family/${parts[1]}`)
        }
      }
      const strResolved = resolveTokenRef(v)
      if (typeof strResolved !== 'undefined') return strResolved
      return undefined
    })()
    const defaultFamily = (() => getFontToken('typeface/primary') ?? getFontToken('family/primary') ?? undefined)()
    const defaultSize = (() => getFontToken('size/md') ?? 16)()
    const defaultWeight = (() => getFontToken('weight/regular') ?? 400)()
    const defaultSpacing = (() => getFontToken('letter-spacing/default') ?? 0)()
    const defaultLineHeight = (() => getFontToken('line-height/default') ?? 'normal')()

    const family = familyFromChoice ?? familyResolvedFromTokenRef ?? findOverrideForFamilyLiteral(spec?.fontFamily) ?? resolveTokenRef(spec?.fontFamily) ?? spec?.fontFamily ?? defaultFamily
    const sizeChoice = ch.size ? getFontToken(`size/${ch.size}`) : undefined
    const size = (sizeChoice != null ? sizeChoice : (resolveTokenRef(spec?.fontSize) ?? spec?.fontSize ?? defaultSize))
    const weightChoice = ch.weight ? getFontToken(`weight/${ch.weight}`) : undefined
    const weight = (weightChoice != null ? weightChoice : (resolveTokenRef(spec?.fontWeight ?? spec?.weight) ?? (spec?.fontWeight ?? spec?.weight) ?? defaultWeight))
    const spacingChoice = ch.spacing ? getFontToken(`letter-spacing/${ch.spacing}`) : undefined
    const spacing = (spacingChoice != null ? spacingChoice : (resolveTokenRef(spec?.letterSpacing) ?? spec?.letterSpacing ?? defaultSpacing))
    const lineHeightChoice = (ch as any).lineHeight ? getFontToken(`line-height/${(ch as any).lineHeight}`) : undefined
    const lineHeight = (lineHeightChoice != null ? lineHeightChoice : (resolveTokenRef(spec?.lineHeight) ?? spec?.lineHeight ?? defaultLineHeight))

    const styleChoice = (ch as any).style ? getFontToken(`styles/${(ch as any).style}`) : undefined
    const style = (styleChoice != null ? styleChoice : (resolveTokenRef(spec?.fontStyle) ?? spec?.fontStyle ?? 'normal'))

    const transformChoice = (ch as any).transform ? getFontToken(`cases/${(ch as any).transform}`) : undefined
    const transform = (transformChoice != null ? transformChoice : (resolveTokenRef(spec?.textTransform) ?? spec?.textTransform ?? 'none'))

    const decorationChoice = (ch as any).decoration ? getFontToken(`decorations/${(ch as any).decoration}`) : undefined
    const decoration = (decorationChoice != null ? decorationChoice : (resolveTokenRef(spec?.textDecoration) ?? spec?.textDecoration ?? 'none'))

    // Prefer token references where possible - always try to extract from spec first
    const familyToken = extractTokenRef(spec?.fontFamily) || (familyFromChoice ? extractTokenRef(familyFromChoice) : null)
    // For choices, construct token reference directly from the choice key
    const sizeToken = extractTokenRef(spec?.fontSize) || (sizeChoice != null ? { category: 'size' as const, suffix: ch.size } : null)
    const weightToken = extractTokenRef(spec?.fontWeight ?? spec?.weight) || (weightChoice != null ? { category: 'weight' as const, suffix: ch.weight } : null)
    const spacingToken = extractTokenRef(spec?.letterSpacing) || (spacingChoice != null ? { category: 'letter-spacing' as const, suffix: ch.spacing } : null)
    const lineHeightToken = extractTokenRef(spec?.lineHeight) || (lineHeightChoice != null ? { category: 'line-height' as const, suffix: (ch as any).lineHeight } : null)
    const styleToken = extractTokenRef(spec?.fontStyle) || (styleChoice != null ? { category: 'styles' as any, suffix: (ch as any).style } : null)
    const transformToken = extractTokenRef(spec?.textTransform) || (transformChoice != null ? { category: 'cases' as any, suffix: (ch as any).transform } : null)
    const decorationToken = extractTokenRef(spec?.textDecoration) || (decorationChoice != null ? { category: 'decorations' as any, suffix: (ch as any).decoration } : null)

    // Helper to find token by value for fallback
    const findTokenByValue = (value: any, category: 'family' | 'typeface' | 'size' | 'weight' | 'letter-spacing' | 'line-height'): string | null => {
      if (value == null) return null
      const valStr = String(value).trim()
      if (!valStr) return null
      try {
        // Map singular category to plural for token lookup
        const categoryToPlural: Record<string, string> = {
          'family': 'families',
          'typeface': 'typefaces',
          'size': 'sizes',
          'weight': 'weights',
          'letter-spacing': 'letter-spacings',
          'line-height': 'line-heights'
        }
        const pluralCategory = categoryToPlural[category] || category
        // Try plural form first, then singular for backwards compatibility
        const src: any = (tokens as any)?.tokens?.font?.[pluralCategory] || (tokens as any)?.tokens?.font?.[category] || {}
        for (const [key, token] of Object.entries(src)) {
          if (key.startsWith('$')) continue
          const tokenVal = (token as any)?.['$value']
          if (tokenVal == null) continue
          let tokenValStr: string | undefined
          if (typeof tokenVal === 'string') tokenValStr = tokenVal
          else if (typeof tokenVal === 'number') tokenValStr = String(tokenVal)
          else if (tokenVal && typeof tokenVal === 'object') {
            const v = (tokenVal as any).value
            const u = (tokenVal as any).unit
            if (typeof v === 'number') tokenValStr = u ? `${v}${u}` : String(v)
            else if (typeof v === 'string') tokenValStr = u ? `${v}${u}` : String(v)
          }
          if (tokenValStr && tokenValStr.trim() === valStr) {
            // Use plural form for CSS var name
            return `var(--recursica-tokens-font-${pluralCategory}-${key})`
          }
        }
      } catch { }
      return null
    }

    const brandPrefix = `--recursica-brand-typography-${cssVarPrefix}-`
    const shortPrefix = `--recursica-brand-typography-${cssVarPrefix}-`
    // Map singular category to plural form for CSS var names
    const categoryToPlural: Record<string, string> = {
      'family': 'families',
      'typeface': 'typefaces',
      'size': 'sizes',
      'weight': 'weights',
      'letter-spacing': 'letter-spacings',
      'line-height': 'line-heights'
    }
    // Always generate font-family CSS var, even if family is null (use default)
    // Helper to resolve token reference to actual value
    const resolveTokenRefToValue = (tokenRef: string): string => {
      // If it's a var() reference, extract the CSS variable name and look it up
      const varMatch = tokenRef.match(/var\s*\(\s*(--[^)]+?)\s*\)/)
      if (varMatch) {
        const tokenCssVar = varMatch[1].trim()
        // Look up the actual value from vars (token CSS variables are set earlier)
        const actualValue = vars[tokenCssVar]
        if (actualValue) {
          return actualValue
        }
        // If not found in vars, return the token reference as fallback
        // (This shouldn't happen normally, but provides safety)
        return tokenRef
      }
      // If not a var() reference, return as-is
      return tokenRef
    }

    let brandVal: string | null = null
    if (familyToken) {
      const pluralCategory = categoryToPlural[familyToken.category] || familyToken.category
      brandVal = `var(--recursica-tokens-font-${pluralCategory}-${familyToken.suffix})`
    } else if (family != null) {
      brandVal = findTokenByValue(family, 'typeface') || findTokenByValue(family, 'family')
    }

    // For brand vars, resolve token reference to actual value (font name with fallbacks)
    if (brandVal) {
      const resolvedValue = resolveTokenRefToValue(brandVal)
      vars[`${brandPrefix}font-family`] = resolvedValue
      vars[`${shortPrefix}font-family`] = resolvedValue
    } else {
      // Fallback to default token reference - ensure we always have a font-family
      const defaultFamilyToken = getFontToken('typeface/primary') ?? getFontToken('family/primary')
      if (defaultFamilyToken) {
        const defaultToken = findTokenByValue(defaultFamilyToken, 'typeface') || findTokenByValue(defaultFamilyToken, 'family')
        if (defaultToken) {
          const resolvedValue = resolveTokenRefToValue(defaultToken)
          vars[`${brandPrefix}font-family`] = resolvedValue
          vars[`${shortPrefix}font-family`] = resolvedValue
        } else {
          // Last resort: use typefaces-primary or families-primary token directly
          const primaryTypefaceToken = findTokenByValue('primary', 'typeface') || findTokenByValue('primary', 'family')
          if (primaryTypefaceToken) {
            const resolvedValue = resolveTokenRefToValue(primaryTypefaceToken)
            vars[`${brandPrefix}font-family`] = resolvedValue
            vars[`${shortPrefix}font-family`] = resolvedValue
          }
        }
      } else {
        // Absolute last resort: try to find any typeface token
        const anyTypefaceToken = findTokenByValue('primary', 'typeface') || findTokenByValue('primary', 'family')
        if (anyTypefaceToken) {
          const resolvedValue = resolveTokenRefToValue(anyTypefaceToken)
          vars[`${brandPrefix}font-family`] = resolvedValue
          vars[`${shortPrefix}font-family`] = resolvedValue
        }
      }
    }
    if (typeof family === 'string' && family.trim()) usedFamilies.add(family)
    else if (brandVal && typeof brandVal === 'string' && !brandVal.startsWith('var(')) usedFamilies.add(String(brandVal))
    if (size != null) {
      const brandVal = sizeToken
        ? `var(--recursica-tokens-font-${categoryToPlural[sizeToken.category] || sizeToken.category}-${sizeToken.suffix})`
        : findTokenByValue(size, 'size')

      // For brand vars, always use token reference
      if (brandVal) {
        vars[`${brandPrefix}font-size`] = brandVal
        vars[`${shortPrefix}font-size`] = brandVal
      } else {
        // Fallback to default token reference
        const defaultSize = getFontToken('size/md')
        if (defaultSize) {
          const defaultToken = findTokenByValue(defaultSize, 'size')
          if (defaultToken) {
            vars[`${brandPrefix}font-size`] = defaultToken
            vars[`${shortPrefix}font-size`] = defaultToken
          } else {
            vars[`${brandPrefix}font-size`] = 'var(--recursica-tokens-font-sizes-md)'
            vars[`${shortPrefix}font-size`] = 'var(--recursica-tokens-font-sizes-md)'
          }
        }
      }
    }
    if (weight != null) {
      const brandVal = weightToken
        ? `var(--recursica-tokens-font-${categoryToPlural[weightToken.category] || weightToken.category}-${weightToken.suffix})`
        : findTokenByValue(weight, 'weight')

      // For brand vars, always use token reference
      if (brandVal) {
        vars[`${brandPrefix}font-weight`] = brandVal
        vars[`${shortPrefix}font-weight`] = brandVal
      } else {
        // Fallback to default token reference
        vars[`${brandPrefix}font-weight`] = 'var(--recursica-tokens-font-weights-regular)'
        vars[`${shortPrefix}font-weight`] = 'var(--recursica-tokens-font-weights-regular)'
      }
    }
    if (spacing != null) {
      const brandVal = spacingToken
        ? `var(--recursica-tokens-font-${categoryToPlural[spacingToken.category] || spacingToken.category}-${spacingToken.suffix})`
        : findTokenByValue(spacing, 'letter-spacing')

      // For brand vars, always use token reference
      if (brandVal) {
        vars[`${brandPrefix}font-letter-spacing`] = brandVal
        vars[`${shortPrefix}font-letter-spacing`] = brandVal
      } else {
        // Fallback to default token reference
        vars[`${brandPrefix}font-letter-spacing`] = 'var(--recursica-tokens-font-letter-spacings-default)'
        vars[`${shortPrefix}font-letter-spacing`] = 'var(--recursica-tokens-font-letter-spacings-default)'
      }
    }
    if (lineHeight != null) {
      const brandVal = lineHeightToken
        ? `var(--recursica-tokens-font-${categoryToPlural[lineHeightToken.category] || lineHeightToken.category}-${lineHeightToken.suffix})`
        : findTokenByValue(lineHeight, 'line-height')

      // For brand vars, always use token reference
      if (brandVal) {
        vars[`${brandPrefix}line-height`] = brandVal
        vars[`${shortPrefix}line-height`] = brandVal
      } else {
        // Fallback to default token reference
        vars[`${brandPrefix}line-height`] = 'var(--recursica-tokens-font-line-heights-default)'
        vars[`${shortPrefix}line-height`] = 'var(--recursica-tokens-font-line-heights-default)'
      }
    }

    // Add font-style, text-transform, text-decoration to brand vars
    if (style != null) {
      const brandVal = styleToken
        ? `var(--recursica-tokens-font-styles-${styleToken.suffix})`
        : findTokenByCategoryAndValue(style, 'styles')
      if (brandVal) {
        vars[`${brandPrefix}font-style`] = brandVal
      } else {
        vars[`${brandPrefix}font-style`] = style
      }
    }

    if (transform != null) {
      let brandVal: string | null = null
      if (transformToken) {
        brandVal = `var(--recursica-tokens-font-cases-${transformToken.suffix})`
      } else {
        brandVal = findTokenByCategoryAndValue(transform, 'cases')
        // If still not found and transform is a token reference string, try to resolve it directly
        if (!brandVal && typeof transform === 'string' && transform.trim().startsWith('{') && transform.trim().endsWith('}')) {
          try {
            const context: TokenReferenceContext = {
              theme,
              currentMode: 'light'
            }
            brandVal = resolveTokenReferenceToCssVar(transform.trim(), context)
          } catch { }
        }
      }
      if (brandVal) {
        vars[`${brandPrefix}text-transform`] = brandVal
      } else {
        // Last resort: try to use default token reference
        vars[`${brandPrefix}text-transform`] = 'var(--recursica-tokens-font-cases-original)'
      }
    }

    if (decoration != null) {
      let brandVal: string | null = null
      if (decorationToken) {
        brandVal = `var(--recursica-tokens-font-decorations-${decorationToken.suffix})`
      } else {
        brandVal = findTokenByCategoryAndValue(decoration, 'decorations')
        // If still not found and decoration is a token reference string, try to resolve it directly
        if (!brandVal && typeof decoration === 'string' && decoration.trim().startsWith('{') && decoration.trim().endsWith('}')) {
          try {
            const context: TokenReferenceContext = {
              theme,
              currentMode: 'light'
            }
            brandVal = resolveTokenReferenceToCssVar(decoration.trim(), context)
          } catch { }
        }
      }
      if (brandVal) {
        vars[`${brandPrefix}text-decoration`] = brandVal
      } else {
        // Last resort: try to use default token reference (none exists in decorations)
        vars[`${brandPrefix}text-decoration`] = 'var(--recursica-tokens-font-decorations-none)'
      }
    }

    if (typeof family === 'string' && family.trim()) usedFamilies.add(family)
  })

  return { vars, familiesToLoad: Array.from(usedFamilies) }
}


