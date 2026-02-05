/**
 * BackgroundToolbar Component
 * 
 * A reusable toolbar for editing background property (optionally with selected-background)
 * for components.
 */

import { useMemo } from 'react'
import { ComponentProp, parseComponentStructure } from '../../utils/componentToolbarUtils'
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
  } = config

  // Find background-related props from component structure
  const structure = useMemo(() => parseComponentStructure(componentName), [componentName])
  
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
      // There are variant-specific props, so we must match the variant
      const variantMatchingProp = layerMatchingProps.find(p => {
        if (!p.isVariantSpecific || !p.variantProp) return false
        const selectedVariant = selectedVariants[p.variantProp]
        // If no variant is selected for this variantProp, skip this prop
        if (!selectedVariant) return false
        // Prop path must include the selected variant name
        return p.path.includes(selectedVariant)
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

  // Get CSS variables
  const backgroundVar = backgroundProp?.cssVar || ''
  const selectedBackgroundVar = selectedBackgroundProp?.cssVar || ''

  // Check visibility from toolbar config
  const backgroundVisible = groupedPropsConfig?.['background']?.visible !== false
  const selectedBackgroundVisible = groupedPropsConfig?.['selected-background']?.visible !== false

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
    </div>
  )
}
