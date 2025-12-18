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
  
  const componentElevation = elevation ?? readCssVar(elevationVar) ?? undefined
  const componentAlternativeLayer = alternativeLayer !== undefined 
    ? alternativeLayer 
    : (readCssVar(alternativeLayerVar) === 'none' ? null : readCssVar(alternativeLayerVar)) ?? null
  
  if (!Component) {
    // Fallback to native div if component not available
    const bgVar = getComponentCssVar('Toast', 'color', `${variant}-background`, layer)
    const textVar = getComponentCssVar('Toast', 'color', `${variant}-text`, layer)
    const verticalPaddingVar = getComponentCssVar('Toast', 'size', 'default-vertical-padding', undefined)
    const horizontalPaddingVar = getComponentCssVar('Toast', 'size', 'default-horizontal-padding', undefined)
    const minWidthVar = getComponentCssVar('Toast', 'size', 'default-min-width', undefined)
    const maxWidthVar = getComponentCssVar('Toast', 'size', 'default-max-width', undefined)
    const iconVar = getComponentCssVar('Toast', 'size', 'default-icon', undefined)
    const spacingVar = getComponentCssVar('Toast', 'size', 'default-spacing', undefined)
    
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
