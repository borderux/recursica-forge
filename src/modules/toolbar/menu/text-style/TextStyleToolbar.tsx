/**
 * TextStyleToolbar Component
 * 
 * A reusable toolbar for editing text properties (font-family, font-size, font-weight,
 * letter-spacing, line-height, text-decoration, text-transform) for component text elements.
 */

import { useMemo, useState, useEffect, useCallback } from 'react'
import { readCssVar, readCssVarResolved } from '../../../../core/css/readCssVar'
import { updateCssVar } from '../../../../core/css/updateCssVar'
import { useVars } from '../../../vars/VarsContext'
import { useThemeMode } from '../../../theme/ThemeModeContext'
import { toSentenceCase } from '../../utils/componentToolbarUtils'
import { getComponentTextCssVar } from '../../../../components/utils/cssVarNames'
import { Slider } from '../../../../components/adapters/Slider'
import { Label } from '../../../../components/adapters/Label'
import { Tooltip } from '../../../../components/adapters/Tooltip'
import { iconNameToReactComponent } from '../../../components/iconUtils'
import './TextStyleToolbar.css'

interface TextStyleToolbarProps {
  componentName: string
  textElementName: string // e.g., "text", "header-text", "content-text"
  selectedVariants: Record<string, string>
  selectedLayer: string
  onClose?: () => void
}

export default function TextStyleToolbar({
  componentName,
  textElementName,
  selectedVariants,
  selectedLayer,
  onClose,
}: TextStyleToolbarProps) {
  const { theme, tokens: tokensFromVars } = useVars()
  const { mode } = useThemeMode()

  // Get CSS variables for all text properties
  const fontFamilyVar = getComponentTextCssVar(componentName as any, textElementName, 'font-family')
  const fontSizeVar = getComponentTextCssVar(componentName as any, textElementName, 'font-size')
  const fontWeightVar = getComponentTextCssVar(componentName as any, textElementName, 'font-weight')
  const letterSpacingVar = getComponentTextCssVar(componentName as any, textElementName, 'letter-spacing')
  const lineHeightVar = getComponentTextCssVar(componentName as any, textElementName, 'line-height')
  const textDecorationVar = getComponentTextCssVar(componentName as any, textElementName, 'text-decoration')
  const textTransformVar = getComponentTextCssVar(componentName as any, textElementName, 'text-transform')
  const fontStyleVar = getComponentTextCssVar(componentName as any, textElementName, 'font-style')


  // Get available font families (typefaces)
  const fontFamilies = useMemo(() => {
    const options: Array<{ label: string; cssVar: string; value: string }> = []
    
    try {
      const tokensRoot: any = (tokensFromVars as any)?.tokens || {}
      const typefaces = tokensRoot?.font?.typefaces || tokensRoot?.font?.typeface || {}
      
      Object.keys(typefaces).forEach(key => {
        if (key.startsWith('$')) return
        
        const cssVar = `--recursica-tokens-font-typefaces-${key}`
        const cssValue = readCssVar(cssVar)
        
        if (cssValue) {
          options.push({
            label: toSentenceCase(key),
            cssVar,
            value: `var(${cssVar})`,
          })
        }
      })
    } catch (error) {
      console.error('Error loading font families:', error)
    }
    
    return options
  }, [tokensFromVars])

  // Get available font weights
  const fontWeights = useMemo(() => {
    const options: Array<{ label: string; cssVar: string; value: number }> = []
    
    try {
      const tokensRoot: any = (tokensFromVars as any)?.tokens || {}
      const weights = tokensRoot?.font?.weights || tokensRoot?.font?.weight || {}
      
      Object.keys(weights).forEach(key => {
        if (key.startsWith('$')) return
        
        const weightValue = weights[key]
        const weightNum = typeof weightValue === 'object' && weightValue?.$value
          ? (typeof weightValue.$value === 'number' ? weightValue.$value : Number(weightValue.$value))
          : (typeof weightValue === 'number' ? weightValue : Number(weightValue))
        
        if (Number.isFinite(weightNum)) {
          const cssVar = `--recursica-tokens-font-weights-${key}`
          const cssValue = readCssVar(cssVar)
          
          if (cssValue) {
            options.push({
              label: toSentenceCase(key),
              cssVar,
              value: weightNum,
            })
          }
        }
      })
    } catch (error) {
      console.error('Error loading font weights:', error)
    }
    
    // Sort by numeric value
    return options.sort((a, b) => a.value - b.value)
  }, [tokensFromVars])

  // Get available letter spacing tokens
  const letterSpacings = useMemo(() => {
    const options: Array<{ label: string; cssVar: string; value: number }> = []
    
    try {
      const tokensRoot: any = (tokensFromVars as any)?.tokens || {}
      const spacings = tokensRoot?.font?.['letter-spacings'] || tokensRoot?.font?.['letter-spacing'] || {}
      
      Object.keys(spacings).forEach(key => {
        if (key.startsWith('$')) return
        
        const spacingValue = spacings[key]
        const spacingNum = typeof spacingValue === 'object' && spacingValue?.$value
          ? (typeof spacingValue.$value === 'number' ? spacingValue.$value : Number(spacingValue.$value))
          : (typeof spacingValue === 'number' ? spacingValue : Number(spacingValue))
        
        if (Number.isFinite(spacingNum)) {
          const cssVar = `--recursica-tokens-font-letter-spacings-${key}`
          const cssValue = readCssVar(cssVar)
          
          if (cssValue) {
            options.push({
              label: toSentenceCase(key),
              cssVar,
              value: spacingNum,
            })
          }
        }
      })
    } catch (error) {
      console.error('Error loading letter spacings:', error)
    }
    
    // Sort by numeric value
    return options.sort((a, b) => a.value - b.value)
  }, [tokensFromVars])

  // Get available line height tokens
  const lineHeights = useMemo(() => {
    const options: Array<{ label: string; cssVar: string; value: number }> = []
    
    try {
      const tokensRoot: any = (tokensFromVars as any)?.tokens || {}
      const heights = tokensRoot?.font?.['line-heights'] || tokensRoot?.font?.['line-height'] || {}
      
      Object.keys(heights).forEach(key => {
        if (key.startsWith('$')) return
        
        const heightValue = heights[key]
        const heightNum = typeof heightValue === 'object' && heightValue?.$value
          ? (typeof heightValue.$value === 'number' ? heightValue.$value : Number(heightValue.$value))
          : (typeof heightValue === 'number' ? heightValue : Number(heightValue))
        
        if (Number.isFinite(heightNum)) {
          const cssVar = `--recursica-tokens-font-line-heights-${key}`
          const cssValue = readCssVar(cssVar)
          
          if (cssValue) {
            options.push({
              label: toSentenceCase(key),
              cssVar,
              value: heightNum,
            })
          }
        }
      })
    } catch (error) {
      console.error('Error loading line heights:', error)
    }
    
    // Sort by numeric value
    return options.sort((a, b) => a.value - b.value)
  }, [tokensFromVars])

  // Get available font size tokens
  const fontSizes = useMemo(() => {
    const options: Array<{ label: string; cssVar: string; sizeKey: string; fontSize: number }> = []
    
    try {
      const tokensRoot: any = (tokensFromVars as any)?.tokens || {}
      const sizes = tokensRoot?.font?.sizes || tokensRoot?.font?.size || {}
      
      Object.keys(sizes).forEach(sizeKey => {
        if (sizeKey.startsWith('$')) return
        
        const sizeValue = sizes[sizeKey]
        if (sizeValue && typeof sizeValue === 'object' && '$value' in sizeValue) {
          const cssVar = `--recursica-tokens-font-sizes-${sizeKey}`
          const cssValue = readCssVar(cssVar)
          
          if (cssValue) {
            const resolvedValue = readCssVarResolved(cssVar)
            let fontSize = 0
            
            if (resolvedValue) {
              const match = resolvedValue.match(/([\d.]+)(px|rem|em)/)
              if (match) {
                const value = parseFloat(match[1])
                const unit = match[2]
                
                if (unit === 'px') {
                  fontSize = value
                } else if (unit === 'rem' || unit === 'em') {
                  fontSize = value * 16
                }
              } else {
                const numMatch = resolvedValue.match(/([\d.]+)/)
                if (numMatch) {
                  fontSize = parseFloat(numMatch[1])
                }
              }
            }
            
            // Format label from size key (e.g., "2xs" -> "2Xs", "sm" -> "Sm")
            const formattedLabel = sizeKey === '2xs' ? '2Xs' :
                                 sizeKey === '2xl' ? '2Xl' :
                                 sizeKey === '3xl' ? '3Xl' :
                                 sizeKey === '4xl' ? '4Xl' :
                                 sizeKey === '5xl' ? '5Xl' :
                                 sizeKey === '6xl' ? '6Xl' :
                                 sizeKey.charAt(0).toUpperCase() + sizeKey.slice(1)
            
            options.push({
              label: formattedLabel,
              cssVar,
              sizeKey,
              fontSize,
            })
          }
        }
      })
    } catch (error) {
      console.error('Error loading font sizes:', error)
    }
    
    // Sort by font-size from smallest to largest
    return options.sort((a, b) => a.fontSize - b.fontSize)
  }, [tokensFromVars])

  // Text decoration options with Radix UI icons
  const textDecorationOptions = [
    { value: 'none', label: 'None', icon: 'radix-text-none' },
    { value: 'underline', label: 'Underline', icon: 'radix-underline' },
    { value: 'line-through', label: 'Line Through', icon: 'radix-strikethrough' },
  ]

  // Text transform options with Radix UI icons
  const textTransformOptions = [
    { value: 'none', label: 'Original', icon: 'radix-text-none' },
    { value: 'uppercase', label: 'Uppercase', icon: 'radix-letter-case-uppercase' },
    { value: 'lowercase', label: 'Lowercase', icon: 'radix-letter-case-lowercase' },
    { value: 'capitalize', label: 'Capitalize', icon: 'radix-letter-case-capitalize' },
  ]

  // Font style options with Radix UI icons (for italics)
  const fontStyleOptions = [
    { value: 'normal', label: 'Normal', icon: 'radix-font-roman' },
    { value: 'italic', label: 'Italic', icon: 'radix-font-italic' },
  ]

  // Get current values - make font family reactive
  const [currentFontFamily, setCurrentFontFamily] = useState<string>('')
  const currentTextDecoration = readCssVar(textDecorationVar) || 'none'
  const currentTextTransform = readCssVar(textTransformVar) || 'none'
  const currentFontStyle = readCssVar(fontStyleVar) || 'normal'

  // Update current font family when CSS variable changes
  useEffect(() => {
    const updateCurrentFontFamily = () => {
      const currentFontFamilyValue = readCssVar(fontFamilyVar) || ''
      // Extract CSS var name from value (e.g., "var(--recursica-tokens-font-typefaces-primary)" -> "--recursica-tokens-font-typefaces-primary")
      const extracted = currentFontFamilyValue.match(/var\(([^)]+)\)/)?.[1] || currentFontFamilyValue
      setCurrentFontFamily(extracted)
    }
    
    updateCurrentFontFamily()
    
    // Listen for CSS var updates
    const handleUpdate = () => {
      updateCurrentFontFamily()
    }
    
    window.addEventListener('cssVarsUpdated', handleUpdate)
    return () => window.removeEventListener('cssVarsUpdated', handleUpdate)
  }, [fontFamilyVar])

  // Find current font weight token
  const [currentFontWeightToken, setCurrentFontWeightToken] = useState<string | undefined>(undefined)
  const [currentLetterSpacingToken, setCurrentLetterSpacingToken] = useState<string | undefined>(undefined)
  const [currentLineHeightToken, setCurrentLineHeightToken] = useState<string | undefined>(undefined)
  const [currentFontSizeToken, setCurrentFontSizeToken] = useState<string | undefined>(undefined)

  // Initialize current token selections
  useEffect(() => {
    const fontWeightValue = readCssVarResolved(fontWeightVar) || readCssVar(fontWeightVar) || ''
    const letterSpacingValue = readCssVarResolved(letterSpacingVar) || readCssVar(letterSpacingVar) || ''
    const lineHeightValue = readCssVarResolved(lineHeightVar) || readCssVar(lineHeightVar) || ''
    const fontSizeValue = readCssVarResolved(fontSizeVar) || readCssVar(fontSizeVar) || ''

    // Find matching token for font size
    if (fontSizeValue) {
      const sizeMatch = fontSizeValue.match(/--recursica-tokens-font-sizes-([a-z0-9-]+)/)
      if (sizeMatch) {
        setCurrentFontSizeToken(`--recursica-tokens-font-sizes-${sizeMatch[1]}`)
      } else {
        // Try to extract size key from resolved value
        const resolved = readCssVarResolved(fontSizeVar)
        if (resolved) {
          const sizeMatchResolved = resolved.match(/--recursica-tokens-font-sizes-([a-z0-9-]+)/)
          if (sizeMatchResolved) {
            setCurrentFontSizeToken(`--recursica-tokens-font-sizes-${sizeMatchResolved[1]}`)
          }
        }
      }
    }

    // Find matching token for font weight
    if (fontWeightValue) {
      const weightMatch = fontWeightValue.match(/--recursica-tokens-font-weights-([a-z0-9-]+)/)
      if (weightMatch) {
        setCurrentFontWeightToken(`--recursica-tokens-font-weights-${weightMatch[1]}`)
      } else {
        // Try to match by numeric value
        const numMatch = fontWeightValue.match(/(\d+)/)
        if (numMatch) {
          const numValue = parseInt(numMatch[1], 10)
          const matchingToken = fontWeights.find(w => w.value === numValue)
          if (matchingToken) {
            setCurrentFontWeightToken(matchingToken.cssVar)
          }
        }
      }
    }

    // Find matching token for letter spacing
    if (letterSpacingValue) {
      const spacingMatch = letterSpacingValue.match(/--recursica-tokens-font-letter-spacings-([a-z0-9-]+)/)
      if (spacingMatch) {
        setCurrentLetterSpacingToken(`--recursica-tokens-font-letter-spacings-${spacingMatch[1]}`)
      }
    }

    // Find matching token for line height
    if (lineHeightValue) {
      const heightMatch = lineHeightValue.match(/--recursica-tokens-font-line-heights-([a-z0-9-]+)/)
      if (heightMatch) {
        setCurrentLineHeightToken(`--recursica-tokens-font-line-heights-${heightMatch[1]}`)
      }
    }
  }, [fontWeightVar, letterSpacingVar, lineHeightVar, fontSizeVar, fontWeights])

  // Listen for CSS var updates
  useEffect(() => {
    const handleUpdate = () => {
      const fontWeightValue = readCssVarResolved(fontWeightVar) || readCssVar(fontWeightVar) || ''
      const letterSpacingValue = readCssVarResolved(letterSpacingVar) || readCssVar(letterSpacingVar) || ''
      const lineHeightValue = readCssVarResolved(lineHeightVar) || readCssVar(lineHeightVar) || ''
      const fontSizeValue = readCssVarResolved(fontSizeVar) || readCssVar(fontSizeVar) || ''

      if (fontSizeValue) {
        const sizeMatch = fontSizeValue.match(/--recursica-tokens-font-sizes-([a-z0-9-]+)/)
        if (sizeMatch) {
          setCurrentFontSizeToken(`--recursica-tokens-font-sizes-${sizeMatch[1]}`)
        }
      }

      if (fontWeightValue) {
        const weightMatch = fontWeightValue.match(/--recursica-tokens-font-weights-([a-z0-9-]+)/)
        if (weightMatch) {
          setCurrentFontWeightToken(`--recursica-tokens-font-weights-${weightMatch[1]}`)
        }
      }

      if (letterSpacingValue) {
        const spacingMatch = letterSpacingValue.match(/--recursica-tokens-font-letter-spacings-([a-z0-9-]+)/)
        if (spacingMatch) {
          setCurrentLetterSpacingToken(`--recursica-tokens-font-letter-spacings-${spacingMatch[1]}`)
        }
      }

      if (lineHeightValue) {
        const heightMatch = lineHeightValue.match(/--recursica-tokens-font-line-heights-([a-z0-9-]+)/)
        if (heightMatch) {
          setCurrentLineHeightToken(`--recursica-tokens-font-line-heights-${heightMatch[1]}`)
        }
      }
    }

    window.addEventListener('cssVarsUpdated', handleUpdate)
    return () => window.removeEventListener('cssVarsUpdated', handleUpdate)
  }, [fontWeightVar, letterSpacingVar, lineHeightVar, fontSizeVar])

  // Handlers
  const handleFontFamilyChange = useCallback((cssVar: string) => {
    const tokenValue = `var(${cssVar})`
    updateCssVar(fontFamilyVar, tokenValue)
    // Update state immediately for UI responsiveness
    setCurrentFontFamily(cssVar)
    requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
        detail: { cssVars: [fontFamilyVar] }
      }))
    })
  }, [fontFamilyVar])

  const handleFontWeightChange = useCallback((tokenCssVar: string) => {
    setCurrentFontWeightToken(tokenCssVar)
    const tokenValue = `var(${tokenCssVar})`
    updateCssVar(fontWeightVar, tokenValue)
    requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
        detail: { cssVars: [fontWeightVar] }
      }))
    })
  }, [fontWeightVar])

  const handleLetterSpacingChange = useCallback((tokenCssVar: string) => {
    setCurrentLetterSpacingToken(tokenCssVar)
    const tokenValue = `var(${tokenCssVar})`
    updateCssVar(letterSpacingVar, tokenValue)
    requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
        detail: { cssVars: [letterSpacingVar] }
      }))
    })
  }, [letterSpacingVar])

  const handleLineHeightChange = useCallback((tokenCssVar: string) => {
    setCurrentLineHeightToken(tokenCssVar)
    const tokenValue = `var(${tokenCssVar})`
    updateCssVar(lineHeightVar, tokenValue)
    requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
        detail: { cssVars: [lineHeightVar] }
      }))
    })
  }, [lineHeightVar])

  const handleFontSizeChange = useCallback((tokenCssVar: string) => {
    setCurrentFontSizeToken(tokenCssVar)
    const tokenValue = `var(${tokenCssVar})`
    updateCssVar(fontSizeVar, tokenValue)
    requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
        detail: { cssVars: [fontSizeVar] }
      }))
    })
  }, [fontSizeVar])

  const handleTextDecorationChange = useCallback((value: string) => {
    updateCssVar(textDecorationVar, value)
    requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
        detail: { cssVars: [textDecorationVar] }
      }))
    })
  }, [textDecorationVar])

  const handleTextTransformChange = useCallback((value: string) => {
    updateCssVar(textTransformVar, value)
    requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
        detail: { cssVars: [textTransformVar] }
      }))
    })
  }, [textTransformVar])

  const handleFontStyleChange = useCallback((value: string) => {
    updateCssVar(fontStyleVar, value)
    requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
        detail: { cssVars: [fontStyleVar] }
      }))
    })
  }, [fontStyleVar])

  // Get current indices for sliders
  const fontSizeIndex = fontSizes.findIndex(s => s.cssVar === currentFontSizeToken)
  const fontWeightIndex = fontWeights.findIndex(w => w.cssVar === currentFontWeightToken)
  const letterSpacingIndex = letterSpacings.findIndex(s => s.cssVar === currentLetterSpacingToken)
  const lineHeightIndex = lineHeights.findIndex(h => h.cssVar === currentLineHeightToken)

  return (
    <div className="text-style-toolbar">
      {/* Font Family */}
      {fontFamilies.length > 0 && (
        <div className="text-style-control">
          <Label layer="layer-3" layout="stacked">Font Family</Label>
          <select
            value={currentFontFamily}
            onChange={(e) => {
              const selectedCssVar = e.target.value
              if (selectedCssVar) {
                handleFontFamilyChange(selectedCssVar)
              }
            }}
            style={{
              padding: '8px',
              borderRadius: '4px',
              border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-0-property-border-color)`,
              backgroundColor: `var(--recursica-brand-themes-${mode}-layer-layer-0-property-background)`,
              color: `var(--recursica-brand-themes-${mode}-layer-layer-0-elements-text-color)`,
              fontSize: '14px',
              width: '100%',
            }}
          >
            {fontFamilies.map(family => (
              <option key={family.cssVar} value={family.cssVar}>
                {family.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Font Size */}
      {fontSizes.length > 0 && (
        <div className="text-style-control">
          <Slider
            value={fontSizeIndex >= 0 ? fontSizeIndex : 0}
            onChange={(val) => {
              const idx = typeof val === 'number' ? val : val[0]
              const roundedIdx = Math.round(idx)
              const token = fontSizes[roundedIdx]
              if (token) {
                handleFontSizeChange(token.cssVar)
              }
            }}
            onChangeCommitted={(val) => {
              const idx = typeof val === 'number' ? val : val[0]
              const roundedIdx = Math.round(idx)
              const token = fontSizes[roundedIdx]
              if (token) {
                handleFontSizeChange(token.cssVar)
              }
            }}
            min={0}
            max={fontSizes.length - 1}
            step={1}
            layer="layer-3"
            layout="stacked"
            showInput={false}
            showValueLabel={true}
            valueLabel={(val) => {
              const token = fontSizes[Math.round(val)]
              return token?.label || String(val)
            }}
            minLabel={fontSizes[0]?.label || '2Xs'}
            maxLabel={fontSizes[fontSizes.length - 1]?.label || '6Xl'}
            label={<Label layer="layer-3" layout="stacked">Font Size</Label>}
          />
        </div>
      )}

      {/* Font Weight */}
      {fontWeights.length > 0 && (
        <div className="text-style-control">
          <Slider
            value={fontWeightIndex >= 0 ? fontWeightIndex : 0}
            onChange={(val) => {
              const idx = typeof val === 'number' ? val : val[0]
              const roundedIdx = Math.round(idx)
              const token = fontWeights[roundedIdx]
              if (token) {
                handleFontWeightChange(token.cssVar)
              }
            }}
            onChangeCommitted={(val) => {
              const idx = typeof val === 'number' ? val : val[0]
              const roundedIdx = Math.round(idx)
              const token = fontWeights[roundedIdx]
              if (token) {
                handleFontWeightChange(token.cssVar)
              }
            }}
            min={0}
            max={fontWeights.length - 1}
            step={1}
            layer="layer-3"
            layout="stacked"
            showInput={false}
            showValueLabel={true}
            valueLabel={(val) => {
              const token = fontWeights[Math.round(val)]
              return token?.label || String(val)
            }}
            minLabel={fontWeights[0]?.label || 'Thin'}
            maxLabel={fontWeights[fontWeights.length - 1]?.label || 'Black'}
            label={<Label layer="layer-3" layout="stacked">Font Weight</Label>}
          />
        </div>
      )}

      {/* Letter Spacing */}
      {letterSpacings.length > 0 && (
        <div className="text-style-control">
          <Slider
            value={letterSpacingIndex >= 0 ? letterSpacingIndex : 0}
            onChange={(val) => {
              const idx = typeof val === 'number' ? val : val[0]
              const roundedIdx = Math.round(idx)
              const token = letterSpacings[roundedIdx]
              if (token) {
                handleLetterSpacingChange(token.cssVar)
              }
            }}
            onChangeCommitted={(val) => {
              const idx = typeof val === 'number' ? val : val[0]
              const roundedIdx = Math.round(idx)
              const token = letterSpacings[roundedIdx]
              if (token) {
                handleLetterSpacingChange(token.cssVar)
              }
            }}
            min={0}
            max={letterSpacings.length - 1}
            step={1}
            layer="layer-3"
            layout="stacked"
            showInput={false}
            showValueLabel={true}
            valueLabel={(val) => {
              const token = letterSpacings[Math.round(val)]
              return token?.label || String(val)
            }}
            minLabel={letterSpacings[0]?.label || 'Tight'}
            maxLabel={letterSpacings[letterSpacings.length - 1]?.label || 'Wide'}
            label={<Label layer="layer-3" layout="stacked">Letter Spacing</Label>}
          />
        </div>
      )}

      {/* Line Height */}
      {lineHeights.length > 0 && (
        <div className="text-style-control">
          <Slider
            value={lineHeightIndex >= 0 ? lineHeightIndex : 0}
            onChange={(val) => {
              const idx = typeof val === 'number' ? val : val[0]
              const roundedIdx = Math.round(idx)
              const token = lineHeights[roundedIdx]
              if (token) {
                handleLineHeightChange(token.cssVar)
              }
            }}
            onChangeCommitted={(val) => {
              const idx = typeof val === 'number' ? val : val[0]
              const roundedIdx = Math.round(idx)
              const token = lineHeights[roundedIdx]
              if (token) {
                handleLineHeightChange(token.cssVar)
              }
            }}
            min={0}
            max={lineHeights.length - 1}
            step={1}
            layer="layer-3"
            layout="stacked"
            showInput={false}
            showValueLabel={true}
            valueLabel={(val) => {
              const token = lineHeights[Math.round(val)]
              return token?.label || String(val)
            }}
            minLabel={lineHeights[0]?.label || 'Tight'}
            maxLabel={lineHeights[lineHeights.length - 1]?.label || 'Loose'}
            label={<Label layer="layer-3" layout="stacked">Line Height</Label>}
          />
        </div>
      )}

      {/* Text Decoration */}
      <div className="text-style-control">
        <Label layer="layer-3" layout="stacked">Text Decoration</Label>
        <div 
          className="text-style-segmented-control"
          style={{
            border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-0-property-border-color)`,
            borderRadius: `var(--recursica-brand-themes-${mode}-layer-layer-0-property-border-radius)`,
            display: 'inline-flex',
            overflow: 'hidden',
            width: 'auto',
          }}
        >
          {textDecorationOptions.map((option, index) => {
            const Icon = iconNameToReactComponent(option.icon)
            const isSelected = currentTextDecoration === option.value
            return (
              <Tooltip key={option.value} label={option.label} position="top" layer="layer-3">
                <button
                  onClick={() => handleTextDecorationChange(option.value)}
                  className={`text-style-segmented-button ${isSelected ? 'selected' : ''}`}
                  style={{
                    padding: 'var(--recursica-brand-dimensions-general-default) var(--recursica-brand-dimensions-general-sm)',
                    border: 'none',
                    borderRight: index < textDecorationOptions.length - 1
                      ? `1px solid var(--recursica-brand-themes-${mode}-layer-layer-0-property-border-color)`
                      : 'none',
                    background: isSelected
                      ? `var(--recursica-brand-themes-${mode}-layer-layer-1-property-surface)`
                      : 'transparent',
                    color: isSelected
                      ? `var(--recursica-brand-themes-${mode}-layer-layer-1-property-element-text-color)`
                      : `var(--recursica-brand-themes-${mode}-layer-layer-0-property-element-text-color)`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '32px',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = `var(--recursica-brand-themes-${mode}-layer-layer-0-property-surface-hover)`
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  {Icon && <Icon size={16} />}
                </button>
              </Tooltip>
            )
          })}
        </div>
      </div>

      {/* Text Transform */}
      <div className="text-style-control">
        <Label layer="layer-3" layout="stacked">Text Transform</Label>
        <div 
          className="text-style-segmented-control"
          style={{
            border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-0-property-border-color)`,
            borderRadius: `var(--recursica-brand-themes-${mode}-layer-layer-0-property-border-radius)`,
            display: 'inline-flex',
            overflow: 'hidden',
            width: 'auto',
          }}
        >
          {textTransformOptions.map((option, index) => {
            const Icon = iconNameToReactComponent(option.icon)
            const isSelected = currentTextTransform === option.value
            return (
              <Tooltip key={option.value} label={option.label} position="top" layer="layer-3">
                <button
                  onClick={() => handleTextTransformChange(option.value)}
                  className={`text-style-segmented-button ${isSelected ? 'selected' : ''}`}
                  style={{
                    padding: 'var(--recursica-brand-dimensions-general-default) var(--recursica-brand-dimensions-general-sm)',
                    border: 'none',
                    borderRight: index < textTransformOptions.length - 1
                      ? `1px solid var(--recursica-brand-themes-${mode}-layer-layer-0-property-border-color)`
                      : 'none',
                    background: isSelected
                      ? `var(--recursica-brand-themes-${mode}-layer-layer-1-property-surface)`
                      : 'transparent',
                    color: isSelected
                      ? `var(--recursica-brand-themes-${mode}-layer-layer-1-property-element-text-color)`
                      : `var(--recursica-brand-themes-${mode}-layer-layer-0-property-element-text-color)`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '32px',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = `var(--recursica-brand-themes-${mode}-layer-layer-0-property-surface-hover)`
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  {Icon && <Icon size={16} />}
                </button>
              </Tooltip>
            )
          })}
        </div>
      </div>

      {/* Font Style (Italics) */}
      <div className="text-style-control">
        <Label layer="layer-3" layout="stacked">Type Style</Label>
        <div 
          className="text-style-segmented-control"
          style={{
            border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-0-property-border-color)`,
            borderRadius: `var(--recursica-brand-themes-${mode}-layer-layer-0-property-border-radius)`,
            display: 'inline-flex',
            overflow: 'hidden',
            width: 'auto',
          }}
        >
          {fontStyleOptions.map((option, index) => {
            const Icon = iconNameToReactComponent(option.icon)
            const isSelected = currentFontStyle === option.value
            return (
              <Tooltip key={option.value} label={option.label} position="top" layer="layer-3">
                <button
                  onClick={() => handleFontStyleChange(option.value)}
                  className={`text-style-segmented-button ${isSelected ? 'selected' : ''}`}
                  style={{
                    padding: 'var(--recursica-brand-dimensions-general-default) var(--recursica-brand-dimensions-general-sm)',
                    border: 'none',
                    borderRight: index < fontStyleOptions.length - 1
                      ? `1px solid var(--recursica-brand-themes-${mode}-layer-layer-0-property-border-color)`
                      : 'none',
                    background: isSelected
                      ? `var(--recursica-brand-themes-${mode}-layer-layer-1-property-surface)`
                      : 'transparent',
                    color: isSelected
                      ? `var(--recursica-brand-themes-${mode}-layer-layer-1-property-element-text-color)`
                      : `var(--recursica-brand-themes-${mode}-layer-layer-0-property-element-text-color)`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '32px',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = `var(--recursica-brand-themes-${mode}-layer-layer-0-property-surface-hover)`
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  {Icon && <Icon size={16} />}
                </button>
              </Tooltip>
            )
          })}
        </div>
      </div>
    </div>
  )
}
