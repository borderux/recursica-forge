/**
 * Mantine Toast Implementation
 * 
 * Mantine-specific Toast component that uses CSS variables for theming.
 * Uses Mantine's Paper component as the base for toast styling.
 */

import React from 'react'
import { Paper } from '@mantine/core'
import type { ToastProps as AdapterToastProps } from '../../Toast'
import { getComponentCssVar, getComponentLevelCssVar } from '../../../utils/cssVarNames'
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
  alternativeLayer,
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
  
  // Check if component has alternative-layer prop set (overrides layer-based alt layer)
  const hasComponentAlternativeLayer = alternativeLayer && alternativeLayer !== 'none'
  const isAlternativeLayer = layer.startsWith('layer-alternative-') || hasComponentAlternativeLayer
  
  let toastBgVar: string
  let toastTextVar: string
  let toastButtonVar: string | undefined
  
  if (hasComponentAlternativeLayer) {
    // Component has alternative-layer prop set - use that alt layer's properties
    // Use new brand.json structure: --recursica-brand-themes-{mode}-layer-layer-alternative-{n}-property
    const layerBase = `--recursica-brand-themes-${mode}-layer-layer-alternative-${alternativeLayer}-property`
    toastBgVar = `var(${layerBase}-surface)`
    toastTextVar = `var(${layerBase}-element-text-color)`
    // For success/error variants, use interactive tone for button
    if (variant === 'success' || variant === 'error') {
      toastButtonVar = `var(${layerBase}-element-interactive-tone)`
    }
  } else if (layer.startsWith('layer-alternative-')) {
    const altKey = layer.replace('layer-alternative-', '')
    // Use new brand.json structure: --recursica-brand-themes-{mode}-layer-layer-alternative-{n}-property
    const layerBase = `--recursica-brand-themes-${mode}-layer-layer-alternative-${altKey}-property`
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
  
  // Get component-level CSS variables (these are under toast.properties in UIKit.json)
  const verticalPaddingVar = getComponentLevelCssVar('Toast', 'vertical-padding')
  const horizontalPaddingVar = getComponentLevelCssVar('Toast', 'horizontal-padding')
  const minWidthVar = getComponentLevelCssVar('Toast', 'min-width')
  const maxWidthVar = getComponentLevelCssVar('Toast', 'max-width')
  const iconVar = getComponentLevelCssVar('Toast', 'icon')
  const spacingVar = getComponentLevelCssVar('Toast', 'spacing')
  const textSizeVar = getComponentLevelCssVar('Toast', 'text-size')
  
  // Apply elevation - prioritize alt layer elevation if alt-layer is set, otherwise use component elevation
  let elevationToApply: string | undefined = elevation
  
  if (hasComponentAlternativeLayer) {
    // Read elevation from alt layer's property
    // Use new brand.json structure: --recursica-brand-themes-{mode}-layer-layer-alternative-{n}-property-elevation
    const altLayerElevationVar = `--recursica-brand-themes-${mode}-layer-layer-alternative-${alternativeLayer}-property-elevation`
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
  // Use new brand.json structure: --recursica-brand-themes-{mode}-elevations-elevation-{n}-{property}
  let boxShadow: string | undefined
  if (elevationToApply && elevationToApply !== 'elevation-0') {
    const elevationMatch = elevationToApply.match(/elevation-(\d+)/)
    if (elevationMatch) {
      const elevationLevel = elevationMatch[1]
      boxShadow = `var(--recursica-brand-themes-${mode}-elevations-elevation-${elevationLevel}-x-axis, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-${elevationLevel}-y-axis, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-${elevationLevel}-blur, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-${elevationLevel}-spread, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-${elevationLevel}-shadow-color, rgba(0, 0, 0, 0))`
    }
  }
  
  const mantineProps = {
    className,
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
      '--toast-text-size': `var(${textSizeVar})`,
      backgroundColor: isAlternativeLayer ? toastBgVar : `var(${toastBgVar})`,
      color: isAlternativeLayer ? toastTextVar : `var(${toastTextVar})`,
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
                    color: isAlternativeLayer ? toastButtonVar : `var(${toastButtonVar})`,
                    '--button-color': isAlternativeLayer ? toastButtonVar : `var(${toastButtonVar})`,
                  }
                : {}),
            } as React.CSSProperties}
          >
            {CloseIcon ? <CloseIcon /> : '×'}
          </Button>
        )}
      </div>
    </Paper>
  )
}
