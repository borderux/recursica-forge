/**
 * BackgroundToolbar Component
 * 
 * A reusable toolbar for editing background property (optionally with selected-background)
 * for components.
 */

import { useMemo } from 'react'
import { ComponentProp, parseComponentStructure } from '../../utils/componentToolbarUtils'
import { useVars } from '../../../vars/VarsContext'
import PaletteColorControl from '../../../forms/PaletteColorControl'
import type { ToolbarPropConfig } from '../../utils/loadToolbarConfig'
import './BackgroundToolbar.css'

interface BackgroundToolbarProps {
  componentName: string
  prop: ComponentProp // The "background" prop
  selectedVariants: Record<string, string>
  selectedLayer: string
  groupedPropsConfig?: Record<string, ToolbarPropConfig> // Config for grouped props with visibility
  config?: {
    includeSelected?: boolean // Whether to include selected-background control
    includeTextColor?: boolean // Whether to include text-color control
  }
  onClose?: () => void
}

export default function BackgroundToolbar({
  componentName,
  prop,
  selectedVariants,
  selectedLayer,
  groupedPropsConfig,
  config = {},
  onClose,
}: BackgroundToolbarProps) {
  const {
    includeSelected = false,
    includeTextColor = false,
  } = config

  const { uikit } = useVars()

  // Parse structure from the live uikit so custom variant names are included.
  // uikit is a reactive dep — the memo recomputes after reset or variant changes.
  const structure = useMemo(
    () => parseComponentStructure(componentName, uikit),
    [componentName, uikit]
  )

  const backgroundProp = useMemo(() => {
    // Always search for the correct background prop based on selectedVariants and selectedLayer
    // This ensures we get the right prop when layer or variant changes

    // Find all background props that match the layer first
    const layerMatchingProps = structure.props.filter(p => {
      if (p.name.toLowerCase() !== 'background') return false
      if (p.category !== 'colors') return false

      // Check layer matching - must match selectedLayer
      const layerInPath = p.path.find(pathPart => pathPart.startsWith('layer-'))
      if (layerInPath) {
        // If there's a layer in the path, it must match selectedLayer
        if (layerInPath !== selectedLayer) return false
      } else {
        // If there's no layer in path but we have a selectedLayer other than layer-0,
        // this prop doesn't match (for color props, we expect them to have a layer)
        if (selectedLayer && selectedLayer !== 'layer-0') return false
      }

      return true
    })

    // If no props match the layer, return undefined
    if (layerMatchingProps.length === 0) {
      return undefined
    }

    // Among layer-matching props, prefer variant-specific props that match the selected variant
    const hasVariantSpecificProps = layerMatchingProps.some(p => p.isVariantSpecific && p.variantProp)

    if (hasVariantSpecificProps) {
      // There are variant-specific props, so we must match ALL active variant dimensions.
      // A prop under text.solid must not match when style='image' just because style-secondary='solid'.
      const variantMatchingProp = layerMatchingProps.find(p => {
        if (!p.isVariantSpecific || !p.variantProp) return false
        const selectedVariant = selectedVariants[p.variantProp]
        if (!selectedVariant) return false
        if (!p.path.includes(selectedVariant)) return false

        // Verify the prop is consistent with ALL selected variant dimensions.
        // For each selected variant, if the prop's path contains any value from that
        // variant dimension's sibling set, it must be the selected value.
        for (const [variantKey, variantValue] of Object.entries(selectedVariants)) {
          if (!variantValue || variantKey === p.variantProp) continue
          // Check if the path contains this variant value
          if (p.path.includes(variantValue)) continue
          // If the path doesn't contain the selected variant value but contains a different
          // value from the same category, this prop belongs to a different variant combination.
          // For style dimension: if style='image' but path has 'text' (another style), reject.
          const styleVariants = structure.variants.find(v => v.propName === variantKey)
          if (styleVariants) {
            const otherValues = styleVariants.variants.filter(v => v !== variantValue)
            if (otherValues.some(v => p.path.includes(v))) return false
          }
        }
        return true
      })

      // If we found a variant-matching prop, return it
      if (variantMatchingProp) return variantMatchingProp

      // If no variant matches but we have variant-specific props, return undefined
      // (we don't want to show a random variant's prop)
      return undefined
    }

    // No variant-specific props, return the first layer-matching prop
    return layerMatchingProps[0]
  }, [structure, prop, selectedVariants, selectedLayer])

  const selectedBackgroundProp = useMemo(() => {
    if (!includeSelected) return undefined
    return structure.props.find(p => {
      if (p.name.toLowerCase() !== 'selected-background') return false
      if (p.category !== 'colors') return false
      const layerInPath = p.path.find(pathPart => pathPart.startsWith('layer-'))
      if (layerInPath && layerInPath !== selectedLayer) return false
      return true
    })
  }, [structure, includeSelected, selectedLayer])

  const textColorProp = useMemo(() => {
    if (!includeTextColor) return undefined
    return structure.props.find(p => {
      if (p.name.toLowerCase() !== 'text') return false
      if (p.category !== 'colors') return false
      const layerInPath = p.path.find(pathPart => pathPart.startsWith('layer-'))
      if (layerInPath && layerInPath !== selectedLayer) return false
      // Check variant matching - must match ALL variant dimensions
      if (p.isVariantSpecific && p.variantProp) {
        const selectedVariant = selectedVariants[p.variantProp]
        if (!selectedVariant) return false
        if (!p.path.includes(selectedVariant)) return false
        for (const [variantKey, variantValue] of Object.entries(selectedVariants)) {
          if (!variantValue || variantKey === p.variantProp) continue
          if (p.path.includes(variantValue)) continue
          const styleVariants = structure.variants.find(v => v.propName === variantKey)
          if (styleVariants) {
            const otherValues = styleVariants.variants.filter(v => v !== variantValue)
            if (otherValues.some(v => p.path.includes(v))) return false
          }
        }
        return true
      }
      return true
    })
  }, [structure, includeTextColor, selectedLayer, selectedVariants])

  // Get CSS variables
  const backgroundVar = backgroundProp?.cssVar || ''
  const selectedBackgroundVar = selectedBackgroundProp?.cssVar || ''
  const textColorVar = textColorProp?.cssVar || ''

  // Check visibility from toolbar config
  const backgroundVisible = groupedPropsConfig?.['background']?.visible !== false
  const selectedBackgroundVisible = groupedPropsConfig?.['selected-background']?.visible !== false
  const textColorVisible = groupedPropsConfig?.['text-color']?.visible !== false

  return (
    <div className="background-toolbar">
      {backgroundVar && backgroundVisible && (
        <div className="background-control">
          <PaletteColorControl
            targetCssVar={backgroundVar}
            currentValueCssVar={backgroundVar}
            label="Background"
          />
        </div>
      )}
      {includeSelected && selectedBackgroundVar && selectedBackgroundVisible && (
        <div className="background-control">
          <PaletteColorControl
            targetCssVar={selectedBackgroundVar}
            currentValueCssVar={selectedBackgroundVar}
            label="Selected background"
          />
        </div>
      )}
      {includeTextColor && textColorVar && textColorVisible && (
        <div className="background-control">
          <PaletteColorControl
            targetCssVar={textColorVar}
            currentValueCssVar={textColorVar}
            label="Text color"
          />
        </div>
      )}
    </div>
  )
}
