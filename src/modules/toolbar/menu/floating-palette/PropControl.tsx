import { useMemo } from 'react'
import { ComponentProp, toSentenceCase, parseComponentStructure } from '../../utils/componentToolbarUtils'
import { readCssVar } from '../../../../core/css/readCssVar'
import { updateCssVar } from '../../../../core/css/updateCssVar'
import PaletteColorControl from '../../../forms/PaletteColorControl'
import DimensionTokenSelector from '../../../components/DimensionTokenSelector'
import TypeStyleSelector from '../../../components/TypeStyleSelector'
import IconInput from '../../../components/IconInput'
import TokenSlider from '../../../forms/TokenSlider'
import { useVars } from '../../../vars/VarsContext'
import { useThemeMode } from '../../../theme/ThemeModeContext'
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
  const { theme: themeJson } = useVars()
  const { mode } = useThemeMode()
  
  // Get elevation options from brand theme
  const elevationOptions = useMemo(() => {
    try {
      const root: any = (themeJson as any)?.brand ? (themeJson as any).brand : themeJson
      const themes = root?.themes || root
      const elev: any = themes?.light?.elevations || root?.light?.elevations || {}
      const names = Object.keys(elev).filter((k) => /^elevation-\d+$/.test(k)).sort((a,b) => Number(a.split('-')[1]) - Number(b.split('-')[1]))
      return names.map((n) => {
        const idx = Number(n.split('-')[1])
        const label = idx === 0 ? 'Elevation 0 (No elevation)' : `Elevation ${idx}`
        return { name: n, label }
      })
    } catch {
      return []
    }
  }, [themeJson])
  // Helper function to get CSS vars for a given prop
  // Simply finds the CSS var that matches the current selected variants and layer
  const getCssVarsForProp = (propToCheck: ComponentProp): string[] => {
    const structure = parseComponentStructure(componentName)
    
    // Find the prop that matches:
    // 1. Same prop name
    // 2. Same category
    // 3. Selected variant (if variant-specific)
    // 4. Selected layer (if color prop with layer)
    const matchingProp = structure.props.find(p => {
      // Must match prop name and category
      if (p.name !== propToCheck.name || p.category !== propToCheck.category) {
        return false
      }
      
      // If variant-specific, must match selected variant
      if (propToCheck.isVariantSpecific && propToCheck.variantProp) {
        const selectedVariant = selectedVariants[propToCheck.variantProp]
        if (!selectedVariant) return false
        
        const variantInPath = p.path.find(pathPart => pathPart === selectedVariant)
        if (!variantInPath) return false
      }
      
      // If color prop, must match selected layer (if prop has a layer in path)
      if (propToCheck.category === 'color') {
        const layerInPath = p.path.find(pathPart => pathPart.startsWith('layer-'))
        if (layerInPath) {
          if (layerInPath !== selectedLayer) return false
        }
      }
      
      return true
    })
    
    // Return the matching prop's CSS var, or fallback to the prop's own CSS var
    return matchingProp ? [matchingProp.cssVar] : [propToCheck.cssVar]
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

    if (propToRender.type === 'typography') {
      // For typography props (like text-size), use type style selector
      return (
        <TypeStyleSelector
          targetCssVar={primaryVar}
          targetCssVars={cssVars}
          label={label}
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
    
    // If this is a combined "thumb" prop, render all thumb-related properties
    if (prop.name.toLowerCase() === 'thumb' && prop.thumbProps && prop.thumbProps.size > 0) {
      const thumbSelectedProp = prop.thumbProps.get('thumb-selected')
      const thumbUnselectedProp = prop.thumbProps.get('thumb-unselected')
      const thumbHeightProp = prop.thumbProps.get('thumb-height')
      const thumbWidthProp = prop.thumbProps.get('thumb-width')
      const thumbBorderRadiusProp = prop.thumbProps.get('thumb-border-radius')
      // const thumbIconSelectedProp = prop.thumbProps.get('thumb-icon-selected')
      // const thumbIconUnselectedProp = prop.thumbProps.get('thumb-icon-unselected')
      // const thumbIconSizeProp = prop.thumbProps.get('thumb-icon-size')
      const thumbElevationProp = prop.thumbProps.get('thumb-elevation')
      
      return (
        <>
          {/* Thumb Colors */}
          {thumbSelectedProp && (
            <>
              {(() => {
                const cssVars = getCssVarsForProp(thumbSelectedProp)
                const primaryVar = cssVars[0] || thumbSelectedProp.cssVar
                return (
                  <PaletteColorControl
                    targetCssVar={primaryVar}
                    targetCssVars={cssVars.length > 1 ? cssVars : undefined}
                    currentValueCssVar={primaryVar}
                    label="Thumb Selected"
                  />
                )
              })()}
            </>
          )}
          {thumbUnselectedProp && (
            <div style={{ marginTop: thumbSelectedProp ? 'var(--recursica-brand-dimensions-md)' : 0 }}>
              {(() => {
                const cssVars = getCssVarsForProp(thumbUnselectedProp)
                const primaryVar = cssVars[0] || thumbUnselectedProp.cssVar
                return (
                  <PaletteColorControl
                    targetCssVar={primaryVar}
                    targetCssVars={cssVars.length > 1 ? cssVars : undefined}
                    currentValueCssVar={primaryVar}
                    label="Thumb Unselected"
                  />
                )
              })()}
            </div>
          )}
          
          {/* Thumb Icons - COMMENTED OUT FOR NOW */}
          {/* {thumbIconSelectedProp && (
            <div style={{ marginTop: thumbUnselectedProp ? 'var(--recursica-brand-dimensions-md)' : 0 }}>
              {(() => {
                const cssVars = getCssVarsForProp(thumbIconSelectedProp)
                const primaryVar = cssVars[0] || thumbIconSelectedProp.cssVar
                return (
                  <IconInput
                    targetCssVar={primaryVar}
                    targetCssVars={cssVars.length > 1 ? cssVars : undefined}
                    label="Thumb Icon Selected"
                  />
                )
              })()}
            </div>
          )}
          {thumbIconUnselectedProp && (
            <div style={{ marginTop: thumbIconSelectedProp ? 'var(--recursica-brand-dimensions-md)' : 0 }}>
              {(() => {
                const cssVars = getCssVarsForProp(thumbIconUnselectedProp)
                const primaryVar = cssVars[0] || thumbIconUnselectedProp.cssVar
                return (
                  <IconInput
                    targetCssVar={primaryVar}
                    targetCssVars={cssVars.length > 1 ? cssVars : undefined}
                    label="Thumb Icon Unselected"
                  />
                )
              })()}
            </div>
          )} */}
          
          {/* Thumb Dimensions */}
          {thumbHeightProp && (
            <div style={{ marginTop: thumbUnselectedProp ? 'var(--recursica-brand-dimensions-md)' : 0 }}>
              {(() => {
                const cssVars = getCssVarsForProp(thumbHeightProp)
                const primaryVar = cssVars[0] || thumbHeightProp.cssVar
                return (
                  <DimensionTokenSelector
                    targetCssVar={primaryVar}
                    targetCssVars={cssVars.length > 1 ? cssVars : undefined}
                    label="Thumb Height"
                    propName={thumbHeightProp.name}
                  />
                )
              })()}
            </div>
          )}
          {thumbWidthProp && (
            <div style={{ marginTop: thumbHeightProp ? 'var(--recursica-brand-dimensions-md)' : 0 }}>
              {(() => {
                const cssVars = getCssVarsForProp(thumbWidthProp)
                const primaryVar = cssVars[0] || thumbWidthProp.cssVar
                return (
                  <DimensionTokenSelector
                    targetCssVar={primaryVar}
                    targetCssVars={cssVars.length > 1 ? cssVars : undefined}
                    label="Thumb Width"
                    propName={thumbWidthProp.name}
                  />
                )
              })()}
            </div>
          )}
          {thumbBorderRadiusProp && (
            <div style={{ marginTop: thumbWidthProp ? 'var(--recursica-brand-dimensions-md)' : 0 }}>
              {(() => {
                const cssVars = getCssVarsForProp(thumbBorderRadiusProp)
                const primaryVar = cssVars[0] || thumbBorderRadiusProp.cssVar
                return (
                  <DimensionTokenSelector
                    targetCssVar={primaryVar}
                    targetCssVars={cssVars.length > 1 ? cssVars : undefined}
                    label="Thumb Border Radius"
                    propName={thumbBorderRadiusProp.name}
                  />
                )
              })()}
            </div>
          )}
          {/* Thumb Icon Size - COMMENTED OUT FOR NOW */}
          {/* {thumbIconSizeProp && (
            <div style={{ marginTop: thumbBorderRadiusProp ? 'var(--recursica-brand-dimensions-md)' : 0 }}>
              {(() => {
                const cssVars = getCssVarsForProp(thumbIconSizeProp)
                const primaryVar = cssVars[0] || thumbIconSizeProp.cssVar
                return (
                  <DimensionTokenSelector
                    targetCssVar={primaryVar}
                    targetCssVars={cssVars.length > 1 ? cssVars : undefined}
                    label="Thumb Icon Size"
                    propName={thumbIconSizeProp.name}
                  />
                )
              })()}
            </div>
          )} */}
        </>
      )
    }
    
    // If this is a combined "border" prop, render border-size, border-radius, and border-color
    if (prop.name.toLowerCase() === 'border' && prop.borderProps && prop.borderProps.size > 0) {
      const borderSizeProp = prop.borderProps.get('border-size')
      const borderRadiusProp = prop.borderProps.get('border-radius')
      const borderColorProp = prop.borderProps.get('border-color')
      
      return (
        <>
          {/* Border Size */}
          {borderSizeProp && (
            <>
              {(() => {
                const cssVars = getCssVarsForProp(borderSizeProp)
                const primaryVar = cssVars[0] || borderSizeProp.cssVar
                return (
                  <DimensionTokenSelector
                    targetCssVar={primaryVar}
                    targetCssVars={cssVars.length > 1 ? cssVars : undefined}
                    label="Border Size"
                    propName={borderSizeProp.name}
                  />
                )
              })()}
            </>
          )}
          
          {/* Border Radius */}
          {borderRadiusProp && (
            <div style={{ marginTop: borderSizeProp ? 'var(--recursica-brand-dimensions-md)' : 0 }}>
              {(() => {
                const cssVars = getCssVarsForProp(borderRadiusProp)
                const primaryVar = cssVars[0] || borderRadiusProp.cssVar
                return (
                  <DimensionTokenSelector
                    targetCssVar={primaryVar}
                    targetCssVars={cssVars.length > 1 ? cssVars : undefined}
                    label="Border Radius"
                    propName={borderRadiusProp.name}
                  />
                )
              })()}
            </div>
          )}
          
          {/* Border Color */}
          {borderColorProp && (
            <div style={{ marginTop: borderRadiusProp ? 'var(--recursica-brand-dimensions-md)' : 0 }}>
              {(() => {
                const cssVars = getCssVarsForProp(borderColorProp)
                const primaryVar = cssVars[0] || borderColorProp.cssVar
                return (
                  <PaletteColorControl
                    targetCssVar={primaryVar}
                    targetCssVars={cssVars.length > 1 ? cssVars : undefined}
                    currentValueCssVar={primaryVar}
                    label="Border Color"
                  />
                )
              })()}
            </div>
          )}
        </>
      )
    }
    
    // If this is a combined "track" prop, render track-selected, track-unselected, track-width, and track-inner-padding
    if (prop.name.toLowerCase() === 'track' && (prop.trackSelectedProp || prop.trackUnselectedProp || prop.thumbProps)) {
      const trackSelectedCssVars = prop.trackSelectedProp ? getCssVarsForProp(prop.trackSelectedProp) : []
      const trackUnselectedCssVars = prop.trackUnselectedProp ? getCssVarsForProp(prop.trackUnselectedProp) : []
      const trackSelectedPrimaryVar = trackSelectedCssVars[0] || prop.trackSelectedProp?.cssVar
      const trackUnselectedPrimaryVar = trackUnselectedCssVars[0] || prop.trackUnselectedProp?.cssVar
      
      // Get track-related props (track-width, track-inner-padding, track-border-radius) from thumbProps field (reused for track props)
      const trackWidthProp = prop.thumbProps?.get('track-width')
      const trackInnerPaddingProp = prop.thumbProps?.get('track-inner-padding')
      const trackBorderRadiusProp = prop.thumbProps?.get('track-border-radius')
      
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
          {trackWidthProp && (
            <div style={{ marginTop: prop.trackUnselectedProp ? 'var(--recursica-brand-dimensions-md)' : 0 }}>
              {(() => {
                const cssVars = getCssVarsForProp(trackWidthProp)
                const primaryVar = cssVars[0] || trackWidthProp.cssVar
                return (
                  <DimensionTokenSelector
                    targetCssVar={primaryVar}
                    targetCssVars={cssVars.length > 1 ? cssVars : undefined}
                    label="Track Width"
                    propName={trackWidthProp.name}
                  />
                )
              })()}
            </div>
          )}
          {trackInnerPaddingProp && (
            <div style={{ marginTop: trackWidthProp ? 'var(--recursica-brand-dimensions-md)' : 0 }}>
              {(() => {
                const cssVars = getCssVarsForProp(trackInnerPaddingProp)
                const primaryVar = cssVars[0] || trackInnerPaddingProp.cssVar
                return (
                  <DimensionTokenSelector
                    targetCssVar={primaryVar}
                    targetCssVars={cssVars.length > 1 ? cssVars : undefined}
                    label="Track Inner Padding"
                    propName={trackInnerPaddingProp.name}
                  />
                )
              })()}
            </div>
          )}
          {trackBorderRadiusProp && (
            <div style={{ marginTop: trackInnerPaddingProp ? 'var(--recursica-brand-dimensions-md)' : 0 }}>
              {(() => {
                const cssVars = getCssVarsForProp(trackBorderRadiusProp)
                const primaryVar = cssVars[0] || trackBorderRadiusProp.cssVar
                return (
                  <DimensionTokenSelector
                    targetCssVar={primaryVar}
                    targetCssVars={cssVars.length > 1 ? cssVars : undefined}
                    label="Track Border Radius"
                    propName={trackBorderRadiusProp.name}
                  />
                )
              })()}
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

