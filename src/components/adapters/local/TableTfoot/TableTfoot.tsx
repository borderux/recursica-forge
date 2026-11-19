/**
 * Mantine TableTfoot Implementation (local adapter)
 *
 * Plain `@mantine/core` `Table.Tfoot`. The local Table's styling (Table.css) targets
 * `tfoot` descendants of `.recursica-table`, so this part needs no tokens of
 * its own.
 */

import { Table as MantineTable } from '@mantine/core'
import type { TableTfootProps } from '../../common/TableTfoot'

export default function TableTfoot({
  children,
  // Part of the dispatcher contract; this part has no layer-specific tokens of its own.
  layer: _layer,
  mantine,
  ...props
}: TableTfootProps) {
  return (
    <MantineTable.Tfoot
      {...mantine}
      {...props}
    >
      {children}
    </MantineTable.Tfoot>
  )
}
