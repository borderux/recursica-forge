/**
 * Badge Component Adapter
 * 
 * Unified Badge component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { BadgeProps } from './common/Badge'

// Re-exported so existing `import type { BadgeProps } from '.../adapters/Badge'`
// call sites keep working — the types now live in common/Badge.ts.
export type { BadgeProps } from './common/Badge'

export function Badge({
  children,
  variant = 'primary-color',
  size,
  layer = 'layer-0',
  elevation,
  className,
  style,
  mantine,
  material,
  carbon,
}: BadgeProps) {
  const Component = useComponent('Badge')

  return (
    <Suspense fallback={<span />}>
      <Component
        variant={variant}
        size={size}
        layer={layer}
        elevation={elevation}
        className={className}
        style={style}
        mantine={mantine}
        material={material}
        carbon={carbon}
      >
        {children}
      </Component>
    </Suspense>
  )
}

