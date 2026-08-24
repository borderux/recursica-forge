/**
 * Carbon Tooltip Implementation (Stub)
 */

import React from 'react'
import type { TooltipProps } from '../../common/Tooltip'

export default React.forwardRef<any, TooltipProps>(function Tooltip({ children, label, opened, zIndex }, ref) {
    return (
        <div title={label || (typeof children === 'string' ? children : undefined)} ref={ref}>
            {children}
        </div>
    )
})
