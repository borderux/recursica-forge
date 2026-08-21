/**
 * TableCell Component Adapter
 * 
 * Unified TableCell component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { TableCellProps } from './common/TableCell'

// Re-exported so existing `import type { TableCellProps } from '.../adapters/TableCell'`
// call sites keep working — the types now live in common/TableCell.ts.
export type { TableCellProps } from './common/TableCell'

export function TableCell({
  children,
  variant,
  layer = 'layer-0',
  elevation,
  className,
  style,
  isHeader,
  disabled,
  mantine,
  material,
  carbon,
}: TableCellProps) {
  const Component = useComponent('TableCell')

  return (
    <Suspense fallback={isHeader ? <th /> : <td />}>
      <Component
        variant={variant}
        layer={layer}
        elevation={elevation}
        className={className}
        style={style}
        isHeader={isHeader}
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
