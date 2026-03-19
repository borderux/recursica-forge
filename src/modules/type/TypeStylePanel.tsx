import { useMemo, useState, useEffect, useCallback } from 'react'
import { useVars } from '../vars/VarsContext'
import { updateCssVar } from '../../core/css/updateCssVar'
import { readCssVar, readCssVarResolved } from '../../core/css/readCssVar'
import { Slider } from '../../components/adapters/Slider'
import { Label } from '../../components/adapters/Label'
import { Button } from '../../components/adapters/Button'
import { SegmentedControl } from '../../components/adapters/SegmentedControl'
import { Dropdown } from '../../components/adapters/Dropdown'
import { iconNameToReactComponent } from '../components/iconUtils'
import { Panel } from '../../components/adapters/Panel'
import { useThemeMode } from '../theme/ThemeModeContext'
import { tokenFont, parseTokenCssVar, unwrapVar } from '../../core/css/cssVarBuilder'
import { buildTypographyVars } from '../../core/resolvers/typography'
import { getGlobalCssVar } from '../../components/utils/cssVarNames'

function toTitleCase(label: string): string {
  return (label || '').replace(/[-_/]+/g, ' ').replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()).trim()
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

export default function TypeStylePanel({ open, selectedPrefixes, title, onClose }: { open: boolean; selectedPrefixes: string[]; title: string; onClose: () => void }) {
  const { tokens, theme } = useVars()
  const [updateKey, setUpdateKey] = useState(0)

  // Local slider state to prevent snap-back during drag.
  // These track the slider index independently of CSS var re-derivation.
  const [localSizeIdx, setLocalSizeIdx] = useState<number | null>(null)
  const [localWeightIdx, setLocalWeightIdx] = useState<number | null>(null)
  const [localSpacingIdx, setLocalSpacingIdx] = useState<number | null>(null)
  const [localLineHeightIdx, setLocalLineHeightIdx] = useState<number | null>(null)

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
      // Clear local overrides so sliders re-derive from CSS vars
      setLocalSizeIdx(null)
      setLocalWeightIdx(null)
      setLocalSpacingIdx(null)
      setLocalLineHeightIdx(null)
      // Force re-read by incrementing updateKey
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
  const weightOptions = useMemo(() => {
    const out: Array<{ short: string; label: string; value?: number }> = []
    try {
      // Check both plural and singular forms
      const fontWeights = (tokens as any)?.tokens?.font?.weights || (tokens as any)?.tokens?.font?.weight || {}

      let allowedWeightKeys: Set<string> | null = null

      if (open && selectedPrefixes.length > 0) {
        const fontRoot = (tokens as any)?.tokens?.font || (tokens as any)?.font || {}
        const fontVariants = fontRoot.fontVariants || {}

        let hasFontsWithVariants = false
        const intersectingWeights = new Set<string>()
        let isFirstFont = true

        selectedPrefixes.forEach((prefix) => {
          const cssVar = `--recursica_brand_typography_${prefixToCssVarName(prefix)}-font-family`
          let cssValue = readCssVarResolved(cssVar) || readCssVar(cssVar) || ''

          // Resolve var() chains
          let depth = 0
          while (cssValue.startsWith('var(') && depth < 5) {
            const varMatch = cssValue.match(/var\s*\(\s*(--[^)]+?)\s*\)/)
            if (varMatch) {
              cssValue = readCssVarResolved(varMatch[1]) || readCssVar(varMatch[1]) || ''
            } else break
            depth++
          }

          const fontNameMatch = cssValue.match(/^["']?([^"',]+)["']?/)
          if (fontNameMatch) {
            const cleanFontName = fontNameMatch[1].trim().toLowerCase()
            let variants = fontVariants[cleanFontName]

            // Fallback to older $extensions structure if missing
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
                  variants = exts?.['com.google.fonts']?.variants || exts?.variants
                  break
                }
              }
            }

            if (variants && Array.isArray(variants) && variants.length > 0) {
              hasFontsWithVariants = true
              const fontWeightKeys = new Set<string>()
              variants.forEach((variant: any) => {
                if (variant && typeof variant === 'object' && typeof variant.weight === 'string') {
                  const weightMatch = variant.weight.match(/\{tokens?\.font\.weights?\.([a-z0-9\-_]+)\}/i)
                  if (weightMatch && weightMatch[1]) {
                    fontWeightKeys.add(weightMatch[1])
                  }
                }
              })

              if (isFirstFont) {
                fontWeightKeys.forEach((k) => intersectingWeights.add(k))
                isFirstFont = false
              } else {
                const toRemove: string[] = []
                intersectingWeights.forEach((k) => {
                  if (!fontWeightKeys.has(k)) toRemove.push(k)
                })
                toRemove.forEach((k) => intersectingWeights.delete(k))
              }
            }
          }
        })

        if (hasFontsWithVariants) {
          allowedWeightKeys = intersectingWeights
        }
      }

      Object.entries(fontWeights).forEach(([k, rec]: [string, any]) => {
        if (allowedWeightKeys && !allowedWeightKeys.has(k)) return
        const value = getTokenValue(rec)
        out.push({ short: k, label: toTitleCase(k), value })
      })
    } catch { }
    return out
  }, [tokens, open, selectedPrefixes, updateKey])
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
  // Font style segmented control options (icons matching toolbar)
  const fontStyleItems = useMemo(() => {
    const RomanIcon = iconNameToReactComponent('radix-font-roman')
    const ItalicIcon = iconNameToReactComponent('radix-font-italic')
    return [
      { value: 'normal', label: 'Normal', icon: RomanIcon ? <RomanIcon size={16} /> : null, tooltip: 'Normal' },
      { value: 'italic', label: 'Italic', icon: ItalicIcon ? <ItalicIcon size={16} /> : null, tooltip: 'Italic' },
    ]
  }, [])

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
    const seen = new Set<string>()
    // Helper to check if a value is populated (not empty or whitespace)
    const isPopulated = (val: string): boolean => {
      return Boolean(val && val.trim().length > 0)
    }

    // Token order sequence (from smallest to largest)
    const TOKEN_ORDER = ['primary', 'secondary', 'tertiary', 'quaternary', 'quinary', 'senary', 'septenary', 'octonary']

    // Read overrides to determine which typefaces actually exist
    // (overrides are the source of truth after add/delete operations)
    // Overrides are now tracked by the delta system and reflected in tokensJson
    let overrides: Record<string, any> = {}
    const overrideTypefaceKeys = Object.keys(overrides).filter(k => k.startsWith('font/typeface/'))
    const hasTypefaceOverrides = overrideTypefaceKeys.length > 0

    // Collect typeface tokens first (they take precedence)
    const typefaceTokens: Array<{ short: string; label: string; value: string; order: number }> = []
    try {
      // Check both plural and singular forms
      const typefaces = (tokens as any)?.tokens?.font?.typefaces || (tokens as any)?.tokens?.font?.typeface || {}
      Object.entries(typefaces).forEach(([short, rec]: [string, any]) => {
        // Skip $type and other metadata properties
        if (short === '$type' || short.startsWith('$')) return
        // If overrides exist for typefaces, only include fonts present in overrides
        if (hasTypefaceOverrides && !overrides[`font/typeface/${short}`]) return
        // Use override value if available, otherwise use token value
        const overrideVal = overrides[`font/typeface/${short}`]
        const val = (typeof overrideVal === 'string' && overrideVal.trim()) ? overrideVal.trim() : String((rec as any)?.$value || '').trim()
        if (isPopulated(val) && !seen.has(val)) {
          seen.add(val)
          const orderIndex = TOKEN_ORDER.indexOf(short)
          typefaceTokens.push({
            short,
            label: toTitleCase(short),
            value: val,
            order: orderIndex >= 0 ? orderIndex : 999 // Put unknown tokens at the end
          })
        }
      })
    } catch { }

    // Also add any override-only typefaces not in tokens
    if (hasTypefaceOverrides) {
      overrideTypefaceKeys.forEach(k => {
        const short = k.replace('font/typeface/', '')
        if (short.startsWith('$')) return
        const val = String(overrides[k] || '').trim()
        if (isPopulated(val) && !seen.has(val) && !typefaceTokens.some(t => t.short === short)) {
          seen.add(val)
          const orderIndex = TOKEN_ORDER.indexOf(short)
          typefaceTokens.push({
            short,
            label: toTitleCase(short),
            value: val,
            order: orderIndex >= 0 ? orderIndex : 999
          })
        }
      })
    }

    // Collect family tokens (only if not already in typeface)
    const familyTokens: Array<{ short: string; label: string; value: string; order: number }> = []
    try {
      // Check both plural and singular forms
      const families = (tokens as any)?.tokens?.font?.families || (tokens as any)?.tokens?.font?.family || {}
      Object.entries(families).forEach(([short, rec]: [string, any]) => {
        // Skip $type and other metadata properties
        if (short === '$type' || short.startsWith('$')) return
        const val = String((rec as any)?.$value || '').trim()
        if (isPopulated(val) && !seen.has(val)) {
          seen.add(val)
          const orderIndex = TOKEN_ORDER.indexOf(short)
          familyTokens.push({
            short,
            label: toTitleCase(short),
            value: val,
            order: orderIndex >= 0 ? orderIndex : 999 // Put unknown tokens at the end
          })
        }
      })
    } catch { }

    // Combine and sort by order (typeface first, then family, both in token order)
    const allTokens = [...typefaceTokens, ...familyTokens]
    allTokens.sort((a, b) => {
      // First sort by order index
      if (a.order !== b.order) {
        return a.order - b.order
      }
      // If same order, typeface comes before family
      const aIsTypeface = typefaceTokens.some(t => t.short === a.short)
      const bIsTypeface = typefaceTokens.some(t => t.short === b.short)
      if (aIsTypeface && !bIsTypeface) return -1
      if (!aIsTypeface && bIsTypeface) return 1
      // Otherwise maintain stable order
      return 0
    })

    // Extract fields and format label with font name in parentheses
    return allTokens.map(({ short, label, value }) => {
      // Extract just the primary font name (e.g. "Lexend, sans-serif" -> "Lexend")
      const cleanFontName = value && value.trim()
        ? value.split(',')[0].trim().replace(/^['"]|['"]$/g, '')
        : ''

      // Format: "Primary (Lexend)" or just "Primary" if no value
      const displayLabel = cleanFontName
        ? `${label} (${cleanFontName})`
        : label
      return { short, label: displayLabel, value }
    })
  }, [tokens, updateKey])

  // Helper to get current token name from CSS variable (follows the chain)
  const getCurrentTokenName = (cssVar: string, options: Array<{ short: string }>): string | undefined => {
    if (options.length === 0 || !cssVar) return undefined
    try {
      // First try reading the direct CSS variable value
      let cssValue = readCssVar(cssVar)
      if (!cssValue) {
        // Try reading resolved value as fallback
        cssValue = readCssVarResolved(cssVar)
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
            const nextValue: string | undefined = readCssVar(innerVar) || readCssVarResolved(innerVar)
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
      let cssValue = readCssVar(cssVar)
      if (!cssValue) {
        // Try reading resolved value as fallback
        cssValue = readCssVarResolved(cssVar)
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
            cssValue = readCssVar(innerVar) || readCssVarResolved(innerVar) || cssValue
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
  const updateCssVarValue = useCallback((property: 'font-family' | 'font-size' | 'font-weight' | 'font-letter-spacing' | 'line-height' | 'font-style' | 'text-decoration' | 'text-transform', tokenShort: string) => {
    const cssVars: string[] = []

    selectedPrefixes.forEach((prefix) => {
      const cssVarName = prefixToCssVarName(prefix)
      let cssVar = ''
      let tokenValue = ''

      // Map property to CSS variable name and token reference
      if (property === 'font-family') {
        cssVar = `--recursica_brand_typography_${cssVarName}-font-family`
        // Check if this token exists in typefaces or families
        const typefaces = (tokens as any)?.tokens?.font?.typefaces || (tokens as any)?.tokens?.font?.typeface || {}
        const families = (tokens as any)?.tokens?.font?.families || (tokens as any)?.tokens?.font?.family || {}
        // Determine which token CSS variable to use
        let tokenCssVar = ''
        if (typefaces[tokenShort]) {
          tokenCssVar = tokenFont('typefaces', tokenShort)
        } else if (families[tokenShort]) {
          tokenCssVar = tokenFont('families', tokenShort)
        } else {
          // Fallback to typefaces (most common)
          tokenCssVar = tokenFont('typefaces', tokenShort)
        }
        // Resolve the token CSS variable to get the actual font value (with fallbacks)
        const resolvedValue = readCssVarResolved(tokenCssVar) || readCssVar(tokenCssVar)
        // Use the resolved value (font name with fallbacks) if available, otherwise fall back to token reference
        tokenValue = resolvedValue || `var(${tokenCssVar})`
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
        // Set CSS variable synchronously to ensure it's in DOM before any recomputes
        updateCssVar(cssVar, tokenValue, tokens, true) // silent=true to prevent immediate events
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
  }, [selectedPrefixes, tokens, familyOptions])

  const revert = useCallback(() => {
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
  const currentFontStyleValue = useMemo(() => {
    if (!prefix || !open) return 'normal'
    const resolved = readCssVarResolved(styleCssVar) || readCssVar(styleCssVar) || 'normal'
    return resolved.replace(/^["']|["']$/g, '').trim()
  }, [styleCssVar, updateKey, prefix, open])

  const currentDecorationValue = useMemo(() => {
    if (!prefix || !open) return 'none'
    const resolved = readCssVarResolved(decorationCssVar) || readCssVar(decorationCssVar) || 'none'
    return resolved.replace(/^["']|["']$/g, '').trim()
  }, [decorationCssVar, updateKey, prefix, open])

  const currentTransformValue = useMemo(() => {
    if (!prefix || !open) return 'none'
    const resolved = readCssVarResolved(transformCssVar) || readCssVar(transformCssVar) || 'none'
    return resolved.replace(/^["']|["']$/g, '').trim()
  }, [transformCssVar, updateKey, prefix, open])

  // Handlers for SegmentedControl changes
  // Map CSS values back to token keys for updateCssVarValue
  const handleFontStyleChange = useCallback((value: string) => {
    // Token keys match CSS values for styles: 'normal' -> 'normal', 'italic' -> 'italic'
    updateCssVarValue('font-style', value)
  }, [updateCssVarValue])

  const handleDecorationChange = useCallback((value: string) => {
    // Map CSS values to token keys: 'none' -> 'none', 'underline' -> 'underline', 'line-through' -> 'strikethrough'
    const tokenMap: Record<string, string> = { 'none': 'none', 'underline': 'underline', 'line-through': 'strikethrough' }
    updateCssVarValue('text-decoration', tokenMap[value] || value)
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
        const cssValue = readCssVar(cssVar) || readCssVarResolved(cssVar)
        if (!cssValue) return ''

        // First, try to extract token reference using central parser
        const fontParsed = parseTokenCssVar(cssValue)
        if (fontParsed && fontParsed.type === 'font') {
          return fontParsed.key
        }

        // If it's a var() reference, follow the chain
        if (cssValue.startsWith('var(')) {
          const innerVarName = unwrapVar(cssValue)
          if (innerVarName) {
            const innerValue = readCssVar(innerVarName) || readCssVarResolved(innerVarName)
            if (innerValue) {
              const innerParsed = parseTokenCssVar(innerValue)
              if (innerParsed && innerParsed.type === 'font') {
                return innerParsed.key
              }
            }
          }
        }

        // If no token reference found, try to match the actual font value against familyOptions
        const fontNameMatch = cssValue.match(/^["']?([^"',]+)["']?/)
        if (fontNameMatch) {
          const fontName = fontNameMatch[1].trim()
          const matchingOption = familyOptions.find((o) => {
            if (o.value && o.value.trim() === fontName) return true
            if (o.label && o.label.includes(`(${fontName})`)) return true
            const tokenCssVar = tokenFont('typefaces', o.short)
            const tokenValue = readCssVarResolved(tokenCssVar) || readCssVar(tokenCssVar)
            if (tokenValue && tokenValue.includes(fontName)) return true
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

  // Pre-compute sorted arrays and callbacks at top level (before early return)
  // This ensures hooks are always called in the same order
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


  if (!open) return null

  const panelFooter = (
    <Button onClick={revert} variant="outline" layer="layer-0">Revert</Button>
  )

  return (
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
              label="Font Family"
              layer="layer-3"
              layout="stacked"
              disableTopBottomMargin={false}
              zIndex={10001}
            />

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
                step={1}
                layer="layer-3"
                layout="stacked"
                showInput={false}
                showValueLabel={true}
                showMinMaxLabels={false}
                valueLabel={getSizeValueLabel}
                tooltipText={getSizeValueLabel}
                label={<Label layer="layer-3" layout="stacked">Font Size</Label>}
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
                step={1}
                layer="layer-3"
                layout="stacked"
                showInput={false}
                showValueLabel={true}
                showMinMaxLabels={false}
                valueLabel={getWeightValueLabel}
                tooltipText={getWeightValueLabel}
                label={<Label layer="layer-3" layout="stacked">Font Weight</Label>}
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
                step={1}
                layer="layer-3"
                layout="stacked"
                showInput={false}
                showValueLabel={true}
                showMinMaxLabels={false}
                valueLabel={getSpacingValueLabel}
                tooltipText={getSpacingValueLabel}
                label={<Label layer="layer-3" layout="stacked">Letter Spacing</Label>}
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
                step={1}
                layer="layer-3"
                layout="stacked"
                showInput={false}
                showValueLabel={true}
                showMinMaxLabels={false}
                valueLabel={getLineHeightValueLabel}
                tooltipText={getLineHeightValueLabel}
                label={<Label layer="layer-3" layout="stacked">Line Height</Label>}
              />
            ) : (
              <div style={{ padding: 8, fontSize: 12, opacity: 0.6, fontStyle: 'italic' }}>
                No line height tokens available
              </div>
            )}
            {/* Font Style */}
            <div>
              <Label layer="layer-3" layout="stacked">Style</Label>
              <SegmentedControl
                items={fontStyleItems}
                value={currentFontStyleValue}
                onChange={(v) => handleFontStyleChange(v)}
                layer="layer-3"
                showLabel={false}
              />
            </div>

            {/* Text Decoration */}
            <div>
              <Label layer="layer-3" layout="stacked">Decoration</Label>
              <SegmentedControl
                items={textDecorationItems}
                value={currentDecorationValue}
                onChange={(v) => handleDecorationChange(v)}
                layer="layer-3"
                showLabel={false}
              />
            </div>

            {/* Text Case */}
            <div>
              <Label layer="layer-3" layout="stacked">Case</Label>
              <SegmentedControl
                items={textCaseItems}
                value={currentTransformValue}
                onChange={(v) => handleTransformChange(v)}
                layer="layer-3"
                showLabel={false}
              />
            </div>
          </>
        ) : (
          <div style={{ padding: 12, fontSize: 12, opacity: 0.7 }}>
            No type style selected
          </div>
        )}
      </div>
    </Panel>
  )
}
