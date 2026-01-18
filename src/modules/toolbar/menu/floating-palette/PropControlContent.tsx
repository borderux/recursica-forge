// Extract the rendering logic from PropControl for use in accordions
import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { ComponentProp, toSentenceCase, parseComponentStructure } from '../../utils/componentToolbarUtils'
import { getPropLabel, getGroupedProps } from '../../utils/loadToolbarConfig'
import { readCssVar, readCssVarResolved } from '../../../../core/css/readCssVar'
import { updateCssVar } from '../../../../core/css/updateCssVar'
import PaletteColorControl from '../../../forms/PaletteColorControl'
import DimensionTokenSelector from '../../../components/DimensionTokenSelector'
import { useVars } from '../../../vars/VarsContext'
import { useThemeMode } from '../../../theme/ThemeModeContext'
import { buildComponentCssVarPath } from '../../../../components/utils/cssVarNames'
import OpacitySelector from './OpacitySelector'
import { Slider } from '../../../../components/adapters/Slider'
import { Label } from '../../../../components/adapters/Label'
import './PropControl.css'

// Helper to format dimension label from key
const formatDimensionLabel = (key: string): string => {
  if (key === 'default') return 'Default'
  if (key === 'none') return 'None'
  if (key === '2xl') return '2Xl'
  if (key === 'horizontal') return 'Horizontal'
  if (key === 'vertical') return 'Vertical'
  
  const sizeMap: Record<string, string> = {
    'xs': 'Xs',
    'sm': 'Sm',
    'md': 'Md',
    'lg': 'Lg',
    'xl': 'Xl',
  }
  if (sizeMap[key]) return sizeMap[key]
  
  return key.charAt(0).toUpperCase() + key.slice(1)
}

// Inline brand dimension slider component
function BrandDimensionSliderInline({
  targetCssVar,
  targetCssVars = [],
  label,
  dimensionCategory,
  layer = 'layer-1',
}: {
  targetCssVar: string
  targetCssVars?: string[]
  label: string
  dimensionCategory: 'border-radii' | 'icons' | 'general' | 'text-size'
  layer?: 'layer-0' | 'layer-1' | 'layer-2' | 'layer-3'
}) {
  const { theme } = useVars()
  const { mode } = useThemeMode()
  
  // Build tokens list from brand dimension tokens, sorted by pixel value
  const tokens = useMemo(() => {
    const options: Array<{ name: string; value: number; label: string; key: string }> = []
    
    try {
      const root: any = (theme as any)?.brand ? (theme as any).brand : theme
      const dimensions = root?.dimensions || {}
      const dimensionCategoryData = dimensions[dimensionCategory] || {}
      
      // Collect dimension tokens
      Object.keys(dimensionCategoryData).forEach(dimensionKey => {
        const dimensionValue = dimensionCategoryData[dimensionKey]
        if (dimensionValue && typeof dimensionValue === 'object' && '$value' in dimensionValue) {
          const cssVar = `--recursica-brand-dimensions-${dimensionCategory}-${dimensionKey}`
          const cssValue = readCssVar(cssVar)
          
          if (cssValue) {
            const resolvedValue = readCssVarResolved(cssVar)
            let numericValue: number | undefined
            
            if (resolvedValue) {
              const match = resolvedValue.match(/^(-?\d+(?:\.\d+)?)/)
              if (match) {
                numericValue = parseFloat(match[1])
              }
            }
            
            const displayLabel = formatDimensionLabel(dimensionKey)
            
            options.push({
              name: cssVar,
              value: numericValue ?? 0,
              label: displayLabel,
              key: dimensionKey,
            })
          }
        }
      })
      
      // Sort by pixel value (smallest to largest), "none" first
      const sortedTokens = options.sort((a, b) => {
        if (a.key === 'none') return -1
        if (b.key === 'none') return 1
        
        if (a.value !== undefined && b.value !== undefined) {
          return a.value - b.value
        }
        if (a.value !== undefined) return -1
        if (b.value !== undefined) return 1
        
        return a.label.localeCompare(b.label)
      })
      
      return sortedTokens
    } catch (error) {
      console.error(`Error loading ${dimensionCategory} tokens:`, error)
      return []
    }
  }, [theme, mode, dimensionCategory])
  
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const justSetValueRef = useRef<string | null>(null)
  
  const readInitialValue = useCallback(() => {
    const inlineValue = typeof document !== 'undefined' 
      ? document.documentElement.style.getPropertyValue(targetCssVar).trim()
      : ''
    
    if (justSetValueRef.current === inlineValue) {
      return
    }
    
    const currentValue = inlineValue || readCssVar(targetCssVar)
    
    if (!currentValue || currentValue === 'null' || currentValue === '') {
      const noneIndex = tokens.findIndex(t => t.key === 'none')
      setSelectedIndex(noneIndex >= 0 ? noneIndex : 0)
      return
    }
    
    if (currentValue.trim().startsWith('var(--recursica-')) {
      const matchingIndex = tokens.findIndex(t => {
        const dimensionName = t.name.replace(`--recursica-brand-dimensions-${dimensionCategory}-`, '')
        return currentValue.includes(`${dimensionCategory}-${dimensionName}`) || currentValue.includes(`dimensions-${dimensionCategory}-${dimensionName}`)
      })
      
      if (matchingIndex >= 0) {
        setSelectedIndex(matchingIndex)
        return
      }
      
      const resolved = readCssVarResolved(targetCssVar)
      if (resolved) {
        const match = resolved.match(/^(-?\d+(?:\.\d+)?)px/i)
        if (match) {
          const pxValue = parseFloat(match[1])
          if (pxValue === 0 && (dimensionCategory === 'border-radii' || dimensionCategory === 'general')) {
            const noneIndex = tokens.findIndex(t => t.key === 'none')
            if (noneIndex >= 0) {
              setSelectedIndex(noneIndex)
              return
            }
          }
          
          const matchingIndex = tokens
            .map((t, idx) => ({ token: t, index: idx, diff: Math.abs((t.value ?? 0) - pxValue) }))
            .reduce((closest, current) => {
              if (!closest) return current
              return current.diff < closest.diff ? current : closest
            }, undefined as { token: typeof tokens[0]; index: number; diff: number } | undefined)
          
          if (matchingIndex && matchingIndex.diff < 1) {
            setSelectedIndex(matchingIndex.index)
            return
          }
        }
      }
    }
    
    setSelectedIndex(0)
  }, [targetCssVar, tokens, dimensionCategory])
  
  useEffect(() => {
    readInitialValue()
  }, [readInitialValue])
  
  useEffect(() => {
    const handleReset = () => {
      readInitialValue()
    }
    
    const handleCssVarUpdate = (event: CustomEvent) => {
      const cssVars = targetCssVars.length > 0 ? targetCssVars : [targetCssVar]
      if (event.detail?.cssVars?.some((cv: string) => cssVars.includes(cv))) {
        setTimeout(() => {
          readInitialValue()
        }, 0)
      }
    }
    
    window.addEventListener('cssVarsReset', handleReset)
    window.addEventListener('cssVarsUpdated', handleCssVarUpdate as EventListener)
    return () => {
      window.removeEventListener('cssVarsReset', handleReset)
      window.removeEventListener('cssVarsUpdated', handleCssVarUpdate as EventListener)
    }
  }, [readInitialValue, targetCssVar, targetCssVars])
  
  const handleSliderChange = (value: number | [number, number]) => {
    const numValue = typeof value === 'number' ? value : value[0]
    const clampedIndex = Math.max(0, Math.min(tokens.length - 1, Math.round(numValue)))
    setSelectedIndex(clampedIndex)
    
    const selectedToken = tokens[clampedIndex]
    if (selectedToken) {
      const cssVars = targetCssVars.length > 0 ? targetCssVars : [targetCssVar]
      const tokenValue = `var(${selectedToken.name})`
      
      cssVars.forEach(cssVar => {
        updateCssVar(cssVar, tokenValue)
        justSetValueRef.current = tokenValue
        setTimeout(() => {
          justSetValueRef.current = null
        }, 100)
      })
      
      requestAnimationFrame(() => {
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
          detail: { cssVars }
        }))
      })
    }
  }
  
  // Ensure we have valid tokens before rendering
  if (tokens.length === 0) {
    return (
      <div style={{ padding: '8px', fontSize: 12, opacity: 0.7 }}>
        Loading tokens...
      </div>
    )
  }
  
  // Ensure selectedIndex is within bounds
  const safeSelectedIndex = Math.max(0, Math.min(selectedIndex, tokens.length - 1))
  const currentToken = tokens[safeSelectedIndex]
  
  const minToken = tokens[0]
  const maxToken = tokens[tokens.length - 1]
  const minLabel = minToken?.label || 'None'
  const maxLabel = maxToken?.label || 'Xl'
  
  // Create a function that calculates the value label from the current slider value
  // This ensures it updates when the slider changes
  const getValueLabel = useCallback((value: number) => {
    const index = Math.max(0, Math.min(Math.round(value), tokens.length - 1))
    const token = tokens[index]
    if (token) {
      // Always return a non-empty string
      const label = token.label || (token.key ? formatDimensionLabel(token.key) : '')
      return label || String(index)
    }
    return String(index)
  }, [tokens])
  
  return (
    <Slider
      value={safeSelectedIndex}
      onChange={handleSliderChange}
      min={0}
      max={tokens.length - 1}
      step={1}
      layer={layer}
      layout="stacked"
      showInput={false}
      showValueLabel={true}
      valueLabel={getValueLabel}
      tooltipText={currentToken?.label || (currentToken?.key ? formatDimensionLabel(currentToken.key) : String(safeSelectedIndex))}
      minLabel={minLabel}
      maxLabel={maxLabel}
      label={<Label layer={layer} layout="stacked">{label}</Label>}
    />
  )
}

// Inline typography slider component
function TypographySliderInline({
  targetCssVar,
  targetCssVars = [],
  label,
  layer = 'layer-1',
}: {
  targetCssVar: string
  targetCssVars?: string[]
  label: string
  layer?: 'layer-0' | 'layer-1' | 'layer-2' | 'layer-3'
}) {
  const { theme } = useVars()
  const { mode } = useThemeMode()
  
  // Build tokens list from typography tokens, sorted by font-size
  const tokens = useMemo(() => {
    const options: Array<{ name: string; label: string; fontSize: number }> = []
    
    try {
      const root: any = (theme as any)?.brand ? (theme as any).brand : theme
      const typography = root?.typography || {}
      
      // Collect all type styles (body, body-small, button, caption, etc.)
      Object.keys(typography).forEach(styleName => {
        if (styleName.startsWith('$')) return
        
        const styleValue = typography[styleName]
        if (styleValue && typeof styleValue === 'object' && '$type' in styleValue && styleValue.$type === 'typography') {
          const cssVar = `--recursica-brand-typography-${styleName}-font-size`
          const cssValue = readCssVar(cssVar)
          
          if (cssValue) {
            const resolvedValue = readCssVarResolved(cssVar)
            let fontSize = 0
            
            if (resolvedValue) {
              const match = resolvedValue.match(/([\d.]+)(px|rem|em)/)
              if (match) {
                const value = parseFloat(match[1])
                const unit = match[2]
                
                if (unit === 'px') {
                  fontSize = value
                } else if (unit === 'rem' || unit === 'em') {
                  fontSize = value * 16
                }
              } else {
                const numMatch = resolvedValue.match(/([\d.]+)/)
                if (numMatch) {
                  fontSize = parseFloat(numMatch[1])
                }
              }
            }
            
            // Format label from style name (e.g., "body-small" -> "Body Small")
            const formattedLabel = styleName
              .split('-')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')
            
            options.push({
              name: cssVar,
              label: formattedLabel,
              fontSize,
            })
          }
        }
      })
    } catch (error) {
      console.error('Error loading typography tokens:', error)
      return []
    }
    
    // Sort by font-size from smallest to largest
    return options.sort((a, b) => a.fontSize - b.fontSize)
  }, [theme, mode])
  
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const justSetValueRef = useRef<string | null>(null)
  
  const extractTypeStyleName = useCallback((cssVarValue: string): string | null => {
    if (!cssVarValue) return null
    
    const braceMatch = cssVarValue.match(/\{brand\.typography\.([^}]+)\}/)
    if (braceMatch) {
      return braceMatch[1].toLowerCase()
    }
    
    const typoMatch = cssVarValue.match(/--recursica-brand-typography-([a-z0-9-]+)-(?:font-size|font-weight|font-family|font-letter-spacing|line-height)/)
    if (typoMatch) {
      return typoMatch[1].toLowerCase()
    }
    
    const resolved = readCssVarResolved(targetCssVar)
    if (resolved) {
      const resolvedBraceMatch = resolved.match(/\{brand\.typography\.([^}]+)\}/)
      if (resolvedBraceMatch) {
        return resolvedBraceMatch[1].toLowerCase()
      }
      const resolvedTypoMatch = resolved.match(/--recursica-brand-typography-([a-z0-9-]+)-(?:font-size|font-weight|font-family|font-letter-spacing|line-height)/)
      if (resolvedTypoMatch) {
        return resolvedTypoMatch[1].toLowerCase()
      }
    }
    
    return null
  }, [targetCssVar])
  
  const readInitialValue = useCallback(() => {
    const inlineValue = typeof document !== 'undefined' 
      ? document.documentElement.style.getPropertyValue(targetCssVar).trim()
      : ''
    
    if (justSetValueRef.current === inlineValue) {
      return
    }
    
    const currentValue = inlineValue || readCssVar(targetCssVar)
    
    if (!currentValue) {
      const resolvedValue = readCssVarResolved(targetCssVar)
      if (!resolvedValue) {
        // Default to first token (usually smallest)
        setSelectedIndex(0)
        return
      }
    }
    
    const styleName = extractTypeStyleName(currentValue || readCssVarResolved(targetCssVar) || '')
    if (styleName) {
      const matchingIndex = tokens.findIndex(t => {
        const tokenStyleName = t.name.match(/--recursica-brand-typography-([a-z0-9-]+)-(?:font-size|font-weight|font-family|font-letter-spacing|line-height)/)?.[1]
        return tokenStyleName === styleName
      })
      
      if (matchingIndex >= 0) {
        setSelectedIndex(matchingIndex)
        return
      }
    }
    
    setSelectedIndex(0)
  }, [targetCssVar, tokens, extractTypeStyleName])
  
  useEffect(() => {
    readInitialValue()
  }, [readInitialValue])
  
  useEffect(() => {
    const handleReset = () => {
      readInitialValue()
    }
    
    const handleCssVarUpdate = (event: CustomEvent) => {
      const cssVars = targetCssVars.length > 0 ? targetCssVars : [targetCssVar]
      if (event.detail?.cssVars?.some((cv: string) => cssVars.includes(cv))) {
        setTimeout(() => {
          readInitialValue()
        }, 0)
      }
    }
    
    window.addEventListener('cssVarsReset', handleReset)
    window.addEventListener('cssVarsUpdated', handleCssVarUpdate as EventListener)
    return () => {
      window.removeEventListener('cssVarsReset', handleReset)
      window.removeEventListener('cssVarsUpdated', handleCssVarUpdate as EventListener)
    }
  }, [readInitialValue, targetCssVar, targetCssVars])
  
  const handleSliderChange = (value: number | [number, number]) => {
    const numValue = typeof value === 'number' ? value : value[0]
    const clampedIndex = Math.max(0, Math.min(tokens.length - 1, Math.round(numValue)))
    setSelectedIndex(clampedIndex)
    
    const selectedToken = tokens[clampedIndex]
    if (selectedToken) {
      const cssVars = targetCssVars.length > 0 ? targetCssVars : [targetCssVar]
      const tokenValue = `var(${selectedToken.name})`
      
      cssVars.forEach(cssVar => {
        updateCssVar(cssVar, tokenValue)
        justSetValueRef.current = tokenValue
        setTimeout(() => {
          justSetValueRef.current = null
        }, 100)
      })
      
      requestAnimationFrame(() => {
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
          detail: { cssVars }
        }))
      })
    }
  }
  
  if (tokens.length === 0) {
    return (
      <div style={{ padding: '8px', fontSize: 12, opacity: 0.7 }}>
        Loading tokens...
      </div>
    )
  }
  
  const safeSelectedIndex = Math.max(0, Math.min(selectedIndex, tokens.length - 1))
  const currentToken = tokens[safeSelectedIndex]
  
  const minToken = tokens[0]
  const maxToken = tokens[tokens.length - 1]
  const minLabel = minToken?.label || 'Body'
  const maxLabel = maxToken?.label || 'Heading'
  
  // Create a function that calculates the value label from the current slider value
  // This ensures it updates when the slider changes
  const getValueLabel = useCallback((value: number) => {
    const index = Math.max(0, Math.min(Math.round(value), tokens.length - 1))
    const token = tokens[index]
    // Always return a non-empty string
    const label = token?.label || ''
    return label || String(index)
  }, [tokens])
  
  return (
    <Slider
      value={safeSelectedIndex}
      onChange={handleSliderChange}
      min={0}
      max={tokens.length - 1}
      step={1}
      layer={layer}
      layout="stacked"
      showInput={false}
      showValueLabel={true}
      valueLabel={getValueLabel}
      tooltipText={currentToken?.label || String(safeSelectedIndex)}
      minLabel={minLabel}
      maxLabel={maxLabel}
      label={<Label layer={layer} layout="stacked">{label}</Label>}
    />
  )
}

// Inline elevation slider component
function ElevationSliderInline({
  primaryVar,
  label,
  elevationOptions,
  mode,
  layer = 'layer-1',
}: {
  primaryVar: string
  label: string
  elevationOptions: Array<{ name: string; label: string }>
  mode: 'light' | 'dark'
  layer?: 'layer-0' | 'layer-1' | 'layer-2' | 'layer-3'
}) {
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const justSetValueRef = useRef<string | null>(null)
  
  // Build tokens list from elevation options
  const tokens = useMemo(() => {
    return elevationOptions.map((opt, index) => ({
      name: opt.name,
      label: opt.label,
      index,
    }))
  }, [elevationOptions])
  
  const readInitialValue = useCallback(() => {
    const inlineValue = typeof document !== 'undefined' 
      ? document.documentElement.style.getPropertyValue(primaryVar).trim()
      : ''
    
    if (justSetValueRef.current === inlineValue) {
      return
    }
    
    const currentValue = inlineValue || readCssVar(primaryVar)
    
    if (!currentValue) {
      setSelectedIndex(0)
      return
    }
    
    // Extract elevation name from value
    let elevationName = 'elevation-0'
    if (currentValue) {
      const match = currentValue.match(/elevations\.(elevation-\d+)/)
      if (match) {
        elevationName = match[1]
      } else if (/^elevation-\d+$/.test(currentValue)) {
        elevationName = currentValue
      }
    }
    
    const matchingIndex = tokens.findIndex(t => t.name === elevationName)
    setSelectedIndex(matchingIndex >= 0 ? matchingIndex : 0)
  }, [primaryVar, tokens])
  
  useEffect(() => {
    readInitialValue()
  }, [readInitialValue])
  
  useEffect(() => {
    const handleCssVarUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (!detail?.cssVars || detail.cssVars.includes(primaryVar)) {
        setTimeout(() => {
          readInitialValue()
        }, 0)
      }
    }
    window.addEventListener('cssVarsUpdated', handleCssVarUpdate)
    return () => window.removeEventListener('cssVarsUpdated', handleCssVarUpdate)
  }, [readInitialValue, primaryVar])
  
  const handleSliderChange = (value: number | [number, number]) => {
    const numValue = typeof value === 'number' ? value : value[0]
    const clampedIndex = Math.max(0, Math.min(tokens.length - 1, Math.round(numValue)))
    setSelectedIndex(clampedIndex)
    
    const selectedToken = tokens[clampedIndex]
    if (selectedToken) {
      const elevationValue = `{brand.themes.${mode}.elevations.${selectedToken.name}}`
      updateCssVar(primaryVar, elevationValue)
      justSetValueRef.current = elevationValue
      setTimeout(() => {
        justSetValueRef.current = null
      }, 100)
      
      requestAnimationFrame(() => {
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
          detail: { cssVars: [primaryVar] }
        }))
      })
    }
  }
  
  if (tokens.length === 0) {
    return (
      <div style={{ padding: '8px', fontSize: 12, opacity: 0.7 }}>
        Loading tokens...
      </div>
    )
  }
  
  const safeSelectedIndex = Math.max(0, Math.min(selectedIndex, tokens.length - 1))
  const currentToken = tokens[safeSelectedIndex]
  
  const minToken = tokens[0]
  const maxToken = tokens[tokens.length - 1]
  
  // Extract elevation number from token name (e.g., "elevation-0" -> 0, "elevation-4" -> 4)
  const getElevationNumber = (token: typeof tokens[0] | undefined): number => {
    if (!token) return 0
    const match = token.name.match(/elevation-(\d+)/)
    return match ? parseInt(match[1], 10) : 0
  }
  
  // Min label: "None" for elevation-0, otherwise the number
  const minElevationNum = getElevationNumber(minToken)
  const minLabel = minElevationNum === 0 ? 'None' : String(minElevationNum)
  
  // Max label: just the number
  const maxElevationNum = getElevationNumber(maxToken)
  const maxLabel = String(maxElevationNum)
  
  // Create a function that calculates the value label from the current slider value
  const getValueLabel = useCallback((value: number) => {
    const index = Math.max(0, Math.min(Math.round(value), tokens.length - 1))
    const token = tokens[index]
    if (!token) return 'None'
    const elevationNum = getElevationNumber(token)
    return elevationNum === 0 ? 'None' : String(elevationNum)
  }, [tokens])
  
  return (
    <Slider
      value={safeSelectedIndex}
      onChange={handleSliderChange}
      min={0}
      max={tokens.length - 1}
      step={1}
      layer={layer}
      layout="stacked"
      showInput={false}
      showValueLabel={true}
      valueLabel={getValueLabel}
      tooltipText={(() => {
        if (!currentToken) return 'None'
        const match = currentToken.name.match(/elevation-(\d+)/)
        const elevationNum = match ? parseInt(match[1], 10) : 0
        return elevationNum === 0 ? 'None' : String(elevationNum)
      })()}
      minLabel={minLabel}
      maxLabel={maxLabel}
      label={<Label layer={layer} layout="stacked">{label}</Label>}
    />
  )
}

interface PropControlContentProps {
  prop: ComponentProp
  componentName: string
  selectedVariants: Record<string, string>
  selectedLayer: string
}

export default function PropControlContent({
  prop,
  componentName,
  selectedVariants,
  selectedLayer,
}: PropControlContentProps) {
  const { theme: themeJson } = useVars()
  const { mode } = useThemeMode()
  
  const elevationOptions = useMemo(() => {
    try {
      const root: any = (themeJson as any)?.brand ? (themeJson as any).brand : themeJson
      const themes = root?.themes || root
      const elev: any = themes?.light?.elevations || root?.light?.elevations || {}
      const names = Object.keys(elev).filter((k) => /^elevation-\d+$/.test(k)).sort((a,b) => Number(a.split('-')[1]) - Number(b.split('-')[1]))
      return names.map((n) => {
        const idx = Number(n.split('-')[1])
        const label = idx === 0 ? 'Elevation 0 (No elevation)' : `Elevation ${idx}`
        return { name: n, label }
      })
    } catch {
      return []
    }
  }, [themeJson])

  const getCssVarsForProp = (propToCheck: ComponentProp): string[] => {
    const structure = parseComponentStructure(componentName)
    const matchingProp = structure.props.find(p => {
      if (p.name !== propToCheck.name || p.category !== propToCheck.category) {
        return false
      }
      if (propToCheck.isVariantSpecific && propToCheck.variantProp) {
        const selectedVariant = selectedVariants[propToCheck.variantProp]
        if (!selectedVariant) return false
        const variantInPath = p.path.find(pathPart => pathPart === selectedVariant)
        if (!variantInPath) return false
      }
      if (propToCheck.category === 'colors') {
        const layerInPath = p.path.find(pathPart => pathPart.startsWith('layer-'))
        if (layerInPath) {
          if (layerInPath !== selectedLayer) return false
        }
      }
      return true
    })
    return matchingProp ? [matchingProp.cssVar] : [propToCheck.cssVar]
  }

  const baseCssVars = getCssVarsForProp(prop)
  let primaryCssVar = baseCssVars[0] || prop.cssVar
  let cssVarsForControl = baseCssVars
  
  // Special handling for MenuItem background: update all three background CSS variables
  // Component name can be "Menu item" (display name) or "MenuItem" (component name)
  const isMenuItem = componentName.toLowerCase().replace(/\s+/g, '-') === 'menu-item' || 
                     componentName.toLowerCase().replace(/\s+/g, '') === 'menuitem' ||
                     componentName === 'MenuItem' ||
                     componentName === 'Menu item'
  
  if (prop.name.toLowerCase() === 'background' && isMenuItem) {
    const defaultBgVar = buildComponentCssVarPath('MenuItem', 'variants', 'styles', 'default', 'properties', 'colors', selectedLayer, 'background')
    const selectedBgVar = buildComponentCssVarPath('MenuItem', 'properties', 'colors', selectedLayer, 'selected-background')
    const disabledBgVar = buildComponentCssVarPath('MenuItem', 'variants', 'styles', 'disabled', 'properties', 'colors', selectedLayer, 'background')
    
    // Use default as primary, but include all three in the control
    primaryCssVar = defaultBgVar
    cssVarsForControl = [defaultBgVar, selectedBgVar, disabledBgVar]
  }
  
  // Special handling for MenuItem text: update all variant text colors (default, selected, disabled)
  if (prop.name.toLowerCase() === 'text' && isMenuItem) {
    const defaultTextVar = buildComponentCssVarPath('MenuItem', 'variants', 'styles', 'default', 'properties', 'colors', selectedLayer, 'text')
    const selectedTextVar = buildComponentCssVarPath('MenuItem', 'variants', 'styles', 'selected', 'properties', 'colors', selectedLayer, 'text')
    const disabledTextVar = buildComponentCssVarPath('MenuItem', 'variants', 'styles', 'disabled', 'properties', 'colors', selectedLayer, 'text')
    
    // Use default as primary, but include all three in the control
    primaryCssVar = defaultTextVar
    cssVarsForControl = [defaultTextVar, selectedTextVar, disabledTextVar]
  }
  
  if (prop.name.toLowerCase() === 'height' && componentName.toLowerCase() === 'badge') {
    const sizeVariant = selectedVariants.size || 'small'
    const minHeightVar = `--recursica-ui-kit-components-badge-size-variants-${sizeVariant}-min-height`
    primaryCssVar = minHeightVar
    cssVarsForControl = [minHeightVar]
  }
  
  if (prop.name.toLowerCase() === 'label-width' && componentName.toLowerCase() === 'label') {
    const layoutVariant = selectedVariants.layout || 'stacked'
    const sizeVariant = selectedVariants.size || 'default'
    const widthVar = `--recursica-ui-kit-components-label-variants-layouts-${layoutVariant}-variants-sizes-${sizeVariant}-properties-width`
    primaryCssVar = widthVar
    cssVarsForControl = [widthVar]
  }

  const getContrastColorVar = (propToRender: ComponentProp): string | undefined => {
    const propName = propToRender.name.toLowerCase()
    const structure = parseComponentStructure(componentName)
    
    if (propName === 'text' || propName === 'text-hover') {
      const bgPropName = propName === 'text-hover' ? 'background-hover' : 'background'
      const bgProp = structure.props.find(p => 
        p.name.toLowerCase() === bgPropName && 
        p.category === 'colors' &&
        (!p.isVariantSpecific || (p.variantProp && selectedVariants[p.variantProp] && p.path.includes(selectedVariants[p.variantProp]))) &&
        (p.category !== 'colors' || !p.path.includes('layer-') || p.path.includes(selectedLayer))
      )
      if (bgProp) {
        const bgCssVars = getCssVarsForProp(bgProp)
        return bgCssVars[0]
      }
    }
    
    if (propName === 'background' || propName === 'background-hover') {
      const textPropName = propName === 'background-hover' ? 'text-hover' : 'text'
      const textProp = structure.props.find(p => 
        p.name.toLowerCase() === textPropName && 
        p.category === 'colors' &&
        (!p.isVariantSpecific || (p.variantProp && selectedVariants[p.variantProp] && p.path.includes(selectedVariants[p.variantProp]))) &&
        (p.category !== 'colors' || !p.path.includes('layer-') || p.path.includes(selectedLayer))
      )
      if (textProp) {
        const textCssVars = getCssVarsForProp(textProp)
        return textCssVars[0]
      }
    }
    
    if (propName === 'track-selected' || propName === 'track-unselected') {
      const thumbProp = structure.props.find(p => 
        p.name.toLowerCase() === 'thumb' && 
        p.category === 'colors' &&
        (!p.isVariantSpecific || (p.variantProp && selectedVariants[p.variantProp] && p.path.includes(selectedVariants[p.variantProp]))) &&
        (p.category !== 'colors' || !p.path.includes('layer-') || p.path.includes(selectedLayer))
      )
      if (thumbProp) {
        const thumbCssVars = getCssVarsForProp(thumbProp)
        return thumbCssVars[0]
      }
    }
    
    if (propName === 'thumb') {
      const trackProp = structure.props.find(p => 
        p.name.toLowerCase() === 'track-selected' && 
        p.category === 'colors' &&
        (!p.isVariantSpecific || (p.variantProp && selectedVariants[p.variantProp] && p.path.includes(selectedVariants[p.variantProp]))) &&
        (p.category !== 'colors' || !p.path.includes('layer-') || p.path.includes(selectedLayer))
      )
      if (trackProp) {
        const trackCssVars = getCssVarsForProp(trackProp)
        return trackCssVars[0]
      }
    }
    
    return undefined
  }

  const renderControl = (propToRender: ComponentProp, cssVars: string[], primaryVar: string, label: string) => {
    if (propToRender.type === 'color') {
      const contrastColorVar = getContrastColorVar(propToRender)
      let validPrimaryVar = (primaryVar && primaryVar.trim()) || (cssVars.length > 0 && cssVars[0]?.trim()) || propToRender.cssVar
      let validCssVars = cssVars.length > 0 ? cssVars.filter(v => v && v.trim()) : [propToRender.cssVar]
      
      // Special validation for breadcrumb read-only color
      if (componentName.toLowerCase() === 'breadcrumb' && label.toLowerCase().includes('read only')) {
        // Ensure we're using the read-only CSS variable, not the interactive one
        if (validPrimaryVar.includes('interactive') && !validPrimaryVar.includes('read-only')) {
          console.error('PropControlContent: ERROR - Read-only color is using interactive CSS var!', {
            validPrimaryVar,
            propCssVar: propToRender.cssVar,
            primaryVar,
            cssVars,
            path: propToRender.path
          })
          // Try to find the correct CSS variable from the structure
          const structure = parseComponentStructure(componentName)
          const correctProp = structure.props.find(p => 
            p.name.toLowerCase() === 'color' && 
            p.category === 'colors' &&
            !p.isVariantSpecific &&
            p.path.includes('colors') &&
            p.path.includes('read-only') &&
            !p.path.includes('interactive') &&
            p.path.includes(selectedLayer) &&
            p.cssVar.includes('read-only') &&
            !p.cssVar.includes('interactive')
          )
          if (correctProp) {
            validPrimaryVar = correctProp.cssVar
            validCssVars = [correctProp.cssVar]
            console.log('PropControlContent: Corrected read-only color CSS var to:', validPrimaryVar)
          }
        }
      }
      
      if (!validPrimaryVar || !validPrimaryVar.trim()) {
        console.warn('PropControlContent: No valid CSS var for prop', propToRender.name)
        return null
      }
      
      return (
        <PaletteColorControl
          targetCssVar={validPrimaryVar}
          targetCssVars={validCssVars.length > 1 ? validCssVars : undefined}
          currentValueCssVar={validPrimaryVar}
          label={label}
          contrastColorCssVar={contrastColorVar}
        />
      )
    }

    if (propToRender.type === 'typography') {
      // For Avatar text-size, use numeric slider (0-64px) instead of typography tokens
      const propNameLower = propToRender.name.toLowerCase()
      const isAvatarTextSize = componentName.toLowerCase() === 'avatar' && propNameLower === 'text-size'
      
      if (isAvatarTextSize) {
        // Use Slider component directly for pixel values
        const AvatarTextSizeSlider = () => {
          const [value, setValue] = useState(() => {
            const currentValue = readCssVar(primaryVar)
            const resolvedValue = readCssVarResolved(primaryVar)
            const valueStr = resolvedValue || currentValue || '0px'
            const match = valueStr.match(/^(-?\d+(?:\.\d+)?)px$/i)
            return match ? Math.max(0, Math.min(64, parseFloat(match[1]))) : 0
          })
          
          useEffect(() => {
            const handleUpdate = () => {
              const currentValue = readCssVar(primaryVar)
              const resolvedValue = readCssVarResolved(primaryVar)
              const valueStr = resolvedValue || currentValue || '0px'
              const match = valueStr.match(/^(-?\d+(?:\.\d+)?)px$/i)
              if (match) {
                setValue(Math.max(0, Math.min(64, parseFloat(match[1]))))
              }
            }
            window.addEventListener('cssVarsUpdated', handleUpdate)
            return () => window.removeEventListener('cssVarsUpdated', handleUpdate)
          }, [primaryVar])
          
          const handleChange = (newValue: number | [number, number]) => {
            const numValue = typeof newValue === 'number' ? newValue : newValue[0]
            const clampedValue = Math.max(0, Math.min(64, numValue))
            setValue(clampedValue)
            
            const cssVarsToUpdate = cssVars.length > 0 ? cssVars : [primaryVar]
            cssVarsToUpdate.forEach(cssVar => {
              updateCssVar(cssVar, `${clampedValue}px`)
            })
            
            window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
              detail: { cssVars: cssVarsToUpdate }
            }))
          }
          
          return (
            <div className="control-group">
              <Slider
                value={value}
                onChange={handleChange}
                min={0}
                max={64}
                step={1}
                layer="layer-1"
                layout="stacked"
                showInput={false}
                showValueLabel={true}
                valueLabel={(val) => `${val}px`}
                minLabel="0"
                maxLabel="64"
                label={<Label layer="layer-1" layout="stacked">{label}</Label>}
              />
            </div>
          )
        }
        
        return <AvatarTextSizeSlider key={`${primaryVar}-${selectedVariants.layout || ''}-${selectedVariants.size || ''}`} />
      }
      
      return (
        <TypographySliderInline
          targetCssVar={primaryVar}
          targetCssVars={cssVars.length > 0 ? cssVars : undefined}
          label={label}
          layer="layer-1"
        />
      )
    }

    if (propToRender.type === 'dimension') {
      const propNameLower = propToRender.name.toLowerCase()
      
      // Use typography slider for text-size and font-size properties that reference typography tokens
      // BUT: For Avatar text-size, use numeric slider (0-64px) instead of typography tokens
      const isAvatarTextSize = componentName.toLowerCase() === 'avatar' && propNameLower === 'text-size'
      const isTypographySizeProp = (propNameLower === 'text-size' || propNameLower === 'font-size') && !isAvatarTextSize
      
      if (isTypographySizeProp) {
        return (
          <TypographySliderInline
            key={`${primaryVar}-${selectedVariants.layout || ''}-${selectedVariants.size || ''}`}
            targetCssVar={primaryVar}
            targetCssVars={cssVars.length > 0 ? cssVars : undefined}
            label={label}
            layer="layer-1"
          />
        )
      }
      
      // For Avatar text-size, use Slider component directly for pixel values (0-64px)
      if (isAvatarTextSize) {
        const AvatarTextSizeSlider = () => {
          const [value, setValue] = useState(() => {
            const currentValue = readCssVar(primaryVar)
            const resolvedValue = readCssVarResolved(primaryVar)
            const valueStr = resolvedValue || currentValue || '0px'
            const match = valueStr.match(/^(-?\d+(?:\.\d+)?)px$/i)
            return match ? Math.max(0, Math.min(64, parseFloat(match[1]))) : 0
          })
          
          useEffect(() => {
            const handleUpdate = () => {
              const currentValue = readCssVar(primaryVar)
              const resolvedValue = readCssVarResolved(primaryVar)
              const valueStr = resolvedValue || currentValue || '0px'
              const match = valueStr.match(/^(-?\d+(?:\.\d+)?)px$/i)
              if (match) {
                setValue(Math.max(0, Math.min(64, parseFloat(match[1]))))
              }
            }
            window.addEventListener('cssVarsUpdated', handleUpdate)
            return () => window.removeEventListener('cssVarsUpdated', handleUpdate)
          }, [primaryVar])
          
          const handleChange = (newValue: number | [number, number]) => {
            const numValue = typeof newValue === 'number' ? newValue : newValue[0]
            const clampedValue = Math.max(0, Math.min(64, numValue))
            setValue(clampedValue)
            
            const cssVarsToUpdate = cssVars.length > 0 ? cssVars : [primaryVar]
            cssVarsToUpdate.forEach(cssVar => {
              updateCssVar(cssVar, `${clampedValue}px`)
            })
            
            window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
              detail: { cssVars: cssVarsToUpdate }
            }))
          }
          
          return (
            <div className="control-group">
              <Slider
                value={value}
                onChange={handleChange}
                min={0}
                max={64}
                step={1}
                layer="layer-1"
                layout="stacked"
                showInput={false}
                showValueLabel={true}
                valueLabel={(val) => `${val}px`}
                minLabel="0"
                maxLabel="64"
                label={<Label layer="layer-1" layout="stacked">{label}</Label>}
              />
            </div>
          )
        }
        
        return <AvatarTextSizeSlider key={`${primaryVar}-${selectedVariants.layout || ''}-${selectedVariants.size || ''}`} />
      }
      
      // Use brand dimension slider for padding-related properties that use general tokens
      const isPaddingProp = propNameLower === 'padding' ||
                           propNameLower === 'vertical-padding' ||
                           propNameLower === 'horizontal-padding' ||
                           propNameLower === 'padding-vertical' ||
                           propNameLower === 'padding-horizontal' ||
                           propNameLower === 'bottom-padding' ||
                           propNameLower === 'item-gap' ||
                           propNameLower === 'icon-label-gap' ||
                           propNameLower === 'divider-item-gap' ||
                           propNameLower === 'track-inner-padding'
      
      if (isPaddingProp) {
        return (
          <BrandDimensionSliderInline
            key={`${primaryVar}-${selectedVariants.layout || ''}-${selectedVariants.size || ''}`}
            targetCssVar={primaryVar}
            targetCssVars={cssVars.length > 0 ? cssVars : undefined}
            label={label}
            dimensionCategory="general"
            layer="layer-1"
          />
        )
      }
      
      // Use brand dimension slider for border-radius properties
      const isBorderRadiusProp = propNameLower === 'border-radius' ||
                                 propNameLower === 'thumb-border-radius' ||
                                 propNameLower === 'track-border-radius' ||
                                 propNameLower === 'corner-radius'
      
      if (isBorderRadiusProp) {
        return (
          <BrandDimensionSliderInline
            key={`${primaryVar}-${selectedVariants.layout || ''}-${selectedVariants.size || ''}`}
            targetCssVar={primaryVar}
            targetCssVars={cssVars.length > 0 ? cssVars : undefined}
            label={label}
            dimensionCategory="border-radii"
            layer="layer-1"
          />
        )
      }
      
      // Use pixel slider for label-width (raw pixel values, not tokens)
      // Toolbar sliders ALWAYS use stacked layout
      // When Label is side-by-side, only update CSS var on drag end
      if (propNameLower === 'label-width' && componentName.toLowerCase() === 'label') {
        const LabelWidthSlider = () => {
          const minValue = 0
          const maxValue = 500
          const isLabelSideBySide = selectedVariants.layout === 'side-by-side'
          const [value, setValue] = useState(() => {
            const currentValue = readCssVar(primaryVar)
            const resolvedValue = readCssVarResolved(primaryVar)
            const valueStr = resolvedValue || currentValue || '0px'
            const match = valueStr.match(/^(-?\d+(?:\.\d+)?)px$/i)
            return match ? Math.max(minValue, Math.min(maxValue, parseFloat(match[1]))) : 0
          })
          
          useEffect(() => {
            const handleUpdate = () => {
              const currentValue = readCssVar(primaryVar)
              const resolvedValue = readCssVarResolved(primaryVar)
              const valueStr = resolvedValue || currentValue || '0px'
              const match = valueStr.match(/^(-?\d+(?:\.\d+)?)px$/i)
              if (match) {
                setValue(Math.max(minValue, Math.min(maxValue, parseFloat(match[1]))))
              }
            }
            window.addEventListener('cssVarsUpdated', handleUpdate)
            return () => window.removeEventListener('cssVarsUpdated', handleUpdate)
          }, [primaryVar])
          
          const updateCssVars = useCallback((clampedValue: number) => {
            const cssVarsToUpdate = cssVars.length > 0 ? cssVars : [primaryVar]
            cssVarsToUpdate.forEach(cssVar => {
              updateCssVar(cssVar, `${clampedValue}px`)
            })
            
            window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
              detail: { cssVars: cssVarsToUpdate }
            }))
          }, [cssVars, primaryVar])
          
          const handleChange = (newValue: number | [number, number]) => {
            const numValue = typeof newValue === 'number' ? newValue : newValue[0]
            const clampedValue = Math.max(minValue, Math.min(maxValue, numValue))
            setValue(clampedValue)
            
            // Only update CSS vars immediately if Label is in stacked mode
            if (!isLabelSideBySide) {
              updateCssVars(clampedValue)
            }
          }
          
          const handleChangeCommitted = (newValue: number | [number, number]) => {
            const numValue = typeof newValue === 'number' ? newValue : newValue[0]
            const clampedValue = Math.max(minValue, Math.min(maxValue, numValue))
            
            // Always update CSS vars on drag end, especially for side-by-side mode
            updateCssVars(clampedValue)
          }
          
          const getValueLabel = useCallback((val: number) => {
            return `${Math.round(val)}px`
          }, [])
          
          return (
            <Slider
              value={value}
              onChange={handleChange}
              onChangeCommitted={handleChangeCommitted}
              min={minValue}
              max={maxValue}
              step={1}
              layer="layer-1"
              layout="stacked"
              showInput={false}
              showValueLabel={true}
              valueLabel={getValueLabel}
              minLabel="0px"
              maxLabel="500px"
              label={<Label layer="layer-1" layout="stacked">{label}</Label>}
            />
          )
        }
        
        return (
          <LabelWidthSlider
            key={`${primaryVar}-${selectedVariants.layout || ''}-${selectedVariants.size || ''}`}
          />
        )
      }
      
      // Use brand dimension slider for size-related properties that use general dimension tokens
      const isSizeProp = propNameLower === 'size' ||
                         propNameLower === 'border-size' ||
                         propNameLower === 'width' ||
                         propNameLower === 'height' ||
                         (propNameLower.includes('size') && !propNameLower.includes('font-size') && !propNameLower.includes('text-size'))
      
      // Check if this is an icon-related size (for Avatar, Button icons, etc.)
      const isIconSize = (componentName.toLowerCase() === 'avatar' && propNameLower === 'size') ||
                         (componentName.toLowerCase() === 'button' && propNameLower.includes('icon'))
      
      if (isSizeProp) {
        const dimensionCategory: 'icons' | 'general' = isIconSize ? 'icons' : 'general'
        return (
          <BrandDimensionSliderInline
            key={`${primaryVar}-${selectedVariants.layout || ''}-${selectedVariants.size || ''}`}
            targetCssVar={primaryVar}
            targetCssVars={cssVars.length > 0 ? cssVars : undefined}
            label={label}
            dimensionCategory={dimensionCategory}
            layer="layer-1"
          />
        )
      }
      
      const additionalCssVars = propToRender.name === 'font-size' && componentName.toLowerCase() === 'button'
        ? ['--recursica-brand-typography-button-font-size']
        : []
      
      let minPixelValue: number | undefined = undefined
      if (propToRender.name.toLowerCase() === 'height' && componentName.toLowerCase() === 'badge') {
        const sizeVariant = selectedVariants.size || 'small'
        try {
          const uikitRoot: any = (themeJson as any)?.['ui-kit'] || (themeJson as any)
          const badgeComponent = uikitRoot?.components?.badge
          if (badgeComponent?.size?.variant?.[sizeVariant]?.['min-height']) {
            const minHeightDef = badgeComponent.size.variant[sizeVariant]['min-height']
            if (minHeightDef?.$type === 'dimension' && minHeightDef?.$value) {
              const value = minHeightDef.$value
              if (typeof value === 'number') {
                minPixelValue = value
              } else if (value && typeof value === 'object' && 'value' in value) {
                minPixelValue = typeof value.value === 'number' ? value.value : parseFloat(value.value)
              }
            }
          }
        } catch (error) {
          console.warn('Failed to read min-height from UIKit.json:', error)
        }
        if (minPixelValue === undefined) {
          const defaultValues: Record<string, number> = {
            small: 16,
            large: 24,
          }
          minPixelValue = defaultValues[sizeVariant] || 16
        }
      }
      
      const isLabelWidth = propToRender.name.toLowerCase() === 'label-width'
      const isMenuItem = componentName.toLowerCase().replace(/\s+/g, '-') === 'menu-item' || 
                         componentName.toLowerCase().replace(/\s+/g, '') === 'menuitem' ||
                         componentName === 'MenuItem' ||
                         componentName === 'Menu item'
      const isMenu = componentName.toLowerCase() === 'menu'
      
      let maxPixelValue: number | undefined = undefined
      
      // Set custom limits for menu-item and menu width properties
      if ((isMenuItem || isMenu) && propNameLower === 'min-width') {
        minPixelValue = 50
        maxPixelValue = 500
      } else if ((isMenuItem || isMenu) && propNameLower === 'max-width') {
        minPixelValue = 200
        maxPixelValue = 1000
      } else if (isLabelWidth) {
        // Default maxPixelValue for label-width
        maxPixelValue = 500
      }
      
      return (
        <DimensionTokenSelector
          key={`${primaryVar}-${selectedVariants.layout || ''}-${selectedVariants.size || ''}`}
          targetCssVar={primaryVar}
          targetCssVars={[...cssVars, ...additionalCssVars]}
          label={label}
          propName={propToRender.name}
          minPixelValue={minPixelValue}
          maxPixelValue={maxPixelValue}
        />
      )
    }

    if (propToRender.type === 'elevation') {
      return (
        <ElevationSliderInline
          primaryVar={primaryVar}
          label={label}
          elevationOptions={elevationOptions}
          mode={mode}
          layer="layer-1"
        />
      )
    }

    // For number type properties (like opacity), use OpacitySelector
    if (propToRender.type === 'number') {
      const isOpacityProp = propToRender.name.toLowerCase().includes('opacity')
      
      if (isOpacityProp) {
        return <OpacitySelector targetCssVar={primaryVar} label={label} />
      }
      
      // For other number properties, show resolved value if available
      const resolvedValue = readCssVarResolved(primaryVar)
      const rawValue = readCssVar(primaryVar) || ''
      return (
        <div className="prop-control-content">
          <label className="prop-control-label">{label}</label>
          <div className="prop-control-readonly">
            {resolvedValue || rawValue || 'Not set'}
          </div>
        </div>
      )
    }

    const currentValue = readCssVar(primaryVar) || ''
    return (
      <div className="prop-control-content">
        <label className="prop-control-label">{label}</label>
        <div className="prop-control-readonly">
          {currentValue || 'Not set'}
        </div>
      </div>
    )
  }

  const baseLabel = (componentName.toLowerCase() === 'toast' && 
                     (prop.name.toLowerCase() === 'background' || prop.name.toLowerCase() === 'text'))
    ? 'Color'
    : (componentName.toLowerCase() === 'toast' && prop.name.toLowerCase() === 'icon')
    ? 'Size'
    : toSentenceCase(prop.name)
  
  // Handle grouped props
  const groupedPropsConfig = getGroupedProps(componentName, prop.name)
  
  if (groupedPropsConfig && prop.borderProps && prop.borderProps.size > 0) {
    const groupedPropEntries = Object.entries(groupedPropsConfig)
    
    
    return (
      <>
        {groupedPropEntries.map(([groupedPropName, groupedPropConfig], index) => {
          if (groupedPropConfig.visible === false) {
            return null
          }
          
          const groupedPropKey = groupedPropName.toLowerCase()
          let groupedProp = prop.borderProps!.get(groupedPropKey)
          
          // Special case: interactive-color maps to "color" prop under colors.layer-X.interactive
          // For breadcrumb, ALWAYS re-find to ensure we have the correct prop
          if (groupedPropKey === 'interactive-color' && componentName.toLowerCase() === 'breadcrumb') {
            // Always re-find the prop - ignore what's in the map
            const structure = parseComponentStructure(componentName)
            const interactiveColorProp = structure.props.find(p => {
              const matches = p.name.toLowerCase() === 'color' && 
                p.category === 'colors' &&
                !p.isVariantSpecific &&
                p.path.includes('colors') &&
                p.path.includes('interactive') &&
                !p.path.includes('read-only') && // Explicitly exclude read-only
                p.path.includes(selectedLayer)
              // Validate the CSS variable name matches interactive (not read-only)
              if (matches) {
                if (!p.cssVar.includes('interactive') || p.cssVar.includes('read-only')) {
                  return false
                }
              }
              return matches
            })
            if (interactiveColorProp) {
              groupedProp = interactiveColorProp
              // Always update the borderProps map with the correct prop
              prop.borderProps!.set('interactive-color', interactiveColorProp)
            }
          }
          // Special case: read-only-color maps to "color" prop under colors.layer-X.read-only
          // For breadcrumb, ALWAYS re-find to ensure we have the correct prop
          if (groupedPropKey === 'read-only-color' && componentName.toLowerCase() === 'breadcrumb') {
            // Always re-find the prop - ignore what's in the map
            const structure = parseComponentStructure(componentName)
            const readOnlyColorProp = structure.props.find(p => {
              const matches = p.name.toLowerCase() === 'read-only' && 
                p.category === 'colors' &&
                !p.isVariantSpecific &&
                p.path.includes('colors') &&
                p.path.includes('read-only') &&
                !p.path.includes('interactive') && // Explicitly exclude interactive
                p.path.includes(selectedLayer)
              // Validate the CSS variable name matches read-only (not interactive)
              if (matches) {
                if (!p.cssVar.includes('read-only') || p.cssVar.includes('interactive')) {
                  return false
                }
              }
              return matches
            })
            if (readOnlyColorProp) {
              groupedProp = readOnlyColorProp
              // Always update the borderProps map with the correct prop
              prop.borderProps!.set('read-only-color', readOnlyColorProp)
            }
          }
          
          if (!groupedProp && groupedPropKey === 'border-color') {
            groupedProp = prop.borderProps!.get('border')
          }
          if (!groupedProp && groupedPropKey === 'text-color') {
            groupedProp = prop.borderProps!.get('text')
          }
          if (!groupedProp && (groupedPropKey.includes('-min-height') || groupedPropKey.includes('-height'))) {
            groupedProp = prop.borderProps!.get(groupedPropKey)
          }
          if (!groupedProp && (prop.name.toLowerCase() === 'spacing' || prop.name.toLowerCase() === 'layout')) {
            const structure = parseComponentStructure(componentName)
            const layoutVariant = selectedVariants['layout']
            if (layoutVariant) {
              const matchingProp = structure.props.find(p => 
                p.name.toLowerCase() === groupedPropKey &&
                p.isVariantSpecific &&
                p.variantProp === 'layout' &&
                p.path.includes(layoutVariant)
              )
              if (matchingProp) {
                groupedProp = matchingProp
                prop.borderProps!.set(groupedPropKey, matchingProp)
              }
            }
          }
          
          if (prop.name.toLowerCase() === 'spacing' && groupedProp) {
            const layoutVariant = selectedVariants['layout']
            if (layoutVariant) {
              const propBelongsToLayout = groupedProp.path.includes(layoutVariant)
              if (!propBelongsToLayout) {
                return null
              }
            }
          }
          
          if (!groupedProp) {
            return null
          }
          
          // For breadcrumb interactive/read-only colors, ALWAYS re-validate the prop
          // to ensure we have the correct CSS variable
          if (componentName.toLowerCase() === 'breadcrumb' && 
              (groupedPropKey === 'interactive-color' || groupedPropKey === 'read-only-color')) {
            // Always re-find the prop from structure - don't trust anything in the map
            const structure = parseComponentStructure(componentName)
            let correctProp: ComponentProp | undefined = undefined
            
            if (groupedPropKey === 'read-only-color') {
              // Find the read-only prop - must have read-only in path, NOT interactive
              // AND the CSS variable must contain 'read-only' and NOT 'interactive'
              const allMatchingProps = structure.props.filter(p => {
                const pathMatches = p.name.toLowerCase() === 'read-only' && 
                  p.category === 'colors' &&
                  !p.isVariantSpecific &&
                  p.path.includes('colors') &&
                  p.path.includes('read-only') &&
                  !p.path.includes('interactive') &&
                  p.path.includes(selectedLayer)
                return pathMatches
              })
              
              // Find the one with the correct CSS variable
              correctProp = allMatchingProps.find(p => 
                p.cssVar.includes('read-only') && 
                !p.cssVar.includes('interactive')
              ) || allMatchingProps[0]
            } else if (groupedPropKey === 'interactive-color') {
              // Find the interactive prop - must have interactive in path, NOT read-only
              // AND the CSS variable must contain 'interactive' and NOT 'read-only'
              const allMatchingProps = structure.props.filter(p => {
                const pathMatches = p.name.toLowerCase() === 'interactive' && 
                  p.category === 'colors' &&
                  !p.isVariantSpecific &&
                  p.path.includes('colors') &&
                  p.path.includes('interactive') &&
                  !p.path.includes('read-only') &&
                  p.path.includes(selectedLayer)
                return pathMatches
              })
              
              // Find the one with the correct CSS variable
              correctProp = allMatchingProps.find(p => 
                p.cssVar.includes('interactive') && 
                !p.cssVar.includes('read-only')
              ) || allMatchingProps[0]
            }
            
            // Always use the correct prop if found
            if (correctProp) {
              groupedProp = correctProp
              // Update the map with the correct prop
              prop.borderProps!.set(groupedPropKey, correctProp)
              const correctCssVars = getCssVarsForProp(correctProp)
              const correctPrimaryVar = correctCssVars[0] || correctProp.cssVar
              
              const label = groupedPropConfig.label || toSentenceCase(groupedPropName)
              return (
                <div 
                  key={groupedPropName}
                  style={{ marginTop: index > 0 ? 'var(--recursica-brand-dimensions-general-md)' : 0 }}
                >
                  {renderControl(correctProp, correctCssVars, correctPrimaryVar, label)}
                </div>
              )
            }
          }
          
          // Special handling for MenuItem background grouped prop: update all three background CSS variables
          const isMenuItem = componentName.toLowerCase().replace(/\s+/g, '-') === 'menu-item' || 
                             componentName.toLowerCase().replace(/\s+/g, '') === 'menuitem' ||
                             componentName === 'MenuItem' ||
                             componentName === 'Menu item'
          
          let cssVars = getCssVarsForProp(groupedProp)
          let primaryVar = cssVars[0] || groupedProp.cssVar
          
          if (groupedPropKey === 'background' && isMenuItem) {
            const defaultBgVar = buildComponentCssVarPath('MenuItem', 'variants', 'styles', 'default', 'properties', 'colors', selectedLayer, 'background')
            const selectedBgVar = buildComponentCssVarPath('MenuItem', 'properties', 'colors', selectedLayer, 'selected-background')
            const disabledBgVar = buildComponentCssVarPath('MenuItem', 'variants', 'styles', 'disabled', 'properties', 'colors', selectedLayer, 'background')
            
            primaryVar = defaultBgVar
            cssVars = [defaultBgVar, selectedBgVar, disabledBgVar]
          }
          
          // Special handling for MenuItem text grouped prop: update all variant text colors
          if (groupedPropKey === 'text' && isMenuItem) {
            const defaultTextVar = buildComponentCssVarPath('MenuItem', 'variants', 'styles', 'default', 'properties', 'colors', selectedLayer, 'text')
            const selectedTextVar = buildComponentCssVarPath('MenuItem', 'variants', 'styles', 'selected', 'properties', 'colors', selectedLayer, 'text')
            const disabledTextVar = buildComponentCssVarPath('MenuItem', 'variants', 'styles', 'disabled', 'properties', 'colors', selectedLayer, 'text')
            
            primaryVar = defaultTextVar
            cssVars = [defaultTextVar, selectedTextVar, disabledTextVar]
          }
          
          // For breadcrumb interactive/read-only colors, ALWAYS re-validate the prop
          // to ensure we have the correct CSS variable
          if (componentName.toLowerCase() === 'breadcrumb' && 
              (groupedPropKey === 'interactive-color' || groupedPropKey === 'read-only-color')) {
            // Always re-find the prop from structure - don't trust anything in the map
            const structure = parseComponentStructure(componentName)
            let correctProp: ComponentProp | undefined = undefined
            
            if (groupedPropKey === 'read-only-color') {
              // Find the read-only prop - must have read-only in path, NOT interactive
              // AND the CSS variable must contain 'read-only' and NOT 'interactive'
              const allMatchingProps = structure.props.filter(p => {
                const pathMatches = p.name.toLowerCase() === 'read-only' && 
                  p.category === 'colors' &&
                  !p.isVariantSpecific &&
                  p.path.includes('colors') &&
                  p.path.includes('read-only') &&
                  !p.path.includes('interactive') &&
                  p.path.includes(selectedLayer)
                return pathMatches
              })
              
              // Find the one with the correct CSS variable
              correctProp = allMatchingProps.find(p => 
                p.cssVar.includes('read-only') && 
                !p.cssVar.includes('interactive')
              ) || allMatchingProps[0]
            } else if (groupedPropKey === 'interactive-color') {
              // Find the interactive prop - must have interactive in path, NOT read-only
              // AND the CSS variable must contain 'interactive' and NOT 'read-only'
              const allMatchingProps = structure.props.filter(p => {
                const pathMatches = p.name.toLowerCase() === 'interactive' && 
                  p.category === 'colors' &&
                  !p.isVariantSpecific &&
                  p.path.includes('colors') &&
                  p.path.includes('interactive') &&
                  !p.path.includes('read-only') &&
                  p.path.includes(selectedLayer)
                return pathMatches
              })
              
              // Find the one with the correct CSS variable
              correctProp = allMatchingProps.find(p => 
                p.cssVar.includes('interactive') && 
                !p.cssVar.includes('read-only')
              ) || allMatchingProps[0]
            }
            
            // Always use the correct prop if found
            if (correctProp) {
              groupedProp = correctProp
              // Update the map with the correct prop
              prop.borderProps!.set(groupedPropKey, correctProp)
              const correctCssVars = getCssVarsForProp(correctProp)
              const correctPrimaryVar = correctCssVars[0] || correctProp.cssVar
              
              const label = groupedPropConfig.label || toSentenceCase(groupedPropName)
              return (
                <div 
                  key={groupedPropName}
                  style={{ marginTop: index > 0 ? 'var(--recursica-brand-dimensions-general-md)' : 0 }}
                >
                  {renderControl(correctProp, correctCssVars, correctPrimaryVar, label)}
                </div>
              )
            }
          }
          
          const label = groupedPropConfig.label || toSentenceCase(groupedPropName)
          
          return (
            <div 
              key={groupedPropName}
              style={{ marginTop: index > 0 ? 'var(--recursica-brand-dimensions-general-md)' : 0 }}
            >
              {renderControl(groupedProp, cssVars, primaryVar, label)}
            </div>
          )
        })}
      </>
    )
  }
  
  // Handle track prop
  if (prop.name.toLowerCase() === 'track' && (prop.trackSelectedProp || prop.trackUnselectedProp || prop.thumbProps)) {
    const trackSelectedCssVars = prop.trackSelectedProp ? getCssVarsForProp(prop.trackSelectedProp) : []
    const trackUnselectedCssVars = prop.trackUnselectedProp ? getCssVarsForProp(prop.trackUnselectedProp) : []
    const trackSelectedPrimaryVar = trackSelectedCssVars[0] || prop.trackSelectedProp?.cssVar
    const trackUnselectedPrimaryVar = trackUnselectedCssVars[0] || prop.trackUnselectedProp?.cssVar
    
    const trackWidthProp = prop.thumbProps?.get('track-width')
    const trackInnerPaddingProp = prop.thumbProps?.get('track-inner-padding')
    const trackBorderRadiusProp = prop.thumbProps?.get('track-border-radius')
    
    const structure = parseComponentStructure(componentName)
    const thumbProp = structure.props.find(p => 
      p.name.toLowerCase() === 'thumb' && 
      p.category === 'colors' &&
      (!p.isVariantSpecific || (p.variantProp && selectedVariants[p.variantProp] && p.path.includes(selectedVariants[p.variantProp]))) &&
      (p.category !== 'colors' || !p.path.includes('layer-') || p.path.includes(selectedLayer))
    )
    const thumbCssVars = thumbProp ? getCssVarsForProp(thumbProp) : []
    const thumbVar = thumbCssVars[0]
    
    return (
      <>
        {prop.trackSelectedProp && trackSelectedPrimaryVar && (
          <PaletteColorControl
            targetCssVar={trackSelectedPrimaryVar}
            targetCssVars={trackSelectedCssVars.length > 1 ? trackSelectedCssVars : undefined}
            currentValueCssVar={trackSelectedPrimaryVar}
            label="Track Selected"
            contrastColorCssVar={thumbVar}
          />
        )}
        {prop.trackUnselectedProp && trackUnselectedPrimaryVar && (
          <div style={{ marginTop: prop.trackSelectedProp ? 'var(--recursica-brand-dimensions-general-md)' : 0 }}>
            <PaletteColorControl
              targetCssVar={trackUnselectedPrimaryVar}
              targetCssVars={trackUnselectedCssVars.length > 1 ? trackUnselectedCssVars : undefined}
              currentValueCssVar={trackUnselectedPrimaryVar}
              label="Track Unselected"
              contrastColorCssVar={thumbVar}
            />
          </div>
        )}
        {trackWidthProp && (
          <div style={{ marginTop: prop.trackUnselectedProp ? 'var(--recursica-brand-dimensions-general-md)' : 0 }}>
            {(() => {
              const cssVars = getCssVarsForProp(trackWidthProp)
              const primaryVar = cssVars[0] || trackWidthProp.cssVar
              return (
                <DimensionTokenSelector
                  targetCssVar={primaryVar}
                  targetCssVars={cssVars.length > 1 ? cssVars : undefined}
                  label="Track Width"
                  propName={trackWidthProp.name}
                />
              )
            })()}
          </div>
        )}
        {trackInnerPaddingProp && (
          <div style={{ marginTop: trackWidthProp ? 'var(--recursica-brand-dimensions-general-md)' : 0 }}>
            {(() => {
              const cssVars = getCssVarsForProp(trackInnerPaddingProp)
              const primaryVar = cssVars[0] || trackInnerPaddingProp.cssVar
              return (
                <DimensionTokenSelector
                  targetCssVar={primaryVar}
                  targetCssVars={cssVars.length > 1 ? cssVars : undefined}
                  label="Track Inner Padding"
                  propName={trackInnerPaddingProp.name}
                />
              )
            })()}
          </div>
        )}
        {trackBorderRadiusProp && (
          <div style={{ marginTop: trackInnerPaddingProp ? 'var(--recursica-brand-dimensions-general-md)' : 0 }}>
            {(() => {
              const cssVars = getCssVarsForProp(trackBorderRadiusProp)
              const primaryVar = cssVars[0] || trackBorderRadiusProp.cssVar
              return (
                <DimensionTokenSelector
                  targetCssVar={primaryVar}
                  targetCssVars={cssVars.length > 1 ? cssVars : undefined}
                  label="Track Border Radius"
                  propName={trackBorderRadiusProp.name}
                />
              )
            })()}
          </div>
        )}
      </>
    )
  }
  
  // Handle thumb prop
  if (prop.name.toLowerCase() === 'thumb' && prop.thumbProps && prop.thumbProps.size > 0) {
    const thumbSelectedProp = prop.thumbProps.get('thumb-selected')
    const thumbUnselectedProp = prop.thumbProps.get('thumb-unselected')
    const thumbHeightProp = prop.thumbProps.get('thumb-height')
    const thumbWidthProp = prop.thumbProps.get('thumb-width')
    const thumbBorderRadiusProp = prop.thumbProps.get('thumb-border-radius')
    
    return (
      <>
        {thumbSelectedProp && (
          <>
            {(() => {
              const cssVars = getCssVarsForProp(thumbSelectedProp)
              const primaryVar = cssVars[0] || thumbSelectedProp.cssVar
              return (
                <PaletteColorControl
                  targetCssVar={primaryVar}
                  targetCssVars={cssVars.length > 1 ? cssVars : undefined}
                  currentValueCssVar={primaryVar}
                  label="Thumb Selected"
                />
              )
            })()}
          </>
        )}
        {thumbUnselectedProp && (
          <div style={{ marginTop: thumbSelectedProp ? 'var(--recursica-brand-dimensions-general-md)' : 0 }}>
            {(() => {
              const cssVars = getCssVarsForProp(thumbUnselectedProp)
              const primaryVar = cssVars[0] || thumbUnselectedProp.cssVar
              return (
                <PaletteColorControl
                  targetCssVar={primaryVar}
                  targetCssVars={cssVars.length > 1 ? cssVars : undefined}
                  currentValueCssVar={primaryVar}
                  label="Thumb Unselected"
                />
              )
            })()}
          </div>
        )}
        {thumbHeightProp && (
          <div style={{ marginTop: thumbUnselectedProp ? 'var(--recursica-brand-dimensions-general-md)' : 0 }}>
            {(() => {
              const cssVars = getCssVarsForProp(thumbHeightProp)
              const primaryVar = cssVars[0] || thumbHeightProp.cssVar
              return (
                <DimensionTokenSelector
                  targetCssVar={primaryVar}
                  targetCssVars={cssVars.length > 1 ? cssVars : undefined}
                  label="Thumb Height"
                  propName={thumbHeightProp.name}
                />
              )
            })()}
          </div>
        )}
        {thumbWidthProp && (
          <div style={{ marginTop: thumbHeightProp ? 'var(--recursica-brand-dimensions-general-md)' : 0 }}>
            {(() => {
              const cssVars = getCssVarsForProp(thumbWidthProp)
              const primaryVar = cssVars[0] || thumbWidthProp.cssVar
              return (
                <DimensionTokenSelector
                  targetCssVar={primaryVar}
                  targetCssVars={cssVars.length > 1 ? cssVars : undefined}
                  label="Thumb Width"
                  propName={thumbWidthProp.name}
                />
              )
            })()}
          </div>
        )}
        {thumbBorderRadiusProp && (
          <div style={{ marginTop: thumbWidthProp ? 'var(--recursica-brand-dimensions-general-md)' : 0 }}>
            {(() => {
              const cssVars = getCssVarsForProp(thumbBorderRadiusProp)
              const primaryVar = cssVars[0] || thumbBorderRadiusProp.cssVar
              return (
                <DimensionTokenSelector
                  targetCssVar={primaryVar}
                  targetCssVars={cssVars.length > 1 ? cssVars : undefined}
                  label="Thumb Border Radius"
                  propName={thumbBorderRadiusProp.name}
                />
              )
            })()}
          </div>
        )}
      </>
    )
  }
  
  return renderControl(prop, cssVarsForControl, primaryCssVar, baseLabel)
}

