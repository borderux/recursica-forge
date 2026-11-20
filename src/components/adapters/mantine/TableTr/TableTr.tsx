/**
 * Mantine TableTr Adapter
 *
 * A Forge TableTr is `Table.Tr` upstream. There's no standalone export, so it's pulled off
 * the Table static. `selected`/`disabled` are real upstream props (`data-selected`, and disabled styling
 * for every cell in the row); `onClick` is the native row click.
 *
 * `className`/`style` aren't forwarded: the adapter styles itself purely from tokens and
 * ignores both unless the caller opts in with `overStyled: true` via the `mantine` escape
 * hatch. `layer` never arrives (FORGE_ONLY_PROPS), and table parts never get their own
 * LayerScope wrapper (see TABLE_PARTS in useComponent).
 */

import React from 'react'
import { Table } from '@recursica/adapter-mantine-v8'
import type { TableTrProps } from '../../common/TableTr'
import type { AssertWired } from '../../common/wiringCheck'

export default React.forwardRef<any, TableTrProps>(function TableTr({ children, selected, disabled, onClick, mantine }, ref) {
  return (
    <Table.Tr ref={ref} selected={selected} disabled={disabled} onClick={onClick} {...mantine}>
      {children}
    </Table.Tr>
  )
})

type _Wiring = AssertWired<
  TableTrProps,
  typeof Table.Tr,
  'layer' | 'mantine' | 'className' | 'style'
>
const _wiringCheck: _Wiring = true
