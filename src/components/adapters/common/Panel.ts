/**
 * Panel — common types
 *
 * Single source of truth for the Panel prop vocabulary, shared by the dispatcher
 * (`adapters/Panel.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/Panel`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

export type PanelPosition = 'left' | 'right'

/**
 * `position` matches raw `@mantine/core`'s own `Drawer` prop name exactly (`Panel` wraps
 * `Drawer`) — it's `@recursica/mantine-adapter` that renamed it to `placement` internally, not
 * Forge that diverged. An upstream ask to accept `position` too was declined (2026-08,
 * permanent — see `docs/MANTINE_ADAPTER_UPSTREAM_REQUESTS.md` #1); Forge's own name stays
 * `position` regardless, translated to `placement` in the Mantine wrapper.
 */

/** Public prop interface. What consumer/demo code uses — identical across every UI kit. */
export type PanelProps = {
    children?: React.ReactNode
    title?: React.ReactNode
    footer?: React.ReactNode
    position?: PanelPosition
    isOpen?: boolean
    onClose?: () => void
    layer?: ComponentLayer
    elevation?: string
    className?: string
    style?: React.CSSProperties
    /** When true, renders as a fixed overlay panel (full viewport height) */
    overlay?: boolean
    /** Custom width for the panel (e.g., '320px') */
    width?: string
    /** z-index for overlay panels */
    zIndex?: number
} & LibrarySpecificProps

/**
 * What a per-library wrapper receives. Identical to `PanelProps` today — Panel has no shared
 * interaction state to normalize; visibility is driven directly by `isOpen`/`onClose`.
 */
export type PanelAdapterProps = PanelProps
