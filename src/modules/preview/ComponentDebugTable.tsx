/**
 * Component Debug Table
 * 
 * Shows all CSS variables for a component with current and original values.
 * Allows resetting individual CSS variables to their original values.
 */

import { useMemo, useState, useEffect } from 'react'
import { useThemeMode } from '../theme/ThemeModeContext'
import { useVars } from '../vars/VarsContext'
import { readCssVar } from '../../core/css/readCssVar'
import { removeCssVar } from '../../core/css/updateCssVar'
import { buildUIKitVars } from '../../core/resolvers/uikit'
import { Button } from '../../components/adapters/Button'
import { iconNameToReactComponent } from '../components/iconUtils'
import { parseComponentStructure, type ComponentProp } from '../toolbar/utils/componentToolbarUtils'
import uikitJson from '../../../recursica_ui-kit.json'
import { toCssVarName } from '../../components/utils/cssVarNames'
import { genericLayerProperty, genericLayerText } from '../../core/css/cssVarBuilder'

/**
 * Extracts all CSS variables for a component from recursica_ui-kit.json
 */
function getComponentCssVars(componentName: string, mode: 'light' | 'dark'): Array<{ path: string; cssVar: string; value: any; type: string }> {
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
        const cssVar = toCssVarName(fullPath, mode)
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

interface ComponentDebugTableProps {
  componentName: string
  openPropControl?: string | null
  selectedVariants?: Record<string, string>
  selectedLayer?: string
}

export default function ComponentDebugTable({ 
  componentName,
  openPropControl,
  selectedVariants = {},
  selectedLayer = 'layer-0',
}: ComponentDebugTableProps) {
  const { mode } = useThemeMode()
  const { tokens, theme, uikit } = useVars()
  const [updateKey, setUpdateKey] = useState(0)

  // Get all CSS vars for the component from recursica_ui-kit.json
  const allComponentVars = useMemo(() => {
    return getComponentCssVars(componentName, mode)
  }, [componentName, mode])

  // Filter CSS vars to only show those relevant to current variants, layer, and alt layer
  const componentVars = useMemo(() => {
    // Use the component structure parser to get props and match them properly
    const structure = parseComponentStructure(componentName)
    
    // Create a map of CSS vars to ComponentProp for easy lookup
    const cssVarToProp = new Map<string, ComponentProp>()
    structure.props.forEach(prop => {
      cssVarToProp.set(prop.cssVar, prop)
    })
    
    return allComponentVars.filter(v => {
      const prop = cssVarToProp.get(v.cssVar)
      if (!prop) {
        // If we can't find the prop, include it (might be a special case)
        return true
      }
      
      // Skip variant-specific props that don't match selected variants
      if (prop.isVariantSpecific && prop.variantProp) {
        const selectedVariant = selectedVariants[prop.variantProp]
        if (!selectedVariant) return false

        // Check if this prop belongs to the selected variant
        const variantInPath = prop.path.find(p => p === selectedVariant)
        if (!variantInPath) return false
      }
      
      // For color props, check if layer matches
      if (prop.category === 'colors' || prop.category === 'color') {
        // Check both the prop path and the CSS var name for layer
        const layerInPath = prop.path.find(p => p.startsWith('layer-'))
        
        // Check if CSS var contains a layer reference
        const layerMatch = v.cssVar.match(/layer-(\d+)/)
        const hasLayerInCssVar = layerMatch !== null
        
        if (layerInPath) {
          // If this color prop has a layer in its path, it must match the selected layer
          if (layerInPath !== selectedLayer) return false
        } else if (hasLayerInCssVar) {
          // If layer is in CSS var name but not in prop path, check CSS var
          // This handles cases where the CSS var includes layer but prop path doesn't
          const layerFromCssVar = `layer-${layerMatch![1]}`
          if (layerFromCssVar !== selectedLayer) return false
        } else if (v.cssVar.includes('layer-')) {
          // Fallback: if CSS var contains "layer-" but didn't match the pattern, check if it contains selected layer
          if (!v.cssVar.includes(selectedLayer)) {
            return false
          }
        }
        // If no layer found anywhere, include it (might be a color prop without layer restriction)
      }
      
      // Include non-variant props (like border-radius, font-size at root level)
      // These don't have variant or layer restrictions
      return true
    })
  }, [allComponentVars, componentName, selectedVariants, selectedLayer])

  // Get resolved original values from recursica_ui-kit.json
  const originalValues = useMemo(() => {
    try {
      const resolvedVars = buildUIKitVars(tokens, theme, uikit, mode)
      return resolvedVars
    } catch (error) {
      console.error('Error building UIKit vars:', error)
      return {}
    }
  }, [tokens, theme, uikit, mode])

  // Get current values and compare with originals
  const varData = useMemo(() => {
    return componentVars.map(v => {
      // Get the inline style value directly (what's actually set on the element)
      const inlineValue = typeof document !== 'undefined' 
        ? document.documentElement.style.getPropertyValue(v.cssVar).trim()
        : ''
      
      // Get current value (from inline or computed)
      const currentValueRaw = readCssVar(v.cssVar) || ''
      
      // Extract just the CSS var name if it's wrapped in var(...)
      // e.g., "var(--recursica_ui-kit_...)" -> "--recursica_ui-kit_..."
      let currentValue = currentValueRaw
      const varMatch = currentValueRaw.match(/var\s*\(\s*(--[^)]+)\s*\)/)
      if (varMatch) {
        currentValue = varMatch[1]
      }
      
      // Get original value from resolved recursica_ui-kit.json
      const originalValue = originalValues[v.cssVar] || ''
      
      // A variable is changed if:
      // 1. There's an inline style set, AND
      // 2. The inline value differs from the original resolved value
      // This distinguishes user overrides from system-applied values
      const isChanged = inlineValue !== '' && inlineValue !== originalValue
      
      return {
        ...v,
        currentValue,
        originalValue,
        isChanged,
      }
    }).sort((a, b) => a.cssVar.localeCompare(b.cssVar))
  }, [componentVars, originalValues, updateKey])

  // Listen for CSS var changes to update the table
  useEffect(() => {
    const handleVarChange = () => {
      setUpdateKey(prev => prev + 1)
    }
    
    window.addEventListener('cssVarsReset', handleVarChange)
    // Also listen for style changes on documentElement
    const observer = new MutationObserver(handleVarChange)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    })
    
    return () => {
      window.removeEventListener('cssVarsReset', handleVarChange)
      observer.disconnect()
    }
  }, [])

  const handleReset = (cssVar: string) => {
    removeCssVar(cssVar)
    setUpdateKey(prev => prev + 1)
    // Trigger a re-render by dispatching the reset event
    window.dispatchEvent(new CustomEvent('cssVarsReset'))
  }

  // Get CSS vars for the currently open prop control
  const highlightedCssVars = useMemo(() => {
    if (!openPropControl) return new Set<string>()
    
    try {
      const structure = parseComponentStructure(componentName)
      const prop = structure.props.find(p => p.name === openPropControl)
      if (!prop) return new Set<string>()

      const vars = new Set<string>()
      
      // Get CSS vars for this prop based on selected variants and layer
      if (prop.isVariantSpecific && prop.variantProp) {
        const selectedVariant = selectedVariants[prop.variantProp]
        if (selectedVariant) {
          if (prop.category === 'color') {
            // For color props, match selected variant and layer
            structure.props.forEach(p => {
              if (p.name === prop.name && p.variantProp === prop.variantProp && p.category === 'color') {
                const variantInPath = p.path.find(pathPart => pathPart === selectedVariant)
                const layerInPath = p.path.find(pathPart => pathPart === selectedLayer)
                if (variantInPath && layerInPath) {
                  vars.add(p.cssVar)
                }
              }
            })
          } else {
            // For size props, match selected variant
            structure.props.forEach(p => {
              if (p.name === prop.name && p.variantProp === prop.variantProp) {
                const variantInPath = p.path.find(pathPart => pathPart === selectedVariant)
                if (variantInPath) {
                  vars.add(p.cssVar)
                }
              }
            })
          }
        }
      } else {
        // For non-variant props, use the prop's CSS var
        vars.add(prop.cssVar)
      }

      // Also include hover prop if it exists
      if (prop.hoverProp) {
        vars.add(prop.hoverProp.cssVar)
      }

      return vars
    } catch {
      return new Set<string>()
    }
  }, [openPropControl, componentName, selectedVariants, selectedLayer])

  if (componentVars.length === 0) {
    return (
      <div style={{
        padding: 'var(--recursica_brand_dimensions_general_md)',
        color: `var(${genericLayerText(0, 'low-emphasis')})`,
        fontSize: 'var(--recursica_brand_typography_body-small-font-size)',
      }}>
        No CSS variables found for {componentName}
      </div>
    )
  }

  return (
    <div style={{
      marginTop: 'var(--recursica_brand_dimensions_general_lg)',
      border: `1px solid var(${genericLayerProperty(1, 'border-color')})`,
      borderRadius: 'var(--recursica_brand_dimensions_border-radii_default)',
      overflow: 'hidden',
      width: '100%',
    }}>
      <div style={{
        padding: 'var(--recursica_brand_dimensions_general_md)',
        background: `var(${genericLayerProperty(1, 'surface')})`,
        borderBottom: `1px solid var(${genericLayerProperty(1, 'border-color')})`,
      }}>
        <h3 style={{
          margin: 0,
          fontSize: 'var(--recursica_brand_typography_body-font-size)',
          fontWeight: 600,
          color: `var(${genericLayerText(0, 'color')})`,
        }}>
          CSS Variables Debug
        </h3>
      </div>
      <div style={{
        overflowX: 'auto',
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 'var(--recursica_brand_typography_body-small-font-size)',
        }}>
          <thead>
            <tr style={{
              background: `var(${genericLayerProperty(1, 'surface')})`,
              borderBottom: `1px solid var(${genericLayerProperty(1, 'border-color')})`,
              position: 'sticky',
              top: 0,
              zIndex: 1,
            }}>
              <th style={{
                padding: 'var(--recursica_brand_dimensions_general_sm) var(--recursica_brand_dimensions_general_md)',
                textAlign: 'left',
                fontWeight: 600,
                color: `var(${genericLayerText(0, 'color')})`,
                borderRight: `1px solid var(${genericLayerProperty(1, 'border-color')})`,
              }}>
                CSS Variable
              </th>
              <th style={{
                padding: 'var(--recursica_brand_dimensions_general_sm) var(--recursica_brand_dimensions_general_md)',
                textAlign: 'left',
                fontWeight: 600,
                color: `var(${genericLayerText(0, 'color')})`,
                borderRight: `1px solid var(${genericLayerProperty(1, 'border-color')})`,
              }}>
                Current Value
              </th>
              <th style={{
                padding: 'var(--recursica_brand_dimensions_general_sm) var(--recursica_brand_dimensions_general_md)',
                textAlign: 'center',
                fontWeight: 600,
                color: `var(${genericLayerText(0, 'color')})`,
                width: '80px',
              }}>
                Reset
              </th>
            </tr>
          </thead>
          <tbody>
            {varData.map((v, index) => {
              const isHighlighted = highlightedCssVars.has(v.cssVar)
              const isChanged = v.isChanged
              
              return (
                <tr
                  key={v.cssVar}
                  style={{
                    background: index % 2 === 0 
                      ? `var(${genericLayerProperty(0, 'surface')})` 
                      : `var(${genericLayerProperty(1, 'surface')})`,
                    borderBottom: `1px solid var(${genericLayerProperty(1, 'border-color')})`,
                  }}
                >
                  <td style={{
                    padding: 'var(--recursica_brand_dimensions_general_sm) var(--recursica_brand_dimensions_general_md)',
                    color: `var(${genericLayerText(0, 'color')})`,
                    fontFamily: 'monospace',
                    fontSize: 'var(--recursica_brand_typography_body-small-font-size)',
                    borderRight: `1px solid var(${genericLayerProperty(1, 'border-color')})`,
                    fontWeight: isHighlighted ? 700 : 400,
                  }}>
                    {v.cssVar}
                  </td>
                  <td style={{
                    padding: 'var(--recursica_brand_dimensions_general_sm) var(--recursica_brand_dimensions_general_md)',
                    color: isChanged 
                      ? `var(--recursica_brand_palettes_core_interactive_default_color_tone)`
                      : `var(${genericLayerText(0, 'color')})`,
                    background: isChanged 
                      ? `var(${genericLayerProperty(1, 'surface')})`
                      : 'transparent',
                    fontFamily: 'monospace',
                    fontSize: 'var(--recursica_brand_typography_body-small-font-size)',
                    borderRight: `1px solid var(${genericLayerProperty(1, 'border-color')})`,
                  }}>
                    {v.currentValue || <span style={{ opacity: 0.5 }}>—</span>}
                  </td>
                <td style={{
                  padding: 'var(--recursica_brand_dimensions_general_sm)',
                  textAlign: 'center',
                }}>
                  <Button
                    variant="text"
                    size="small"
                    icon={(() => {
                      const ResetIcon = iconNameToReactComponent('arrow-path')
                      return ResetIcon ? <ResetIcon /> : null
                    })()}
                    onClick={() => handleReset(v.cssVar)}
                    disabled={!v.isChanged}
                    style={{
                      minWidth: '32px',
                      width: '32px',
                      height: '32px',
                      padding: 0,
                      opacity: v.isChanged ? 1 : 0.5,
                      color: v.isChanged 
                        ? `var(${genericLayerProperty(2, 'interactive-tone')})`
                        : `var(${genericLayerText(0, 'low-emphasis')})`,
                    }}
                  />
                </td>
              </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

