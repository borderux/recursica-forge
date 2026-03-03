/**
 * Pagination Component Adapter
 * 
 * Unified Pagination component that renders the appropriate library implementation
 * based on the current UI kit selection.
 * 
 * Wraps the Mantine Pagination component with Recursica's CSS variable theming.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'

export type PaginationProps = {
  /** Total number of pages */
  total: number
  /** Current active page (controlled) */
  value?: number
  /** Default active page (uncontrolled) */
  defaultValue?: number
  /** Called when page changes */
  onChange?: (page: number) => void
  /** Number of siblings on each side of active page */
  siblings?: number
  /** Number of items at start/end boundaries */
  boundaries?: number
  /** Show first/last page buttons */
  withEdges?: boolean
  /** Show page number buttons */
  withPages?: boolean
  /** Whether the pagination is disabled */
  disabled?: boolean
  /** Layer for color theming */
  layer?: ComponentLayer
  /** Additional CSS class */
  className?: string
  /** Additional inline styles */
  style?: React.CSSProperties
} & LibrarySpecificProps

export function Pagination({
  total,
  value,
  defaultValue,
  onChange,
  siblings = 1,
  boundaries = 1,
  withEdges = false,
  withPages = true,
  disabled = false,
  layer = 'layer-0',
  className,
  style,
  mantine,
  material,
  carbon,
}: PaginationProps) {
  const Component = useComponent('Pagination')

  if (!Component) {
    return null
  }

  return (
    <Suspense fallback={<span />}>
      <Component
        total={total}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        siblings={siblings}
        boundaries={boundaries}
        withEdges={withEdges}
        withPages={withPages}
        disabled={disabled}
        layer={layer}
        className={className}
        style={style}
        mantine={mantine}
        material={material}
        carbon={carbon}
      />
    </Suspense>
  )
}
