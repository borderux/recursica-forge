/**
 * MenuItem Component Adapter
 * 
 * Unified MenuItem component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'

export type MenuItemProps = {
  children?: React.ReactNode
  variant?: 'default' | 'hover' | 'selected' | 'focused' | 'disabled'
  layer?: ComponentLayer
  leadingIcon?: React.ReactNode
  leadingIconType?: 'radio' | 'checkbox' | 'icon' | 'none'
  trailingIcon?: React.ReactNode
  supportingText?: string
  selected?: boolean
  divider?: 'none' | 'bottom'
  dividerColor?: string
  dividerOpacity?: number
  disabled?: boolean
  onClick?: (e: React.MouseEvent) => void
  className?: string
  style?: React.CSSProperties
} & LibrarySpecificProps

export function MenuItem({
  children,
  variant = 'default',
  layer = 'layer-0',
  leadingIcon,
  leadingIconType = 'none',
  trailingIcon,
  supportingText,
  selected = false,
  divider,
  dividerColor,
  dividerOpacity,
  disabled = false,
  onClick,
  className,
  style,
  mantine,
  material,
  carbon,
}: MenuItemProps) {
  const Component = useComponent('MenuItem')

  // Determine effective variant based on props
  let effectiveVariant = variant
  if (disabled) {
    effectiveVariant = 'disabled'
  } else if (selected) {
    effectiveVariant = 'selected'
  }

  if (!Component) {
    // Fallback to native button if component not available
    return (
      <button
        disabled={disabled}
        onClick={onClick}
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          border: 'none',
          background: 'transparent',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          ...style,
        }}
      >
        {leadingIcon && leadingIconType !== 'none' && (
          <span>{leadingIcon}</span>
        )}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <span>{children}</span>
          {supportingText && (
            <span style={{ fontSize: '0.875rem', opacity: 0.7 }}>
              {supportingText}
            </span>
          )}
        </div>
        {trailingIcon && <span>{trailingIcon}</span>}
        {divider === 'bottom' && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: '#e0e0e0',
          }} />
        )}
      </button>
    )
  }

  // Map unified props to library-specific props
  const libraryProps = {
    variant: effectiveVariant,
    layer,
    leadingIcon,
    leadingIconType,
    trailingIcon,
    supportingText,
    selected,
    divider,
    dividerColor,
    dividerOpacity,
    disabled,
    onClick,
    className,
    style,
    mantine,
    material,
    carbon,
  }

  return (
    <Suspense fallback={<span />}>
      <Component {...libraryProps}>{children}</Component>
    </Suspense>
  )
}

