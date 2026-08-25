/**
 * Mantine ReadOnlyField Adapter
 *
 * Mostly a clean rename onto the shared field vocabulary (confirmed against
 * RecursicaReadOnlyFieldProps: `formLayout`, `labelAlignment`, `labelSize`,
 * `labelOptionalText` all exist for real).
 *
 *   - `editIcon` (2026-08, corrected — previously dropped on the incorrect claim "no slot for
 *     a caller-supplied icon node short of replacing the whole label action area," when
 *     replacing the whole label action area is exactly the intended mechanism): translated via
 *     the shared `resolveLabelActionArea` helper (`../labelActionArea.tsx`) into the real
 *     `labelActionArea`/`labelWithEditIcon` — see that file. Note `ReadOnlyFieldProps` (unlike
 *     TextField's/Label's) has no `editIconTitle`/`onEditIconClick` of its own — a narrower,
 *     but genuine, gap in Forge's own common type for this component, not addressed here — so
 *     those two are passed as `undefined` to the helper; only the plain-icon and
 *     boolean-shorthand cases are reachable through ReadOnlyField today.
 *   - `editIconGap` has no real destination either, and the ReadOnlyField dispatcher
 *     (`adapters/ReadOnlyField.tsx`) never even forwards it to this component in the first
 *     place, so it's dead on both sides.
 */

import React from 'react'
import { ReadOnlyField as MantineReadOnlyField } from '@recursica/mantine-adapter'
import { resolveLabelActionArea } from '../labelActionArea'
import type { ReadOnlyFieldProps } from '../../common/ReadOnlyField'
import type { AssertWired } from '../../common/wiringCheck'

export default React.forwardRef<any, ReadOnlyFieldProps>(function ReadOnlyField({
    value,
    label,
    layout,
    layer,
    required,
    optional,
    labelAlign,
    labelSize,
    id,
    editIcon,
    mantine,
}, ref) {
    const { labelActionArea, labelWithEditIcon, onLabelEditClick } =
        resolveLabelActionArea(editIcon, undefined, undefined, layer)

    return (
        <MantineReadOnlyField
            value={value}
            label={label}
            formLayout={layout === 'side-by-side' ? 'side-by-side' : 'stacked'}
            required={required}
            labelOptionalText={optional}
            labelAlignment={labelAlign}
            labelSize={labelSize}
            id={id}
            labelActionArea={labelActionArea}
            labelWithEditIcon={labelWithEditIcon}
            onLabelEditClick={onLabelEditClick}
            {...mantine}
            ref={ref}
        />
    )
})

// Compile-time only — fails the build the moment ReadOnlyFieldProps declares a prop with no
// real, type-compatible home on the real ReadOnlyField (directly, or via the renames below).
// `layout` is excluded for the same reason DatePicker excludes it: Forge types it as an open
// `string`, wider than the real `formLayout` union, and the ternary above is the actual
// translation that gets type-checked. `editIcon` is excluded: a real reshape via
// `resolveLabelActionArea` above (see header), not a straight rename. `editIconGap` has no
// real equivalent — dropped.
type _Wiring = AssertWired<
    ReadOnlyFieldProps,
    typeof MantineReadOnlyField,
    | 'layer'
    | 'disableTopBottomMargin'
    | 'mantine'
    | 'material'
    | 'carbon'
    | 'className'
    | 'style'
    | 'layout'
    | 'editIcon'
    | 'editIconGap',
    { optional: 'labelOptionalText'; labelAlign: 'labelAlignment' }
>
const _wiringCheck: _Wiring = true
