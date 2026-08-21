/**
 * Pagination Component Adapter
 * 
 * Unified Pagination component that renders the appropriate library implementation
 * based on the current UI kit selection.
 * 
 * Wraps the Mantine Pagination component with Recursica's CSS variable theming.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { PaginationProps } from './common/Pagination'

// Re-exported so existing `import type { PaginationProps } from '.../adapters/Pagination'`
// call sites keep working — the types now live in common/Pagination.ts.
export type { PaginationProps } from './common/Pagination'

export function Pagination({
  total,
  value,
  defaultValue,
  onChange,
  siblings = 1,
  boundaries = 1,
  withEdges = false,
  withPages = true,
  disabled = false,
  layer = 'layer-0',
  className,
  style,
  mantine,
  material,
  carbon,
}: PaginationProps) {
  const Component = useComponent('Pagination')

  return (
    <Suspense fallback={<span />}>
      <Component
        total={total}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        siblings={siblings}
        boundaries={boundaries}
        withEdges={withEdges}
        withPages={withPages}
        disabled={disabled}
        layer={layer}
        className={className}
        style={style}
        mantine={mantine}
        material={material}
        carbon={carbon}
      />
    </Suspense>
  )
}
