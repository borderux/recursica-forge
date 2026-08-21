/**
 * Mantine Avatar Adapter
 *
 * Not a 1:1 pass-through. Confirmed against @recursica/mantine-adapter's own Avatar source
 * (its `RecursicaAvatarProps` plus the underlying Mantine `AvatarProps`, with `variant` |
 * `size` | `color` | `radius` re-declared by Recursica):
 *
 *   - `fallback` maps onto `children` (JSX content), not a prop.
 *   - `sizeVariant` -> `size`: Forge's 'small' | 'default' | 'large' union is *exactly*
 *     `RecursicaAvatarProps['size']` — a clean rename, values line up 1:1.
 *   - `colorVariant` -> `variant` is NOT a clean rename, despite that being the initial
 *     assumption: Forge's colorVariant is a compound value (content type + style, e.g.
 *     'icon-ghost', 'text-solid', 'image' — see utils/getComponentColorVars.ts and
 *     adapters/Avatar.tsx, which already split it exactly this way for CSS var lookups),
 *     while the real `variant` is style-only ('solid' | 'outline' | 'ghost'). The real
 *     component (confirmed from the adapter's own source, not just its .d.ts) auto-detects
 *     content type from *which* of `src` / `icon` / `children` is actually populated — it
 *     doesn't take a content-type prop at all — so the two halves of colorVariant have two
 *     different real destinations: the style suffix resolves to `variant`, and the content
 *     prefix decides whether `fallback` is routed into `icon` (content type "icon") or
 *     `children` (content type "text"). Both are genuine reshapes, done as literal
 *     attributes below so each is independently type-checked.
 *   - `shape` has no real equivalent: the real Avatar Omits Mantine's own `radius`, so corner
 *     shape is token-only upstream. Dropped — an adapter gap, not an oversight.
 */

import { Avatar as MantineAvatar } from '@recursica/mantine-adapter'
import type { AvatarProps } from '../../common/Avatar'
import type { AssertWired } from '../../common/wiringCheck'

/** Style suffix of a compound colorVariant ('text-ghost', 'icon-solid', 'icon', 'image', ...)
 *  translated to the real Avatar's style-only `variant`. Mirrors the default-to-"solid"
 *  behavior in utils/getComponentColorVars.ts; 'image' has no real style equivalent. */
function resolveAvatarVariant(
    colorVariant: AvatarProps['colorVariant']
): 'solid' | 'outline' | 'ghost' | undefined {
    if (!colorVariant || colorVariant === 'image') return undefined
    return colorVariant.endsWith('-ghost') ? 'ghost' : 'solid'
}

export default function Avatar({
    src,
    alt,
    fallback,
    colorVariant,
    sizeVariant,
    mantine,
}: AvatarProps) {
    const isIconContent = colorVariant?.startsWith('icon') ?? false
    return (
        <MantineAvatar
            src={src}
            alt={alt}
            icon={isIconContent ? fallback : undefined}
            children={isIconContent ? undefined : fallback}
            variant={resolveAvatarVariant(colorVariant)}
            size={sizeVariant}
            {...mantine}
        />
    )
}

// Compile-time only — fails the build the moment AvatarProps declares a prop with no real,
// type-compatible home on the real Avatar (directly, or via the rename below). `fallback` and
// `colorVariant` are excluded: both are explicitly translated above (see header comment for
// why `colorVariant` is a reshape, not a straight rename), so checking their untranslated
// shape here would be a false positive. `shape` is excluded with no rename: confirmed no real
// equivalent exists (Mantine's `radius` is Omitted upstream).
type _Wiring = AssertWired<
    AvatarProps,
    typeof MantineAvatar,
    'layer' | 'elevation' | 'mantine' | 'material' | 'carbon' | 'className' | 'style' | 'fallback' | 'colorVariant' | 'shape',
    { sizeVariant: 'size' }
>
const _wiringCheck: _Wiring = true
