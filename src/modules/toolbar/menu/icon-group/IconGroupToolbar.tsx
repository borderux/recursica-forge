/**
 * IconGroupToolbar Component
 * 
 * A reusable toolbar for editing icon properties (icon-size, icon-text-gap, optional icon colors)
 * for component icon groups.
 */

import { useMemo } from 'react'
import { ComponentProp, parseComponentStructure } from '../../utils/componentToolbarUtils'
import BrandDimensionSliderInline from '../../utils/BrandDimensionSliderInline'
import PaletteColorControl from '../../../forms/PaletteColorControl'
import type { ToolbarPropConfig } from '../../utils/loadToolbarConfig'
import './IconGroupToolbar.css'

interface IconGroupToolbarProps {
  componentName: string
  prop: ComponentProp // The parent "icon" prop
  selectedVariants: Record<string, string>
  selectedLayer: string
  groupedPropsConfig?: Record<string, ToolbarPropConfig> // Config for grouped props with visibility
  config?: {
    includeColors?: boolean // Whether to include icon color controls
    colorProps?: string[] // Array of color prop names (e.g., ['leading-icon-color', 'close-icon-color'])
    propNameMapping?: {
      size?: string // default: "icon-size"
      gap?: string // default: "icon-text-gap"
    }
  }
  onClose?: () => void
}

export default function IconGroupToolbar({
  componentName,
  prop,
  selectedVariants,
  selectedLayer,
  groupedPropsConfig,
  config = {},
  onClose,
}: IconGroupToolbarProps) {
  const {
    includeColors = false,
    colorProps = [],
    propNameMapping = {},
  } = config

  const sizePropName = propNameMapping.size || 'icon-size'
  const gapPropName = propNameMapping.gap || 'icon-text-gap'

  // Find icon-related props from component structure
  const structure = useMemo(() => parseComponentStructure(componentName), [componentName])

  const iconSizeProp = useMemo(() => {
    return structure.props.find(p => {
      const propNameLower = p.name.toLowerCase()
      // Handle variations: "icon-size", "icon", "leading-icon-size", "close-icon-size"
      if (propNameLower !== sizePropName.toLowerCase() &&
        propNameLower !== 'icon-size' &&
        propNameLower !== 'icon' &&
        !propNameLower.includes('icon-size')) {
        return false
      }
      // Prefer exact match, but also accept any icon-size variant
      if (propNameLower === sizePropName.toLowerCase() || propNameLower === 'icon-size') {
        if (p.isVariantSpecific && p.variantProp) {
          const selectedVariant = selectedVariants[p.variantProp]
          if (!selectedVariant) return false
          if (!p.path.includes(selectedVariant)) return false
        }
        return true
      }
      return false
    })
  }, [structure, sizePropName, selectedVariants])

  const iconGapProp = useMemo(() => {
    return structure.props.find(p => {
      const propNameLower = p.name.toLowerCase()
      // Handle variations: "icon-text-gap", "icon-text-gap", "spacing"
      if (propNameLower !== gapPropName.toLowerCase() &&
        propNameLower !== 'icon-text-gap' &&
        propNameLower !== 'spacing') {
        return false
      }
      if (p.isVariantSpecific && p.variantProp) {
        const selectedVariant = selectedVariants[p.variantProp]
        if (!selectedVariant) return false
        if (!p.path.includes(selectedVariant)) return false
      }
      return true
    })
  }, [structure, gapPropName, selectedVariants])

  // Find close-icon-size prop
  const closeIconSizeProp = useMemo(() => {
    return structure.props.find(p => {
      const propNameLower = p.name.toLowerCase()
      if (propNameLower !== 'close-icon-size') return false
      if (p.isVariantSpecific && p.variantProp) {
        const selectedVariant = selectedVariants[p.variantProp]
        if (!selectedVariant) return false
        if (!p.path.includes(selectedVariant)) return false
      }
      return true
    })
  }, [structure, selectedVariants])

  // Find color props if enabled
  const iconColorProps = useMemo(() => {
    if (!includeColors || colorProps.length === 0) return []

    return colorProps.map(colorPropName => {
      return structure.props.find(p => {
        if (p.name.toLowerCase() !== colorPropName.toLowerCase()) return false
        if (p.category !== 'colors') return false
        if (p.isVariantSpecific && p.variantProp) {
          const selectedVariant = selectedVariants[p.variantProp]
          if (!selectedVariant) return false
          if (!p.path.includes(selectedVariant)) return false
        }
        const layerInPath = p.path.find(pathPart => pathPart.startsWith('layer-'))
        if (layerInPath && layerInPath !== selectedLayer) return false
        return true
      })
    }).filter((p): p is ComponentProp => p !== undefined)
  }, [structure, includeColors, colorProps, selectedVariants, selectedLayer])

  // Get CSS variables
  const iconSizeVar = iconSizeProp?.cssVar || ''
  const iconGapVar = iconGapProp?.cssVar || ''
  const closeIconSizeVar = closeIconSizeProp?.cssVar || ''

  // Check visibility from toolbar config
  const iconSizeVisible = groupedPropsConfig?.['icon-size']?.visible !== false ||
    groupedPropsConfig?.['icon']?.visible !== false
  const iconGapVisible = groupedPropsConfig?.['icon-text-gap']?.visible !== false ||
    groupedPropsConfig?.['spacing']?.visible !== false
  const closeIconSizeVisible = groupedPropsConfig?.['close-icon-size']?.visible !== false

  return (
    <div className="icon-group-toolbar">
      {iconSizeVar && iconSizeVisible && (
        <div className="icon-group-control">
          <BrandDimensionSliderInline
            targetCssVar={iconSizeVar}
            label="Icon size"
            dimensionCategory="icons"
            layer="layer-1"
          />
        </div>
      )}
      {closeIconSizeVar && closeIconSizeVisible && (
        <div className="icon-group-control">
          <BrandDimensionSliderInline
            targetCssVar={closeIconSizeVar}
            label={groupedPropsConfig?.['close-icon-size']?.label || 'Remove icon size'}
            dimensionCategory="icons"
            layer="layer-1"
          />
        </div>
      )}
      {iconGapVar && iconGapVisible && (
        <div className="icon-group-control">
          <BrandDimensionSliderInline
            targetCssVar={iconGapVar}
            label="Icon-text gap"
            dimensionCategory="general"
            layer="layer-1"
          />
        </div>
      )}
      {includeColors && iconColorProps.map((colorProp, index) => {
        const colorPropName = colorProp.name.toLowerCase()
        const colorVisible = groupedPropsConfig?.[colorPropName]?.visible !== false
        return colorVisible ? (
          <div key={index} className="icon-group-control">
            <PaletteColorControl
              targetCssVar={colorProp.cssVar}
              currentValueCssVar={colorProp.cssVar}
              label={groupedPropsConfig?.[colorPropName]?.label || colorProp.name.replace(/-/g, ' ').replace(/^\w/, l => l.toUpperCase())}
            />
          </div>
        ) : null
      })}
    </div>
  )
}
