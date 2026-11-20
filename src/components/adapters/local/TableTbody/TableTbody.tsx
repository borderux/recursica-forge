/**
 * Mantine TableTbody Implementation (local adapter)
 *
 * Plain `@mantine/core` `Table.Tbody`. The local Table's styling (Table.css) targets
 * `tbody` descendants of `.recursica-table`, so this part needs no tokens of
 * its own.
 */

import { Table as MantineTable } from '@mantine/core'
import type { TableTbodyProps } from '../../common/TableTbody'

export default function TableTbody({
  children,
  // Part of the dispatcher contract; this part has no layer-specific tokens of its own.
  layer: _layer,
  mantine,
  ...props
}: TableTbodyProps) {
  return (
    <MantineTable.Tbody
      {...mantine}
      {...props}
    >
      {children}
    </MantineTable.Tbody>
  )
}
