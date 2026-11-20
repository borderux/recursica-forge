/**
 * Mantine TableTr Implementation (local adapter)
 *
 * Plain `@mantine/core` `Table.Tr`. The local Table's styling (Table.css) targets
 * `tr` descendants of `.recursica-table` (including `tr[data-selected="true"]` for selected rows), so this part needs no tokens of
 * its own.
 */

import { Table as MantineTable } from '@mantine/core'
import type { TableTrProps } from '../../common/TableTr'

export default function TableTr({
  children,
  selected = false,
  disabled = false,
  // Part of the dispatcher contract; this part has no layer-specific tokens of its own.
  layer: _layer,
  mantine,
  ...props
}: TableTrProps) {
  return (
    <MantineTable.Tr
      data-selected={selected ? 'true' : undefined}
      data-disabled={disabled ? 'true' : undefined}
      {...mantine}
      {...props}
    >
      {children}
    </MantineTable.Tr>
  )
}
