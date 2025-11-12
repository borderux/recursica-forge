import { useMemo, useState } from 'react'
import { useVars } from '../vars/VarsContext'

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
    // from Tokens.json (font.family)
    try {
      Object.entries((tokens as any)?.tokens?.font?.family || {}).forEach(([short, rec]: [string, any]) => {
        const val = String((rec as any)?.$value || '')
        if (val && !seen.has(val)) { seen.add(val); out.push({ short, label: toTitleCase(short), value: val }) }
      })
    } catch {}
    // from Tokens.json (font.typeface)
    try {
      Object.entries((tokens as any)?.tokens?.font?.['typeface'] || {}).forEach(([short, rec]: [string, any]) => {
        const val = String((rec as any)?.$value || '')
        if (val && !seen.has(val)) { seen.add(val); out.push({ short, label: toTitleCase(short), value: val }) }
      })
    } catch {}
    // include overrides-only additions (font/family/* and font/typeface/*)
    try {
      const ov = (window && typeof window !== 'undefined') ? ((): Record<string, any> => { try { return JSON.parse(localStorage.getItem('token-overrides') || '{}') } catch { return {} } })() : {}
      Object.entries(ov || {}).forEach(([name, val]) => {
        if (typeof name !== 'string') return
        if (!(name.startsWith('font/family/') || name.startsWith('font/typeface/'))) return
        const short = name.split('/').pop() as string
        const literal = String(val || '')
        if (literal && !seen.has(literal)) { seen.add(literal); out.push({ short, label: toTitleCase(short), value: literal }) }
      })
    } catch {}
    out.sort((a,b) => a.label.localeCompare(b.label))
    return out
  }, [tokens])

  // Helper to get current token index from CSS variable
  const getCurrentTokenIndex = (cssVar: string, options: Array<{ short: string }>): number => {
    if (options.length === 0 || !cssVar) return 0
    try {
      // Read from inline style first (what we set), then fall back to computed style
      const inlineValue = document.documentElement.style.getPropertyValue(cssVar).trim()
      const computedValue = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim()
      const cssValue = inlineValue || computedValue
      if (cssValue) {
        const tokenName = extractTokenFromCssVar(cssValue)
        if (tokenName) {
          const idx = options.findIndex((o) => o.short === tokenName)
          if (idx >= 0) return idx
        }
      }
    } catch (e) {
      console.warn('Error reading CSS variable:', cssVar, e)
    }
    return 0
  }
  
  // Helper to get current font family value from CSS variable
  const getCurrentFamily = (cssVar: string): string => {
    if (!cssVar) return ''
    try {
      // Read from inline style first (what we set), then fall back to computed style
      const inlineValue = document.documentElement.style.getPropertyValue(cssVar).trim()
      const cssValue = inlineValue || getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim()
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
  const updateCssVar = (property: 'font-family' | 'font-size' | 'font-weight' | 'font-letter-spacing' | 'line-height', tokenValue: string) => {
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
          document.documentElement.style.setProperty(cssVar, `var(--recursica-tokens-font-${category}-${option.short})`)
        } else if (tokenValue) {
          // Use literal value
          document.documentElement.style.setProperty(cssVar, tokenValue)
        }
      } else {
        // Map property to token category
        const category = property === 'font-size' ? 'size' : property === 'font-weight' ? 'weight' : property === 'font-letter-spacing' ? 'letter-spacing' : 'line-height'
        document.documentElement.style.setProperty(cssVar, `var(--recursica-tokens-font-${category}-${tokenValue})`)
      }
    })
    // Use requestAnimationFrame to ensure CSS is applied before re-reading
    requestAnimationFrame(() => {
      setUpdateKey((k) => k + 1)
    })
  }

  const revert = () => {
    // Remove CSS variable overrides - let them fall back to defaults from JSON
    selectedPrefixes.forEach((prefix) => {
      const cssVarName = prefixToCssVarName(prefix)
      document.documentElement.style.removeProperty(`--recursica-brand-typography-${cssVarName}-font-family`)
      document.documentElement.style.removeProperty(`--recursica-brand-typography-${cssVarName}-font-size`)
      document.documentElement.style.removeProperty(`--recursica-brand-typography-${cssVarName}-font-weight`)
      document.documentElement.style.removeProperty(`--recursica-brand-typography-${cssVarName}-font-letter-spacing`)
      document.documentElement.style.removeProperty(`--recursica-brand-typography-${cssVarName}-line-height`)
    })
    // Trigger recomputeAndApplyAll to rebuild CSS variables from JSON
    // This ensures the original values from Brand.json are restored
    requestAnimationFrame(() => {
      try {
        window.dispatchEvent(new CustomEvent('typeChoicesChanged', { detail: {} }))
      } catch {}
      // Force re-render to update slider positions
      setUpdateKey((k) => k + 1)
    })
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
  const sizeCurrentIdx = useMemo(() => prefix ? getCurrentTokenIndex(sizeCssVar, sizeOptions) : 0, [sizeCssVar, sizeOptions, updateKey, prefix])
  const sizeCurrentToken = sizeOptions[sizeCurrentIdx] || sizeOptions[0]
  
  const weightCurrentIdx = useMemo(() => prefix ? getCurrentTokenIndex(weightCssVar, weightOptions) : 0, [weightCssVar, weightOptions, updateKey, prefix])
  const weightCurrentToken = weightOptions[weightCurrentIdx] || weightOptions[0]
  
  const spacingCurrentIdx = useMemo(() => prefix ? getCurrentTokenIndex(spacingCssVar, spacingOptions) : 0, [spacingCssVar, spacingOptions, updateKey, prefix])
  const spacingCurrentToken = spacingOptions[spacingCurrentIdx] || spacingOptions[0]
  
  const lineHeightCurrentIdx = useMemo(() => prefix ? getCurrentTokenIndex(lineHeightCssVar, lineHeightOptions) : 0, [lineHeightCssVar, lineHeightOptions, updateKey, prefix])
  const lineHeightCurrentToken = lineHeightOptions[lineHeightCurrentIdx] || lineHeightOptions[0]
  
  const currentFamily = useMemo(() => prefix ? getCurrentFamily(familyCssVar) : '', [familyCssVar, familyOptions, updateKey, prefix])

  return (
    <div aria-hidden={!open} style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: 'clamp(240px, 36vw, 520px)', background: 'var(--layer-layer-0-property-surface, #ffffff)', borderLeft: '1px solid var(--layer-layer-1-property-border-color, rgba(0,0,0,0.1))', boxShadow: '-8px 0 24px rgba(0,0,0,0.15)', transform: open ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 200ms ease', zIndex: 1200, padding: 12, overflowY: 'auto' }}>
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
                  value={currentFamily} 
                  onChange={(e) => { 
                    const v = (e.target as HTMLSelectElement).value
                    updateCssVar('font-family', v)
                  }}
                >
                  <option value=""></option>
                  {familyOptions.map((o) => (<option key={o.short} value={o.value}>{o.label}</option>))}
                </select>
              </label>
              
              {sizeOptions.length > 0 && (
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, opacity: 0.7 }}>Font Size</span>
                    <span style={{ fontSize: 12, opacity: 0.7 }}>{sizeCurrentToken?.label || ''}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, sizeOptions.length - 1)}
                    step={1}
                    value={sizeCurrentIdx}
                    onChange={(e) => {
                      const idx = Number(e.target.value)
                      const selectedToken = sizeOptions[idx]
                      if (selectedToken) {
                        updateCssVar('font-size', selectedToken.short)
                      }
                    }}
                    style={{ width: '100%' }}
                  />
                </label>
              )}
              
              {weightOptions.length > 0 && (
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, opacity: 0.7 }}>Font Weight</span>
                    <span style={{ fontSize: 12, opacity: 0.7 }}>{weightCurrentToken?.label || ''}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, weightOptions.length - 1)}
                    step={1}
                    value={weightCurrentIdx}
                    onChange={(e) => {
                      const idx = Number(e.target.value)
                      const selectedToken = weightOptions[idx]
                      if (selectedToken) {
                        updateCssVar('font-weight', selectedToken.short)
                      }
                    }}
                    style={{ width: '100%' }}
                  />
                </label>
              )}
              
              {spacingOptions.length > 0 && (
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, opacity: 0.7 }}>Letter Spacing</span>
                    <span style={{ fontSize: 12, opacity: 0.7 }}>{spacingCurrentToken?.label || ''}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, spacingOptions.length - 1)}
                    step={1}
                    value={spacingCurrentIdx}
                    onChange={(e) => {
                      const idx = Number(e.target.value)
                      const selectedToken = spacingOptions[idx]
                      if (selectedToken) {
                        updateCssVar('font-letter-spacing', selectedToken.short)
                      }
                    }}
                    style={{ width: '100%' }}
                  />
                </label>
              )}
              
              {lineHeightOptions.length > 0 && (
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, opacity: 0.7 }}>Line Height</span>
                    <span style={{ fontSize: 12, opacity: 0.7 }}>{lineHeightCurrentToken?.label || ''}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, lineHeightOptions.length - 1)}
                    step={1}
                    value={lineHeightCurrentIdx}
                    onChange={(e) => {
                      const idx = Number(e.target.value)
                      const selectedToken = lineHeightOptions[idx]
                      if (selectedToken) {
                        updateCssVar('line-height', selectedToken.short)
                      }
                    }}
                    style={{ width: '100%' }}
                  />
                </label>
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



