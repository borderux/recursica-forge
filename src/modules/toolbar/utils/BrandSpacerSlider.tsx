/**
 * Reusable Brand Spacer Slider Component for Toolbars
 * 
 * This component provides a consistent slider interface for properties that use
 * brand spacer tokens (xs, sm, md, lg, xl, default). It includes a "none" option
 * and is used for padding-related properties across all component toolbars.
 */

import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { readCssVar, readCssVarResolved } from '../../../core/css/readCssVar'
import { updateCssVar, removeCssVar } from '../../../core/css/updateCssVar'
import { useVars } from '../../vars/VarsContext'
import { useThemeMode } from '../../theme/ThemeModeContext'
import TokenSlider from '../../forms/TokenSlider'

interface BrandSpacerSliderProps {
  targetCssVar: string
  targetCssVars?: string[]
  label: string
}

export default function BrandSpacerSlider({
  targetCssVar,
  targetCssVars = [],
  label,
}: BrandSpacerSliderProps) {
  const { theme, tokens: tokensFromVars } = useVars()
  const { mode } = useThemeMode()
  
  // Build tokens list from spacer brand tokens
  const tokens = useMemo(() => {
    const options: Array<{ name: string; value: number; label: string }> = []
    
    try {
      const root: any = (theme as any)?.brand ? (theme as any).brand : theme
      const dimensions = root?.dimensions || {}
      const spacers = dimensions?.spacer || {}
      
      // Collect spacer dimensions (xs, sm, md, lg, xl, default)
      Object.keys(spacers).forEach(spacerKey => {
        const spacerValue = spacers[spacerKey]
        if (spacerValue && typeof spacerValue === 'object' && '$value' in spacerValue) {
          const cssVar = `--recursica-brand-dimensions-spacer-${spacerKey}`
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
            
            // Convert spacer key to label (e.g., "xs" -> "Xs", "sm" -> "Sm")
            const label = spacerKey === 'xs' ? 'Xs' :
                         spacerKey === 'sm' ? 'Sm' :
                         spacerKey === 'md' ? 'Md' :
                         spacerKey === 'lg' ? 'Lg' :
                         spacerKey === 'xl' ? 'Xl' :
                         spacerKey === 'default' ? 'Default' :
                         spacerKey.charAt(0).toUpperCase() + spacerKey.slice(1)
            
            options.push({
              name: cssVar,
              value: numericValue ?? 0,
              label,
            })
          }
        }
      })
      
      // Convert to Token format and sort by value
      const spacerTokens = options
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
      
      // Add "none" option at the beginning
      spacerTokens.unshift({
        name: 'none',
        value: -1, // Use -1 to ensure it sorts first
        label: 'None',
      })
      
      return spacerTokens
    } catch (error) {
      console.error('Error loading spacer tokens for BrandSpacerSlider:', error)
      // Return just "none" option if there's an error
      return [{
        name: 'none',
        value: -1,
        label: 'None',
      }]
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
        if (t.name === 'none') return false
        // Extract spacer name from CSS var (e.g., "--recursica-brand-dimensions-spacer-sm" -> "sm")
        const spacerName = t.name.replace('--recursica-brand-dimensions-spacer-', '')
        return currentValue.includes(`spacer-${spacerName}`) || currentValue.includes(`dimensions-spacer-${spacerName}`)
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
            .filter(t => t.name !== 'none' && t.value !== undefined)
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
    
    // Default to first token (which should be "none") if no match
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
    
    if (tokenName === 'none') {
      // Remove CSS var for "none"
      cssVars.forEach(cssVar => {
        removeCssVar(cssVar)
      })
    } else {
      // Set CSS var to token reference
      const token = tokens.find(t => t.name === tokenName)
      if (token) {
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

