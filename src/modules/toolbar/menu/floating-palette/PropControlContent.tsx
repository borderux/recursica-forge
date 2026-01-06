// Extract the rendering logic from PropControl for use in accordions
import React, { useMemo } from 'react'
import { ComponentProp, toSentenceCase, parseComponentStructure } from '../../utils/componentToolbarUtils'
import { getPropLabel, getGroupedProps } from '../../utils/loadToolbarConfig'
import { readCssVar, readCssVarResolved } from '../../../../core/css/readCssVar'
import { updateCssVar } from '../../../../core/css/updateCssVar'
import PaletteColorControl from '../../../forms/PaletteColorControl'
import DimensionTokenSelector from '../../../components/DimensionTokenSelector'
import TypeStyleSelector from '../../../components/TypeStyleSelector'
import TokenSlider from '../../../forms/TokenSlider'
import { useVars } from '../../../vars/VarsContext'
import { useThemeMode } from '../../../theme/ThemeModeContext'
import { buildComponentCssVarPath } from '../../../../components/utils/cssVarNames'
import OpacitySelector from './OpacitySelector'
import './PropControl.css'

// Separate component for elevation control to properly use hooks
function ElevationPropControl({
  primaryVar,
  label,
  elevationOptions,
  mode,
}: {
  primaryVar: string
  label: string
  elevationOptions: Array<{ name: string; label: string }>
  mode: 'light' | 'dark'
}) {
  const [currentElevation, setCurrentElevation] = React.useState(() => {
    const value = readCssVar(primaryVar)
    if (value) {
      const match = value.match(/elevations\.(elevation-\d+)/)
      if (match) return match[1]
      if (/^elevation-\d+$/.test(value)) return value
    }
    return 'elevation-0'
  })

  React.useEffect(() => {
    const handleCssVarUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (!detail?.cssVars || detail.cssVars.includes(primaryVar)) {
        const value = readCssVar(primaryVar)
        if (value) {
          const match = value.match(/elevations\.(elevation-\d+)/)
          if (match) {
            setCurrentElevation(match[1])
            return
          }
          if (/^elevation-\d+$/.test(value)) {
            setCurrentElevation(value)
            return
          }
        }
        setCurrentElevation('elevation-0')
      }
    }
    window.addEventListener('cssVarsUpdated', handleCssVarUpdate)
    return () => window.removeEventListener('cssVarsUpdated', handleCssVarUpdate)
  }, [primaryVar])

  const handleElevationChange = (elevationName: string) => {
    updateCssVar(primaryVar, `{brand.themes.${mode}.elevations.${elevationName}}`)
    setCurrentElevation(elevationName)
    window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
      detail: { cssVars: [primaryVar] }
    }))
  }

  return (
    <TokenSlider
      label={label}
      tokens={elevationOptions.map(opt => ({ name: opt.name, label: opt.label }))}
      currentToken={currentElevation}
      onChange={handleElevationChange}
      getTokenLabel={(token) => {
        const opt = elevationOptions.find((o) => o.name === token.name)
        return opt?.label || token.label || token.name
      }}
    />
  )
}

interface PropControlContentProps {
  prop: ComponentProp
  componentName: string
  selectedVariants: Record<string, string>
  selectedLayer: string
}

export default function PropControlContent({
  prop,
  componentName,
  selectedVariants,
  selectedLayer,
}: PropControlContentProps) {
  const { theme: themeJson } = useVars()
  const { mode } = useThemeMode()
  
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

  const getCssVarsForProp = (propToCheck: ComponentProp): string[] => {
    const structure = parseComponentStructure(componentName)
    const matchingProp = structure.props.find(p => {
      if (p.name !== propToCheck.name || p.category !== propToCheck.category) {
        return false
      }
      if (propToCheck.isVariantSpecific && propToCheck.variantProp) {
        const selectedVariant = selectedVariants[propToCheck.variantProp]
        if (!selectedVariant) return false
        const variantInPath = p.path.find(pathPart => pathPart === selectedVariant)
        if (!variantInPath) return false
      }
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

  const baseCssVars = getCssVarsForProp(prop)
  let primaryCssVar = baseCssVars[0] || prop.cssVar
  let cssVarsForControl = baseCssVars
  
  // Special handling for MenuItem background: update all three background CSS variables
  // Component name can be "Menu item" (display name) or "MenuItem" (component name)
  const isMenuItem = componentName.toLowerCase().replace(/\s+/g, '-') === 'menu-item' || 
                     componentName.toLowerCase().replace(/\s+/g, '') === 'menuitem' ||
                     componentName === 'MenuItem' ||
                     componentName === 'Menu item'
  
  if (prop.name.toLowerCase() === 'background' && isMenuItem) {
    const defaultBgVar = buildComponentCssVarPath('MenuItem', 'variants', 'styles', 'default', 'properties', 'colors', selectedLayer, 'background')
    const selectedBgVar = buildComponentCssVarPath('MenuItem', 'properties', 'colors', selectedLayer, 'selected-background')
    const disabledBgVar = buildComponentCssVarPath('MenuItem', 'variants', 'styles', 'disabled', 'properties', 'colors', selectedLayer, 'background')
    
    // Use default as primary, but include all three in the control
    primaryCssVar = defaultBgVar
    cssVarsForControl = [defaultBgVar, selectedBgVar, disabledBgVar]
  }
  
  // Special handling for MenuItem text: update all variant text colors (default, selected, disabled)
  if (prop.name.toLowerCase() === 'text' && isMenuItem) {
    const defaultTextVar = buildComponentCssVarPath('MenuItem', 'variants', 'styles', 'default', 'properties', 'colors', selectedLayer, 'text')
    const selectedTextVar = buildComponentCssVarPath('MenuItem', 'variants', 'styles', 'selected', 'properties', 'colors', selectedLayer, 'text')
    const disabledTextVar = buildComponentCssVarPath('MenuItem', 'variants', 'styles', 'disabled', 'properties', 'colors', selectedLayer, 'text')
    
    // Use default as primary, but include all three in the control
    primaryCssVar = defaultTextVar
    cssVarsForControl = [defaultTextVar, selectedTextVar, disabledTextVar]
  }
  
  if (prop.name.toLowerCase() === 'height' && componentName.toLowerCase() === 'badge') {
    const sizeVariant = selectedVariants.size || 'small'
    const minHeightVar = `--recursica-ui-kit-components-badge-size-variants-${sizeVariant}-min-height`
    primaryCssVar = minHeightVar
    cssVarsForControl = [minHeightVar]
  }
  
  if (prop.name.toLowerCase() === 'label-width' && componentName.toLowerCase() === 'label') {
    const layoutVariant = selectedVariants.layout || 'stacked'
    const sizeVariant = selectedVariants.size || 'default'
    const widthVar = `--recursica-ui-kit-components-label-variants-layouts-${layoutVariant}-variants-sizes-${sizeVariant}-properties-width`
    primaryCssVar = widthVar
    cssVarsForControl = [widthVar]
  }

  const getContrastColorVar = (propToRender: ComponentProp): string | undefined => {
    const propName = propToRender.name.toLowerCase()
    const structure = parseComponentStructure(componentName)
    
    if (propName === 'text' || propName === 'text-hover') {
      const bgPropName = propName === 'text-hover' ? 'background-hover' : 'background'
      const bgProp = structure.props.find(p => 
        p.name.toLowerCase() === bgPropName && 
        p.category === 'colors' &&
        (!p.isVariantSpecific || (p.variantProp && selectedVariants[p.variantProp] && p.path.includes(selectedVariants[p.variantProp]))) &&
        (p.category !== 'colors' || !p.path.includes('layer-') || p.path.includes(selectedLayer))
      )
      if (bgProp) {
        const bgCssVars = getCssVarsForProp(bgProp)
        return bgCssVars[0]
      }
    }
    
    if (propName === 'background' || propName === 'background-hover') {
      const textPropName = propName === 'background-hover' ? 'text-hover' : 'text'
      const textProp = structure.props.find(p => 
        p.name.toLowerCase() === textPropName && 
        p.category === 'colors' &&
        (!p.isVariantSpecific || (p.variantProp && selectedVariants[p.variantProp] && p.path.includes(selectedVariants[p.variantProp]))) &&
        (p.category !== 'colors' || !p.path.includes('layer-') || p.path.includes(selectedLayer))
      )
      if (textProp) {
        const textCssVars = getCssVarsForProp(textProp)
        return textCssVars[0]
      }
    }
    
    if (propName === 'track-selected' || propName === 'track-unselected') {
      const thumbProp = structure.props.find(p => 
        p.name.toLowerCase() === 'thumb' && 
        p.category === 'colors' &&
        (!p.isVariantSpecific || (p.variantProp && selectedVariants[p.variantProp] && p.path.includes(selectedVariants[p.variantProp]))) &&
        (p.category !== 'colors' || !p.path.includes('layer-') || p.path.includes(selectedLayer))
      )
      if (thumbProp) {
        const thumbCssVars = getCssVarsForProp(thumbProp)
        return thumbCssVars[0]
      }
    }
    
    if (propName === 'thumb') {
      const trackProp = structure.props.find(p => 
        p.name.toLowerCase() === 'track-selected' && 
        p.category === 'colors' &&
        (!p.isVariantSpecific || (p.variantProp && selectedVariants[p.variantProp] && p.path.includes(selectedVariants[p.variantProp]))) &&
        (p.category !== 'colors' || !p.path.includes('layer-') || p.path.includes(selectedLayer))
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
      const validPrimaryVar = (primaryVar && primaryVar.trim()) || (cssVars.length > 0 && cssVars[0]?.trim()) || propToRender.cssVar
      const validCssVars = cssVars.length > 0 ? cssVars.filter(v => v && v.trim()) : [propToRender.cssVar]
      
      if (!validPrimaryVar || !validPrimaryVar.trim()) {
        console.warn('PropControlContent: No valid CSS var for prop', propToRender.name)
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
      return (
        <TypeStyleSelector
          targetCssVar={primaryVar}
          targetCssVars={cssVars}
          label={label}
        />
      )
    }

    if (propToRender.type === 'dimension') {
      const additionalCssVars = propToRender.name === 'font-size' && componentName.toLowerCase() === 'button'
        ? ['--recursica-brand-typography-button-font-size']
        : []
      
      let minPixelValue: number | undefined = undefined
      if (propToRender.name.toLowerCase() === 'height' && componentName.toLowerCase() === 'badge') {
        const sizeVariant = selectedVariants.size || 'small'
        try {
          const uikitRoot: any = (themeJson as any)?.['ui-kit'] || (themeJson as any)
          const badgeComponent = uikitRoot?.components?.badge
          if (badgeComponent?.size?.variant?.[sizeVariant]?.['min-height']) {
            const minHeightDef = badgeComponent.size.variant[sizeVariant]['min-height']
            if (minHeightDef?.$type === 'dimension' && minHeightDef?.$value) {
              const value = minHeightDef.$value
              if (typeof value === 'number') {
                minPixelValue = value
              } else if (value && typeof value === 'object' && 'value' in value) {
                minPixelValue = typeof value.value === 'number' ? value.value : parseFloat(value.value)
              }
            }
          }
        } catch (error) {
          console.warn('Failed to read min-height from UIKit.json:', error)
        }
        if (minPixelValue === undefined) {
          const defaultValues: Record<string, number> = {
            small: 16,
            large: 24,
          }
          minPixelValue = defaultValues[sizeVariant] || 16
        }
      }
      
      const isLabelWidth = propToRender.name.toLowerCase() === 'label-width'
      const maxPixelValue = isLabelWidth ? 500 : undefined
      
      return (
        <DimensionTokenSelector
          key={`${primaryVar}-${selectedVariants.layout || ''}-${selectedVariants.size || ''}`}
          targetCssVar={primaryVar}
          targetCssVars={[...cssVars, ...additionalCssVars]}
          label={label}
          propName={propToRender.name}
          minPixelValue={minPixelValue}
          maxPixelValue={maxPixelValue}
          forcePixelMode={isLabelWidth}
        />
      )
    }

    if (propToRender.type === 'elevation') {
      return (
        <ElevationPropControl
          primaryVar={primaryVar}
          label={label}
          elevationOptions={elevationOptions}
          mode={mode}
        />
      )
    }

    // For number type properties (like opacity), use OpacitySelector
    if (propToRender.type === 'number') {
      const isOpacityProp = propToRender.name.toLowerCase().includes('opacity')
      
      if (isOpacityProp) {
        return <OpacitySelector targetCssVar={primaryVar} label={label} />
      }
      
      // For other number properties, show resolved value if available
      const resolvedValue = readCssVarResolved(primaryVar)
      const rawValue = readCssVar(primaryVar) || ''
      return (
        <div className="prop-control-content">
          <label className="prop-control-label">{label}</label>
          <div className="prop-control-readonly">
            {resolvedValue || rawValue || 'Not set'}
          </div>
        </div>
      )
    }

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

  const baseLabel = (componentName.toLowerCase() === 'toast' && 
                     (prop.name.toLowerCase() === 'background' || prop.name.toLowerCase() === 'text'))
    ? 'Color'
    : (componentName.toLowerCase() === 'toast' && prop.name.toLowerCase() === 'icon')
    ? 'Size'
    : toSentenceCase(prop.name)
  
  // Handle grouped props
  const groupedPropsConfig = getGroupedProps(componentName, prop.name)
  
  if (groupedPropsConfig && prop.borderProps && prop.borderProps.size > 0) {
    const groupedPropEntries = Object.entries(groupedPropsConfig)
    
    return (
      <>
        {groupedPropEntries.map(([groupedPropName, groupedPropConfig], index) => {
          if (groupedPropConfig.visible === false) {
            return null
          }
          
          const groupedPropKey = groupedPropName.toLowerCase()
          let groupedProp = prop.borderProps!.get(groupedPropKey)
          
          if (!groupedProp && groupedPropKey === 'border-color') {
            groupedProp = prop.borderProps!.get('border')
          }
          if (!groupedProp && groupedPropKey === 'text-color') {
            groupedProp = prop.borderProps!.get('text')
          }
          if (!groupedProp && (groupedPropKey.includes('-min-height') || groupedPropKey.includes('-height'))) {
            groupedProp = prop.borderProps!.get(groupedPropKey)
          }
          if (!groupedProp && (prop.name.toLowerCase() === 'spacing' || prop.name.toLowerCase() === 'layout')) {
            const structure = parseComponentStructure(componentName)
            const layoutVariant = selectedVariants['layout']
            if (layoutVariant) {
              const matchingProp = structure.props.find(p => 
                p.name.toLowerCase() === groupedPropKey &&
                p.isVariantSpecific &&
                p.variantProp === 'layout' &&
                p.path.includes(layoutVariant)
              )
              if (matchingProp) {
                groupedProp = matchingProp
                prop.borderProps!.set(groupedPropKey, matchingProp)
              }
            }
          }
          
          if (prop.name.toLowerCase() === 'spacing' && groupedProp) {
            const layoutVariant = selectedVariants['layout']
            if (layoutVariant) {
              const propBelongsToLayout = groupedProp.path.includes(layoutVariant)
              if (!propBelongsToLayout) {
                return null
              }
            }
          }
          
          if (!groupedProp) {
            return null
          }
          
          // Special handling for MenuItem background grouped prop: update all three background CSS variables
          const isMenuItem = componentName.toLowerCase().replace(/\s+/g, '-') === 'menu-item' || 
                             componentName.toLowerCase().replace(/\s+/g, '') === 'menuitem' ||
                             componentName === 'MenuItem' ||
                             componentName === 'Menu item'
          
          let cssVars = getCssVarsForProp(groupedProp)
          let primaryVar = cssVars[0] || groupedProp.cssVar
          
          if (groupedPropKey === 'background' && isMenuItem) {
            const defaultBgVar = buildComponentCssVarPath('MenuItem', 'variants', 'styles', 'default', 'properties', 'colors', selectedLayer, 'background')
            const selectedBgVar = buildComponentCssVarPath('MenuItem', 'properties', 'colors', selectedLayer, 'selected-background')
            const disabledBgVar = buildComponentCssVarPath('MenuItem', 'variants', 'styles', 'disabled', 'properties', 'colors', selectedLayer, 'background')
            
            primaryVar = defaultBgVar
            cssVars = [defaultBgVar, selectedBgVar, disabledBgVar]
          }
          
          // Special handling for MenuItem text grouped prop: update all variant text colors
          if (groupedPropKey === 'text' && isMenuItem) {
            const defaultTextVar = buildComponentCssVarPath('MenuItem', 'variants', 'styles', 'default', 'properties', 'colors', selectedLayer, 'text')
            const selectedTextVar = buildComponentCssVarPath('MenuItem', 'variants', 'styles', 'selected', 'properties', 'colors', selectedLayer, 'text')
            const disabledTextVar = buildComponentCssVarPath('MenuItem', 'variants', 'styles', 'disabled', 'properties', 'colors', selectedLayer, 'text')
            
            primaryVar = defaultTextVar
            cssVars = [defaultTextVar, selectedTextVar, disabledTextVar]
          }
          
          const label = groupedPropConfig.label || toSentenceCase(groupedPropName)
          
          return (
            <div 
              key={groupedPropName}
              style={{ marginTop: index > 0 ? 'var(--recursica-brand-dimensions-md)' : 0 }}
            >
              {renderControl(groupedProp, cssVars, primaryVar, label)}
            </div>
          )
        })}
      </>
    )
  }
  
  // Handle track prop
  if (prop.name.toLowerCase() === 'track' && (prop.trackSelectedProp || prop.trackUnselectedProp || prop.thumbProps)) {
    const trackSelectedCssVars = prop.trackSelectedProp ? getCssVarsForProp(prop.trackSelectedProp) : []
    const trackUnselectedCssVars = prop.trackUnselectedProp ? getCssVarsForProp(prop.trackUnselectedProp) : []
    const trackSelectedPrimaryVar = trackSelectedCssVars[0] || prop.trackSelectedProp?.cssVar
    const trackUnselectedPrimaryVar = trackUnselectedCssVars[0] || prop.trackUnselectedProp?.cssVar
    
    const trackWidthProp = prop.thumbProps?.get('track-width')
    const trackInnerPaddingProp = prop.thumbProps?.get('track-inner-padding')
    const trackBorderRadiusProp = prop.thumbProps?.get('track-border-radius')
    
    const structure = parseComponentStructure(componentName)
    const thumbProp = structure.props.find(p => 
      p.name.toLowerCase() === 'thumb' && 
      p.category === 'colors' &&
      (!p.isVariantSpecific || (p.variantProp && selectedVariants[p.variantProp] && p.path.includes(selectedVariants[p.variantProp]))) &&
      (p.category !== 'colors' || !p.path.includes('layer-') || p.path.includes(selectedLayer))
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
  
  // Handle thumb prop
  if (prop.name.toLowerCase() === 'thumb' && prop.thumbProps && prop.thumbProps.size > 0) {
    const thumbSelectedProp = prop.thumbProps.get('thumb-selected')
    const thumbUnselectedProp = prop.thumbProps.get('thumb-unselected')
    const thumbHeightProp = prop.thumbProps.get('thumb-height')
    const thumbWidthProp = prop.thumbProps.get('thumb-width')
    const thumbBorderRadiusProp = prop.thumbProps.get('thumb-border-radius')
    
    return (
      <>
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
      </>
    )
  }
  
  return renderControl(prop, cssVarsForControl, primaryCssVar, baseLabel)
}

