/**
 * TableTbody — common types
 *
 * The Table's body section (`<tbody>`), which holds TableTr rows of TableCell cells. Upstream, `Table.Td` throws unless it is rendered inside this (or TableTfoot).
 * Mirrors `Table.Tbody` from @recursica/adapter-mantine-v8. Callers compose a table only from
 * Forge's Table parts (Table / TableThead / TableTbody / TableTfoot / TableTr / TableHeader /
 * TableCell / TableFooter), never raw `<tbody>` markup, so the real adapter's section
 * context reaches every cell.
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

/** Public prop interface. What consumer/demo code uses — identical across every UI kit. */
export type TableTbodyProps = {
  children?: React.ReactNode
  layer?: ComponentLayer
  className?: string
  style?: React.CSSProperties
} & LibrarySpecificProps
