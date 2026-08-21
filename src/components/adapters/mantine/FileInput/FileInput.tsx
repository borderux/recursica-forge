/**
 * Mantine FileInput Adapter
 *
 * Forge's FileInput models its value the way a native `<input type="file">` would — a plain
 * `File | File[] | null`, set via `value`/`defaultValue` and reported via `onChange(files)`.
 * The real adapter's FileInput has no such prop at all: it is a CONTROLLED LIST
 * (`files: RecursicaFileUploadItem[]`, i.e. `{file, id?}[]`) that reports changes through
 * `onFilesAdded(files: File[])` / `onFileRemove(id: string)` and never mutates `files`
 * itself — the caller (this wrapper) owns merging those reports back into what it renders.
 * This file is the one place that bridges the two models.
 *
 * Also fixed here, not just renamed (verified against RecursicaFileInputProps in
 * node_modules/@recursica/mantine-adapter/dist/index.d.ts):
 *   - `leadingIcon` -> the real prop is a plain `icon` slot, NOT `leftSection`/`rightSection`
 *     — those don't exist on this component at all. FIELD_CONTRACT's generic leading/
 *     trailing-icon renames (built for TextField-shaped fields) are wrong here, which is why
 *     this component no longer goes through that central table (see adapterPropContract.ts).
 *   - `trailingIcon` — dropped: confirmed no second icon slot exists on the real component.
 *   - `state` — unlike DatePicker (whose Recursica-specific additions are a genuinely empty
 *     interface), this component's real props DO include a real `disabled?: boolean`, so
 *     `state === 'disabled'` is wired to it for real rather than dropped.
 *   - `name` — dropped: the real props extend `HTMLAttributes<HTMLDivElement>`, which has no
 *     `name` attribute at all.
 *   - `verticalPadding` / `iconSize` — dropped: no real sizing hook of either kind.
 */

import { useState } from 'react'
import { FileInput as MantineFileInput, type RecursicaFileUploadItem } from '@recursica/mantine-adapter'
import type { FileInputAdapterProps } from '../../common/FileInput'
import type { AssertWired } from '../../common/wiringCheck'

function toItems(value: File | File[] | null | undefined): RecursicaFileUploadItem[] {
    if (!value) return []
    return (Array.isArray(value) ? value : [value]).map((file) => ({ file, id: file.name }))
}

function toValue(items: RecursicaFileUploadItem[], multiple: boolean): File | File[] | null {
    if (multiple) return items.map((item) => item.file)
    return items[items.length - 1]?.file ?? null
}

export default function FileInput({
    value,
    defaultValue,
    onChange,
    placeholder,
    label,
    helpText,
    errorText,
    leadingIcon,
    trailingIcon: _trailingIcon,
    state,
    layout,
    required,
    optional,
    labelAlign,
    labelSize,
    id,
    name: _name,
    readOnly,
    multiple = false,
    accept,
    verticalPadding: _verticalPadding,
    iconSize: _iconSize,
    labelId: _labelId,
    helpId: _helpId,
    errorId: _errorId,
    mantine,
}: FileInputAdapterProps) {
    // Uncontrolled fallback — only used while the caller never supplies `value`. Once `value`
    // is provided it drives everything; this wrapper never mutates it.
    const [internalItems, setInternalItems] = useState<RecursicaFileUploadItem[]>(() => toItems(defaultValue))
    const controlled = value !== undefined
    const items = controlled ? toItems(value) : internalItems

    const commit = (next: RecursicaFileUploadItem[]) => {
        if (!controlled) setInternalItems(next)
        onChange?.(toValue(next, multiple))
    }

    return (
        <MantineFileInput
            files={items}
            onFilesAdded={(added) => {
                const addedItems = added.map((file) => ({ file, id: file.name }))
                commit(multiple ? [...items, ...addedItems] : addedItems.slice(-1))
            }}
            onFileRemove={(removedId) => {
                commit(items.filter((item) => (item.id ?? item.file.name) !== removedId))
            }}
            placeholder={placeholder}
            label={label}
            assistiveText={helpText}
            error={errorText}
            icon={leadingIcon}
            formLayout={layout === 'side-by-side' ? 'side-by-side' : 'stacked'}
            required={required}
            labelOptionalText={optional}
            labelAlignment={labelAlign}
            labelSize={labelSize}
            id={id}
            readOnly={readOnly}
            multiple={multiple}
            accept={accept}
            disabled={state === 'disabled'}
            {...mantine}
        />
    )
}

// `value`/`defaultValue`/`onChange` are excluded: adapted above into the real controlled-list
// model (`files`/`onFilesAdded`/`onFileRemove`), which has no shape in common with Forge's
// single-value model, so checking it here would be a false positive. `state` is excluded:
// translated into the literal `disabled` attribute above. `layout` is excluded: Forge types
// it as an open `string` for custom variant names, wider than the real `formLayout` union —
// the ternary above is the real translation. `trailingIcon`/`name`/`verticalPadding`/
// `iconSize` are excluded: confirmed above to have no real destination at all.
// `labelId`/`helpId`/`errorId` are excluded: the real component wires its own aria
// relationships, same as every other field component.
type _Wiring = AssertWired<
    FileInputAdapterProps,
    typeof MantineFileInput,
    | 'layer' | 'disableTopBottomMargin' | 'mantine' | 'material' | 'carbon' | 'className' | 'style'
    | 'value' | 'defaultValue' | 'onChange' | 'state' | 'layout'
    | 'trailingIcon' | 'name' | 'verticalPadding' | 'iconSize'
    | 'labelId' | 'helpId' | 'errorId',
    { helpText: 'assistiveText'; errorText: 'error'; leadingIcon: 'icon'; optional: 'labelOptionalText'; labelAlign: 'labelAlignment' }
>
const _wiringCheck: _Wiring = true
