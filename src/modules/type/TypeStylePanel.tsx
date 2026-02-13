import { useMemo, useState, useEffect, useCallback } from 'react'
import { useVars } from '../vars/VarsContext'
import { updateCssVar } from '../../core/css/updateCssVar'
import { readCssVar, readCssVarResolved } from '../../core/css/readCssVar'
import { Slider } from '../../components/adapters/Slider'
import { Label } from '../../components/adapters/Label'
import { Button } from '../../components/adapters/Button'
import { Dropdown } from '../../components/adapters/Dropdown'
import { useThemeMode } from '../theme/ThemeModeContext'
import { buildTypographyVars } from '../../core/resolvers/typography'
import { iconNameToReactComponent } from '../components/iconUtils'
import { getGlobalCssVar } from '../../components/utils/cssVarNames'

function toTitleCase(label: string): string {
  return (label || '').replace(/[-_/]+/g, ' ').replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()).trim()
}

function brandKeyFromPrefix(prefix: string): string {
  const map: Record<string, string> = { 'subtitle-1': 'subtitle', 'subtitle-2': 'subtitle-small', 'body-1': 'body', 'body-2': 'body-small' }
  return map[prefix] || prefix
}

// Map prefix to CSS variable name (matches Brand.json naming)
function prefixToCssVarName(prefix: string): string {
  return brandKeyFromPrefix(prefix)
}

// Helper to extract token name from CSS variable value
function extractTokenFromCssVar(cssValue: string): string | null {
  if (!cssValue) return null
  // Match patterns like: var(--recursica-tokens-font-sizes-md)
  // Uses plural form
  const match = cssValue.match(/var\(--recursica-tokens-font-(?:size|sizes|weight|weights|letter-spacing|letter-spacings|line-height|line-heights)-([^)]+)\)/)
  if (match) return match[1]
  // Also match: var(--tokens-font-size-md) (without recursica prefix)
  const match2 = cssValue.match(/var\(--tokens-font-(?:size|sizes|weight|weights|letter-spacing|letter-spacings|line-height|line-heights)-([^)]+)\)/)
  if (match2) return match2[1]
  return null
}

export default function TypeStylePanel({ open, selectedPrefixes, title, onClose }: { open: boolean; selectedPrefixes: string[]; title: string; onClose: () => void }) {
  const { tokens, theme } = useVars()
  const [updateKey, setUpdateKey] = useState(0)

  // Listen for reset events to refresh font options
  useEffect(() => {
    const handler = () => {
      setUpdateKey((k) => k + 1)
    }
    window.addEventListener('tokenOverridesChanged', handler)
    window.addEventListener('typeChoicesChanged', handler)
    window.addEventListener('cssVarsUpdated', handler)
    return () => {
      window.removeEventListener('tokenOverridesChanged', handler)
      window.removeEventListener('typeChoicesChanged', handler)
      window.removeEventListener('cssVarsUpdated', handler)
    }
  }, [])

  // Re-read values when panel opens or selected prefixes change
  useEffect(() => {
    if (open && selectedPrefixes.length > 0) {
      // Force re-read by incrementing updateKey
      // Use a small delay to ensure CSS variables are available
      const timeoutId = setTimeout(() => {
        setUpdateKey((k) => k + 1)
      }, 100) // Increased delay to ensure CSS vars are ready
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
      Object.entries(fontWeights).forEach(([k, rec]: [string, any]) => {
        const value = getTokenValue(rec)
        out.push({ short: k, label: toTitleCase(k), value })
      })
    } catch { }
    return out
  }, [tokens])
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
  const familyOptions = useMemo(() => {
    const out: Array<{ short: string; label: string; value: string }> = []
    const seen = new Set<string>()
    // Helper to check if a value is populated (not empty or whitespace)
    const isPopulated = (val: string): boolean => {
      return Boolean(val && val.trim().length > 0)
    }

    // Token order sequence (from smallest to largest)
    const TOKEN_ORDER = ['primary', 'secondary', 'tertiary', 'quaternary', 'quinary', 'senary', 'septenary', 'octonary']

    // Collect typeface tokens first (they take precedence)
    const typefaceTokens: Array<{ short: string; label: string; value: string; order: number }> = []
    try {
      // Check both plural and singular forms
      const typefaces = (tokens as any)?.tokens?.font?.typefaces || (tokens as any)?.tokens?.font?.typeface || {}
      Object.entries(typefaces).forEach(([short, rec]: [string, any]) => {
        // Skip $type and other metadata properties
        if (short === '$type' || short.startsWith('$')) return
        const val = String((rec as any)?.$value || '').trim()
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
      // Format: "Primary (Lexend)" or just "Primary" if no value
      const displayLabel = value && value.trim()
        ? `${label} (${value})`
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

        // Extract token reference - match both singular and plural forms
        const tokenMatch = cssValue.match(/var\(--recursica-tokens-font-(?:family|families|typeface|typefaces)-([^)]+)\)/)
        if (tokenMatch) {
          const tokenName = tokenMatch[1]
          const option = familyOptions.find((o) => o.short === tokenName)
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
  const updateCssVarValue = useCallback((property: 'font-family' | 'font-size' | 'font-weight' | 'font-letter-spacing' | 'line-height', tokenShort: string) => {
    const cssVars: string[] = []

    selectedPrefixes.forEach((prefix) => {
      const cssVarName = prefixToCssVarName(prefix)
      let cssVar = ''
      let tokenValue = ''

      // Map property to CSS variable name and token reference
      if (property === 'font-family') {
        cssVar = `--recursica-brand-typography-${cssVarName}-font-family`
        // Check if this token exists in typefaces or families
        const typefaces = (tokens as any)?.tokens?.font?.typefaces || (tokens as any)?.tokens?.font?.typeface || {}
        const families = (tokens as any)?.tokens?.font?.families || (tokens as any)?.tokens?.font?.family || {}
        // Determine which token CSS variable to use
        let tokenCssVar = ''
        if (typefaces[tokenShort]) {
          tokenCssVar = `--recursica-tokens-font-typefaces-${tokenShort}`
        } else if (families[tokenShort]) {
          tokenCssVar = `--recursica-tokens-font-families-${tokenShort}`
        } else {
          // Fallback to typefaces (most common)
          tokenCssVar = `--recursica-tokens-font-typefaces-${tokenShort}`
        }
        // Resolve the token CSS variable to get the actual font value (with fallbacks)
        const resolvedValue = readCssVarResolved(tokenCssVar) || readCssVar(tokenCssVar)
        // Use the resolved value (font name with fallbacks) if available, otherwise fall back to token reference
        tokenValue = resolvedValue || `var(${tokenCssVar})`
      } else if (property === 'font-size') {
        cssVar = `--recursica-brand-typography-${cssVarName}-font-size`
        tokenValue = `var(--recursica-tokens-font-sizes-${tokenShort})`
      } else if (property === 'font-weight') {
        cssVar = `--recursica-brand-typography-${cssVarName}-font-weight`
        tokenValue = `var(--recursica-tokens-font-weights-${tokenShort})`
      } else if (property === 'font-letter-spacing') {
        cssVar = `--recursica-brand-typography-${cssVarName}-font-letter-spacing`
        tokenValue = `var(--recursica-tokens-font-letter-spacings-${tokenShort})`
      } else if (property === 'line-height') {
        cssVar = `--recursica-brand-typography-${cssVarName}-line-height`
        tokenValue = `var(--recursica-tokens-font-line-heights-${tokenShort})`
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
    // Rebuild typography vars from Brand.json defaults (no choices = use defaults)
    const { vars: defaultTypeVars } = buildTypographyVars(tokens, theme, undefined, undefined)

    const cssVars: string[] = []

    selectedPrefixes.forEach((prefix) => {
      const cssVarName = prefixToCssVarName(prefix)
      const properties = ['font-family', 'font-size', 'font-weight', 'font-letter-spacing', 'line-height']

      properties.forEach((prop) => {
        const cssVar = `--recursica-brand-typography-${cssVarName}-${prop === 'font-letter-spacing' ? 'font-letter-spacing' : prop === 'line-height' ? 'line-height' : prop}`

        // Remove the override first
        document.documentElement.style.removeProperty(cssVar)

        // Restore default value from Brand.json
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

  const sizeCssVar = prefix ? `--recursica-brand-typography-${cssVarName}-font-size` : ''
  const weightCssVar = prefix ? `--recursica-brand-typography-${cssVarName}-font-weight` : ''
  const spacingCssVar = prefix ? `--recursica-brand-typography-${cssVarName}-font-letter-spacing` : ''
  const lineHeightCssVar = prefix ? `--recursica-brand-typography-${cssVarName}-line-height` : ''
  const familyCssVar = prefix ? `--recursica-brand-typography-${cssVarName}-font-family` : ''

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

  // Get current family token short name (not the font value)
  const currentFamilyToken = useMemo(() => {
    if (!prefix || !open) return ''
    try {
      // Read CSS variable and extract token name
      const cssValue = readCssVar(familyCssVar) || readCssVarResolved(familyCssVar)
      if (!cssValue) return ''

      // First, try to extract token reference (for backwards compatibility)
      const tokenMatch = cssValue.match(/var\(--recursica-tokens-font-(?:family|families|typeface|typefaces)-([^)]+)\)/)
      if (tokenMatch) {
        return tokenMatch[1]
      }

      // If it's a var() reference, follow the chain
      if (cssValue.startsWith('var(')) {
        const varMatch = cssValue.match(/var\s*\(\s*(--[^)]+?)\s*\)/)
        if (varMatch) {
          const innerVar = varMatch[1].trim()
          const innerValue = readCssVar(innerVar) || readCssVarResolved(innerVar)
          if (innerValue) {
            const innerTokenMatch = innerValue.match(/var\(--recursica-tokens-font-(?:family|families|typeface|typefaces)-([^)]+)\)/)
            if (innerTokenMatch) {
              return innerTokenMatch[1]
            }
          }
        }
      }

      // If no token reference found, try to match the actual font value against familyOptions
      // The CSS variable now contains the actual font value like "Lexend"
      // Extract the font name (first part before comma)
      const fontNameMatch = cssValue.match(/^["']?([^"',]+)["']?/)
      if (fontNameMatch) {
        const fontName = fontNameMatch[1].trim()
        // Try to find a matching option by comparing the font name
        // Check both the value and the label (which might contain the font name in parentheses)
        const matchingOption = familyOptions.find((o) => {
          // Match by exact font name
          if (o.value && o.value.trim() === fontName) return true
          // Match by font name in label like "Primary (Lexend)"
          if (o.label && o.label.includes(`(${fontName})`)) return true
          // Match by checking if the token CSS variable contains this font name
          const tokenCssVar = `--recursica-tokens-font-typefaces-${o.short}`
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
  }, [familyCssVar, familyOptions, updateKey, prefix, open])

  const { mode } = useThemeMode()
  const layer0Base = `--recursica-brand-themes-${mode}-layers-layer-0-properties`

  // Calculate elevation box-shadow for layer-2
  const elevationBoxShadow = useMemo(() => {
    try {
      const root: any = (theme as any)?.brand ? (theme as any).brand : theme
      const themes = root?.themes || root

      // Read layer-2 elevation property
      const layerSpec: any = themes?.[mode]?.layers?.[`layer-2`] || themes?.[mode]?.layer?.[`layer-2`] || root?.[mode]?.layers?.[`layer-2`] || root?.[mode]?.layer?.[`layer-2`] || {}
      const v: any = layerSpec?.properties?.elevation?.$value
      let elevationLevel = '2' // Default to layer number

      if (typeof v === 'string') {
        // Match both old format (brand.light.elevations.elevation-X) and new format (brand.themes.light.elevations.elevation-X)
        const m = v.match(/elevations?\.(elevation-(\d+))/i)
        if (m) elevationLevel = m[2]
      }

      // Build box-shadow from elevation CSS variables
      return `var(--recursica-brand-themes-${mode}-elevations-elevation-${elevationLevel}-x-axis, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-${elevationLevel}-y-axis, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-${elevationLevel}-blur, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-${elevationLevel}-spread, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-${elevationLevel}-shadow-color, var(--recursica-tokens-colors-scale-02-1000))`
    } catch {
      // Fallback to elevation-2 if there's an error
      return `var(--recursica-brand-themes-${mode}-elevations-elevation-2-x-axis, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-2-y-axis, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-2-blur, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-2-spread, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-2-shadow-color, var(--recursica-tokens-colors-scale-02-1000))`
    }
  }, [theme, mode])

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

  const CloseIcon = iconNameToReactComponent('x-mark')

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: '320px', background: `var(--recursica-brand-themes-${mode}-layers-layer-2-properties-surface)`, borderLeft: `1px solid var(--recursica-brand-themes-${mode}-layers-layer-2-properties-border-color)`, boxShadow: elevationBoxShadow, transform: 'translateX(0)', transition: 'transform 200ms ease', zIndex: 10000, padding: 12, overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h3 style={{
          margin: 0,
          fontFamily: 'var(--recursica-brand-typography-h3-font-family)',
          fontSize: 'var(--recursica-brand-typography-h3-font-size)',
          fontWeight: 'var(--recursica-brand-typography-h3-font-weight)',
          letterSpacing: 'var(--recursica-brand-typography-h3-font-letter-spacing)',
          lineHeight: 'var(--recursica-brand-typography-h3-line-height)',
          color: `var(${layer0Base.replace('-properties', '-elements')}-text-color)`,
        }}>{title}</h3>
        <Button
          onClick={onClose}
          variant="text"
          layer="layer-2"
          aria-label="Close"
          icon={CloseIcon ? <CloseIcon /> : undefined}
        />
      </div>
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
                value={sortedSizeTokens.findIndex(t => t.short === sizeCurrentToken) || 0}
                onChange={(val) => {
                  const idx = typeof val === 'number' ? val : val[0]
                  const token = sortedSizeTokens[Math.round(idx)]
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
                valueLabel={getSizeValueLabel}
                tooltipText={getSizeValueLabel}
                minLabel={sortedSizeTokens[0]?.label || 'Xs'}
                maxLabel={sortedSizeTokens[sortedSizeTokens.length - 1]?.label || 'Xl'}
                label={<Label layer="layer-3" layout="stacked">Font Size</Label>}
              />
            ) : (
              <div style={{ padding: 8, fontSize: 12, opacity: 0.6, fontStyle: 'italic' }}>
                No font size tokens available
              </div>
            )}

            {weightOptions.length > 0 ? (
              <Slider
                value={sortedWeightTokens.findIndex(t => t.short === weightCurrentToken) || 0}
                onChange={(val) => {
                  const idx = typeof val === 'number' ? val : val[0]
                  const token = sortedWeightTokens[Math.round(idx)]
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
                valueLabel={getWeightValueLabel}
                tooltipText={getWeightValueLabel}
                minLabel={sortedWeightTokens[0]?.label || 'Thin'}
                maxLabel={sortedWeightTokens[sortedWeightTokens.length - 1]?.label || 'Black'}
                label={<Label layer="layer-3" layout="stacked">Font Weight</Label>}
              />
            ) : (
              <div style={{ padding: 8, fontSize: 12, opacity: 0.6, fontStyle: 'italic' }}>
                No font weight tokens available
              </div>
            )}

            {spacingOptions.length > 0 ? (
              <Slider
                value={sortedSpacingTokens.findIndex(t => t.short === spacingCurrentToken) || 0}
                onChange={(val) => {
                  const idx = typeof val === 'number' ? val : val[0]
                  const token = sortedSpacingTokens[Math.round(idx)]
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
                valueLabel={getSpacingValueLabel}
                tooltipText={getSpacingValueLabel}
                minLabel={sortedSpacingTokens[0]?.label || 'Tightest'}
                maxLabel={sortedSpacingTokens[sortedSpacingTokens.length - 1]?.label || 'Widest'}
                label={<Label layer="layer-3" layout="stacked">Letter Spacing</Label>}
              />
            ) : (
              <div style={{ padding: 8, fontSize: 12, opacity: 0.6, fontStyle: 'italic' }}>
                No letter spacing tokens available
              </div>
            )}

            {lineHeightOptions.length > 0 ? (
              <Slider
                value={sortedLineHeightTokens.findIndex(t => t.short === lineHeightCurrentToken) || 0}
                onChange={(val) => {
                  const idx = typeof val === 'number' ? val : val[0]
                  const token = sortedLineHeightTokens[Math.round(idx)]
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
                valueLabel={getLineHeightValueLabel}
                tooltipText={getLineHeightValueLabel}
                minLabel={sortedLineHeightTokens[0]?.label || 'Shortest'}
                maxLabel={sortedLineHeightTokens[sortedLineHeightTokens.length - 1]?.label || 'Tallest'}
                label={<Label layer="layer-3" layout="stacked">Line Height</Label>}
              />
            ) : (
              <div style={{ padding: 8, fontSize: 12, opacity: 0.6, fontStyle: 'italic' }}>
                No line height tokens available
              </div>
            )}
          </>
        ) : (
          <div style={{ padding: 12, fontSize: 12, opacity: 0.7 }}>
            No type style selected
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <Button onClick={revert} variant="outline" layer="layer-2">Revert</Button>
        </div>
      </div>
    </div>
  )
}



