/**
 * Label — common types
 *
 * Single source of truth for the Label prop vocabulary, shared by the dispatcher
 * (`adapters/Label.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/Label`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

export type LabelProps = {
  children?: React.ReactNode
  htmlFor?: string
  variant?: 'default' | 'required' | 'optional'
  /**
   * Raw `@mantine/core`'s and raw `@mui/material`'s own `InputLabel` both natively use
   * unprefixed `size` too — the real `@recursica/mantine-adapter` renames it to `labelSize`
   * internally, but that's intentional on Forge's side: every field component's own props
   * flow through as `labelSize` already, so keeping the adapter's name as-is (rather than
   * asking upstream to rename it) avoids a mismatch at the point where props actually get
   * passed down.
   */
  size?: 'default' | 'small'
  /**
   * Narrowed (2026-08) to document the two values the real adapter actually
   * recognizes ('stacked'/'side-by-side' — anything else silently falls back to
   * 'stacked'), while still allowing custom strings through for other CSS-variable
   * lookup uses elsewhere in the app.
   */
  layout?: 'stacked' | 'side-by-side' | (string & {})
  align?: 'left' | 'right'
  layer?: ComponentLayer
  className?: string
  style?: React.CSSProperties
  required?: boolean
  id?: string
  editIcon?: React.ReactNode | boolean
  editIconGap?: string | number
  onEditIconClick?: (e: React.MouseEvent) => void
  editIconTitle?: string
} & LibrarySpecificProps
