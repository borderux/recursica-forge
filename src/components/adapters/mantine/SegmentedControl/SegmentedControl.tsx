/**
 * Mantine SegmentedControl Implementation
 * 
 * Mantine-specific SegmentedControl component that uses CSS variables for theming.
 */

import { SegmentedControl as MantineSegmentedControl, Tooltip as MantineTooltip } from '@mantine/core'
import type { SegmentedControlProps as AdapterSegmentedControlProps } from '../../SegmentedControl'
import { getComponentCssVar, getComponentLevelCssVar, getComponentTextCssVar, buildComponentCssVarPath } from '../../../utils/cssVarNames'
import { useState, useEffect, useRef } from 'react'
import { getElevationBoxShadow, parseElevationValue } from '../../../utils/brandCssVars'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { readCssVar, readCssVarResolved } from '../../../../core/css/readCssVar'
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
  showLabel = true,
  componentNameForCssVars = 'SegmentedControl',
  className,
  style,
  mantine,
  ...props
}: AdapterSegmentedControlProps) {
  const { mode } = useThemeMode()
  
  // Map unified orientation to Mantine orientation
  const mantineOrientation = orientation === 'vertical' ? 'vertical' : 'horizontal'
  const mantineSize = 'md' // Default size
  const isVertical = orientation === 'vertical'
  
  // Get CSS variables - container properties (always from SegmentedControl)
  const containerBgVar = buildComponentCssVarPath('SegmentedControl', 'properties', 'container', 'colors', layer, 'background')
  const containerBorderColorVar = buildComponentCssVarPath('SegmentedControl', 'properties', 'container', 'colors', layer, 'border-color')
  const containerBorderSizeVar = buildComponentCssVarPath('SegmentedControl', 'properties', 'container', 'border-size')
  const containerBorderRadiusVar = buildComponentCssVarPath('SegmentedControl', 'properties', 'container', 'border-radius')
  const containerElevationVar = buildComponentCssVarPath('SegmentedControl', 'properties', 'container', 'elevation')
  
  // Get CSS variables - padding (applied to all items) - use componentNameForCssVars
  const paddingHorizontalVar = buildComponentCssVarPath(componentNameForCssVars, 'properties', 'item', 'padding-horizontal')
  const paddingVerticalVar = buildComponentCssVarPath(componentNameForCssVars, 'properties', 'item', 'padding-vertical')
  
  // Get CSS variables - selected properties - use componentNameForCssVars
  const selectedBgVar = buildComponentCssVarPath(componentNameForCssVars, 'properties', 'selected', 'colors', layer, 'background')
  const selectedBorderColorVar = buildComponentCssVarPath(componentNameForCssVars, 'properties', 'selected', 'colors', layer, 'border-color')
  const selectedBorderSizeVar = buildComponentCssVarPath(componentNameForCssVars, 'properties', 'selected', 'border-size')
  const selectedBorderRadiusVar = buildComponentCssVarPath(componentNameForCssVars, 'properties', 'selected', 'border-radius')
  const selectedElevationVar = buildComponentCssVarPath(componentNameForCssVars, 'properties', 'selected', 'elevation')
  
  // Get CSS variables - text colors - use componentNameForCssVars
  // For SegmentedControlItem, text color is under properties.item.colors.layer-X.text-color
  // For SegmentedControl, colors are directly under colors.layer-X.text (legacy)
  // Selected text color is always under properties.selected.colors.layer-X.text-color
  const textVar = componentNameForCssVars === 'SegmentedControlItem'
    ? buildComponentCssVarPath(componentNameForCssVars, 'properties', 'item', 'colors', layer, 'text-color')
    : getComponentCssVar(componentNameForCssVars, 'colors', 'text', layer)
  const selectedTextVar = buildComponentCssVarPath(componentNameForCssVars, 'properties', 'selected', 'colors', layer, 'text-color')
  
  // Get other properties - use componentNameForCssVars for item properties, SegmentedControl for container properties
  const itemGapVar = getComponentLevelCssVar('SegmentedControl', 'item-gap')
  const iconSizeVar = buildComponentCssVarPath(componentNameForCssVars, 'properties', 'item', 'icon-size')
  const iconGapVar = buildComponentCssVarPath(componentNameForCssVars, 'properties', 'item', 'icon-text-gap')
  
  // Read padding and icon gap values
  const paddingHorizontalValue = readCssVar(paddingHorizontalVar)
  const paddingVerticalValue = readCssVar(paddingVerticalVar)
  const iconGapValueForStyles = iconGapVar ? readCssVar(iconGapVar) : null
  
  // Get divider properties
  const dividerColorVar = buildComponentCssVarPath('SegmentedControl', 'properties', 'colors', layer, 'divider-color')
  const dividerSizeVar = getComponentLevelCssVar('SegmentedControl', 'divider-size')
  
  // Get orientation-specific max-width/max-height
  const maxWidthVar = buildComponentCssVarPath('SegmentedControl', 'variants', 'orientation', 'horizontal', 'properties', 'max-width')
  const maxHeightVar = buildComponentCssVarPath('SegmentedControl', 'variants', 'orientation', 'vertical', 'properties', 'max-height')
  
  // Get text properties - use componentNameForCssVars
  const fontFamilyVar = getComponentTextCssVar(componentNameForCssVars, 'text', 'font-family')
  const fontSizeVar = getComponentTextCssVar(componentNameForCssVars, 'text', 'font-size')
  const fontWeightVar = getComponentTextCssVar(componentNameForCssVars, 'text', 'font-weight')
  const letterSpacingVar = getComponentTextCssVar(componentNameForCssVars, 'text', 'letter-spacing')
  const lineHeightVar = getComponentTextCssVar(componentNameForCssVars, 'text', 'line-height')
  const textDecorationVar = getComponentTextCssVar(componentNameForCssVars, 'text', 'text-decoration')
  const textTransformVar = getComponentTextCssVar(componentNameForCssVars, 'text', 'text-transform')
  const fontStyleVar = getComponentTextCssVar(componentNameForCssVars, 'text', 'font-style')
  
  // Reactively read border-size and divider-size
  const borderSizeValue = useCssVar(containerBorderSizeVar, '1px')
  const selectedBorderSizeValue = useCssVar(selectedBorderSizeVar, '1px')
  const dividerSizeValue = useCssVar(dividerSizeVar, '1px')
  
  // Convert items to Mantine format with icons and labels
  const mantineData = items.map(item => {
    const hasIcon = !!item.icon
    const hasLabel = !!item.label && showLabel
    let label: React.ReactNode = null
    
    // If item has both icon and label, combine them
    if (hasIcon && hasLabel) {
      label = (
        <span style={{ display: 'flex', alignItems: 'center', gap: iconGapVar && iconGapValueForStyles ? `var(${iconGapVar})` : (iconGapVar && !iconGapValueForStyles ? '0px' : '8px') }}>
          <span style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: iconSizeVar ? `var(${iconSizeVar})` : '16px',
            height: iconSizeVar ? `var(${iconSizeVar})` : '16px',
            flexShrink: 0,
          }}>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
            }}>
              {item.icon}
            </span>
          </span>
          <span style={{
            textDecoration: 'var(--segmented-control-text-decoration)',
            textTransform: 'var(--segmented-control-text-transform)',
            fontStyle: 'var(--segmented-control-font-style)',
          }}>
            {item.label}
          </span>
        </span>
      )
    } else if (hasIcon && !hasLabel) {
      // Icon only
      label = (
        <span 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: iconSizeVar ? `var(${iconSizeVar})` : '16px',
            height: iconSizeVar ? `var(${iconSizeVar})` : '16px',
          }}
        >
          <span style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
          }}>
            {item.icon}
          </span>
        </span>
      )
    } else if (hasLabel && !hasIcon) {
      // Label only
      label = item.label
    }
    
    return {
      value: item.value,
      label,
      disabled: item.disabled || disabled,
    }
  })
  
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
  
  const wrapperRef = useRef<HTMLDivElement>(null)
  
  // Add tooltips to segments when labels are hidden using Mantine Tooltip
  useEffect(() => {
    if (showLabel || !wrapperRef.current) return
    
    const controls = wrapperRef.current.querySelectorAll('.mantine-SegmentedControl-control')
    const tooltipInstances: Array<{ control: Element; tooltip: HTMLElement; cleanup: () => void }> = []
    
    controls.forEach((control, index) => {
      const item = items[index]
      if (!item) return
      
      const tooltipText = item.tooltip || (typeof item.label === 'string' ? item.label : '')
      if (!tooltipText) return
      
      // Create tooltip element with proper CSS variables
      const tooltipLayer = 'layer-1' // Use layer-1 for tooltips (consistent with Tooltip component)
      const layerBase = `--recursica-brand-themes-${mode}-layer-${tooltipLayer}-property`
      const bgVar = `${layerBase}-surface`
      const textVar = `${layerBase}-element-text-color`
      const borderColorVar = `${layerBase}-border-color`
      const borderRadiusVar = `${layerBase}-border-radius`
      const paddingVar = `${layerBase}-padding`
      
      const tooltipEl = document.createElement('div')
      tooltipEl.className = 'mantine-segmented-control-tooltip'
      tooltipEl.textContent = tooltipText
      tooltipEl.style.cssText = `
        position: fixed;
        background: var(${bgVar});
        color: var(${textVar});
        border: 1px solid var(${borderColorVar});
        border-radius: var(${borderRadiusVar}, 6px);
        padding: var(${paddingVar}, 6px 10px);
        font-size: 12px;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s;
        z-index: 9999;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      `
      document.body.appendChild(tooltipEl)
      
      let timeoutId: NodeJS.Timeout | null = null
      
      const showTooltip = (e: MouseEvent) => {
        if (timeoutId) clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          const rect = control.getBoundingClientRect()
          tooltipEl.style.left = `${rect.left + rect.width / 2}px`
          tooltipEl.style.top = `${rect.top - 8}px`
          tooltipEl.style.transform = 'translate(-50%, -100%)'
          tooltipEl.style.opacity = '1'
        }, 300)
      }
      
      const hideTooltip = () => {
        if (timeoutId) clearTimeout(timeoutId)
        tooltipEl.style.opacity = '0'
      }
      
      control.addEventListener('mouseenter', showTooltip)
      control.addEventListener('mouseleave', hideTooltip)
      
      tooltipInstances.push({
        control,
        tooltip: tooltipEl,
        cleanup: () => {
          control.removeEventListener('mouseenter', showTooltip)
          control.removeEventListener('mouseleave', hideTooltip)
          if (timeoutId) clearTimeout(timeoutId)
          document.body.removeChild(tooltipEl)
        }
      })
    })
    
    return () => {
      tooltipInstances.forEach(({ cleanup }) => cleanup())
    }
  }, [items, showLabel, value, defaultValue, mode])
  
  // Force re-render when CSS variables change (including divider vars)
  const [, forceUpdate] = useState(0)
  
  // Track CSS vars updated via events to prevent MutationObserver from double-handling
  const eventUpdatedVars = useRef<Set<string>>(new Set())
  const eventUpdateTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  useEffect(() => {
    // Build list of CSS variables this component cares about
    const relevantCssVars = new Set([
      dividerSizeVar,
      dividerColorVar,
      textDecorationVar,
      textTransformVar,
      fontStyleVar,
      selectedTextVar,
      selectedElevationVar,
      selectedBorderSizeVar,
      paddingHorizontalVar,
      paddingVerticalVar,
      textVar,
      selectedBgVar,
      selectedBorderColorVar,
      selectedBorderRadiusVar,
      iconGapVar,
      iconSizeVar,
    ].filter(Boolean))
    
    // CSS vars that are pure colors/text - these resolve automatically via CSS, no re-render needed
    const colorOnlyVars = new Set([
      selectedBgVar,
      selectedTextVar,
      selectedBorderColorVar,
      textVar,
      dividerColorVar,
    ].filter(Boolean))
    
    const handleCssVarUpdate = (e?: Event) => {
      const detail = (e as CustomEvent)?.detail
      const updatedVars = detail?.cssVars || []
      
      // CRITICAL: Filter out UIKit CSS variables - they're silent and don't need re-renders
      const nonUIKitVars = updatedVars.filter(v => 
        !v.startsWith('--recursica-ui-kit-components-') && 
        !v.startsWith('--recursica-ui-kit-globals-')
      )
      
      // Only update if a relevant CSS variable was updated (excluding UIKit vars)
      // If no specific vars listed (cssVarsReset case), check if there are any non-UIKit vars
      // If all vars are UIKit vars (nonUIKitVars.length === 0), don't update
      const shouldUpdate = updatedVars.length === 0 
        ? false // cssVarsReset with no vars - don't update
        : nonUIKitVars.length > 0 && nonUIKitVars.some(v => relevantCssVars.has(v))
      
      // Mark relevant vars as updated via event (excluding UIKit vars)
      if (shouldUpdate) {
        nonUIKitVars.forEach(v => {
          if (relevantCssVars.has(v)) {
            eventUpdatedVars.current.add(v)
          }
        })
        // Clear the set after a delay (longer than MutationObserver debounce)
        if (eventUpdateTimeout.current) {
          clearTimeout(eventUpdateTimeout.current)
        }
        eventUpdateTimeout.current = setTimeout(() => {
          eventUpdatedVars.current.clear()
        }, 100) // Clear after 100ms (longer than MutationObserver debounce of 16ms)
      }
      
      // CRITICAL: Don't force re-render for pure color CSS var changes - CSS variables resolve automatically
      // The inline styles use var() references which automatically pick up changes from document.documentElement
      // Only re-render if non-color vars changed (like border-size, elevation, padding which are read in JS)
      if (shouldUpdate) {
        const relevantUpdatedVars = nonUIKitVars.filter(v => relevantCssVars.has(v))
        const onlyColorVarsChanged = relevantUpdatedVars.length > 0 && relevantUpdatedVars.every(v => colorOnlyVars.has(v))
        if (!onlyColorVarsChanged) {
          // Non-color vars changed (border-size, elevation, padding, etc.) - need re-render to read new values
          forceUpdate(prev => prev + 1)
        }
        // If only color vars changed, skip re-render - CSS will automatically apply the new colors
      }
    }
    
    window.addEventListener('cssVarsUpdated', handleCssVarUpdate)
    window.addEventListener('cssVarsReset', handleCssVarUpdate)
    
    let lastMutationTime = 0
    const mutationDebounceMs = 16 // ~1 frame at 60fps
    let lastValues = new Map<string, string>()
    
    // Initialize last values
    for (const cssVar of relevantCssVars) {
      const value = readCssVar(cssVar)
      if (value !== undefined && value !== null) {
        lastValues.set(cssVar, value)
      }
    }
    
    const observer = new MutationObserver(() => {
      const now = Date.now()
      // Debounce mutations to avoid excessive updates
      if (now - lastMutationTime < mutationDebounceMs) {
        return
      }
      lastMutationTime = now
      
      // Check if any relevant CSS variables actually changed
      let hasRelevantChange = false
      const changedVars: string[] = []
      for (const cssVar of relevantCssVars) {
        // CRITICAL: Skip UIKit CSS variables entirely - they're managed via toolbar
        // and don't need component re-renders (CSS var() references resolve automatically)
        const isUIKitVar = cssVar.startsWith('--recursica-ui-kit-components-') || cssVar.startsWith('--recursica-ui-kit-globals-')
        if (isUIKitVar) {
          continue // Skip UIKit vars - they don't need re-renders
        }
        
        // Skip if this var was already updated via cssVarsUpdated event
        if (eventUpdatedVars.current.has(cssVar)) {
          continue
        }
        const currentValue = readCssVar(cssVar)
        const lastValue = lastValues.get(cssVar)
        if (currentValue !== undefined && currentValue !== null && currentValue !== lastValue) {
          hasRelevantChange = true
          changedVars.push(cssVar)
          lastValues.set(cssVar, currentValue)
        }
      }
      
      // CRITICAL: Don't force re-render for pure color CSS var changes - CSS variables resolve automatically
      // The inline styles use var() references which automatically pick up changes from document.documentElement
      // Only re-render if non-color vars changed (like border-size, elevation, padding which are read in JS)
      if (hasRelevantChange) {
        const changedColorVars = changedVars.filter(v => colorOnlyVars.has(v))
        const onlyColorVarsChanged = changedVars.length > 0 && changedVars.every(v => colorOnlyVars.has(v))
        if (!onlyColorVarsChanged) {
          // Non-color vars changed (border-size, elevation, padding, etc.) - need re-render to read new values
          forceUpdate(prev => prev + 1)
        }
        // If only color vars changed, skip re-render - CSS will automatically apply the new colors
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
      if (eventUpdateTimeout.current) {
        clearTimeout(eventUpdateTimeout.current)
      }
    }
  }, [dividerSizeVar, dividerColorVar, dividerSizeValue, textDecorationVar, textTransformVar, fontStyleVar, selectedTextVar, selectedElevationVar, selectedBorderSizeVar, paddingHorizontalVar, paddingVerticalVar, textVar, selectedBgVar, selectedBorderColorVar, selectedBorderRadiusVar, iconGapVar, iconSizeVar, componentNameForCssVars, layer])
  
  const mantineProps = {
    data: mantineData,
    value: value ?? defaultValue,
    onChange: onChange ? (val: string) => onChange(val) : undefined,
    size: mantineSize,
    orientation: mantineOrientation as 'horizontal' | 'vertical',
    disabled,
    // Don't pass fullWidth to Mantine - we control it entirely via our CSS and inline styles
    // Mantine's fullWidth prop might conflict with our custom flex behavior
    className: `${className || ''} ${fullWidth ? 'recursica-full-width' : 'recursica-auto-width'}`.trim(),
    styles: {
      root: {
        '--segmented-control-bg': `var(${containerBgVar})`,
        '--segmented-control-text': `var(${textVar})`,
        '--segmented-control-selected-bg': `var(${selectedBgVar})`,
        '--segmented-control-selected-text': `var(${selectedTextVar})`,
        '--segmented-control-border-color': `var(${containerBorderColorVar || textVar})`,
        '--segmented-control-selected-border-color': `var(${selectedBorderColorVar || selectedBgVar})`,
        '--segmented-control-border-radius': `var(${containerBorderRadiusVar})`,
        '--segmented-control-border-size': borderSizeValue,
        '--segmented-control-selected-border-size': selectedBorderSizeValue,
        '--segmented-control-selected-border-radius': `var(${selectedBorderRadiusVar})`,
        '--segmented-control-selected-elevation': selectedElevationFromVar || 'elevation-0',
        '--segmented-control-selected-elevation-shadow': selectedElevationBoxShadow || 'none',
        '--segmented-control-padding-horizontal': paddingHorizontalValue ? `var(${paddingHorizontalVar})` : '0px',
        '--segmented-control-padding-vertical': paddingVerticalValue ? `var(${paddingVerticalVar})` : '0px',
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
        '--segmented-control-full-width': fullWidth ? '1' : '0',
        // Ensure root element doesn't become block-level when fullWidth is false
        display: isVertical ? (fullWidth ? 'flex' : 'inline-flex') : (fullWidth ? 'flex' : 'inline-flex'),
        flexDirection: fullWidth ? (isVertical ? 'column' : 'row') : undefined,
        width: fullWidth ? '100%' : 'auto',
        maxWidth: !isVertical && maxWidthVar ? `var(${maxWidthVar})` : undefined,
        maxHeight: isVertical && maxHeightVar ? `var(${maxHeightVar})` : undefined,
        ...(elevationBoxShadow ? { boxShadow: elevationBoxShadow } : {}),
        ...mantine?.styles?.root,
      },
      control: {
        border: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        borderTop: 'none',
        borderBottom: 'none',
        boxShadow: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // Control width based on fullWidth prop
        flex: fullWidth && !isVertical ? '1 1 0%' : 'none',
        flexBasis: fullWidth && !isVertical ? '0%' : undefined,
        minWidth: fullWidth && !isVertical ? 0 : undefined,
        width: fullWidth && isVertical ? '100%' : 'auto',
        ...mantine?.styles?.control,
      },
      // Apply elevation to the control element when selected, not the indicator
      // We'll use CSS to apply this since Mantine's structure makes it complex
      label: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexGrow: fullWidth ? 1 : 0,
        width: fullWidth ? '100%' : 'auto',
        ...mantine?.styles?.label,
      },
      indicator: {
        // Override Mantine's indicator (the selected item background) to ensure no borders
        // Elevation is applied to the control element, not the indicator
        border: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        borderTop: 'none',
        borderBottom: 'none',
        boxShadow: 'none',
        ...mantine?.styles?.indicator,
      },
      ...mantine?.styles,
    },
    style: {
      ...style,
    },
    ...mantine,
    ...props,
  }
  
  const segmentedControl = <MantineSegmentedControl {...mantineProps} />
  
  // If labels are hidden and we have tooltips, wrap with tooltip support
  if (!showLabel && items.some(item => item.tooltip || (typeof item.label === 'string' && item.label))) {
    return (
      <div ref={wrapperRef} style={{ position: 'relative', display: fullWidth ? 'block' : 'inline-block', width: fullWidth ? '100%' : 'auto' }}>
        {segmentedControl}
        {/* Tooltips will be added via useEffect and event delegation */}
      </div>
    )
  }
  
  return segmentedControl
}
