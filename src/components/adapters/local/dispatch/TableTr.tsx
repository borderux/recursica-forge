/**
 * TableTr Component Adapter (local)
 *
 * Renders the local adapter's TableTr implementation.
 */

import { Suspense } from 'react'
import { useComponent } from '../../../hooks/useComponent'
import type { TableTrProps } from '../../common/TableTr'

export type { TableTrProps } from '../../common/TableTr'

export function TableTr({
  children,
  selected,
  disabled,
  onClick,
  layer = 'layer-0',
  className,
  style,
  mantine,
}: TableTrProps) {
  const Component = useComponent('TableTr')

  return (
    <Suspense fallback={null}>
      <Component
        selected={selected}
        disabled={disabled}
        onClick={onClick}
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
