import React from 'react'
import type { TableProps } from '../../common/Table'

export default React.forwardRef<any, TableProps>(function Table(props, ref) {
  return <table ref={ref} className={props.className} style={props.style}>{props.children}</table>
})
