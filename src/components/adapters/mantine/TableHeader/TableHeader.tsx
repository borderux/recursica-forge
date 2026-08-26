/**
 * Mantine TableHeader Adapter
 *
 * A Forge TableHeader is Table.Th upstream — there's no standalone header-cell export, so
 * this pulls it off the Table static instead of a plain named import.
 *
 * `sorted`/`disabled` (2026-08, corrected — previously claimed `sorted` "has no real visual/
 * semantic equivalent... no `aria-sort`, no arrow indicator are wired up," worked around by
 * hand-setting `aria-sort` directly, and `disabled` "no equivalent at all"): both false. The
 * real `Table.Th` (`RecursicaTableHeaderCellProps`) has genuine `sorted?: 'asc' | 'desc' |
 * false` and `disabled?: boolean` props, and does far more than the hand-rolled `aria-sort`
 * ever did: it sets `aria-sort` itself, sets `data-sorted`/`data-disabled` for real matching
 * CSS (sorted background/border highlight, disabled dimming), and renders an actual
 * `ChevronUpIcon`/`ChevronDownIcon` next to the header text. Forwarding the real props directly
 * makes the old hand-rolled `toAriaSort` translation fully redundant — removed. Forge's own
 * `sorted` uses `null` for "not sorted" where the real prop uses `false`; mapped below.
 * `variant` — TableThProps structurally accepts an optional `variant?: string` (inherited
 * generically from Mantine's StylesApiProps, which every compound sub-component gets), but
 * Table.Th has no actual variant-driven styling — a type-level coincidence, not a real
 * capability. Dropped; not forwarded.
 * `onClick` matches directly — real, native `<th>` click handler.
 */

import React from 'react'
import { Table } from '@recursica/mantine-adapter'
import type { TableHeaderProps } from '../../common/TableHeader'
import type { AssertWired } from '../../common/wiringCheck'

export default React.forwardRef<any, TableHeaderProps>(function TableHeader({ children, sorted, disabled, onClick, mantine }, ref) {
    return (
        <Table.Th ref={ref} sorted={sorted === null ? false : sorted} disabled={disabled} onClick={onClick} {...mantine}>
            {children}
        </Table.Th>
    )
})

// Compile-time only — fails the build the moment TableHeaderProps declares a prop with no
// real, type-compatible home on Table.Th. `sorted` is excluded: Forge's `null` needs mapping
// to the real prop's `false` (a reshape, not a same-name passthrough — see header), so the
// literal `sorted={...}` attribute is what actually gets checked. `variant` is excluded: see
// the comment above — it type-matches by coincidence via Mantine's generic StylesApiProps, not
// because it's a real capability.
type _Wiring = AssertWired<
    TableHeaderProps,
    typeof Table.Th,
    'layer' | 'elevation' | 'mantine' | 'material' | 'carbon' | 'className' | 'style' | 'sorted' | 'variant'
>
const _wiringCheck: _Wiring = true
