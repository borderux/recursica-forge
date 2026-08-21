/**
 * TableHeader Component Adapter
 * 
 * Unified TableHeader component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { TableHeaderProps } from './common/TableHeader'

// Re-exported so existing `import type { TableHeaderProps } from '.../adapters/TableHeader'`
// call sites keep working — the types now live in common/TableHeader.ts.
export type { TableHeaderProps } from './common/TableHeader'

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
