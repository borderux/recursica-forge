/**
 * TableTfoot Component Adapter (local)
 *
 * Renders the local adapter's TableTfoot implementation.
 */

import { Suspense } from 'react'
import { useComponent } from '../../../hooks/useComponent'
import type { TableTfootProps } from '../../common/TableTfoot'

export type { TableTfootProps } from '../../common/TableTfoot'

export function TableTfoot({
  children,
  layer = 'layer-0',
  className,
  style,
  mantine,
}: TableTfootProps) {
  const Component = useComponent('TableTfoot')

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
