/**
 * Mantine Table Adapter
 *
 * Reasonably clean: `variant` and `children` match the real Table directly (`variant` resolves
 * through Mantine's generic StylesApiProps to `'default' | 'vertical' | (string & {})`, which a
 * plain `string` is assignable to; `children` is a plain passthrough). `data` is typed loosely
 * (`any`) on the Forge side against the real `TableData: { head?, body?, foot?, caption? }` —
 * no caller in this repo passes a `data` prop with actual content (every real usage composes
 * `Table.Thead`/`Table.Tbody`/etc. as children instead), so this just wires it straight through
 * for whoever eventually uses it.
 */

import { Table as MantineTable } from '@recursica/mantine-adapter'
import type { TableProps } from '../../common/Table'
import type { AssertWired } from '../../common/wiringCheck'

export default function Table({ children, variant, data, mantine }: TableProps) {
    return (
        <MantineTable variant={variant} data={data} {...mantine}>
            {children}
        </MantineTable>
    )
}

// Compile-time only — fails the build the moment TableProps declares a prop with no real,
// type-compatible home on the real Table.
type _Wiring = AssertWired<
    TableProps,
    typeof MantineTable,
    'layer' | 'elevation' | 'mantine' | 'material' | 'carbon' | 'className' | 'style'
>
const _wiringCheck: _Wiring = true
