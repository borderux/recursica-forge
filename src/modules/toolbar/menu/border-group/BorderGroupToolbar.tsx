/**
 * BorderGroupToolbar Component
 * 
 * A reusable toolbar for editing border properties (border-size, border-radius, optional border-color)
 * for component border groups.
 */

import { useMemo, useState, useEffect, useCallback } from 'react'
import { readCssVar, readCssVarResolved } from '../../../../core/css/readCssVar'
import { updateCssVar } from '../../../../core/css/updateCssVar'
import { useVars } from '../../../vars/VarsContext'
import { useThemeMode } from '../../../theme/ThemeModeContext'
import { ComponentProp, parseComponentStructure } from '../../utils/componentToolbarUtils'
import { buildComponentCssVarPath } from '../../../../components/utils/cssVarNames'
import { Slider } from '../../../../components/adapters/Slider'
import { Label } from '../../../../components/adapters/Label'
import PaletteColorControl from '../../../forms/PaletteColorControl'
import BrandBorderRadiusSlider from '../../utils/BrandBorderRadiusSlider'
import type { ToolbarPropConfig } from '../../utils/loadToolbarConfig'
import './BorderGroupToolbar.css'

// Helper function to resolve CSS variables for a prop based on selected variants
// This ensures correct resolution for variant-specific props (like Avatar with nested variants)
function getCssVarsForProp(
  propToCheck: ComponentProp,
  componentName: string,
  selectedVariants: Record<string, string>,
  selectedLayer: string
): string[] {
  const structure = parseComponentStructure(componentName)

  // Find matching prop based on selected variants and layer
  const matchingProp = structure.props.find(p => {
    if (p.name !== propToCheck.name || p.category !== propToCheck.category) {
      return false
    }

    // Special handling for Avatar with nested variants (style and style-secondary)
    if (componentName.toLowerCase() === 'avatar' && propToCheck.category === 'colors') {
      const styleVariant = selectedVariants['style']
      const styleSecondaryVariant = selectedVariants['style-secondary']

      // Must have style variant in path
      if (styleVariant && !p.path.includes(styleVariant)) return false

      // For text/icon variants, must also have style-secondary variant in path
      if (styleSecondaryVariant && styleVariant && (styleVariant === 'text' || styleVariant === 'icon')) {
        if (!p.path.includes(styleSecondaryVariant)) return false
      }
    } else {
      // Check variant matching for other components
      if (p.isVariantSpecific && p.variantProp) {
        const selectedVariant = selectedVariants[p.variantProp]
        if (selectedVariant) {
          const variantInPath = p.path.find(pathPart => pathPart === selectedVariant)
          if (!variantInPath) return false
        } else {
          // If no variant selected but prop is variant-specific, try to match default state
          // For TextField and NumberInput, default state is 'default'
          if ((componentName.toLowerCase() === 'text-field' || componentName.toLowerCase() === 'number-input') && p.variantProp === 'states') {
            if (!p.path.includes('default')) return false
          } else {
            // For other components, require variant to be selected
            return false
          }
        }
      }

      // Also check propToCheck's variant requirements
      if (propToCheck.isVariantSpecific && propToCheck.variantProp) {
        const selectedVariant = selectedVariants[propToCheck.variantProp]
        if (selectedVariant) {
          const variantInPath = p.path.find(pathPart => pathPart === selectedVariant)
          if (!variantInPath) return false
        } else {
          // If no variant selected but propToCheck is variant-specific, try to match default state
          if ((componentName.toLowerCase() === 'text-field' || componentName.toLowerCase() === 'number-input') && propToCheck.variantProp === 'states') {
            if (!p.path.includes('default')) return false
          } else {
            return false
          }
        }
      }
    }

    // Check layer matching for color props
    if (propToCheck.category === 'colors') {
      const layerInPath = p.path.find(pathPart => pathPart.startsWith('layer-'))
      if (layerInPath) {
        if (layerInPath !== selectedLayer) return false
      }
    }

    return true
  })

  return matchingProp ? [matchingProp.cssVar] : [propToCheck.cssVar]
}

interface BorderGroupToolbarProps {
  componentName: string
  prop: ComponentProp // The parent "border" prop
  selectedVariants: Record<string, string>
  selectedLayer: string
  groupedPropsConfig?: Record<string, ToolbarPropConfig> // Config for grouped props with visibility
  config?: {
    includeColor?: boolean // Whether to include border-color control
    propNameMapping?: {
      size?: string // default: "border-size"
      radius?: string // default: "border-radius"
      color?: string // default: "border-color"
    }
  }
  onClose?: () => void
}

export default function BorderGroupToolbar({
  componentName,
  prop,
  selectedVariants,
  selectedLayer,
  groupedPropsConfig,
  config = {},
  onClose,
}: BorderGroupToolbarProps) {
  const { mode } = useThemeMode()
  const { tokens } = useVars()

  const {
    includeColor = false,
    propNameMapping = {},
  } = config

  const sizePropName = propNameMapping.size || 'border-size'
  const radiusPropName = propNameMapping.radius || 'border-radius'
  const colorPropName = propNameMapping.color || 'border-color'

  // Find border-related props from component structure
  const structure = useMemo(() => parseComponentStructure(componentName), [componentName])

  const borderSizeProp = useMemo(() => {
    return structure.props.find(p => {
      if (p.name.toLowerCase() !== sizePropName.toLowerCase()) return false
      // Match variant if prop is variant-specific
      if (p.isVariantSpecific && p.variantProp) {
        const selectedVariant = selectedVariants[p.variantProp]
        if (!selectedVariant) return false
        if (!p.path.includes(selectedVariant)) return false
      }
      // Match layer for color props
      if (p.category === 'colors') {
        const layerInPath = p.path.find(pathPart => pathPart.startsWith('layer-'))
        if (layerInPath && layerInPath !== selectedLayer) return false
      }
      return true
    })
  }, [structure, sizePropName, selectedVariants, selectedLayer])

  const borderRadiusProp = useMemo(() => {
    return structure.props.find(p => {
      if (p.name.toLowerCase() !== radiusPropName.toLowerCase()) return false
      if (p.isVariantSpecific && p.variantProp) {
        const selectedVariant = selectedVariants[p.variantProp]
        if (!selectedVariant) return false
        if (!p.path.includes(selectedVariant)) return false
      }
      return true
    })
  }, [structure, radiusPropName, selectedVariants])

  const borderColorProp = useMemo(() => {
    if (!includeColor) return undefined
    // Check for "border-color" prop name (standardized name)
    // Also accept "border" for backward compatibility
    return structure.props.find(p => {
      const propNameLower = p.name.toLowerCase()
      // Accept "border-color" (standard) or "border" (legacy)
      if (propNameLower !== colorPropName.toLowerCase() &&
        propNameLower !== 'border-color' &&
        propNameLower !== 'border') {
        return false
      }
      if (p.category !== 'colors') return false

      // Special handling for Avatar with nested variants (style and style-secondary)
      if (componentName.toLowerCase() === 'avatar') {
        const styleVariant = selectedVariants['style']
        const styleSecondaryVariant = selectedVariants['style-secondary']

        // Must have style variant in path
        if (styleVariant && !p.path.includes(styleVariant)) return false

        // For text/icon variants, must also have style-secondary variant in path
        if (styleSecondaryVariant && styleVariant && (styleVariant === 'text' || styleVariant === 'icon')) {
          if (!p.path.includes(styleSecondaryVariant)) return false
        }
      } else {
        // Handle variant-specific props for other components (like TextField with states variant)
        if (p.isVariantSpecific && p.variantProp) {
          const selectedVariant = selectedVariants[p.variantProp]
          // If variant is required but not selected, don't match
          // But if no variant is selected, try to match default/fallback props
          if (selectedVariant) {
            // Check if path includes the selected variant
            if (!p.path.includes(selectedVariant)) return false
          } else {
            // If no variant selected but prop is variant-specific, try to match default state
            // For TextField and NumberInput, default state is 'default'
            if ((componentName.toLowerCase() === 'text-field' || componentName.toLowerCase() === 'number-input') && p.variantProp === 'states') {
              // Try to match default state if no state is selected
              if (!p.path.includes('default')) return false
            } else {
              // For other components, require variant to be selected
              return false
            }
          }
        }
      }

      const layerInPath = p.path.find(pathPart => pathPart.startsWith('layer-'))
      if (layerInPath && layerInPath !== selectedLayer) return false
      return true
    })
  }, [structure, colorPropName, includeColor, selectedVariants, selectedLayer, componentName])

  // Get CSS variables
  // Use getCssVarsForProp to ensure correct resolution for variant-specific props (like Button border-size, Avatar border-color)
  const borderSizeCssVars = useMemo(() => {
    if (!borderSizeProp) return []
    return getCssVarsForProp(borderSizeProp, componentName, selectedVariants, selectedLayer)
  }, [borderSizeProp, componentName, selectedVariants, selectedLayer])

  const borderRadiusCssVars = useMemo(() => {
    if (!borderRadiusProp) return []
    return getCssVarsForProp(borderRadiusProp, componentName, selectedVariants, selectedLayer)
  }, [borderRadiusProp, componentName, selectedVariants, selectedLayer])

  const borderColorCssVars = useMemo(() => {
    if (!borderColorProp) return []
    return getCssVarsForProp(borderColorProp, componentName, selectedVariants, selectedLayer)
  }, [borderColorProp, componentName, selectedVariants, selectedLayer])

  const borderSizeVar = borderSizeCssVars[0] || borderSizeProp?.cssVar || ''
  const borderRadiusVar = borderRadiusCssVars[0] || borderRadiusProp?.cssVar || ''
  const borderColorVar = borderColorCssVars[0] || borderColorProp?.cssVar || ''

  // Border Size Control
  const BorderSizeControl = useMemo(() => {
    if (!borderSizeVar) return null

    return () => {
      const [value, setValue] = useState(() => {
        const currentValue = readCssVar(borderSizeVar)
        const resolvedValue = readCssVarResolved(borderSizeVar)
        const valueStr = resolvedValue || currentValue || '0px'
        const match = valueStr.match(/^(-?\d+(?:\.\d+)?)px$/i)
        return match ? Math.max(0, Math.min(10, parseFloat(match[1]))) : 0
      })

      useEffect(() => {
        const handleUpdate = () => {
          const currentValue = readCssVar(borderSizeVar)
          const resolvedValue = readCssVarResolved(borderSizeVar)
          const valueStr = resolvedValue || currentValue || '0px'
          const match = valueStr.match(/^(-?\d+(?:\.\d+)?)px$/i)
          if (match) {
            setValue(Math.max(0, Math.min(10, parseFloat(match[1]))))
          }
        }
        window.addEventListener('cssVarsUpdated', handleUpdate)
        return () => window.removeEventListener('cssVarsUpdated', handleUpdate)
      }, [borderSizeVar])

      const handleChange = useCallback((val: number | [number, number]) => {
        const numValue = typeof val === 'number' ? val : val[0]
        const clampedValue = Math.max(0, Math.min(10, Math.round(numValue)))
        setValue(clampedValue)
        updateCssVar(borderSizeVar, `${clampedValue}px`)
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
          detail: { cssVars: [borderSizeVar] }
        }))
      }, [borderSizeVar])

      const handleChangeCommitted = useCallback((val: number | [number, number]) => {
        const numValue = typeof val === 'number' ? val : val[0]
        const clampedValue = Math.max(0, Math.min(10, Math.round(numValue)))
        setValue(clampedValue)
        updateCssVar(borderSizeVar, `${clampedValue}px`)
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
          detail: { cssVars: [borderSizeVar] }
        }))
      }, [borderSizeVar])

      return (
        <Slider
          value={value}
          onChange={handleChange}
          onChangeCommitted={handleChangeCommitted}
          min={0}
          max={10}
          step={1}
          layer="layer-1"
          layout="stacked"
          showInput={false}
          showValueLabel={true}
          valueLabel={(val) => `${Math.round(val)}px`}
          minLabel="0px"
          maxLabel="10px"
          showMinMaxLabels={false}
          label={<Label layer="layer-1" layout="stacked">Size</Label>}
        />
      )
    }
  }, [borderSizeVar])

  // Border Radius Control - use brand border radius slider
  const BorderRadiusControl = useMemo(() => {
    if (!borderRadiusVar) return null

    return () => {
      return (
        <BrandBorderRadiusSlider
          targetCssVar={borderRadiusVar}
          label="Corner radius"
          layer="layer-1"
        />
      )
    }
  }, [borderRadiusVar])

  // Border Color Control
  const BorderColorControl = useMemo(() => {
    if (!includeColor || !borderColorVar) return null

    return () => {
      return (
        <PaletteColorControl
          targetCssVar={borderColorVar}
          targetCssVars={borderColorCssVars.length > 1 ? borderColorCssVars : undefined}
          currentValueCssVar={borderColorVar}
          label="Color"
        />
      )
    }
  }, [includeColor, borderColorVar, borderColorCssVars])

  // Check visibility from toolbar config
  const borderSizeVisible = groupedPropsConfig?.['border-size']?.visible !== false
  const borderRadiusVisible = groupedPropsConfig?.['border-radius']?.visible !== false
  const borderColorVisible = groupedPropsConfig?.['border-color']?.visible !== false ||
    groupedPropsConfig?.['border']?.visible !== false

  return (
    <div className="border-group-toolbar">
      {BorderSizeControl && borderSizeVisible && (
        <div className="border-group-control">
          <BorderSizeControl />
        </div>
      )}
      {BorderRadiusControl && borderRadiusVisible && (
        <div className="border-group-control">
          <BorderRadiusControl />
        </div>
      )}
      {BorderColorControl && borderColorVisible && (
        <div className="border-group-control">
          <BorderColorControl />
        </div>
      )}
    </div>
  )
}
