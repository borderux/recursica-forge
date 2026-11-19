/**
 * Mantine TableTfoot Adapter
 *
 * A Forge TableTfoot is `Table.Tfoot` upstream. There's no standalone export, so it's pulled off
 * the Table static.
 *
 * `className`/`style` aren't forwarded: the adapter styles itself purely from tokens and
 * ignores both unless the caller opts in with `overStyled: true` via the `mantine` escape
 * hatch. `layer` never arrives (FORGE_ONLY_PROPS), and table parts never get their own
 * LayerScope wrapper (see TABLE_PARTS in useComponent).
 */

import React from 'react'
import { Table } from '@recursica/adapter-mantine-v8'
import type { TableTfootProps } from '../../common/TableTfoot'
import type { AssertWired } from '../../common/wiringCheck'

export default React.forwardRef<any, TableTfootProps>(function TableTfoot({ children, mantine }, ref) {
  return (
    <Table.Tfoot ref={ref} {...mantine}>
      {children}
    </Table.Tfoot>
  )
})

type _Wiring = AssertWired<
  TableTfootProps,
  typeof Table.Tfoot,
  'layer' | 'mantine' | 'className' | 'style'
>
const _wiringCheck: _Wiring = true
