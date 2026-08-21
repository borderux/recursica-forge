/**
 * Mantine TextField Adapter
 *
 * Almost a clean rename onto the shared field vocabulary — TextField's native input props
 * (`value`, `onChange`, `onKeyDown`, `onBlur`, `type`, `min`/`max`/`step`, `name`, `autoFocus`,
 * ...) already match the real TextField's own native `<input>` attrs one-for-one, since the
 * real type is built from `ComponentPropsWithoutRef<"input">` directly (confirmed against
 * @recursica/mantine-adapter's RecursicaTextFieldProps). Two real gaps, both moved in here
 * from adapterPropContract.ts's per-component `PROP_CONTRACT['TextField']` entry:
 *
 *   - `minWidth`: GAP. The real type Omits `controlMinWidth`/`controlMaxWidth` entirely and
 *     hardcodes them to `var(--text-field-control-min-width)`, so a caller that needs a field
 *     to shrink below the token (Forge's colour scale passes `minWidth={0}` to fit a dense
 *     grid) has no way to say so.
 *   - `editIconGap`: no real destination, and the TextField dispatcher
 *     (`adapters/TextField.tsx`) never forwards it to this component either.
 *
 * `editIcon`/`editIconTitle` are dropped for the same reason as the rest of the field
 * vocabulary (see FIELD_CONTRACT in adapterPropContract.ts): the adapter renders its own edit
 * affordance beside the label with no slot for a caller-supplied icon node or title.
 */

import { TextField as MantineTextField } from '@recursica/mantine-adapter'
import type { TextFieldProps } from '../../common/TextField'
import type { AssertWired } from '../../common/wiringCheck'

export default function TextField({
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
    leadingIcon,
    trailingIcon,
    layout,
    required,
    optional,
    labelAlign,
    labelSize,
    id,
    name,
    type,
    min,
    max,
    step,
    autoFocus,
    readOnly,
    onEditIconClick,
    mantine,
}: TextFieldProps) {
    return (
        <MantineTextField
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
            leftSection={leadingIcon}
            rightSection={trailingIcon}
            formLayout={layout === 'side-by-side' ? 'side-by-side' : 'stacked'}
            required={required}
            labelOptionalText={optional}
            labelAlignment={labelAlign}
            labelSize={labelSize}
            id={id}
            name={name}
            type={type}
            min={min}
            max={max}
            step={step}
            autoFocus={autoFocus}
            readOnly={readOnly}
            onLabelEditClick={onEditIconClick}
            {...mantine}
        />
    )
}

// Compile-time only — fails the build the moment TextFieldProps declares a prop with no real,
// type-compatible home on the real TextField (directly, or via the renames below). `layout`
// is excluded like DatePicker's: Forge types it as an open `string`, wider than the real
// `formLayout` union, and the ternary above is the real translation. `state`, `minWidth`,
// `editIcon`, `editIconGap` and `editIconTitle` are excluded with no rename and no adaptation:
// confirmed no real equivalent exists for any of them (see header).
type _Wiring = AssertWired<
    TextFieldProps,
    typeof MantineTextField,
    | 'layer'
    | 'disableTopBottomMargin'
    | 'mantine'
    | 'material'
    | 'carbon'
    | 'className'
    | 'style'
    | 'layout'
    | 'state'
    | 'minWidth'
    | 'editIcon'
    | 'editIconGap'
    | 'editIconTitle',
    { helpText: 'assistiveText'; errorText: 'error'; leadingIcon: 'leftSection'; trailingIcon: 'rightSection'; optional: 'labelOptionalText'; labelAlign: 'labelAlignment'; onEditIconClick: 'onLabelEditClick' }
>
const _wiringCheck: _Wiring = true
