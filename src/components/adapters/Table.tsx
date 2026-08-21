/**
 * Table Component Adapter
 * 
 * Unified Table component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { TableProps } from './common/Table'

// Re-exported so existing `import type { TableProps } from '.../adapters/Table'`
// call sites keep working — the types now live in common/Table.ts.
export type { TableProps } from './common/Table'

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
