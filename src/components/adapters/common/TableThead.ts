/**
 * TableThead — common types
 *
 * The Table's header section (`<thead>`), which holds the TableTr of TableHeader cells.
 * Mirrors `Table.Thead` from @recursica/adapter-mantine-v8. Callers compose a table only from
 * Forge's Table parts (Table / TableThead / TableTbody / TableTfoot / TableTr / TableHeader /
 * TableCell / TableFooter), never raw `<thead>` markup, so the real adapter's section
 * context reaches every cell.
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

/** Public prop interface. What consumer/demo code uses — identical across every UI kit. */
export type TableTheadProps = {
  children?: React.ReactNode
  layer?: ComponentLayer
  className?: string
  style?: React.CSSProperties
} & LibrarySpecificProps
