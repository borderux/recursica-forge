/**
 * Mantine Toast Implementation
 * 
 * Mantine-specific Toast component that uses CSS variables for theming.
 * Uses Mantine's Paper component as the base for toast styling.
 */

import React, { useState, useEffect, useMemo } from 'react'
import { Paper } from '@mantine/core'
import type { ToastProps as AdapterToastProps } from '../../Toast'
import { getComponentCssVar, getComponentLevelCssVar, getComponentTextCssVar, buildComponentCssVarPath } from '../../../utils/cssVarNames'
import { getElevationBoxShadow, extractElevationMode, parseElevationValue } from '../../../utils/brandCssVars'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../../../core/css/readCssVar'
import { Button } from '../../Button'
import { iconNameToReactComponent } from '../../../../modules/components/iconUtils'
import './Toast.css'

export default function Toast({
  children,
  variant = 'default',
  layer = 'layer-0',
  elevation,
  className,
  style,
  icon,
  onClose,
  action,
  mantine,
  ...props
}: AdapterToastProps) {
  const { mode } = useThemeMode()
  const CloseIcon = iconNameToReactComponent('x-mark')
  
  // Use UIKit.json toast colors for standard layers
  const toastBgVar = getComponentCssVar('Toast', 'colors', `${variant}-background`, layer)
  const toastTextVar = getComponentCssVar('Toast', 'colors', `${variant}-text`, layer)
  // Button color from UIKit.json
  const toastButtonVar = getComponentCssVar('Toast', 'colors', `${variant}-button`, layer)
  
  // Get component-level CSS variables (these are under toast.properties in UIKit.json)
  const verticalPaddingVar = getComponentLevelCssVar('Toast', 'vertical-padding')
  const horizontalPaddingVar = getComponentLevelCssVar('Toast', 'horizontal-padding')
  const minWidthVar = getComponentLevelCssVar('Toast', 'min-width')
  const maxWidthVar = getComponentLevelCssVar('Toast', 'max-width')
  const minHeightVar = getComponentLevelCssVar('Toast', 'min-height')
  const iconVar = getComponentLevelCssVar('Toast', 'icon')
  const spacingVar = getComponentLevelCssVar('Toast', 'spacing')
  
  // Get text style CSS variables
  const textFontFamilyVar = getComponentTextCssVar('Toast', 'text', 'font-family')
  const textFontSizeVar = getComponentTextCssVar('Toast', 'text', 'font-size')
  const textFontWeightVar = getComponentTextCssVar('Toast', 'text', 'font-weight')
  const textLetterSpacingVar = getComponentTextCssVar('Toast', 'text', 'letter-spacing')
  const textLineHeightVar = getComponentTextCssVar('Toast', 'text', 'line-height')
  const textDecorationVar = getComponentTextCssVar('Toast', 'text', 'text-decoration')
  const textTransformVar = getComponentTextCssVar('Toast', 'text', 'text-transform')
  const textFontStyleVar = getComponentTextCssVar('Toast', 'text', 'font-style')
  
  // Reactivity for text style CSS variables
  const [textVarsUpdate, setTextVarsUpdate] = useState(0)
  useEffect(() => {
    const textCssVars = [
      textFontFamilyVar,
      textFontSizeVar,
      textFontWeightVar,
      textLetterSpacingVar,
      textLineHeightVar,
      textDecorationVar,
      textTransformVar,
      textFontStyleVar,
    ].filter(Boolean) as string[]
    
    const handleCssVarUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      const updatedVars = detail?.cssVars || []
      const shouldUpdate = updatedVars.length === 0 || updatedVars.some((v: string) => textCssVars.includes(v))
      
      if (shouldUpdate) {
        setTextVarsUpdate(prev => prev + 1)
      }
    }
    
    window.addEventListener('cssVarsUpdated', handleCssVarUpdate)
    
    const observer = new MutationObserver(() => {
      setTextVarsUpdate(prev => prev + 1)
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    })
    
    return () => {
      window.removeEventListener('cssVarsUpdated', handleCssVarUpdate)
      observer.disconnect()
    }
  }, [textFontFamilyVar, textFontSizeVar, textFontWeightVar, textLetterSpacingVar, textLineHeightVar, textDecorationVar, textTransformVar, textFontStyleVar])
  
  // Read elevation CSS variable and extract mode from it (reactive)
  const elevationVar = useMemo(() => {
    return buildComponentCssVarPath('Toast', 'properties', 'elevation', layer, mode)
  }, [layer, mode])
  
  const [elevationFromVar, setElevationFromVar] = useState<string | undefined>(() => {
    const value = readCssVar(elevationVar)
    return value ? parseElevationValue(value) : undefined
  })
  
  const [elevationModeFromVar, setElevationModeFromVar] = useState<'light' | 'dark' | undefined>(() => {
    const value = readCssVar(elevationVar)
    return extractElevationMode(value, elevationVar)
  })
  
  // Re-read elevation when elevationVar changes (including when layer changes)
  useEffect(() => {
    const value = readCssVar(elevationVar)
    const parsed = value ? parseElevationValue(value) : undefined
    const extractedMode = extractElevationMode(value, elevationVar)
    setElevationFromVar(parsed)
    setElevationModeFromVar(extractedMode)
  }, [elevationVar, mode])
  
  // Listen for CSS variable updates
  useEffect(() => {
    const handleCssVarUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (!detail?.cssVars || detail.cssVars.includes(elevationVar)) {
        const value = readCssVar(elevationVar)
        const parsed = value ? parseElevationValue(value) : undefined
        const extractedMode = extractElevationMode(value, elevationVar)
        setElevationFromVar(parsed)
        setElevationModeFromVar(extractedMode)
      }
    }
    
    window.addEventListener('cssVarsUpdated', handleCssVarUpdate)
    
    const observer = new MutationObserver(() => {
      const value = readCssVar(elevationVar)
      const parsed = value ? parseElevationValue(value) : undefined
      const extractedMode = extractElevationMode(value, elevationVar)
      setElevationFromVar(parsed)
      setElevationModeFromVar(extractedMode)
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    })
    
    return () => {
      window.removeEventListener('cssVarsUpdated', handleCssVarUpdate)
      observer.disconnect()
    }
  }, [elevationVar])
  
  const elevationModeToUse = elevationModeFromVar ?? mode
  
  // Use elevation from CSS variable if available, otherwise use prop
  const componentElevation = elevation ?? elevationFromVar
  
  // Build box-shadow from elevation CSS variables if set (and not elevation-0)
  // Use the mode from the CSS variable if available, otherwise use current mode
  const boxShadow = getElevationBoxShadow(elevationModeToUse, componentElevation)
  
  const mantineProps = {
    className,
    style: {
      // Use CSS variables for theming
      '--toast-bg': `var(${toastBgVar})`,
      '--toast-text': `var(${toastTextVar})`,
      ...(toastButtonVar ? { '--toast-button': `var(${toastButtonVar})` } : {}),
      '--toast-vertical-padding': `var(${verticalPaddingVar})`,
      '--toast-horizontal-padding': `var(${horizontalPaddingVar})`,
      '--toast-min-width': `var(${minWidthVar})`,
      '--toast-max-width': `var(${maxWidthVar})`,
      '--toast-min-height': `var(${minHeightVar})`,
      '--toast-icon-size': icon ? `var(${iconVar})` : '0px',
      '--toast-spacing': icon || action ? `var(${spacingVar})` : '0px',
      backgroundColor: `var(${toastBgVar})`,
      color: `var(${toastTextVar})`,
      ...(boxShadow && { boxShadow }),
      ...style,
    },
    ...mantine,
    ...props,
  }
  
  return (
    <Paper {...mantineProps} className={`recursica-toast ${className || ''}`}>
      <div className="recursica-toast-content">
        {icon && (
          <span className="recursica-toast-icon">
            {icon}
          </span>
        )}
        <span className="recursica-toast-message" style={{
          fontFamily: textFontFamilyVar ? `var(${textFontFamilyVar})` : undefined,
          fontSize: textFontSizeVar ? `var(${textFontSizeVar})` : undefined,
          fontWeight: textFontWeightVar ? `var(${textFontWeightVar})` : undefined,
          letterSpacing: textLetterSpacingVar ? `var(${textLetterSpacingVar})` : undefined,
          lineHeight: textLineHeightVar ? `var(${textLineHeightVar})` : undefined,
          textDecoration: textDecorationVar ? `var(${textDecorationVar})` : undefined,
          textTransform: textTransformVar ? `var(${textTransformVar})` as React.CSSProperties['textTransform'] : undefined,
          fontStyle: textFontStyleVar ? `var(${textFontStyleVar})` : undefined,
        }}>{children}</span>
        {action && (
          <span className="recursica-toast-action">{action}</span>
        )}
        {onClose && (
          <Button
            variant="text"
            size="small"
            layer={layer}
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              '--button-bg': 'transparent',
              opacity: 1,
              minWidth: 'auto',
              width: 'auto',
              height: 'auto',
              padding: 0,
              flexShrink: 0,
              ...(toastButtonVar ? {
                color: `var(${toastButtonVar})`,
                '--button-color': `var(${toastButtonVar})`,
              } : {}),
            } as React.CSSProperties}
          >
            {CloseIcon ? <CloseIcon /> : '×'}
          </Button>
        )}
      </div>
    </Paper>
  )
}
