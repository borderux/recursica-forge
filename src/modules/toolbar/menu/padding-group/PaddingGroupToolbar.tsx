/**
 * PaddingGroupToolbar Component
 * 
 * A reusable toolbar for editing padding properties.
 * Handles both:
 * - Single padding prop (e.g., Accordion)
 * - Separate horizontal-padding and vertical-padding props (e.g., Chip, MenuItem)
 */

import { useMemo } from 'react'
import { ComponentProp, parseComponentStructure } from '../../utils/componentToolbarUtils'
import BrandDimensionSliderInline from '../../utils/BrandDimensionSliderInline'
import type { ToolbarPropConfig } from '../../utils/loadToolbarConfig'
import './PaddingGroupToolbar.css'

interface PaddingGroupToolbarProps {
  componentName: string
  prop: ComponentProp // The parent "padding" prop
  selectedVariants: Record<string, string>
  selectedLayer: string
  groupedPropsConfig?: Record<string, ToolbarPropConfig> // Config for grouped props with visibility
  config?: {
    propNameMapping?: {
      horizontal?: string // default: "horizontal-padding"
      vertical?: string // default: "vertical-padding"
    }
  }
  onClose?: () => void
}

export default function PaddingGroupToolbar({
  componentName,
  prop,
  selectedVariants,
  selectedLayer,
  groupedPropsConfig,
  config = {},
  onClose,
}: PaddingGroupToolbarProps) {
  const {
    propNameMapping = {},
  } = config

  const horizontalPropName = propNameMapping.horizontal || 'horizontal-padding'
  const verticalPropName = propNameMapping.vertical || 'vertical-padding'

  // Determine if this is a single padding prop or grouped padding props
  const hasGroupedProps = groupedPropsConfig && Object.keys(groupedPropsConfig).length > 0
  const hasHorizontal = groupedPropsConfig && ('horizontal-padding' in groupedPropsConfig || 'padding-horizontal' in groupedPropsConfig)
  const hasVertical = groupedPropsConfig && ('vertical-padding' in groupedPropsConfig || 'padding-vertical' in groupedPropsConfig)
  const isSinglePadding = !hasGroupedProps || (!hasHorizontal && !hasVertical)

  // Find padding-related props from component structure
  const structure = useMemo(() => parseComponentStructure(componentName), [componentName])

  // Single padding prop (e.g., Accordion)
  const singlePaddingProp = useMemo(() => {
    if (!isSinglePadding) return undefined
    // Use the prop passed in if it's already the padding prop
    if (prop.name.toLowerCase() === 'padding' && prop.category === 'size') {
      return prop
    }
    // Otherwise find it
    return structure.props.find(p => {
      if (p.name.toLowerCase() !== 'padding') return false
      if (p.isVariantSpecific && p.variantProp) {
        const selectedVariant = selectedVariants[p.variantProp]
        if (!selectedVariant) return false
        if (!p.path.includes(selectedVariant)) return false
      }
      return true
    })
  }, [structure, prop, isSinglePadding, selectedVariants])

  // Horizontal padding prop (for grouped padding)
  const horizontalPaddingProp = useMemo(() => {
    if (isSinglePadding) return undefined
    return structure.props.find(p => {
      const propNameLower = p.name.toLowerCase()
      // Handle variations: "horizontal-padding", "padding-horizontal"
      if (propNameLower !== horizontalPropName.toLowerCase() &&
        propNameLower !== 'padding-horizontal' &&
        propNameLower !== 'horizontal-padding') {
        return false
      }
      if (p.isVariantSpecific && p.variantProp) {
        const selectedVariant = selectedVariants[p.variantProp]
        if (!selectedVariant) return false
        if (!p.path.includes(selectedVariant)) return false
      }
      return true
    })
  }, [structure, horizontalPropName, selectedVariants, isSinglePadding])

  // Vertical padding prop (for grouped padding)
  const verticalPaddingProp = useMemo(() => {
    if (isSinglePadding) return undefined
    return structure.props.find(p => {
      const propNameLower = p.name.toLowerCase()
      // Handle variations: "vertical-padding", "padding-vertical"
      if (propNameLower !== verticalPropName.toLowerCase() &&
        propNameLower !== 'padding-vertical' &&
        propNameLower !== 'vertical-padding') {
        return false
      }
      if (p.isVariantSpecific && p.variantProp) {
        const selectedVariant = selectedVariants[p.variantProp]
        if (!selectedVariant) return false
        if (!p.path.includes(selectedVariant)) return false
      }
      return true
    })
  }, [structure, verticalPropName, selectedVariants, isSinglePadding])

  // Top-bottom margin props for both layouts (for grouped padding)
  // Find ALL top-bottom-margin props (both stacked and side-by-side)
  const topBottomMarginProps = useMemo(() => {
    if (isSinglePadding) return []
    const allMarginProps = structure.props.filter(p => {
      const propNameLower = p.name.toLowerCase()
      if (propNameLower !== 'top-bottom-margin') {
        return false
      }
      // Only include layout-specific props (they should have variantProp === 'layout')
      if (p.isVariantSpecific && p.variantProp === 'layout') {
        return true
      }
      return false
    })
    return allMarginProps
  }, [structure, isSinglePadding])

  // Get CSS variables
  const singlePaddingVar = singlePaddingProp?.cssVar || ''
  const horizontalPaddingVar = horizontalPaddingProp?.cssVar || ''
  const verticalPaddingVar = verticalPaddingProp?.cssVar || ''

  // Check visibility from toolbar config
  const paddingVisible = !groupedPropsConfig || groupedPropsConfig['padding']?.visible !== false
  const horizontalVisible = groupedPropsConfig?.['horizontal-padding']?.visible !== false ||
    groupedPropsConfig?.['padding-horizontal']?.visible !== false
  const verticalVisible = groupedPropsConfig?.['vertical-padding']?.visible !== false ||
    groupedPropsConfig?.['padding-vertical']?.visible !== false
  const topBottomMarginVisible = !!groupedPropsConfig?.['top-bottom-margin'] && groupedPropsConfig['top-bottom-margin']?.visible !== false

  // Render single padding control
  if (isSinglePadding && singlePaddingVar) {
    return (
      <div className="padding-group-toolbar">
        {paddingVisible && (
          <div className="padding-group-control">
            <BrandDimensionSliderInline
              targetCssVar={singlePaddingVar}
              label="Padding"
              dimensionCategory="general"
              layer="layer-1"
            />
          </div>
        )}
      </div>
    )
  }

  // Render grouped padding controls
  return (
    <div className="padding-group-toolbar">
      {horizontalPaddingVar && horizontalVisible && (
        <div className="padding-group-control">
          <BrandDimensionSliderInline
            targetCssVar={horizontalPaddingVar}
            label="Horizontal padding"
            dimensionCategory="general"
            layer="layer-1"
          />
        </div>
      )}
      {verticalPaddingVar && verticalVisible && (
        <div className="padding-group-control">
          <BrandDimensionSliderInline
            targetCssVar={verticalPaddingVar}
            label="Vertical padding"
            dimensionCategory="general"
            layer="layer-1"
          />
        </div>
      )}
      {topBottomMarginProps.length > 0 && topBottomMarginVisible && topBottomMarginProps.map((marginProp) => {
        // Extract layout variant from path (e.g., "stacked" or "side-by-side")
        const layoutVariant = marginProp.path.find(p => p === 'stacked' || p === 'side-by-side') || 'stacked'
        const layoutLabel = layoutVariant === 'side-by-side' ? 'Side-by-side' : 'Stacked'
        return (
          <div key={marginProp.cssVar} className="padding-group-control">
            <BrandDimensionSliderInline
              targetCssVar={marginProp.cssVar}
              label={`Top and bottom margin (${layoutLabel})`}
              dimensionCategory="general"
              layer="layer-1"
            />
          </div>
        )
      })}
    </div>
  )
}
