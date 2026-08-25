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
 *   - `variant`/`size` are explicitly omitted from the real type with no replacement. Forge
 *     drives Chip's selected/error styling purely from CSS vars keyed by `variant` (see
 *     adapters/Chip.tsx's `buildVariantColorCssVar` calls) — a token-driven concept the real
 *     adapter has no upstream hook for. Dropped here; a real adapter gap, not an oversight.
 */

import React from 'react'
import { Chip as MantineChip } from '@recursica/mantine-adapter'
import type { ChipProps } from '../../common/Chip'
import type { AssertWired } from '../../common/wiringCheck'

export default React.forwardRef<any, ChipProps>(function Chip({
    children,
    onClick,
    onDelete,
    icon,
    mantine,
}, ref) {
    return (
        <MantineChip
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
// `onDelete` is no longer excluded — it's a direct same-name pass-through now (see header).
type _Wiring = AssertWired<
    ChipProps,
    typeof MantineChip,
    'layer' | 'elevation' | 'mantine' | 'material' | 'carbon' | 'className' | 'style' | 'variant' | 'size' | 'deletable'
>
const _wiringCheck: _Wiring = true
