/**
 * TableFooter Component Adapter
 * 
 * Unified TableFooter component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'

export type TableFooterProps = {
  children?: React.ReactNode
  variant?: string
  layer?: ComponentLayer
  elevation?: string
  className?: string
  style?: React.CSSProperties
  disabled?: boolean
} & LibrarySpecificProps

export function TableFooter({
  children,
  variant,
  layer = 'layer-0',
  elevation,
  className,
  style,
  disabled,
  mantine,
  material,
  carbon,
}: TableFooterProps) {
  const Component = useComponent('TableFooter')

  if (!Component) {
    return null
  }

  return (
    <Suspense fallback={<td />}>
      <Component
        variant={variant}
        layer={layer}
        elevation={elevation}
        className={className}
        style={style}
        disabled={disabled}
        mantine={mantine}
        material={material}
        carbon={carbon}
      >
        {children}
      </Component>
    </Suspense>
  )
}
