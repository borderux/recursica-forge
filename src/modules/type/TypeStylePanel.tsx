import { useMemo, useState, useEffect } from 'react'
import { useVars } from '../vars/VarsContext'
import { updateCssVar as updateCssVarUtil, removeCssVar } from '../../core/css/updateCssVar'
import { readCssVar } from '../../core/css/readCssVar'
import TokenSlider from '../forms/TokenSlider'
import { useThemeMode } from '../theme/ThemeModeContext'

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
  // Match patterns like: var(--recursica-tokens-font-size-md)
  const match = cssValue.match(/var\(--recursica-tokens-font-(?:size|weight|letter-spacing|line-height)-([^)]+)\)/)
  if (match) return match[1]
  // Also match: var(--tokens-font-size-md) (without recursica prefix)
  const match2 = cssValue.match(/var\(--tokens-font-(?:size|weight|letter-spacing|line-height)-([^)]+)\)/)
  if (match2) return match2[1]
  return null
}

export default function TypeStylePanel({ open, selectedPrefixes, title, onClose }: { open: boolean; selectedPrefixes: string[]; title: string; onClose: () => void }) {
  const { tokens } = useVars()
  const [updateKey, setUpdateKey] = useState(0)

  // Listen for reset events to refresh font options
  useEffect(() => {
    const handler = () => {
      setUpdateKey((k) => k + 1)
    }
    window.addEventListener('tokenOverridesChanged', handler)
    return () => window.removeEventListener('tokenOverridesChanged', handler)
  }, [])

  // options
  const sizeOptions = useMemo(() => {
    const out: Array<{ short: string; label: string }> = []
    try { Object.keys((tokens as any)?.tokens?.font?.size || {}).forEach((k) => out.push({ short: k, label: toTitleCase(k) })) } catch {}
    return out
  }, [tokens])
  const weightOptions = useMemo(() => {
    const out: Array<{ short: string; label: string }> = []
    try { Object.keys((tokens as any)?.tokens?.font?.weight || {}).forEach((k) => out.push({ short: k, label: toTitleCase(k) })) } catch {}
    return out
  }, [tokens])
  const spacingOptions = useMemo(() => {
    const out: Array<{ short: string; label: string }> = []
    try { Object.keys((tokens as any)?.tokens?.font?.['letter-spacing'] || {}).forEach((k) => out.push({ short: k, label: toTitleCase(k) })) } catch {}
    return out
  }, [tokens])
  const lineHeightOptions = useMemo(() => {
    const out: Array<{ short: string; label: string }> = []
    try { Object.keys((tokens as any)?.tokens?.font?.['line-height'] || {}).forEach((k) => out.push({ short: k, label: toTitleCase(k) })) } catch {}
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
      Object.entries((tokens as any)?.tokens?.font?.['typeface'] || {}).forEach(([short, rec]: [string, any]) => {
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
      Object.entries((tokens as any)?.tokens?.font?.family || {}).forEach(([short, rec]: [string, any]) => {
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

  // Helper to get current token name from CSS variable
  const getCurrentTokenName = (cssVar: string, options: Array<{ short: string }>): string | undefined => {
    if (options.length === 0 || !cssVar) return undefined
    try {
      const cssValue = readCssVar(cssVar)
      if (cssValue) {
        const tokenName = extractTokenFromCssVar(cssValue)
        if (tokenName) {
          const option = options.find((o) => o.short === tokenName)
          if (option) return option.short
        }
      }
    } catch (e) {
      console.warn('Error reading CSS variable:', cssVar, e)
    }
    return undefined
  }
  
  // Helper to get current font family value from CSS variable
  const getCurrentFamily = (cssVar: string): string => {
    if (!cssVar) return ''
    try {
      const cssValue = readCssVar(cssVar)
      if (cssValue) {
        // Extract token reference
        const tokenMatch = cssValue.match(/var\(--recursica-tokens-font-(?:family|typeface)-([^)]+)\)/)
        if (tokenMatch) {
          const tokenName = tokenMatch[1]
          const option = familyOptions.find((o) => o.short === tokenName)
          if (option) return option.value
        }
        // If it's a literal value, return it
        if (!cssValue.startsWith('var(')) return cssValue
      }
    } catch {}
    return ''
  }

  // Directly update CSS variable for selected prefixes
  const updateCssVarValue = (property: 'font-family' | 'font-size' | 'font-weight' | 'font-letter-spacing' | 'line-height', tokenValue: string) => {
    selectedPrefixes.forEach((prefix) => {
      const cssVarName = prefixToCssVarName(prefix)
      const cssVar = `--recursica-brand-typography-${cssVarName}-${property}`
      
      if (property === 'font-family') {
        // Find the token short name for the family value
        const option = familyOptions.find((o) => o.value === tokenValue)
        if (option) {
          // Check if it's a typeface or family token by looking it up in tokens
          const isTypeface = (tokens as any)?.tokens?.font?.typeface?.[option.short] !== undefined
          const category = isTypeface ? 'typeface' : 'family'
          updateCssVarUtil(cssVar, `var(--recursica-tokens-font-${category}-${option.short})`)
          
          // Load the font asynchronously (don't block UI)
          if (tokenValue && tokenValue.trim()) {
            import('../../modules/type/fontUtils').then(({ ensureFontLoaded }) => {
              ensureFontLoaded(tokenValue.trim()).catch((error) => {
                console.warn(`Failed to load font ${tokenValue}:`, error)
              })
            }).catch(() => {})
          }
        } else if (tokenValue) {
          // Use literal value
          updateCssVarUtil(cssVar, tokenValue)
          
          // Load the font asynchronously (don't block UI)
          if (tokenValue.trim()) {
            import('../../modules/type/fontUtils').then(({ ensureFontLoaded }) => {
              ensureFontLoaded(tokenValue.trim()).catch((error) => {
                console.warn(`Failed to load font ${tokenValue}:`, error)
              })
            }).catch(() => {})
          }
        }
      } else {
        // Map property to token category
        const category = property === 'font-size' ? 'size' : property === 'font-weight' ? 'weight' : property === 'font-letter-spacing' ? 'letter-spacing' : 'line-height'
        updateCssVarUtil(cssVar, `var(--recursica-tokens-font-${category}-${tokenValue})`)
      }
    })
    // Trigger re-render to update UI (CSS vars are already updated)
    setUpdateKey((k) => k + 1)
  }

  const revert = () => {
    // Remove CSS variable overrides - let them fall back to defaults from JSON
    selectedPrefixes.forEach((prefix) => {
      const cssVarName = prefixToCssVarName(prefix)
      removeCssVar(`--recursica-brand-typography-${cssVarName}-font-family`)
      removeCssVar(`--recursica-brand-typography-${cssVarName}-font-size`)
      removeCssVar(`--recursica-brand-typography-${cssVarName}-font-weight`)
      removeCssVar(`--recursica-brand-typography-${cssVarName}-font-letter-spacing`)
      removeCssVar(`--recursica-brand-typography-${cssVarName}-line-height`)
    })
    // Trigger recomputeAndApplyAll to rebuild CSS variables from JSON
    // This ensures the original values from Brand.json are restored
    try {
      window.dispatchEvent(new CustomEvent('typeChoicesChanged', { detail: {} }))
    } catch {}
    // Force re-render to update slider positions
    setUpdateKey((k) => k + 1)
  }

  // Calculate current values at top level (hooks must be unconditional)
  const prefix = selectedPrefixes.length > 0 ? selectedPrefixes[0] : null
  const cssVarName = prefix ? prefixToCssVarName(prefix) : ''
  
  const sizeCssVar = prefix ? `--recursica-brand-typography-${cssVarName}-font-size` : ''
  const weightCssVar = prefix ? `--recursica-brand-typography-${cssVarName}-font-weight` : ''
  const spacingCssVar = prefix ? `--recursica-brand-typography-${cssVarName}-font-letter-spacing` : ''
  const lineHeightCssVar = prefix ? `--recursica-brand-typography-${cssVarName}-line-height` : ''
  const familyCssVar = prefix ? `--recursica-brand-typography-${cssVarName}-font-family` : ''
  
  // Use useMemo to re-read CSS variables when updateKey changes
  const sizeCurrentToken = useMemo(() => prefix ? getCurrentTokenName(sizeCssVar, sizeOptions) : undefined, [sizeCssVar, sizeOptions, updateKey, prefix])
  const weightCurrentToken = useMemo(() => prefix ? getCurrentTokenName(weightCssVar, weightOptions) : undefined, [weightCssVar, weightOptions, updateKey, prefix])
  const spacingCurrentToken = useMemo(() => prefix ? getCurrentTokenName(spacingCssVar, spacingOptions) : undefined, [spacingCssVar, spacingOptions, updateKey, prefix])
  const lineHeightCurrentToken = useMemo(() => prefix ? getCurrentTokenName(lineHeightCssVar, lineHeightOptions) : undefined, [lineHeightCssVar, lineHeightOptions, updateKey, prefix])
  const currentFamily = useMemo(() => prefix ? getCurrentFamily(familyCssVar) : '', [familyCssVar, familyOptions, updateKey, prefix])

  const { mode } = useThemeMode()
  return (
    <div aria-hidden={!open} style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: 'clamp(240px, 36vw, 520px)', background: `var(--recursica-brand-${mode}-layer-layer-1-property-surface)`, borderLeft: `1px solid var(--recursica-brand-${mode}-layer-layer-1-property-border-color)`, boxShadow: `var(--recursica-brand-${mode}-elevations-elevation-3-shadow-color)`, transform: open ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 200ms ease', zIndex: 10000, padding: 12, overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontWeight: 700 }}>{title}</div>
        <button onClick={onClose} aria-label="Close" style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16 }}>&times;</button>
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        {prefix && (
          <>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 12, opacity: 0.7 }}>Font Family</span>
                <select 
                  value={currentFamily || ''} 
                  onChange={(e) => { 
                    const v = (e.target as HTMLSelectElement).value
                    updateCssVarValue('font-family', v)
                  }}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: `1px solid var(--recursica-brand-${mode}-layer-layer-1-property-border-color)` }}
                >
                  <option value=""></option>
                  {familyOptions.map((o) => (<option key={o.short} value={o.value}>{o.label}</option>))}
                </select>
              </label>
              
              {sizeOptions.length > 0 && (
                <TokenSlider
                  label="Font Size"
                  tokens={sizeOptions.map((o) => ({ name: o.short, label: o.label }))}
                  currentToken={sizeCurrentToken}
                  onChange={(tokenName) => {
                    updateCssVarValue('font-size', tokenName)
                  }}
                />
              )}
              
              {weightOptions.length > 0 && (
                <TokenSlider
                  label="Font Weight"
                  tokens={weightOptions.map((o) => ({ name: o.short, label: o.label }))}
                  currentToken={weightCurrentToken}
                  onChange={(tokenName) => {
                    updateCssVarValue('font-weight', tokenName)
                  }}
                />
              )}
              
              {spacingOptions.length > 0 && (
                <TokenSlider
                  label="Letter Spacing"
                  tokens={spacingOptions.map((o) => ({ name: o.short, label: o.label }))}
                  currentToken={spacingCurrentToken}
                  onChange={(tokenName) => {
                    updateCssVarValue('font-letter-spacing', tokenName)
                  }}
                />
              )}
              
              {lineHeightOptions.length > 0 && (
                <TokenSlider
                  label="Line Height"
                  tokens={lineHeightOptions.map((o) => ({ name: o.short, label: o.label }))}
                  currentToken={lineHeightCurrentToken}
                  onChange={(tokenName) => {
                    updateCssVarValue('line-height', tokenName)
                  }}
                />
              )}
          </>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={revert}>Revert</button>
        </div>
      </div>
    </div>
  )
}



