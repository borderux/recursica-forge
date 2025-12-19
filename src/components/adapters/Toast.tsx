/**
 * Toast Component Adapter
 * 
 * Unified Toast component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import { getComponentCssVar, getComponentLevelCssVar } from '../utils/cssVarNames'
import { useThemeMode } from '../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../core/css/readCssVar'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'

export type ToastProps = {
  children?: React.ReactNode
  variant?: 'default' | 'success' | 'error'
  layer?: ComponentLayer
  elevation?: string // e.g., "elevation-0", "elevation-1", etc.
  alternativeLayer?: string | null // e.g., "high-contrast", "none", null
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
  alternativeLayer,
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
  
  // Get elevation and alternative-layer from CSS vars if not provided as props
  // These are set by the toolbar and initialized from UIKit.json
  const elevationVar = getComponentLevelCssVar('Toast', 'elevation')
  const alternativeLayerVar = getComponentLevelCssVar('Toast', 'alternative-layer')
  
  // Parse elevation value from CSS var - could be a brand reference like "{brand.themes.light.elevations.elevation-3}"
  const elevationFromVar = readCssVar(elevationVar)
  let parsedElevation: string | undefined = elevation
  if (!parsedElevation && elevationFromVar) {
    // Parse elevation value - could be a brand reference like "{brand.themes.light.elevations.elevation-3}"
    const match = elevationFromVar.match(/elevations\.(elevation-\d+)/)
    if (match) {
      parsedElevation = match[1]
    } else if (/^elevation-\d+$/.test(elevationFromVar)) {
      parsedElevation = elevationFromVar
    }
  }
  const componentElevation = parsedElevation
  const componentAlternativeLayer = alternativeLayer !== undefined 
    ? alternativeLayer 
    : (readCssVar(alternativeLayerVar) === 'none' ? null : readCssVar(alternativeLayerVar)) ?? null
  
  if (!Component) {
    // Fallback to native div if component not available
    const bgVar = getComponentCssVar('Toast', 'color', `${variant}-background`, layer)
    const textVar = getComponentCssVar('Toast', 'color', `${variant}-text`, layer)
    const verticalPaddingVar = getComponentCssVar('Toast', 'size', 'vertical-padding', undefined)
    const horizontalPaddingVar = getComponentCssVar('Toast', 'size', 'horizontal-padding', undefined)
    const minWidthVar = getComponentCssVar('Toast', 'size', 'min-width', undefined)
    const maxWidthVar = getComponentCssVar('Toast', 'size', 'max-width', undefined)
    const iconVar = getComponentCssVar('Toast', 'size', 'icon', undefined)
    const spacingVar = getComponentCssVar('Toast', 'size', 'spacing', undefined)
    
    // Build box-shadow from elevation if set (and not elevation-0)
    let boxShadow: string | undefined
    if (componentElevation && componentElevation !== 'elevation-0') {
      const elevationMatch = componentElevation.match(/elevation-(\d+)/)
      if (elevationMatch) {
        const elevationLevel = elevationMatch[1]
        boxShadow = `var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-x-axis, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-y-axis, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-blur, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-spread, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-shadow-color, rgba(0, 0, 0, 0))`
      }
    }
    
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
          <span style={{
            display: 'inline-flex',
            width: `var(${iconVar})`,
            height: `var(${iconVar})`,
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            {icon}
          </span>
        )}
        <span style={{ flex: 1 }}>{children}</span>
        {action && <span style={{ flexShrink: 0 }}>{action}</span>}
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            ×
          </button>
        )}
      </div>
    )
  }
  
  // Map unified props to library-specific props
  const libraryProps = mapToastProps({
    variant,
    layer,
    elevation: componentElevation,
    alternativeLayer: componentAlternativeLayer,
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

function mapToastProps(props: ToastProps & { elevation?: string; alternativeLayer?: string | null }): any {
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
