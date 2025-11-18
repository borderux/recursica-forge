import { useMemo, useState } from 'react'
import { updateCssVar, removeCssVar } from '../../core/css/updateCssVar'
import { readCssVar } from '../../core/css/readCssVar'
import { useVars } from '../vars/VarsContext'
import PaletteColorControl from '../forms/PaletteColorControl'
import TokenSlider from '../forms/TokenSlider'
import uikitJson from '../../vars/UIKit.json'
import { useThemeMode } from '../theme/ThemeModeContext'

/**
 * Converts a UIKit.json path to a CSS variable name
 * Matches the implementation in uikit.ts resolver
 */
function toCssVarName(path: string): string {
  const parts = path
    .replace(/^\.+|\.+$/g, '') // Remove leading/trailing dots
    .split('.')
    .filter(Boolean) // Remove empty parts
    .map(part => part.replace(/\s+/g, '-').toLowerCase())
  
  // Remove "ui-kit" from parts if it appears (to avoid double prefix)
  const filteredParts = parts.filter(part => part !== 'ui-kit')
  
  return `--recursica-ui-kit-${filteredParts.join('-')}`
}

/**
 * Extracts all CSS variables for a component from UIKit.json
 */
function getComponentCssVars(componentName: string): Array<{ path: string; cssVar: string; value: any; type: string }> {
  const componentKey = componentName.toLowerCase().replace(/\s+/g, '-')
  const uikitRoot: any = uikitJson
  const components = uikitRoot?.['ui-kit']?.components || {}
  const component = components[componentKey]
  
  if (!component) return []
  
  const vars: Array<{ path: string; cssVar: string; value: any; type: string }> = []
  
  function traverse(obj: any, prefix: string[]): void {
    if (obj == null || typeof obj !== 'object') return
    
    Object.entries(obj).forEach(([key, value]) => {
      if (key.startsWith('$')) return
      
      const currentPath = [...prefix, key]
      
      if (value && typeof value === 'object' && '$value' in value && '$type' in value) {
        // Build the path: components.button.color.layer-0.background-solid
        const fullPath = ['components', componentKey, ...currentPath].join('.')
        const cssVar = toCssVarName(fullPath)
        const type = (value as any).$type
        const rawValue = (value as any).$value
        
        // Handle dimension type: extract value and unit
        let extractedValue: any = rawValue
        if (type === 'dimension' && rawValue && typeof rawValue === 'object' && 'value' in rawValue) {
          // For dimension type, extract the value (which may be a number or token reference)
          extractedValue = rawValue.value
        }
        
        vars.push({
          path: currentPath.join('.'),
          cssVar,
          value: extractedValue,
          type: type
        })
      } else {
        traverse(value, currentPath)
      }
    })
  }
  
  traverse(component, [])
  return vars
}

function toTitleCase(str: string): string {
  return str.replace(/[-_]/g, ' ').replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
  )
}

interface ComponentCssVarsPanelProps {
  open: boolean
  componentName: string
  onClose: () => void
}

export default function ComponentCssVarsPanel({ open, componentName, onClose }: ComponentCssVarsPanelProps) {
  const { tokens: tokensJson } = useVars()
  const [updateKey, setUpdateKey] = useState(0)
  const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set())
  
  const componentVars = useMemo(() => {
    return getComponentCssVars(componentName)
  }, [componentName])
  
  // Group vars by category and subcategory, and derive section headers
  const { groupedVars, sectionHeaders, otherVars } = useMemo(() => {
    const grouped: Record<string, Record<string, typeof componentVars>> = {}
    const headers: Record<string, string> = {}
    const otherVars: typeof componentVars = []
    
    componentVars.forEach(v => {
      const pathParts = v.path.split('.')
      const category = pathParts[0]
      
      // Derive section header from category (e.g., "color" -> "Layers", "size" -> "Size")
      if (!headers[category]) {
        headers[category] = toTitleCase(category)
      }
      
      if (pathParts.length >= 2) {
        const subcategory = pathParts[1]
        
        // Check if this is a grouping pattern (layer-*, or size variant)
        const isLayerGroup = category === 'color' && subcategory.startsWith('layer-')
        const isSizeGroup = category === 'size' && 
          subcategory !== 'border-radius' && 
          subcategory !== 'border-radius-no-text' && 
          subcategory !== 'content-max-width'
        
        if (isLayerGroup || isSizeGroup) {
          if (!grouped[category]) grouped[category] = {}
          if (!grouped[category][subcategory]) grouped[category][subcategory] = []
          grouped[category][subcategory].push(v)
          return
        }
      }
      
      // Other vars (properties at root level, or other categories)
      otherVars.push(v)
    })
    
    return { groupedVars: grouped, sectionHeaders: headers, otherVars }
  }, [componentVars])
  
  const toggleAccordion = (key: string) => {
    setOpenAccordions(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }
  
  // Get available size tokens for sliders
  const availableSizeTokens = useMemo(() => {
    const tokens: Array<{ name: string; value: number; label: string }> = []
    try {
      const src: any = (tokensJson as any)?.tokens?.size || {}
      Object.keys(src).filter((k) => !k.startsWith('$')).forEach((k) => {
        const raw = src[k]?.$value
        const v = (raw && typeof raw === 'object' && typeof raw.value !== 'undefined') ? raw.value : raw
        const num = typeof v === 'number' ? v : Number(v)
        if (Number.isFinite(num)) {
          const baseLabel = k.replace('-', '.')
          const label = baseLabel === 'none' ? 'None' : baseLabel === 'default' ? 'Default' : baseLabel.endsWith('x') ? baseLabel : `${baseLabel}x`
          tokens.push({ name: `size/${k}`, value: num, label })
        }
      })
    } catch {}
    return tokens.sort((a, b) => a.value - b.value)
  }, [tokensJson])
  
  // Extract token name from CSS var value (e.g., "var(--recursica-tokens-size-md)" -> "size/md")
  const extractTokenFromCssVar = (cssValue: string): string | null => {
    if (!cssValue) return null
    // Match: var(--recursica-tokens-size-{name})
    const match = cssValue.match(/var\s*\(\s*--recursica-tokens-size-([^)]+)\s*\)/)
    if (match) return `size/${match[1]}`
    return null
  }
  
  const handleRevertAll = () => {
    componentVars.forEach(({ cssVar }) => {
      removeCssVar(cssVar)
    })
    setUpdateKey(k => k + 1)
  }
  
  const { mode } = useThemeMode()
  return (
    <div 
      aria-hidden={!open} 
      style={{ 
        position: 'fixed', 
        top: 0, 
        right: 0, 
        height: '100vh', 
        width: 'clamp(260px, 34vw, 560px)', 
        background: `var(--recursica-brand-${mode}-layer-layer-1-property-surface)`, 
        borderLeft: `1px solid var(--recursica-brand-${mode}-layer-layer-1-property-border-color)`, 
        boxShadow: `var(--recursica-brand-${mode}-elevations-elevation-3-shadow-color)`, 
        transform: open ? 'translateX(0)' : 'translateX(100%)', 
        transition: 'transform 200ms ease', 
        zIndex: 10000, 
        padding: 12, 
        overflowY: 'auto' 
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h2 style={{ margin: 0, fontWeight: 700 }}>{componentName}</h2>
        <button 
          onClick={onClose} 
          aria-label="Close" 
          style={{ 
            border: `1px solid var(--recursica-brand-${mode}-layer-layer-1-property-border-color)`, 
            background: 'transparent', 
            cursor: 'pointer', 
            borderRadius: 6, 
            padding: '4px 8px' 
          }}
        >
          &times;
        </button>
      </div>
      
      {componentVars.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: `var(--recursica-brand-${mode}-layer-layer-0-element-text-low-emphasis)` }}>
          No CSS variables found for {componentName}
        </div>
      ) : (
        <div key={updateKey} style={{ display: 'grid', gap: 12 }}>
          {/* Render grouped vars with section headers */}
          {Object.entries(groupedVars).map(([category, subcategories]) => {
            const sectionHeader = sectionHeaders[category]
            const categoryKey = category
            
            return (
              <div key={category} style={{ display: 'grid', gap: 8 }}>
                <h3 style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{sectionHeader}</h3>
                {Object.entries(subcategories).map(([subcategory, vars]) => {
                  const accordionKey = `${categoryKey}-${subcategory}`
                  const isOpen = openAccordions.has(accordionKey)
                  const subcategoryLabel = toTitleCase(subcategory)
                  
                  // Determine if this is a color category (use PaletteColorControl) or size (use TokenSlider)
                  const isColor = category === 'color'
                  
                  return (
                    <details 
                      key={subcategory} 
                      open={isOpen}
                      onToggle={(e) => {
                        const target = e.currentTarget
                        if (target.open && !isOpen) {
                          toggleAccordion(accordionKey)
                        } else if (!target.open && isOpen) {
                          toggleAccordion(accordionKey)
                        }
                      }}
                      style={{ border: `1px solid var(--recursica-brand-${mode}-layer-layer-1-property-border-color)`, borderRadius: 6, overflow: 'hidden' }}
                    >
                      <summary
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: 13,
                          listStyle: 'none',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          userSelect: 'none'
                        }}
                      >
                        <span>{subcategoryLabel}</span>
                        <span style={{ fontSize: 12, opacity: 0.6 }}>{isOpen ? '−' : '+'}</span>
                      </summary>
                      <div style={{ padding: '8px 12px 12px', display: 'grid', gap: 8 }}>
                        {vars.map(({ path, cssVar, value, type }) => {
                          const currentValue = readCssVar(cssVar)
                          const propertyName = toTitleCase(path.split('.').pop() || path)
                          
                          if (isColor) {
                            return (
                              <PaletteColorControl
                                key={cssVar}
                                label={propertyName}
                                targetCssVar={cssVar}
                                currentValueCssVar={cssVar}
                                swatchSize={14}
                                fontSize={13}
                              />
                            )
                          }
                          
                          // Size category - check if it's a dimension or numeric type
                          const isDimension = type === 'dimension'
                          const isNumeric = type === 'px' || type === 'number' || isDimension
                          
                          if (isNumeric && availableSizeTokens.length > 0) {
                            return (
                              <TokenSlider
                                key={cssVar}
                                label={propertyName}
                                tokens={availableSizeTokens}
                                currentToken={extractTokenFromCssVar(currentValue || '') || undefined}
                                onChange={(tokenName) => {
                                  const tokenKey = tokenName.replace('size/', '')
                                  updateCssVar(cssVar, `var(--recursica-tokens-size-${tokenKey})`)
                                  setUpdateKey(k => k + 1)
                                }}
                              />
                            )
                          }
                          
                          return (
                            <label key={cssVar} style={{ display: 'grid', gap: 4 }}>
                              <span style={{ fontSize: 12, opacity: 0.7 }}>{propertyName}</span>
                              <input
                                type={(typeof value === 'number') ? 'number' : 'text'}
                                value={currentValue || ''}
                                onChange={(e) => {
                                  updateCssVar(cssVar, e.target.value)
                                  setUpdateKey(k => k + 1)
                                }}
                                placeholder={`Enter value (type: ${type})`}
                                style={{ 
                                  padding: '6px 8px', 
                                  border: `1px solid var(--recursica-brand-${mode}-layer-layer-1-property-border-color)`, 
                                  borderRadius: 6 
                                }}
                              />
                            </label>
                          )
                        })}
                      </div>
                    </details>
                  )
                })}
              </div>
            )
          })}
          
          {/* Other vars (non-color, non-size, or size root-level properties) */}
          {otherVars.length > 0 && (
            <div style={{ display: 'grid', gap: 8 }}>
              {otherVars.map(({ path, cssVar, value, type }) => {
                const currentValue = readCssVar(cssVar)
                const propertyName = toTitleCase(path.split('.').pop() || path)
                const isColor = type === 'color'
                const isNumeric = type === 'px' || type === 'number' || type === 'dimension'
                
                if (isColor) {
                  return (
                    <PaletteColorControl
                      key={cssVar}
                      label={propertyName}
                      targetCssVar={cssVar}
                      currentValueCssVar={cssVar}
                      swatchSize={14}
                      fontSize={13}
                    />
                  )
                }
                
                if (isNumeric && availableSizeTokens.length > 0) {
                  return (
                    <TokenSlider
                      key={cssVar}
                      label={propertyName}
                      tokens={availableSizeTokens}
                      currentToken={extractTokenFromCssVar(currentValue || '') || undefined}
                      onChange={(tokenName) => {
                        const tokenKey = tokenName.replace('size/', '')
                        updateCssVar(cssVar, `var(--recursica-tokens-size-${tokenKey})`)
                        setUpdateKey(k => k + 1)
                      }}
                    />
                  )
                }
                
                return (
                  <label key={cssVar} style={{ display: 'grid', gap: 4 }}>
                    <span style={{ fontSize: 12, opacity: 0.7 }}>{propertyName}</span>
                    <input
                      type={(typeof value === 'number') ? 'number' : 'text'}
                      value={currentValue || ''}
                      onChange={(e) => {
                        updateCssVar(cssVar, e.target.value)
                        setUpdateKey(k => k + 1)
                      }}
                      placeholder={`Enter value (type: ${type})`}
                      style={{ 
                        padding: '6px 8px', 
                        border: `1px solid var(--recursica-brand-${mode}-layer-layer-1-property-border-color)`, 
                        borderRadius: 6 
                      }}
                    />
                  </label>
                )
              })}
            </div>
          )}
          
          <div>
            <button
              type="button"
              onClick={handleRevertAll}
              style={{ 
                padding: '8px 10px', 
                border: `1px solid var(--recursica-brand-${mode}-layer-layer-1-property-border-color)`, 
                background: 'transparent', 
                borderRadius: 6, 
                cursor: 'pointer' 
              }}
            >
              Revert
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

