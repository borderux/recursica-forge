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
import type { ComponentLayer, LibrarySpecificProps, ComponentName } from '../registry/types'
import './SegmentedControl.css'

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
  componentNameForCssVars?: ComponentName // Component name to use for CSS variables (default: 'SegmentedControl')
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
  componentNameForCssVars = 'SegmentedControl' as ComponentName,
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
    const containerBgVar = buildComponentCssVarPath(componentNameForCssVars, 'properties', 'container', 'colors', layer, 'background')
    const containerBorderColorVar = buildComponentCssVarPath(componentNameForCssVars, 'properties', 'container', 'colors', layer, 'border-color')
    const containerBorderSizeVar = buildComponentCssVarPath(componentNameForCssVars, 'properties', 'container', 'border-size')
    const containerBorderRadiusVar = buildComponentCssVarPath(componentNameForCssVars, 'properties', 'container', 'border-radius')
    const containerElevationVar = buildComponentCssVarPath(componentNameForCssVars, 'properties', 'container', 'elevation')
    
    // Get CSS variables - padding (applied to all items)
    const paddingHorizontalVar = buildComponentCssVarPath(componentNameForCssVars, 'properties', 'item', 'padding-horizontal')
    const heightVar = buildComponentCssVarPath(componentNameForCssVars, 'properties', 'item', 'height')
    
    // Get CSS variables - selected properties
    const selectedBgVar = buildComponentCssVarPath(componentNameForCssVars, 'properties', 'selected', 'colors', layer, 'background')
    const selectedBorderColorVar = buildComponentCssVarPath(componentNameForCssVars, 'properties', 'selected', 'colors', layer, 'border-color')
    const selectedBorderSizeVar = buildComponentCssVarPath(componentNameForCssVars, 'properties', 'selected', 'border-size')
    const selectedElevationVar = buildComponentCssVarPath(componentNameForCssVars, 'properties', 'selected', 'elevation')
    
    // Get CSS variables - item properties (applied to both regular and selected items)
    const itemBorderRadiusVar = buildComponentCssVarPath(componentNameForCssVars, 'properties', 'item', 'border-radius')
    
    // Get CSS variables - text colors
    // For SegmentedControlItem, text color is under properties.container.colors.layer-X.text-color
    // For SegmentedControl, text color is under properties.container.colors.layer-X.text-color
    // Selected text color is always under properties.selected.colors.layer-X.text-color
    const textVar = componentNameForCssVars === 'SegmentedControlItem'
      ? buildComponentCssVarPath('SegmentedControl', 'properties', 'container', 'colors', layer, 'text-color')
      : buildComponentCssVarPath(componentNameForCssVars, 'properties', 'container', 'colors', layer, 'text-color')
    const selectedTextVar = buildComponentCssVarPath(componentNameForCssVars, 'properties', 'selected', 'colors', layer, 'text-color')
    
    // Get text style properties
    const fontFamilyVar = getComponentTextCssVar(componentNameForCssVars, 'text', 'font-family')
    const fontSizeVar = getComponentTextCssVar(componentNameForCssVars, 'text', 'font-size')
    const fontWeightVar = getComponentTextCssVar(componentNameForCssVars, 'text', 'font-weight')
    const letterSpacingVar = getComponentTextCssVar(componentNameForCssVars, 'text', 'letter-spacing')
    const lineHeightVar = getComponentTextCssVar(componentNameForCssVars, 'text', 'line-height')
    const textDecorationVar = getComponentTextCssVar(componentNameForCssVars, 'text', 'text-decoration')
    const textTransformVar = getComponentTextCssVar(componentNameForCssVars, 'text', 'text-transform')
    const fontStyleVar = getComponentTextCssVar(componentNameForCssVars, 'text', 'font-style')
    
    // Get other properties
    const itemGapVar = getComponentLevelCssVar(componentNameForCssVars, 'item-gap')
    const iconSizeVar = buildComponentCssVarPath(componentNameForCssVars, 'properties', 'item', 'icon-size')
    const iconGapVar = buildComponentCssVarPath(componentNameForCssVars, 'properties', 'item', 'icon-text-gap')
    
    const paddingHorizontalValue = readCssVar(paddingHorizontalVar)
    const heightValue = readCssVar(heightVar)
    const iconGapValue = iconGapVar ? readCssVar(iconGapVar) : null
    const iconSizeValue = readCssVar(iconSizeVar)
    
    // Get divider properties (always from SegmentedControl as these are container-level)
    const dividerColorVar = buildComponentCssVarPath('SegmentedControl', 'properties', 'colors', layer, 'divider-color')
    const dividerSizeVar = getComponentLevelCssVar('SegmentedControl', 'divider-size')
    
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
    }, [dividerSizeVar, dividerColorVar, dividerSizeValue, textDecorationVar, textTransformVar, fontStyleVar, selectedTextVar, selectedElevationVar, selectedBorderSizeVar, paddingHorizontalVar, heightVar])
    
    return (
      <div
        className={`recursica-segmented-control-fallback ${className || ''}`}
        data-orientation={isVertical ? 'vertical' : 'horizontal'}
        style={{
          display: isVertical ? 'flex' : 'inline-flex',
          flexDirection: isVertical ? 'column' : 'row',
          borderRadius: `var(${containerBorderRadiusVar})`,
          border: `${borderSizeValue} solid var(${containerBorderColorVar || textVar})`,
          background: `var(${containerBgVar})`,
          paddingLeft: paddingHorizontalValue ? `var(${paddingHorizontalVar})` : undefined,
          paddingRight: paddingHorizontalValue ? `var(${paddingHorizontalVar})` : undefined,
          width: fullWidth ? '100%' : 'auto',
          overflow: 'visible',
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
          
          // Always apply item-gap spacing between items - divider has full gap on both sides
          // Item-gap only affects margin, not padding - padding remains uniform for all items
          // Explicitly ensure first item has no left/top margin and last item has no right/bottom margin
          if (index > 0) {
            if (isVertical) {
              // Horizontal divider for vertical orientation
              // margin-top creates space before the item (equal to item-gap)
              spacingStyle.marginTop = `var(${itemGapVar})`
            } else {
              // Vertical divider for horizontal orientation
              // margin-left creates space before the item (equal to item-gap)
              spacingStyle.marginLeft = `var(${itemGapVar})`
            }
          } else {
            // First item: explicitly set margin to 0
            if (isVertical) {
              spacingStyle.marginTop = '0'
            } else {
              spacingStyle.marginLeft = '0'
            }
          }
          if (!isLastItem) {
            if (isVertical) {
              // margin-bottom creates space after the item (equal to item-gap)
              spacingStyle.marginBottom = `var(${itemGapVar})`
            } else {
              // margin-right creates space after the item (equal to item-gap)
              spacingStyle.marginRight = `var(${itemGapVar})`
            }
          } else {
            // Last item: explicitly set margin to 0
            if (isVertical) {
              spacingStyle.marginBottom = '0'
            } else {
              spacingStyle.marginRight = '0'
            }
          }
          
          // Dividers are now handled via CSS pseudo-elements, not borders
          
          // Build border styles - use individual properties to avoid overriding divider borders
          const borderStyle: React.CSSProperties = {}
          if (isSelected) {
            // For selected items, set border on all sides
            const selectedBorder = `${selectedBorderSizeValue} solid var(${selectedBorderColorVar || selectedBgVar})`
            // Always set all borders first
            borderStyle.borderTop = selectedBorder
            borderStyle.borderLeft = selectedBorder
            borderStyle.borderRight = selectedBorder
            borderStyle.borderBottom = selectedBorder
            // Then spacingStyle will override the divider side if needed
          }
          
          const paddingHorizontalValue = readCssVar(paddingHorizontalVar)
          const heightValue = readCssVar(heightVar)
          const iconGapValue = iconGapVar ? readCssVar(iconGapVar) : null
          
          const button = (
            <button
              key={item.value}
              type="button"
              disabled={disabled || item.disabled}
              onClick={() => !disabled && !item.disabled && onChange?.(item.value)}
              data-selected={isSelected ? 'true' : undefined}
              style={{
                // Base padding - will be overridden by spacingStyle if item-gap applies
                height: heightValue ? `var(${heightVar})` : 'auto',
                paddingLeft: paddingHorizontalValue ? `var(${paddingHorizontalVar})` : '0px',
                paddingRight: paddingHorizontalValue ? `var(${paddingHorizontalVar})` : '0px',
                background: isSelected ? `var(${selectedBgVar})` : 'transparent',
                color: isSelected ? `var(${selectedTextVar})` : `var(${textVar})`,
                borderRadius: `var(${itemBorderRadiusVar})`,
                cursor: disabled || item.disabled ? 'not-allowed' : 'pointer',
                flex: fullWidth && !isVertical ? 1 : 'none',
                width: fullWidth && isVertical ? '100%' : 'auto',
                minWidth: fullWidth ? undefined : 'fit-content', // Ensure button expands to fit content when auto-width
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: hasIcon && hasLabel ? (iconGapVar && iconGapValue ? `var(${iconGapVar})` : (iconGapVar && !iconGapValue ? '0px' : undefined)) : undefined,
                transition: 'background-color 0.2s, color 0.2s, border 0.2s, box-shadow 0.2s',
                position: 'relative' as const, // For absolute divider positioning and label overlay
                ...(isSelected && selectedElevationBoxShadow ? { boxShadow: selectedElevationBoxShadow } : {}),
                ...spacingStyle, // Item-gap spacing (dividers handled via CSS pseudo-elements)
                ...borderStyle, // Selected borders
              }}
            >
              {hasIcon && (
                <span 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: iconSizeVar ? `var(${iconSizeVar})` : '16px',
                    height: iconSizeVar ? `var(${iconSizeVar})` : '16px',
                    flexShrink: 0,
                    position: 'relative' as const,
                    zIndex: 1,
                  }}
                >
                  {item.icon}
                </span>
              )}
              {hasLabel && (
                <span style={{
                  fontFamily: `var(${fontFamilyVar})`,
                  fontSize: `var(${fontSizeVar})`,
                  fontWeight: `var(${fontWeightVar})`,
                  letterSpacing: letterSpacingVar ? `var(${letterSpacingVar})` : undefined,
                  lineHeight: `var(${lineHeightVar})`,
                  textDecoration: textDecorationVar ? (readCssVar(textDecorationVar) || 'none') as any : 'none',
                  textTransform: textTransformVar ? (readCssVar(textTransformVar) || 'none') as any : 'none',
                  fontStyle: fontStyleVar ? (readCssVar(fontStyleVar) || 'normal') as any : 'normal',
                  flexGrow: 1, // Fill the button area for full clickability
                  flexShrink: fullWidth ? 1 : 0, // Allow shrinking when fullWidth, prevent when auto-width
                  flexBasis: 0, // Start from 0 and grow to fill space
                  minWidth: 0, // Allow label to shrink below content size if needed
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  alignSelf: 'stretch', // Stretch to fill button height
                  position: 'relative' as const,
                  zIndex: 1,
                  // Ensure label fills entire button area for clickability
                  // When auto-width, button expands to fit content, label fills remaining space
                  width: hasIcon ? undefined : '100%', // If no icon, fill entire button width
                }}>
                  {item.label}
                </span>
              )}
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
    <Suspense fallback={<span />}>
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
        componentNameForCssVars={componentNameForCssVars}
        className={className}
        style={style}
        mantine={mantine}
        material={material}
        carbon={carbon}
      />
    </Suspense>
  )
}
