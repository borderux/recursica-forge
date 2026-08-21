/**
 * Mantine TableCell Adapter
 *
 * A Forge TableCell is Table.Td (or Table.Th, when acting as a header cell) upstream — there's
 * no standalone cell export, so both are pulled off the Table static instead of a plain named
 * import.
 *
 * REAL BUG FIXED HERE: the previous version of this file was `export default Table.Td` — a
 * static reference, not a function. `isHeader` could never do anything: there was no branching
 * logic at all, so every "header" cell silently rendered as a plain `<td>`. This is now a real
 * function that renders `Table.Th` when `isHeader` is true and `Table.Td` otherwise.
 *
 * `variant` — TableThProps/TableTdProps do structurally accept an optional `variant?: string`
 * (inherited generically from Mantine's StylesApiProps, which every compound sub-component gets),
 * but neither Table.Th nor Table.Td has any actual per-cell variant styling wired to it — it's a
 * type-level coincidence, not a real capability. Dropped; not forwarded.
 * `disabled` — no equivalent at all, type or otherwise: a `<th>`/`<td>` has no native `disabled`
 * attribute and neither Recursica sub-component adds one. Dropped.
 */

import { Table } from '@recursica/mantine-adapter'
import type { TableCellProps } from '../../common/TableCell'
import type { AssertWired } from '../../common/wiringCheck'

export default function TableCell({ children, isHeader, mantine }: TableCellProps) {
    return isHeader ? (
        <Table.Th {...mantine}>{children}</Table.Th>
    ) : (
        <Table.Td {...mantine}>{children}</Table.Td>
    )
}

// Compile-time only — fails the build the moment TableCellProps declares a prop with no real,
// type-compatible home on Table.Td. (Table.Th and Table.Td share the same relevant shape, so
// checking against one is representative of both here.) `isHeader` is excluded: it's the
// branch condition adapted above (picks Th vs Td), not a prop forwarded to either real
// component. `variant` is excluded: see the comment above — it type-matches by coincidence via
// Mantine's generic StylesApiProps, not because it's a real capability, so checking it here
// would be a false positive that hides the actual (documented) gap.
type _Wiring = AssertWired<
    TableCellProps,
    typeof Table.Td,
    'layer' | 'elevation' | 'mantine' | 'material' | 'carbon' | 'className' | 'style' | 'isHeader' | 'variant' | 'disabled'
>
const _wiringCheck: _Wiring = true
