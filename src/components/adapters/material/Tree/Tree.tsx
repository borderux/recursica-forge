import React from 'react'
import type { TreeProps } from '../../common/Tree'

export default React.forwardRef<any, TreeProps>(function Tree(props, ref) {
  return <div ref={ref} className={props.className} style={props.style}>Material Tree Not Implemented</div>
})
