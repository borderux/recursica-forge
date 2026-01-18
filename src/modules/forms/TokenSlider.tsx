import React from 'react'
import { Slider } from '../../components/adapters/Slider'

type Token = { name: string; value?: number; label?: string }

type TokenSliderProps = {
  /** Label displayed on the left side */
  label: string
  /** Array of tokens/options to slide through */
  tokens: Token[]
  /** Current token name (used to find index) */
  currentToken?: string
  /** Callback when slider value changes, receives the token name */
  onChange: (tokenName: string) => void
  /** Optional function to get label for display (defaults to token.label or token.name) */
  getTokenLabel?: (token: Token) => string
  /** Optional function to format the displayed value label */
  formatDisplayLabel?: (label: string, index: number, signedValue?: number) => string
  /** Optional zero index for signed sliders (negative to positive range) */
  zeroIndex?: number
  /** Optional signed value for bidirectional sliders */
  signedValue?: number
  /** Optional callback when direction changes (for signed sliders) */
  onDirectionChange?: (direction: 'left' | 'right' | 'up' | 'down') => void
}

/**
 * A reusable form control slider for selecting from a list of tokens/options.
 * Supports both simple (0 to max) and signed (negative to positive) slider ranges.
 */
export default function TokenSlider({
  label,
  tokens,
  currentToken,
  onChange,
  getTokenLabel,
  formatDisplayLabel,
  zeroIndex,
  signedValue,
  onDirectionChange,
}: TokenSliderProps) {
  // Sort tokens by value if available, smallest to largest (left to right)
  // Tokens without numeric values go to the end
  // "none" option is always first
  const sortedTokens = React.useMemo(() => {
    return [...tokens].sort((a, b) => {
      // Handle "none" specially - it should always be first
      if (a.name === 'none') return -1
      if (b.name === 'none') return 1
      
      if (a.value !== undefined && b.value !== undefined) {
        return a.value - b.value // Smallest to largest
      }
      if (a.value !== undefined) return -1 // a has value, b doesn't - a comes first
      if (b.value !== undefined) return 1  // b has value, a doesn't - b comes first
      return 0 // Neither has value - maintain order
    })
  }, [tokens])

  // Find current index
  const findIndex = React.useCallback((tokenName?: string): number => {
    if (!tokenName) return zeroIndex ?? 0
    const idx = sortedTokens.findIndex((t) => t.name === tokenName)
    return idx >= 0 ? idx : (zeroIndex ?? 0)
  }, [sortedTokens, zeroIndex])

  const currentIdx = findIndex(currentToken)

  // For signed sliders, calculate signed value if not provided
  const displaySignedValue = React.useMemo(() => {
    if (signedValue !== undefined) return signedValue
    if (zeroIndex !== undefined) {
      return currentIdx - zeroIndex
    }
    return undefined
  }, [signedValue, zeroIndex, currentIdx])

  // Calculate min/max
  const min = zeroIndex !== undefined ? -(sortedTokens.length - 1 - zeroIndex) : 0
  const max = zeroIndex !== undefined ? (sortedTokens.length - 1 - zeroIndex) : sortedTokens.length - 1

  // Get display label
  const getLabel = React.useCallback((token: Token): string => {
    if (getTokenLabel) return getTokenLabel(token)
    return token.label || token.name.split('/').pop() || token.name
  }, [getTokenLabel])

  const currentTokenObj = sortedTokens[currentIdx]
  const baseLabel = currentTokenObj ? getLabel(currentTokenObj) : ''
  const displayLabel = formatDisplayLabel 
    ? formatDisplayLabel(baseLabel, currentIdx, displaySignedValue)
    : baseLabel

  const handleChange = (value: number | [number, number]) => {
    const numValue = typeof value === 'number' ? value : value[0]
    
    if (zeroIndex !== undefined) {
      // Signed slider
      if (onDirectionChange) {
        // Determine direction based on label and value sign
        const isX = label.toLowerCase().includes('x') || label.toLowerCase().includes('offset x')
        const nextDir = numValue < 0 
          ? (isX ? 'left' : 'up')
          : (isX ? 'right' : 'down')
        onDirectionChange(nextDir)
      }
      const idx = zeroIndex + Math.abs(numValue)
      const token = sortedTokens[idx]?.name || sortedTokens[zeroIndex]?.name || ''
      onChange(token)
    } else {
      // Simple slider
      const token = sortedTokens[numValue]?.name || sortedTokens[0]?.name || ''
      onChange(token)
    }
  }

  const sliderValue = displaySignedValue !== undefined ? displaySignedValue : currentIdx

  return (
    <div className="control-group">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 12, opacity: 0.7 }}>{label}</span>
        <span style={{ fontSize: 12, opacity: 0.7 }}>{displayLabel}</span>
      </div>
      <Slider
        value={sliderValue}
        onChange={handleChange}
        min={min}
        max={max}
        step={1}
        layer="layer-3"
        showInput={false}
        tooltipText={displayLabel}
      />
    </div>
  )
}

