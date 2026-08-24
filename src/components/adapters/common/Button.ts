/**
 * Button — common types
 *
 * Single source of truth for the Button prop vocabulary, shared by the dispatcher
 * (`adapters/Button.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/Button`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

export type ButtonProps = {
  children?: React.ReactNode
  /**
   * `solid`/`outline`/`text` are Recursica's own official names — deliberately independent of
   * whatever the underlying kit calls its own variant scale (raw Mantine:
   * `filled`/`light`/`outline`/...; raw MUI: `contained`/`outlined`/`text`). Each per-kit
   * wrapper maps these onto the real component's own values, but Forge's names are the
   * permanent, canonical vocabulary and aren't expected to change to match any kit.
   */
  variant?: 'solid' | 'outline' | 'text'
  size?: 'default' | 'small'
  layer?: ComponentLayer
  elevation?: string // e.g., "elevation-0", "elevation-1", etc.
  disabled?: boolean
  onClick?: (e: React.MouseEvent) => void
  type?: 'button' | 'submit' | 'reset'
  className?: string
  style?: React.CSSProperties
  icon?: React.ReactNode
  title?: string
} & LibrarySpecificProps
