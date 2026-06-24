/**
 * TableHeader Component Adapter
 * 
 * Unified TableHeader component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'

export type TableHeaderProps = {
  children?: React.ReactNode
  variant?: string
  layer?: ComponentLayer
  elevation?: string
  className?: string
  style?: React.CSSProperties
  disabled?: boolean
  sorted?: 'asc' | 'desc' | null
  onClick?: React.MouseEventHandler<HTMLTableCellElement>
} & LibrarySpecificProps

export function TableHeader({
  children,
  variant,
  layer = 'layer-0',
  elevation,
  className,
  style,
  disabled,
  sorted,
  onClick,
  mantine,
  material,
  carbon,
}: TableHeaderProps) {
  const Component = useComponent('TableHeader')

  if (!Component) {
    return null
  }

  return (
    <Suspense fallback={<th />}>
      <Component
        variant={variant}
        layer={layer}
        elevation={elevation}
        className={className}
        style={style}
        disabled={disabled}
        sorted={sorted}
        onClick={onClick}
        mantine={mantine}
        material={material}
        carbon={carbon}
      >
        {children}
      </Component>
    </Suspense>
  )
}
