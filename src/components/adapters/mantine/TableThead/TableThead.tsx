/**
 * Mantine TableThead Adapter
 *
 * A Forge TableThead is `Table.Thead` upstream. There's no standalone export, so it's pulled off
 * the Table static.
 *
 * `className`/`style` aren't forwarded: the adapter styles itself purely from tokens and
 * ignores both unless the caller opts in with `overStyled: true` via the `mantine` escape
 * hatch. `layer` never arrives (FORGE_ONLY_PROPS), and table parts never get their own
 * LayerScope wrapper (see TABLE_PARTS in useComponent).
 */

import React from 'react'
import { Table } from '@recursica/adapter-mantine-v8'
import type { TableTheadProps } from '../../common/TableThead'
import type { AssertWired } from '../../common/wiringCheck'

export default React.forwardRef<any, TableTheadProps>(function TableThead({ children, mantine }, ref) {
  return (
    <Table.Thead ref={ref} {...mantine}>
      {children}
    </Table.Thead>
  )
})

type _Wiring = AssertWired<
  TableTheadProps,
  typeof Table.Thead,
  'layer' | 'mantine' | 'className' | 'style'
>
const _wiringCheck: _Wiring = true
