/**
 * Loader — common types
 *
 * Single source of truth for the Loader prop vocabulary, shared by the dispatcher
 * (`adapters/Loader.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/Loader`).
 */

import type { LibrarySpecificProps } from '../../registry/types'

export type LoaderProps = {
    /**
     * Confirmed intentional: the real adapter accepts this but never forwards a `size` prop
     * to the real Mantine Loader at all — sizing is entirely CSS/`data-size`-attribute driven,
     * consistent with the token-driven approach used elsewhere in the design system.
     */
    size?: 'small' | 'default' | 'large'
    className?: string
    style?: React.CSSProperties
} & LibrarySpecificProps
