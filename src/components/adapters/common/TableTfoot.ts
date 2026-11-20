/**
 * TableTfoot — common types
 *
 * The Table's footer section (`<tfoot>`), which holds the TableTr of TableFooter cells. Upstream, a `Table.Td` inside this is styled as a footer cell.
 * Mirrors `Table.Tfoot` from @recursica/adapter-mantine-v8. Callers compose a table only from
 * Forge's Table parts (Table / TableThead / TableTbody / TableTfoot / TableTr / TableHeader /
 * TableCell / TableFooter), never raw `<tfoot>` markup, so the real adapter's section
 * context reaches every cell.
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

/** Public prop interface. What consumer/demo code uses — identical across every UI kit. */
export type TableTfootProps = {
  children?: React.ReactNode
  layer?: ComponentLayer
  className?: string
  style?: React.CSSProperties
} & LibrarySpecificProps
