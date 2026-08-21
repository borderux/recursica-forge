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
 *   - `editIcon`/`editIconTitle` have no real slot, same rationale as TextField's. `editIconGap`
 *     has no real slot either.
 *   - `id` IS a real prop (via `ElementProps<'label'>`) — passed through here even though the
 *     Label dispatcher (`adapters/Label.tsx`) doesn't currently destructure/forward it at all.
 *     That's a dispatcher-level bug (not this wrapper's to fix): today `id` is always
 *     `undefined` by the time it reaches here, but the wrapper is ready for it regardless.
 */

import { Label as MantineLabel } from '@recursica/mantine-adapter'
import type { LabelProps } from '../../common/Label'
import type { AssertWired } from '../../common/wiringCheck'

export default function Label({
    children,
    htmlFor,
    variant,
    size,
    align,
    required,
    id,
    onEditIconClick,
    mantine,
}: LabelProps) {
    return (
        <MantineLabel
            htmlFor={htmlFor}
            labelSize={size}
            labelAlignment={align}
            required={required || variant === 'required'}
            labelOptionalText={variant === 'optional' ? true : undefined}
            id={id}
            onLabelEditClick={onEditIconClick}
            {...mantine}
        >
            {children}
        </MantineLabel>
    )
}

// Compile-time only — fails the build the moment LabelProps declares a prop with no real,
// type-compatible home on the real Label (directly, or via the renames below). `variant` is
// excluded: it's explicitly folded into `required`/`labelOptionalText` above, not renamed, so
// checking its untranslated shape here would be a false positive. `layout`, `editIcon`,
// `editIconGap` and `editIconTitle` are excluded with no rename and no adaptation: confirmed
// no real equivalent exists for any of them (see header).
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
    | 'editIconTitle',
    { size: 'labelSize'; align: 'labelAlignment'; onEditIconClick: 'onLabelEditClick' }
>
const _wiringCheck: _Wiring = true
