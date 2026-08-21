/**
 * Mantine Chip Adapter
 *
 * Not a 1:1 pass-through: confirmed against @mantine/core's own ChipProps (the real
 * component's base, `Omit<ChipProps, "variant" | "size" | "color" | "radius"> &
 * RecursicaChipProps`) plus RecursicaChipProps itself.
 *
 *   - `onDelete` maps to the real `onRemove` — both are `(e: MouseEvent<...>) => void`, just
 *     over a narrower target element (`HTMLSpanElement` on the remove icon vs. Forge's
 *     generic `MouseEvent`), which is a compatible (wider-accepting) callback shape.
 *   - `deletable` has no real equivalent: the real Chip shows its remove icon automatically
 *     whenever an `onRemove` handler is supplied, rather than gating on a separate boolean —
 *     so passing `onDelete` already gets the same effect, and `deletable` itself is dropped.
 *   - `variant`/`size` are explicitly omitted from the real type with no replacement. Forge
 *     drives Chip's selected/error styling purely from CSS vars keyed by `variant` (see
 *     adapters/Chip.tsx's `buildVariantColorCssVar` calls) — a token-driven concept the real
 *     adapter has no upstream hook for. Dropped here; a real adapter gap, not an oversight.
 */

import { Chip as MantineChip } from '@recursica/mantine-adapter'
import type { ChipProps } from '../../common/Chip'
import type { AssertWired } from '../../common/wiringCheck'

export default function Chip({
    children,
    onClick,
    onDelete,
    icon,
    mantine,
}: ChipProps) {
    return (
        <MantineChip
            onClick={onClick}
            onRemove={onDelete}
            icon={icon}
            {...mantine}
        >
            {children}
        </MantineChip>
    )
}

// Compile-time only — fails the build the moment ChipProps declares a prop with no real,
// type-compatible home on the real Chip. `onDelete` is excluded: it's explicitly translated
// above (renamed to `onRemove`), so checking its untranslated shape here would be a false
// positive. `variant`/`size`/`deletable` are excluded with no rename: confirmed no real
// equivalent exists for any of the three (see header comment).
type _Wiring = AssertWired<
    ChipProps,
    typeof MantineChip,
    'layer' | 'elevation' | 'mantine' | 'material' | 'carbon' | 'className' | 'style' | 'onDelete' | 'variant' | 'size' | 'deletable'
>
const _wiringCheck: _Wiring = true
