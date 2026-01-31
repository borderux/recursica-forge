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
  componentNameForCssVars = 'SegmentedControl',
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
  // Get CSS variables - item properties (applied to both regular and selected items)
  const itemBorderRadiusVar = buildComponentCssVarPath('SegmentedControlItem', 'properties', 'item', 'border-radius')
  const selectedElevationVar = buildComponentCssVarPath('SegmentedControlItem', 'properties', 'selected', 'elevation')
  
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
    // Define color-only CSS variables that don't need re-renders (CSS handles them automatically)
    const colorOnlyVars = new Set([
      selectedBgVar, selectedTextVar, textVar, containerBgVar, containerBorderColorVar, 
      selectedBorderColorVar, dividerColorVar
    ].filter(Boolean)) // Filter out undefined vars
    
    const handleCssVarUpdate = (e?: Event) => {
      const detail = (e as CustomEvent)?.detail
      const updatedVars = detail?.cssVars || []
      
      // Check if any non-color vars were updated (these need re-renders)
      const nonColorVarsUpdated = updatedVars.length === 0 || updatedVars.some((v: string) => 
        v === dividerSizeVar || v.includes('divider-size') || 
        v === selectedBorderSizeVar || v === containerBorderSizeVar ||
        v === selectedElevationVar || v === containerElevationVar ||
        v === paddingHorizontalVar || v === heightVar ||
        v === textDecorationVar || v === textTransformVar || v === fontStyleVar
      )
      
      // Only re-render if non-color vars changed
      if (nonColorVarsUpdated) {
        // Use requestAnimationFrame to batch updates and prevent flicker
        requestAnimationFrame(() => {
          forceUpdate(prev => prev + 1)
        })
      }
      // If only color vars changed, skip re-render - CSS will automatically apply the new colors
    }
    
    window.addEventListener('cssVarsUpdated', handleCssVarUpdate)
    window.addEventListener('cssVarsReset', handleCssVarUpdate)
    
    // Only observe for specific CSS variables to prevent unnecessary re-renders
    // Don't trigger re-renders for color-only CSS variable changes - CSS handles those automatically
    const observer = new MutationObserver(() => {
      // Only re-render for non-color vars (border-size, elevation, padding, etc.)
      // Color vars update automatically via CSS, so no re-render needed
      const hasRelevantChange = dividerSizeVar || textDecorationVar || textTransformVar || fontStyleVar || selectedElevationVar || selectedBorderSizeVar || paddingHorizontalVar || heightVar
      if (hasRelevantChange) {
        // Use requestAnimationFrame to batch updates and prevent flicker
        requestAnimationFrame(() => {
          forceUpdate(prev => prev + 1)
        })
      }
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
  }, [dividerSizeVar, dividerColorVar, dividerSizeValue, textDecorationVar, textTransformVar, fontStyleVar, selectedTextVar, selectedElevationVar, selectedBorderSizeVar, paddingHorizontalVar, heightVar, selectedBgVar, containerBgVar, containerBorderColorVar, selectedBorderColorVar, containerBorderSizeVar, containerElevationVar])
  
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
  
  const componentElevation = elevation ?? containerElevationFromVar ?? undefined
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
      // Don't pass fullWidth to Material UI when we want auto width - control it via our styles/CSS instead
      // Only pass fullWidth when we actually want full width
      {...(fullWidth ? { fullWidth: true } : {})}
      className={`recursica-segmented-control material-segmented-control ${fullWidth ? 'recursica-full-width' : 'recursica-auto-width'} ${className || ''}`}
      sx={{
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
        '--segmented-control-selected-elevation': selectedElevationFromVar || 'elevation-0',
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
        '--segmented-control-text-decoration': textDecorationVar ? (readCssVar(textDecorationVar) || 'none') : 'none',
        '--segmented-control-text-transform': textTransformVar ? (readCssVar(textTransformVar) || 'none') : 'none',
        '--segmented-control-font-style': fontStyleVar ? (readCssVar(fontStyleVar) || 'normal') : 'normal',
        // Ensure root element doesn't become block-level when fullWidth is false
        display: isVertical ? (fullWidth ? 'flex' : 'inline-flex') : (fullWidth ? 'flex' : 'inline-flex'),
        width: fullWidth ? '100%' : 'auto',
        paddingTop: containerPaddingVerticalValue ? `var(${containerPaddingVerticalVar})` : undefined,
        paddingBottom: containerPaddingVerticalValue ? `var(${containerPaddingVerticalVar})` : undefined,
        paddingLeft: containerPaddingHorizontalValue ? `var(${containerPaddingHorizontalVar})` : undefined,
        paddingRight: containerPaddingHorizontalValue ? `var(${containerPaddingHorizontalVar})` : undefined,
        ...(elevationBoxShadow ? { boxShadow: elevationBoxShadow } : {}),
        ...material?.sx,
      }}
      style={style}
      {...material}
      {...props}
    >
      {items.map((item, index) => {
        const hasIcon = !!item.icon
        const hasLabel = !!item.label && showLabel
        const shouldShowTooltip = !showLabel && (item.tooltip || (typeof item.label === 'string' ? item.label : undefined))
        
        const isSelected = currentValue === item.value
        
        const toggleButton = (
          <ToggleButton
            key={item.value}
            value={item.value}
            disabled={item.disabled || disabled}
            sx={{
              // Prevent Material UI default transitions that cause white flash
              transition: 'none !important',
              // Ensure background is set immediately, not animated - use both background and backgroundColor
              background: isSelected ? `var(--segmented-control-selected-bg)` : 'transparent',
              backgroundColor: isSelected ? `var(--segmented-control-selected-bg)` : 'transparent',
              // Prevent Material UI from applying default white background
              '&:hover': {
                backgroundColor: isSelected ? `var(--segmented-control-selected-bg)` : 'transparent',
                background: isSelected ? `var(--segmented-control-selected-bg)` : 'transparent',
              },
              '&:focus': {
                backgroundColor: isSelected ? `var(--segmented-control-selected-bg)` : 'transparent',
                background: isSelected ? `var(--segmented-control-selected-bg)` : 'transparent',
              },
              ...(isSelected && selectedElevationBoxShadow ? {
                boxShadow: selectedElevationBoxShadow,
              } : {}),
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
                  marginRight: hasLabel && iconGapVar && iconGapValueForStyles ? `var(${iconGapVar})` : (hasLabel && iconGapVar && !iconGapValueForStyles ? '0px' : undefined),
                }}
              >
                {item.icon}
              </span>
            )}
            {hasLabel && (
              <span style={{
                fontFamily: 'var(--segmented-control-font-family)',
                fontSize: 'var(--segmented-control-font-size)',
                fontWeight: 'var(--segmented-control-font-weight)',
                letterSpacing: 'var(--segmented-control-letter-spacing)',
                lineHeight: 'var(--segmented-control-line-height)',
                textDecoration: 'var(--segmented-control-text-decoration)',
                textTransform: 'var(--segmented-control-text-transform)' as React.CSSProperties['textTransform'],
                fontStyle: 'var(--segmented-control-font-style)',
                flexGrow: 1, // Fill the button area for full clickability
                flexShrink: fullWidth ? 1 : 0, // Allow shrinking when fullWidth, prevent when auto-width
                flexBasis: 0, // Start from 0 and grow to fill space
                minWidth: 0, // Allow label to shrink below content size if needed
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                alignSelf: 'stretch', // Stretch to fill button height
                // Ensure label fills entire button area for clickability
                // When auto-width, button expands to fit content, label fills remaining space
                width: hasIcon ? undefined : '100%', // If no icon, fill entire button width
              }}>
                {item.label}
              </span>
            )}
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
