/**
 * Mantine TableFooter Adapter
 *
 * A Forge TableFooter is a footer CELL (the local adapter renders it as a `<td>` inside
 * `<tfoot>`, and its tokens are per-cell: padding, dividers, cell-color, text-color,
 * text-style/currency-style). Upstream that is `Table.Td` rendered inside `Table.Tfoot`: the
 * Tfoot provides the "table-footer" section context and Td picks up the footer styling from
 * it. The footer SECTION itself is TableTfoot.
 *
 * FIXED (2026-11): this previously rendered `Table.Tfoot`, so every footer cell became a
 * whole `<tfoot>` nested inside the row — invalid markup, and no footer-cell styling.
 *
 * `variant` and `disabled` are real on `Table.Td` (`RecursicaTableCellProps`):
 * `variant: "default" | "currency"` applies the currency text style, `disabled` the disabled
 * cell styling. Forge's `variant` is a wider `string`, so it's narrowed with a cast.
 * `colSpan` is the native `<td>` attribute.
 */

import React from 'react'
import { Table } from '@recursica/adapter-mantine-v8'
import type { TableFooterProps } from '../../common/TableFooter'
import type { AssertWired } from '../../common/wiringCheck'

export default React.forwardRef<any, TableFooterProps>(function TableFooter({ children, variant, disabled, colSpan, mantine }, ref) {
    return (
        <Table.Td ref={ref} variant={variant as 'default' | 'currency' | undefined} disabled={disabled} colSpan={colSpan} {...mantine}>
            {children}
        </Table.Td>
    )
})

// `variant` is excluded: Forge's wider `string` is narrowed with a cast above.
type _Wiring = AssertWired<
    TableFooterProps,
    typeof Table.Td,
    'layer' | 'elevation' | 'mantine' | 'className' | 'style' | 'variant'
>
const _wiringCheck: _Wiring = true
