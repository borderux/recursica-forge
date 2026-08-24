/**
 * Carbon Popover Implementation (Stub)
 */

import React from 'react'
import type { PopoverProps } from '../../common/Popover'

export default React.forwardRef<any, PopoverProps>(function Popover({ children, content, isOpen }, ref) {
    return (
        <div ref={ref} style={{ display: 'inline-block', position: 'relative' }}>
            {children}
            {isOpen && (
                <div style={{ position: 'absolute', top: '100%', left: 0, padding: 12, background: '#fff', border: '1px solid #ddd', borderRadius: 8, marginTop: 4, zIndex: 300 }}>
                    {content}
                </div>
            )}
        </div>
    )
})
