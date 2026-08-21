/**
 * Mantine TableFooter Adapter
 *
 * A Forge TableFooter is Table.Tfoot upstream — there's no standalone footer export, so this
 * pulls it off the Table static instead of a plain named import.
 *
 * `variant` — TableTfootProps structurally accepts an optional `variant?: string` (inherited
 * generically from Mantine's StylesApiProps, which every compound sub-component gets), but
 * Table.Tfoot has no actual variant-driven styling — it's a type-level coincidence, not a real
 * capability. Dropped; not forwarded.
 * `disabled` — no equivalent at all: a `<tfoot>` has no native `disabled` attribute and
 * RecursicaTableProps (empty) adds none. Dropped.
 */

import { Table } from '@recursica/mantine-adapter'
import type { TableFooterProps } from '../../common/TableFooter'
import type { AssertWired } from '../../common/wiringCheck'

export default function TableFooter({ children, mantine }: TableFooterProps) {
    return <Table.Tfoot {...mantine}>{children}</Table.Tfoot>
}

// Compile-time only — fails the build the moment TableFooterProps declares a prop with no
// real, type-compatible home on Table.Tfoot. `variant` is excluded: see the comment above —
// it type-matches by coincidence via Mantine's generic StylesApiProps, not because it's a real
// capability, so checking it here would be a false positive that hides the actual (documented)
// gap.
type _Wiring = AssertWired<
    TableFooterProps,
    typeof Table.Tfoot,
    'layer' | 'elevation' | 'mantine' | 'material' | 'carbon' | 'className' | 'style' | 'variant' | 'disabled'
>
const _wiringCheck: _Wiring = true
