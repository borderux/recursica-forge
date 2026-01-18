import { useMemo, useState, useEffect, useCallback } from 'react'
import { useVars } from '../vars/VarsContext'
import { updateCssVar as updateCssVarUtil, removeCssVar } from '../../core/css/updateCssVar'
import { readCssVar, readCssVarResolved } from '../../core/css/readCssVar'
import { Slider } from '../../components/adapters/Slider'
import { Label } from '../../components/adapters/Label'
import { Button } from '../../components/adapters/Button'
import { useThemeMode } from '../theme/ThemeModeContext'
import { readChoices, writeChoices } from './TypeControls'

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
  // Match patterns like: var(--recursica-tokens-font-size-md) or var(--recursica-tokens-font-sizes-md)
  // Support both singular and plural forms
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
    } catch {}
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
    } catch {}
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
    } catch {}
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
    } catch {}
    return out
  }, [tokens])
  const familyOptions = useMemo(() => {
    const out: Array<{ short: string; label: string; value: string }> = []
    const seen = new Set<string>()
    // Helper to check if a value is populated (not empty or whitespace)
    const isPopulated = (val: string): boolean => {
      return val && val.trim().length > 0
    }
    
    // Token order sequence (from smallest to largest)
    const TOKEN_ORDER = ['primary','secondary','tertiary','quaternary','quinary','senary','septenary','octonary']
    
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
    } catch {}
    
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
    } catch {}
    
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
          const varMatch = cssValue.match(/var\s*\(\s*(--[^)]+?)\s*\)/)
          if (varMatch) {
            const innerVar = varMatch[1].trim()
            const nextValue = readCssVar(innerVar) || readCssVarResolved(innerVar)
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
          const varMatch = cssValue.match(/var\s*\(\s*(--[^)]+?)\s*\)/)
          if (varMatch) {
            const innerVar = varMatch[1].trim()
            cssValue = readCssVar(innerVar) || readCssVarResolved(innerVar)
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

  // Update choices for selected prefixes (this triggers typography system to rebuild CSS vars)
  const updateCssVarValue = useCallback((property: 'font-family' | 'font-size' | 'font-weight' | 'font-letter-spacing' | 'line-height', tokenValue: string) => {
    const choices = readChoices()
    const updatedChoices = { ...choices }
    
    selectedPrefixes.forEach((prefix) => {
      if (!updatedChoices[prefix]) {
        updatedChoices[prefix] = {}
      }
      
      // Map property names to choice keys
      const choiceKey = property === 'font-family' ? 'family' : 
                       property === 'font-size' ? 'size' :
                       property === 'font-weight' ? 'weight' :
                       property === 'font-letter-spacing' ? 'spacing' : 'lineHeight'
      
      if (property === 'font-family') {
        // Typography resolver expects the actual font family VALUE (string), not token short name
        // So we store the value directly (the font name like "Lexend")
        if (tokenValue) {
          updatedChoices[prefix][choiceKey] = tokenValue
        } else {
          delete updatedChoices[prefix][choiceKey]
        }
      } else {
        // For other properties, store the token name directly
        if (tokenValue) {
          updatedChoices[prefix][choiceKey] = tokenValue
        } else {
          delete updatedChoices[prefix][choiceKey]
        }
      }
    })
    
    // Write choices to localStorage and trigger recompute
    // writeChoices dispatches typeChoicesChanged which triggers recomputeAndApplyAll
    writeChoices(updatedChoices)
    
    // Load fonts asynchronously if family changed
    if (property === 'font-family' && tokenValue && tokenValue.trim()) {
      import('../../modules/type/fontUtils').then(({ ensureFontLoaded }) => {
        ensureFontLoaded(tokenValue.trim()).catch(() => {})
      }).catch(() => {})
    }
    
    // Force UI update after recompute completes
    // The recompute happens asynchronously, so we need to wait for cssVarsUpdated event
    // Use requestAnimationFrame to ensure DOM updates are complete before reading CSS vars
    requestAnimationFrame(() => {
      setTimeout(() => {
        setUpdateKey((k) => k + 1)
      }, 200)
    })
  }, [selectedPrefixes])

  const revert = useCallback(() => {
    // Remove choices from localStorage to revert to defaults
    const choices = readChoices()
    const updatedChoices = { ...choices }
    
    selectedPrefixes.forEach((prefix) => {
      if (updatedChoices[prefix]) {
        delete updatedChoices[prefix]
      }
    })
    
    // Write updated choices (removing selected prefixes)
    // writeChoices dispatches typeChoicesChanged which triggers recomputeAndApplyAll
    writeChoices(updatedChoices)
    
    // Force UI update after recompute completes
    requestAnimationFrame(() => {
      setTimeout(() => {
        setUpdateKey((k) => k + 1)
      }, 200)
    })
  }, [selectedPrefixes])

  // Calculate current values at top level (hooks must be unconditional)
  const prefix = selectedPrefixes.length > 0 ? selectedPrefixes[0] : null
  const cssVarName = prefix ? prefixToCssVarName(prefix) : ''
  
  const sizeCssVar = prefix ? `--recursica-brand-typography-${cssVarName}-font-size` : ''
  const weightCssVar = prefix ? `--recursica-brand-typography-${cssVarName}-font-weight` : ''
  const spacingCssVar = prefix ? `--recursica-brand-typography-${cssVarName}-font-letter-spacing` : ''
  const lineHeightCssVar = prefix ? `--recursica-brand-typography-${cssVarName}-line-height` : ''
  const familyCssVar = prefix ? `--recursica-brand-typography-${cssVarName}-font-family` : ''
  
  // Initialize from choices first, then fall back to reading CSS variables
  // Re-read when panel opens or updateKey changes
  const initializeFromChoices = useMemo(() => {
    if (!prefix || !open) return null
    try {
      const choices = readChoices()
      const choice = choices[prefix]
      if (choice && (choice.size || choice.weight || choice.spacing || choice.lineHeight || choice.family)) {
        const result = {
          size: choice.size,
          weight: choice.weight,
          spacing: choice.spacing,
          lineHeight: choice.lineHeight,
          // Family is stored as the actual font value (string), not token short name
          family: choice.family || ''
        }
        return result
      }
    } catch (e) {
      console.warn('Error reading choices:', e)
    }
    return null
  }, [prefix, familyOptions, open, updateKey])
  
  // Use useMemo to re-read CSS variables when updateKey changes or panel opens
  // Only compute when panel is open to avoid unnecessary work
  const sizeCurrentToken = useMemo(() => {
    if (!prefix || !open) return undefined
    // First try choices
    if (initializeFromChoices?.size) {
      const option = sizeOptions.find((o) => o.short === initializeFromChoices.size)
      if (option) return option.short
    }
    // Fall back to reading CSS variable
    const token = getCurrentTokenName(sizeCssVar, sizeOptions)
    return token
  }, [sizeCssVar, sizeOptions, updateKey, prefix, initializeFromChoices, open])
  
  const weightCurrentToken = useMemo(() => {
    if (!prefix || !open) return undefined
    // First try choices
    if (initializeFromChoices?.weight) {
      const option = weightOptions.find((o) => o.short === initializeFromChoices.weight)
      if (option) return option.short
    }
    // Fall back to reading CSS variable
    const token = getCurrentTokenName(weightCssVar, weightOptions)
    return token
  }, [weightCssVar, weightOptions, updateKey, prefix, initializeFromChoices, open])
  
  const spacingCurrentToken = useMemo(() => {
    if (!prefix || !open) return undefined
    // First try choices
    if (initializeFromChoices?.spacing) {
      const option = spacingOptions.find((o) => o.short === initializeFromChoices.spacing)
      if (option) return option.short
    }
    // Fall back to reading CSS variable
    const token = getCurrentTokenName(spacingCssVar, spacingOptions)
    return token
  }, [spacingCssVar, spacingOptions, updateKey, prefix, initializeFromChoices, open])
  
  const lineHeightCurrentToken = useMemo(() => {
    if (!prefix || !open) return undefined
    // First try choices
    if (initializeFromChoices?.lineHeight) {
      const option = lineHeightOptions.find((o) => o.short === initializeFromChoices.lineHeight)
      if (option) return option.short
    }
    // Fall back to reading CSS variable
    const token = getCurrentTokenName(lineHeightCssVar, lineHeightOptions)
    return token
  }, [lineHeightCssVar, lineHeightOptions, updateKey, prefix, initializeFromChoices, open])
  
  const currentFamily = useMemo(() => {
    if (!prefix || !open) return ''
    try {
      // First try choices
      if (initializeFromChoices?.family) {
        return initializeFromChoices.family
      }
      // Also check choices directly (in case initializeFromChoices didn't catch it)
      const choices = readChoices()
      const choice = choices[prefix]
      if (choice?.family) {
        // Family is stored as the actual font value (string), not token short name
        return choice.family
      }
      // Fall back to reading CSS variable
      return getCurrentFamily(familyCssVar)
    } catch (e) {
      console.warn('Error reading current family:', e)
      return ''
    }
  }, [familyCssVar, familyOptions, updateKey, prefix, initializeFromChoices, open])

  const { mode } = useThemeMode()
  
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
      return `var(--recursica-brand-themes-${mode}-elevations-elevation-${elevationLevel}-x-axis, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-${elevationLevel}-y-axis, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-${elevationLevel}-blur, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-${elevationLevel}-spread, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-${elevationLevel}-shadow-color, var(--recursica-tokens-colors-gray-1000))`
    } catch {
      // Fallback to elevation-2 if there's an error
      return `var(--recursica-brand-themes-${mode}-elevations-elevation-2-x-axis, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-2-y-axis, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-2-blur, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-2-spread, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-2-shadow-color, var(--recursica-tokens-colors-gray-1000))`
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
  
  return (
    <div style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: 'clamp(240px, 36vw, 520px)', background: `var(--recursica-brand-themes-${mode}-layer-layer-2-property-surface)`, borderLeft: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-2-property-border-color)`, boxShadow: elevationBoxShadow, transform: 'translateX(0)', transition: 'transform 200ms ease', zIndex: 10000, padding: 12, overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontWeight: 700 }}>{title}</div>
        <button onClick={onClose} aria-label="Close" style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16 }}>&times;</button>
      </div>
      <div style={{ display: 'grid', gap: 'var(--recursica-ui-kit-globals-form-properties-vertical-item-gap)' }}>
        {prefix ? (
          <>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 12, opacity: 0.7 }}>Font Family</span>
                <select 
                  value={currentFamily || ''} 
                  onChange={(e) => { 
                    const v = (e.target as HTMLSelectElement).value
                    updateCssVarValue('font-family', v)
                  }}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-1-property-border-color)` }}
                >
                  <option value="">Select font family...</option>
                  {familyOptions.length > 0 ? (
                    familyOptions.map((o) => (<option key={o.short} value={o.value}>{o.label}</option>))
                  ) : (
                    <option value="" disabled>No font families available</option>
                  )}
                </select>
              </label>
              
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



