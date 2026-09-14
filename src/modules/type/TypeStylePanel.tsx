import { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { useVars } from '../vars/VarsContext'
import { updateCssVar } from '../../core/css/updateCssVar'
import { readCssVar as readCssVarRaw, readCssVarResolved as readCssVarResolvedRaw } from '../../core/css/readCssVar'
import { Slider } from '../../components/adapters/Slider'
import { Label } from '../../components/adapters/Label'
import { Button } from '../../components/adapters/Button'
import { ResetButton } from '../../components/shared/ResetButton'
import { SegmentedControl } from '../../components/adapters/SegmentedControl'
import { Tooltip } from '../../components/adapters/Tooltip'
import { Dropdown } from '../../components/adapters/Dropdown'
import { iconNameToReactComponent } from '../components/iconUtils'
import { Panel } from '../../components/adapters/Panel'
import { Modal } from '../../components/adapters/Modal'
import { useThemeMode } from '../theme/ThemeModeContext'
import { tokenFont, paletteCore, parseTokenCssVar, unwrapVar } from '../../core/css/cssVarBuilder'
import { buildTypographyVars } from '../../core/resolvers/typography'
import { getGlobalCssVar } from '../../components/utils/cssVarNames'
import { getVarsStore } from '../../core/store/varsStore'
import {
  CSS_PROP_TO_TYPE_PROP,
  TYPE_PROPS,
  inheritedRef,
  keyOfRef,
  overrideRef,
  parseTypographyVar,
  refToVar,
  typeOfToken,
  writeTypeOverride,
} from '../breakpoints/breakpointTypography'

function toTitleCase(label: string): string {
  return (label || '').replace(/[-_/]+/g, ' ').replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()).trim()
}

/** Control headings inside the core style panel. */
const CSS_PROP_LABEL: Record<string, string> = {
  'font-family': 'Font Family',
  'font-size': 'Font Size',
  'font-weight': 'Font Weight',
  'font-letter-spacing': 'Letter Spacing',
  'line-height': 'Line Height',
  'font-style': 'Style',
  'text-decoration': 'Decoration',
  'text-transform': 'Case',
}

/**
 * A segmented control always shows one selected segment, so a value the token graph cannot express
 * as a segment — `tokens.font.cases.original` resolves to the CSS keyword `unset` — falls back to
 * the first option rather than leaving nothing selected.
 */
function oneOf(value: string, items: Array<{ value: string }>): string {
  return items.some((i) => i.value === value) ? value : (items[0]?.value ?? value)
}

function brandKeyFromPrefix(prefix: string): string {
  const map: Record<string, string> = { 'subtitle-1': 'subtitle', 'subtitle-2': 'subtitle-small', 'body-1': 'body', 'body-2': 'body-small' }
  return map[prefix] || prefix
}

// Map prefix to CSS variable name (matches recursica_brand.json naming)
function prefixToCssVarName(prefix: string): string {
  return brandKeyFromPrefix(prefix)
}

// Helper to extract token name from CSS variable value
function extractTokenFromCssVar(cssValue: string): string | null {
  if (!cssValue) return null
  const parsed = parseTokenCssVar(cssValue)
  if (parsed && parsed.type === 'font') return parsed.key
  return null
}

export default function TypeStylePanel({ open, selectedPrefixes, title, onClose, breakpoint }: { open: boolean; selectedPrefixes: string[]; title: string; onClose: () => void; breakpoint?: string }) {
  const { tokens, theme, setTheme } = useVars()
  // With a breakpoint selected the panel edits that breakpoint's delta instead of the base style:
  // reads fall back to the base value (so the controls show what is inherited) and writes go to
  // brand.breakpoints.<bp>.typography. Without one, nothing about the panel changes.
  const editingBreakpoint = !!breakpoint

  /** The breakpoint's value for a typography var, as a var() reference, or null when it inherits. */
  const overrideFor = useCallback((cssVar: string): string | null => {
    if (!editingBreakpoint) return null
    const parsed = parseTypographyVar(cssVar)
    const prop = parsed && CSS_PROP_TO_TYPE_PROP[parsed.cssProp]
    if (!parsed || !prop) return null
    const ref = overrideRef(theme, breakpoint!, parsed.style, prop.key)
    return ref ? refToVar(ref) : null
  }, [editingBreakpoint, breakpoint, theme])

  const readVar = useCallback((cssVar: string) => overrideFor(cssVar) ?? readCssVarRaw(cssVar), [overrideFor])
  const readVarResolved = useCallback((cssVar: string) => {
    const override = overrideFor(cssVar)
    if (!override) return readCssVarResolvedRaw(cssVar)
    const inner = override.match(/var\((--[^),]+)/)
    return inner ? (readCssVarResolvedRaw(inner[1]) || readCssVarRaw(inner[1]) || '') : override
  }, [overrideFor])
  const [updateKey, setUpdateKey] = useState(0)

  // Local slider state to prevent snap-back during drag.
  // These track the slider index independently of CSS var re-derivation.
  const [localSizeIdx, setLocalSizeIdx] = useState<number | null>(null)
  const [localWeightIdx, setLocalWeightIdx] = useState<number | null>(null)
  const [localSpacingIdx, setLocalSpacingIdx] = useState<number | null>(null)
  const [localLineHeightIdx, setLocalLineHeightIdx] = useState<number | null>(null)
  // Which property's link the user is looking at, if any.
  const [linkModal, setLinkModal] = useState<{ cssProp: string; label: string } | null>(null)
  // Which property's core style is open for editing, if any.
  const [corePanel, setCorePanel] = useState<{ cssProp: string; label: string } | null>(null)
  const lockedForRef = useRef<(cssProp: string) => boolean>(() => false)

  // Listen for reset events to refresh font options
  // Clear local slider overrides so they re-derive from CSS vars
  useEffect(() => {
    const handler = () => {
      setLocalSizeIdx(null)
      setLocalWeightIdx(null)
      setLocalSpacingIdx(null)
      setLocalLineHeightIdx(null)
      setUpdateKey((k) => k + 1)
    }
    window.addEventListener('tokenOverridesChanged', handler)
    window.addEventListener('typeChoicesChanged', handler)
    return () => {
      window.removeEventListener('tokenOverridesChanged', handler)
      window.removeEventListener('typeChoicesChanged', handler)
    }
  }, [])

  // Re-read values when panel opens or selected prefixes change
  useEffect(() => {
    if (open && selectedPrefixes.length > 0) {
      setLocalSizeIdx(null)
      setLocalWeightIdx(null)
      setLocalSpacingIdx(null)
      setLocalLineHeightIdx(null)
      const timeoutId = setTimeout(() => {
        setUpdateKey((k) => k + 1)
      }, 100)
      return () => clearTimeout(timeoutId)
    }
  }, [open, selectedPrefixes])

  // Helper to extract numeric value from token
  const getTokenValue = (tokenRec: any): number | undefined => {
    if (!tokenRec) return undefined
    const value = tokenRec.$value
    if (typeof value === 'number') return value
    if (value && typeof value === 'object' && typeof value.value === 'number') {
      return value.value
    }
    return undefined
  }

  // options
  const sizeOptions = useMemo(() => {
    const out: Array<{ short: string; label: string; value?: number }> = []
    try {
      // Check both plural and singular forms
      const fontSizes = (tokens as any)?.tokens?.font?.sizes || (tokens as any)?.tokens?.font?.size || {}
      Object.entries(fontSizes).forEach(([k, rec]: [string, any]) => {
        const value = getTokenValue(rec)
        out.push({ short: k, label: toTitleCase(k), value })
      })
    } catch { }
    return out
  }, [tokens])
  // ---------------------------------------------------------------------------
  // Shared helper: resolve font variants array for a given font-family CSS var.
  // Returns null when no variant data exists (all weights/styles allowed).
  // ---------------------------------------------------------------------------
  const getVariantsForFontCssVar = useCallback((cssVar: string): Array<{ weight: string; style: string }> | null => {
    try {
      const fontRoot = (tokens as any)?.tokens?.font || (tokens as any)?.font || {}
      const fontVariants = fontRoot.fontVariants || {}

      // Fully resolve the CSS variable value to a font-family string
      let cssValue = readVarResolved(cssVar) || readVar(cssVar) || ''
      let depth = 0
      while (cssValue.startsWith('var(') && depth < 5) {
        const m = cssValue.match(/var\s*\(\s*(--[^)]+?)\s*\)/)
        if (m) cssValue = readVarResolved(m[1]) || readVar(m[1]) || ''
        else break
        depth++
      }

      const fontNameMatch = cssValue.match(/^["']?([^"',]+)["']?/)
      if (!fontNameMatch) return null
      const cleanFontName = fontNameMatch[1].trim().toLowerCase()

      let variants: Array<{ weight: string; style: string }> | null = fontVariants[cleanFontName] || null

      // Fallback to older $extensions structure
      if (!variants || variants.length === 0) {
        const typefaces = fontRoot.typefaces || fontRoot.typeface || {}
        for (const [key, typefaceDef] of Object.entries(typefaces)) {
          if (key.startsWith('$')) continue
          const typeface = typefaceDef as any
          const value = typeface?.$value
          let typefaceFontName = ''
          if (Array.isArray(value) && value.length > 0) {
            typefaceFontName = typeof value[0] === 'string' ? value[0].trim().replace(/^["']|["']$/g, '').toLowerCase() : ''
          } else if (typeof value === 'string') {
            typefaceFontName = value.trim().replace(/^["']|["']$/g, '').toLowerCase()
          }
          if (typefaceFontName === cleanFontName) {
            const exts = typeface?.$extensions
            variants = exts?.['com.google.fonts']?.variants || exts?.variants || null
            break
          }
        }
      }

      return variants && variants.length > 0 ? variants : null
    } catch {
      return null
    }
  }, [tokens])

  const weightOptions = useMemo(() => {
    const out: Array<{ short: string; label: string; value?: number }> = []
    try {
      const fontWeights = (tokens as any)?.tokens?.font?.weights || (tokens as any)?.tokens?.font?.weight || {}

      let allowedWeightKeys: Set<string> | null = null

      if (open && selectedPrefixes.length > 0) {
        let hasFontsWithVariants = false
        const intersectingWeights = new Set<string>()
        let isFirstFont = true

        selectedPrefixes.forEach((prefix) => {
          const cssVar = `--recursica_brand_typography_${prefixToCssVarName(prefix)}-font-family`
          const variants = getVariantsForFontCssVar(cssVar)

          if (variants) {
            hasFontsWithVariants = true
            const fontWeightKeys = new Set<string>()
            variants.forEach((variant) => {
              if (variant && typeof variant.weight === 'string') {
                const weightMatch = variant.weight.match(/\{tokens?\.font\.weights?\.([a-z0-9\-_]+)\}/i)
                if (weightMatch?.[1]) fontWeightKeys.add(weightMatch[1])
              }
            })

            if (isFirstFont) {
              fontWeightKeys.forEach((k) => intersectingWeights.add(k))
              isFirstFont = false
            } else {
              const toRemove: string[] = []
              intersectingWeights.forEach((k) => { if (!fontWeightKeys.has(k)) toRemove.push(k) })
              toRemove.forEach((k) => intersectingWeights.delete(k))
            }
          }
        })

        if (hasFontsWithVariants) allowedWeightKeys = intersectingWeights
      }

      Object.entries(fontWeights).forEach(([k, rec]: [string, any]) => {
        if (allowedWeightKeys && !allowedWeightKeys.has(k)) return
        const value = getTokenValue(rec)
        out.push({ short: k, label: toTitleCase(k), value })
      })
    } catch { }
    return out
  }, [tokens, open, selectedPrefixes, updateKey, getVariantsForFontCssVar])

  // ---------------------------------------------------------------------------
  // Compute the set of available font-style CSS values (e.g. 'normal', 'italic')
  // across all selected prefixes.  When no variant data exists for a font we
  // conservatively allow all styles.
  // ---------------------------------------------------------------------------
  const availableFontStyles = useMemo((): Set<string> => {
    if (!open || selectedPrefixes.length === 0) return new Set(['normal', 'italic'])
    try {
      const fontRoot = (tokens as any)?.tokens?.font || (tokens as any)?.font || {}
      const styles: any = fontRoot?.styles || {}

      const stylesSets: Set<string>[] = []

      selectedPrefixes.forEach((prefix) => {
        const cssVar = `--recursica_brand_typography_${prefixToCssVarName(prefix)}-font-family`
        const variants = getVariantsForFontCssVar(cssVar)
        if (!variants) return // no variant data → don't constrain this font

        const fontStyleValues = new Set<string>()
        variants.forEach((variant) => {
          if (!variant?.style) return
          const styleMatch = variant.style.match(/\{tokens?\.font\.styles?\.([a-z0-9\-_]+)\}/i)
          if (styleMatch?.[1]) {
            const styleDef = styles[styleMatch[1]]
            fontStyleValues.add(styleDef?.$value || styleMatch[1])
          }
        })
        if (fontStyleValues.size > 0) stylesSets.push(fontStyleValues)
      })

      if (stylesSets.length === 0) return new Set(['normal', 'italic'])

      // Intersect across all selected prefixes
      const result = new Set(stylesSets[0])
      for (let i = 1; i < stylesSets.length; i++) {
        for (const s of result) {
          if (!stylesSets[i].has(s)) result.delete(s)
        }
      }
      return result
    } catch {
      return new Set(['normal', 'italic'])
    }
  }, [tokens, open, selectedPrefixes, updateKey, getVariantsForFontCssVar])
  const spacingOptions = useMemo(() => {
    const out: Array<{ short: string; label: string; value?: number }> = []
    try {
      // Check both plural and singular forms
      const letterSpacings = (tokens as any)?.tokens?.font?.['letter-spacings'] || (tokens as any)?.tokens?.font?.['letter-spacing'] || {}
      Object.entries(letterSpacings).forEach(([k, rec]: [string, any]) => {
        const value = getTokenValue(rec)
        out.push({ short: k, label: toTitleCase(k), value })
      })
    } catch { }
    return out
  }, [tokens])
  const lineHeightOptions = useMemo(() => {
    const out: Array<{ short: string; label: string; value?: number }> = []
    try {
      // Check both plural and singular forms
      const lineHeights = (tokens as any)?.tokens?.font?.['line-heights'] || (tokens as any)?.tokens?.font?.['line-height'] || {}
      Object.entries(lineHeights).forEach(([k, rec]: [string, any]) => {
        const value = getTokenValue(rec)
        out.push({ short: k, label: toTitleCase(k), value })
      })
    } catch { }
    return out
  }, [tokens])
  // Font style segmented control options — filtered to only what the current font supports
  const fontStyleItems = useMemo(() => {
    const RomanIcon = iconNameToReactComponent('radix-font-roman')
    const ItalicIcon = iconNameToReactComponent('radix-font-italic')
    const all = [
      { value: 'normal', label: 'Normal', icon: RomanIcon ? <RomanIcon size={16} /> : null, tooltip: 'Normal' },
      { value: 'italic', label: 'Italic', icon: ItalicIcon ? <ItalicIcon size={16} /> : null, tooltip: 'Italic' },
    ]
    return all.filter((item) => availableFontStyles.has(item.value))
  }, [availableFontStyles])

  // Text decoration segmented control options (icons matching toolbar)
  const textDecorationItems = useMemo(() => {
    const NoneIcon = iconNameToReactComponent('radix-text-none')
    const UnderlineIcon = iconNameToReactComponent('radix-underline')
    const StrikethroughIcon = iconNameToReactComponent('radix-strikethrough')
    return [
      { value: 'none', label: 'None', icon: NoneIcon ? <NoneIcon size={16} /> : null, tooltip: 'None' },
      { value: 'underline', label: 'Underline', icon: UnderlineIcon ? <UnderlineIcon size={16} /> : null, tooltip: 'Underline' },
      { value: 'line-through', label: 'Line Through', icon: StrikethroughIcon ? <StrikethroughIcon size={16} /> : null, tooltip: 'Line Through' },
    ]
  }, [])

  // Text case segmented control options (icons matching toolbar)
  const textCaseItems = useMemo(() => {
    const TextNoneIcon = iconNameToReactComponent('radix-text-none')
    const UppercaseIcon = iconNameToReactComponent('radix-letter-case-uppercase')
    const LowercaseIcon = iconNameToReactComponent('radix-letter-case-lowercase')
    const CapitalizeIcon = iconNameToReactComponent('radix-letter-case-capitalize')
    return [
      { value: 'none', label: 'Original', icon: TextNoneIcon ? <TextNoneIcon size={16} /> : null, tooltip: 'Original' },
      { value: 'uppercase', label: 'Uppercase', icon: UppercaseIcon ? <UppercaseIcon size={16} /> : null, tooltip: 'Uppercase' },
      { value: 'lowercase', label: 'Lowercase', icon: LowercaseIcon ? <LowercaseIcon size={16} /> : null, tooltip: 'Lowercase' },
      { value: 'capitalize', label: 'Capitalize', icon: CapitalizeIcon ? <CapitalizeIcon size={16} /> : null, tooltip: 'Capitalize' },
    ]
  }, [])
  const familyOptions = useMemo(() => {
    const out: Array<{ short: string; label: string; value: string }> = []
    const TOKEN_ORDER = ['primary', 'secondary', 'tertiary', 'quaternary', 'quinary', 'senary', 'septenary', 'octonary']

    try {
      const brandRoot: any = (theme as any)?.brand || theme || {}
      const brandFonts: any = brandRoot?.fonts || {}

      TOKEN_ORDER.forEach(key => {
        if (!brandFonts[key] || brandFonts[key].$value === undefined) return

        // Resolve the actual CSS font-family string via the live CSS var
        const cssVar = `--recursica_brand_fonts_${key}`
        const resolvedValue = readVarResolved(cssVar) || readVar(cssVar) || ''
        const cleanFontName = resolvedValue.split(',')[0].trim().replace(/^['"]|['"]$/g, '')

        const displayLabel = cleanFontName
          ? `${toTitleCase(key)} (${cleanFontName})`
          : toTitleCase(key)

        out.push({ short: key, label: displayLabel, value: resolvedValue || cleanFontName })
      })
    } catch { }

    return out
  }, [theme, updateKey])

  // Helper to get current token name from CSS variable (follows the chain)
  const getCurrentTokenName = (cssVar: string, options: Array<{ short: string }>): string | undefined => {
    if (options.length === 0 || !cssVar) return undefined
    try {
      // First try reading the direct CSS variable value
      let cssValue = readVar(cssVar)
      if (!cssValue) {
        // Try reading resolved value as fallback
        cssValue = readVarResolved(cssVar)
        if (!cssValue) {
          // CSS variable doesn't exist yet - return undefined
          return undefined
        }
      }

      // Follow the chain to find the actual token reference
      let depth = 0
      const seen = new Set<string>()
      while (cssValue && depth < 10) {
        // Check if we've seen this value before (prevent infinite loops)
        if (seen.has(cssValue)) break
        seen.add(cssValue)

        // Try to extract token name from current value
        const tokenName = extractTokenFromCssVar(cssValue)
        if (tokenName) {
          const option = options.find((o) => o.short === tokenName)
          if (option) return option.short
        }

        // If it's a var() reference, follow the chain
        if (cssValue.startsWith('var(')) {
          const varMatch: RegExpMatchArray | null = cssValue.match(/var\s*\(\s*(--[^)]+?)\s*\)/)
          if (varMatch) {
            const innerVar: string = varMatch[1].trim()
            const nextValue: string | undefined = readVar(innerVar) || readVarResolved(innerVar)
            if (!nextValue || nextValue === cssValue) break // No progress or circular reference
            cssValue = nextValue
            depth++
          } else {
            break
          }
        } else {
          // Not a var() reference, can't follow chain further
          break
        }
      }
    } catch (e) {
      console.warn('Error reading CSS variable:', cssVar, e)
    }
    return undefined
  }

  // Helper to get current font family value from CSS variable (follows the chain)
  const getCurrentFamily = (cssVar: string): string => {
    if (!cssVar) return ''
    try {
      // Follow the chain to find the actual token reference
      let cssValue = readVar(cssVar)
      if (!cssValue) {
        // Try reading resolved value as fallback
        cssValue = readVarResolved(cssVar)
        if (!cssValue) return ''
      }

      let depth = 0
      const seen = new Set<string>()
      while (cssValue && depth < 10) {
        // Check if we've seen this value before (prevent infinite loops)
        if (seen.has(cssValue)) break
        seen.add(cssValue)

        // Extract token reference using central parser
        const fontParsed = parseTokenCssVar(cssValue)
        if (fontParsed && fontParsed.type === 'font') {
          const option = familyOptions.find((o) => o.short === fontParsed.key)
          if (option) return option.value
        }

        // If it's a var() reference, follow the chain
        if (cssValue.startsWith('var(')) {
          const varMatch: RegExpMatchArray | null = cssValue.match(/var\s*\(\s*(--[^)]+?)\s*\)/)
          if (varMatch) {
            const innerVar: string = varMatch[1].trim()
            cssValue = readVar(innerVar) || readVarResolved(innerVar) || cssValue
            depth++
          } else {
            break
          }
        } else {
          // If it's a literal value, return it
          return cssValue
        }
      }
    } catch (e) {
      console.warn('Error reading font family CSS variable:', cssVar, e)
    }
    return ''
  }

  // Directly update CSS variables like component toolbar does
  const updateCssVarValue = useCallback((property: 'font-family' | 'font-size' | 'font-weight' | 'font-letter-spacing' | 'line-height' | 'font-style' | 'text-decoration' | 'text-transform', tokenShort: string, opts?: { toCore?: boolean }) => {
    // Some adapters only grey a disabled control out and still fire onChange, so the lock is
    // enforced here too: a property following the core style cannot be written from this panel.
    // A write aimed at the core style is exempt — that is the point of the core panel.
    const toCore = opts?.toCore === true
    if (!toCore && lockedForRef.current(property)) return
    const cssVars: string[] = []

    selectedPrefixes.forEach((prefix) => {
      const cssVarName = prefixToCssVarName(prefix)
      let cssVar = ''
      let tokenValue = ''

      // Map property to CSS variable name and token reference
      if (property === 'font-family') {
        cssVar = `--recursica_brand_typography_${cssVarName}-font-family`
        // Write a reference to the brand.fonts CSS var (e.g. var(--recursica_brand_fonts_primary))
        // This follows the two-tier chain: brand.typography → brand.fonts → tokens.font.typefaces
        tokenValue = `var(--recursica_brand_fonts_${tokenShort})`
      } else if (property === 'font-size') {
        cssVar = `--recursica_brand_typography_${cssVarName}-font-size`
        tokenValue = `var(--recursica_tokens_font_sizes_${tokenShort})`
      } else if (property === 'font-weight') {
        cssVar = `--recursica_brand_typography_${cssVarName}-font-weight`
        tokenValue = `var(--recursica_tokens_font_weights_${tokenShort})`
      } else if (property === 'font-letter-spacing') {
        cssVar = `--recursica_brand_typography_${cssVarName}-font-letter-spacing`
        tokenValue = `var(--recursica_tokens_font_letter-spacings_${tokenShort})`
      } else if (property === 'line-height') {
        cssVar = `--recursica_brand_typography_${cssVarName}-line-height`
        tokenValue = `var(--recursica_tokens_font_line-heights_${tokenShort})`
      } else if (property === 'font-style') {
        cssVar = `--recursica_brand_typography_${cssVarName}-font-style`
        tokenValue = `var(--recursica_tokens_font_styles_${tokenShort})`
      } else if (property === 'text-decoration') {
        cssVar = `--recursica_brand_typography_${cssVarName}-text-decoration`
        tokenValue = `var(--recursica_tokens_font_decorations_${tokenShort})`
      } else if (property === 'text-transform') {
        cssVar = `--recursica_brand_typography_${cssVarName}-text-transform`
        tokenValue = `var(--recursica_tokens_font_cases_${tokenShort})`
      }

      if (cssVar && tokenValue) {
        if (editingBreakpoint && !toCore) {
          // The base style is left alone; the breakpoint stores the difference.
          const entry = CSS_PROP_TO_TYPE_PROP[property]
          const next = getVarsStore().getLatestThemeCopy()
          writeTypeOverride(
            next.brand ?? next,
            breakpoint!,
            prefixToCssVarName(prefix),
            entry.key,
            `{${entry.group}.${tokenShort}}`,
            typeOfToken(entry.group, tokenShort, tokens, theme),
          )
          setTheme(next)
        } else {
          // Set CSS variable synchronously to ensure it's in DOM before any recomputes
          updateCssVar(cssVar, tokenValue, tokens, true) // silent=true to prevent immediate events
        }
        cssVars.push(cssVar)
      }
    })

    // Dispatch event to notify components
    if (cssVars.length > 0) {
      // Use setTimeout to ensure CSS variables are set in DOM before dispatching
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
          detail: { cssVars }
        }))
        setUpdateKey((k) => k + 1)
      }, 0)

      // Load fonts asynchronously AFTER CSS variable is set
      // Delay to ensure CSS variable is preserved before font-loaded events trigger recomputes
      if (property === 'font-family' && tokenShort) {
        setTimeout(() => {
          import('../../modules/type/fontUtils').then(({ ensureFontLoaded }) => {
            const familyOption = familyOptions.find((o) => o.short === tokenShort)
            if (familyOption) {
              ensureFontLoaded(familyOption.value.trim()).catch(() => { })
            }
          }).catch(() => { })
        }, 200) // Delay to ensure CSS variable is set and preserved
      }
    }
  }, [selectedPrefixes, tokens, theme, familyOptions, editingBreakpoint, breakpoint, setTheme])

  /**
   * Whether a property still follows the core style at this breakpoint. Same idea as the global
   * ref link on component properties: linked by default, broken the moment you set a value here,
   * and relinkable from the icon.
   */
  const isLinked = useCallback((cssProp: string) => {
    if (!editingBreakpoint) return false
    const entry = CSS_PROP_TO_TYPE_PROP[cssProp]
    if (!entry) return false
    return !selectedPrefixes.some((prefix) =>
      overrideRef(theme, breakpoint!, prefixToCssVarName(prefix), entry.key))
  }, [editingBreakpoint, breakpoint, theme, selectedPrefixes])

  const relink = useCallback((cssProp: string) => {
    const entry = CSS_PROP_TO_TYPE_PROP[cssProp]
    if (!entry) return
    const next = getVarsStore().getLatestThemeCopy()
    selectedPrefixes.forEach((prefix) => {
      writeTypeOverride(next.brand ?? next, breakpoint!, prefixToCssVarName(prefix), entry.key, '', undefined)
    })
    setTheme(next)
    // The sliders hold their own position while dragging; drop it so they re-read the inherited value.
    setLocalSizeIdx(null)
    setLocalWeightIdx(null)
    setLocalSpacingIdx(null)
    setLocalLineHeightIdx(null)
    setUpdateKey((k) => k + 1)
  }, [breakpoint, selectedPrefixes, setTheme])

  /**
   * A control's label with its link state beside it, following the global-ref control: a globe
   * button while the property still comes from the core style — the control itself stays disabled
   * until the link is broken from there. Plain label when not editing a breakpoint.
   */
  const propLabel = (text: string, cssProp: string) => {
    if (!editingBreakpoint) return <Label layer="layer-3" layout="stacked">{text}</Label>
    const linked = isLinked(cssProp)
    const GlobeIcon = iconNameToReactComponent('globe-simple')
    const UndoIcon = iconNameToReactComponent('arrow-clockwise')
    const title = linked ? 'Edit the core type style' : 'Reattach to the core type style'
    const onClick = () =>
      linked ? setCorePanel({ cssProp, label: text }) : setLinkModal({ cssProp, label: text })

    // Same shape the global-ref control uses on component properties: a bare globe while attached,
    // a Reattach button once overridden, both sitting in the Label's own edit-icon slot.
    const icon = linked
      ? (GlobeIcon
          ? <Tooltip label={title} withinPortal zIndex={10000} position="top">
              <GlobeIcon style={{ width: 16, height: 16, color: `var(${paletteCore(mode, 'primary', 'tone')})` }} />
            </Tooltip>
          : null)
      : (
        <Button
          variant="text"
          size="small"
          icon={UndoIcon ? <UndoIcon style={{ width: 13, height: 13 }} /> : null}
          onClick={onClick}
        >
          Reattach
        </Button>
      )

    return (
      // layer-0 so the edit-icon button renders bare, the way it does on component properties.
      <Label
        layer="layer-0"
        layout="stacked"
        editIcon={icon}
        onEditIconClick={onClick}
      >
        {text}
      </Label>
    )
  }

  /** True while this property still follows the core style, so its control stays read-only. */
  const lockedFor = (cssProp: string) => editingBreakpoint && isLinked(cssProp)
  lockedForRef.current = lockedFor

  /** Greys out and stops clicks on a control whose own disabled state is cosmetic only. */
  const lockedStyle = (cssProp: string): React.CSSProperties =>
    lockedFor(cssProp) ? { opacity: 0.5, pointerEvents: 'none' } : {}

  /**
   * Breaks the link by writing the value the property inherits today. The control then edits that
   * copy, so detaching never changes how anything looks.
   */
  const detach = useCallback((cssProp: string) => {
    const entry = CSS_PROP_TO_TYPE_PROP[cssProp]
    if (!entry) return
    const next = getVarsStore().getLatestThemeCopy()
    const brand = next.brand ?? next
    selectedPrefixes.forEach((prefix) => {
      const style = prefixToCssVarName(prefix)
      const ref = inheritedRef(theme, style, entry.key)
      if (!ref) return
      writeTypeOverride(brand, breakpoint!, style, entry.key, ref, typeOfToken(entry.group, keyOfRef(ref), tokens, theme))
    })
    setTheme(next)
    setUpdateKey((k) => k + 1)
  }, [breakpoint, selectedPrefixes, theme, tokens, setTheme])

  const revert = useCallback(() => {
    if (editingBreakpoint) {
      // Drop this breakpoint's overrides for the selected styles; the base style is untouched.
      const next = getVarsStore().getLatestThemeCopy()
      selectedPrefixes.forEach((prefix) => {
        TYPE_PROPS.forEach((prop) => {
          writeTypeOverride(next.brand ?? next, breakpoint!, prefixToCssVarName(prefix), prop.key, '', undefined)
        })
      })
      setTheme(next)
      setLocalSizeIdx(null)
      setLocalWeightIdx(null)
      setLocalSpacingIdx(null)
      setLocalLineHeightIdx(null)
      setUpdateKey((k) => k + 1)
      return
    }
    // Rebuild typography vars from recursica_brand.json defaults (no choices = use defaults)
    const { vars: defaultTypeVars } = buildTypographyVars(tokens, theme, undefined, undefined)

    const cssVars: string[] = []

    selectedPrefixes.forEach((prefix) => {
      const cssVarName = prefixToCssVarName(prefix)
      const properties = ['font-family', 'font-size', 'font-weight', 'font-letter-spacing', 'line-height', 'font-style', 'text-decoration', 'text-transform']

      properties.forEach((prop) => {
        const cssVar = `--recursica_brand_typography_${cssVarName}-${prop}`

        // Remove the override first
        document.documentElement.style.removeProperty(cssVar)

        // Restore default value from recursica_brand.json
        const defaultValue = defaultTypeVars[cssVar]
        if (defaultValue) {
          updateCssVar(cssVar, defaultValue, tokens, true) // silent=true to prevent immediate events
        }

        cssVars.push(cssVar)
      })
    })

    // Dispatch event to notify components
    if (cssVars.length > 0) {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
          detail: { cssVars }
        }))
        setUpdateKey((k) => k + 1)
      }, 0)
    }
  }, [selectedPrefixes, tokens, theme])

  // Calculate current values at top level (hooks must be unconditional)
  const prefix = selectedPrefixes.length > 0 ? selectedPrefixes[0] : null
  const cssVarName = prefix ? prefixToCssVarName(prefix) : ''

  const sizeCssVar = prefix ? `--recursica_brand_typography_${cssVarName}-font-size` : ''
  const weightCssVar = prefix ? `--recursica_brand_typography_${cssVarName}-font-weight` : ''
  const spacingCssVar = prefix ? `--recursica_brand_typography_${cssVarName}-font-letter-spacing` : ''
  const lineHeightCssVar = prefix ? `--recursica_brand_typography_${cssVarName}-line-height` : ''
  const familyCssVar = prefix ? `--recursica_brand_typography_${cssVarName}-font-family` : ''
  const styleCssVar = prefix ? `--recursica_brand_typography_${cssVarName}-font-style` : ''
  const decorationCssVar = prefix ? `--recursica_brand_typography_${cssVarName}-text-decoration` : ''
  const transformCssVar = prefix ? `--recursica_brand_typography_${cssVarName}-text-transform` : ''

  // Read current values directly from CSS variables (simplified like component toolbar)
  const sizeCurrentToken = useMemo(() => {
    if (!prefix || !open) return undefined
    const token = getCurrentTokenName(sizeCssVar, sizeOptions)
    return token
  }, [sizeCssVar, sizeOptions, updateKey, prefix, open])

  const weightCurrentToken = useMemo(() => {
    if (!prefix || !open) return undefined
    const token = getCurrentTokenName(weightCssVar, weightOptions)
    return token
  }, [weightCssVar, weightOptions, updateKey, prefix, open])

  const spacingCurrentToken = useMemo(() => {
    if (!prefix || !open) return undefined
    const token = getCurrentTokenName(spacingCssVar, spacingOptions)
    return token
  }, [spacingCssVar, spacingOptions, updateKey, prefix, open])

  const lineHeightCurrentToken = useMemo(() => {
    if (!prefix || !open) return undefined
    const token = getCurrentTokenName(lineHeightCssVar, lineHeightOptions)
    return token
  }, [lineHeightCssVar, lineHeightOptions, updateKey, prefix, open])

  const styleCurrentToken = useMemo(() => {
    if (!prefix || !open) return undefined
    return getCurrentTokenName(styleCssVar, fontStyleItems.map(i => ({ short: i.value })))
  }, [styleCssVar, fontStyleItems, updateKey, prefix, open])

  const decorationCurrentToken = useMemo(() => {
    if (!prefix || !open) return undefined
    return getCurrentTokenName(decorationCssVar, textDecorationItems.map(i => ({ short: i.value })))
  }, [decorationCssVar, textDecorationItems, updateKey, prefix, open])

  const transformCurrentToken = useMemo(() => {
    if (!prefix || !open) return undefined
    return getCurrentTokenName(transformCssVar, textCaseItems.map(i => ({ short: i.value })))
  }, [transformCssVar, textCaseItems, updateKey, prefix, open])

  // Resolve current CSS values for SegmentedControl
  const currentFontStyleValueRaw = useMemo(() => {
    if (!prefix || !open) return 'normal'
    const resolved = readVarResolved(styleCssVar) || readVar(styleCssVar) || 'normal'
    return resolved.replace(/^["']|["']$/g, '').trim()
  }, [styleCssVar, updateKey, prefix, open])
  const currentFontStyleValue = oneOf(currentFontStyleValueRaw, fontStyleItems)

  const currentDecorationValue = useMemo(() => {
    if (!prefix || !open) return 'none'
    const resolved = readVarResolved(decorationCssVar) || readVar(decorationCssVar) || 'none'
    return oneOf(resolved.replace(/^["']|["']$/g, '').trim(), textDecorationItems)
  }, [decorationCssVar, updateKey, prefix, open, textDecorationItems])

  const currentTransformValue = useMemo(() => {
    if (!prefix || !open) return 'none'
    const resolved = readVarResolved(transformCssVar) || readVar(transformCssVar) || 'none'
    return oneOf(resolved.replace(/^["']|["']$/g, '').trim(), textCaseItems)
  }, [transformCssVar, updateKey, prefix, open, textCaseItems])

  // Handlers for SegmentedControl changes
  // Map CSS values back to token keys for updateCssVarValue
  const handleFontStyleChange = useCallback((value: string) => {
    // Token keys match CSS values for styles: 'normal' -> 'normal', 'italic' -> 'italic'
    updateCssVarValue('font-style', value)
  }, [updateCssVarValue])

  const handleDecorationChange = useCallback((value: string) => {
    // Token keys in recursica_tokens.json match the CSS values directly:
    // 'none' -> 'none', 'underline' -> 'underline', 'line-through' -> 'line-through'
    updateCssVarValue('text-decoration', value)
  }, [updateCssVarValue])

  const handleTransformChange = useCallback((value: string) => {
    // Map CSS values to token keys: 'none' -> 'original', 'uppercase' -> 'uppercase', 'lowercase' -> 'lowercase', 'capitalize' -> 'titlecase'
    const tokenMap: Record<string, string> = { 'none': 'original', 'uppercase': 'uppercase', 'lowercase': 'lowercase', 'capitalize': 'titlecase' }
    updateCssVarValue('text-transform', tokenMap[value] || value)
  }, [updateCssVarValue])

  // Get current family token short name (not the font value)
  const currentFamilyToken = useMemo(() => {
    if (selectedPrefixes.length === 0 || !open) return ''

    const getTokenForCssVar = (cssVar: string): string => {
      try {
        // Read CSS variable and extract token name
        const cssValue = readVar(cssVar) || readVarResolved(cssVar)
        if (!cssValue) return ''

        // Typography font-family vars point to var(--recursica_brand_fonts_X).
        // Extract X directly — it matches familyOptions[].short (e.g. 'primary').
        if (cssValue.startsWith('var(')) {
          const innerVarName = unwrapVar(cssValue)
          if (innerVarName) {
            const brandFontsMatch = innerVarName.match(/^--recursica_brand_fonts_(.+)$/)
            if (brandFontsMatch) {
              return brandFontsMatch[1]
            }

            // Follow further for other var() chains
            const innerValue = readVar(innerVarName) || readVarResolved(innerVarName)
            if (innerValue) {
              const innerParsed = parseTokenCssVar(innerValue)
              if (innerParsed && innerParsed.type === 'font') {
                // innerParsed.key is a typeface slug — map back to a sequence key
                const matchBySlug = familyOptions.find((o) => {
                  const tokenCssVar = tokenFont('typefaces', o.short)
                  const tokenValue = readVarResolved(tokenCssVar) || readVar(tokenCssVar)
                  return tokenValue && tokenValue.includes(innerParsed.key)
                })
                if (matchBySlug) return matchBySlug.short
              }
            }
          }
        }

        // If no var() chain matched, try to match by resolved font-family string
        const resolvedValue = readVarResolved(cssVar) || cssValue
        const fontNameMatch = resolvedValue.split(',')[0].trim().replace(/^['"]|['"]$/g, '')
        if (fontNameMatch) {
          const matchingOption = familyOptions.find((o) => {
            if (o.value && o.value.split(',')[0].trim().replace(/^['"]|['"]$/g, '') === fontNameMatch) return true
            if (o.label && o.label.includes(`(${fontNameMatch})`)) return true
            return false
          })
          if (matchingOption) {
            return matchingOption.short
          }
        }
      } catch (e) {
        console.warn('Error reading current family token:', e)
      }
      return ''
    }

    // Get the first item's token
    const firstCssVar = `--recursica_brand_typography_${prefixToCssVarName(selectedPrefixes[0])}-font-family`
    const firstToken = getTokenForCssVar(firstCssVar)

    // If there are multiple, verify they all match the first one
    if (selectedPrefixes.length > 1) {
      for (let i = 1; i < selectedPrefixes.length; i++) {
        const nextCssVar = `--recursica_brand_typography_${prefixToCssVarName(selectedPrefixes[i])}-font-family`
        const nextToken = getTokenForCssVar(nextCssVar)
        if (nextToken !== firstToken) {
          return '' // Multiple different font families selected
        }
      }
    }

    return firstToken
  }, [selectedPrefixes, familyOptions, updateKey, open])

  const { mode } = useThemeMode()

  const sortedSizeTokens = useMemo(() => {
    return [...sizeOptions].sort((a, b) => (a.value || 0) - (b.value || 0))
  }, [sizeOptions])

  const sortedWeightTokens = useMemo(() => {
    return [...weightOptions].sort((a, b) => (a.value || 0) - (b.value || 0))
  }, [weightOptions])

  const sortedSpacingTokens = useMemo(() => {
    return [...spacingOptions].sort((a, b) => (a.value || 0) - (b.value || 0))
  }, [spacingOptions])

  const sortedLineHeightTokens = useMemo(() => {
    return [...lineHeightOptions].sort((a, b) => (a.value || 0) - (b.value || 0))
  }, [lineHeightOptions])

  const getSizeValueLabel = useCallback((value: number) => {
    const token = sortedSizeTokens[Math.round(value)]
    return token?.label || token?.short || String(value)
  }, [sortedSizeTokens])

  const getWeightValueLabel = useCallback((value: number) => {
    const token = sortedWeightTokens[Math.round(value)]
    return token?.label || token?.short || String(value)
  }, [sortedWeightTokens])

  const getSpacingValueLabel = useCallback((value: number) => {
    const token = sortedSpacingTokens[Math.round(value)]
    return token?.label || token?.short || String(value)
  }, [sortedSpacingTokens])

  const getLineHeightValueLabel = useCallback((value: number) => {
    const token = sortedLineHeightTokens[Math.round(value)]
    return token?.label || token?.short || String(value)
  }, [sortedLineHeightTokens])


  // Track the previous computed family token so we can tell a genuine user-initiated
  // family change from an updateKey-driven recomputation (which transitions '' → 'primary'
  // on first interaction and must NOT trigger weight/style auto-correction).
  const prevFamilyTokenRef = useRef<string>('')

  // When the selected font changes, auto-correct weight and style if the current
  // values are no longer valid for the new font.
  useEffect(() => {
    if (!open || !currentFamilyToken) {
      prevFamilyTokenRef.current = currentFamilyToken || ''
      return
    }

    const prevFamily = prevFamilyTokenRef.current
    prevFamilyTokenRef.current = currentFamilyToken

    // Only auto-correct when the family genuinely changed from one non-empty value
    // to a different non-empty value (i.e., the user picked a different font family).
    // Skip when transitioning from '' to a value — that is an updateKey recomputation
    // artefact, NOT a user-initiated family switch.
    if (!prevFamily || prevFamily === currentFamilyToken) return

    // Weight: if the currently applied weight isn't in the allowed set, snap to the
    // first available weight for this font.
    if (sortedWeightTokens.length > 0 && weightCurrentToken) {
      const isValid = sortedWeightTokens.some((t) => t.short === weightCurrentToken)
      if (!isValid) {
        const firstWeight = sortedWeightTokens[0]
        if (firstWeight) {
          setLocalWeightIdx(0)
          updateCssVarValue('font-weight', firstWeight.short)
        }
      }
    }

    // Style: if current style is italic but the font only supports normal, reset it.
    if (!availableFontStyles.has(currentFontStyleValue) && availableFontStyles.size > 0) {
      const fallback = availableFontStyles.has('normal') ? 'normal' : [...availableFontStyles][0]
      if (fallback) handleFontStyleChange(fallback)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFamilyToken, open])

  if (!open) return null

  const panelFooter = (
    <ResetButton
      onReset={() => revert()}
      layer="layer-0"
    />
  )

  /**
   * The core style's own control for one property, so it can be changed for every breakpoint that
   * still follows it — without detaching anything. Writes go to the base typography.
   */
  const coreControl = (cssProp: string) => {
    const slider = (
      tokens: Array<{ short: string }>,
      current: string | undefined,
      valueLabel: (v: number) => string,
      property: 'font-size' | 'font-weight' | 'font-letter-spacing' | 'line-height',
    ) => (
      <Slider
        value={Math.max(0, tokens.findIndex((t) => t.short === current))}
        onChange={(val) => {
          const idx = Math.round(typeof val === 'number' ? val : val[0])
          const token = tokens[idx]
          if (token) updateCssVarValue(property, token.short, { toCore: true })
        }}
        min={0}
        max={Math.max(0, tokens.length - 1)}
        type="discrete"
        step={1}
        layer="layer-1"
        layout="stacked"
        showInput={false}
        showValueLabel
        showMinMaxLabels={false}
        valueLabel={valueLabel}
        tooltipText={valueLabel}
        label={<Label layer="layer-1" layout="stacked">{CSS_PROP_LABEL[cssProp]}</Label>}
      />
    )

    switch (cssProp) {
      case 'font-size':
        return slider(sortedSizeTokens, sizeCurrentToken, getSizeValueLabel, 'font-size')
      case 'font-weight':
        return slider(sortedWeightTokens, weightCurrentToken, getWeightValueLabel, 'font-weight')
      case 'font-letter-spacing':
        return slider(sortedSpacingTokens, spacingCurrentToken, getSpacingValueLabel, 'font-letter-spacing')
      case 'line-height':
        return slider(sortedLineHeightTokens, lineHeightCurrentToken, getLineHeightValueLabel, 'line-height')
      case 'font-family':
        return (
          <Dropdown
            items={familyOptions.map((o) => ({ value: o.short, label: o.label }))}
            value={currentFamilyToken || ''}
            onChange={(v) => { if (v) updateCssVarValue('font-family', v, { toCore: true }) }}
            label="Font Family"
            layer="layer-1"
            layout="stacked"
            zIndex={10003}
          />
        )
      case 'font-style':
        return (
          <div>
            <Label layer="layer-1" layout="stacked">Style</Label>
            <SegmentedControl
              items={fontStyleItems}
              value={currentFontStyleValue}
              onChange={(v) => updateCssVarValue('font-style', v, { toCore: true })}
              layer="layer-1"
              showLabel={false}
            />
          </div>
        )
      case 'text-decoration':
        return (
          <div>
            <Label layer="layer-1" layout="stacked">Decoration</Label>
            <SegmentedControl
              items={textDecorationItems}
              value={currentDecorationValue}
              onChange={(v) => updateCssVarValue('text-decoration', v, { toCore: true })}
              layer="layer-1"
              showLabel={false}
            />
          </div>
        )
      case 'text-transform':
        return (
          <div>
            <Label layer="layer-1" layout="stacked">Case</Label>
            <SegmentedControl
              items={textCaseItems}
              value={currentTransformValue}
              onChange={(v) => {
                const map: Record<string, string> = { none: 'original', uppercase: 'uppercase', lowercase: 'lowercase', capitalize: 'titlecase' }
                updateCssVarValue('text-transform', map[v] || v, { toCore: true })
              }}
              layer="layer-1"
              showLabel={false}
            />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <>
    {corePanel && (
      <Panel
        overlay
        position="right"
        title="Core type style"
        onClose={() => setCorePanel(null)}
        width="400px"
        zIndex={10002}
        layer="layer-1"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="outline" layer="layer-1" onClick={() => { detach(corePanel.cssProp); setCorePanel(null) }}>
              Detach and override value
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <p style={{ margin: 0 }}>
            {corePanel.label} follows the core type style. Changing it here affects every breakpoint
            still attached to it.
          </p>
          {coreControl(corePanel.cssProp)}
        </div>
      </Panel>
    )}

    <Modal
      isOpen={!!linkModal}
      onClose={() => setLinkModal(null)}
      title="Remove override?"
      layer="layer-1"
      zIndex={10002}
      primaryActionLabel="Reattach to the core type style"
      onPrimaryAction={() => {
        if (linkModal) relink(linkModal.cssProp)
        setLinkModal(null)
      }}
      showSecondaryButton
      secondaryActionLabel="Cancel"
      onSecondaryAction={() => setLinkModal(null)}
    >
      <p style={{ margin: 0 }}>
        {`${linkModal?.label} is set for ${breakpoint} only. Reattach it to the core type style?`}
      </p>
    </Modal>

    <Panel
      overlay
      position="right"
      title={title}
      onClose={onClose}
      footer={panelFooter}
      width="400px"
      zIndex={10000}
      layer="layer-0"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: `var(${getGlobalCssVar('form', 'properties', 'vertical-item-gap', mode)})` }}>
        {prefix ? (
          <>
            <div>
              {editingBreakpoint && propLabel('Font Family', 'font-family')}
              <div style={lockedStyle('font-family')}>
              <Dropdown
                items={familyOptions.length > 0
                  ? familyOptions.map((o) => ({ value: o.short, label: o.label }))
                  : [{ value: '', label: 'No font families available', disabled: true }]
                }
                value={currentFamilyToken || ''}
                onChange={(v) => {
                  if (v) {
                    updateCssVarValue('font-family', v)
                  }
                }}
                placeholder="Select font family..."
                label={editingBreakpoint ? undefined : 'Font Family'}
                disabled={lockedFor('font-family')}
                layer="layer-3"
                layout="stacked"
                disableTopBottomMargin={false}
                zIndex={10001}
              />
              </div>
            </div>

            {sizeOptions.length > 0 ? (
              <Slider
                value={localSizeIdx ?? Math.max(0, sortedSizeTokens.findIndex(t => t.short === sizeCurrentToken))}
                onChange={(val) => {
                  const idx = Math.round(typeof val === 'number' ? val : val[0])
                  setLocalSizeIdx(idx)
                  const token = sortedSizeTokens[idx]
                  if (token) {
                    updateCssVarValue('font-size', token.short)
                  }
                }}
                min={0}
                max={sortedSizeTokens.length - 1}
                type="discrete"
                step={1}
                layer="layer-3"
                layout="stacked"
                showInput={false}
                showValueLabel={true}
                showMinMaxLabels={false}
                valueLabel={getSizeValueLabel}
                tooltipText={getSizeValueLabel}
                label={propLabel('Font Size', 'font-size')}
                disabled={lockedFor('font-size')}
              />
            ) : (
              <div style={{ padding: 8, fontSize: 12, opacity: 0.6, fontStyle: 'italic' }}>
                No font size tokens available
              </div>
            )}

            {weightOptions.length > 0 ? (
              <Slider
                value={localWeightIdx ?? Math.max(0, sortedWeightTokens.findIndex(t => t.short === weightCurrentToken))}
                onChange={(val) => {
                  const idx = Math.round(typeof val === 'number' ? val : val[0])
                  setLocalWeightIdx(idx)
                  const token = sortedWeightTokens[idx]
                  if (token) {
                    updateCssVarValue('font-weight', token.short)
                  }
                }}
                min={0}
                max={sortedWeightTokens.length - 1}
                type="discrete"
                step={1}
                layer="layer-3"
                layout="stacked"
                showInput={false}
                showValueLabel={true}
                showMinMaxLabels={false}
                valueLabel={getWeightValueLabel}
                tooltipText={getWeightValueLabel}
                label={propLabel('Font Weight', 'font-weight')}
                disabled={lockedFor('font-weight')}
              />
            ) : (
              <div style={{ padding: 8, fontSize: 12, opacity: 0.6, fontStyle: 'italic' }}>
                No font weight tokens available
              </div>
            )}

            {spacingOptions.length > 0 ? (
              <Slider
                value={localSpacingIdx ?? Math.max(0, sortedSpacingTokens.findIndex(t => t.short === spacingCurrentToken))}
                onChange={(val) => {
                  const idx = Math.round(typeof val === 'number' ? val : val[0])
                  setLocalSpacingIdx(idx)
                  const token = sortedSpacingTokens[idx]
                  if (token) {
                    updateCssVarValue('font-letter-spacing', token.short)
                  }
                }}
                min={0}
                max={sortedSpacingTokens.length - 1}
                type="discrete"
                step={1}
                layer="layer-3"
                layout="stacked"
                showInput={false}
                showValueLabel={true}
                showMinMaxLabels={false}
                valueLabel={getSpacingValueLabel}
                tooltipText={getSpacingValueLabel}
                label={propLabel('Letter Spacing', 'font-letter-spacing')}
                disabled={lockedFor('font-letter-spacing')}
              />
            ) : (
              <div style={{ padding: 8, fontSize: 12, opacity: 0.6, fontStyle: 'italic' }}>
                No letter spacing tokens available
              </div>
            )}

            {lineHeightOptions.length > 0 ? (
              <Slider
                value={localLineHeightIdx ?? Math.max(0, sortedLineHeightTokens.findIndex(t => t.short === lineHeightCurrentToken))}
                onChange={(val) => {
                  const idx = Math.round(typeof val === 'number' ? val : val[0])
                  setLocalLineHeightIdx(idx)
                  const token = sortedLineHeightTokens[idx]
                  if (token) {
                    updateCssVarValue('line-height', token.short)
                  }
                }}
                min={0}
                max={sortedLineHeightTokens.length - 1}
                type="discrete"
                step={1}
                layer="layer-3"
                layout="stacked"
                showInput={false}
                showValueLabel={true}
                showMinMaxLabels={false}
                valueLabel={getLineHeightValueLabel}
                tooltipText={getLineHeightValueLabel}
                label={propLabel('Line Height', 'line-height')}
                disabled={lockedFor('line-height')}
              />
            ) : (
              <div style={{ padding: 8, fontSize: 12, opacity: 0.6, fontStyle: 'italic' }}>
                No line height tokens available
              </div>
            )}
            {/* Font Style — only rendered when the font has more than one style variant */}
            {fontStyleItems.length > 1 && (
              <div>
                {propLabel('Style', 'font-style')}
                <div style={lockedStyle('font-style')}>
                <SegmentedControl
                  items={fontStyleItems}
                  disabled={lockedFor('font-style')}
                  value={currentFontStyleValue}
                  onChange={(v) => handleFontStyleChange(v)}
                  layer="layer-3"
                  showLabel={false}
                />
                </div>
              </div>
            )}

            {/* Text Decoration */}
            <div>
              {propLabel('Decoration', 'text-decoration')}
                <div style={lockedStyle('text-decoration')}>
              <SegmentedControl
                items={textDecorationItems}
                  disabled={lockedFor('text-decoration')}
                value={currentDecorationValue}
                onChange={(v) => handleDecorationChange(v)}
                layer="layer-3"
                showLabel={false}
              />
                </div>
            </div>

            {/* Text Case */}
            <div>
              {propLabel('Case', 'text-transform')}
                <div style={lockedStyle('text-transform')}>
              <SegmentedControl
                items={textCaseItems}
                  disabled={lockedFor('text-transform')}
                value={currentTransformValue}
                onChange={(v) => handleTransformChange(v)}
                layer="layer-3"
                showLabel={false}
              />
                </div>
            </div>
          </>
        ) : (
          <div style={{ padding: 12, fontSize: 12, opacity: 0.7 }}>
            No type style selected
          </div>
        )}
      </div>
    </Panel>
    </>
  )
}
