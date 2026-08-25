/**
 * Mantine Textarea Adapter
 *
 * Almost a clean rename onto the shared field vocabulary. The real TextArea's `onChange`,
 * `onKeyDown`, `onBlur`, `onClick`, `value`/`defaultValue`, `id`, `name`, `autoFocus` all come
 * straight off native `<textarea>` attributes (via @mantine/core's `__BaseInputProps` ->
 * `ElementProps<'textarea', 'size'>`) and already match Forge's declared shapes one-for-one.
 * `leftSection`/`rightSection` are real too — confirmed on `__BaseInputProps`'s own
 * `__InputProps` half, not on `RecursicaTextAreaProps_2` (which only adds `withAsterisk`/
 * `maxRows`/`minRows`/`autosize`).
 *
 * `editIcon` (2026-08, corrected — previously dropped on the incorrect claim "no real slot"):
 * translated via the shared `resolveLabelActionArea` helper (`../labelActionArea.tsx`) into the
 * real `labelActionArea`/`labelWithEditIcon` — see that file. Note `TextareaProps` (unlike
 * TextField's/Label's) has no `editIconTitle`/`onEditIconClick` of its own — a narrower, but
 * genuine, gap in Forge's own common type for this component, not addressed here — so those two
 * are passed as `undefined` to the helper; only the plain-icon and boolean-shorthand cases are
 * reachable through Textarea today. `editIconGap` still has no real equivalent.
 */

import React from 'react'
import { TextArea as MantineTextarea } from '@recursica/mantine-adapter'
import { resolveLabelActionArea } from '../labelActionArea'
import type { TextareaProps } from '../../common/Textarea'
import type { AssertWired } from '../../common/wiringCheck'

export default React.forwardRef<any, TextareaProps>(function Textarea({
    value,
    defaultValue,
    onChange,
    onKeyDown,
    onBlur,
    onClick,
    placeholder,
    label,
    helpText,
    errorText,
    layout,
    layer,
    required,
    optional,
    labelAlign,
    labelSize,
    id,
    name,
    autoFocus,
    readOnly,
    leadingIcon,
    trailingIcon,
    editIcon,
    mantine,
}, ref) {
    const { labelActionArea, labelWithEditIcon, onLabelEditClick } =
        resolveLabelActionArea(editIcon, undefined, undefined, layer)

    return (
        <MantineTextarea
            ref={ref}
            value={value}
            defaultValue={defaultValue}
            onChange={onChange}
            onKeyDown={onKeyDown}
            onBlur={onBlur}
            onClick={onClick}
            placeholder={placeholder}
            label={label}
            assistiveText={helpText}
            error={errorText}
            formLayout={layout === 'side-by-side' ? 'side-by-side' : 'stacked'}
            required={required}
            labelOptionalText={optional}
            labelAlignment={labelAlign}
            labelSize={labelSize}
            id={id}
            name={name}
            autoFocus={autoFocus}
            readOnly={readOnly}
            leftSection={leadingIcon}
            rightSection={trailingIcon}
            labelActionArea={labelActionArea}
            labelWithEditIcon={labelWithEditIcon}
            onLabelEditClick={onLabelEditClick}
            {...mantine}
        />
    )
})

// Compile-time only — fails the build the moment TextareaProps declares a prop with no real,
// type-compatible home on the real TextArea (directly, or via the renames below). `layout` is
// excluded like DatePicker's: Forge types it as an open `string`, wider than the real
// `formLayout` union, and the ternary above is the real translation. `editIcon` is excluded:
// it's a real reshape via `resolveLabelActionArea` above (see header), not a straight rename.
// `state`/`editIconGap` are excluded with no rename and no adaptation: confirmed no real
// equivalent exists for either.
type _Wiring = AssertWired<
    TextareaProps,
    typeof MantineTextarea,
    | 'layer'
    | 'disableTopBottomMargin'
    | 'mantine'
    | 'material'
    | 'carbon'
    | 'className'
    | 'style'
    | 'layout'
    | 'state'
    | 'editIcon'
    | 'editIconGap',
    { helpText: 'assistiveText'; errorText: 'error'; optional: 'labelOptionalText'; labelAlign: 'labelAlignment'; leadingIcon: 'leftSection'; trailingIcon: 'rightSection' }
>
const _wiringCheck: _Wiring = true
