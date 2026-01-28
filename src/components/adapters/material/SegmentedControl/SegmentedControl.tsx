/**
 * Material UI SegmentedControl Implementation
 * 
 * Material UI-specific SegmentedControl component using ToggleButtonGroup.
 */

import { ToggleButtonGroup, ToggleButton } from '@mui/material'
import type { SegmentedControlProps as AdapterSegmentedControlProps } from '../../SegmentedControl'
import { getComponentCssVar, getComponentLevelCssVar, getComponentTextCssVar, buildComponentCssVarPath } from '../../../utils/cssVarNames'
import { getElevationBoxShadow, parseElevationValue } from '../../../utils/brandCssVars'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../../../core/css/readCssVar'
import { useState, useEffect } from 'react'
import { useCssVar } from '../../../hooks/useCssVar'
import { Tooltip } from '../../Tooltip'
import './SegmentedControl.css'

export default function SegmentedControl({
  items,
  value,
  defaultValue,
  onChange,
  orientation = 'horizontal',
  fullWidth = false,
  layer = 'layer-0',
  elevation,
  disabled = false,
  showLabel = true,
  className,
  style,
  material,
  ...props
}: AdapterSegmentedControlProps) {
  const { mode } = useThemeMode()
  
  // Map unified orientation to Material orientation
  const materialOrientation = orientation === 'vertical' ? 'vertical' : 'horizontal'
  const materialSize = 'medium' // Default size
  const isVertical = orientation === 'vertical'
  
  // Get CSS variables - colors are now at component level
  const bgVar = getComponentCssVar('SegmentedControl', 'colors', 'background', layer)
  const textVar = getComponentCssVar('SegmentedControl', 'colors', 'text', layer)
  const selectedBgVar = getComponentCssVar('SegmentedControl', 'colors', 'selected-background', layer)
  const selectedTextVar = getComponentCssVar('SegmentedControl', 'colors', 'selected-text', layer)
  const borderColorVar = getComponentCssVar('SegmentedControl', 'colors', 'border', layer)
  const selectedBorderColorVar = getComponentCssVar('SegmentedControl', 'colors', 'selected-border', layer)
  const borderRadiusVar = getComponentLevelCssVar('SegmentedControl', 'border-radius')
  const borderSizeVar = getComponentLevelCssVar('SegmentedControl', 'border-size')
  const selectedBorderSizeVar = getComponentLevelCssVar('SegmentedControl', 'selected-border-size')
  const paddingVar = getComponentLevelCssVar('SegmentedControl', 'padding')
  const itemGapVar = getComponentLevelCssVar('SegmentedControl', 'item-gap')
  const iconSizeVar = getComponentLevelCssVar('SegmentedControl', 'icon')
  const iconGapVar = getComponentLevelCssVar('SegmentedControl', 'icon-text-gap')
  
  // Get orientation-specific max-width/max-height
  const maxWidthVar = buildComponentCssVarPath('SegmentedControl', 'variants', 'orientation', 'horizontal', 'properties', 'max-width')
  const maxHeightVar = buildComponentCssVarPath('SegmentedControl', 'variants', 'orientation', 'vertical', 'properties', 'max-height')
  
  // Get text properties
  const fontFamilyVar = getComponentTextCssVar('SegmentedControl', 'text', 'font-family')
  const fontSizeVar = getComponentTextCssVar('SegmentedControl', 'text', 'font-size')
  const fontWeightVar = getComponentTextCssVar('SegmentedControl', 'text', 'font-weight')
  const letterSpacingVar = getComponentTextCssVar('SegmentedControl', 'text', 'letter-spacing')
  const lineHeightVar = getComponentTextCssVar('SegmentedControl', 'text', 'line-height')
  
  // Get elevation
  const selectedElevationVar = getComponentLevelCssVar('SegmentedControl', 'selected-elevation')
  
  // Reactively read border-size
  const borderSizeValue = useCssVar(borderSizeVar, '1px')
  const selectedBorderSizeValue = useCssVar(selectedBorderSizeVar, '1px')
  
  // Get elevation from CSS vars if not provided as props
  const elevationVar = getComponentLevelCssVar('SegmentedControl', 'elevation')
  const [elevationFromVar, setElevationFromVar] = useState<string | undefined>(() => {
    if (!elevationVar) return undefined
    const value = readCssVar(elevationVar)
    return value ? parseElevationValue(value) : undefined
  })
  
  useEffect(() => {
    if (!elevationVar) return
    
    const handleCssVarUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (!detail?.cssVars || detail.cssVars.includes(elevationVar)) {
        const value = readCssVar(elevationVar)
        setElevationFromVar(value ? parseElevationValue(value) : undefined)
      }
    }
    
    window.addEventListener('cssVarsUpdated', handleCssVarUpdate)
    window.addEventListener('cssVarsReset', handleCssVarUpdate)
    
    const observer = new MutationObserver(() => {
      const value = readCssVar(elevationVar)
      setElevationFromVar(value ? parseElevationValue(value) : undefined)
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    })
    
    return () => {
      window.removeEventListener('cssVarsUpdated', handleCssVarUpdate)
      window.removeEventListener('cssVarsReset', handleCssVarUpdate)
      observer.disconnect()
    }
  }, [elevationVar])
  
  // Get selected elevation
  const [selectedElevationFromVar, setSelectedElevationFromVar] = useState<string | undefined>(() => {
    if (!selectedElevationVar) return undefined
    const value = readCssVar(selectedElevationVar)
    return value ? parseElevationValue(value) : undefined
  })
  
  useEffect(() => {
    if (!selectedElevationVar) return
    
    const handleCssVarUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (!detail?.cssVars || detail.cssVars.includes(selectedElevationVar)) {
        const value = readCssVar(selectedElevationVar)
        setSelectedElevationFromVar(value ? parseElevationValue(value) : undefined)
      }
    }
    
    window.addEventListener('cssVarsUpdated', handleCssVarUpdate)
    window.addEventListener('cssVarsReset', handleCssVarUpdate)
    
    const observer = new MutationObserver(() => {
      const value = readCssVar(selectedElevationVar)
      setSelectedElevationFromVar(value ? parseElevationValue(value) : undefined)
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    })
    
    return () => {
      window.removeEventListener('cssVarsUpdated', handleCssVarUpdate)
      window.removeEventListener('cssVarsReset', handleCssVarUpdate)
      observer.disconnect()
    }
  }, [selectedElevationVar])
  
  const componentElevation = elevation ?? elevationFromVar ?? undefined
  const elevationBoxShadow = componentElevation && componentElevation !== 'elevation-0'
    ? getElevationBoxShadow(mode, componentElevation)
    : undefined
  const selectedElevationBoxShadow = selectedElevationFromVar && selectedElevationFromVar !== 'elevation-0'
    ? getElevationBoxShadow(mode, selectedElevationFromVar)
    : undefined
  
  const currentValue = value ?? defaultValue ?? items[0]?.value
  
  return (
    <ToggleButtonGroup
      value={currentValue}
      exclusive
      onChange={(_, newValue) => {
        if (newValue !== null && onChange) {
          onChange(newValue)
        }
      }}
      disabled={disabled}
      size={materialSize}
      orientation={materialOrientation}
      fullWidth={fullWidth}
      className={`recursica-segmented-control material-segmented-control ${className || ''}`}
      sx={{
        '--segmented-control-bg': `var(${bgVar})`,
        '--segmented-control-text': `var(${textVar})`,
        '--segmented-control-selected-bg': `var(${selectedBgVar})`,
        '--segmented-control-selected-text': `var(${selectedTextVar})`,
        '--segmented-control-border-color': `var(${borderColorVar || textVar})`,
        '--segmented-control-selected-border-color': `var(${selectedBorderColorVar || selectedBgVar})`,
        '--segmented-control-border-radius': `var(${borderRadiusVar})`,
        '--segmented-control-border-size': borderSizeValue,
        '--segmented-control-selected-border-size': selectedBorderSizeValue,
        '--segmented-control-selected-elevation': selectedElevationFromVar || 'elevation-0',
        '--segmented-control-padding': `var(${paddingVar})`,
        '--segmented-control-item-gap': `var(${itemGapVar})`,
        '--segmented-control-icon-text-gap': `var(${iconGapVar})`,
        '--segmented-control-font-family': `var(${fontFamilyVar})`,
        '--segmented-control-font-size': `var(${fontSizeVar})`,
        '--segmented-control-font-weight': `var(${fontWeightVar})`,
        '--segmented-control-letter-spacing': letterSpacingVar ? `var(${letterSpacingVar})` : 'normal',
        '--segmented-control-line-height': `var(${lineHeightVar})`,
        width: fullWidth ? '100%' : 'auto',
        maxWidth: !isVertical && maxWidthVar ? `var(${maxWidthVar})` : undefined,
        maxHeight: isVertical && maxHeightVar ? `var(${maxHeightVar})` : undefined,
        ...(elevationBoxShadow ? { boxShadow: elevationBoxShadow } : {}),
        ...material?.sx,
      }}
      style={style}
      {...material}
      {...props}
    >
      {items.map((item) => {
        const hasIcon = !!item.icon
        const hasLabel = !!item.label && showLabel
        const shouldShowTooltip = !showLabel && (item.tooltip || (typeof item.label === 'string' ? item.label : undefined))
        
        const toggleButton = (
          <ToggleButton
            key={item.value}
            value={item.value}
            disabled={item.disabled || disabled}
          >
            {hasIcon && (
              <span style={{
                display: 'flex',
                alignItems: 'center',
                width: iconSizeVar ? `var(${iconSizeVar})` : '16px',
                height: iconSizeVar ? `var(${iconSizeVar})` : '16px',
                flexShrink: 0,
                marginRight: hasLabel && iconGapVar ? `var(${iconGapVar})` : undefined,
              }}>
                {item.icon}
              </span>
            )}
            {hasLabel && <span>{item.label}</span>}
          </ToggleButton>
        )
        
        if (shouldShowTooltip) {
          return (
            <Tooltip
              key={item.value}
              label={item.tooltip || (typeof item.label === 'string' ? item.label : '')}
              position="top"
              layer={layer}
            >
              {toggleButton}
            </Tooltip>
          )
        }
        
        return toggleButton
      })}
    </ToggleButtonGroup>
  )
}
