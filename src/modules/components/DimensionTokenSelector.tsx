import { useMemo, useState, useEffect, useCallback } from 'react'
import { readCssVar, readCssVarResolved } from '../../core/css/readCssVar'
import { updateCssVar, removeCssVar } from '../../core/css/updateCssVar'
import { useVars } from '../vars/VarsContext'
import { useThemeMode } from '../theme/ThemeModeContext'
import { toSentenceCase } from '../toolbar/utils/componentToolbarUtils'
import { Slider } from '../../components/adapters/Slider'
import { Label } from '../../components/adapters/Label'

interface DimensionTokenSelectorProps {
  targetCssVar: string
  targetCssVars?: string[]
  label: string
  propName: string // e.g., "border-radius", "font-size", "height"
  minPixelValue?: number // Optional minimum value for pixel slider
  maxPixelValue?: number // Optional maximum value for pixel slider
}

export default function DimensionTokenSelector({
  targetCssVar,
  targetCssVars = [],
  label,
  propName,
  minPixelValue: minPixelValueProp,
  maxPixelValue: maxPixelValueProp,
}: DimensionTokenSelectorProps) {
  const { theme, tokens: tokensFromVars } = useVars()
  const { mode } = useThemeMode()

  // Helper to extract dimension category from CSS var value
  const getDimensionCategory = useCallback((cssVarValue: string): string | null => {
    if (!cssVarValue) return null
    
    // Check if it's a brand dimension reference
    // Pattern: var(--recursica-brand-dimensions-{category}-{size})
    const brandMatch = cssVarValue.match(/--recursica-brand-dimensions-([^-]+)/)
    if (brandMatch) {
      return brandMatch[1] // Returns 'icon', 'general', etc.
    }
    
    // Check if it resolves to a brand dimension reference
    const resolved = readCssVarResolved(targetCssVar)
    if (resolved) {
      const resolvedBrandMatch = resolved.match(/--recursica-brand-dimensions-([^-]+)/)
      if (resolvedBrandMatch) {
        return resolvedBrandMatch[1]
      }
    }
    
    return null
  }, [targetCssVar])

  // Get available dimension tokens from theme JSON structure and convert to Token format
  const dimensionTokens = useMemo(() => {
    const options: Array<{ label: string; cssVar: string; value: string }> = []
    
    try {
      const propNameLower = propName.toLowerCase()
      
      // Get current dimension category from the CSS var value
      const currentValue = readCssVar(targetCssVar)
      const currentCategory = currentValue ? getDimensionCategory(currentValue) : null
      
      // For font-size or text-size props, only collect font size tokens from tokens.font.size
      if (propNameLower === 'font-size' || propNameLower === 'text-size') {
        const tokensRoot: any = (tokensFromVars as any)?.tokens || {}
        const fontSizes = tokensRoot?.font?.size || {}
        
        // Collect font size tokens (2xs, xs, sm, md, lg, xl, 2xl, 3xl, 4xl, 5xl, 6xl)
        Object.keys(fontSizes).forEach(sizeKey => {
          const sizeValue = fontSizes[sizeKey]
          if (sizeValue && typeof sizeValue === 'object' && '$value' in sizeValue) {
            const cssVar = `--recursica-tokens-font-size-${sizeKey}`
            const cssValue = readCssVar(cssVar)
            
            // Only add if the CSS var exists (has been generated)
            if (cssValue) {
              options.push({
                label: toSentenceCase(sizeKey),
                cssVar,
                value: `var(${cssVar})`,
              })
            }
          }
        })
        
        // Convert to Token format with numeric values for sorting
        const fontSizeTokens = options.map(opt => {
          const resolvedValue = readCssVarResolved(opt.cssVar)
          let numericValue: number | undefined
          
          if (resolvedValue) {
            const match = resolvedValue.match(/^(-?\d+(?:\.\d+)?)/)
            if (match) {
              numericValue = parseFloat(match[1])
            }
          }
          
          return {
            name: opt.cssVar,
            value: numericValue,
            label: opt.label,
          }
        })
        
        // Sort by numeric value (smallest to largest)
        return fontSizeTokens.sort((a, b) => {
          if (a.value !== undefined && b.value !== undefined) {
            return a.value - b.value
          }
          if (a.value !== undefined) return -1
          if (b.value !== undefined) return 1
          return (a.label || a.name).localeCompare(b.label || b.name)
        })
      }
      
      // For horizontal-padding, padding, item-gap, and divider-item-gap props, only collect general dimensions
      if (propNameLower === 'horizontal-padding' || propNameLower === 'padding' || 
          propNameLower === 'item-gap' || propNameLower === 'divider-item-gap') {
        const root: any = (theme as any)?.brand ? (theme as any).brand : theme
        const dimensions = root?.dimensions || {}
        const general = dimensions?.general || {}
        
        // Collect general dimensions (none, xs, sm, md, lg, xl, default)
        Object.keys(general).forEach(generalKey => {
          const generalValue = general[generalKey]
          if (generalValue && typeof generalValue === 'object' && '$value' in generalValue) {
            const cssVar = `--recursica-brand-dimensions-general-${generalKey}`
            const cssValue = readCssVar(cssVar)
            
            // Only add if the CSS var exists (has been generated)
            if (cssValue) {
              options.push({
                label: toSentenceCase(generalKey),
                cssVar,
                value: `var(${cssVar})`,
              })
            }
          }
        })
        
        // Convert to Token format with numeric values for sorting
        const generalTokens = options.map(opt => {
          const resolvedValue = readCssVarResolved(opt.cssVar)
          let numericValue: number | undefined
          
          if (resolvedValue) {
            const match = resolvedValue.match(/^(-?\d+(?:\.\d+)?)/)
            if (match) {
              numericValue = parseFloat(match[1])
            }
          }
          
          return {
            name: opt.cssVar,
            value: numericValue,
            label: opt.label,
          }
        })
        
        // Sort by numeric value (smallest to largest)
        return generalTokens.sort((a, b) => {
          if (a.value !== undefined && b.value !== undefined) {
            return a.value - b.value
          }
          if (a.value !== undefined) return -1
          if (b.value !== undefined) return 1
          return (a.label || a.name).localeCompare(b.label || b.name)
        })
      }
      
      // For icon prop, only collect icon dimensions
      if (propNameLower === 'icon') {
        const root: any = (theme as any)?.brand ? (theme as any).brand : theme
        const dimensions = root?.dimensions || {}
        const icons = dimensions?.icons || dimensions?.icon || {}
        
        // Collect icon dimensions (xs, sm, default, lg)
        Object.keys(icons).forEach(iconKey => {
          const iconValue = icons[iconKey]
          if (iconValue && typeof iconValue === 'object' && '$value' in iconValue) {
            const cssVar = `--recursica-brand-dimensions-icons-${iconKey}`
            const cssValue = readCssVar(cssVar)
            
            // Only add if the CSS var exists (has been generated)
            if (cssValue) {
              options.push({
                label: toSentenceCase(iconKey),
                cssVar,
                value: `var(${cssVar})`,
              })
            }
          }
        })
        
        // Convert to Token format with numeric values for sorting
        const iconTokens = options.map(opt => {
          const resolvedValue = readCssVarResolved(opt.cssVar)
          let numericValue: number | undefined
          
          if (resolvedValue) {
            const match = resolvedValue.match(/^(-?\d+(?:\.\d+)?)/)
            if (match) {
              numericValue = parseFloat(match[1])
            }
          }
          
          return {
            name: opt.cssVar,
            value: numericValue,
            label: opt.label,
          }
        })
        
        // Sort by numeric value (smallest to largest)
        return iconTokens.sort((a, b) => {
          if (a.value !== undefined && b.value !== undefined) {
            return a.value - b.value
          }
          if (a.value !== undefined) return -1
          if (b.value !== undefined) return 1
          return (a.label || a.name).localeCompare(b.label || b.name)
        })
      }
      
      // For track-inner-padding, label-switch-gap, or Label spacing props (bottom-padding, gutter, vertical-padding), only collect general dimensions (none, default, sm, md, lg, xl)
      if (propNameLower === 'track-inner-padding' || propNameLower === 'label-switch-gap' || 
          propNameLower === 'bottom-padding' || propNameLower === 'gutter' || propNameLower === 'vertical-padding') {
        const root: any = (theme as any)?.brand ? (theme as any).brand : theme
        const dimensions = root?.dimensions || {}
        const generalDims = ['none', 'default', 'sm', 'md', 'lg', 'xl']
        
        // Collect general dimensions
        if (dimensions.general && typeof dimensions.general === 'object') {
          generalDims.forEach(dim => {
            if (dimensions.general[dim] && typeof dimensions.general[dim] === 'object' && '$value' in dimensions.general[dim]) {
              const cssVar = `--recursica-brand-dimensions-general-${dim}`
              const cssValue = readCssVar(cssVar)
              if (cssValue) {
                options.push({
                  label: toSentenceCase(dim),
                  cssVar,
                  value: `var(${cssVar})`,
                })
              }
            }
          })
        }
        
        // Convert to Token format with numeric values for sorting
        const generalTokens = options.map(opt => {
          const resolvedValue = readCssVarResolved(opt.cssVar)
          let numericValue: number | undefined
          
          if (resolvedValue) {
            const match = resolvedValue.match(/^(-?\d+(?:\.\d+)?)/)
            if (match) {
              numericValue = parseFloat(match[1])
            }
          }
          
          return {
            name: opt.cssVar,
            value: numericValue,
            label: opt.label,
          }
        })
        
        // Sort by numeric value (smallest to largest, 0 to largest)
        return generalTokens.sort((a, b) => {
          if (a.value !== undefined && b.value !== undefined) {
            return a.value - b.value
          }
          if (a.value !== undefined) return -1
          if (b.value !== undefined) return 1
          return (a.label || a.name).localeCompare(b.label || a.name)
        })
      }
      
      // For thumb-border-radius or track-border-radius, only collect border-radius dimensions
      if (propNameLower === 'thumb-border-radius' || propNameLower === 'track-border-radius' || propNameLower === 'border-radius') {
        const root: any = (theme as any)?.brand ? (theme as any).brand : theme
        const dimensions = root?.dimensions || {}
        const borderRadius = dimensions['border-radius'] || {}
        
        // Collect border-radius dimensions (none, sm, default, lg, xl)
        Object.keys(borderRadius).forEach(radiusKey => {
          const radiusValue = borderRadius[radiusKey]
          if (radiusValue && typeof radiusValue === 'object' && '$value' in radiusValue) {
            const cssVar = `--recursica-brand-dimensions-border-radius-${radiusKey}`
            const cssValue = readCssVar(cssVar)
            
            // Only add if the CSS var exists (has been generated)
            if (cssValue) {
              options.push({
                label: toSentenceCase(radiusKey),
                cssVar,
                value: `var(${cssVar})`,
              })
            }
          }
        })
        
        // Convert to Token format with numeric values for sorting
        const borderRadiusTokens = options.map(opt => {
          const resolvedValue = readCssVarResolved(opt.cssVar)
          let numericValue: number | undefined
          
          if (resolvedValue) {
            const match = resolvedValue.match(/^(-?\d+(?:\.\d+)?)/)
            if (match) {
              numericValue = parseFloat(match[1])
            }
          }
          
          return {
            name: opt.cssVar,
            value: numericValue,
            label: opt.label,
          }
        })
        
        // Sort by numeric value (smallest to largest, 0 to largest)
        // Put "none" first if it exists (value 0)
        return borderRadiusTokens.sort((a, b) => {
          // Handle "none" specially - it should be first
          if (a.label.toLowerCase() === 'none') return -1
          if (b.label.toLowerCase() === 'none') return 1
          
          if (a.value !== undefined && b.value !== undefined) {
            return a.value - b.value
          }
          if (a.value !== undefined) return -1
          if (b.value !== undefined) return 1
          return (a.label || a.name).localeCompare(b.label || a.name)
        })
      }
      
      // For other props, collect dimension tokens from theme
      const root: any = (theme as any)?.brand ? (theme as any).brand : theme
      const dimensions = root?.dimensions || {}
      
      // Helper to recursively collect dimension options
      const collectDimensions = (obj: any, prefix: string[] = []) => {
        if (!obj || typeof obj !== 'object') return
        
        Object.keys(obj).forEach(key => {
          if (key.startsWith('$')) return
          
          const currentPath = [...prefix, key]
          const value = obj[key]
          
          // If this is a dimension value object
          if (value && typeof value === 'object' && '$value' in value && '$type' in value) {
            const cssVar = `--recursica-brand-dimensions-${currentPath.join('-')}`
            const cssValue = readCssVar(cssVar)
            
            // Only add if the CSS var exists (has been generated)
            if (cssValue) {
              options.push({
                label: toSentenceCase(key),
                cssVar,
                value: `var(${cssVar})`,
              })
            }
          } else if (typeof value === 'object') {
            // Continue traversing
            collectDimensions(value, currentPath)
          }
        })
      }
      
      // First, check if this prop name matches a dimension category (e.g., "border-radius")
      // Skip border-radius, thumb-border-radius, track-border-radius, track-inner-padding, label-switch-gap, icon, thumb-icon-size, height, and Label spacing props since they're handled above or should use general dimensions
      if (propNameLower !== 'border-radius' && propNameLower !== 'thumb-border-radius' && propNameLower !== 'track-border-radius' && 
          propNameLower !== 'track-inner-padding' && propNameLower !== 'label-switch-gap' && propNameLower !== 'icon' && propNameLower !== 'thumb-icon-size' &&
          propNameLower !== 'height' && propNameLower !== 'bottom-padding' && propNameLower !== 'gutter' && propNameLower !== 'vertical-padding' &&
          dimensions[propNameLower] && typeof dimensions[propNameLower] === 'object') {
        collectDimensions(dimensions[propNameLower], [propNameLower])
      }
      
      // For non-border-radius, non-horizontal-padding, non-padding, non-item-gap, non-divider-item-gap, non-track-inner-padding, non-label-switch-gap, non-icon, non-height, and non-Label spacing props, also collect general dimensions (none, default, sm, md, lg, xl) from the "general" node
      // Note: height and Label spacing props (bottom-padding, gutter, vertical-padding) should use general dimensions, not icon dimensions
      if (propNameLower !== 'border-radius' && propNameLower !== 'thumb-border-radius' && propNameLower !== 'track-border-radius' &&
          propNameLower !== 'horizontal-padding' && propNameLower !== 'padding' && propNameLower !== 'item-gap' && propNameLower !== 'divider-item-gap' &&
          propNameLower !== 'track-inner-padding' && propNameLower !== 'label-switch-gap' && propNameLower !== 'icon' && propNameLower !== 'thumb-icon-size') {
        // For height and Label spacing props, only collect general dimensions (skip checking dimensions.height, dimensions.gutter, etc.)
        if (propNameLower === 'height' || propNameLower === 'bottom-padding' || propNameLower === 'gutter' || propNameLower === 'vertical-padding') {
          const generalDims = ['none', 'default', 'sm', 'md', 'lg', 'xl']
          if (dimensions.general && typeof dimensions.general === 'object') {
            generalDims.forEach(dim => {
              if (dimensions.general[dim] && typeof dimensions.general[dim] === 'object' && '$value' in dimensions.general[dim]) {
                const cssVar = `--recursica-brand-dimensions-general-${dim}`
                const cssValue = readCssVar(cssVar)
                if (cssValue) {
                  options.push({
                    label: toSentenceCase(dim),
                    cssVar,
                    value: `var(${cssVar})`,
                  })
                }
              }
            })
          }
        } else {
          // For other props, collect general dimensions
          const generalDims = ['none', 'default', 'sm', 'md', 'lg', 'xl']
          if (dimensions.general && typeof dimensions.general === 'object') {
            generalDims.forEach(dim => {
              if (dimensions.general[dim] && typeof dimensions.general[dim] === 'object' && '$value' in dimensions.general[dim]) {
                const cssVar = `--recursica-brand-dimensions-general-${dim}`
                const cssValue = readCssVar(cssVar)
                if (cssValue) {
                  options.push({
                    label: toSentenceCase(dim),
                    cssVar,
                    value: `var(${cssVar})`,
                  })
                }
              }
            })
          }
        }
      }
      
      // Also collect all nested dimensions (like icon.default, general.sm, etc.)
      // But skip this for border-radius, thumb-border-radius, track-border-radius, horizontal-padding, padding, item-gap, divider-item-gap, track-inner-padding, label-switch-gap, icon, thumb-icon-size, height, and Label spacing props since we only want specific tokens
      if (propNameLower !== 'border-radius' && propNameLower !== 'thumb-border-radius' && propNameLower !== 'track-border-radius' &&
          propNameLower !== 'horizontal-padding' && propNameLower !== 'padding' && propNameLower !== 'item-gap' && propNameLower !== 'divider-item-gap' &&
          propNameLower !== 'track-inner-padding' && propNameLower !== 'label-switch-gap' && propNameLower !== 'icon' && propNameLower !== 'thumb-icon-size' && 
          propNameLower !== 'height' && propNameLower !== 'bottom-padding' && propNameLower !== 'gutter' && propNameLower !== 'vertical-padding') {
        collectDimensions(dimensions, [])
      }
      
      // Filter out dimensions that don't make sense for this prop
      // Remove dimensions like "gutter.horizontal", "gutter.vertical" which are layout-specific
      // and not relevant for general spacing/sizing props
      const filteredOptions = options.filter(opt => {
        const cssVarName = opt.cssVar.replace('--recursica-brand-dimensions-', '')
        const cssVarParts = cssVarName.split('-')
        const firstPart = cssVarParts[0]
        
        // If we have a current category, only show tokens from that category
        if (currentCategory) {
          // Check if this token belongs to the current category
          // e.g., if currentCategory is 'icon', only show 'icon-*' tokens
          // e.g., if currentCategory is 'general', only show 'general-*' tokens
          if (firstPart !== currentCategory) {
            return false
          }
        }
        
        // For border-radius, thumb-border-radius, or track-border-radius props, only keep border-radius specific tokens
        if (propNameLower === 'border-radius' || propNameLower === 'thumb-border-radius' || propNameLower === 'track-border-radius') {
          // Only keep tokens that start with "border-radius-"
          return firstPart === 'border' && cssVarParts[1] === 'radius'
        }
        
        // For horizontal-padding, padding, item-gap, and divider-item-gap props, only keep general tokens
        if (propNameLower === 'horizontal-padding' || propNameLower === 'padding' || 
            propNameLower === 'item-gap' || propNameLower === 'divider-item-gap') {
          // Only keep tokens that start with "general-"
          return firstPart === 'general'
        }
        
        // For icon or thumb-icon-size prop, only keep icon tokens
        if (propNameLower === 'icon' || propNameLower === 'thumb-icon-size') {
          // Only keep tokens that start with "icon-"
          return firstPart === 'icon'
        }
        
        // Always keep general dimensions (default, sm, md, lg, xl)
        // These are now under dimensions.general, so CSS vars are --recursica-brand-dimensions-general-*
        const generalDims = ['default', 'sm', 'md', 'lg', 'xl']
        // Check if it's a general dimension (either "general-{dim}" or just "{dim}" for backwards compatibility)
        if (firstPart === 'general' && generalDims.includes(cssVarParts[1])) {
          return true
        }
        // Also check for direct general dims (for backwards compatibility if any exist)
        if (generalDims.includes(cssVarName) || generalDims.includes(firstPart)) {
          return true
        }
        
        // Keep if it matches the prop name category (e.g., "border-radius" for "border-radius" prop)
        if (propNameLower) {
          const propParts = propNameLower.split('-')
          // Check if any part of the CSS var matches any part of the prop name
          if (cssVarParts.some(part => propParts.includes(part) || propParts.some(pp => part.includes(pp)))) {
            return true
          }
        }
        
        // Keep common spacing/sizing categories (general.*, icon.*)
        const commonCategories = ['general', 'icon']
        if (commonCategories.includes(firstPart)) {
          return true
        }
        
        // Filter out layout-specific categories like "gutter" that aren't relevant for component props
        const layoutCategories = ['gutter']
        if (layoutCategories.includes(firstPart)) {
          return false
        }
        
        // Keep other dimensions by default (border-radius, etc.)
        return true
      })
      
      // Replace options with filtered list
      options.length = 0
      options.push(...filteredOptions)
      
    } catch (error) {
      console.error('Error loading dimension options:', error)
    }
    
    // Remove duplicates
    const uniqueOptions = Array.from(
      new Map(options.map(opt => [opt.cssVar, opt])).values()
    )
    
    // Convert to Token format with numeric values for sorting
    const tokens = uniqueOptions.map(opt => {
      // Resolve CSS var to get numeric value
      const resolvedValue = readCssVarResolved(opt.cssVar)
      let numericValue: number | undefined
      
      if (resolvedValue) {
        // Extract number from value like "16px" or "1.5rem"
        const match = resolvedValue.match(/^(-?\d+(?:\.\d+)?)/)
        if (match) {
          numericValue = parseFloat(match[1])
        }
      }
      
      return {
        name: opt.cssVar, // Use CSS var name as token name
        value: numericValue,
        label: opt.label,
      }
    })
    
    // Sort by numeric value (lowest to highest)
    // "none" (0px) will naturally sort first
    return tokens.sort((a, b) => {
      if (a.value !== undefined && b.value !== undefined) {
        return a.value - b.value
      }
      if (a.value !== undefined) return -1
      if (b.value !== undefined) return 1
      return (a.label || a.name).localeCompare(b.label || b.name)
    })
  }, [theme, tokensFromVars, propName, mode, targetCssVar, getDimensionCategory])

  // Track slider position in local state - initialized from CSS var once, then controlled by user
  const [selectedToken, setSelectedToken] = useState<string | undefined>(undefined)
  const [pixelValue, setPixelValue] = useState<number>(0)
  const [isPixelMode, setIsPixelMode] = useState<boolean>(false)
  
  // Helper to check if a value is a theme CSS var reference
  const isThemeVar = (value: string): boolean => {
    return value.trim().startsWith('var(--recursica-')
  }
  
  // Helper to extract pixel value from CSS value
  const extractPixelValue = (value: string): number => {
    const match = value.match(/^(-?\d+(?:\.\d+)?)px$/i)
    if (match) {
      return parseFloat(match[1])
    }
    return 0
  }
  
  // Helper to read CSS var and set initial value
  const readInitialValue = useCallback(() => {
    // Read CSS var value - checks inline styles first, then computed styles (from JSON defaults)
    const currentValue = readCssVar(targetCssVar)
    const propNameLower = propName.toLowerCase()
    
    if (!currentValue || currentValue === 'null' || currentValue === '') {
      // If no value found, try to read the resolved value (might be a token reference)
      const resolvedValue = readCssVarResolved(targetCssVar)
      if (resolvedValue) {
        // We have a resolved value, treat it as the current value
        const pxValue = extractPixelValue(resolvedValue)
        if (pxValue > 0) {
          setIsPixelMode(true)
          const maxPixelValue = propNameLower === 'max-width' ? 500 : 200
          const minPixelValue = minPixelValueProp ?? 0
          setPixelValue(Math.max(minPixelValue, Math.min(maxPixelValue, pxValue)))
          return
        }
      }
      
      // For divider-item-gap, padding, item-gap, vertical-padding, and horizontal-padding, null means "none"
      // Find the "none" token from Brand.json (general-none)
      if (propNameLower === 'divider-item-gap' || 
          propNameLower === 'padding' || 
          propNameLower === 'item-gap' ||
          propNameLower === 'horizontal-padding') {
        // These use general tokens
        const noneToken = dimensionTokens.find(t => t.name.includes('general-none'))
        setSelectedToken(noneToken?.name)
        setPixelValue(0)
        setIsPixelMode(false)
        return
      } else if (propNameLower === 'vertical-padding') {
        // This uses general tokens
        const noneToken = dimensionTokens.find(t => t.name.includes('general-none'))
        setSelectedToken(noneToken?.name)
        setPixelValue(0)
        setIsPixelMode(false)
        return
      } else {
        setSelectedToken(undefined)
        // If still no value, default to pixel mode with a reasonable default
        // This ensures the slider is always functional
        const defaultPixelValue = 8 // Default to 8px so slider is movable
        setPixelValue(defaultPixelValue)
        setIsPixelMode(true)
      }
      return
    }
    
    // Check if it's a theme var or raw pixel value
    if (isThemeVar(currentValue)) {
      // Theme var mode - find matching token
      if (dimensionTokens.length === 0) {
        // No tokens available, fall back to pixel mode
        setIsPixelMode(true)
        const resolvedValue = readCssVarResolved(targetCssVar)
        const pxValue = resolvedValue ? extractPixelValue(resolvedValue) : 8
        const maxPixelValue = propName.toLowerCase() === 'max-width' ? 500 : 200
        const minPixelValue = minPixelValueProp ?? 0
        setPixelValue(Math.max(minPixelValue, Math.min(maxPixelValue, pxValue || 8)))
        setSelectedToken(undefined)
        return
      }
      
      setIsPixelMode(false)
      
      // Resolve the current value to see what it actually points to
      const resolvedValue = readCssVarResolved(targetCssVar)
      
      const matchingToken = dimensionTokens.find(token => {
        // Exact match with var() wrapper
        if (currentValue === `var(${token.name})` || currentValue === token.name) return true
        
        // Check resolved value matches token name
        if (resolvedValue && (resolvedValue === `var(${token.name})` || resolvedValue === token.name)) return true
        
        // Check if current value contains the CSS var reference
        const varName = token.name.replace('--recursica-brand-dimensions-', '').replace('--recursica-tokens-size-', '').replace('--recursica-tokens-font-size-', '')
        if (currentValue.includes(varName) || currentValue.includes(token.name)) return true
        
        // Check if resolved value contains the token name
        if (resolvedValue && (resolvedValue.includes(varName) || resolvedValue.includes(token.name))) return true
        
        // Try to match by resolving the token and comparing resolved values
        const tokenResolved = readCssVarResolved(token.name)
        if (resolvedValue && tokenResolved && resolvedValue === tokenResolved) return true
        
        return false
      })
      
      if (matchingToken) {
        setSelectedToken(matchingToken.name)
      } else {
        // Token not found, fall back to pixel mode with resolved value
        setIsPixelMode(true)
        const pxValue = resolvedValue ? extractPixelValue(resolvedValue) : 8
        const maxPixelValue = propName.toLowerCase() === 'max-width' ? 500 : 200
        const minPixelValue = minPixelValueProp ?? 0
        setPixelValue(Math.max(minPixelValue, Math.min(maxPixelValue, pxValue || 8)))
        setSelectedToken(undefined)
      }
    } else {
      // Raw pixel mode
      setIsPixelMode(true)
      const pxValue = extractPixelValue(currentValue)
      // Determine max pixel value based on prop name
      const maxPixelValue = propName.toLowerCase() === 'max-width' ? 500 : 200
      const minPixelValue = minPixelValueProp ?? 0
      setPixelValue(Math.max(minPixelValue, Math.min(maxPixelValue, pxValue || 8))) // Clamp to minPixelValue-maxPixelValue, default to 8 if 0
    }
  }, [targetCssVar, dimensionTokens, propName, minPixelValueProp])
  
  // Read initial value when component mounts or targetCssVar changes
  useEffect(() => {
    readInitialValue()
  }, [readInitialValue])
  
  // Listen for reset events to re-read initial value
  useEffect(() => {
    const handleReset = () => {
      // Re-read CSS var after reset (will read from computed styles, which come from JSON)
      readInitialValue()
    }
    
    window.addEventListener('cssVarsReset', handleReset)
    return () => window.removeEventListener('cssVarsReset', handleReset)
  }, [readInitialValue])

  // One-way binding: slider changes → update local state AND CSS var
  const handleTokenChange = (tokenName: string) => {
    setSelectedToken(tokenName)
    
    const cssVars = targetCssVars.length > 0 ? targetCssVars : [targetCssVar]
    
    // Find the token (including "none" from Brand.json)
    const token = dimensionTokens.find(t => t.name === tokenName)
    if (token) {
      // Check if this is the "none" token (value 0px)
      if (token.value === 0 || token.name.includes('-none')) {
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
  
  // Handle pixel slider changes
  const handlePixelChange = (value: number) => {
    // Update local state so slider position updates immediately
    setPixelValue(value)
    
    // Update CSS vars directly with pixel value
    const cssVars = targetCssVars.length > 0 ? targetCssVars : [targetCssVar]
    cssVars.forEach(cssVar => {
      updateCssVar(cssVar, `${value}px`)
    })
    // Dispatch event to notify components of CSS var updates
    window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
      detail: { cssVars }
    }))
  }

  // Determine max pixel value based on prop name or provided prop
  // max-width, label-width can go up to 500px, others default to 200px
  const maxPixelValue = maxPixelValueProp ?? (propName.toLowerCase() === 'max-width' || 
    propName.toLowerCase() === 'label-width' ? 500 : 200)
  const minPixelValue = minPixelValueProp ?? 0

  // Calculate sortedTokens and getValueLabel BEFORE any early returns
  // This ensures hooks are always called in the same order
  const sortedTokens = useMemo(() => {
    return [...dimensionTokens].sort((a, b) => {
      if (a.value !== undefined && b.value !== undefined) {
        return a.value - b.value
      }
      if (a.value !== undefined) return -1
      if (b.value !== undefined) return 1
      return 0
    })
  }, [dimensionTokens])
  
  const foundIdx = sortedTokens.length > 0 ? sortedTokens.findIndex(t => t.name === selectedToken) : -1
  const currentIdx = foundIdx >= 0 ? foundIdx : 0
  const getValueLabel = useCallback((value: number) => {
    if (sortedTokens.length === 0) return '—'
    const token = sortedTokens[Math.round(value)]
    return token?.label || token?.name.split('-').pop() || token?.name || String(value)
  }, [sortedTokens])
  const minToken = sortedTokens[0]
  const maxToken = sortedTokens.length > 0 ? sortedTokens[sortedTokens.length - 1] : undefined

  // Render pixel slider for raw pixel values
  if (isPixelMode) {
    return (
      <div className="control-group">
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, opacity: 0.7 }}>{label}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="range"
              min={minPixelValue}
              max={maxPixelValue}
              step={1}
              value={pixelValue}
              onChange={(e) => handlePixelChange(Number(e.target.value))}
              style={{ flex: 1 }}
            />
            <input
              type="number"
              min={minPixelValue}
              max={maxPixelValue}
              step={1}
              value={pixelValue}
              onChange={(e) => {
                const value = Number(e.target.value)
                if (!isNaN(value)) {
                  const clampedValue = Math.max(minPixelValue, Math.min(maxPixelValue, value))
                  handlePixelChange(clampedValue)
                }
              }}
              onBlur={(e) => {
                // Ensure value is valid on blur
                const value = Number(e.target.value)
                if (isNaN(value) || value < minPixelValue) {
                  handlePixelChange(minPixelValue)
                } else if (value > maxPixelValue) {
                  handlePixelChange(maxPixelValue)
                }
              }}
              style={{
                width: 60,
                padding: '4px 8px',
                border: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-thickness, var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-thickness)) solid var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-color, var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-color))`,
                borderRadius: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-radius, var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-radius))`,
                background: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-surface, var(--recursica-brand-themes-${mode}-layer-layer-3-property-surface))`,
                color: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-text-color, var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-text-color))`,
                fontSize: 12,
                textAlign: 'right',
              }}
            />
            <span style={{ fontSize: 12, opacity: 0.7, minWidth: 20 }}>px</span>
          </div>
        </label>
      </div>
    )
  }

  // Render token slider for theme vars
  // If no tokens available, fall back to pixel mode
  if (dimensionTokens.length === 0) {
    // No tokens, use pixel mode
    const resolvedValue = readCssVarResolved(targetCssVar)
    const pxValue = resolvedValue ? extractPixelValue(resolvedValue) : (pixelValue || 8)
    const maxPixelValue = propName.toLowerCase() === 'max-width' ? 500 : 200
    const minPixelValue = minPixelValueProp ?? 0
    const currentPixelValue = Math.max(minPixelValue, Math.min(maxPixelValue, pxValue || 8))
    
    return (
      <div className="control-group">
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, opacity: 0.7 }}>{label}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="range"
              min={minPixelValue}
              max={maxPixelValue}
              step={1}
              value={currentPixelValue}
              onChange={(e) => handlePixelChange(Number(e.target.value))}
              style={{ flex: 1 }}
            />
            <input
              type="number"
              min={minPixelValue}
              max={maxPixelValue}
              step={1}
              value={currentPixelValue}
              onChange={(e) => {
                const value = Number(e.target.value)
                if (!isNaN(value)) {
                  const clampedValue = Math.max(minPixelValue, Math.min(maxPixelValue, value))
                  handlePixelChange(clampedValue)
                }
              }}
              onBlur={(e) => {
                const value = Number(e.target.value)
                if (isNaN(value) || value < minPixelValue) {
                  handlePixelChange(minPixelValue)
                } else if (value > maxPixelValue) {
                  handlePixelChange(maxPixelValue)
                }
              }}
              style={{
                width: 60,
                padding: '4px 8px',
                border: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-thickness, var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-thickness)) solid var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-color, var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-color))`,
                borderRadius: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-radius, var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-radius))`,
                background: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-surface, var(--recursica-brand-themes-${mode}-layer-layer-3-property-surface))`,
                color: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-text-color, var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-text-color))`,
                fontSize: 12,
                textAlign: 'right',
              }}
            />
            <span style={{ fontSize: 12, opacity: 0.7, minWidth: 20 }}>px</span>
          </div>
        </label>
      </div>
    )
  }
  
  // Don't render if no tokens available
  if (sortedTokens.length === 0) {
    return null
  }
  
  return (
    <Slider
      value={currentIdx}
      onChange={(val) => {
        const idx = typeof val === 'number' ? val : val[0]
        const token = sortedTokens[Math.round(idx)]
        if (token) {
          handleTokenChange(token.name)
        }
      }}
      min={0}
      max={Math.max(0, sortedTokens.length - 1)}
      step={1}
      layer="layer-3"
      layout="stacked"
      showInput={false}
      showValueLabel={true}
      valueLabel={getValueLabel}
      minLabel={minToken?.label || 'None'}
      maxLabel={maxToken?.label || 'Xl'}
      label={<Label layer="layer-3" layout="stacked">{label}</Label>}
    />
  )
}
