/**
 * Mantine Modal Implementation
 * 
 * Mantine-specific Modal component that uses CSS variables for theming.
 */

import { Modal as MantineModal, Box, Group } from '@mantine/core'
import { iconNameToReactComponent } from '../../../../modules/components/iconUtils'
import { useState, useEffect, useRef } from 'react'
import type { ModalProps as AdapterModalProps } from '../../Modal'
import { getComponentLevelCssVar, getComponentTextCssVar, buildComponentCssVarPath } from '../../../utils/cssVarNames'
import { getElevationBoxShadow, parseElevationValue } from '../../../utils/brandCssVars'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { readCssVar, readRawCssVar } from '../../../../core/css/readCssVar'
import { Button } from '../../Button'
import './Modal.css'

export default function Modal({
    children,
    content,
    isOpen,
    onClose,
    title,
    showHeader = true,
    showCloseButton = true,
    showFooter = true,
    scrollable = false,
    padding = true,
    showSecondaryButton = true,
    primaryActionLabel = 'Save',
    onPrimaryAction,
    secondaryActionLabel = 'Cancel',
    onSecondaryAction,
    primaryActionDisabled = false,
    secondaryActionDisabled = false,
    size = 'md',
    layer = 'layer-1',
    elevation,
    className,
    style,
    withOverlay = true,
    centered = true,
    position,
    trapFocus,
    zIndex,
    draggable,
    onPositionChange,
    mantine,
    ...props
}: AdapterModalProps) {
    const { mode } = useThemeMode()
    const [dragPos, setDragPos] = useState<{ x: number, y: number } | null>(position || null)
    const [isDragging, setIsDragging] = useState(false)

    // Track whether the scrollable body actually overflows. The header/footer
    // dividers are "scroll dividers" — they should only appear when the content
    // scrolls, not on modals whose content fits without scrolling.
    const bodyRef = useRef<HTMLDivElement>(null)
    const [isScrollable, setIsScrollable] = useState(false)

    // Synchronize dragPos with position prop
    useEffect(() => {
        if (position && !isDragging) {
            setDragPos(position)
        }
    }, [position, isDragging])

    // Detect whether the body content overflows (i.e. the modal scrolls) and
    // toggle the scroll dividers accordingly.
    useEffect(() => {
        const el = bodyRef.current
        if (!isOpen || !el) {
            setIsScrollable(false)
            return
        }

        const check = () => setIsScrollable(el.scrollHeight > el.clientHeight + 1)
        check()
        // Re-check after layout settles (fonts loading, async content reflow can
        // push the content just past the available height without resizing the
        // scroll container or mutating the DOM).
        const raf = requestAnimationFrame(check)

        const resizeObserver = new ResizeObserver(check)
        resizeObserver.observe(el)
        // Observe the content itself too: when it grows while the flex-constrained
        // body keeps the same height, only the content's box changes size.
        if (el.firstElementChild) resizeObserver.observe(el.firstElementChild)

        const mutationObserver = new MutationObserver(check)
        mutationObserver.observe(el, { childList: true, subtree: true, characterData: true })

        window.addEventListener('resize', check)

        return () => {
            cancelAnimationFrame(raf)
            resizeObserver.disconnect()
            mutationObserver.disconnect()
            window.removeEventListener('resize', check)
        }
    }, [isOpen, content, children])

    // Dragging logic
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!draggable || !dragPos) return

        const target = e.target as HTMLElement
        // Support both Mantine classes and our own structure
        const isHeader = !!target.closest('.mantine-Modal-header') || !!target.closest('.recursica-modal-header')
        const isInteractive = !!target.closest('button') ||
            !!target.closest('input') ||
            !!target.closest('select') ||
            !!target.closest('textarea') ||
            !!target.closest('.mantine-Modal-close')

        if (isHeader && !isInteractive) {
            setIsDragging(true)
            const startX = e.clientX - dragPos.x
            const startY = e.clientY - dragPos.y

            const handleMouseMove = (mmE: MouseEvent) => {
                const newPos = {
                    x: mmE.clientX - startX,
                    y: mmE.clientY - startY
                }
                setDragPos(newPos)
                onPositionChange?.(newPos)
            }

            const handleMouseUp = () => {
                setIsDragging(false)
                window.removeEventListener('mousemove', handleMouseMove)
                window.removeEventListener('mouseup', handleMouseUp)
            }

            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)

            // Prevent text selection while dragging
            e.preventDefault()
        }
    }

    // Build CSS variable names
    const headerBgVar = buildComponentCssVarPath('Modal', 'properties', 'colors', layer, 'header-background-color')
    const contentBgVar = buildComponentCssVarPath('Modal', 'properties', 'colors', layer, 'content-background-color')
    const footerBgVar = buildComponentCssVarPath('Modal', 'properties', 'colors', layer, 'footer-background-color')
    const titleColorVar = buildComponentCssVarPath('Modal', 'properties', 'colors', layer, 'title')
    const contentColorVar = buildComponentCssVarPath('Modal', 'properties', 'colors', layer, 'content')
    const borderColorVar = buildComponentCssVarPath('Modal', 'properties', 'colors', layer, 'border-color')
    const dividerColorVar = buildComponentCssVarPath('Modal', 'properties', 'colors', layer, 'scroll-divider')

    const borderRadiusVar = getComponentLevelCssVar('Modal', 'border-radius')
    const borderSizeVar = getComponentLevelCssVar('Modal', 'border-size')
    const scrollDividerThicknessVar = getComponentLevelCssVar('Modal', 'scroll-divider-size')
    const hfHorizontalPaddingVar = getComponentLevelCssVar('Modal', 'header-footer-horizontal-padding')
    const hfVerticalPaddingVar = getComponentLevelCssVar('Modal', 'header-footer-vertical-padding')
    const contentHorizontalPaddingVar = getComponentLevelCssVar('Modal', 'content-horizontal-padding')
    const contentVerticalPaddingVar = getComponentLevelCssVar('Modal', 'content-vertical-padding')
    const buttonGapVar = getComponentLevelCssVar('Modal', 'button-gap')
    const minWidthVar = getComponentLevelCssVar('Modal', 'min-width')
    const maxWidthVar = getComponentLevelCssVar('Modal', 'max-width')
    const minHeightVar = getComponentLevelCssVar('Modal', 'min-height')
    const maxHeightVar = getComponentLevelCssVar('Modal', 'max-height')

    // Text properties
    const headerStyleVar = getComponentLevelCssVar('Modal', 'header-style')

    const contentStyleVar = getComponentLevelCssVar('Modal', 'content-style')

    // Elevation variable
    const internalElevationVar = getComponentLevelCssVar('Modal', 'elevation')

    // State to force re-renders when text CSS variables change
    const [, setTextVarsUpdate] = useState(0)

    useEffect(() => {
        const textCssVars = [
            headerStyleVar,
            contentStyleVar,
            internalElevationVar, scrollDividerThicknessVar
        ]

        const handleCssVarUpdate = (e: Event) => {
            const detail = (e as CustomEvent).detail
            const shouldUpdateText = !detail?.cssVars || detail.cssVars.some((cssVar: string) => textCssVars.includes(cssVar))

            if (shouldUpdateText) {
                setTextVarsUpdate(prev => prev + 1)
            }
        }

        window.addEventListener('cssVarsUpdated', handleCssVarUpdate)

        const observer = new MutationObserver(() => {
            setTextVarsUpdate(prev => prev + 1)
        })

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['style'],
        })

        return () => {
            window.removeEventListener('cssVarsUpdated', handleCssVarUpdate)
            observer.disconnect()
        }
    }, [headerStyleVar, contentStyleVar, internalElevationVar, scrollDividerThicknessVar])

    const effectivePos = dragPos || position

    // Custom styles for Mantine Modal
    const modalStyles = {
        '--modal-header-bg': `var(${headerBgVar})`,
        '--modal-content-bg': `var(${contentBgVar})`,
        '--modal-footer-bg': `var(${footerBgVar})`,
        '--modal-title-color': `var(${titleColorVar})`,
        '--modal-border-color': `var(${borderColorVar})`,
        '--modal-divider': `var(${dividerColorVar})`,
        '--modal-divider-thickness': `var(${scrollDividerThicknessVar})`,
        '--modal-border-radius': `var(${borderRadiusVar})`,
        '--modal-border-size': `var(${borderSizeVar})`,
        '--modal-hf-padding-x': `var(${hfHorizontalPaddingVar})`,
        '--modal-hf-padding-y': `var(${hfVerticalPaddingVar})`,
        '--modal-content-padding-x': `var(${contentHorizontalPaddingVar})`,
        '--modal-content-padding-y': `var(${contentVerticalPaddingVar})`,
        '--modal-button-gap': `var(${buttonGapVar}, 0px)`,
        '--modal-content-min-width': effectivePos ? 'auto' : `var(${minWidthVar})`,
        '--modal-content-max-width': effectivePos ? 'auto' : `var(${maxWidthVar})`,
        '--modal-content-min-height': effectivePos ? 'auto' : `var(${minHeightVar})`,
        '--modal-content-max-height': effectivePos ? 'auto' : `var(${maxHeightVar}, 80vh)`,
        '--modal-content-color': `var(${contentColorVar})`,

        // Position variables (for CSS file !important overrides)
        ...(effectivePos && !centered ? {
            '--modal-position': 'absolute',
            '--modal-top': `${effectivePos.y}px`,
            '--modal-left': `${effectivePos.x}px`,
            '--modal-margin': '0',
            '--modal-transform': 'none',
        } : {}),
        ...style,
    } as React.CSSProperties

    const rawHeaderStyleValue = readRawCssVar(headerStyleVar) || 'h3'
    let headerStyleValue = 'h3'
    if (rawHeaderStyleValue.startsWith('{brand.typography.')) {
        headerStyleValue = rawHeaderStyleValue.replace(/^\{brand\.typography\.(.+)\}$/, '$1')
    } else if (rawHeaderStyleValue.includes('--recursica_brand_typography_')) {
        const match = /--recursica_brand_typography_([^)]+)/.exec(rawHeaderStyleValue)
        if (match) {
            headerStyleValue = match[1].replace(/-font-size$/, '')
        }
    } else {
        headerStyleValue = rawHeaderStyleValue
    }
    const HeadingTag = (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(headerStyleValue) ? headerStyleValue : 'div') as keyof JSX.IntrinsicElements

    const rawContentStyleValue = readRawCssVar(contentStyleVar) || 'body'
    let contentStyleValue = 'body'
    if (rawContentStyleValue.startsWith('{brand.typography.')) {
        contentStyleValue = rawContentStyleValue.replace(/^\{brand\.typography\.(.+)\}$/, '$1')
    } else if (rawContentStyleValue.includes('--recursica_brand_typography_')) {
        const match = /--recursica_brand_typography_([^)]+)/.exec(rawContentStyleValue)
        if (match) {
            contentStyleValue = match[1].replace(/-font-size$/, '')
        }
    } else {
        contentStyleValue = rawContentStyleValue
    }

    // Get elevation value (either from prop or from CSS variable)
    const activeElevation = elevation || parseElevationValue(readCssVar(internalElevationVar))
    const elevationBoxShadow = getElevationBoxShadow(mode, activeElevation)

    const renderContent = () => {
        const slotContent = content || children
        if (!slotContent) return null

        if (typeof slotContent === 'string') {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <p style={{ margin: 0 }}>{slotContent}</p>
                </div>
            )
        }

        return slotContent
    }

    const CloseIcon = iconNameToReactComponent('x')

    return (
        <MantineModal
            opened={isOpen}
            onClose={onClose}
            centered={centered}
            withOverlay={withOverlay}
            lockScroll={withOverlay}
            trapFocus={trapFocus ?? withOverlay}
            closeOnClickOutside={false}
            closeOnEscape={false}
            zIndex={zIndex}
            title={showHeader ? (
                <Group
                    className="recursica-modal-header"
                    justify="space-between"
                    w="100%"
                    wrap="nowrap"
                    onMouseDown={handleMouseDown}
                    style={{
                        pointerEvents: 'auto',
                        cursor: draggable ? (isDragging ? 'grabbing' : 'grab') : 'default',
                        userSelect: isDragging ? 'none' : 'auto',
                        overflow: 'hidden', // Ensure the group itself can constrain children
                        minWidth: 0,       // Allow the flex container to shrink
                    }}
                >
                    <HeadingTag style={{
                        color: 'var(--modal-title-color)',
                        fontFamily: `var(--recursica_brand_typography_${headerStyleValue}-font-family)`,
                        fontSize: `var(--recursica_brand_typography_${headerStyleValue}-font-size)`,
                        fontWeight: `var(--recursica_brand_typography_${headerStyleValue}-font-weight)`,
                        letterSpacing: `var(--recursica_brand_typography_${headerStyleValue}-font-letter-spacing)`,
                        fontStyle: `var(--recursica_brand_typography_${headerStyleValue}-font-style)`,
                        textDecoration: 'none',
                        textTransform: `var(--recursica_brand_typography_${headerStyleValue}-text-transform)`,
                        userSelect: 'none',
                        pointerEvents: 'none',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        minWidth: 0,
                        flex: 1,
                        padding: '0.1em 0', // Tiny padding to prevent descender clipping with overflow: hidden
                        lineHeight: '1.2', // Slightly more than 1 to ensure descenders have room
                        margin: 0,
                    } as any}>
                        {title}
                    </HeadingTag>
                    {showCloseButton && (
                        <Button
                            variant="text"
                            size="small"
                            layer={layer}
                            onClick={(e) => {
                                e.stopPropagation()
                                onClose()
                            }}
                            style={{ flexShrink: 0 }}
                            icon={CloseIcon ? <CloseIcon size={16} weight="bold" /> : undefined}
                        />
                    )}
                </Group>
            ) : null}
            withCloseButton={false} // We implement our own close button
            size={effectivePos ? 'auto' : size}
            padding={0}
            className={`recursica-modal ${className || ''}`}
            styles={{
                root: {
                    ...modalStyles,
                    pointerEvents: withOverlay ? 'auto' : 'none',
                },
                content: {
                    backgroundColor: 'var(--modal-content-bg)',
                    borderRadius: 'var(--modal-border-radius)',
                    border: 'var(--modal-border-size) solid var(--modal-border-color)',
                    // Clip to the rounded corners so the per-region header/footer backgrounds
                    // don't square off the top/bottom corners. (Mantine portals popovers, so
                    // nested dropdowns aren't affected.)
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    pointerEvents: 'auto',
                    boxShadow: elevationBoxShadow || 'none',
                    // Note: dynamic positioning is now handled via CSS variables and Modal.css
                },
                header: {
                    backgroundColor: 'var(--modal-header-bg)',
                    padding: 'var(--modal-hf-padding-y) var(--modal-hf-padding-x)',
                    margin: 0,
                    // Scroll divider: only shown when the body content overflows.
                    borderBottom: isScrollable
                        ? 'var(--modal-divider-thickness) solid var(--modal-divider)'
                        : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    zIndex: 2,
                    minWidth: 0, // Allow header to shrink
                },
                title: {
                    flex: 1, // Ensure title group takes full width
                    minWidth: 0, // Allow title container to shrink
                    overflow: 'hidden', // Contain the group
                },
                body: {
                    backgroundColor: 'var(--modal-content-bg)',
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    overflow: 'hidden',
                    fontFamily: `var(--recursica_brand_typography_${contentStyleValue}-font-family)`,
                    fontSize: `var(--recursica_brand_typography_${contentStyleValue}-font-size)`,
                    fontWeight: `var(--recursica_brand_typography_${contentStyleValue}-font-weight)`,
                    letterSpacing: `var(--recursica_brand_typography_${contentStyleValue}-font-letter-spacing)`,
                    lineHeight: `var(--recursica_brand_typography_${contentStyleValue}-line-height)`,
                    fontStyle: `var(--recursica_brand_typography_${contentStyleValue}-font-style)`,
                    textDecoration: 'none',
                    textTransform: `var(--recursica_brand_typography_${contentStyleValue}-text-transform)`,
                    position: 'relative',
                    zIndex: 1,
                } as any,
                ...mantine?.styles,
            }}
            onMouseDown={handleMouseDown}
            {...mantine}
            {...props}
        >
            <Box
                ref={bodyRef}
                className="recursica-modal-body"
                style={{
                    backgroundColor: 'transparent',
                    padding: padding ? 'var(--modal-content-padding-y) var(--modal-content-padding-x)' : 0,
                    color: 'var(--modal-content-color)',
                    fontFamily: 'var(--modal-content-font-family)',
                    fontSize: 'var(--modal-content-font-size)',
                    fontWeight: 'var(--modal-content-font-weight)',
                    letterSpacing: 'var(--modal-content-letter-spacing)',
                    lineHeight: 'var(--modal-content-line-height)',
                    fontStyle: 'var(--modal-content-font-style)',
                    textDecoration: 'var(--modal-content-text-decoration)',
                    textTransform: 'var(--modal-content-text-transform)',
                } as any}
            >
                {renderContent()}
            </Box>

            {showFooter && (
                <Box
                    className="recursica-modal-footer"
                    style={{
                        padding: 'var(--modal-hf-padding-y) var(--modal-hf-padding-x)',
                        // Scroll divider: only shown when the body content overflows.
                        borderTop: isScrollable
                            ? 'var(--modal-divider-thickness) solid var(--modal-divider)'
                            : 'none',
                        backgroundColor: 'var(--modal-footer-bg)',
                    }}
                >
                    <Group justify="flex-end" gap="var(--modal-button-gap)">
                        {showSecondaryButton && (
                            <Button
                                variant="text"
                                onClick={onSecondaryAction || onClose}
                                layer={layer}
                                disabled={secondaryActionDisabled}
                            >
                                {secondaryActionLabel}
                            </Button>
                        )}
                        <Button
                            variant="solid"
                            onClick={onPrimaryAction}
                            layer={layer}
                            disabled={primaryActionDisabled}
                        >
                            {primaryActionLabel}
                        </Button>
                    </Group>
                </Box>
            )}
        </MantineModal>
    )
}
