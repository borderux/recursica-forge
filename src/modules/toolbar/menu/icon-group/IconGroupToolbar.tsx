import { getVarsStore } from '../../../../core/store/varsStore'
/**
 * IconGroupToolbar Component
 * 
 * A reusable toolbar for editing icon properties (icon-size, icon-text-gap, optional icon colors)
 * for component icon groups.
 */

import React, { useMemo, useState, useCallback } from 'react'
import { ComponentProp, parseComponentStructure } from '../../utils/componentToolbarUtils'
import BrandDimensionSliderInline from '../../utils/BrandDimensionSliderInline'
import PaletteColorControl from '../../../forms/PaletteColorControl'
import type { ToolbarPropConfig } from '../../utils/loadToolbarConfig'
import { Switch } from '../../../../components/adapters/Switch'
import { SegmentedControl } from '../../../../components/adapters/SegmentedControl'
import { Label } from '../../../../components/adapters/Label'
import { useCssVar } from '../../../../components/hooks/useCssVar'
import { updateCssVar } from '../../../../core/css/updateCssVar'
import { readCssVar } from '../../../../core/css/readCssVar'
import { getComponentLevelCssVar } from '../../../../components/utils/cssVarNames'
import { iconNameToReactComponent } from '../../../components/iconUtils'
import IconSelector from '../../../components/IconSelector'
import { Slider } from '../../../../components/adapters/Slider'
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

  // Standard prop names handled explicitly — anything else in groupedPropsConfig is "extra"
  const standardIconPropNames = new Set([
    'icon-size', 'icon', 'close-icon-size',
    'icon-text-gap', 'spacing',
    'showIcon', 'iconName', 'iconPosition',
    'max-width',
    ...colorProps.map(p => p.toLowerCase()),
  ])

  const extraPropNames = groupedPropsConfig
    ? Object.keys(groupedPropsConfig).filter(
        k => !standardIconPropNames.has(k) && groupedPropsConfig[k]?.visible !== false
      )
    : []

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
      // Prefer exact match, but also accept any icon-size or bare "icon" variant
      if (propNameLower === sizePropName.toLowerCase() || propNameLower === 'icon-size' || propNameLower === 'icon') {
        if (p.isVariantSpecific && p.variantProp) {
          // Map JSON structure key to toolbar variant key
          const variantKey = p.variantProp === 'sizes' ? 'size' :
                             p.variantProp === 'styles' ? 'style' :
                             p.variantProp === 'layouts' ? 'layout' : p.variantProp
          const selectedVariant = selectedVariants[variantKey]
          if (!selectedVariant) return false
          if (!p.path.includes(selectedVariant)) return false
        }
        // Ensure the prop is a dimension type (not a color, etc.)
        if (p.category !== 'size') return false
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
        // Map JSON structure key to toolbar variant key
        const variantKey = p.variantProp === 'sizes' ? 'size' :
                           p.variantProp === 'styles' ? 'style' :
                           p.variantProp === 'layouts' ? 'layout' : p.variantProp
        const selectedVariant = selectedVariants[variantKey]
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
      // Try exact match first, then try without '-color' suffix (e.g., 'icon-color' -> 'icon')
      const namesToTry = [colorPropName.toLowerCase()]
      if (colorPropName.toLowerCase().endsWith('-color')) {
        namesToTry.push(colorPropName.toLowerCase().replace(/-color$/, ''))
      }

      return structure.props.find(p => {
        if (!namesToTry.includes(p.name.toLowerCase())) return false
        if (p.category !== 'colors') return false
        if (p.isVariantSpecific && p.variantProp) {
          const selectedVariant = selectedVariants[p.variantProp]
          if (!selectedVariant) return false
          if (!p.path.includes(selectedVariant)) return false
        }
        // For Link, icon color is under state variants - also accept 'states' in path
        if (p.path.includes('states')) {
          const selectedState = selectedVariants?.states || 'default'
          if (!p.path.includes(selectedState)) return false
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

  // Find max-width prop
  const maxWidthProp = useMemo(() => {
    return structure.props.find(p => p.name.toLowerCase() === 'max-width')
  }, [structure])
  const maxWidthVar = maxWidthProp?.cssVar || ''
  const maxWidthVisible = groupedPropsConfig?.['max-width']?.visible !== false
  const maxWidthLabel = groupedPropsConfig?.['max-width']?.label || 'Max width'

  // Check visibility from toolbar config
  const iconSizeVisible = groupedPropsConfig?.['icon-size']?.visible !== false ||
    groupedPropsConfig?.['icon']?.visible !== false
  const iconGapVisible = groupedPropsConfig?.['icon-text-gap']?.visible !== false ||
    groupedPropsConfig?.['spacing']?.visible !== false
  const closeIconSizeVisible = groupedPropsConfig?.['close-icon-size']?.visible !== false

  // Get visibility and theme-agnostic CSS vars for logical icon settings
  const showIconConfig = groupedPropsConfig?.['showIcon']
  const iconNameConfig = groupedPropsConfig?.['iconName']
  const iconPositionConfig = groupedPropsConfig?.['iconPosition']

  const componentKebab = componentName.toLowerCase().replace(/\s+/g, '-')
  const showIconVar = showIconConfig ? `--recursica_ui-kit_components_${componentKebab}-properties-show-icon` : ''
  const iconNameVar = iconNameConfig ? `--recursica_ui-kit_components_${componentKebab}-properties-icon-name` : ''
  const iconPositionVar = iconPositionConfig ? `--recursica_ui-kit_components_${componentKebab}-properties-icon-position` : ''

  const showIconValue = useCssVar(showIconVar, 'false')
  // If there's no showIcon config, treat the icon as always active
  const isShowIconActive = showIconConfig ? String(showIconValue) === 'true' : true
  const iconPositionValue = useCssVar(iconPositionVar, 'end')

  // Helper to update CSS var and dispatch event (since UIKit vars are silent by default)
  const handleUpdateProp = (cssVar: string, value: string) => {
    updateCssVar(cssVar, value)
    window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
      detail: { cssVars: [cssVar] }
    }))
  }

  // Resolve icons for position control
  const StartIconComp = iconNameToReactComponent('align-left')
  const EndIconComp = iconNameToReactComponent('align-right')

  return (
    <div className="icon-group-toolbar">
      {showIconConfig && showIconConfig.visible !== false && (
        <div className="icon-group-control">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <Label layer="layer-3" layout="stacked">Show Icon</Label>
            <Switch
              checked={String(showIconValue) === 'true'}
              onChange={(checked) => handleUpdateProp(showIconVar, String(checked))}
              layer="layer-1"
            />
          </div>
        </div>
      )}
      {isShowIconActive && iconNameConfig && iconNameConfig.visible !== false && (
        <div className="icon-group-control">
          <IconSelector
            targetCssVar={iconNameVar}
            label="Icon"
            allowedIconNames={componentName === 'Link' ? [
              // Standard Arrows
              'arrow-right', 'arrow-left', 'arrow-up', 'arrow-down',
              'arrow-long-right', 'arrow-long-left', 'arrow-long-up', 'arrow-long-down',
              'arrow-line-right', 'arrow-line-left', 'arrow-line-up', 'arrow-line-down',
              'arrow-bend-right-down', 'arrow-clockwise', 'arrow-path',

              // Chevrons & Carets
              'chevron-right', 'chevron-left', 'chevron-up', 'chevron-down',
              'chevron-double-right', 'caret-right', 'caret-left', 'caret-up', 'caret-down',

              // Link & Navigation
              'link', 'external-link', 'arrow-top-right-on-square',
              'sign-out', 'upload', 'download', 'share',

              // Contextual & UI
              'house', 'home', 'user', 'info', 'warning', 'check', 'check-circle',
              'plus', 'minus', 'x', 'x-mark', 'trash', 'pencil', 'edit',
              'eye', 'eye-slash', 'article', 'file-text', 'document-text',
              'magnifying-glass', 'search', 'bell', 'envelope', 'chat',
              'star', 'heart', 'thumbs-up', 'bug'
            ] : undefined}
          />
        </div>
      )}
      {isShowIconActive && iconPositionConfig && iconPositionConfig.visible !== false && (
        <div className="icon-group-control">
          <Label layer="layer-3" layout="stacked">Position</Label>
          <SegmentedControl
            items={[
              {
                value: 'start',
                label: 'Start',
                icon: StartIconComp ? React.createElement(StartIconComp, { size: 16 }) : undefined,
                tooltip: 'Start'
              },
              {
                value: 'end',
                label: 'End',
                icon: EndIconComp ? React.createElement(EndIconComp, { size: 16 }) : undefined,
                tooltip: 'End'
              }
            ]}
            value={String(iconPositionValue) || 'end'}
            onChange={(value) => handleUpdateProp(iconPositionVar, value)}
            layer="layer-1"
            showLabel={false}
          />
        </div>
      )}
      {isShowIconActive && iconSizeVar && iconSizeVisible && (
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
      {isShowIconActive && iconGapVar && iconGapVisible && (
      <div className="icon-group-control">
        <BrandDimensionSliderInline
          targetCssVar={iconGapVar}
          label="Icon-text gap"
          dimensionCategory="general"
          layer="layer-1"
        />
      </div>
    )
  }
  {
    maxWidthVar && maxWidthVisible && groupedPropsConfig?.['max-width'] && (() => {
      const MaxWidthSlider = () => {
        const minValue = 100
        const maxValue = 500
        const [value, setValue] = useState(() => {
          const raw = readCssVar(maxWidthVar)
          const match = (raw || '').match(/^(\d+(?:\.\d+)?)px$/i)
          return match ? Math.max(minValue, Math.min(maxValue, parseFloat(match[1]))) : 200
        })
        const handleChange = useCallback((val: number | [number, number]) => {
          const num = Math.max(minValue, Math.min(maxValue, Math.round(typeof val === 'number' ? val : val[0])))
          setValue(num)
          updateCssVar(maxWidthVar, `${num}px`)
          window.dispatchEvent(new CustomEvent('cssVarsUpdated', { detail: { cssVars: [maxWidthVar] } }))
        }, [maxWidthVar])
        return (
          <Slider
            value={value}
            onChange={handleChange}
            onChangeCommitted={handleChange}
            min={minValue}
            max={maxValue}
            step={1}
            layer="layer-1"
            layout="stacked"
            showInput={false}
            showValueLabel={true}
            valueLabel={(v: number) => `${v}px`}
            minLabel={`${minValue}px`}
            maxLabel={`${maxValue}px`}
            showMinMaxLabels={false}
            label={<Label layer="layer-1" layout="stacked">{maxWidthLabel}</Label>}
          />
        )
      }
      return <div className="icon-group-control"><MaxWidthSlider /></div>
    })()}
  {
    includeColors && iconColorProps.map((colorProp, index) => {
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
    })
  }
  {
    extraPropNames.map(propName => {
      const extraProp = structure.props.find(p => p.name.toLowerCase() === propName.toLowerCase())
      if (!extraProp?.cssVar) return null
      const label = groupedPropsConfig?.[propName]?.label || propName
      return (
        <div key={extraProp.cssVar} className="icon-group-control">
          <BrandDimensionSliderInline
            targetCssVar={extraProp.cssVar}
            label={label}
            dimensionCategory="general"
            layer="layer-1"
          />
        </div>
      )
    })
  }
    </div >
  )
}
