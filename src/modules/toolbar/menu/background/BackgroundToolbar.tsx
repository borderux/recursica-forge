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
    // Use the prop passed in if it's already the background prop
    if (prop.name.toLowerCase() === 'background' && prop.category === 'colors') {
      return prop
    }
    // Otherwise find it
    return structure.props.find(p => {
      if (p.name.toLowerCase() !== 'background') return false
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
