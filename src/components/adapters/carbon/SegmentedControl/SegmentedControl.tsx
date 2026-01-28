/**
 * Carbon SegmentedControl Implementation
 * 
 * Carbon-specific SegmentedControl component.
 * Note: Carbon doesn't have a native SegmentedControl, so we'll use a custom implementation.
 */

import type { SegmentedControlProps as AdapterSegmentedControlProps } from '../../SegmentedControl'
import { getComponentCssVar, getComponentLevelCssVar, getComponentTextCssVar, buildComponentCssVarPath } from '../../../utils/cssVarNames'
import { getElevationBoxShadow, parseElevationValue } from '../../../utils/brandCssVars'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../../../core/css/readCssVar'
import { useState, useEffect } from 'react'
import { useCssVar } from '../../../hooks/useCssVar'
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
  className,
  style,
  carbon,
  ...props
}: AdapterSegmentedControlProps) {
  const { mode } = useThemeMode()
  
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
  
  const componentElevation = elevation ?? elevationFromVar ?? undefined
  const elevationBoxShadow = componentElevation && componentElevation !== 'elevation-0'
    ? getElevationBoxShadow(mode, componentElevation)
    : undefined
  
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
  
  const selectedElevationBoxShadow = selectedElevationFromVar && selectedElevationFromVar !== 'elevation-0'
    ? getElevationBoxShadow(mode, selectedElevationFromVar)
    : undefined
  
  const currentValue = value ?? defaultValue ?? items[0]?.value
  const isVertical = orientation === 'vertical'
  
  return (
    <div
      className={`recursica-segmented-control carbon-segmented-control ${className || ''}`}
      style={{
        '--segmented-control-bg': `var(${bgVar})`,
        '--segmented-control-text': `var(${textVar})`,
        '--segmented-control-selected-bg': `var(${selectedBgVar})`,
        '--segmented-control-selected-text': `var(${selectedTextVar})`,
        '--segmented-control-border-color': `var(${borderColorVar || textVar})`,
        '--segmented-control-selected-border-color': `var(${selectedBorderColorVar || selectedBgVar})`,
        '--segmented-control-border-radius': `var(${borderRadiusVar})`,
        '--segmented-control-border-size': borderSizeValue,
        '--segmented-control-selected-border-size': selectedBorderSizeValue,
        '--segmented-control-padding': `var(${paddingVar})`,
        '--segmented-control-item-gap': `var(${itemGapVar})`,
        '--segmented-control-icon-text-gap': `var(${iconGapVar})`,
        '--segmented-control-font-family': `var(${fontFamilyVar})`,
        '--segmented-control-font-size': `var(${fontSizeVar})`,
        '--segmented-control-font-weight': `var(${fontWeightVar})`,
        '--segmented-control-letter-spacing': letterSpacingVar ? `var(${letterSpacingVar})` : 'normal',
        '--segmented-control-line-height': `var(${lineHeightVar})`,
        display: isVertical ? 'flex' : 'inline-flex',
        flexDirection: isVertical ? 'column' : 'row',
        gap: `var(${itemGapVar})`,
        borderRadius: `var(${borderRadiusVar})`,
        border: `${borderSizeValue} solid var(${borderColorVar || textVar})`,
        background: `var(${bgVar})`,
        padding: `var(${paddingVar})`,
        width: fullWidth ? '100%' : 'auto',
        maxWidth: !isVertical && maxWidthVar ? `var(${maxWidthVar})` : undefined,
        maxHeight: isVertical && maxHeightVar ? `var(${maxHeightVar})` : undefined,
        fontFamily: `var(${fontFamilyVar})`,
        fontSize: `var(${fontSizeVar})`,
        fontWeight: `var(${fontWeightVar})`,
        letterSpacing: letterSpacingVar ? `var(${letterSpacingVar})` : 'normal',
        lineHeight: `var(${lineHeightVar})`,
        ...(elevationBoxShadow ? { boxShadow: elevationBoxShadow } : {}),
        ...style,
      } as React.CSSProperties}
      {...carbon}
      {...props}
    >
      {items.map((item, index) => {
        const isSelected = currentValue === item.value
        const hasIcon = !!item.icon
        const hasLabel = !!item.label
        
        return (
          <button
            key={item.value}
            type="button"
            disabled={disabled || item.disabled}
            onClick={() => !disabled && !item.disabled && onChange?.(item.value)}
            className={`carbon-segmented-control-button ${isSelected ? 'selected' : ''}`}
            style={{
              padding: `var(${paddingVar})`,
              background: isSelected ? `var(${selectedBgVar})` : 'transparent',
              color: isSelected ? `var(${selectedTextVar})` : `var(${textVar})`,
              border: isSelected ? `${selectedBorderSizeValue} solid var(${selectedBorderColorVar || selectedBgVar})` : 'none',
              borderRadius: `var(${borderRadiusVar})`,
              cursor: disabled || item.disabled ? 'not-allowed' : 'pointer',
              flex: fullWidth && !isVertical ? 1 : 'none',
              width: fullWidth && isVertical ? '100%' : 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: hasIcon && hasLabel ? (iconGapVar ? `var(${iconGapVar})` : '8px') : undefined,
              transition: 'background-color 0.2s, color 0.2s, border 0.2s, box-shadow 0.2s',
              borderRight: !isVertical && index < items.length - 1 && !isSelected ? `1px solid var(${borderColorVar || textVar})` : 'none',
              borderBottom: isVertical && index < items.length - 1 && !isSelected ? `1px solid var(${borderColorVar || textVar})` : 'none',
              ...(isSelected && selectedElevationBoxShadow ? { boxShadow: selectedElevationBoxShadow } : {}),
            }}
          >
            {hasIcon && (
              <span style={{
                display: 'flex',
                alignItems: 'center',
                width: iconSizeVar ? `var(${iconSizeVar})` : '16px',
                height: iconSizeVar ? `var(${iconSizeVar})` : '16px',
                flexShrink: 0,
              }}>
                {item.icon}
              </span>
            )}
            {hasLabel && <span>{item.label}</span>}
          </button>
        )
      })}
    </div>
  )
}
