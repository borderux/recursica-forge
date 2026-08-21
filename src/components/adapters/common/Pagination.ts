/**
 * Pagination — common types
 *
 * Single source of truth for the Pagination prop vocabulary, shared by the dispatcher
 * (`adapters/Pagination.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/Pagination`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

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
