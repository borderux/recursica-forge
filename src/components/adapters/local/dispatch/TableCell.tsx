/**
 * TableCell Component Adapter
 * 
 * Unified TableCell component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense } from 'react'
import { useComponent } from '../../../hooks/useComponent'
import type { ComponentLayer, LibrarySpecificProps } from '../../../registry/types'

export type TableCellProps = {
  children?: React.ReactNode
  variant?: string
  layer?: ComponentLayer
  elevation?: string
  className?: string
  style?: React.CSSProperties
  isHeader?: boolean
  disabled?: boolean
  colSpan?: number
} & LibrarySpecificProps

export function TableCell({
  children,
  variant,
  layer = 'layer-0',
  elevation,
  className,
  style,
  isHeader,
  disabled,
  colSpan,
  mantine,
}: TableCellProps) {
  const Component = useComponent('TableCell')

  if (!Component) {
    return null
  }

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
        colSpan={colSpan}
        mantine={mantine}
      >
        {children}
      </Component>
    </Suspense>
  )
}
