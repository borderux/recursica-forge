import { ComponentProp, toSentenceCase, parseComponentStructure } from '../../utils/componentToolbarUtils'
import { readCssVar } from '../../../../core/css/readCssVar'
import PaletteColorControl from '../../../forms/PaletteColorControl'
import DimensionTokenSelector from '../../../components/DimensionTokenSelector'
import FloatingPalette from './FloatingPalette'
import './PropControl.css' // Keep prop-control specific styles

interface PropControlProps {
  prop: ComponentProp
  componentName: string
  selectedVariants: Record<string, string>
  selectedLayer: string
  anchorElement?: HTMLElement | null
  onClose: () => void
}

export default function PropControl({
  prop,
  componentName,
  selectedVariants,
  selectedLayer,
  anchorElement,
  onClose,
}: PropControlProps) {
  // Helper function to get CSS vars for a given prop
  const getCssVarsForProp = (propToCheck: ComponentProp): string[] => {
    const vars: string[] = []

    if (propToCheck.isVariantSpecific && propToCheck.variantProp) {
      // For variant-specific props, find the CSS var for the selected variant and layer
      const selectedVariant = selectedVariants[propToCheck.variantProp]
      if (selectedVariant) {
        // For color props, we also need to match the selected layer
        if (propToCheck.category === 'color') {
          // Find the CSS var that matches both the selected variant AND selected layer
          const structure = parseComponentStructure(componentName)
          structure.props.forEach(p => {
            if (p.name === propToCheck.name && p.variantProp === propToCheck.variantProp && p.category === 'color') {
              // Check if this prop matches the selected variant and layer
              const variantInPath = p.path.find(pathPart => pathPart === selectedVariant)
              const layerInPath = p.path.find(pathPart => pathPart === selectedLayer)
              if (variantInPath && layerInPath) {
                vars.push(p.cssVar)
              }
            }
          })
          // If no matching vars found for color props, try to construct the CSS var name
          if (vars.length === 0) {
            // Try to use the prop's CSS var as-is (it might already be correct)
            vars.push(propToCheck.cssVar)
          }
        } else {
          // For size props, find the CSS var that matches the selected variant
          // First try to replace variant in the CSS var name
          const variantInVar = propToCheck.cssVar.match(/-variant-([^-]+)-/)?.[1]
          if (variantInVar && variantInVar !== selectedVariant) {
            const updatedCssVar = propToCheck.cssVar.replace(`-variant-${variantInVar}-`, `-variant-${selectedVariant}-`)
            vars.push(updatedCssVar)
          } else if (variantInVar && variantInVar === selectedVariant) {
            // Already matches selected variant
            vars.push(propToCheck.cssVar)
          } else {
            // Fallback: try to find the prop in the structure with the selected variant
            const structure = parseComponentStructure(componentName)
            structure.props.forEach(p => {
              if (p.name === propToCheck.name && p.variantProp === propToCheck.variantProp) {
                const variantInPath = p.path.find(pathPart => pathPart === selectedVariant)
                if (variantInPath) {
                  vars.push(p.cssVar)
                }
              }
            })
          }
        }
      }
    } else {
      // For non-variant props, update the prop's CSS var directly
      // These props apply to all variants
      vars.push(propToCheck.cssVar)
    }

    // If no vars found, use the prop's CSS var as fallback
    if (vars.length === 0) {
      vars.push(propToCheck.cssVar)
    }

    return vars
  }

  // Get CSS vars for base prop
  const baseCssVars = getCssVarsForProp(prop)
  const primaryCssVar = baseCssVars[0] || prop.cssVar
  
  // Get CSS vars for hover prop if it exists
  const hoverCssVars = prop.hoverProp ? getCssVarsForProp(prop.hoverProp) : []
  const hoverPrimaryCssVar = hoverCssVars[0] || prop.hoverProp?.cssVar

  // Helper to determine contrast color CSS var based on prop name
  const getContrastColorVar = (propToRender: ComponentProp): string | undefined => {
    const propName = propToRender.name.toLowerCase()
    const structure = parseComponentStructure(componentName)
    
    // For text colors, check against background
    if (propName === 'text' || propName === 'text-hover') {
      const bgPropName = propName === 'text-hover' ? 'background-hover' : 'background'
      const bgProp = structure.props.find(p => 
        p.name.toLowerCase() === bgPropName && 
        p.category === 'color' &&
        (!p.isVariantSpecific || (p.variantProp && selectedVariants[p.variantProp] && p.path.includes(selectedVariants[p.variantProp]))) &&
        (p.category !== 'color' || !p.path.includes('layer-') || p.path.includes(selectedLayer))
      )
      if (bgProp) {
        const bgCssVars = getCssVarsForProp(bgProp)
        return bgCssVars[0]
      }
    }
    
    // For background colors, check against text
    if (propName === 'background' || propName === 'background-hover') {
      const textPropName = propName === 'background-hover' ? 'text-hover' : 'text'
      const textProp = structure.props.find(p => 
        p.name.toLowerCase() === textPropName && 
        p.category === 'color' &&
        (!p.isVariantSpecific || (p.variantProp && selectedVariants[p.variantProp] && p.path.includes(selectedVariants[p.variantProp]))) &&
        (p.category !== 'color' || !p.path.includes('layer-') || p.path.includes(selectedLayer))
      )
      if (textProp) {
        const textCssVars = getCssVarsForProp(textProp)
        return textCssVars[0]
      }
    }
    
    // For switch track-selected, check against thumb
    if (propName === 'track-selected' || propName === 'track-unselected') {
      const thumbProp = structure.props.find(p => 
        p.name.toLowerCase() === 'thumb' && 
        p.category === 'color' &&
        (!p.isVariantSpecific || (p.variantProp && selectedVariants[p.variantProp] && p.path.includes(selectedVariants[p.variantProp]))) &&
        (p.category !== 'color' || !p.path.includes('layer-') || p.path.includes(selectedLayer))
      )
      if (thumbProp) {
        const thumbCssVars = getCssVarsForProp(thumbProp)
        return thumbCssVars[0]
      }
    }
    
    // For switch thumb, check against track-selected (when checked)
    if (propName === 'thumb') {
      const trackProp = structure.props.find(p => 
        p.name.toLowerCase() === 'track-selected' && 
        p.category === 'color' &&
        (!p.isVariantSpecific || (p.variantProp && selectedVariants[p.variantProp] && p.path.includes(selectedVariants[p.variantProp]))) &&
        (p.category !== 'color' || !p.path.includes('layer-') || p.path.includes(selectedLayer))
      )
      if (trackProp) {
        const trackCssVars = getCssVarsForProp(trackProp)
        return trackCssVars[0]
      }
    }
    
    return undefined
  }

  const renderControl = (propToRender: ComponentProp, cssVars: string[], primaryVar: string, label: string) => {
    if (propToRender.type === 'color') {
      const contrastColorVar = getContrastColorVar(propToRender)
      // Ensure we have a valid CSS var - use the first from cssVars array or fallback to prop's cssVar
      const validPrimaryVar = (primaryVar && primaryVar.trim()) || (cssVars.length > 0 && cssVars[0]?.trim()) || propToRender.cssVar
      const validCssVars = cssVars.length > 0 ? cssVars.filter(v => v && v.trim()) : [propToRender.cssVar]
      
      // Only render if we have a valid CSS var
      if (!validPrimaryVar || !validPrimaryVar.trim()) {
        console.warn('PropControl: No valid CSS var for prop', propToRender.name, { primaryVar, cssVars, propCssVar: propToRender.cssVar })
        return null
      }
      
      return (
        <PaletteColorControl
          targetCssVar={validPrimaryVar}
          targetCssVars={validCssVars.length > 1 ? validCssVars : undefined}
          currentValueCssVar={validPrimaryVar}
          label={label}
          contrastColorCssVar={contrastColorVar}
        />
      )
    }

    if (propToRender.type === 'dimension') {
      // For font-size prop on Button component, also update the theme typography CSS var
      const additionalCssVars = propToRender.name === 'font-size' && componentName.toLowerCase() === 'button'
        ? ['--recursica-brand-typography-button-font-size']
        : []
      
      // For dimension props, use dimension token selector (only theme values)
      return (
        <DimensionTokenSelector
          targetCssVar={primaryVar}
          targetCssVars={[...cssVars, ...additionalCssVars]}
          label={label}
          propName={propToRender.name}
        />
      )
    }

    // Default: for other types, show a read-only display (shouldn't happen for UIKit props)
    const currentValue = readCssVar(primaryVar) || ''
    return (
      <div className="prop-control-content">
        <label className="prop-control-label">{label}</label>
        <div className="prop-control-readonly">
          {currentValue || 'Not set'}
        </div>
      </div>
    )
  }

  const renderControls = () => {
    const baseLabel = toSentenceCase(prop.name)
    
    // If this is a combined "track" prop, render both track-selected and track-unselected
    if (prop.name.toLowerCase() === 'track' && (prop.trackSelectedProp || prop.trackUnselectedProp)) {
      const trackSelectedCssVars = prop.trackSelectedProp ? getCssVarsForProp(prop.trackSelectedProp) : []
      const trackUnselectedCssVars = prop.trackUnselectedProp ? getCssVarsForProp(prop.trackUnselectedProp) : []
      const trackSelectedPrimaryVar = trackSelectedCssVars[0] || prop.trackSelectedProp?.cssVar
      const trackUnselectedPrimaryVar = trackUnselectedCssVars[0] || prop.trackUnselectedProp?.cssVar
      
      // Get thumb color for contrast checking
      const structure = parseComponentStructure(componentName)
      const thumbProp = structure.props.find(p => 
        p.name.toLowerCase() === 'thumb' && 
        p.category === 'color' &&
        (!p.isVariantSpecific || (p.variantProp && selectedVariants[p.variantProp] && p.path.includes(selectedVariants[p.variantProp]))) &&
        (p.category !== 'color' || !p.path.includes('layer-') || p.path.includes(selectedLayer))
      )
      const thumbCssVars = thumbProp ? getCssVarsForProp(thumbProp) : []
      const thumbVar = thumbCssVars[0]
      
      return (
        <>
          {prop.trackSelectedProp && trackSelectedPrimaryVar && (
            <PaletteColorControl
              targetCssVar={trackSelectedPrimaryVar}
              targetCssVars={trackSelectedCssVars.length > 1 ? trackSelectedCssVars : undefined}
              currentValueCssVar={trackSelectedPrimaryVar}
              label="Track Selected"
              contrastColorCssVar={thumbVar}
            />
          )}
          {prop.trackUnselectedProp && trackUnselectedPrimaryVar && (
            <div style={{ marginTop: prop.trackSelectedProp ? 'var(--recursica-brand-dimensions-md)' : 0 }}>
              <PaletteColorControl
                targetCssVar={trackUnselectedPrimaryVar}
                targetCssVars={trackUnselectedCssVars.length > 1 ? trackUnselectedCssVars : undefined}
                currentValueCssVar={trackUnselectedPrimaryVar}
                label="Track Unselected"
                contrastColorCssVar={thumbVar}
              />
            </div>
          )}
        </>
      )
    }
    
    // If there's a hover prop, render both controls with spacing
    if (prop.hoverProp) {
      const hoverLabel = `${baseLabel} (Hover)`
      return (
        <>
          {renderControl(prop, baseCssVars, primaryCssVar, baseLabel)}
          <div style={{ marginTop: 'var(--recursica-brand-dimensions-md)' }}>
            {renderControl(prop.hoverProp, hoverCssVars, hoverPrimaryCssVar || prop.hoverProp.cssVar, hoverLabel)}
          </div>
        </>
      )
    }
    
    // Otherwise, just render the base control
    return renderControl(prop, baseCssVars, primaryCssVar, baseLabel)
  }

  if (!anchorElement) {
    return null
  }

  return (
    <FloatingPalette
      anchorElement={anchorElement}
      title={toSentenceCase(prop.name)}
      onClose={onClose}
    >
      {renderControls()}
    </FloatingPalette>
  )
}

