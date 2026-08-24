import React from 'react'
import type { TreeProps } from '../../common/Tree'

export default React.forwardRef<any, TreeProps>(function Tree(props, ref) {
  return <div className={props.className} style={props.style} ref={ref}>Carbon Tree Not Implemented</div>
})
