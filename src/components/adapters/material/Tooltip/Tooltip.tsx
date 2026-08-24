/**
 * Material UI Tooltip Implementation (Stub)
 */

import React from 'react'
import type { TooltipProps } from '../../common/Tooltip'

export default React.forwardRef<any, TooltipProps>(function Tooltip({ children, label, opened, zIndex }, ref) {
    return (
        <div ref={ref} title={label || (typeof children === 'string' ? children : undefined)}>
            {children}
        </div>
    )
})
