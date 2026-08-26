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
 * `variant`/`disabled` (2026-08, corrected — previously claimed `variant` "type-matches by
 * coincidence... not a real capability" and `disabled` has "no equivalent at all, type or
 * otherwise"): both false, but land differently on the two branches because the real component
 * splits them asymmetrically:
 *   - `Table.Td` (body cells) takes `RecursicaTableCellProps`: real `disabled?: boolean` AND
 *     real `variant?: "default" | "currency"` (applies the currency text style, for
 *     numeric/monetary columns) — so this branch gets both.
 *   - `Table.Th` (header cells) takes `RecursicaTableHeaderCellProps`: real `disabled?: boolean`
 *     but NO `variant` field at all — a header label has no currency styling to apply, so this
 *     branch only gets `disabled`. Not an oversight; the real type simply doesn't have the slot.
 * Forge's own `variant` is typed as a wider `string` (for other components' custom-variant-name
 * conventions), so it's narrowed with a cast on the `Td` branch rather than checked directly —
 * same pattern as `layout` elsewhere in this codebase.
 */

import React from 'react'
import { Table } from '@recursica/mantine-adapter'
import type { TableCellProps } from '../../common/TableCell'
import type { AssertWired } from '../../common/wiringCheck'

export default React.forwardRef<any, TableCellProps>(function TableCell({ children, isHeader, variant, disabled, mantine }, ref) {
    return isHeader ? (
        <Table.Th ref={ref} disabled={disabled} {...mantine}>{children}</Table.Th>
    ) : (
        <Table.Td ref={ref} variant={variant as 'default' | 'currency' | undefined} disabled={disabled} {...mantine}>{children}</Table.Td>
    )
})

// Compile-time only — fails the build the moment TableCellProps declares a prop with no real,
// type-compatible home on Table.Td. (Table.Th and Table.Td share the same relevant shape, so
// checking against one is representative of both here.) `isHeader` is excluded: it's the
// branch condition adapted above (picks Th vs Td), not a prop forwarded to either real
// component. `variant` is excluded: Forge's wider `string` is narrowed with a cast above (see
// header) — the literal attribute is what actually gets checked.
type _Wiring = AssertWired<
    TableCellProps,
    typeof Table.Td,
    'layer' | 'elevation' | 'mantine' | 'material' | 'carbon' | 'className' | 'style' | 'isHeader' | 'variant'
>
const _wiringCheck: _Wiring = true
