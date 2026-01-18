/**
 * Reusable Brand Dimension Slider Component for Toolbars and Panels
 * 
 * This component provides a consistent slider interface for properties that use
 * brand dimension tokens (general, border-radii, icons, gutters, text-size, etc.).
 * It sorts tokens by relative name rather than pixel value, and displays the value as a read-only label.
 */

import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { readCssVar, readCssVarResolved } from '../../../core/css/readCssVar'
import { updateCssVar } from '../../../core/css/updateCssVar'
import { useVars } from '../../vars/VarsContext'
import { useThemeMode } from '../../theme/ThemeModeContext'
import { Slider } from '../../../components/adapters/Slider'
import { Label } from '../../../components/adapters/Label'

export type DimensionCategory = 'border-radii' | 'icons' | 'gutters' | 'general' | 'text-size'

interface BrandDimensionSliderProps {
  targetCssVar: string
  targetCssVars?: string[]
  label: string
  dimensionCategory: DimensionCategory
  layer?: 'layer-0' | 'layer-1' | 'layer-2' | 'layer-3'
}

// Define sort orders for different dimension categories by relative name (not pixel value)
const DIMENSION_ORDERS: Record<DimensionCategory, string[]> = {
  'border-radii': ['none', 'sm', 'default', 'lg', 'xl', '2xl'],
  'icons': ['xs', 'sm', 'default', 'lg'],
  'gutters': ['horizontal', 'vertical'],
  'general': ['none', 'sm', 'md', 'default', 'lg', 'xl', '2xl'],
  'text-size': ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl'],
}

// Helper to get sort order for a dimension key
const getDimensionOrder = (key: string, category: DimensionCategory): number => {
  const order = DIMENSION_ORDERS[category] || []
  const index = order.indexOf(key)
  return index >= 0 ? index : 999 // Unknown keys go to the end
}

// Helper to format label from key
const formatDimensionLabel = (key: string): string => {
  // Handle special cases
  if (key === 'default') return 'Default'
  if (key === 'none') return 'None'
  if (key === '2xl') return '2Xl'
  if (key === 'horizontal') return 'Horizontal'
  if (key === 'vertical') return 'Vertical'
  
  // Handle size-based keys
  const sizeMap: Record<string, string> = {
    'xs': 'Xs',
    'sm': 'Sm',
    'md': 'Md',
    'lg': 'Lg',
    'xl': 'Xl',
  }
  if (sizeMap[key]) return sizeMap[key]
  
  // Default: capitalize first letter
  return key.charAt(0).toUpperCase() + key.slice(1)
}

export default function BrandDimensionSlider({
  targetCssVar,
  targetCssVars = [],
  label,
  dimensionCategory,
  layer = 'layer-1',
}: BrandDimensionSliderProps) {
  const { theme } = useVars()
  const { mode } = useThemeMode()
  
  // Build tokens list from brand dimension tokens, sorted by relative name
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
          // Generate CSS var name based on category
          // Note: CSS vars use the category name as-is (e.g., border-radii, spacers)
          const cssVar = `--recursica-brand-dimensions-${dimensionCategory}-${dimensionKey}`
          const cssValue = readCssVar(cssVar)
          
          // Only add if the CSS var exists (has been generated)
          if (cssValue) {
            // Resolve to get numeric value
            const resolvedValue = readCssVarResolved(cssVar)
            let numericValue: number | undefined
            
            if (resolvedValue) {
              const match = resolvedValue.match(/^(-?\d+(?:\.\d+)?)/)
              if (match) {
                numericValue = parseFloat(match[1])
              }
            }
            
            // Format label from key
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
      
      // Sort by pixel value (smallest to largest) to match brand dimensions order
      // "none" (0px) will naturally sort first
      const sortedTokens = options.sort((a, b) => {
        // Always put "none" first if it exists
        if (a.key === 'none') return -1
        if (b.key === 'none') return 1
        
        // Then sort by pixel value
        if (a.value !== undefined && b.value !== undefined) {
          return a.value - b.value
        }
        if (a.value !== undefined) return -1
        if (b.value !== undefined) return 1
        
        // Fall back to label comparison
        return a.label.localeCompare(b.label)
      })
      
      return sortedTokens
    } catch (error) {
      console.error(`Error loading ${dimensionCategory} tokens for BrandDimensionSlider:`, error)
      return []
    }
  }, [theme, mode, dimensionCategory])
  
  // Track selected token index
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  // Track if we just set a value to prevent immediate re-read
  const justSetValueRef = useRef<string | null>(null)
  
  // Helper to read CSS var and set initial value
  const readInitialValue = useCallback(() => {
    // Check inline style first (user overrides are always inline)
    const inlineValue = typeof document !== 'undefined' 
      ? document.documentElement.style.getPropertyValue(targetCssVar).trim()
      : ''
    
    // If we just set this value, don't re-read immediately
    if (justSetValueRef.current === inlineValue) {
      return
    }
    
    // Use inline value if available, otherwise fall back to readCssVar (which checks computed)
    const currentValue = inlineValue || readCssVar(targetCssVar)
    
    if (!currentValue || currentValue === 'null' || currentValue === '') {
      // Null/empty means "none" - find the "none" token if it exists
      const noneIndex = tokens.findIndex(t => t.key === 'none')
      setSelectedIndex(noneIndex >= 0 ? noneIndex : 0)
      return
    }
    
    // Check if it's a CSS var reference
    if (currentValue.trim().startsWith('var(--recursica-')) {
      // Try to find matching token by CSS var name
      const matchingIndex = tokens.findIndex(t => {
        // Extract dimension name from CSS var (e.g., "--recursica-brand-dimensions-general-sm" -> "sm")
        const dimensionName = t.name.replace(`--recursica-brand-dimensions-${dimensionCategory}-`, '')
        return currentValue.includes(`${dimensionCategory}-${dimensionName}`) || currentValue.includes(`dimensions-${dimensionCategory}-${dimensionName}`)
      })
      
      if (matchingIndex >= 0) {
        setSelectedIndex(matchingIndex)
        return
      }
      
      // Try to resolve and match by pixel value
      const resolved = readCssVarResolved(targetCssVar)
      if (resolved) {
        const match = resolved.match(/^(-?\d+(?:\.\d+)?)px/i)
        if (match) {
          const pxValue = parseFloat(match[1])
          // If resolved to 0px, check if it matches the "none" token (if category supports it)
          if (pxValue === 0 && (dimensionCategory === 'border-radii' || dimensionCategory === 'general')) {
            const noneIndex = tokens.findIndex(t => t.key === 'none')
            if (noneIndex >= 0) {
              setSelectedIndex(noneIndex)
              return
            }
          }
          
          // Find token with closest matching value
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
    
    // Default to first token (which should be "none") if no match
    setSelectedIndex(0)
  }, [targetCssVar, tokens])
  
  // Read initial value when component mounts or targetCssVar changes
  useEffect(() => {
    readInitialValue()
  }, [readInitialValue])
  
  // Listen for reset events and CSS var updates to re-read initial value
  useEffect(() => {
    const handleReset = () => {
      readInitialValue()
    }
    
    const handleCssVarUpdate = (event: CustomEvent) => {
      // Re-read if this CSS var was updated
      const cssVars = targetCssVars.length > 0 ? targetCssVars : [targetCssVar]
      if (event.detail?.cssVars?.some((cv: string) => cssVars.includes(cv))) {
        // Small delay to ensure CSS var has been updated
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
  
  // Handle slider change
  const handleSliderChange = (value: number | [number, number]) => {
    const numValue = typeof value === 'number' ? value : value[0]
    const clampedIndex = Math.max(0, Math.min(tokens.length - 1, Math.round(numValue)))
    setSelectedIndex(clampedIndex)
    
    const selectedToken = tokens[clampedIndex]
    if (selectedToken) {
      const cssVars = targetCssVars.length > 0 ? targetCssVars : [targetCssVar]
      const tokenValue = `var(${selectedToken.name})`
      
      // Set CSS var to token reference
      cssVars.forEach(cssVar => {
        updateCssVar(cssVar, tokenValue)
        // Track that we just set this value to prevent immediate re-read
        justSetValueRef.current = tokenValue
        // Clear the ref after a short delay to allow re-reads after recomputes
        setTimeout(() => {
          justSetValueRef.current = null
        }, 100)
      })
      
      // Dispatch event after a small delay to ensure DOM has updated
      requestAnimationFrame(() => {
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
          detail: { cssVars }
        }))
      })
    }
  }
  
  const currentToken = tokens[selectedIndex]
  const displayLabel = currentToken ? currentToken.label : ''
  const tokenName = currentToken ? currentToken.key : ''
  const minToken = tokens[0]
  const maxToken = tokens[tokens.length > 0 ? tokens.length - 1 : 0]
  const minLabel = minToken ? minToken.label : '0'
  const maxLabel = maxToken ? maxToken.label : '0'
  
  // Get tooltip text - show token name (key) in tooltip
  const tooltipText = tokenName || displayLabel
  
  return (
    <div className="control-group">
      <Slider
        value={selectedIndex}
        onChange={handleSliderChange}
        min={0}
        max={tokens.length > 0 ? tokens.length - 1 : 0}
        step={1}
        layer={layer}
        layout="stacked"
        showInput={false}
        showValueLabel={true}
        valueLabel={displayLabel}
        tooltipText={tooltipText}
        minLabel={minLabel}
        maxLabel={maxLabel}
        label={label ? <Label layer={layer} layout="side-by-side" size="small">{label}</Label> : undefined}
      />
    </div>
  )
}
