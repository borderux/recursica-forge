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
    const containerElevationVar = buildComponentCssVarPath('SegmentedControl', 'properties', 'container', 'elevation')
    
    // Get CSS variables - padding (applied to all items)
    const paddingHorizontalVar = buildComponentCssVarPath('SegmentedControl', 'properties', 'item', 'padding-horizontal')
    const paddingVerticalVar = buildComponentCssVarPath('SegmentedControl', 'properties', 'item', 'padding-vertical')
    
    // Get CSS variables - selected properties
    const selectedBgVar = buildComponentCssVarPath('SegmentedControl', 'properties', 'selected', 'colors', layer, 'background')
    const selectedBorderColorVar = buildComponentCssVarPath('SegmentedControl', 'properties', 'selected', 'colors', layer, 'border-color')
    const selectedBorderSizeVar = buildComponentCssVarPath('SegmentedControl', 'properties', 'selected', 'border-size')
    const selectedBorderRadiusVar = buildComponentCssVarPath('SegmentedControl', 'properties', 'selected', 'border-radius')
    const selectedElevationVar = buildComponentCssVarPath('SegmentedControl', 'properties', 'selected', 'elevation')
    
    // Get CSS variables - text colors
    const textVar = getComponentCssVar('SegmentedControl', 'colors', 'text', layer)
    const selectedTextVar = buildComponentCssVarPath('SegmentedControl', 'properties', 'selected', 'colors', layer, 'text-color')
    
    // Get text style properties
    const fontFamilyVar = getComponentTextCssVar('SegmentedControl', 'text', 'font-family')
    const fontSizeVar = getComponentTextCssVar('SegmentedControl', 'text', 'font-size')
    const fontWeightVar = getComponentTextCssVar('SegmentedControl', 'text', 'font-weight')
    const letterSpacingVar = getComponentTextCssVar('SegmentedControl', 'text', 'letter-spacing')
    const lineHeightVar = getComponentTextCssVar('SegmentedControl', 'text', 'line-height')
    const textDecorationVar = getComponentTextCssVar('SegmentedControl', 'text', 'text-decoration')
    const textTransformVar = getComponentTextCssVar('SegmentedControl', 'text', 'text-transform')
    const fontStyleVar = getComponentTextCssVar('SegmentedControl', 'text', 'font-style')
    
    // Get other properties
    const itemGapVar = getComponentLevelCssVar('SegmentedControl', 'item-gap')
    const iconSizeVar = buildComponentCssVarPath('SegmentedControl', 'properties', 'item', 'icon-size')
    const iconGapVar = buildComponentCssVarPath('SegmentedControl', 'properties', 'item', 'icon-text-gap')
    
    // #region agent log
    const paddingHorizontalValue = readCssVar(paddingHorizontalVar)
    const paddingVerticalValue = readCssVar(paddingVerticalVar)
    const iconGapValue = iconGapVar ? readCssVar(iconGapVar) : null
    const iconSizeValue = readCssVar(iconSizeVar)
    fetch('http://127.0.0.1:7242/ingest/d16cd3f3-655c-4e29-8162-ad6e504c679e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SegmentedControl.tsx:css-var-reads',message:'CSS variable values',data:{paddingHorizontalVar,paddingHorizontalValue,paddingVerticalVar,paddingVerticalValue,iconGapVar,iconGapValue,iconSizeVar,iconSizeValue,paddingHorizontalVarPath:paddingHorizontalVar,paddingVerticalVarPath:paddingVerticalVar,iconGapVarPath:iconGapVar,iconSizeVarPath:iconSizeVar},timestamp:Date.now(),sessionId:'debug-session',runId:'padding-gap-debug',hypothesisId:'A'})}).catch(()=>{});
    // #endregion agent log
    
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
    }, [dividerSizeVar, dividerColorVar, dividerSizeValue, textDecorationVar, textTransformVar, fontStyleVar, selectedTextVar, selectedElevationVar, selectedBorderSizeVar, paddingHorizontalVar, paddingVerticalVar])
    
    return (
      <div
        className={className}
        style={{
          display: isVertical ? 'flex' : 'inline-flex',
          flexDirection: isVertical ? 'column' : 'row',
          borderRadius: `var(${containerBorderRadiusVar})`,
          border: `${borderSizeValue} solid var(${containerBorderColorVar || textVar})`,
          background: `var(${containerBgVar})`,
          padding: `var(${paddingVerticalVar}) var(${paddingHorizontalVar})`,
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
          // Item-gap only affects margin, not padding - padding remains uniform for all items
          if (!isLastItem) {
            if (isVertical) {
              // Horizontal divider for vertical orientation
              // margin-bottom creates space after the item (before the divider)
              spacingStyle.marginBottom = `var(${itemGapVar})`
            } else {
              // Vertical divider for horizontal orientation
              // margin-right creates space after the item (before the divider)
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
            // For selected items, set border on all sides
            const selectedBorder = `${selectedBorderSizeValue} solid var(${selectedBorderColorVar || selectedBgVar})`
            // Always set all borders first
            borderStyle.borderTop = selectedBorder
            borderStyle.borderLeft = selectedBorder
            borderStyle.borderRight = selectedBorder
            borderStyle.borderBottom = selectedBorder
            // Then spacingStyle will override the divider side if needed
          }
          
          // #region agent log
          const paddingHorizontalValue = readCssVar(paddingHorizontalVar)
          const paddingVerticalValue = readCssVar(paddingVerticalVar)
          const iconGapValue = iconGapVar ? readCssVar(iconGapVar) : null
          const itemGapValue = readCssVar(itemGapVar)
          const computedPaddingRight = !isLastItem && !isSelected && !isVertical ? `calc(${paddingHorizontalValue || '0px'} + ${itemGapValue || '0px'})` : paddingHorizontalValue
          const computedPaddingBottom = !isLastItem && !isSelected && isVertical ? `calc(${paddingVerticalValue || '0px'} + ${itemGapValue || '0px'})` : paddingVerticalValue
          if (index === 0) {
            fetch('http://127.0.0.1:7242/ingest/d16cd3f3-655c-4e29-8162-ad6e504c679e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SegmentedControl.tsx:233',message:'Padding values check',data:{paddingHorizontalVar,paddingHorizontalValue,paddingVerticalVar,paddingVerticalValue,itemGapVar,itemGapValue,iconGapVar,iconGapValue,hasIcon,hasLabel,isLastItem,isSelected,isVertical,computedPaddingRight,computedPaddingBottom},timestamp:Date.now(),sessionId:'debug-session',runId:'padding-debug',hypothesisId:'A'})}).catch(()=>{});
          }
          // #endregion agent log
          
          const button = (
            <button
              key={item.value}
              type="button"
              disabled={disabled || item.disabled}
              onClick={() => !disabled && !item.disabled && onChange?.(item.value)}
              style={{
                // Base padding - will be overridden by spacingStyle if item-gap applies
                paddingTop: paddingVerticalValue ? `var(${paddingVerticalVar})` : '0px',
                paddingBottom: paddingVerticalValue ? `var(${paddingVerticalVar})` : '0px',
                paddingLeft: paddingHorizontalValue ? `var(${paddingHorizontalVar})` : '0px',
                paddingRight: paddingHorizontalValue ? `var(${paddingHorizontalVar})` : '0px',
                background: isSelected ? `var(${selectedBgVar})` : 'transparent',
                color: isSelected ? `var(${selectedTextVar})` : `var(${textVar})`,
                borderRadius: isSelected ? `var(${selectedBorderRadiusVar})` : `var(${containerBorderRadiusVar})`,
                cursor: disabled || item.disabled ? 'not-allowed' : 'pointer',
                flex: fullWidth && !isVertical ? 1 : 'none',
                width: fullWidth && isVertical ? '100%' : 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: hasIcon && hasLabel ? (iconGapVar && iconGapValue ? `var(${iconGapVar})` : (iconGapVar && !iconGapValue ? '0px' : undefined)) : undefined,
                transition: 'background-color 0.2s, color 0.2s, border 0.2s, box-shadow 0.2s',
                // #region agent log
                ...(hasIcon && !hasLabel && index === 0 ? {
                  '--debug-icon-only': 'true',
                  '--debug-has-icon': String(hasIcon),
                  '--debug-has-label': String(hasLabel),
                  '--debug-gap-value': hasIcon && hasLabel ? `var(${iconGapVar})` : 'undefined',
                } : {}),
                // #endregion agent log
                ...(isSelected && selectedElevationBoxShadow ? { boxShadow: selectedElevationBoxShadow } : {}),
                ...spacingStyle, // Divider borders and spacing (applied after base padding to add item-gap)
                ...borderStyle, // Selected borders (applied last to ensure they override divider borders)
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
                  // #region agent log
                  ref={(el) => {
                    if (el && index === 0) {
                      setTimeout(() => {
                        const computedStyle = window.getComputedStyle(el)
                        const buttonEl = el.parentElement as HTMLElement
                        const buttonStyle = window.getComputedStyle(buttonEl)
                        const textEl = hasLabel ? buttonEl.querySelector('span:last-child') as HTMLElement : null
                        const textStyle = textEl ? window.getComputedStyle(textEl) : null
                        fetch('http://127.0.0.1:7242/ingest/d16cd3f3-655c-4e29-8162-ad6e504c679e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SegmentedControl.tsx:icon-span-ref',message:'Computed styles for icon and button',data:{iconMarginLeft:computedStyle.marginLeft,iconMarginRight:computedStyle.marginRight,iconPaddingLeft:computedStyle.paddingLeft,iconPaddingRight:computedStyle.paddingRight,iconWidth:computedStyle.width,iconHeight:computedStyle.height,buttonPaddingLeft:buttonStyle.paddingLeft,buttonPaddingRight:buttonStyle.paddingRight,buttonPaddingTop:buttonStyle.paddingTop,buttonPaddingBottom:buttonStyle.paddingBottom,buttonGap:buttonStyle.gap,buttonJustifyContent:buttonStyle.justifyContent,buttonDisplay:buttonStyle.display,buttonWidth:buttonStyle.width,textMarginLeft:textStyle?.marginLeft,textMarginRight:textStyle?.marginRight,hasIcon,hasLabel,iconGapVar,iconGapValue:readCssVar(iconGapVar),paddingHorizontalValue,paddingVerticalValue},timestamp:Date.now(),sessionId:'debug-session',runId:'padding-gap-debug',hypothesisId:'B'})}).catch(()=>{});
                      }, 100)
                    }
                  }}
                  // #endregion agent log
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
