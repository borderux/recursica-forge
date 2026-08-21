/**
 * Mantine TransferList Adapter
 *
 * The dispatcher (`adapters/TransferList.tsx`) composes its own Label/AssistiveElement and
 * even its own per-pane search UI internally rather than delegating them to the real
 * component — a deliberate, preserved choice; this wrapper's job is only the piece the
 * dispatcher does delegate: `data`/`onChange` and a handful of real per-pane options.
 *
 * `data`/`defaultData`/`onChange`, `sourceLabel`/`targetLabel` and `searchable`/
 * `searchPlaceholder` are genuine 1:1 matches — verified against RecursicaTransferListProps
 * in node_modules/@recursica/mantine-adapter/dist/index.d.ts, not assumed.
 *
 * Fixed here, not just passed through:
 *   - `searchable` — a prior version of adapterPropContract.ts's `PROP_CONTRACT['TransferList']`
 *     dropped this (`searchable: null`), reasoning that the adapter's Recursica-specific
 *     surface was empty. That was STALE against the currently-installed
 *     @recursica/mantine-adapter: RecursicaTransferListProps now has a real
 *     `searchable?: boolean` field with matching semantics ("Enable per-pane search
 *     filtering. Defaults to true"). Wired as a direct pass-through now; the stale entry has
 *     been removed from the contract table.
 *   - `state` — nothing wired `state === 'disabled'` into anything before this. The real
 *     component does have a real `disabled?: boolean` (on RecursicaTransferListProps_2,
 *     confirmed in the same file), so it's wired for real now, the same way Dropdown does it.
 *
 * Dropped with no forwarding — dispatcher-internal bookkeeping for the search/selection UI
 * it composes itself, never part of the real component's vocabulary at all: `sourceSearch`,
 * `targetSearch`, `onSourceSearchChange`, `onTargetSearchChange`, `filteredSource`,
 * `filteredTarget`, `sourceSelected`, `targetSelected`, `onToggleSourceItem`,
 * `onToggleTargetItem`, `onTransferToTarget`, `onTransferToSource`, `onTransferAllToTarget`,
 * `onTransferAllToSource`. (Previously dropped centrally in adapterPropContract.ts; moved
 * here because this component now has its own wrapper translation, and per that file's own
 * rule a component can't have both.)
 *
 * `label`/`helpText`/`errorText`/`required`/`optional`/`layout`/`className`/`style` are
 * composed/handled by the dispatcher itself (the Label/AssistiveElement/margin wrapper around
 * this component) and deliberately never reach this wrapper at all.
 */

import type { ChangeEvent } from 'react'
import { TransferList as MantineTransferList } from '@recursica/mantine-adapter'
import type { TransferListItem, TransferListProps } from '../../common/TransferList'
import type { AssertWired } from '../../common/wiringCheck'

// What the dispatcher actually hands this wrapper: the shared TransferList vocabulary, plus
// its own composed-UI bookkeeping (search/selection state for the Label/AssistiveElement/
// search UI it renders itself) that has no home on the real component at all.
type TransferListWrapperProps = TransferListProps & {
    sourceSearch?: string
    targetSearch?: string
    onSourceSearchChange?: (e: ChangeEvent<HTMLInputElement>) => void
    onTargetSearchChange?: (e: ChangeEvent<HTMLInputElement>) => void
    filteredSource?: TransferListItem[]
    filteredTarget?: TransferListItem[]
    sourceSelected?: Set<string>
    targetSelected?: Set<string>
    onToggleSourceItem?: (value: string) => void
    onToggleTargetItem?: (value: string) => void
    onTransferToTarget?: () => void
    onTransferToSource?: () => void
    onTransferAllToTarget?: () => void
    onTransferAllToSource?: () => void
}

export default function TransferList({
    data,
    defaultData,
    onChange,
    sourceLabel,
    targetLabel,
    searchable,
    searchPlaceholder,
    state,
    mantine,
}: TransferListWrapperProps) {
    return (
        <MantineTransferList
            data={data}
            defaultData={defaultData}
            onChange={onChange}
            sourceLabel={sourceLabel}
            targetLabel={targetLabel}
            searchable={searchable}
            searchPlaceholder={searchPlaceholder}
            disabled={state === 'disabled'}
            {...mantine}
        />
    )
}

// `state` is excluded: translated into the literal `disabled` attribute above — the real
// prop is a plain `boolean`, so Forge's open `string` variant name has to be narrowed, not
// just renamed. `label`, `helpText`, `errorText`, `required`, `optional`, `layout`,
// `className`, `style` are excluded: the dispatcher composes/handles every one of these
// itself and never forwards them to this wrapper (see file header) — checking their
// untranslated shape here would check a value that never actually arrives.
type _Wiring = AssertWired<
    TransferListProps,
    typeof MantineTransferList,
    | 'layer' | 'mantine' | 'material' | 'carbon' | 'className' | 'style' | 'state'
    | 'label' | 'helpText' | 'errorText' | 'required' | 'optional' | 'layout'
>
const _wiringCheck: _Wiring = true
