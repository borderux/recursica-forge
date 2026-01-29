/**
 * SegmentedControl Component Adapter
 * 
 * Unified SegmentedControl component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense, useState, useEffect } from 'react'
import { useComponent } from '../hooks/useComponent'
import { getComponentCssVar, getComponentLevelCssVar, buildComponentCssVarPath, getComponentTextCssVar } from '../utils/cssVarNames'
import { getElevationBoxShadow, parseElevationValue } from '../utils/brandCssVars'
import { useThemeMode } from '../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../core/css/readCssVar'
import { useCssVar } from '../hooks/useCssVar'
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
    
    // Get CSS variables - container properties
    const containerBgVar = buildComponentCssVarPath('SegmentedControl', 'properties', 'container', 'colors', layer, 'background')
    const containerBorderColorVar = buildComponentCssVarPath('SegmentedControl', 'properties', 'container', 'colors', layer, 'border-color')
    const containerBorderSizeVar = buildComponentCssVarPath('SegmentedControl', 'properties', 'container', 'border-size')
    const containerBorderRadiusVar = buildComponentCssVarPath('SegmentedControl', 'properties', 'container', 'border-radius')
    const containerPaddingVar = buildComponentCssVarPath('SegmentedControl', 'properties', 'container', 'padding')
    const containerElevationVar = buildComponentCssVarPath('SegmentedControl', 'properties', 'container', 'elevation')
    
    // Get CSS variables - selected properties
    const selectedBgVar = buildComponentCssVarPath('SegmentedControl', 'properties', 'selected', 'colors', layer, 'background')
    const selectedBorderColorVar = buildComponentCssVarPath('SegmentedControl', 'properties', 'selected', 'colors', layer, 'border-color')
    const selectedBorderSizeVar = buildComponentCssVarPath('SegmentedControl', 'properties', 'selected', 'border-size')
    const selectedBorderRadiusVar = buildComponentCssVarPath('SegmentedControl', 'properties', 'selected', 'border-radius')
    const selectedPaddingVar = buildComponentCssVarPath('SegmentedControl', 'properties', 'selected', 'padding')
    const selectedElevationVar = buildComponentCssVarPath('SegmentedControl', 'properties', 'selected', 'elevation')
    
    // Get CSS variables - text colors (still at component level)
    const textVar = getComponentCssVar('SegmentedControl', 'colors', 'text', layer)
    const selectedTextVar = getComponentCssVar('SegmentedControl', 'colors', 'selected-text', layer)
    
    // Get other properties
    const itemGapVar = getComponentLevelCssVar('SegmentedControl', 'item-gap')
    const iconSizeVar = getComponentLevelCssVar('SegmentedControl', 'icon')
    const iconGapVar = getComponentLevelCssVar('SegmentedControl', 'icon-text-gap')
    
    // Get divider properties
    const dividerColorVar = buildComponentCssVarPath('SegmentedControl', 'properties', 'colors', layer, 'divider-color')
    const dividerSizeVar = getComponentLevelCssVar('SegmentedControl', 'divider-size')
    
    // Get orientation-specific max-width/max-height
    const maxWidthVar = buildComponentCssVarPath('SegmentedControl', 'variants', 'orientation', 'horizontal', 'properties', 'max-width')
    const maxHeightVar = buildComponentCssVarPath('SegmentedControl', 'variants', 'orientation', 'vertical', 'properties', 'max-height')
    
    // Reactively read border-size and divider-size
    const borderSizeValue = useCssVar(containerBorderSizeVar, '1px')
    const selectedBorderSizeValue = useCssVar(selectedBorderSizeVar, '1px')
    const dividerSizeValue = useCssVar(dividerSizeVar, '1px')
    
    const currentValue = value ?? defaultValue ?? items[0]?.value
    const isVertical = orientation === 'vertical'
    
    // Get elevation box shadows reactively
    const containerElevationValue = useCssVar(containerElevationVar, 'elevation-0')
    const selectedElevationValue = useCssVar(selectedElevationVar, 'elevation-0')
    const elevationBoxShadow = containerElevationValue && containerElevationValue !== 'elevation-0' 
      ? getElevationBoxShadow(mode, containerElevationValue) 
      : undefined
    const selectedElevationBoxShadow = selectedElevationValue && selectedElevationValue !== 'elevation-0'
      ? getElevationBoxShadow(mode, selectedElevationValue)
      : undefined
    
    // Force re-render when CSS variables change by using state
    const [, forceUpdate] = useState(0)
    
    useEffect(() => {
      const handleCssVarUpdate = () => {
        forceUpdate(prev => prev + 1)
      }
      
      window.addEventListener('cssVarsUpdated', handleCssVarUpdate)
      window.addEventListener('cssVarsReset', handleCssVarUpdate)
      
      const observer = new MutationObserver(() => {
        forceUpdate(prev => prev + 1)
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
    }, [dividerSizeVar, dividerColorVar, dividerSizeValue])
    
    return (
      <div
        className={className}
        style={{
          display: isVertical ? 'flex' : 'inline-flex',
          flexDirection: isVertical ? 'column' : 'row',
          borderRadius: `var(${containerBorderRadiusVar})`,
          border: `${borderSizeValue} solid var(${containerBorderColorVar || textVar})`,
          background: `var(${containerBgVar})`,
          padding: `var(${containerPaddingVar})`,
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
          
          // Add divider between items (not after the last one, and not adjacent to selected item)
          // item-gap adds space on each side of the divider, whether or not divider is visible
          const isLastItem = index === items.length - 1
          const nextItem = items[index + 1]
          const isNextItemSelected = nextItem && currentValue === nextItem.value
          // Don't add divider if this item is selected or the next item is selected
          const shouldAddDivider = !isLastItem && !isSelected && !isNextItemSelected
          const spacingStyle: React.CSSProperties = {}
          
          // Always apply item-gap spacing between items (except after the last one)
          if (!isLastItem) {
            if (isVertical) {
              // Horizontal divider for vertical orientation
              // padding-bottom creates space before divider, margin-bottom creates space after divider
              spacingStyle.paddingBottom = `var(${itemGapVar})`
              spacingStyle.marginBottom = `var(${itemGapVar})`
            } else {
              // Vertical divider for horizontal orientation
              // padding-right creates space before divider, margin-right creates space after divider
              spacingStyle.paddingRight = `var(${itemGapVar})`
              spacingStyle.marginRight = `var(${itemGapVar})`
            }
          }
          
          // Only add divider border when divider should be visible
          if (shouldAddDivider) {
            // Use CSS variable with fallback chain - this is reactive and handles empty values correctly
            const dividerColorFallback = dividerColorVar || containerBorderColorVar || textVar
            const dividerColorValue = `var(${dividerColorFallback})`
            
            if (isVertical) {
              spacingStyle.borderBottom = `${dividerSizeValue} solid ${dividerColorValue}`
            } else {
              spacingStyle.borderRight = `${dividerSizeValue} solid ${dividerColorValue}`
            }
          }
          
          // Build border styles - use individual properties to avoid overriding divider borders
          const borderStyle: React.CSSProperties = {}
          if (isSelected) {
            // For selected items, set border on all sides except where divider will be
            const selectedBorder = `${selectedBorderSizeValue} solid var(${selectedBorderColorVar || selectedBgVar})`
            if (isVertical) {
              // Vertical orientation: divider is borderBottom, so set border on other sides
              borderStyle.borderTop = selectedBorder
              borderStyle.borderLeft = selectedBorder
              borderStyle.borderRight = selectedBorder
              // borderBottom will be set by spacingStyle if not last item, or here if last item
              if (isLastItem) {
                borderStyle.borderBottom = selectedBorder
              }
            } else {
              // Horizontal orientation: divider is borderRight, so set border on other sides
              borderStyle.borderTop = selectedBorder
              borderStyle.borderLeft = selectedBorder
              borderStyle.borderBottom = selectedBorder
              // borderRight will be set by spacingStyle if not last item, or here if last item
              if (isLastItem) {
                borderStyle.borderRight = selectedBorder
              }
            }
          }
          
          const button = (
            <button
              key={item.value}
              type="button"
              disabled={disabled || item.disabled}
              onClick={() => !disabled && !item.disabled && onChange?.(item.value)}
              style={{
                padding: isSelected ? `var(${selectedPaddingVar})` : `var(${containerPaddingVar})`,
                background: isSelected ? `var(${selectedBgVar})` : 'transparent',
                color: isSelected ? `var(${selectedTextVar})` : `var(${textVar})`,
                borderRadius: isSelected ? `var(${selectedBorderRadiusVar})` : `var(${containerBorderRadiusVar})`,
                cursor: disabled || item.disabled ? 'not-allowed' : 'pointer',
                flex: fullWidth && !isVertical ? 1 : 'none',
                width: fullWidth && isVertical ? '100%' : 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: hasIcon && hasLabel ? `var(${iconGapVar})` : undefined,
                transition: 'background-color 0.2s, color 0.2s, border 0.2s, box-shadow 0.2s',
                ...(isSelected && selectedElevationBoxShadow ? { boxShadow: selectedElevationBoxShadow } : {}),
                ...borderStyle,
                ...spacingStyle, // Divider borders override selected borders on divider side
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
