/**
 * Chip — common types
 *
 * Single source of truth for the Chip prop vocabulary, shared by the dispatcher
 * (`adapters/Chip.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/Chip`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

export type ChipProps = {
  children?: React.ReactNode
  /**
   * Selected/checked state — the canonical signal, matching the real `@mantine/core`-adapter
   * Chip's own native `checked` prop (it "acts as a checkbox"). Combines with `error` to select
   * one of the four built-in selection-states variants (unselected/selected/error/error-selected).
   */
  checked?: boolean
  /**
   * Promotes the chip to its error colour set (paired with `checked` for error-selected). Matches
   * the real `@mantine/core`-adapter Chip's own native `error` prop.
   */
  error?: boolean
  /**
   * Advanced escape hatch: an explicit selection-states variant name, for a custom variant
   * created in the token editor (beyond the four built-ins). When omitted, the dispatcher derives
   * the built-in variant name from `checked`/`error` instead. Material/Carbon key their CSS-var
   * lookups off whichever name results; Mantine has no upstream hook for custom names, so a
   * custom `variant` here falls back to the real Chip's default (unchecked) styling there.
   */
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
