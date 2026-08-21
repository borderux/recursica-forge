/**
 * Mantine Loader Adapter
 *
 * Confirmed clean: Forge's `size` union ('small' | 'default' | 'large') is exactly
 * `RecursicaSize`, which the real Loader's own `size` prop accepts alongside its native
 * 'sm' | 'md' | 'lg' — no translation needed, just a literal attribute so TypeScript
 * actually checks it (a spread of a pre-typed object wouldn't).
 */

import { Loader as MantineLoader } from '@recursica/mantine-adapter'
import type { LoaderProps } from '../../common/Loader'
import type { AssertWired } from '../../common/wiringCheck'

export default function Loader({
    size,
    mantine,
}: LoaderProps) {
    return (
        <MantineLoader
            size={size}
            {...mantine}
        />
    )
}

// Compile-time only — fails the build the moment LoaderProps declares a prop with no real,
// type-compatible home on the real Loader.
type _Wiring = AssertWired<
    LoaderProps,
    typeof MantineLoader,
    'mantine' | 'material' | 'carbon' | 'className' | 'style'
>
const _wiringCheck: _Wiring = true
