import type { TableCellProps } from '../../TableCell'

export default function TableCell(props: TableCellProps) {
  const Component = props.isHeader ? 'th' : 'td'
  return <Component className={props.className} style={props.style}>{props.children}</Component>
}
