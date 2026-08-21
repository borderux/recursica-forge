/**
 * Mantine Dropdown Adapter
 *
 * @recursica/mantine-adapter's Dropdown is Mantine's Select: it takes a `data` array (not
 * Forge's richer `items`) and its own form-field vocabulary (`assistiveText`/`error`/
 * `leftSection`/`rightSection`/`formLayout`/`labelAlignment`/`labelOptionalText`) rather than
 * Forge's. This wrapper is the one place that translates between the two.
 *
 * Dropped with no forwarding — adapter gaps, not oversights:
 *   - `state` — upstream drives error/disabled from real props and hover/focus natively;
 *     there's no slot for an arbitrary named variant.
 *   - `minWidth` — no upstream sizing hook (see TextField's identical `controlMinWidth` gap).
 *   - `editIcon` / `editIconTitle` / `labelId` / `helpId` / `errorId` — the adapter renders its
 *     own edit affordance and wires its own aria relationships; there's no slot for a
 *     caller-supplied icon node or id.
 *   - `className`/`style` — the adapter styles itself purely from tokens and ignores both
 *     unless the caller opts in with `overStyled: true` — which the `mantine` escape hatch
 *     can still do (`mantine={{ overStyled: true, style: {...} }}`).
 */

import { Dropdown as MantineDropdown } from '@recursica/mantine-adapter'
import type { DropdownAdapterProps } from '../../common/Dropdown'
import type { AssertWired } from '../../common/wiringCheck'

export default function Dropdown({
    items,
    value,
    onChange,
    placeholder,
    label,
    helpText,
    errorText,
    leadingIcon,
    trailingIcon,
    state,
    layout,
    minWidth: _minWidth,
    required,
    optional,
    labelAlign,
    labelSize,
    maxHeight,
    id,
    zIndex,
    disabled,
    onEditIconClick,
    mantine,
}: DropdownAdapterProps) {
    const data = items.map((item) => ({
        value: item.value,
        label: item.label ?? item.value,
        disabled: item.disabled,
    }))

    return (
        <MantineDropdown
            data={data}
            value={value}
            onChange={(nextValue) => nextValue && onChange?.(nextValue)}
            placeholder={placeholder}
            label={label}
            assistiveText={helpText}
            error={errorText}
            leftSection={leadingIcon}
            rightSection={trailingIcon}
            formLayout={layout === 'side-by-side' ? 'side-by-side' : 'stacked'}
            labelAlignment={labelAlign}
            labelSize={labelSize}
            labelOptionalText={optional}
            onLabelEditClick={onEditIconClick}
            maxDropdownHeight={maxHeight}
            id={id}
            required={required}
            disabled={disabled || state === 'disabled'}
            comboboxProps={zIndex !== undefined ? { zIndex } : undefined}
            {...mantine}
        />
    )
}

// `items`, `onChange`, `layout` and `disabled` are excluded: each is a real value
// transformation (reshaped into `data`, wrapped, ternary-mapped onto the narrower
// `formLayout` union, OR'd with `state`) rather than a straight rename, so the literal JSX
// attributes above are what actually get checked — re-checking their untranslated shape here
// would be a false positive. `zIndex` is excluded the same way (reshaped into
// `comboboxProps`). `state`, `minWidth`, `editIcon`, `editIconTitle`, `labelId`, `helpId`,
// `errorId` are excluded with no rename: documented adapter gaps, see header comment.
type _Wiring = AssertWired<
    DropdownAdapterProps,
    typeof MantineDropdown,
    | 'items'
    | 'onChange'
    | 'layout'
    | 'disabled'
    | 'zIndex'
    | 'state'
    | 'minWidth'
    | 'editIcon'
    | 'editIconTitle'
    | 'labelId'
    | 'helpId'
    | 'errorId'
    | 'layer'
    | 'disableTopBottomMargin'
    | 'className'
    | 'style'
    | 'mantine'
    | 'material'
    | 'carbon',
    { helpText: 'assistiveText'; errorText: 'error'; leadingIcon: 'leftSection'; trailingIcon: 'rightSection'; optional: 'labelOptionalText'; labelAlign: 'labelAlignment'; maxHeight: 'maxDropdownHeight'; onEditIconClick: 'onLabelEditClick' }
>
const _wiringCheck: _Wiring = true
