/**
 * SegmentedControl Component Adapter
 * 
 * Unified SegmentedControl component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import { getComponentCssVar, getComponentLevelCssVar, buildComponentCssVarPath, getComponentTextCssVar } from '../utils/cssVarNames'
import { getElevationBoxShadow, parseElevationValue } from '../utils/brandCssVars'
import { useThemeMode } from '../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../core/css/readCssVar'
import { Tooltip } from './Tooltip'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'

export type SegmentedControlItem = {
  value: string
  label?: React.ReactNode
  icon?: React.ReactNode
  disabled?: boolean
  tooltip?: string // Tooltip text to show when label is hidden
}

export type SegmentedControlProps = {
  items: SegmentedControlItem[]
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  orientation?: 'horizontal' | 'vertical'
  fullWidth?: boolean
  layer?: ComponentLayer
  elevation?: string // e.g., "elevation-0", "elevation-1", etc.
  disabled?: boolean
  showLabel?: boolean // Whether to show labels (default: true)
  className?: string
  style?: React.CSSProperties
} & LibrarySpecificProps

export function SegmentedControl({
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
  mantine,
  material,
  carbon,
}: SegmentedControlProps) {
  const Component = useComponent('SegmentedControl')
  
  if (!Component) {
    // Fallback to native implementation
    const { mode } = useThemeMode()
    
    // Get CSS variables - colors are now at component level
    const bgVar = getComponentCssVar('SegmentedControl', 'colors', 'background', layer)
    const textVar = getComponentCssVar('SegmentedControl', 'colors', 'text', layer)
    const borderColorVar = getComponentCssVar('SegmentedControl', 'colors', 'border', layer)
    const selectedBgVar = getComponentCssVar('SegmentedControl', 'colors', 'selected-background', layer)
    const selectedTextVar = getComponentCssVar('SegmentedControl', 'colors', 'selected-text', layer)
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
    
    // Get elevation
    const elevationVar = getComponentLevelCssVar('SegmentedControl', 'elevation')
    const selectedElevationVar = getComponentLevelCssVar('SegmentedControl', 'selected-elevation')
    
    const borderSizeValue = readCssVar(borderSizeVar) || '1px'
    const selectedBorderSizeValue = readCssVar(selectedBorderSizeVar) || '1px'
    const currentValue = value ?? defaultValue ?? items[0]?.value
    const isVertical = orientation === 'vertical'
    
    // Get elevation box shadows
    const elevationValue = readCssVar(elevationVar)
    const selectedElevationValue = readCssVar(selectedElevationVar)
    const elevationBoxShadow = elevationValue && elevationValue !== 'elevation-0' 
      ? getElevationBoxShadow(mode, elevationValue) 
      : undefined
    const selectedElevationBoxShadow = selectedElevationValue && selectedElevationValue !== 'elevation-0'
      ? getElevationBoxShadow(mode, selectedElevationValue)
      : undefined
    
    return (
      <div
        className={className}
        style={{
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
          ...(elevationBoxShadow ? { boxShadow: elevationBoxShadow } : {}),
          ...style,
        }}
      >
        {items.map((item, index) => {
          const isSelected = currentValue === item.value
          const hasIcon = !!item.icon
          const hasLabel = !!item.label && showLabel
          const shouldShowTooltip = !showLabel && (item.tooltip || (typeof item.label === 'string' ? item.label : undefined))
          
          const button = (
            <button
              key={item.value}
              type="button"
              disabled={disabled || item.disabled}
              onClick={() => !disabled && !item.disabled && onChange?.(item.value)}
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
                gap: hasIcon && hasLabel ? `var(${iconGapVar})` : undefined,
                transition: 'background-color 0.2s, color 0.2s, border 0.2s, box-shadow 0.2s',
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
          
          if (shouldShowTooltip) {
            return (
              <Tooltip
                key={item.value}
                label={item.tooltip || (typeof item.label === 'string' ? item.label : '')}
                position="top"
                layer={layer}
              >
                {button}
              </Tooltip>
            )
          }
          
          return button
        })}
      </div>
    )
  }
  
  return (
    <Suspense fallback={<div style={{ width: fullWidth ? '100%' : 'auto', height: '40px' }} />}>
      <Component
        items={items}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        orientation={orientation}
        fullWidth={fullWidth}
        layer={layer}
        elevation={elevation}
        disabled={disabled}
        showLabel={showLabel}
        className={className}
        style={style}
        mantine={mantine}
        material={material}
        carbon={carbon}
      />
    </Suspense>
  )
}
