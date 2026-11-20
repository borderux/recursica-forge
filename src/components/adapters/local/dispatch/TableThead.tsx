/**
 * TableThead Component Adapter (local)
 *
 * Renders the local adapter's TableThead implementation.
 */

import { Suspense } from 'react'
import { useComponent } from '../../../hooks/useComponent'
import type { TableTheadProps } from '../../common/TableThead'

export type { TableTheadProps } from '../../common/TableThead'

export function TableThead({
  children,
  layer = 'layer-0',
  className,
  style,
  mantine,
}: TableTheadProps) {
  const Component = useComponent('TableThead')

  return (
    <Suspense fallback={null}>
      <Component
        layer={layer}
        className={className}
        style={style}
        mantine={mantine}
      >
        {children}
      </Component>
    </Suspense>
  )
}
