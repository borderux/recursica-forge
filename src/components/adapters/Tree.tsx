/**
 * Tree Component Adapter
 * 
 * Unified Tree component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { TreeProps } from './common/Tree'

// Re-exported so existing `import type { TreeProps } from '.../adapters/Tree'`
// call sites keep working — the types now live in common/Tree.ts.
export type { TreeProps } from './common/Tree'

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
  forceHover,
  mantine,
  material,
  carbon,
}: TreeProps) {
  const Component = useComponent('Tree')

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
        forceHover={forceHover}
        mantine={mantine}
        material={material}
        carbon={carbon}
      >
        {children}
      </Component>
    </Suspense>
  )
}
