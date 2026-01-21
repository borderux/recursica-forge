import { useMemo, useState, useEffect, useCallback } from 'react'
import { readCssVar, readCssVarResolved } from '../../core/css/readCssVar'
import { updateCssVar } from '../../core/css/updateCssVar'
import { useVars } from '../vars/VarsContext'
import { useThemeMode } from '../theme/ThemeModeContext'
import { toSentenceCase } from '../toolbar/utils/componentToolbarUtils'
import { Slider } from '../../components/adapters/Slider'
import { Label } from '../../components/adapters/Label'

interface TypeStyleSelectorProps {
  targetCssVar: string
  targetCssVars?: string[]
  label: string
}

export default function TypeStyleSelector({
  targetCssVar,
  targetCssVars = [],
  label,
}: TypeStyleSelectorProps) {
  const { theme } = useVars()
  const { mode } = useThemeMode()

  // Get available type styles from theme JSON
  const typeStyleTokens = useMemo(() => {
    const options: Array<{ name: string; label: string; cssVar: string; fontSize: number }> = []
    
    try {
      const root: any = (theme as any)?.brand ? (theme as any).brand : theme
      const typography = root?.typography || {}
      
      // Collect all type styles (body, body-small, button, caption, etc.)
      Object.keys(typography).forEach(styleName => {
        if (styleName.startsWith('$')) return
        
        const styleValue = typography[styleName]
        if (styleValue && typeof styleValue === 'object' && '$type' in styleValue && styleValue.$type === 'typography') {
          // Create CSS var reference for this style's font-size
          const cssVar = `--recursica-brand-typography-${styleName}-font-size`
          const cssValue = readCssVar(cssVar)
          
          // Only add if the CSS var exists (has been generated)
          if (cssValue) {
            // Read the resolved font-size value to get the numeric size
            const resolvedValue = readCssVarResolved(cssVar)
            let fontSize = 0
            
            if (resolvedValue) {
              // Parse the font-size value (handles px, rem, em, etc.)
              // Extract numeric value and convert to pixels for comparison
              const match = resolvedValue.match(/([\d.]+)(px|rem|em)/)
              if (match) {
                const value = parseFloat(match[1])
                const unit = match[2]
                
                // Convert to pixels for consistent comparison
                // Assuming 16px base font size for rem/em
                if (unit === 'px') {
                  fontSize = value
                } else if (unit === 'rem' || unit === 'em') {
                  fontSize = value * 16
                }
              } else {
                // Try to parse as just a number (assumes px)
                const numMatch = resolvedValue.match(/([\d.]+)/)
                if (numMatch) {
                  fontSize = parseFloat(numMatch[1])
                }
              }
            }
            
            options.push({
              name: cssVar,
              label: toSentenceCase(styleName),
              cssVar,
              fontSize,
            })
          }
        }
      })
    } catch (error) {
      console.error('Error loading type style options:', error)
    }
    
    // Sort by font-size from smallest to largest
    return options.sort((a, b) => a.fontSize - b.fontSize)
  }, [theme, mode])

  // Track selected token
  const [selectedToken, setSelectedToken] = useState<string | undefined>(undefined)
  
  // Helper to extract type style name from CSS var value
  const extractTypeStyleName = useCallback((cssVarValue: string): string | null => {
    if (!cssVarValue) return null
    
    // Check if it's a brace reference: {brand.typography.body-small}
    const braceMatch = cssVarValue.match(/\{brand\.typography\.([^}]+)\}/)
    if (braceMatch) {
      return braceMatch[1].toLowerCase() // Returns 'body-small', 'button', etc.
    }
    
    // Check if it's a typography CSS var reference
    // Pattern: var(--recursica-brand-typography-{style-name}-font-size)
    // Use greedy match to capture full hyphenated names like "body-small"
    const typoMatch = cssVarValue.match(/--recursica-brand-typography-([a-z0-9-]+)-(?:font-size|font-weight|font-family|font-letter-spacing|line-height)/)
    if (typoMatch) {
      return typoMatch[1].toLowerCase() // Returns 'body-small', 'button', etc.
    }
    
    // Fallback: match any characters up to a hyphen (for unknown property names)
    const typoMatchFallback = cssVarValue.match(/--recursica-brand-typography-([a-z0-9-]+)-/)
    if (typoMatchFallback) {
      return typoMatchFallback[1].toLowerCase()
    }
    
    // Check if it resolves to a typography reference
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
      const resolvedTypoMatchFallback = resolved.match(/--recursica-brand-typography-([a-z0-9-]+)-/)
      if (resolvedTypoMatchFallback) {
        return resolvedTypoMatchFallback[1].toLowerCase()
      }
    }
    
    return null
  }, [targetCssVar])

  // Read initial value and set selected token
  const readInitialValue = useCallback(() => {
    // Try reading the CSS var (may be null if reset)
    const currentValue = readCssVar(targetCssVar)
    
    // If no value, try reading the resolved value (falls back to computed/default)
    const resolvedValue = currentValue || readCssVarResolved(targetCssVar)
    
    if (!resolvedValue) {
      // If still no value, try to get default from UIKit.json
      // Extract prop name from CSS var (e.g., "label-font" from "--recursica-ui-kit-components-label-properties-label-font")
      const propMatch = targetCssVar.match(/components-label-properties-([^-]+)/)
      if (propMatch) {
        const propName = propMatch[1]
        try {
          const uikitRoot: any = (theme as any)?.['ui-kit'] || (theme as any)
          const labelComponent = uikitRoot?.components?.label
          const propValue = labelComponent?.properties?.[propName]
          
          if (propValue?.$type === 'typography' && propValue?.$value) {
            // Extract typography style name from default value (e.g., "{brand.typography.body-small}" -> "body-small")
            const defaultStyleName = extractTypeStyleName(propValue.$value)
            if (defaultStyleName) {
              const matchingToken = typeStyleTokens.find(t => {
                const tokenStyleName = t.name.match(/--recursica-brand-typography-([a-z0-9-]+)-(?:font-size|font-weight|font-family|font-letter-spacing|line-height)/)?.[1]
                return tokenStyleName === defaultStyleName
              })
              if (matchingToken) {
                setSelectedToken(matchingToken.name)
                return
              }
            }
          }
        } catch (error) {
          console.warn('Failed to read default from UIKit.json:', error)
        }
      }
      
      // Fallback to 'body' if not set
      const bodyCssVar = typeStyleTokens.find(t => t.label === 'Body')?.name
      setSelectedToken(bodyCssVar)
      return
    }
    
    // Extract type style name from current value
    const styleName = extractTypeStyleName(resolvedValue)
    if (styleName) {
      const matchingToken = typeStyleTokens.find(t => {
        // Use greedy match to capture full hyphenated names like "body-small"
        const tokenStyleName = t.name.match(/--recursica-brand-typography-([a-z0-9-]+)-(?:font-size|font-weight|font-family|font-letter-spacing|line-height)/)?.[1]
        return tokenStyleName === styleName
      })
      setSelectedToken(matchingToken?.name)
    } else {
      // If we can't find a match, default to 'body'
      const bodyCssVar = typeStyleTokens.find(t => t.label === 'Body')?.name
      setSelectedToken(bodyCssVar)
    }
  }, [targetCssVar, targetCssVars, typeStyleTokens, extractTypeStyleName, theme])

  useEffect(() => {
    readInitialValue()
  }, [readInitialValue])

  // Listen for CSS var reset events to re-read the initial value
  useEffect(() => {
    const handleReset = () => {
      readInitialValue()
    }
    
    const handleCssVarUpdate = (event: CustomEvent) => {
      // Re-read if this CSS var was updated
      if (event.detail?.cssVars?.includes(targetCssVar)) {
        readInitialValue()
      }
    }
    
    window.addEventListener('cssVarsReset', handleReset as EventListener)
    window.addEventListener('cssVarsUpdated', handleCssVarUpdate as EventListener)
    
    return () => {
      window.removeEventListener('cssVarsReset', handleReset as EventListener)
      window.removeEventListener('cssVarsUpdated', handleCssVarUpdate as EventListener)
    }
  }, [targetCssVar, readInitialValue])

  const handleTokenChange = useCallback((tokenName: string) => {
    setSelectedToken(tokenName)
    
    // Update all CSS vars with the typography font-size CSS variable reference
    // tokenName is already a CSS variable name like --recursica-brand-typography-body-font-size
    // We set the target CSS vars to reference this typography font-size CSS var
    const allCssVars = [targetCssVar, ...targetCssVars]
    allCssVars.forEach(cssVar => {
      if (cssVar && tokenName) {
        // Set to valid CSS var() reference, not a brace reference
        // Brace references are only for JSON configuration, not runtime CSS variables
        updateCssVar(cssVar, `var(${tokenName})`)
      }
    })
  }, [targetCssVar, targetCssVars])

  if (typeStyleTokens.length === 0) {
    return (
      <div style={{ padding: '12px', fontSize: 12, opacity: 0.7 }}>
        No type styles available
      </div>
    )
  }

  const tokens = typeStyleTokens.map((t, index) => ({ name: t.name, label: t.label, index }))
  const currentIdx = tokens.findIndex(t => t.name === selectedToken) || 0
  const getValueLabel = useCallback((value: number) => {
    const token = tokens[Math.round(value)]
    const typeStyle = typeStyleTokens.find(t => t.name === token?.name)
    return typeStyle?.label || token?.label || token?.name || String(value)
  }, [tokens, typeStyleTokens])
  const minToken = tokens[0]
  const maxToken = tokens[tokens.length - 1]
  
  return (
    <Slider
      value={currentIdx}
      onChange={(val) => {
        const idx = typeof val === 'number' ? val : val[0]
        const token = tokens[Math.round(idx)]
        if (token) {
          handleTokenChange(token.name)
        }
      }}
      min={0}
      max={tokens.length - 1}
      step={1}
      layer="layer-3"
      layout="stacked"
      showInput={false}
      showValueLabel={true}
      valueLabel={getValueLabel}
      minLabel={minToken?.label || 'Body'}
      maxLabel={maxToken?.label || 'Heading'}
      label={<Label layer="layer-3" layout="stacked">{label}</Label>}
    />
  )
}

