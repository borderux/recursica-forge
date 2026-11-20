/**
 * TableTbody Component Adapter (local)
 *
 * Renders the local adapter's TableTbody implementation.
 */

import { Suspense } from 'react'
import { useComponent } from '../../../hooks/useComponent'
import type { TableTbodyProps } from '../../common/TableTbody'

export type { TableTbodyProps } from '../../common/TableTbody'

export function TableTbody({
  children,
  layer = 'layer-0',
  className,
  style,
  mantine,
}: TableTbodyProps) {
  const Component = useComponent('TableTbody')

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
