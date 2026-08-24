/**
 * Chip — common types
 *
 * Single source of truth for the Chip prop vocabulary, shared by the dispatcher
 * (`adapters/Chip.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/Chip`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

export type ChipProps = {
  children?: React.ReactNode
  // The four legacy names, plus any custom selection-state variant created in the editor.
  variant?: 'unselected' | 'selected' | 'error' | 'error-selected' | (string & {})
  size?: 'default' | 'small'
  layer?: ComponentLayer
  elevation?: string // e.g., "elevation-0", "elevation-1", etc.
  onClick?: (e: React.MouseEvent) => void
  /**
   * Named `onDelete` deliberately: it already matches raw `@mui/material`'s real `Chip` prop
   * of the same name (raw `@mantine/core`'s `Chip` has no delete concept to weigh in with —
   * it's toggle-only). The real `@recursica/mantine-adapter` calls its equivalent `onRemove`;
   * tracked as an upstream ask, see `docs/MANTINE_ADAPTER_UPSTREAM_REQUESTS.md`.
   */
  onDelete?: (e: React.MouseEvent) => void
  deletable?: boolean
  className?: string
  style?: React.CSSProperties
  icon?: React.ReactNode
} & LibrarySpecificProps
