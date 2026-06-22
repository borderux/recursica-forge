/**
 * Tree Component Adapter
 * 
 * Unified Tree component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'

export type TreeProps = {
  children?: React.ReactNode
  variant?: string
  layer?: ComponentLayer
  elevation?: string
  className?: string
  style?: React.CSSProperties
  data?: any[]
  selected?: string[]
  onSelect?: (selected: string[]) => void
} & LibrarySpecificProps

export function Tree({
  children,
  variant,
  layer = 'layer-0',
  elevation,
  className,
  style,
  data,
  selected,
  onSelect,
  mantine,
  material,
  carbon,
}: TreeProps) {
  const Component = useComponent('Tree')

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
        selected={selected}
        onSelect={onSelect}
        mantine={mantine}
        material={material}
        carbon={carbon}
      >
        {children}
      </Component>
    </Suspense>
  )
}
