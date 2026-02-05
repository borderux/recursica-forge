/**
 * Reusable Brand Border Radius Slider Component for Toolbars
 * 
 * This component provides a consistent slider interface for properties that use
 * brand border radius tokens. It includes a "none" option and is used for
 * border-radius properties across all component toolbars.
 */

import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { readCssVar, readCssVarResolved } from '../../../core/css/readCssVar'
import { updateCssVar } from '../../../core/css/updateCssVar'
import { useVars } from '../../vars/VarsContext'
import { useThemeMode } from '../../theme/ThemeModeContext'
import { Slider } from '../../../components/adapters/Slider'
import { Label } from '../../../components/adapters/Label'

interface BrandBorderRadiusSliderProps {
  targetCssVar: string
  targetCssVars?: string[]
  label: string
  layer?: 'layer-0' | 'layer-1' | 'layer-2' | 'layer-3'
}

export default function BrandBorderRadiusSlider({
  targetCssVar,
  targetCssVars = [],
  label,
  layer = 'layer-1',
}: BrandBorderRadiusSliderProps) {
  const { theme, tokens: tokensFromVars } = useVars()
  const { mode } = useThemeMode()
  
  // Build tokens list from border radius brand tokens
  const tokens = useMemo(() => {
    const options: Array<{ name: string; value: number; label: string }> = []
    
    try {
      const root: any = (theme as any)?.brand ? (theme as any).brand : theme
      const dimensions = root?.dimensions || {}
      const borderRadius = dimensions?.['border-radii'] || {}
      
      // Collect border radius dimensions
      Object.keys(borderRadius).forEach(radiusKey => {
        const radiusValue = borderRadius[radiusKey]
        if (radiusValue && typeof radiusValue === 'object' && '$value' in radiusValue) {
          const cssVar = `--recursica-brand-dimensions-border-radii-${radiusKey}`
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
            
            // Convert radius key to label (e.g., "default" -> "Default", "sm" -> "Sm", "2xl" -> "2Xl")
            const label = radiusKey === 'default' ? 'Default' :
                         radiusKey === 'sm' ? 'Sm' :
                         radiusKey === 'md' ? 'Md' :
                         radiusKey === 'lg' ? 'Lg' :
                         radiusKey === 'xl' ? 'Xl' :
                         radiusKey === '2xl' ? '2Xl' :
                         radiusKey === 'none' ? 'None' :
                         radiusKey.charAt(0).toUpperCase() + radiusKey.slice(1)
            
            options.push({
              name: cssVar,
              value: numericValue ?? 0,
              label,
            })
          }
        }
      })
      
      // Convert to Token format and sort by value (lowest to highest)
      // "none" (0px) will naturally sort first
      const borderRadiusTokens = options
        .map(opt => ({
          name: opt.name,
          value: opt.value,
          label: opt.label,
        }))
        .sort((a, b) => {
          if (a.value !== undefined && b.value !== undefined) {
            return a.value - b.value
          }
          if (a.value !== undefined) return -1
          if (b.value !== undefined) return 1
          return a.label.localeCompare(b.label)
        })
      
      return borderRadiusTokens
    } catch (error) {
      console.error('Error loading border radius tokens for BrandBorderRadiusSlider:', error)
      return []
    }
  }, [theme, mode])
  
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
      const noneIndex = tokens.findIndex(t => t.name.includes('border-radii-none') || (t.value === 0 && t.name.includes('border-radii')))
      setSelectedIndex(noneIndex >= 0 ? noneIndex : 0)
      return
    }
    
    // Check if it's a CSS var reference
    if (currentValue.trim().startsWith('var(--recursica-')) {
      // Try to find matching token by CSS var name
      const matchingIndex = tokens.findIndex(t => {
        // Extract radius name from CSS var (e.g., "--recursica-brand-dimensions-border-radii-sm" -> "sm")
        const radiusName = t.name.replace('--recursica-brand-dimensions-border-radii-', '')
        return currentValue.includes(`border-radii-${radiusName}`) || currentValue.includes(`dimensions-border-radii-${radiusName}`)
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
          if (pxValue === 0) {
            const noneIndex = tokens.findIndex(t => t.name.includes('border-radii-none'))
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
  const minToken = tokens[0]
  const maxToken = tokens[tokens.length > 0 ? tokens.length - 1 : 0]
  const minLabel = minToken ? minToken.label : '0'
  const maxLabel = maxToken ? maxToken.label : '0'
  
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
        tooltipText={displayLabel}
        minLabel={minLabel}
        maxLabel={maxLabel}
        showMinMaxLabels={false}
        label={label ? <Label layer={layer} layout="stacked">{label}</Label> : undefined}
      />
    </div>
  )
}

