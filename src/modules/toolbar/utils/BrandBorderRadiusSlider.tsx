/**
 * Reusable Brand Border Radius Slider Component for Toolbars
 * 
 * This component provides a consistent slider interface for properties that use
 * brand border radius tokens. It includes a "none" option and is used for
 * border-radius properties across all component toolbars.
 */

import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { readCssVar, readCssVarResolved } from '../../../core/css/readCssVar'
import { updateCssVar, removeCssVar } from '../../../core/css/updateCssVar'
import { useVars } from '../../vars/VarsContext'
import { useThemeMode } from '../../theme/ThemeModeContext'
import TokenSlider from '../../forms/TokenSlider'

interface BrandBorderRadiusSliderProps {
  targetCssVar: string
  targetCssVars?: string[]
  label: string
}

export default function BrandBorderRadiusSlider({
  targetCssVar,
  targetCssVars = [],
  label,
}: BrandBorderRadiusSliderProps) {
  const { theme, tokens: tokensFromVars } = useVars()
  const { mode } = useThemeMode()
  
  // Build tokens list from border radius brand tokens
  const tokens = useMemo(() => {
    const options: Array<{ name: string; value: number; label: string }> = []
    
    try {
      const root: any = (theme as any)?.brand ? (theme as any).brand : theme
      const dimensions = root?.dimensions || {}
      const borderRadius = dimensions?.['border-radius'] || {}
      
      // Collect border radius dimensions
      Object.keys(borderRadius).forEach(radiusKey => {
        const radiusValue = borderRadius[radiusKey]
        if (radiusValue && typeof radiusValue === 'object' && '$value' in radiusValue) {
          const cssVar = `--recursica-brand-dimensions-border-radius-${radiusKey}`
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
  
  // Track selected token
  const [selectedToken, setSelectedToken] = useState<string | undefined>(undefined)
  
  // Helper to read CSS var and set initial value
  const readInitialValue = useCallback(() => {
    const currentValue = readCssVar(targetCssVar)
    
    if (!currentValue || currentValue === 'null' || currentValue === '') {
      // Null/empty means "none"
      setSelectedToken('none')
      return
    }
    
    // Check if it's a CSS var reference
    if (currentValue.trim().startsWith('var(--recursica-')) {
      // Try to find matching token by CSS var name
      const matchingToken = tokens.find(t => {
        // Extract radius name from CSS var (e.g., "--recursica-brand-dimensions-border-radius-sm" -> "sm")
        const radiusName = t.name.replace('--recursica-brand-dimensions-border-radius-', '')
        return currentValue.includes(`border-radius-${radiusName}`) || currentValue.includes(`dimensions-border-radius-${radiusName}`)
      })
      
      if (matchingToken) {
        setSelectedToken(matchingToken.name)
        return
      }
      
      // Try to resolve and match by pixel value
      const resolved = readCssVarResolved(targetCssVar)
      if (resolved) {
        const match = resolved.match(/^(-?\d+(?:\.\d+)?)px/i)
        if (match) {
          const pxValue = parseFloat(match[1])
          // Find token with closest matching value
          const matchingToken = tokens
            .filter(t => t.value !== undefined)
            .reduce((closest, current) => {
              if (!closest) return current
              const currentDiff = Math.abs((current.value ?? 0) - pxValue)
              const closestDiff = Math.abs((closest.value ?? 0) - pxValue)
              return currentDiff < closestDiff ? current : closest
            }, undefined as typeof tokens[0] | undefined)
          
          if (matchingToken && Math.abs((matchingToken.value ?? 0) - pxValue) < 1) {
            setSelectedToken(matchingToken.name)
            return
          }
        }
      }
    }
    
    // Default to first token (which should be "none" at 0px) if no match
    setSelectedToken(tokens[0]?.name)
  }, [targetCssVar, tokens])
  
  // Read initial value when component mounts or targetCssVar changes
  useEffect(() => {
    readInitialValue()
  }, [readInitialValue])
  
  // Listen for reset events to re-read initial value
  useEffect(() => {
    const handleReset = () => {
      readInitialValue()
    }
    
    window.addEventListener('cssVarsReset', handleReset)
    return () => window.removeEventListener('cssVarsReset', handleReset)
  }, [readInitialValue])
  
  // Handle token change
  const handleTokenChange = (tokenName: string) => {
    setSelectedToken(tokenName)
    
    const cssVars = targetCssVars.length > 0 ? targetCssVars : [targetCssVar]
    
    // Find the token (including "none" from Brand.json)
    const token = tokens.find(t => t.name === tokenName)
    if (token) {
      // Check if this is the "none" token (value 0px)
      if (token.value === 0 || token.name.includes('border-radius-none')) {
        // Remove CSS var for "none" to use CSS fallback
        cssVars.forEach(cssVar => {
          removeCssVar(cssVar)
        })
      } else {
        // Set CSS var to token reference
        cssVars.forEach(cssVar => {
          updateCssVar(cssVar, `var(${token.name})`)
        })
      }
    }
    
    window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
      detail: { cssVars }
    }))
  }
  
  return (
    <TokenSlider
      label={label}
      tokens={tokens}
      currentToken={selectedToken}
      onChange={handleTokenChange}
      getTokenLabel={(token) => token.label || token.name.split('-').pop() || token.name}
    />
  )
}

