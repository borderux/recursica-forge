/**
 * Mantine SegmentedControl Implementation
 * 
 * Mantine-specific SegmentedControl component that uses CSS variables for theming.
 */

import { SegmentedControl as MantineSegmentedControl } from '@mantine/core'
import type { SegmentedControlProps as AdapterSegmentedControlProps } from '../../SegmentedControl'
import { getComponentCssVar, getComponentLevelCssVar, getComponentTextCssVar, buildComponentCssVarPath } from '../../../utils/cssVarNames'
import { useState, useEffect } from 'react'
import { getElevationBoxShadow, parseElevationValue } from '../../../utils/brandCssVars'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../../../core/css/readCssVar'
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
  mantine,
  ...props
}: AdapterSegmentedControlProps) {
  const { mode } = useThemeMode()
  
  // Map unified orientation to Mantine orientation
  const mantineOrientation = orientation === 'vertical' ? 'vertical' : 'horizontal'
  const mantineSize = 'md' // Default size
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
  const elevationVar = getComponentLevelCssVar('SegmentedControl', 'elevation')
  const selectedElevationVar = getComponentLevelCssVar('SegmentedControl', 'selected-elevation')
  
  // Reactively read border-size
  const borderSizeValue = useCssVar(borderSizeVar, '1px')
  const selectedBorderSizeValue = useCssVar(selectedBorderSizeVar, '1px')
  
  // Convert items to Mantine format with icons and labels
  const mantineData = items.map(item => {
    const hasIcon = !!item.icon
    const hasLabel = !!item.label
    let label: React.ReactNode = item.label
    
    // If item has both icon and label, combine them
    if (hasIcon && hasLabel) {
      label = (
        <span style={{ display: 'flex', alignItems: 'center', gap: iconGapVar ? `var(${iconGapVar})` : '8px' }}>
          <span style={{
            display: 'flex',
            alignItems: 'center',
            width: iconSizeVar ? `var(${iconSizeVar})` : '16px',
            height: iconSizeVar ? `var(${iconSizeVar})` : '16px',
            flexShrink: 0,
          }}>
            {item.icon}
          </span>
          <span>{item.label}</span>
        </span>
      )
    } else if (hasIcon && !hasLabel) {
      // Icon only
      label = (
        <span style={{
          display: 'flex',
          alignItems: 'center',
          width: iconSizeVar ? `var(${iconSizeVar})` : '16px',
          height: iconSizeVar ? `var(${iconSizeVar})` : '16px',
        }}>
          {item.icon}
        </span>
      )
    }
    
    return {
      value: item.value,
      label,
      disabled: item.disabled || disabled,
    }
  })
  
  // Get elevation from CSS vars if not provided as props
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
        ...mantine?.styles?.root,
      },
      ...mantine?.styles,
    },
    style: {
      ...style,
    },
    ...mantine,
    ...props,
  }
  
  return <MantineSegmentedControl {...mantineProps} />
}
