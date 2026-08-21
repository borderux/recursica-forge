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
 * `editIcon`/`editIconGap` have no real destination: same systemic gap as TextField's — the
 * adapter renders its own edit affordance beside the label with no slot for a caller-supplied
 * icon node, and the Textarea dispatcher (`adapters/Textarea.tsx`) doesn't even forward
 * `editIconGap` to this component in the first place.
 */

import { TextArea as MantineTextarea } from '@recursica/mantine-adapter'
import type { TextareaProps } from '../../common/Textarea'
import type { AssertWired } from '../../common/wiringCheck'

export default function Textarea({
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
    mantine,
}: TextareaProps) {
    return (
        <MantineTextarea
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
            {...mantine}
        />
    )
}

// Compile-time only — fails the build the moment TextareaProps declares a prop with no real,
// type-compatible home on the real TextArea (directly, or via the renames below). `layout` is
// excluded like DatePicker's: Forge types it as an open `string`, wider than the real
// `formLayout` union, and the ternary above is the real translation. `state`, `editIcon` and
// `editIconGap` are excluded with no rename and no adaptation: confirmed no real equivalent
// exists for any of them (see header).
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
