/**
 * Reusable Opacity Slider Component for Toolbars
 * 
 * This component provides a consistent slider interface for properties that use
 * opacity tokens. It uses opacity tokens as discrete stops and displays token labels.
 */

import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { readCssVar, readCssVarResolved } from '../../../core/css/readCssVar'
import { updateCssVar } from '../../../core/css/updateCssVar'
import { useVars } from '../../vars/VarsContext'
import { Slider } from '../../../components/adapters/Slider'
import { Label } from '../../../components/adapters/Label'

interface OpacitySliderProps {
  targetCssVar: string
  targetCssVars?: string[]
  label: string
  layer?: 'layer-0' | 'layer-1' | 'layer-2' | 'layer-3'
}

export default function OpacitySlider({
  targetCssVar,
  targetCssVars = [],
  label,
  layer = 'layer-1',
}: OpacitySliderProps) {
  const { tokens: tokensJson } = useVars()
  const justSetValueRef = useRef<string | null>(null)
  
  // Get available opacity tokens
  const opacityTokens = useMemo(() => {
    // Try opacities (plural) first, fallback to opacity (singular) for backwards compatibility
    const src = (tokensJson as any)?.tokens?.opacities || (tokensJson as any)?.tokens?.opacity || {}
    const list: Array<{ name: string; value: number; label: string; key: string }> = Object.keys(src).map((k) => {
      const raw = src[k]?.$value
      const v = (raw && typeof raw === 'object' && typeof raw.value !== 'undefined') ? raw.value : raw
      const num = typeof v === 'number' ? v : Number(v)
      return {
        key: k,
        name: `--recursica-tokens-opacities-${k}`,
        value: num <= 1 ? num : num / 100,
        label: k.charAt(0).toUpperCase() + k.slice(1).replace(/-/g, ' ')
      }
    })
    return list.sort((a, b) => a.value - b.value)
  }, [tokensJson])
  
  // Find current token index based on resolved value or token reference
  const [selectedIndex, setSelectedIndex] = useState(() => {
    const currentValue = readCssVar(targetCssVar)
    const resolvedValue = readCssVarResolved(targetCssVar)
    
    // Check if it's a token reference
    const tokenMatch = currentValue?.match(/var\(--recursica-tokens-opacities-([^)]+)\)/)
    if (tokenMatch) {
      const tokenKey = tokenMatch[1]
      const index = opacityTokens.findIndex(t => t.key === tokenKey)
      if (index >= 0) return index
    }
    
    // Otherwise, find closest token by value
    if (resolvedValue) {
      const numValue = parseFloat(resolvedValue)
      if (!isNaN(numValue)) {
        // Find closest token by value
        let closestIndex = 0
        let closestDiff = Math.abs(opacityTokens[0]?.value - numValue || 0)
        opacityTokens.forEach((token, idx) => {
          const diff = Math.abs(token.value - numValue)
          if (diff < closestDiff) {
            closestDiff = diff
            closestIndex = idx
          }
        })
        return closestIndex
      }
    }
    
    // Default to mist (index 1) if available, otherwise 0
    return opacityTokens.length > 1 ? 1 : 0
  })
  
  // Update selected index when CSS variable changes
  useEffect(() => {
    const handleUpdate = () => {
      // Skip if we just set this value to prevent immediate re-read
      const currentValue = readCssVar(targetCssVar)
      if (justSetValueRef.current && currentValue === justSetValueRef.current) {
        return
      }
      
      const resolvedValue = readCssVarResolved(targetCssVar)
      
      // Check if it's a token reference
      const tokenMatch = currentValue?.match(/var\(--recursica-tokens-opacities-([^)]+)\)/)
      if (tokenMatch) {
        const tokenKey = tokenMatch[1]
        const index = opacityTokens.findIndex(t => t.key === tokenKey)
        if (index >= 0) {
          setSelectedIndex(index)
          return
        }
      }
      
      // Otherwise, find closest token by value
      if (resolvedValue) {
        const numValue = parseFloat(resolvedValue)
        if (!isNaN(numValue)) {
          let closestIndex = 0
          let closestDiff = Math.abs(opacityTokens[0]?.value - numValue || 0)
          opacityTokens.forEach((token, idx) => {
            const diff = Math.abs(token.value - numValue)
            if (diff < closestDiff) {
              closestDiff = diff
              closestIndex = idx
            }
          })
          setSelectedIndex(closestIndex)
        }
      }
    }
    
    window.addEventListener('cssVarsUpdated', handleUpdate)
    
    // Also watch for direct style changes using MutationObserver
    const observer = new MutationObserver(handleUpdate)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    })
    
    return () => {
      window.removeEventListener('cssVarsUpdated', handleUpdate)
      observer.disconnect()
    }
  }, [targetCssVar, opacityTokens])
  
  // Handle slider change
  const handleSliderChange = (value: number | [number, number]) => {
    const numValue = typeof value === 'number' ? value : value[0]
    const clampedIndex = Math.max(0, Math.min(opacityTokens.length - 1, Math.round(numValue)))
    setSelectedIndex(clampedIndex)
    
    const selectedToken = opacityTokens[clampedIndex]
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
  
  if (opacityTokens.length === 0) {
    return (
      <div style={{ padding: '8px', fontSize: 12, opacity: 0.7 }}>
        Loading tokens...
      </div>
    )
  }
  
  const safeSelectedIndex = Math.max(0, Math.min(selectedIndex, opacityTokens.length - 1))
  const currentToken = opacityTokens[safeSelectedIndex]
  const minToken = opacityTokens[0]
  const maxToken = opacityTokens[opacityTokens.length - 1]
  
  // Create a function that calculates the value label from the current slider value
  const getValueLabel = useCallback((value: number) => {
    const index = Math.max(0, Math.min(Math.round(value), opacityTokens.length - 1))
    const token = opacityTokens[index]
    return token ? token.label : String(index)
  }, [opacityTokens])
  
  return (
    <Slider
      value={safeSelectedIndex}
      onChange={handleSliderChange}
      onChangeCommitted={handleSliderChange}
      min={0}
      max={opacityTokens.length - 1}
      step={1}
      layer={layer}
      layout="stacked"
      showInput={false}
      showValueLabel={true}
      valueLabel={getValueLabel}
      minLabel={minToken?.label || '0%'}
      maxLabel={maxToken?.label || '100%'}
      showMinMaxLabels={false}
      label={<Label layer={layer} layout="stacked">{label}</Label>}
    />
  )
}
