/**
 * Badge Component Adapter
 * 
 * Unified Badge component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'

export type BadgeProps = {
  children?: React.ReactNode
  variant?: 'primary-color' | 'warning' | 'success' | 'alert'
  size?: 'small' | 'large'
  layer?: ComponentLayer
  elevation?: string
  className?: string
  style?: React.CSSProperties
} & LibrarySpecificProps

export function Badge({
  children,
  variant = 'primary-color',
  size,
  layer = 'layer-0',
  elevation,
  className,
  style,
  mantine,
  material,
  carbon,
}: BadgeProps) {
  const Component = useComponent('Badge')

  if (!Component) {
    return null
  }

  return (
    <Suspense fallback={<span />}>
      <Component
        variant={variant}
        size={size}
        layer={layer}
        elevation={elevation}
        className={className}
        style={style}
        mantine={mantine}
        material={material}
        carbon={carbon}
      >
        {children}
      </Component>
    </Suspense>
  )
}

