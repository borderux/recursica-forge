import React from 'react'
import type { TableCellProps } from '../../common/TableCell'

export default React.forwardRef<any, TableCellProps>(function TableCell(props, ref) {
  const Component = props.isHeader ? 'th' : 'td'
  return <Component className={props.className} style={props.style} ref={ref}>{props.children}</Component>
})
