import { useMemo, useState, useEffect, useCallback } from 'react'
import { readCssVar, readCssVarResolved } from '../../core/css/readCssVar'
import { updateCssVar } from '../../core/css/updateCssVar'
import { useVars } from '../vars/VarsContext'
import { toSentenceCase } from './componentToolbarUtils'
import TokenSlider from '../forms/TokenSlider'

interface DimensionTokenSelectorProps {
  targetCssVar: string
  targetCssVars?: string[]
  label: string
  propName: string // e.g., "border-radius", "font-size", "height"
}

export default function DimensionTokenSelector({
  targetCssVar,
  targetCssVars = [],
  label,
  propName,
}: DimensionTokenSelectorProps) {
  const { theme } = useVars()

  // Get available dimension tokens from theme JSON structure and convert to Token format
  const dimensionTokens = useMemo(() => {
    const options: Array<{ label: string; cssVar: string; value: string }> = []
    
    try {
      const root: any = (theme as any)?.brand ? (theme as any).brand : theme
      const dimensions = root?.dimensions || {}
      const propNameLower = propName.toLowerCase()
      
      // Helper to recursively collect dimension options
      const collectDimensions = (obj: any, prefix: string[] = []) => {
        if (!obj || typeof obj !== 'object') return
        
        Object.keys(obj).forEach(key => {
          if (key.startsWith('$')) return
          
          const currentPath = [...prefix, key]
          const value = obj[key]
          
          // If this is a dimension value object
          if (value && typeof value === 'object' && '$value' in value && '$type' in value) {
            const cssVar = `--recursica-brand-dimensions-${currentPath.join('-')}`
            const cssValue = readCssVar(cssVar)
            
            // Only add if the CSS var exists (has been generated)
            if (cssValue) {
              options.push({
                label: toSentenceCase(key),
                cssVar,
                value: `var(${cssVar})`,
              })
            }
          } else if (typeof value === 'object') {
            // Continue traversing
            collectDimensions(value, currentPath)
          }
        })
      }
      
      // First, check if this prop name matches a dimension category (e.g., "border-radius")
      if (dimensions[propNameLower] && typeof dimensions[propNameLower] === 'object') {
        collectDimensions(dimensions[propNameLower], [propNameLower])
      }
      
      // Also collect general dimensions (default, sm, md, lg, xl)
      const generalDims = ['default', 'sm', 'md', 'lg', 'xl']
      generalDims.forEach(dim => {
        if (dimensions[dim] && typeof dimensions[dim] === 'object' && '$value' in dimensions[dim]) {
          const cssVar = `--recursica-brand-dimensions-${dim}`
          const cssValue = readCssVar(cssVar)
          if (cssValue) {
            options.push({
              label: toSentenceCase(dim),
              cssVar,
              value: `var(${cssVar})`,
            })
          }
        }
      })
      
      // Also collect all nested dimensions (like icon.default, spacer.sm, etc.)
      collectDimensions(dimensions, [])
      
      // Filter out dimensions that don't make sense for this prop
      // Remove dimensions like "gutter.horizontal", "gutter.vertical" which are layout-specific
      // and not relevant for general spacing/sizing props
      const filteredOptions = options.filter(opt => {
        const cssVarName = opt.cssVar.replace('--recursica-brand-dimensions-', '')
        const cssVarParts = cssVarName.split('-')
        const firstPart = cssVarParts[0]
        
        // Always keep general dimensions (default, sm, md, lg, xl, xs)
        const generalDims = ['default', 'sm', 'md', 'lg', 'xl', 'xs']
        if (generalDims.includes(cssVarName) || generalDims.includes(firstPart)) {
          return true
        }
        
        // Keep if it matches the prop name category (e.g., "border-radius" for "border-radius" prop)
        if (propNameLower) {
          const propParts = propNameLower.split('-')
          // Check if any part of the CSS var matches any part of the prop name
          if (cssVarParts.some(part => propParts.includes(part) || propParts.some(pp => part.includes(pp)))) {
            return true
          }
        }
        
        // Keep common spacing/sizing categories (spacer.*, icon.*)
        const commonCategories = ['spacer', 'icon']
        if (commonCategories.includes(firstPart)) {
          return true
        }
        
        // Filter out layout-specific categories like "gutter" that aren't relevant for component props
        const layoutCategories = ['gutter']
        if (layoutCategories.includes(firstPart)) {
          return false
        }
        
        // Keep other dimensions by default (border-radius, etc.)
        return true
      })
      
      // Replace options with filtered list
      options.length = 0
      options.push(...filteredOptions)
      
    } catch (error) {
      console.error('Error loading dimension options:', error)
    }
    
    // Remove duplicates
    const uniqueOptions = Array.from(
      new Map(options.map(opt => [opt.cssVar, opt])).values()
    )
    
    // Convert to Token format with numeric values for sorting
    const tokens = uniqueOptions.map(opt => {
      // Resolve CSS var to get numeric value
      const resolvedValue = readCssVarResolved(opt.cssVar)
      let numericValue: number | undefined
      
      if (resolvedValue) {
        // Extract number from value like "16px" or "1.5rem"
        const match = resolvedValue.match(/^(-?\d+(?:\.\d+)?)/)
        if (match) {
          numericValue = parseFloat(match[1])
        }
      }
      
      return {
        name: opt.cssVar, // Use CSS var name as token name
        value: numericValue,
        label: opt.label,
      }
    })
    
    // Sort by numeric value if available, otherwise by label
    return tokens.sort((a, b) => {
      if (a.value !== undefined && b.value !== undefined) {
        return a.value - b.value
      }
      if (a.value !== undefined) return -1
      if (b.value !== undefined) return 1
      return (a.label || a.name).localeCompare(b.label || b.name)
    })
  }, [theme, propName])

  // Track slider position in local state - initialized from CSS var once, then controlled by user
  const [selectedToken, setSelectedToken] = useState<string | undefined>(undefined)
  const [pixelValue, setPixelValue] = useState<number>(0)
  const [isPixelMode, setIsPixelMode] = useState<boolean>(false)
  
  // Helper to check if a value is a theme CSS var reference
  const isThemeVar = (value: string): boolean => {
    return value.trim().startsWith('var(--recursica-')
  }
  
  // Helper to extract pixel value from CSS value
  const extractPixelValue = (value: string): number => {
    const match = value.match(/^(-?\d+(?:\.\d+)?)px$/i)
    if (match) {
      return parseFloat(match[1])
    }
    return 0
  }
  
  // Helper to read CSS var and set initial value
  const readInitialValue = useCallback(() => {
    // Read CSS var value - checks inline styles first, then computed styles (from JSON defaults)
    const currentValue = readCssVar(targetCssVar)
    if (!currentValue) {
      setSelectedToken(undefined)
      setPixelValue(0)
      setIsPixelMode(false)
      return
    }
    
    // Check if it's a theme var or raw pixel value
    if (isThemeVar(currentValue)) {
      // Theme var mode - find matching token
      setIsPixelMode(false)
      if (dimensionTokens.length === 0) return
      
      const matchingToken = dimensionTokens.find(token => {
        // Exact match
        if (currentValue === `var(${token.name})` || currentValue === token.name) return true
        // Check if current value contains the CSS var reference
        const varName = token.name.replace('--recursica-brand-dimensions-', '').replace('--recursica-tokens-size-', '')
        return currentValue.includes(varName) || currentValue.includes(token.name)
      })
      
      setSelectedToken(matchingToken?.name)
    } else {
      // Raw pixel mode
      setIsPixelMode(true)
      const pxValue = extractPixelValue(currentValue)
      setPixelValue(Math.max(0, Math.min(200, pxValue))) // Clamp to 0-200
    }
  }, [targetCssVar, dimensionTokens])
  
  // Read initial value when component mounts or targetCssVar changes
  useEffect(() => {
    readInitialValue()
  }, [readInitialValue])
  
  // Listen for reset events to re-read initial value
  useEffect(() => {
    const handleReset = () => {
      // Re-read CSS var after reset (will read from computed styles, which come from JSON)
      readInitialValue()
    }
    
    window.addEventListener('cssVarsReset', handleReset)
    return () => window.removeEventListener('cssVarsReset', handleReset)
  }, [readInitialValue])

  // One-way binding: slider changes → update local state AND CSS var
  const handleTokenChange = (tokenName: string) => {
    const token = dimensionTokens.find(t => t.name === tokenName)
    if (!token) return
    
    // Update local state so slider position updates immediately
    setSelectedToken(tokenName)
    
    // Update CSS vars directly - no global state management, just set CSS vars
    const cssVars = targetCssVars.length > 0 ? targetCssVars : [targetCssVar]
    cssVars.forEach(cssVar => {
      updateCssVar(cssVar, `var(${token.name})`)
    })
  }
  
  // Handle pixel slider changes
  const handlePixelChange = (value: number) => {
    // Update local state so slider position updates immediately
    setPixelValue(value)
    
    // Update CSS vars directly with pixel value
    const cssVars = targetCssVars.length > 0 ? targetCssVars : [targetCssVar]
    cssVars.forEach(cssVar => {
      updateCssVar(cssVar, `${value}px`)
    })
  }

  // Render pixel slider for raw pixel values
  if (isPixelMode) {
    return (
      <div className="control-group">
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, opacity: 0.7 }}>{label}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="range"
              min={0}
              max={200}
              step={1}
              value={pixelValue}
              onChange={(e) => handlePixelChange(Number(e.target.value))}
              style={{ flex: 1 }}
            />
            <input
              type="number"
              min={0}
              max={200}
              step={1}
              value={pixelValue}
              onChange={(e) => {
                const value = Number(e.target.value)
                if (!isNaN(value)) {
                  const clampedValue = Math.max(0, Math.min(200, value))
                  handlePixelChange(clampedValue)
                }
              }}
              onBlur={(e) => {
                // Ensure value is valid on blur
                const value = Number(e.target.value)
                if (isNaN(value) || value < 0) {
                  handlePixelChange(0)
                } else if (value > 200) {
                  handlePixelChange(200)
                }
              }}
              style={{
                width: 60,
                padding: '4px 8px',
                border: 'var(--recursica-brand-light-layer-layer-2-property-border-thickness) solid var(--recursica-brand-light-layer-layer-2-property-border-color)',
                borderRadius: 'var(--recursica-brand-light-layer-layer-2-property-border-radius)',
                background: 'var(--recursica-brand-light-layer-layer-2-property-surface)',
                color: 'var(--recursica-brand-light-layer-layer-2-property-element-text-color)',
                fontSize: 12,
                textAlign: 'right',
              }}
            />
            <span style={{ fontSize: 12, opacity: 0.7, minWidth: 20 }}>px</span>
          </div>
        </label>
      </div>
    )
  }

  // Render token slider for theme vars
  return (
    <TokenSlider
      label={label}
      tokens={dimensionTokens}
      currentToken={selectedToken}
      onChange={handleTokenChange}
      getTokenLabel={(token) => token.label || token.name.split('-').pop() || token.name}
    />
  )
}
