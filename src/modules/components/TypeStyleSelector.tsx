import { useMemo, useState, useEffect, useCallback } from 'react'
import { readCssVar, readCssVarResolved } from '../../core/css/readCssVar'
import { updateCssVar } from '../../core/css/updateCssVar'
import { useVars } from '../vars/VarsContext'
import { useThemeMode } from '../theme/ThemeModeContext'
import { toSentenceCase } from '../toolbar/utils/componentToolbarUtils'
import TokenSlider from '../forms/TokenSlider'

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
    
    // Check if it's a typography reference
    // Pattern: var(--recursica-brand-typography-{style-name}-font-size)
    const typoMatch = cssVarValue.match(/--recursica-brand-typography-([^-]+)-font-size/)
    if (typoMatch) {
      return typoMatch[1] // Returns 'body', 'button', etc.
    }
    
    // Check if it resolves to a typography reference
    const resolved = readCssVarResolved(targetCssVar)
    if (resolved) {
      const resolvedTypoMatch = resolved.match(/--recursica-brand-typography-([^-]+)-font-size/)
      if (resolvedTypoMatch) {
        return resolvedTypoMatch[1]
      }
    }
    
    return null
  }, [targetCssVar])

  // Read initial value and set selected token
  const readInitialValue = useCallback(() => {
    const currentValue = readCssVar(targetCssVar)
    if (!currentValue) {
      // Default to 'body' if not set
      const bodyCssVar = typeStyleTokens.find(t => t.label === 'Body')?.name
      if (bodyCssVar) {
        setSelectedToken(bodyCssVar)
        // Set the default value
        const allCssVars = [targetCssVar, ...targetCssVars]
        allCssVars.forEach(cssVar => {
          if (cssVar) {
            updateCssVar(cssVar, `var(${bodyCssVar})`)
          }
        })
      }
      return
    }
    
    // Extract type style name from current value
    const styleName = extractTypeStyleName(currentValue)
    if (styleName) {
      const matchingToken = typeStyleTokens.find(t => {
        const tokenStyleName = t.name.match(/--recursica-brand-typography-([^-]+)-font-size/)?.[1]
        return tokenStyleName === styleName
      })
      setSelectedToken(matchingToken?.name)
    } else {
      // If we can't find a match, default to 'body'
      const bodyCssVar = typeStyleTokens.find(t => t.label === 'Body')?.name
      setSelectedToken(bodyCssVar)
    }
  }, [targetCssVar, targetCssVars, typeStyleTokens, extractTypeStyleName])

  useEffect(() => {
    readInitialValue()
  }, [readInitialValue])

  const handleTokenChange = useCallback((tokenName: string) => {
    setSelectedToken(tokenName)
    
    // Update all CSS vars
    const allCssVars = [targetCssVar, ...targetCssVars]
    allCssVars.forEach(cssVar => {
      if (cssVar) {
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

  return (
    <TokenSlider
      label={label}
      tokens={typeStyleTokens.map(t => ({ name: t.name, label: t.label }))}
      currentToken={selectedToken}
      onChange={handleTokenChange}
      getTokenLabel={(token) => {
        const typeStyle = typeStyleTokens.find(t => t.name === token.name)
        return typeStyle?.label || token.label || token.name
      }}
    />
  )
}

