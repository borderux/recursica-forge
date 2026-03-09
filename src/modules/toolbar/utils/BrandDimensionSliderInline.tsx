/**
 * Brand Dimension Slider Inline Component
 * 
 * An inline slider component for properties that use brand dimension tokens.
 * Sorts tokens by pixel value (smallest to largest) and displays the value as a read-only label.
 */

import { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { readCssVar, readCssVarResolved } from '../../../core/css/readCssVar'
import { updateCssVar } from '../../../core/css/updateCssVar'
import { useVars } from '../../vars/VarsContext'
import { useThemeMode } from '../../theme/ThemeModeContext'
import { Slider } from '../../../components/adapters/Slider'
import { Label } from '../../../components/adapters/Label'

// Helper to format label from key
function formatDimensionLabel(key: string): string {
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

interface BrandDimensionSliderInlineProps {
  targetCssVar: string
  targetCssVars?: string[]
  label: string
  dimensionCategory: 'border-radii' | 'icons' | 'general' | 'text-size'
  layer?: 'layer-0' | 'layer-1' | 'layer-2' | 'layer-3'
}

export default function BrandDimensionSliderInline({
  targetCssVar,
  targetCssVars = [],
  label,
  dimensionCategory,
  layer = 'layer-1',
}: BrandDimensionSliderInlineProps) {
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

  // Get tooltip text - show token name (key) in tooltip
  const tooltipText = currentToken?.key || currentToken?.label || String(safeSelectedIndex)

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
      tooltipText={tooltipText}
      minLabel={minLabel}
      maxLabel={maxLabel}
      showMinMaxLabels={false}
      label={<Label layer={layer} layout="stacked">{label}</Label>}
    />
  )
}
