/**
 * Switch — common types
 *
 * Single source of truth for the Switch prop vocabulary, shared by the dispatcher
 * (`adapters/Switch.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/Switch`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

/** Public prop interface. What consumer/demo code uses — identical across every UI kit. */
export type SwitchProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  layer?: ComponentLayer
  /**
   * Removed (2026-08): Forge has never supported per-instance color/size variants for Switch —
   * both raw `@mantine/core` and raw `@mui/material` have real `color`/`size` props natively,
   * but Forge's own design intentionally doesn't expose them; Switch color/size is entirely
   * token-driven. Declared here previously as `colorVariant`/`sizeVariant`, but never wired to
   * anything on any kit — removed rather than left as dead API surface.
   */
  elevation?: string // e.g., "elevation-0", "elevation-1", etc.
  className?: string
  style?: React.CSSProperties
} & LibrarySpecificProps
