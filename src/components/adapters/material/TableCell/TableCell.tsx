import React from 'react'
import type { TableCellProps } from '../../common/TableCell'

export default React.forwardRef<any, TableCellProps>(function TableCell(props, ref) {
  const Component = props.isHeader ? 'th' : 'td'
  return <Component ref={ref} className={props.className} style={props.style}>{props.children}</Component>
})
