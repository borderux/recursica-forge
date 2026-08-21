/**
 * TableFooter Component Adapter
 * 
 * Unified TableFooter component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { TableFooterProps } from './common/TableFooter'

// Re-exported so existing `import type { TableFooterProps } from '.../adapters/TableFooter'`
// call sites keep working — the types now live in common/TableFooter.ts.
export type { TableFooterProps } from './common/TableFooter'

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
