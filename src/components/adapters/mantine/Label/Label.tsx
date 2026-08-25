/**
 * Mantine Label Adapter
 *
 * Label is the one field-ish component whose OWN prop names are unprefixed (`size`, `align`)
 * while the shared field vocabulary (helpText/labelAlign/labelSize/...) assumes prefixed
 * names — which is exactly why folding Label into the old FIELD_CONTRACT table never did
 * anything for it. Mapped directly here instead:
 *
 *   - `size` -> the real `labelSize` prop (confirmed on RecursicaLabelProps).
 *   - `align` -> the real `labelAlignment` prop.
 *   - `variant` has no real prop of its own, but its two non-default values ARE derivable:
 *     the real API expresses "required" and "optional" through `required` +
 *     `labelOptionalText` rather than a variant string, so `variant === 'required'` folds
 *     into `required` (alongside Forge's own separate `required` prop) and
 *     `variant === 'optional'` folds into `labelOptionalText`, instead of dropping the prop
 *     outright.
 *   - `layout` has no real destination: Label is not a form control (no FormControlWrapper),
 *     so it has nothing to do with `formLayout`. Moved in here from
 *     adapterPropContract.ts's `PROP_CONTRACT['Label']` entry.
 *   - `editIcon`/`editIconTitle`/`onEditIconClick` (2026-08, corrected — this wrapper
 *     previously dropped `editIcon`/`editIconTitle` entirely on the claim "no real slot, same
 *     rationale as TextField's," which turned out to be wrong: the real Label (and every real
 *     field component built on the same `RecursicaFormControlWrapperProps`) has a slot for
 *     exactly this, `labelActionArea`. Translated via the shared `resolveLabelActionArea`
 *     helper (`../labelActionArea.tsx`) — see that file for the full two-case explanation
 *     (boolean shorthand vs. a real icon node) and why it's centralized there. This was the
 *     root cause of a real, user-visible bug: `BrandDimensionSliderInline`'s globe-icon-to-
 *     detach-a-global-token control (rendered via a `<Label editIcon={...}>` passed as a
 *     Slider's `label`) silently had no visible icon at all on the Mantine kit, despite being
 *     correctly computed and forwarded from `useGlobalRefControl`.
 *   - `id` IS a real prop (via `ElementProps<'label'>`) — passed through here even though the
 *     Label dispatcher (`adapters/Label.tsx`) doesn't currently destructure/forward it at all.
 *     That's a dispatcher-level bug (not this wrapper's to fix): today `id` is always
 *     `undefined` by the time it reaches here, but the wrapper is ready for it regardless.
 */

import React from 'react'
import { Label as MantineLabel } from '@recursica/mantine-adapter'
import { resolveLabelActionArea } from '../labelActionArea'
import type { LabelProps } from '../../common/Label'
import type { AssertWired } from '../../common/wiringCheck'

export default React.forwardRef<any, LabelProps>(function Label({
    children,
    htmlFor,
    variant,
    size,
    align,
    layer,
    required,
    id,
    editIcon,
    editIconTitle,
    onEditIconClick,
    mantine,
}, ref) {
    const { labelActionArea, labelWithEditIcon, onLabelEditClick } =
        resolveLabelActionArea(editIcon, editIconTitle, onEditIconClick, layer)

    return (
        <MantineLabel
            htmlFor={htmlFor}
            labelSize={size}
            labelAlignment={align}
            required={required || variant === 'required'}
            labelOptionalText={variant === 'optional' ? true : undefined}
            id={id}
            labelActionArea={labelActionArea}
            labelWithEditIcon={labelWithEditIcon}
            onLabelEditClick={onLabelEditClick}
            {...mantine}
            ref={ref}
        >
            {children}
        </MantineLabel>
    )
})

// Compile-time only — fails the build the moment LabelProps declares a prop with no real,
// type-compatible home on the real Label (directly, or via the renames below). `variant` is
// excluded: it's explicitly folded into `required`/`labelOptionalText` above, not renamed, so
// checking its untranslated shape here would be a false positive. `layout` is excluded: Label
// isn't a form control, no real `formLayout`-equivalent concept applies to it (see header).
// `editIcon`/`editIconTitle`/`onEditIconClick` are excluded: they're a real reshape into
// `labelActionArea`/`labelWithEditIcon`/`onLabelEditClick` above (a genuine translation, not a
// straight rename), so the literal attributes above are what actually get checked.
// `editIconGap` has no real equivalent — the real `labelActionArea` slot has no configurable
// gap of its own — dropped.
type _Wiring = AssertWired<
    LabelProps,
    typeof MantineLabel,
    | 'layer'
    | 'mantine'
    | 'material'
    | 'carbon'
    | 'className'
    | 'style'
    | 'variant'
    | 'layout'
    | 'editIcon'
    | 'editIconGap'
    | 'editIconTitle'
    | 'onEditIconClick',
    { size: 'labelSize'; align: 'labelAlignment' }
>
const _wiringCheck: _Wiring = true
