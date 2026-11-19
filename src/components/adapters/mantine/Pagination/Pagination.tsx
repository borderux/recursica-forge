/**
 * Mantine Pagination Adapter
 *
 * Every Forge prop except `withPages` (`total`, `value`, `defaultValue`, `onChange`,
 * `siblings`, `boundaries`, `withEdges`, `disabled`) matches the adapter's Pagination by name
 * and shape exactly — `onChange(page: number)` on both sides, no event wrapping. Written as
 * literal attributes (not a spread) so TypeScript actually checks that, backed by the
 * `AssertWired` check below.
 *
 * `withPages` has no destination since adapter 1.3.0, which rebuilt Pagination on Recursica
 * Buttons and stopped passing Mantine's Pagination props through: the page buttons always show.
 * The adapter's Pagination also reads the manifest, which UnifiedThemeProvider supplies.
 */

import React from 'react'
import { Pagination as MantinePagination } from '@recursica/adapter-mantine-v8'
import type { PaginationProps } from '../../common/Pagination'
import type { AssertWired } from '../../common/wiringCheck'

export default React.forwardRef<any, PaginationProps>(function Pagination({
    total,
    value,
    defaultValue,
    onChange,
    siblings,
    boundaries,
    withEdges,
    disabled,
    mantine,
}, ref) {
    return (
        <MantinePagination
            total={total}
            value={value}
            defaultValue={defaultValue}
            onChange={onChange}
            siblings={siblings}
            boundaries={boundaries}
            withEdges={withEdges}
            disabled={disabled}
            {...mantine}
            ref={ref}
        />
    )
})

// Compile-time only — fails the build the moment PaginationProps declares a prop with no
// real, type-compatible home on the real Pagination. `withPages` has none (see header comment).
type _Wiring = AssertWired<
    PaginationProps,
    typeof MantinePagination,
    'layer' | 'mantine' | 'className' | 'style' | 'withPages'
>
const _wiringCheck: _Wiring = true
