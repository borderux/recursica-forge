/**
 * Mantine TransferList Adapter
 *
 * The real component owns the whole control: both panes, per-pane search, selection,
 * transfer buttons, and the surrounding label / assistive text (it embeds
 * FormControlWrapper). The dispatcher (`adapters/TransferList.tsx`) is a plain pass-through,
 * so every Forge prop arrives here untouched.
 *
 * `data`/`defaultData`/`onChange`, `sourceLabel`/`targetLabel`, `searchable`/
 * `searchPlaceholder`, `label` and `required` are 1:1 matches — verified against
 * RecursicaTransferListProps in node_modules/@recursica/adapter-mantine-v8/dist/index.d.ts.
 *
 * Translated, not just passed through:
 *   - `helpText` → `assistiveText`, `errorText` → `error`, `optional` → `labelOptionalText`
 *     — the same field renames every other form control uses.
 *   - `layout` → `formLayout`, narrowed to the two values the adapter recognizes.
 *   - `state` → `disabled` — the real prop is a plain boolean, so Forge's open string
 *     variant name has to be narrowed, the same way Dropdown does it.
 */

import React from 'react'
import { TransferList as MantineTransferList } from '@recursica/adapter-mantine-v8'
import type { TransferListProps } from '../../common/TransferList'
import type { AssertWired } from '../../common/wiringCheck'

export default React.forwardRef<any, TransferListProps>(function TransferList({
    data,
    defaultData,
    onChange,
    label,
    sourceLabel,
    targetLabel,
    helpText,
    errorText,
    searchable,
    searchPlaceholder,
    required,
    optional,
    layout,
    state,
    mantine,
}, ref) {
    return (
        <MantineTransferList
            ref={ref}
            data={data}
            defaultData={defaultData}
            onChange={onChange}
            label={label}
            sourceLabel={sourceLabel}
            targetLabel={targetLabel}
            assistiveText={helpText}
            error={errorText}
            searchable={searchable}
            searchPlaceholder={searchPlaceholder}
            required={required}
            labelOptionalText={optional}
            formLayout={layout === 'side-by-side' ? 'side-by-side' : 'stacked'}
            disabled={state === 'disabled'}
            {...mantine}
        />
    )
})

// `helpText`/`errorText`/`optional`/`layout`/`state` are excluded: each is translated onto a
// differently-named or differently-typed real prop above, so its Forge-side shape is not
// what arrives.
type _Wiring = AssertWired<
    TransferListProps,
    typeof MantineTransferList,
    | 'layer' | 'mantine' | 'className' | 'style'
    | 'helpText' | 'errorText' | 'optional' | 'layout' | 'state'
>
const _wiringCheck: _Wiring = true
