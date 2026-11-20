/**
 * TableTr — common types
 *
 * The Table's row (`<tr>`).
 * Mirrors `Table.Tr` from @recursica/adapter-mantine-v8. Callers compose a table only from
 * Forge's Table parts (Table / TableThead / TableTbody / TableTfoot / TableTr / TableHeader /
 * TableCell / TableFooter), never raw `<tr>` markup, so the real adapter's section
 * context reaches every cell.
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

/** Public prop interface. What consumer/demo code uses — identical across every UI kit. */
export type TableTrProps = {
  children?: React.ReactNode
  /** Highlights the row with the Table's selected-row color. */
  selected?: boolean
  /** Renders every cell in the row in its disabled state. */
  disabled?: boolean
  onClick?: React.MouseEventHandler<HTMLTableRowElement>
  layer?: ComponentLayer
  className?: string
  style?: React.CSSProperties
} & LibrarySpecificProps
