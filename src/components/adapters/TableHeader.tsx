/**
 * TableHeader Component Adapter
 * 
 * Unified TableHeader component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { TableHeaderProps } from './common/TableHeader'
import { isLocalAdapter } from '../registry/activeAdapter'
import { TableHeader as LocalTableHeader } from './local/dispatch/TableHeader'

// Re-exported so existing `import type { TableHeaderProps } from '.../adapters/TableHeader'`
// call sites keep working — the types now live in common/TableHeader.ts.
export type { TableHeaderProps } from './common/TableHeader'

function SharedTableHeader({
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
      >
        {children}
      </Component>
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const TableHeader = (isLocalAdapter ? LocalTableHeader : SharedTableHeader) as typeof SharedTableHeader
