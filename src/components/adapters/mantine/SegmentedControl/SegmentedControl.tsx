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
  
  // Get other properties
  const itemGapVar = getComponentLevelCssVar('SegmentedControl', 'item-gap')
  const iconSizeVar = buildComponentCssVarPath('SegmentedControl', 'properties', 'item', 'icon-size')
  const iconGapVar = buildComponentCssVarPath('SegmentedControl', 'properties', 'item', 'icon-text-gap')
  
  // #region agent log
  const paddingHorizontalValue = readCssVar(paddingHorizontalVar)
  const paddingVerticalValue = readCssVar(paddingVerticalVar)
  const paddingHorizontalResolved = readCssVarResolved(paddingHorizontalVar)
  const paddingVerticalResolved = readCssVarResolved(paddingVerticalVar)
  const iconGapValueForStyles = iconGapVar ? readCssVar(iconGapVar) : null
  fetch('http://127.0.0.1:7242/ingest/d16cd3f3-655c-4e29-8162-ad6e504c679e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mantine/SegmentedControl.tsx:padding-var-reads',message:'Padding CSS variable values',data:{paddingHorizontalVar,paddingHorizontalValue,paddingHorizontalResolved,paddingVerticalVar,paddingVerticalValue,paddingVerticalResolved,iconGapVar,iconGapValueForStyles},timestamp:Date.now(),sessionId:'debug-session',runId:'padding-gap-debug',hypothesisId:'A'})}).catch(()=>{});
  // #endregion agent log
  
  // Get divider properties
  const dividerColorVar = buildComponentCssVarPath('SegmentedControl', 'properties', 'colors', layer, 'divider-color')
  const dividerSizeVar = getComponentLevelCssVar('SegmentedControl', 'divider-size')
  
  // Get orientation-specific max-width/max-height
  const maxWidthVar = buildComponentCssVarPath('SegmentedControl', 'variants', 'orientation', 'horizontal', 'properties', 'max-width')
  const maxHeightVar = buildComponentCssVarPath('SegmentedControl', 'variants', 'orientation', 'vertical', 'properties', 'max-height')
  
  // Get text properties
  const fontFamilyVar = getComponentTextCssVar('SegmentedControl', 'text', 'font-family')
  const fontSizeVar = getComponentTextCssVar('SegmentedControl', 'text', 'font-size')
  const fontWeightVar = getComponentTextCssVar('SegmentedControl', 'text', 'font-weight')
  const letterSpacingVar = getComponentTextCssVar('SegmentedControl', 'text', 'letter-spacing')
  const lineHeightVar = getComponentTextCssVar('SegmentedControl', 'text', 'line-height')
  const textDecorationVar = getComponentTextCssVar('SegmentedControl', 'text', 'text-decoration')
  const textTransformVar = getComponentTextCssVar('SegmentedControl', 'text', 'text-transform')
  const fontStyleVar = getComponentTextCssVar('SegmentedControl', 'text', 'font-style')
  
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
      // #region agent log
      const iconGapValue = iconGapVar ? readCssVar(iconGapVar) : null
      const iconGapResolved = iconGapVar ? readCssVarResolved(iconGapVar) : null
      if (items.indexOf(item) === 0) {
        fetch('http://127.0.0.1:7242/ingest/d16cd3f3-655c-4e29-8162-ad6e504c679e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mantine/SegmentedControl.tsx:icon-gap-check',message:'Icon gap CSS variable check',data:{iconGapVar,iconGapValue,iconGapResolved,hasIcon,hasLabel,willUseGap:iconGapVar ? `var(${iconGapVar})` : '8px'},timestamp:Date.now(),sessionId:'debug-session',runId:'padding-gap-debug',hypothesisId:'A'})}).catch(()=>{});
      }
      // #endregion agent log
      label = (
        <span style={{ display: 'flex', alignItems: 'center', gap: iconGapVar && iconGapValue ? `var(${iconGapVar})` : (iconGapVar && !iconGapValue ? '0px' : '8px') }}>
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
          // #region agent log
          ref={(el) => {
            if (el && items.indexOf(item) === 0) {
              setTimeout(() => {
                const computedStyle = window.getComputedStyle(el)
                const controlEl = el.closest('.mantine-SegmentedControl-control')
                const buttonStyle = controlEl ? window.getComputedStyle(controlEl as HTMLElement) : null
                fetch('http://127.0.0.1:7242/ingest/d16cd3f3-655c-4e29-8162-ad6e504c679e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mantine/SegmentedControl.tsx:icon-only-span-ref',message:'Mantine icon-only span computed styles',data:{iconMarginLeft:computedStyle.marginLeft,iconMarginRight:computedStyle.marginRight,iconPaddingLeft:computedStyle.paddingLeft,iconPaddingRight:computedStyle.paddingRight,buttonPaddingLeft:buttonStyle?.paddingLeft,buttonPaddingRight:buttonStyle?.paddingRight,buttonGap:buttonStyle?.gap,buttonJustifyContent:buttonStyle?.justifyContent,buttonDisplay:buttonStyle?.display,hasIcon,hasLabel},timestamp:Date.now(),sessionId:'debug-session',runId:'icon-centering-debug',hypothesisId:'C'})}).catch(()=>{});
              }, 100)
            }
          }}
          // #endregion agent log
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
  
  const mantineProps = {
    data: mantineData,
    value: value ?? defaultValue,
    onChange: onChange ? (val: string) => onChange(val) : undefined,
    size: mantineSize,
    orientation: mantineOrientation as 'horizontal' | 'vertical',
    disabled,
    fullWidth,
    className,
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
        ...mantine?.styles?.control,
      },
      // Apply elevation to the control element when selected, not the indicator
      // We'll use CSS to apply this since Mantine's structure makes it complex
      label: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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
