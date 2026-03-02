/**
 * Mantine Pagination Implementation
 * 
 * Uses the Button adapter component for all interactive elements:
 * - Active page: solid variant
 * - Inactive pages: outline variant
 * - Arrow controls (prev/next/first/last): text variant
 * 
 * Uses Mantine's usePagination hook for range calculation.
 */

import { useState, useEffect } from 'react'
import { usePagination } from '@mantine/hooks'
import { DotsThree, CaretLeft, CaretRight, CaretDoubleLeft, CaretDoubleRight } from '@phosphor-icons/react'
import { Button } from '../../Button'
import { buildComponentCssVarPath } from '../../../utils/cssVarNames'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import type { PaginationProps as AdapterPaginationProps } from '../../Pagination'
import './Pagination.css'

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
    const pagination = usePagination({
        total,
        page: value,
        initialPage: defaultValue ?? 1,
        siblings,
        boundaries,
        onChange,
    })

    // Get CSS variable references for pagination-specific properties
    const itemGapVar = buildComponentCssVarPath('Pagination', 'properties', 'item-gap')

    // Build the layer text color variable for the dots
    const layerBase = `--recursica-brand-themes-${mode}-layers-${layer}`
    const textColorVar = `${layerBase}-elements-text-color`
    const highEmphasisVar = `${layerBase}-elements-text-high-emphasis`

    return (
        <nav
            className={`recursica-pagination ${className || ''}`}
            style={{
                gap: `var(${itemGapVar})`,
                ...style,
            }}
            aria-label="Pagination"
        >
            {/* First page button */}
            {withEdges && (
                <Button
                    variant="text"
                    size="small"
                    layer={layer}
                    disabled={disabled || pagination.active === 1}
                    onClick={() => pagination.first()}
                    icon={<CaretDoubleLeft size={16} weight="bold" />}
                    title="First page"
                    style={{ minWidth: 32, height: 32, padding: '0 4px' }}
                />
            )}

            {/* Previous page button */}
            <Button
                variant="text"
                size="small"
                layer={layer}
                disabled={disabled || pagination.active === 1}
                onClick={() => pagination.previous()}
                icon={<CaretLeft size={16} weight="bold" />}
                title="Previous page"
                style={{ minWidth: 32, height: 32, padding: '0 4px' }}
            />

            {/* Page items */}
            {withPages && pagination.range.map((item, index) => {
                if (item === 'dots') {
                    return (
                        <span
                            key={`dots-${index}`}
                            className="recursica-pagination__dots"
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

                const isActive = item === pagination.active

                return (
                    <Button
                        key={item}
                        variant={isActive ? 'solid' : 'outline'}
                        size="small"
                        layer={layer}
                        disabled={disabled}
                        onClick={() => pagination.setPage(item)}
                        title={`Page ${item}`}
                        style={{ minWidth: 32, height: 32, padding: '0 4px' }}
                    >
                        {item}
                    </Button>
                )
            })}

            {/* Next page button */}
            <Button
                variant="text"
                size="small"
                layer={layer}
                disabled={disabled || pagination.active === total}
                onClick={() => pagination.next()}
                icon={<CaretRight size={16} weight="bold" />}
                title="Next page"
                style={{ minWidth: 32, height: 32, padding: '0 4px' }}
            />

            {/* Last page button */}
            {withEdges && (
                <Button
                    variant="text"
                    size="small"
                    layer={layer}
                    disabled={disabled || pagination.active === total}
                    onClick={() => pagination.last()}
                    icon={<CaretDoubleRight size={16} weight="bold" />}
                    title="Last page"
                    style={{ minWidth: 32, height: 32, padding: '0 4px' }}
                />
            )}
        </nav>
    )
}
