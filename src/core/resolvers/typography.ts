import type { JsonLike } from './tokens'
import { buildTokenIndex, resolveBraceRef } from './tokens'

export type TypographyChoices = Record<string, { family?: string; size?: string; weight?: string; spacing?: string; lineHeight?: string }>

export function buildTypographyVars(tokens: JsonLike, theme: JsonLike, overrides: Record<string, any> | undefined, choices: TypographyChoices | undefined): { vars: Record<string, string>; familiesToLoad: string[] } {
  const PREFIXES = ['h1','h2','h3','h4','h5','h6','subtitle-1','subtitle-2','body-1','body-2','button','caption','overline']
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

  // Emit CSS variables for font tokens so Brand can reference them via var(--recursica-tokens-font-*)
  // Check for deleted font families to skip creating CSS variables for them
  const readDeletedFontFamilies = (): Record<string, true> => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return {}
      const raw = localStorage.getItem('font-families-deleted')
      if (!raw) return {}
      const obj = JSON.parse(raw)
      if (obj && typeof obj === 'object') return obj as Record<string, true>
    } catch {}
    return {}
  }
  const deletedFamilies = readDeletedFontFamilies()
  
  try {
    const src: any = (tokens as any)?.tokens?.font || {}
    const emitCategory = (category: string, unitHint?: string) => {
      const cat: any = src?.[category] || {}
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
        
        // For font families/typefaces, only create CSS variable if it exists in overrides
        // This ensures deleted font families don't reappear
        if (category === 'family' || category === 'typeface') {
          if (overrideValue === undefined || overrideValue === null) {
            // Not in overrides, skip creating CSS variable
            return
          }
        }
        
        // Use override value if it exists, otherwise use token value
        let valueStr: string | undefined = undefined
        if (overrideValue !== undefined && overrideValue !== null && String(overrideValue).trim()) {
          valueStr = String(overrideValue)
        } else {
          const raw = cat[short]?.$value
          if (typeof raw === 'string') {
            valueStr = raw
          } else if (typeof raw === 'number') {
            valueStr = unitHint ? `${raw}${unitHint}` : String(raw)
          } else if (raw && typeof raw === 'object') {
            const val: any = (raw as any).value
            const unit: any = (raw as any).unit
            if (typeof val === 'number') valueStr = unit ? `${val}${unit}` : (unitHint ? `${val}${unitHint}` : String(val))
            else if (typeof val === 'string') valueStr = unit ? `${val}${unit}` : String(val)
          }
        }
        if (typeof valueStr === 'string' && valueStr) {
          vars[`--tokens-font-${category}-${short}`] = valueStr
        }
      })
    }
    emitCategory('family')            // string font-family stack
    emitCategory('typeface')          // specific font family name
    emitCategory('size', 'px')        // numeric → px
    emitCategory('weight')            // numeric or named
    emitCategory('letter-spacing', 'em')
    emitCategory('line-height')       // unitless or string
  } catch {}
  
  // Also emit CSS variables from overrides for font families/typefaces
  // This ensures custom-added font families and overridden values get CSS variables
  // Only create CSS variables for font families that exist in overrides
  try {
    Object.keys(effectiveOverrides).forEach((name) => {
      if (name.startsWith('font/typeface/') || name.startsWith('font/family/')) {
        const key = name.replace('font/typeface/', '').replace('font/family/', '')
        const category = name.startsWith('font/typeface/') ? 'typeface' : 'family'
        const value = String(effectiveOverrides[name] || '')
        
        // Skip if deleted
        const tokenName = `font/${category}/${key}`
        if (deletedFamilies[tokenName]) return
        
        // Only create CSS variable if value is not empty
        // Empty values mean the font family was deleted
        if (value && value.trim()) {
          vars[`--tokens-font-${category}-${key}`] = value
        }
      }
    })
  } catch {}

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
      const inner = s.startsWith('{') && s.endsWith('}') ? s.slice(1, -1).trim() : s
      const cats: Array<'family' | 'typeface' | 'size' | 'weight' | 'letter-spacing' | 'line-height'> = ['family','typeface','size','weight','letter-spacing','line-height']
      for (const cat of cats) {
        const re = new RegExp(`^(?:tokens|token)\\.font\\.${cat}\\.([a-z0-9\\-_]+)$`, 'i')
        const m = inner.match(re)
        if (m) return { category: cat, suffix: m[1] }
        const varRe = new RegExp(`^var\\(\\s*--tokens-font-${cat}-([a-z0-9\\-_]+)\\s*\\)\\s*$`, 'i')
        const mv = s.match(varRe)
        if (mv) return { category: cat, suffix: mv[1] }
      }
    } catch {}
    return null
  }

  const resolveTokenRef = (ref: any) => {
    try {
      if (typeof ref === 'string') {
        const s = ref.trim()
        const inner = s.startsWith('{') && s.endsWith('}') ? s.slice(1, -1).trim() : s
        const fontPrefixRe = /^(tokens|token)\.font\./i
        if (fontPrefixRe.test(inner)) {
          const rest = inner.replace(fontPrefixRe, '')
          const path = rest.replace(/[\.]/g, '/').replace(/\/+/, '/')
          return getFontToken(path)
        }
      }
    } catch {}
    return resolveBraceRef(ref, tokenIndex)
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
    // Prefer token references where possible - always try to extract from spec first
    const familyToken = extractTokenRef(spec?.fontFamily) || (familyFromChoice ? extractTokenRef(familyFromChoice) : null)
    const sizeToken = extractTokenRef(spec?.fontSize) || (sizeChoice != null ? extractTokenRef(`{tokens.font.size.${ch.size}}`) : null)
    const weightToken = extractTokenRef(spec?.fontWeight ?? spec?.weight) || (weightChoice != null ? extractTokenRef(`{tokens.font.weight.${ch.weight}}`) : null)
    const spacingToken = extractTokenRef(spec?.letterSpacing) || (spacingChoice != null ? extractTokenRef(`{tokens.font.letter-spacing.${ch.spacing}}`) : null)
    const lineHeightToken = extractTokenRef(spec?.lineHeight) || (lineHeightChoice != null ? extractTokenRef(`{tokens.font.line-height.${(ch as any).lineHeight}}`) : null)
    
    // Helper to find token by value for fallback
    const findTokenByValue = (value: any, category: 'family' | 'typeface' | 'size' | 'weight' | 'letter-spacing' | 'line-height'): string | null => {
      if (value == null) return null
      const valStr = String(value).trim()
      if (!valStr) return null
      try {
        const src: any = (tokens as any)?.tokens?.font?.[category] || {}
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
            return `var(--recursica-tokens-font-${category}-${key})`
          }
        }
      } catch {}
      return null
    }
    
    const brandPrefix = `--brand-typography-${cssVarPrefix}-`
    const shortPrefix = `--brand-typography-${cssVarPrefix}-`
    if (family != null) {
      const brandVal = familyToken 
        ? `var(--recursica-tokens-font-${familyToken.category}-${familyToken.suffix})`
        : (findTokenByValue(family, 'typeface') || findTokenByValue(family, 'family'))
      
      // For brand vars, always use token reference, never raw values
      if (brandVal) {
        vars[`${brandPrefix}font-family`] = brandVal
        vars[`${shortPrefix}font-family`] = brandVal
      } else {
        // Fallback to default token reference
        const defaultFamily = getFontToken('typeface/primary') ?? getFontToken('family/primary')
        if (defaultFamily) {
          const defaultToken = findTokenByValue(defaultFamily, 'typeface') || findTokenByValue(defaultFamily, 'family')
          if (defaultToken) {
            vars[`${brandPrefix}font-family`] = defaultToken
            vars[`${shortPrefix}font-family`] = defaultToken
          }
        }
      }
      if (typeof brandVal === 'string' && !brandVal.startsWith('var(')) usedFamilies.add(String(family))
      else if (typeof family === 'string' && family.trim()) usedFamilies.add(family)
    }
    if (size != null) {
      const brandVal = sizeToken 
        ? `var(--recursica-tokens-font-${sizeToken.category}-${sizeToken.suffix})`
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
            vars[`${brandPrefix}font-size`] = 'var(--recursica-tokens-font-size-md)'
            vars[`${shortPrefix}font-size`] = 'var(--recursica-tokens-font-size-md)'
          }
        }
      }
    }
    if (weight != null) {
      const brandVal = weightToken 
        ? `var(--recursica-tokens-font-${weightToken.category}-${weightToken.suffix})`
        : findTokenByValue(weight, 'weight')
      
      // For brand vars, always use token reference
      if (brandVal) {
        vars[`${brandPrefix}font-weight`] = brandVal
        vars[`${shortPrefix}font-weight`] = brandVal
      } else {
        // Fallback to default token reference
        vars[`${brandPrefix}font-weight`] = 'var(--recursica-tokens-font-weight-regular)'
        vars[`${shortPrefix}font-weight`] = 'var(--recursica-tokens-font-weight-regular)'
      }
    }
    if (spacing != null) {
      const brandVal = spacingToken 
        ? `var(--recursica-tokens-font-${spacingToken.category}-${spacingToken.suffix})`
        : findTokenByValue(spacing, 'letter-spacing')
      
      // For brand vars, always use token reference
      if (brandVal) {
        vars[`${brandPrefix}font-letter-spacing`] = brandVal
        vars[`${shortPrefix}font-letter-spacing`] = brandVal
      } else {
        // Fallback to default token reference
        vars[`${brandPrefix}font-letter-spacing`] = 'var(--recursica-tokens-font-letter-spacing-default)'
        vars[`${shortPrefix}font-letter-spacing`] = 'var(--recursica-tokens-font-letter-spacing-default)'
      }
    }
    if (lineHeight != null) {
      const brandVal = lineHeightToken 
        ? `var(--recursica-tokens-font-${lineHeightToken.category}-${lineHeightToken.suffix})`
        : findTokenByValue(lineHeight, 'line-height')
      
      // For brand vars, always use token reference
      if (brandVal) {
        vars[`${brandPrefix}line-height`] = brandVal
        vars[`${shortPrefix}line-height`] = brandVal
      } else {
        // Fallback to default token reference
        vars[`${brandPrefix}line-height`] = 'var(--recursica-tokens-font-line-height-default)'
        vars[`${shortPrefix}line-height`] = 'var(--recursica-tokens-font-line-height-default)'
      }
    }
    if (typeof family === 'string' && family.trim()) usedFamilies.add(family)
  })

  return { vars, familiesToLoad: Array.from(usedFamilies) }
}


