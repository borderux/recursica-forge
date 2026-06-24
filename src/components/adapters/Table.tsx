/**
 * Table Component Adapter
 * 
 * Unified Table component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'

export type TableProps = {
  children?: React.ReactNode
  variant?: string
  layer?: ComponentLayer
  elevation?: string
  className?: string
  style?: React.CSSProperties
  data?: any
} & LibrarySpecificProps

export function Table({
  children,
  variant,
  layer = 'layer-0',
  elevation,
  className,
  style,
  data,
  mantine,
  material,
  carbon,
}: TableProps) {
  const Component = useComponent('Table')

  if (!Component) {
    return null
  }

  return (
    <Suspense fallback={<div />}>
      <Component
        variant={variant}
        layer={layer}
        elevation={elevation}
        className={className}
        style={style}
        data={data}
        mantine={mantine}
        material={material}
        carbon={carbon}
      >
        {children}
      </Component>
    </Suspense>
  )
}
