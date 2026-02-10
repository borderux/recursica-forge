/**
 * Material UI Tooltip Implementation (Stub)
 */

import React from 'react'
import type { TooltipProps } from '../../Tooltip'

export default function Tooltip({ children, label, opened, zIndex }: TooltipProps) {
    return (
        <div title={label || (typeof children === 'string' ? children : undefined)}>
            {children}
        </div>
    )
}
