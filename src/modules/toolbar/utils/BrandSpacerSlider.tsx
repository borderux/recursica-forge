/**
 * Reusable Brand Spacer Slider Component for Toolbars
 * 
 * This component provides a consistent slider interface for properties that use
 * brand spacer tokens (xs, sm, md, lg, xl, default). It includes a "none" option
 * and is used for padding-related properties across all component toolbars.
 */

import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react'
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
      
      // Convert to Token format and sort by value (lowest to highest)
      // "none" (0px) will naturally sort first
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
      
      return spacerTokens
    } catch (error) {
      console.error('Error loading spacer tokens for BrandSpacerSlider:', error)
      return []
    }
  }, [theme, mode])
  
  // Track selected token
  const [selectedToken, setSelectedToken] = useState<string | undefined>(undefined)
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
      // Null/empty means "none" - find the actual "none" token from Brand.json
      const noneToken = tokens.find(t => t.name.includes('spacer-none') || (t.value === 0 && t.name.includes('spacer')))
      setSelectedToken(noneToken?.name || tokens[0]?.name)
      return
    }
    
    // Check if it's a CSS var reference
    if (currentValue.trim().startsWith('var(--recursica-')) {
      // Try to find matching token by CSS var name
      const matchingToken = tokens.find(t => {
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
          // If resolved to 0px, check if it matches the "none" token
          if (pxValue === 0) {
            // First check if the current value is a reference to the "none" token
            const noneTokenByName = tokens.find(t => currentValue.includes(t.name))
            if (noneTokenByName && (noneTokenByName.value === 0 || noneTokenByName.name.includes('spacer-none'))) {
              setSelectedToken(noneTokenByName.name)
              return
            }
            // Otherwise, find the "none" token by name or value
            const noneToken = tokens.find(t => t.name.includes('spacer-none')) || 
                             tokens.find(t => t.value === 0 && t.name.includes('spacer'))
            if (noneToken) {
              setSelectedToken(noneToken.name)
              return
            }
          }
          
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
  
  // Handle token change
  const handleTokenChange = (tokenName: string) => {
    setSelectedToken(tokenName)
    
    const cssVars = targetCssVars.length > 0 ? targetCssVars : [targetCssVar]
    
    // Find the token (including "none" from Brand.json)
    const token = tokens.find(t => t.name === tokenName)
    if (token) {
      const tokenValue = `var(${token.name})`
      // Set CSS var to token reference (including "none" token)
      // This ensures we use the token reference instead of falling back to UIKit.json defaults
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
      // This prevents recomputeAndApplyAll from reading stale values
      requestAnimationFrame(() => {
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
          detail: { cssVars }
        }))
      })
    }
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

