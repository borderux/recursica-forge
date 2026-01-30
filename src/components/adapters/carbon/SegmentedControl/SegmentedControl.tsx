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
  componentNameForCssVars = 'SegmentedControl',
  className,
  style,
  carbon,
  ...props
}: AdapterSegmentedControlProps) {
  const { mode } = useThemeMode()
  
  // Get CSS variables - container properties (always from SegmentedControl)
  const containerBgVar = buildComponentCssVarPath('SegmentedControl', 'properties', 'container', 'colors', layer, 'background')
  const containerBorderColorVar = buildComponentCssVarPath('SegmentedControl', 'properties', 'container', 'colors', layer, 'border-color')
  const containerBorderSizeVar = buildComponentCssVarPath('SegmentedControl', 'properties', 'container', 'border-size')
  const containerBorderRadiusVar = buildComponentCssVarPath('SegmentedControl', 'properties', 'container', 'border-radius')
  const containerElevationVar = buildComponentCssVarPath('SegmentedControl', 'properties', 'container', 'elevation')
  const containerPaddingHorizontalVar = buildComponentCssVarPath('SegmentedControl', 'properties', 'container', 'padding-horizontal')
  const containerPaddingVerticalVar = buildComponentCssVarPath('SegmentedControl', 'properties', 'container', 'padding-vertical')
  
  // Get CSS variables - padding (applied to all items) - always use SegmentedControlItem for item properties
  const paddingHorizontalVar = buildComponentCssVarPath('SegmentedControlItem', 'properties', 'item', 'padding-horizontal')
  const heightVar = buildComponentCssVarPath('SegmentedControlItem', 'properties', 'item', 'height')
  
  // Get CSS variables - selected properties - always use SegmentedControlItem for item selected properties
  const selectedBgVar = buildComponentCssVarPath('SegmentedControlItem', 'properties', 'selected', 'colors', layer, 'background')
  const selectedBorderColorVar = buildComponentCssVarPath('SegmentedControlItem', 'properties', 'selected', 'colors', layer, 'border-color')
  const selectedBorderSizeVar = buildComponentCssVarPath('SegmentedControlItem', 'properties', 'selected', 'border-size')
  const selectedElevationVar = buildComponentCssVarPath('SegmentedControlItem', 'properties', 'selected', 'elevation')
  
  // Get CSS variables - item properties (applied to both regular and selected items)
  const itemBorderRadiusVar = buildComponentCssVarPath('SegmentedControlItem', 'properties', 'item', 'border-radius')
  
  // Get CSS variables - text colors - use SegmentedControl container for item text color
  const textVar = buildComponentCssVarPath('SegmentedControl', 'properties', 'container', 'colors', layer, 'text-color')
  const selectedTextVar = buildComponentCssVarPath('SegmentedControlItem', 'properties', 'selected', 'colors', layer, 'text-color')
  
  // Get other properties - always use SegmentedControlItem for item properties, SegmentedControl for container properties
  const itemGapVar = getComponentLevelCssVar('SegmentedControl', 'item-gap')
  const iconSizeVar = buildComponentCssVarPath('SegmentedControlItem', 'properties', 'item', 'icon-size')
  const iconGapVar = buildComponentCssVarPath('SegmentedControlItem', 'properties', 'item', 'icon-text-gap')
  
  const paddingHorizontalValue = readCssVar(paddingHorizontalVar)
  const heightValue = readCssVar(heightVar)
  const containerPaddingHorizontalValue = readCssVar(containerPaddingHorizontalVar)
  const containerPaddingVerticalValue = readCssVar(containerPaddingVerticalVar)
  const iconGapValueForStyles = iconGapVar ? readCssVar(iconGapVar) : null
  
  // Get divider properties
  const dividerColorVar = buildComponentCssVarPath('SegmentedControl', 'properties', 'colors', layer, 'divider-color')
  const dividerSizeVar = getComponentLevelCssVar('SegmentedControl', 'divider-size')
  
  // Get text properties - always use SegmentedControlItem for item text properties
  const fontFamilyVar = getComponentTextCssVar('SegmentedControlItem', 'text', 'font-family')
  const fontSizeVar = getComponentTextCssVar('SegmentedControlItem', 'text', 'font-size')
  const fontWeightVar = getComponentTextCssVar('SegmentedControlItem', 'text', 'font-weight')
  const letterSpacingVar = getComponentTextCssVar('SegmentedControlItem', 'text', 'letter-spacing')
  const lineHeightVar = getComponentTextCssVar('SegmentedControlItem', 'text', 'line-height')
  const textDecorationVar = getComponentTextCssVar('SegmentedControlItem', 'text', 'text-decoration')
  const textTransformVar = getComponentTextCssVar('SegmentedControlItem', 'text', 'text-transform')
  const fontStyleVar = getComponentTextCssVar('SegmentedControlItem', 'text', 'font-style')
  
  // Reactively read border-size and divider-size
  const borderSizeValue = useCssVar(containerBorderSizeVar, '1px')
  const selectedBorderSizeValue = useCssVar(selectedBorderSizeVar, '1px')
  const dividerSizeValue = useCssVar(dividerSizeVar, '1px')
  
  // Force re-render when divider CSS variables change
  const [, forceUpdate] = useState(0)
  
  useEffect(() => {
    const handleCssVarUpdate = (e?: Event) => {
      const detail = (e as CustomEvent)?.detail
      const updatedVars = detail?.cssVars || []
      const dividerVarUpdated = updatedVars.length === 0 || updatedVars.some((v: string) => 
        v === dividerSizeVar || v === dividerColorVar || v.includes('divider')
      )
      if (dividerVarUpdated) {
        forceUpdate(prev => prev + 1)
      }
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
  
  // Get elevation from CSS vars if not provided as props
  const [containerElevationFromVar, setContainerElevationFromVar] = useState<string | undefined>(() => {
    if (!containerElevationVar) return undefined
    const value = readCssVar(containerElevationVar)
    return value ? parseElevationValue(value) : undefined
  })
  
  useEffect(() => {
    if (!containerElevationVar) return
    
    const handleCssVarUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (!detail?.cssVars || detail.cssVars.includes(containerElevationVar)) {
        const value = readCssVar(containerElevationVar)
        setContainerElevationFromVar(value ? parseElevationValue(value) : undefined)
      }
    }
    
    window.addEventListener('cssVarsUpdated', handleCssVarUpdate)
    window.addEventListener('cssVarsReset', handleCssVarUpdate)
    
    const observer = new MutationObserver(() => {
      const value = readCssVar(containerElevationVar)
      setContainerElevationFromVar(value ? parseElevationValue(value) : undefined)
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
  }, [containerElevationVar])
  
  const componentElevation = elevation ?? containerElevationFromVar ?? undefined
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
  
  // Force re-render when CSS variables change
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
  }, [])
  
  return (
    <div
      className={`recursica-segmented-control carbon-segmented-control ${className || ''}`}
      style={{
        '--segmented-control-bg': `var(${containerBgVar})`,
        '--segmented-control-text': `var(${textVar})`,
        '--segmented-control-selected-bg': `var(${selectedBgVar})`,
        '--segmented-control-selected-text': `var(${selectedTextVar})`,
        '--segmented-control-border-color': `var(${containerBorderColorVar || textVar})`,
        '--segmented-control-selected-border-color': `var(${selectedBorderColorVar || selectedBgVar})`,
        '--segmented-control-border-radius': `var(${containerBorderRadiusVar})`,
        '--segmented-control-border-size': borderSizeValue,
        '--segmented-control-selected-border-size': selectedBorderSizeValue,
        '--segmented-control-item-border-radius': `var(${itemBorderRadiusVar})`,
        '--segmented-control-padding-horizontal': paddingHorizontalValue ? `var(${paddingHorizontalVar})` : '0px',
        '--segmented-control-height': heightValue ? `var(${heightVar})` : 'auto',
        '--segmented-control-container-padding-horizontal': containerPaddingHorizontalValue ? `var(${containerPaddingHorizontalVar})` : '0px',
        '--segmented-control-container-padding-vertical': containerPaddingVerticalValue ? `var(${containerPaddingVerticalVar})` : '0px',
        '--segmented-control-item-gap': `var(${itemGapVar})`,
        '--segmented-control-icon-text-gap': iconGapVar && iconGapValueForStyles ? `var(${iconGapVar})` : '0px',
        '--segmented-control-divider-color': `var(${dividerColorVar || containerBorderColorVar || textVar})`,
        '--segmented-control-divider-size': dividerSizeValue,
        '--segmented-control-font-family': `var(${fontFamilyVar})`,
        '--segmented-control-font-size': `var(${fontSizeVar})`,
        '--segmented-control-font-weight': `var(${fontWeightVar})`,
        '--segmented-control-letter-spacing': letterSpacingVar ? `var(${letterSpacingVar})` : 'normal',
        '--segmented-control-line-height': `var(${lineHeightVar})`,
        display: isVertical ? 'flex' : 'inline-flex',
        flexDirection: isVertical ? 'column' : 'row',
        borderRadius: `var(${containerBorderRadiusVar})`,
        border: `${borderSizeValue} solid var(${containerBorderColorVar || textVar})`,
        background: `var(${containerBgVar})`,
        paddingTop: containerPaddingVerticalValue ? `var(${containerPaddingVerticalVar})` : undefined,
        paddingBottom: containerPaddingVerticalValue ? `var(${containerPaddingVerticalVar})` : undefined,
        paddingLeft: containerPaddingHorizontalValue ? `var(${containerPaddingHorizontalVar})` : undefined,
        paddingRight: containerPaddingHorizontalValue ? `var(${containerPaddingHorizontalVar})` : undefined,
        width: fullWidth ? '100%' : 'auto',
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
        const hasLabel = !!item.label && showLabel
        const shouldShowTooltip = !showLabel && (item.tooltip || (typeof item.label === 'string' ? item.label : undefined))
        
        // Don't add divider if this item is selected or the next item is selected
        const isLastItem = index === items.length - 1
        const nextItem = items[index + 1]
        const isNextItemSelected = nextItem && currentValue === nextItem.value
        const shouldAddDivider = !isLastItem && !isSelected && !isNextItemSelected
        
        // Build border styles - use individual properties to avoid overriding divider borders
        const borderStyle: React.CSSProperties = {}
        if (isSelected) {
          // For selected items, set border on all sides
          const selectedBorder = `${selectedBorderSizeValue} solid var(${selectedBorderColorVar || selectedBgVar})`
          borderStyle.borderTop = selectedBorder
          borderStyle.borderLeft = selectedBorder
          borderStyle.borderRight = selectedBorder
          borderStyle.borderBottom = selectedBorder
        }
        
        const button = (
          <button
            key={item.value}
            type="button"
            disabled={disabled || item.disabled}
            onClick={() => !disabled && !item.disabled && onChange?.(item.value)}
            className={`carbon-segmented-control-button ${isSelected ? 'selected' : ''}`}
            style={{
              // Base padding - will be overridden below if item-gap applies
              height: heightValue ? `var(${heightVar})` : 'auto',
              paddingLeft: paddingHorizontalValue ? `var(${paddingHorizontalVar})` : '0px',
              paddingRight: paddingHorizontalValue ? `var(${paddingHorizontalVar})` : '0px',
              background: isSelected ? `var(${selectedBgVar})` : 'transparent',
              color: isSelected ? `var(${selectedTextVar})` : `var(${textVar})`,
              borderRadius: `var(${itemBorderRadiusVar})`,
              cursor: disabled || item.disabled ? 'not-allowed' : 'pointer',
              flex: fullWidth && !isVertical ? 1 : 'none',
              width: fullWidth && isVertical ? '100%' : 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: hasIcon && hasLabel ? (iconGapVar && iconGapValueForStyles ? `var(${iconGapVar})` : (iconGapVar && !iconGapValueForStyles ? '0px' : '8px')) : undefined,
              transition: 'background-color 0.2s, color 0.2s, border 0.2s, box-shadow 0.2s',
              // Always add margin for item-gap between items - divider has full gap on both sides
              // Item-gap only affects margin, not padding - padding remains uniform for all items
              // Explicitly ensure first item has no left/top margin and last item has no right/bottom margin
              marginLeft: index > 0 && !isVertical ? `var(${itemGapVar})` : (index === 0 && !isVertical ? '0' : undefined),
              marginRight: !isLastItem && !isVertical ? `var(${itemGapVar})` : (isLastItem && !isVertical ? '0' : undefined),
              marginTop: index > 0 && isVertical ? `var(${itemGapVar})` : (index === 0 && isVertical ? '0' : undefined),
              marginBottom: !isLastItem && isVertical ? `var(${itemGapVar})` : (isLastItem && isVertical ? '0' : undefined),
              ...(isSelected && selectedElevationBoxShadow ? { boxShadow: selectedElevationBoxShadow } : {}),
              position: 'relative' as const, // For absolute divider positioning
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
