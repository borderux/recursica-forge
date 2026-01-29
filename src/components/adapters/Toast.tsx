/**
 * Toast Component Adapter
 * 
 * Unified Toast component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import React, { Suspense, useState, useEffect } from 'react'
import { useComponent } from '../hooks/useComponent'
import { getComponentCssVar, getComponentLevelCssVar, getComponentTextCssVar } from '../utils/cssVarNames'
import { parseElevationValue, getElevationBoxShadow } from '../utils/brandCssVars'
import { useThemeMode } from '../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../core/css/readCssVar'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'
import { Button } from './Button'
import { iconNameToReactComponent } from '../../modules/components/iconUtils'

export type ToastProps = {
  children?: React.ReactNode
  variant?: 'default' | 'success' | 'error'
  layer?: ComponentLayer
  elevation?: string // e.g., "elevation-0", "elevation-1", etc.
  className?: string
  style?: React.CSSProperties
  icon?: React.ReactNode
  onClose?: () => void
  action?: React.ReactNode
} & LibrarySpecificProps

export function Toast({
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
  material,
  carbon,
}: ToastProps) {
  const Component = useComponent('Toast')
  const { mode } = useThemeMode()
  
  // Get elevation from CSS vars if not provided as props
  // These are set by the toolbar and initialized from UIKit.json
  const elevationVar = getComponentLevelCssVar('Toast', 'elevation')
  
  // Reactively read elevation from CSS variable
  const [elevationFromVar, setElevationFromVar] = useState<string | undefined>(() => {
    const value = readCssVar(elevationVar)
    return value ? parseElevationValue(value) : undefined
  })
  
  // Listen for CSS variable updates from the toolbar
  useEffect(() => {
    const handleCssVarUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      // Update if these CSS vars were updated or if no specific vars were specified
      if (!detail?.cssVars || detail.cssVars.includes(elevationVar)) {
        const elevationValue = readCssVar(elevationVar)
        setElevationFromVar(elevationValue ? parseElevationValue(elevationValue) : undefined)
      }
    }
    
    window.addEventListener('cssVarsUpdated', handleCssVarUpdate)
    
    // Also watch for direct style changes using MutationObserver
    const observer = new MutationObserver(() => {
      const elevationValue = readCssVar(elevationVar)
      setElevationFromVar(elevationValue ? parseElevationValue(elevationValue) : undefined)
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
  
  const componentElevation = elevation ?? elevationFromVar ?? undefined
  
  if (!Component) {
    // Fallback to native div if component not available
    const CloseIcon = iconNameToReactComponent('x-mark')
    const bgVar = getComponentCssVar('Toast', 'colors', `${variant}-background`, layer)
    const textVar = getComponentCssVar('Toast', 'colors', `${variant}-text`, layer)
    const buttonVar = (variant === 'success' || variant === 'error')
      ? getComponentCssVar('Toast', 'colors', `${variant}-button`, layer)
      : null
    // Get component-level CSS variables (these are under toast.properties in UIKit.json)
    const verticalPaddingVar = getComponentLevelCssVar('Toast', 'vertical-padding')
    const horizontalPaddingVar = getComponentLevelCssVar('Toast', 'horizontal-padding')
    const minWidthVar = getComponentLevelCssVar('Toast', 'min-width')
    const maxWidthVar = getComponentLevelCssVar('Toast', 'max-width')
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
    
    // Build box-shadow from elevation if set (and not elevation-0)
    const boxShadow = getElevationBoxShadow(mode, componentElevation)
    
    return (
      <div
        className={className}
        style={{
          backgroundColor: `var(${bgVar})`,
          color: `var(${textVar})`,
          paddingTop: `var(${verticalPaddingVar})`,
          paddingBottom: `var(${verticalPaddingVar})`,
          paddingLeft: `var(${horizontalPaddingVar})`,
          paddingRight: `var(${horizontalPaddingVar})`,
          minWidth: `var(${minWidthVar})`,
          maxWidth: `var(${maxWidthVar})`,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: icon || action ? `var(${spacingVar})` : 0,
          ...(boxShadow && { boxShadow }),
          ...style,
        }}
      >
        {icon && (
          <>
            <style>{`
              [data-toast-icon-wrapper] svg {
                width: var(${iconVar}) !important;
                height: var(${iconVar}) !important;
              }
            `}</style>
            <span 
              data-toast-icon-wrapper
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {icon}
            </span>
          </>
        )}
        <span style={{
          flex: 1,
          fontFamily: textFontFamilyVar ? `var(${textFontFamilyVar})` : undefined,
          fontSize: textFontSizeVar ? `var(${textFontSizeVar})` : undefined,
          fontWeight: textFontWeightVar ? `var(${textFontWeightVar})` : undefined,
          letterSpacing: textLetterSpacingVar ? `var(${textLetterSpacingVar})` : undefined,
          lineHeight: textLineHeightVar ? `var(${textLineHeightVar})` : undefined,
          textDecoration: textDecorationVar ? `var(${textDecorationVar})` : undefined,
          textTransform: textTransformVar ? `var(${textTransformVar})` : undefined,
          fontStyle: textFontStyleVar ? `var(${textFontStyleVar})` : undefined,
        }}>{children}</span>
        {action && <span style={{ flexShrink: 0 }}>{action}</span>}
        {onClose && (
          <Button
            variant="text"
            size="small"
            layer={layer}
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              '--button-bg': 'transparent',
              minWidth: 'auto',
              width: 'auto',
              height: 'auto',
              padding: 0,
              flexShrink: 0,
              ...(buttonVar
                ? {
                    color: `var(${buttonVar})`,
                    '--button-color': `var(${buttonVar})`,
                  }
                : {}),
            } as React.CSSProperties}
          >
            {CloseIcon ? <CloseIcon /> : '×'}
          </Button>
        )}
      </div>
    )
  }
  
  // Map unified props to library-specific props
  const libraryProps = mapToastProps({
    variant,
    layer,
    elevation: componentElevation,
    className,
    style,
    icon,
    onClose,
    action,
    mantine,
    material,
    carbon,
  })
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Component {...libraryProps}>{children}</Component>
    </Suspense>
  )
}

function mapToastProps(props: ToastProps & { elevation?: string }): any {
  const { mantine, material, carbon, ...rest } = props
  
  // Base props that work across libraries
  const baseProps: any = {
    ...rest,
  }
  
  return {
    ...baseProps,
    // Mantine-specific
    ...(mantine && { mantine }),
    // Material-specific
    ...(material && { material }),
    // Carbon-specific
    ...(carbon && { carbon }),
  }
}
