/**
 * Panel — common types
 *
 * Single source of truth for the Panel prop vocabulary, shared by the dispatcher
 * (`adapters/Panel.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/Panel`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

export type PanelPosition = 'left' | 'right'

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
