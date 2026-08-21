/**
 * Loader — common types
 *
 * Single source of truth for the Loader prop vocabulary, shared by the dispatcher
 * (`adapters/Loader.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/Loader`).
 */

import type { LibrarySpecificProps } from '../../registry/types'

export type LoaderProps = {
    size?: 'small' | 'default' | 'large'
    className?: string
    style?: React.CSSProperties
} & LibrarySpecificProps
