/**
 * IconGroupToolbar Component
 * 
 * A reusable toolbar for editing icon properties (icon-size, icon-text-gap, optional icon colors)
 * for component icon groups.
 */

import React, { useMemo } from 'react'
import { ComponentProp, parseComponentStructure } from '../../utils/componentToolbarUtils'
import BrandDimensionSliderInline from '../../utils/BrandDimensionSliderInline'
import PaletteColorControl from '../../../forms/PaletteColorControl'
import type { ToolbarPropConfig } from '../../utils/loadToolbarConfig'
import { Switch } from '../../../../components/adapters/Switch'
import { SegmentedControl } from '../../../../components/adapters/SegmentedControl'
import { Label } from '../../../../components/adapters/Label'
import { useCssVar } from '../../../../components/hooks/useCssVar'
import { updateCssVar } from '../../../../core/css/updateCssVar'
import { getComponentLevelCssVar } from '../../../../components/utils/cssVarNames'
import { iconNameToReactComponent } from '../../../components/iconUtils'
import IconSelector from '../../../components/IconSelector'
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

  // Check visibility from toolbar config
  const iconSizeVisible = groupedPropsConfig?.['icon-size']?.visible !== false ||
    groupedPropsConfig?.['icon']?.visible !== false
  const iconGapVisible = groupedPropsConfig?.['icon-text-gap']?.visible !== false ||
    groupedPropsConfig?.['spacing']?.visible !== false

  // Get visibility and theme-agnostic CSS vars for logical icon settings
  const showIconConfig = groupedPropsConfig?.['showIcon']
  const iconNameConfig = groupedPropsConfig?.['iconName']
  const iconPositionConfig = groupedPropsConfig?.['iconPosition']

  const componentKebab = componentName.toLowerCase().replace(/\s+/g, '-')
  const showIconVar = showIconConfig ? `--recursica-ui-kit-components-${componentKebab}-properties-show-icon` : ''
  const iconNameVar = iconNameConfig ? `--recursica-ui-kit-components-${componentKebab}-properties-icon-name` : ''
  const iconPositionVar = iconPositionConfig ? `--recursica-ui-kit-components-${componentKebab}-properties-icon-position` : ''

  const showIconValue = useCssVar(showIconVar, 'false')
  const isShowIconActive = String(showIconValue) === 'true'
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
      {isShowIconActive && iconGapVar && iconGapVisible && (
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
              label={colorProp.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            />
          </div>
        ) : null
      })}
    </div>
  )
}
