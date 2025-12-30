/**
 * Carbon Toast Implementation
 * 
 * Carbon-specific Toast component that uses CSS variables for theming.
 * Uses a simple div-based approach for maximum flexibility.
 */

<<<<<<< HEAD
import React from 'react'
import type { ToastProps as AdapterToastProps } from '../../Toast'
import { getComponentCssVar, getComponentLevelCssVar } from '../../../utils/cssVarNames'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../../../core/css/readCssVar'
import { Button } from '../../Button'
import { iconNameToReactComponent } from '../../../../modules/components/iconUtils'
=======
import type { ToastProps as AdapterToastProps } from '../../Toast'
import { getComponentCssVar } from '../../../utils/cssVarNames'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../../../core/css/readCssVar'
>>>>>>> e44261b (Stopping point, submit as PR for code review)
import './Toast.css'

export default function Toast({
  children,
  variant = 'default',
  layer = 'layer-0',
  elevation,
  alternativeLayer,
  className,
  style,
  icon,
  onClose,
  action,
  carbon,
  ...props
}: AdapterToastProps) {
  const { mode } = useThemeMode()
<<<<<<< HEAD
  const CloseIcon = iconNameToReactComponent('x-mark')
=======
>>>>>>> e44261b (Stopping point, submit as PR for code review)
  
  // Check if component has alternative-layer prop set (overrides layer-based alt layer)
  const hasComponentAlternativeLayer = alternativeLayer && alternativeLayer !== 'none'
  const isAlternativeLayer = layer.startsWith('layer-alternative-') || hasComponentAlternativeLayer
  
  let toastBgVar: string
  let toastTextVar: string
  let toastButtonVar: string | undefined
  
  if (hasComponentAlternativeLayer) {
    // Component has alternative-layer prop set - use that alt layer's properties
    const layerBase = `--recursica-brand-${mode}-layer-layer-alternative-${alternativeLayer}-property`
    toastBgVar = `var(${layerBase}-surface)`
    toastTextVar = `var(${layerBase}-element-text-color)`
    // For success/error variants, use interactive tone for button
    if (variant === 'success' || variant === 'error') {
      toastButtonVar = `var(${layerBase}-element-interactive-tone)`
    }
  } else if (layer.startsWith('layer-alternative-')) {
    const altKey = layer.replace('layer-alternative-', '')
    const layerBase = `--recursica-brand-${mode}-layer-layer-alternative-${altKey}-property`
    toastBgVar = `var(${layerBase}-surface)`
    toastTextVar = `var(${layerBase}-element-text-color)`
    if (variant === 'success' || variant === 'error') {
      toastButtonVar = `var(${layerBase}-element-interactive-tone)`
    }
  } else {
    // Use UIKit.json toast colors for standard layers
    toastBgVar = getComponentCssVar('Toast', 'colors', `${variant}-background`, layer)
    toastTextVar = getComponentCssVar('Toast', 'colors', `${variant}-text`, layer)
    if (variant === 'success' || variant === 'error') {
      toastButtonVar = getComponentCssVar('Toast', 'colors', `${variant}-button`, layer)
    }
  }
  
  // Get size CSS variables
  const verticalPaddingVar = getComponentCssVar('Toast', 'size', 'default-vertical-padding', undefined)
  const horizontalPaddingVar = getComponentCssVar('Toast', 'size', 'default-horizontal-padding', undefined)
  const minWidthVar = getComponentCssVar('Toast', 'size', 'default-min-width', undefined)
  const maxWidthVar = getComponentCssVar('Toast', 'size', 'default-max-width', undefined)
  const iconVar = getComponentCssVar('Toast', 'size', 'default-icon', undefined)
  const spacingVar = getComponentCssVar('Toast', 'size', 'default-spacing', undefined)
<<<<<<< HEAD
  const textSizeVar = getComponentLevelCssVar('Toast', 'text-size')
=======
>>>>>>> e44261b (Stopping point, submit as PR for code review)
  
  // Apply elevation - prioritize alt layer elevation if alt-layer is set, otherwise use component elevation
  let elevationToApply: string | undefined = elevation
  
  if (hasComponentAlternativeLayer) {
    // Read elevation from alt layer's property
    const altLayerElevationVar = `--recursica-brand-${mode}-layer-layer-alternative-${alternativeLayer}-property-elevation`
    const altLayerElevation = readCssVar(altLayerElevationVar)
    if (altLayerElevation) {
      // Parse elevation value - could be a brand reference like "{brand.themes.light.elevations.elevation-4}"
      const match = altLayerElevation.match(/elevations\.(elevation-\d+)/)
      if (match) {
        elevationToApply = match[1]
      } else if (/^elevation-\d+$/.test(altLayerElevation)) {
        elevationToApply = altLayerElevation
      }
    }
    // If alt layer doesn't have elevation, fall back to component-level elevation
    if (!elevationToApply) {
      elevationToApply = elevation
    }
  }
  
  // Build box-shadow from elevation CSS variables if set (and not elevation-0)
  let boxShadow: string | undefined
  if (elevationToApply && elevationToApply !== 'elevation-0') {
    const elevationMatch = elevationToApply.match(/elevation-(\d+)/)
    if (elevationMatch) {
      const elevationLevel = elevationMatch[1]
      boxShadow = `var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-x-axis, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-y-axis, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-blur, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-spread, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-shadow-color, rgba(0, 0, 0, 0))`
    }
  }
  
  const carbonProps = {
    className: `recursica-toast ${className || ''}`,
    style: {
      // Use CSS variables for theming
      '--toast-bg': isAlternativeLayer ? toastBgVar : `var(${toastBgVar})`,
      '--toast-text': isAlternativeLayer ? toastTextVar : `var(${toastTextVar})`,
      '--toast-button': toastButtonVar ? (isAlternativeLayer ? toastButtonVar : `var(${toastButtonVar})`) : undefined,
      '--toast-vertical-padding': `var(${verticalPaddingVar})`,
      '--toast-horizontal-padding': `var(${horizontalPaddingVar})`,
      '--toast-min-width': `var(${minWidthVar})`,
      '--toast-max-width': `var(${maxWidthVar})`,
      '--toast-icon-size': icon ? `var(${iconVar})` : '0px',
      '--toast-spacing': icon || action ? `var(${spacingVar})` : '0px',
<<<<<<< HEAD
      '--toast-text-size': `var(${textSizeVar})`,
=======
>>>>>>> e44261b (Stopping point, submit as PR for code review)
      backgroundColor: isAlternativeLayer ? toastBgVar : `var(${toastBgVar})`,
      color: isAlternativeLayer ? toastTextVar : `var(${toastTextVar})`,
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
<<<<<<< HEAD
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
                    color: isAlternativeLayer ? toastButtonVar : `var(${toastButtonVar})`,
                    '--button-color': isAlternativeLayer ? toastButtonVar : `var(${toastButtonVar})`,
                  }
                : {}),
            } as React.CSSProperties}
          >
            {CloseIcon ? <CloseIcon /> : '×'}
          </Button>
=======
          <button
            className="recursica-toast-close"
            onClick={onClose}
            style={{
              backgroundColor: toastButtonVar ? (isAlternativeLayer ? toastButtonVar : `var(${toastButtonVar})`) : 'transparent',
            }}
          >
            ×
          </button>
>>>>>>> e44261b (Stopping point, submit as PR for code review)
        )}
      </div>
    </div>
  )
}
