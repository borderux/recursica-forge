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
 *   - `labelId` / `helpId` / `errorId` — the adapter wires its own aria relationships; no slot
 *     for a caller-supplied id.
 *   - Per-item `icon`/`leadingIcon`/`supportingText`: false, there's a real slot (2026-08,
 *     `@recursica/mantine-adapter@0.49.0`) — `data` items now accept `leadingIcon`/
 *     `supportingText` directly (`RecursicaComboboxItem`), rendered inside the option row by
 *     the adapter itself. Previously this wrapper worked around the gap with a `renderOption`
 *     callback; removed now that the real fields exist.
 *   - `divider`/`leadingIconType`'s radio/checkbox modes remain real, narrower gaps: the
 *     adapter's `data` still has no divider slot, and `leadingIcon` is always rendered as a
 *     plain icon regardless of `leadingIconType`.
 *   - `className`/`style` — the adapter styles itself purely from tokens and ignores both
 *     unless the caller opts in with `overStyled: true` — which the `mantine` escape hatch
 *     can still do (`mantine={{ overStyled: true, style: {...} }}`).
 *
 * `editIcon`/`editIconTitle`/`onEditIconClick` (2026-08, corrected — previously dropped on the
 * incorrect claim "no real slot"): translated via the shared `resolveLabelActionArea` helper
 * (`../labelActionArea.tsx`) into the real `labelActionArea`/`labelWithEditIcon`/
 * `onLabelEditClick` — see that file. Same root cause and fix as `mantine/Label/Label.tsx`.
 */

import React from 'react'
import { Dropdown as MantineDropdown } from '@recursica/mantine-adapter'
import { resolveLabelActionArea } from '../labelActionArea'
import type { DropdownAdapterProps } from '../../common/Dropdown'
import type { AssertWired } from '../../common/wiringCheck'

export default React.forwardRef<any, DropdownAdapterProps>(function Dropdown({
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
    layer,
    minWidth: _minWidth,
    required,
    optional,
    labelAlign,
    labelSize,
    maxHeight,
    id,
    zIndex,
    disabled,
    editIcon,
    editIconTitle,
    onEditIconClick,
    mantine,
}, ref) {
    const { labelActionArea, labelWithEditIcon, onLabelEditClick } =
        resolveLabelActionArea(editIcon, editIconTitle, onEditIconClick, layer)

    const data = items.map((item) => ({
        value: item.value,
        label: typeof item.label === 'string' ? item.label : undefined,
        disabled: item.disabled,
        leadingIcon: item.leadingIconType === 'none' ? undefined : (item.icon ?? item.leadingIcon),
        supportingText: item.supportingText,
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
            labelActionArea={labelActionArea}
            labelWithEditIcon={labelWithEditIcon}
            onLabelEditClick={onLabelEditClick}
            maxDropdownHeight={maxHeight}
            id={id}
            required={required}
            disabled={disabled || state === 'disabled'}
            comboboxProps={zIndex !== undefined ? { zIndex } : undefined}
            {...mantine}
            ref={ref}
        />
    )
})

// `items`, `onChange`, `layout` and `disabled` are excluded: each is a real value
// transformation (reshaped into `data`, wrapped, ternary-mapped onto the narrower
// `formLayout` union, OR'd with `state`) rather than a straight rename, so the literal JSX
// attributes above are what actually get checked — re-checking their untranslated shape here
// would be a false positive. `zIndex` is excluded the same way (reshaped into `comboboxProps`).
// `editIcon`/`editIconTitle`/`onEditIconClick` are excluded: a real reshape via
// `resolveLabelActionArea` above, not a straight rename (see header). `state`, `minWidth`,
// `labelId`, `helpId`, `errorId` are excluded with no rename: documented adapter gaps, see
// header comment.
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
    | 'onEditIconClick'
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
    { helpText: 'assistiveText'; errorText: 'error'; leadingIcon: 'leftSection'; trailingIcon: 'rightSection'; optional: 'labelOptionalText'; labelAlign: 'labelAlignment'; maxHeight: 'maxDropdownHeight' }
>
const _wiringCheck: _Wiring = true
