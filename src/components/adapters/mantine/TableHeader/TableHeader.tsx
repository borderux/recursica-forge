/**
 * Mantine TableHeader Adapter
 *
 * A Forge TableHeader is Table.Th upstream — there's no standalone header-cell export, so
 * this pulls it off the Table static instead of a plain named import.
 *
 * `sorted` ('asc' | 'desc' | null) has no real visual/semantic equivalent on Table.Th at all —
 * no `aria-sort`, no arrow indicator are wired up by the adapter. Rather than just dropping it,
 * this sets the native `aria-sort` attribute directly (Table.Th passes through arbitrary native
 * `<th>` attributes, confirmed via TableElementProps/ElementProps<'th'>), so screen readers at
 * least get the correct signal even though there's still no visual sort arrow — that part really
 * is a gap with no adapter capability to route around.
 * `variant` — TableThProps structurally accepts an optional `variant?: string` (inherited
 * generically from Mantine's StylesApiProps, which every compound sub-component gets), but
 * Table.Th has no actual variant-driven styling — a type-level coincidence, not a real
 * capability. Dropped; not forwarded.
 * `disabled` — no equivalent at all: a `<th>` has no native `disabled` attribute. Dropped.
 * `onClick` matches directly — real, native `<th>` click handler.
 */

import { Table } from '@recursica/mantine-adapter'
import type { TableHeaderProps } from '../../common/TableHeader'
import type { AssertWired } from '../../common/wiringCheck'

function toAriaSort(sorted: TableHeaderProps['sorted']): 'ascending' | 'descending' | 'none' | undefined {
    if (sorted === 'asc') return 'ascending'
    if (sorted === 'desc') return 'descending'
    if (sorted === null) return 'none'
    return undefined
}

export default function TableHeader({ children, sorted, onClick, mantine }: TableHeaderProps) {
    return (
        <Table.Th aria-sort={toAriaSort(sorted)} onClick={onClick} {...mantine}>
            {children}
        </Table.Th>
    )
}

// Compile-time only — fails the build the moment TableHeaderProps declares a prop with no
// real, type-compatible home on Table.Th. `sorted` is excluded: it's adapted above into the
// native `aria-sort` attribute (a real translation, not a same-name passthrough), so checking
// its untranslated shape here would be a false positive. `variant` is excluded: see the
// comment above — it type-matches by coincidence via Mantine's generic StylesApiProps, not
// because it's a real capability.
type _Wiring = AssertWired<
    TableHeaderProps,
    typeof Table.Th,
    'layer' | 'elevation' | 'mantine' | 'material' | 'carbon' | 'className' | 'style' | 'sorted' | 'variant' | 'disabled'
>
const _wiringCheck: _Wiring = true
