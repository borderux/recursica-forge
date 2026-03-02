/**
 * Carbon Pagination Implementation
 * 
 * Uses the Button adapter component for all interactive elements:
 * - Active page: solid variant
 * - Inactive pages: outline variant
 * - Arrow controls (prev/next/first/last): text variant
 * 
 * Uses a custom pagination range algorithm.
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { DotsThree, CaretLeft, CaretRight, CaretDoubleLeft, CaretDoubleRight } from '@phosphor-icons/react'
import { Button } from '../../Button'
import { buildComponentCssVarPath } from '../../../utils/cssVarNames'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import type { PaginationProps as AdapterPaginationProps } from '../../Pagination'
import './Pagination.css'

/**
 * Generate an array of page numbers and dots for pagination display.
 */
function generatePaginationRange(
    total: number,
    current: number,
    siblings: number,
    boundaries: number
): (number | 'dots')[] {
    const range: (number | 'dots')[] = []
    const totalPageNumbers = siblings * 2 + 3 + boundaries * 2

    if (totalPageNumbers >= total) {
        for (let i = 1; i <= total; i++) range.push(i)
        return range
    }

    const leftSiblingIndex = Math.max(current - siblings, boundaries + 1)
    const rightSiblingIndex = Math.min(current + siblings, total - boundaries)
    const showLeftDots = leftSiblingIndex > boundaries + 2
    const showRightDots = rightSiblingIndex < total - boundaries - 1

    for (let i = 1; i <= boundaries; i++) range.push(i)

    if (showLeftDots) {
        range.push('dots')
    } else {
        for (let i = boundaries + 1; i < leftSiblingIndex; i++) range.push(i)
    }

    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) range.push(i)

    if (showRightDots) {
        range.push('dots')
    } else {
        for (let i = rightSiblingIndex + 1; i <= total - boundaries; i++) range.push(i)
    }

    for (let i = total - boundaries + 1; i <= total; i++) range.push(i)

    return range
}

export default function Pagination({
    total,
    value,
    defaultValue,
    onChange,
    siblings = 1,
    boundaries = 1,
    withEdges = false,
    withPages = true,
    disabled = false,
    layer = 'layer-0',
    className,
    style,
    ...props
}: AdapterPaginationProps) {
    const { mode } = useThemeMode()
    const [internalPage, setInternalPage] = useState(value ?? defaultValue ?? 1)
    const currentPage = value ?? internalPage

    useEffect(() => {
        if (value !== undefined) setInternalPage(value)
    }, [value])

    const handlePageChange = useCallback((page: number) => {
        if (disabled || page < 1 || page > total) return
        setInternalPage(page)
        onChange?.(page)
    }, [disabled, total, onChange])

    const pageRange = useMemo(
        () => generatePaginationRange(total, currentPage, siblings, boundaries),
        [total, currentPage, siblings, boundaries]
    )

    // Get CSS variable references for pagination-specific properties
    const itemGapVar = buildComponentCssVarPath('Pagination', 'properties', 'item-gap')

    // Build the layer text color variable for the dots
    const layerBase = `--recursica-brand-themes-${mode}-layers-${layer}`
    const textColorVar = `${layerBase}-elements-text-color`
    const highEmphasisVar = `${layerBase}-elements-text-high-emphasis`

    return (
        <nav
            className={`cds-pagination ${className || ''}`}
            style={{
                gap: `var(${itemGapVar})`,
                ...style,
            }}
            aria-label="Pagination"
        >
            {withEdges && (
                <Button
                    variant="text"
                    size="small"
                    layer={layer}
                    disabled={disabled || currentPage === 1}
                    onClick={() => handlePageChange(1)}
                    icon={<CaretDoubleLeft size={16} weight="bold" />}
                    title="First page"
                    style={{ minWidth: 32, height: 32, padding: '0 4px' }}
                />
            )}

            <Button
                variant="text"
                size="small"
                layer={layer}
                disabled={disabled || currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                icon={<CaretLeft size={16} weight="bold" />}
                title="Previous page"
                style={{ minWidth: 32, height: 32, padding: '0 4px' }}
            />

            {withPages && pageRange.map((item, index) => {
                if (item === 'dots') {
                    return (
                        <span
                            key={`dots-${index}`}
                            className="cds-pagination__dots"
                            aria-hidden="true"
                            style={{
                                minWidth: 32,
                                height: 32,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: `var(${textColorVar})`,
                                opacity: `var(${highEmphasisVar})`,
                            }}
                        >
                            <DotsThree size={20} weight="bold" />
                        </span>
                    )
                }

                const isActive = item === currentPage

                return (
                    <Button
                        key={item}
                        variant={isActive ? 'solid' : 'outline'}
                        size="small"
                        layer={layer}
                        disabled={disabled}
                        onClick={() => handlePageChange(item)}
                        title={`Page ${item}`}
                        style={{ minWidth: 32, height: 32, padding: '0 4px' }}
                    >
                        {item}
                    </Button>
                )
            })}

            <Button
                variant="text"
                size="small"
                layer={layer}
                disabled={disabled || currentPage === total}
                onClick={() => handlePageChange(currentPage + 1)}
                icon={<CaretRight size={16} weight="bold" />}
                title="Next page"
                style={{ minWidth: 32, height: 32, padding: '0 4px' }}
            />

            {withEdges && (
                <Button
                    variant="text"
                    size="small"
                    layer={layer}
                    disabled={disabled || currentPage === total}
                    onClick={() => handlePageChange(total)}
                    icon={<CaretDoubleRight size={16} weight="bold" />}
                    title="Last page"
                    style={{ minWidth: 32, height: 32, padding: '0 4px' }}
                />
            )}
        </nav>
    )
}
