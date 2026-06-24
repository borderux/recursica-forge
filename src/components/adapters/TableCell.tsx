/**
 * TableCell Component Adapter
 * 
 * Unified TableCell component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'

export type TableCellProps = {
  children?: React.ReactNode
  variant?: string
  layer?: ComponentLayer
  elevation?: string
  className?: string
  style?: React.CSSProperties
  isHeader?: boolean
  disabled?: boolean
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
  mantine,
  material,
  carbon,
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
        mantine={mantine}
        material={material}
        carbon={carbon}
      >
        {children}
      </Component>
    </Suspense>
  )
}
