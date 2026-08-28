/**
 * Mantine Chip Adapter
 *
 * Not a 1:1 pass-through: confirmed against @mantine/core's own ChipProps (the real
 * component's base, `Omit<ChipProps, "variant" | "size" | "color" | "radius"> &
 * RecursicaChipProps`) plus RecursicaChipProps itself.
 *
 *   - `onDelete` (2026-08, upstreamed — see `docs/MANTINE_ADAPTER_UPSTREAM_REQUESTS.md` #2):
 *     the real adapter's prop is now also named `onDelete` (was `onRemove`), matching both
 *     Forge's own name and raw `@mui/material`'s real `Chip` prop — a direct pass-through, no
 *     rename needed anymore.
 *   - `deletable` has no real equivalent: the real Chip shows its remove icon automatically
 *     whenever an `onDelete` handler is supplied, rather than gating on a separate boolean —
 *     so passing `onDelete` already gets the same effect, and `deletable` itself is dropped.
 *   - `checked`/`error` (2026-08, fixed — see the Forge Chip bug thread): the real
 *     `RecursicaChipProps` has both (`checked` "acts as a checkbox", `error` "enables the
 *     error state styling") and its own `FileUpload` exercises `checked` internally, so these
 *     are live, working native props — a direct same-name pass-through.
 *   - `variant`/`size` are still explicitly omitted with no replacement. `adapters/Chip.tsx`
 *     resolves `checked`/`error` into a `variant` string for Material/Carbon's CSS-var-keyed
 *     styling (no native selected/error concept there to match), but the real Mantine Chip has
 *     no upstream hook for arbitrary *custom* variant names from the token editor — only the
 *     built-in checked/error pair. Dropped here; a real adapter gap for the custom-name case,
 *     not an oversight.
 */

import React from 'react'
import { Chip as MantineChip } from '@recursica/mantine-adapter'
import type { ChipProps } from '../../common/Chip'
import type { AssertWired } from '../../common/wiringCheck'

export default React.forwardRef<any, ChipProps>(function Chip({
    children,
    checked,
    error,
    onClick,
    onDelete,
    icon,
    mantine,
}, ref) {
    return (
        <MantineChip
            checked={checked}
            error={error}
            onClick={onClick}
            onDelete={onDelete}
            icon={icon}
            {...mantine}
            ref={ref}
        >
            {children}
        </MantineChip>
    )
})

// Compile-time only — fails the build the moment ChipProps declares a prop with no real,
// type-compatible home on the real Chip. `variant`/`size`/`deletable` are excluded with no
// rename: confirmed no real equivalent exists for any of the three (see header comment).
// `onDelete`/`checked`/`error` are no longer excluded — they're direct same-name pass-throughs now.
type _Wiring = AssertWired<
    ChipProps,
    typeof MantineChip,
    'layer' | 'elevation' | 'mantine' | 'material' | 'carbon' | 'className' | 'style' | 'variant' | 'size' | 'deletable'
>
const _wiringCheck: _Wiring = true
