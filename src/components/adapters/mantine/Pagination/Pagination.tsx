/**
 * Mantine Pagination Implementation
 * 
 * Uses the Button adapter component for all interactive elements.
 * Button variants, sizes, and nav display modes are configurable via CSS variables.
 * 
 * Uses Mantine's usePagination hook for range calculation.
 */

import { usePagination } from '@mantine/hooks'
import { DotsThree, CaretLeft, CaretRight, CaretDoubleLeft, CaretDoubleRight } from '@phosphor-icons/react'
import { Button } from '../../Button'
import { buildComponentCssVarPath } from '../../../utils/cssVarNames'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { usePaginationConfig } from '../../hooks/usePaginationConfig'
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
    const { activeStyle, activeSize, inactiveStyle, inactiveSize, navStyle, navSize, navDisplay } = usePaginationConfig()
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
                    variant={navStyle}
                    size={navSize}
                    layer={layer}
                    disabled={disabled || pagination.active === 1}
                    onClick={() => pagination.first()}
                    title="First page"
                    {...getNavButtonProps(<CaretDoubleLeft size={16} weight="bold" />, 'First')}
                />
            )}

            {/* Previous page button */}
            <Button
                variant={navStyle}
                size={navSize}
                layer={layer}
                disabled={disabled || pagination.active === 1}
                onClick={() => pagination.previous()}
                title="Previous page"
                {...getNavButtonProps(<CaretLeft size={16} weight="bold" />, 'Prev')}
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
                        variant={isActive ? activeStyle : inactiveStyle}
                        size={isActive ? activeSize : inactiveSize}
                        layer={layer}
                        disabled={disabled}
                        onClick={() => pagination.setPage(item)}
                        title={`Page ${item}`}
                    >
                        {item}
                    </Button>
                )
            })}

            {/* Next page button */}
            <Button
                variant={navStyle}
                size={navSize}
                layer={layer}
                disabled={disabled || pagination.active === total}
                onClick={() => pagination.next()}
                title="Next page"
                {...getNavButtonProps(<CaretRight size={16} weight="bold" />, 'Next')}
            />

            {/* Last page button */}
            {withEdges && (
                <Button
                    variant={navStyle}
                    size={navSize}
                    layer={layer}
                    disabled={disabled || pagination.active === total}
                    onClick={() => pagination.last()}
                    title="Last page"
                    {...getNavButtonProps(<CaretDoubleRight size={16} weight="bold" />, 'Last')}
                />
            )}
        </nav>
    )
}
