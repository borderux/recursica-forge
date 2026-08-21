/**
 * Mantine ReadOnlyField Adapter
 *
 * Mostly a clean rename onto the shared field vocabulary (confirmed against
 * RecursicaReadOnlyFieldProps: `formLayout`, `labelAlignment`, `labelSize`,
 * `labelOptionalText` all exist for real). Two gaps:
 *
 *   - `editIcon` has no real destination. The adapter renders its own edit affordance
 *     (`labelWithEditIcon` + `onLabelEditClick`) beside the label; there's no slot for a
 *     caller-supplied icon node short of replacing the whole label action area.
 *   - `editIconGap` has no real destination either, and — unlike `editIcon` — the
 *     ReadOnlyField dispatcher (`adapters/ReadOnlyField.tsx`) never even forwards it to this
 *     component in the first place, so it's dead on both sides.
 */

import { ReadOnlyField as MantineReadOnlyField } from '@recursica/mantine-adapter'
import type { ReadOnlyFieldProps } from '../../common/ReadOnlyField'
import type { AssertWired } from '../../common/wiringCheck'

export default function ReadOnlyField({
    value,
    label,
    layout,
    required,
    optional,
    labelAlign,
    labelSize,
    id,
    mantine,
}: ReadOnlyFieldProps) {
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
            {...mantine}
        />
    )
}

// Compile-time only — fails the build the moment ReadOnlyFieldProps declares a prop with no
// real, type-compatible home on the real ReadOnlyField (directly, or via the renames below).
// `layout` is excluded for the same reason DatePicker excludes it: Forge types it as an open
// `string`, wider than the real `formLayout` union, and the ternary above is the actual
// translation that gets type-checked. `editIcon` and `editIconGap` are excluded with no
// rename and no adaptation: confirmed no real equivalent exists for either (see header).
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
