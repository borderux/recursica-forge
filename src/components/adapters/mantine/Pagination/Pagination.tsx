/**
 * Mantine Pagination Adapter
 *
 * Confirmed clean: every Forge prop (`total`, `value`, `defaultValue`, `onChange`,
 * `siblings`, `boundaries`, `withEdges`, `withPages`, `disabled`) matches Mantine's own
 * `PaginationRootProps` by name and shape exactly — `onChange(page: number)` on both sides,
 * no event wrapping. Written as literal attributes (not a spread) so TypeScript actually
 * checks that, backed by the `AssertWired` check below.
 */

import { Pagination as MantinePagination } from '@recursica/mantine-adapter'
import type { PaginationProps } from '../../common/Pagination'
import type { AssertWired } from '../../common/wiringCheck'

export default function Pagination({
    total,
    value,
    defaultValue,
    onChange,
    siblings,
    boundaries,
    withEdges,
    withPages,
    disabled,
    mantine,
}: PaginationProps) {
    return (
        <MantinePagination
            total={total}
            value={value}
            defaultValue={defaultValue}
            onChange={onChange}
            siblings={siblings}
            boundaries={boundaries}
            withEdges={withEdges}
            withPages={withPages}
            disabled={disabled}
            {...mantine}
        />
    )
}

// Compile-time only — fails the build the moment PaginationProps declares a prop with no
// real, type-compatible home on the real Pagination.
type _Wiring = AssertWired<
    PaginationProps,
    typeof MantinePagination,
    'layer' | 'mantine' | 'material' | 'carbon' | 'className' | 'style'
>
const _wiringCheck: _Wiring = true
