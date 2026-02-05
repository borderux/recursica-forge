/**
 * TopBottomMarginToolbar Component
 * 
 * A reusable toolbar for editing top-bottom-margin properties.
 * Always shows separate controls for stacked and side-by-side layouts.
 * Used for form elements (Slider, TextField, etc.) that have both layout variants.
 */

import { useMemo } from 'react'
import { ComponentProp, parseComponentStructure } from '../../utils/componentToolbarUtils'
import BrandDimensionSliderInline from '../../utils/BrandDimensionSliderInline'
import type { ToolbarPropConfig } from '../../utils/loadToolbarConfig'
import './TopBottomMarginToolbar.css'

interface TopBottomMarginToolbarProps {
  componentName: string
  prop: ComponentProp // The parent prop (e.g., "gaps")
  selectedVariants: Record<string, string>
  selectedLayer: string
  groupedPropsConfig?: Record<string, ToolbarPropConfig> // Config for grouped props with visibility
  onClose?: () => void
}

export default function TopBottomMarginToolbar({
  componentName,
  prop,
  selectedVariants,
  selectedLayer,
  groupedPropsConfig,
  onClose,
}: TopBottomMarginToolbarProps) {
  // Find ALL top-bottom-margin props (both stacked and side-by-side)
  const structure = useMemo(() => parseComponentStructure(componentName), [componentName])
  
  const topBottomMarginProps = useMemo(() => {
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
  }, [structure])

  // Render both layout variants of top-bottom-margin
  return (
    <div className="top-bottom-margin-toolbar">
      {topBottomMarginProps.length > 0 && topBottomMarginProps.map((marginProp) => {
        // Extract layout variant from path (e.g., "stacked" or "side-by-side")
        const layoutVariant = marginProp.path.find(p => p === 'stacked' || p === 'side-by-side') || 'stacked'
        const layoutLabel = layoutVariant === 'side-by-side' ? 'Side-by-side' : 'Stacked'
        return (
          <div key={marginProp.cssVar} className="top-bottom-margin-control">
            <BrandDimensionSliderInline
              targetCssVar={marginProp.cssVar}
              label={layoutLabel}
              dimensionCategory="general"
              layer={selectedLayer as any}
            />
          </div>
        )
      })}
      {topBottomMarginProps.length === 0 && (
        <div style={{ padding: 'var(--recursica-brand-dimensions-general-md)', color: 'var(--recursica-brand-themes-light-layer-layer-0-property-text-color)' }}>
          No top-bottom-margin properties found for this component.
        </div>
      )}
    </div>
  )
}
