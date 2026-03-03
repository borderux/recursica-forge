/**
 * Material UI Pagination Implementation
 * 
 * Uses the Button adapter component for all interactive elements.
 * Button variants, sizes, and nav display modes are configurable via CSS variables.
 * 
 * Uses a custom pagination range algorithm.
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { DotsThree, CaretLeft, CaretRight, CaretDoubleLeft, CaretDoubleRight } from '@phosphor-icons/react'
import { Button } from '../../Button'
import { buildComponentCssVarPath } from '../../../utils/cssVarNames'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { usePaginationConfig } from '../../hooks/usePaginationConfig'
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
    const { activeStyle, activeSize, inactiveStyle, inactiveSize, navStyle, navSize, navDisplay } = usePaginationConfig()
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

    // Helper to render nav button content based on display mode
    const getNavButtonProps = (icon: React.ReactNode, label: string) => {
        if (navDisplay === 'text') {
            return { children: label }
        }
        if (navDisplay === 'icon+text') {
            return { icon, children: label }
        }
        // icon only (default)
        return { icon }
    }

    return (
        <nav
            className={`recursica-pagination-mui ${className || ''}`}
            style={{
                gap: `var(${itemGapVar})`,
                ...style,
            }}
            aria-label="Pagination"
        >
            {withEdges && (
                <Button
                    variant={navStyle}
                    size={navSize}
                    layer={layer}
                    disabled={disabled || currentPage === 1}
                    onClick={() => handlePageChange(1)}
                    title="First page"
                    {...getNavButtonProps(<CaretDoubleLeft size={16} weight="bold" />, 'First')}
                />
            )}

            <Button
                variant={navStyle}
                size={navSize}
                layer={layer}
                disabled={disabled || currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                title="Previous page"
                {...getNavButtonProps(<CaretLeft size={16} weight="bold" />, 'Prev')}
            />

            {withPages && pageRange.map((item, index) => {
                if (item === 'dots') {
                    return (
                        <span
                            key={`dots-${index}`}
                            className="recursica-pagination-mui__dots"
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
                        variant={isActive ? activeStyle : inactiveStyle}
                        size={isActive ? activeSize : inactiveSize}
                        layer={layer}
                        disabled={disabled}
                        onClick={() => handlePageChange(item)}
                        title={`Page ${item}`}
                    >
                        {item}
                    </Button>
                )
            })}

            <Button
                variant={navStyle}
                size={navSize}
                layer={layer}
                disabled={disabled || currentPage === total}
                onClick={() => handlePageChange(currentPage + 1)}
                title="Next page"
                {...getNavButtonProps(<CaretRight size={16} weight="bold" />, 'Next')}
            />

            {withEdges && (
                <Button
                    variant={navStyle}
                    size={navSize}
                    layer={layer}
                    disabled={disabled || currentPage === total}
                    onClick={() => handlePageChange(total)}
                    title="Last page"
                    {...getNavButtonProps(<CaretDoubleRight size={16} weight="bold" />, 'Last')}
                />
            )}
        </nav>
    )
}
