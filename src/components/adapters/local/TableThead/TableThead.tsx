/**
 * Mantine TableThead Implementation (local adapter)
 *
 * Plain `@mantine/core` `Table.Thead`. The local Table's styling (Table.css) targets
 * `thead` descendants of `.recursica-table`, so this part needs no tokens of
 * its own.
 */

import { Table as MantineTable } from '@mantine/core'
import type { TableTheadProps } from '../../common/TableThead'

export default function TableThead({
  children,
  // Part of the dispatcher contract; this part has no layer-specific tokens of its own.
  layer: _layer,
  mantine,
  ...props
}: TableTheadProps) {
  return (
    <MantineTable.Thead
      {...mantine}
      {...props}
    >
      {children}
    </MantineTable.Thead>
  )
}
