/**
 * Carbon Toast Implementation
 * 
 * Carbon-specific Toast component that uses CSS variables for theming.
 * Uses a simple div-based approach for maximum flexibility.
 */

import React from 'react'
import type { ToastProps as AdapterToastProps } from '../../Toast'
import { getComponentCssVar, getComponentLevelCssVar } from '../../../utils/cssVarNames'
import { getElevationBoxShadow } from '../../../utils/brandCssVars'
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
  carbon,
  ...props
}: AdapterToastProps) {
  const { mode } = useThemeMode()
  const CloseIcon = iconNameToReactComponent('x-mark')
  
  // Use UIKit.json toast colors for standard layers
  const toastBgVar = getComponentCssVar('Toast', 'colors', `${variant}-background`, layer)
  const toastTextVar = getComponentCssVar('Toast', 'colors', `${variant}-text`, layer)
  let toastButtonVar: string | undefined
  if (variant === 'success' || variant === 'error') {
    toastButtonVar = getComponentCssVar('Toast', 'colors', `${variant}-button`, layer)
  }
  
  // Get component-level CSS variables (these are under toast.properties in UIKit.json)
  const verticalPaddingVar = getComponentLevelCssVar('Toast', 'vertical-padding')
  const horizontalPaddingVar = getComponentLevelCssVar('Toast', 'horizontal-padding')
  const minWidthVar = getComponentLevelCssVar('Toast', 'min-width')
  const maxWidthVar = getComponentLevelCssVar('Toast', 'max-width')
  const iconVar = getComponentLevelCssVar('Toast', 'icon')
  const spacingVar = getComponentLevelCssVar('Toast', 'spacing')
  const textSizeVar = getComponentLevelCssVar('Toast', 'text-size')
  
  // Build box-shadow from elevation CSS variables if set (and not elevation-0)
  const boxShadow = getElevationBoxShadow(mode, elevation)
  
  const carbonProps = {
    className: `recursica-toast ${className || ''}`,
    style: {
      // Use CSS variables for theming
      '--toast-bg': `var(${toastBgVar})`,
      '--toast-text': `var(${toastTextVar})`,
      '--toast-button': toastButtonVar ? `var(${toastButtonVar})` : undefined,
      '--toast-vertical-padding': `var(${verticalPaddingVar})`,
      '--toast-horizontal-padding': `var(${horizontalPaddingVar})`,
      '--toast-min-width': `var(${minWidthVar})`,
      '--toast-max-width': `var(${maxWidthVar})`,
      '--toast-icon-size': icon ? `var(${iconVar})` : '0px',
      '--toast-spacing': icon || action ? `var(${spacingVar})` : '0px',
      '--toast-text-size': `var(${textSizeVar})`,
      backgroundColor: `var(${toastBgVar})`,
      color: `var(${toastTextVar})`,
      ...(boxShadow && { boxShadow }),
      ...style,
    },
    ...carbon,
    ...props,
  }
  
  return (
    <div {...carbonProps}>
      <div className="recursica-toast-content">
        {icon && (
          <span className="recursica-toast-icon">
            {icon}
          </span>
        )}
        <span className="recursica-toast-message">{children}</span>
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
              minWidth: 'auto',
              width: 'auto',
              height: 'auto',
              padding: 0,
              flexShrink: 0,
              ...(toastButtonVar
                ? {
                    color: `var(${toastButtonVar})`,
                    '--button-color': `var(${toastButtonVar})`,
                  }
                : {}),
            } as React.CSSProperties}
          >
            {CloseIcon ? <CloseIcon /> : '×'}
          </Button>
        )}
      </div>
    </div>
  )
}
