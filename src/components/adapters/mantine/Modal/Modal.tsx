/**
 * Mantine Modal Implementation
 * 
 * Mantine-specific Modal component that uses CSS variables for theming.
 */

import { Modal as MantineModal, Box, Group } from '@mantine/core'
import { useState, useEffect } from 'react'
import type { ModalProps as AdapterModalProps } from '../../Modal'
import { getComponentCssVar, getComponentLevelCssVar, getComponentTextCssVar } from '../../../utils/cssVarNames'
import { getElevationBoxShadow, parseElevationValue } from '../../../utils/brandCssVars'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../../../core/css/readCssVar'
import { Button } from '../../Button'
import './Modal.css'

export default function Modal({
    children,
    isOpen,
    onClose,
    title,
    showHeader = true,
    showFooter = true,
    scrollable = false,
    padding = true,
    showSecondaryButton = true,
    primaryActionLabel = 'Save',
    onPrimaryAction,
    secondaryActionLabel = 'Cancel',
    onSecondaryAction,
    size = 'md',
    layer = 'layer-1',
    elevation,
    className,
    style,
    mantine,
    ...props
}: AdapterModalProps) {
    const { mode } = useThemeMode()

    // Build CSS variable names
    const bgVar = getComponentCssVar('Modal', 'colors', 'background', layer)
    const titleColorVar = getComponentCssVar('Modal', 'colors', 'title', layer)
    const contentColorVar = getComponentCssVar('Modal', 'colors', 'content', layer)
    const borderColorVar = getComponentCssVar('Modal', 'colors', 'border-color', layer)
    const dividerColorVar = getComponentCssVar('Modal', 'colors', 'scroll-divider', layer)

    const borderRadiusVar = getComponentLevelCssVar('Modal', 'border-radius')
    const borderSizeVar = getComponentLevelCssVar('Modal', 'border-size')
    const scrollDividerThicknessVar = getComponentLevelCssVar('Modal', 'scroll-divider-thickness')
    const horizontalPaddingVar = getComponentLevelCssVar('Modal', 'horizontal-padding')
    const verticalPaddingVar = getComponentLevelCssVar('Modal', 'vertical-padding')
    const buttonGapVar = getComponentLevelCssVar('Modal', 'button-gap')
    const minWidthVar = getComponentLevelCssVar('Modal', 'min-width')
    const maxWidthVar = getComponentLevelCssVar('Modal', 'max-width')
    const minHeightVar = getComponentLevelCssVar('Modal', 'min-height')
    const maxHeightVar = getComponentLevelCssVar('Modal', 'max-height')

    // Text properties
    const headerFontFamilyVar = getComponentTextCssVar('Modal', 'header-text', 'font-family')
    const headerFontSizeVar = getComponentTextCssVar('Modal', 'header-text', 'font-size')
    const headerFontWeightVar = getComponentTextCssVar('Modal', 'header-text', 'font-weight')
    const headerLetterSpacingVar = getComponentTextCssVar('Modal', 'header-text', 'letter-spacing')
    const headerLineHeightVar = getComponentTextCssVar('Modal', 'header-text', 'line-height')
    const headerFontStyleVar = getComponentTextCssVar('Modal', 'header-text', 'font-style')
    const headerTextDecorationVar = getComponentTextCssVar('Modal', 'header-text', 'text-decoration')
    const headerTextTransformVar = getComponentTextCssVar('Modal', 'header-text', 'text-transform')

    const contentFontFamilyVar = getComponentTextCssVar('Modal', 'content-text', 'font-family')
    const contentFontSizeVar = getComponentTextCssVar('Modal', 'content-text', 'font-size')
    const contentFontWeightVar = getComponentTextCssVar('Modal', 'content-text', 'font-weight')
    const contentLetterSpacingVar = getComponentTextCssVar('Modal', 'content-text', 'letter-spacing')
    const contentLineHeightVar = getComponentTextCssVar('Modal', 'content-text', 'line-height')
    const contentFontStyleVar = getComponentTextCssVar('Modal', 'content-text', 'font-style')
    const contentTextDecorationVar = getComponentTextCssVar('Modal', 'content-text', 'text-decoration')
    const contentTextTransformVar = getComponentTextCssVar('Modal', 'content-text', 'text-transform')

    // Elevation variable
    const internalElevationVar = getComponentLevelCssVar('Modal', 'elevation')

    // State to force re-renders when text CSS variables change
    const [, setTextVarsUpdate] = useState(0)

    useEffect(() => {
        const textCssVars = [
            headerFontFamilyVar, headerFontSizeVar, headerFontWeightVar,
            headerLetterSpacingVar, headerLineHeightVar, headerFontStyleVar,
            headerTextDecorationVar, headerTextTransformVar,
            contentFontFamilyVar, contentFontSizeVar, contentFontWeightVar,
            contentLetterSpacingVar, contentLineHeightVar, contentFontStyleVar,
            contentTextDecorationVar, contentTextTransformVar,
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
    }, [headerFontFamilyVar, headerFontSizeVar, headerFontWeightVar, headerLetterSpacingVar, headerLineHeightVar, headerFontStyleVar, headerTextDecorationVar, headerTextTransformVar, contentFontFamilyVar, contentFontSizeVar, contentFontWeightVar, contentLetterSpacingVar, contentLineHeightVar, contentFontStyleVar, contentTextDecorationVar, contentTextTransformVar, internalElevationVar, scrollDividerThicknessVar])

    // Custom styles for Mantine Modal
    const modalStyles = {
        ...style,
        '--modal-bg': `var(${bgVar})`,
        '--modal-title-color': `var(${titleColorVar})`,
        '--modal-border-color': `var(${borderColorVar})`,
        '--modal-divider': `var(${dividerColorVar})`,
        '--modal-divider-thickness': `var(${scrollDividerThicknessVar})`,
        '--modal-border-radius': `var(${borderRadiusVar})`,
        '--modal-border-thickness': `var(${borderSizeVar})`,
        '--modal-padding-x': `var(${horizontalPaddingVar})`,
        '--modal-padding-y': `var(${verticalPaddingVar})`,
        '--modal-button-gap': `var(${buttonGapVar}, 0px)`,
        '--modal-min-width': `var(${minWidthVar})`,
        '--modal-max-width': `var(${maxWidthVar})`,
        '--modal-min-height': `var(${minHeightVar})`,
        '--modal-max-height': `var(${maxHeightVar})`,
        '--modal-header-font-family': `var(${headerFontFamilyVar})`,
        '--modal-header-font-size': `var(${headerFontSizeVar})`,
        '--modal-header-font-weight': `var(${headerFontWeightVar})`,
        '--modal-header-letter-spacing': `var(${headerLetterSpacingVar})`,
        '--modal-header-line-height': `var(${headerLineHeightVar})`,
        '--modal-header-font-style': `var(${headerFontStyleVar})`,
        '--modal-header-text-decoration': `var(${headerTextDecorationVar})`,
        '--modal-header-text-transform': `var(${headerTextTransformVar})`,
        '--modal-content-color': `var(${contentColorVar})`,
        '--modal-content-font-family': `var(${contentFontFamilyVar})`,
        '--modal-content-font-size': `var(${contentFontSizeVar})`,
        '--modal-content-font-weight': `var(${contentFontWeightVar})`,
        '--modal-content-letter-spacing': `var(${contentLetterSpacingVar})`,
        '--modal-content-line-height': `var(${contentLineHeightVar})`,
        '--modal-content-font-style': `var(${contentFontStyleVar})`,
        '--modal-content-text-decoration': `var(${contentTextDecorationVar})`,
        '--modal-content-text-transform': `var(${contentTextTransformVar})`,
    } as React.CSSProperties

    // Get elevation value (either from prop or from CSS variable)
    const activeElevation = elevation || parseElevationValue(readCssVar(internalElevationVar))
    const elevationBoxShadow = getElevationBoxShadow(mode, activeElevation)

    if (elevationBoxShadow) {
        modalStyles.boxShadow = elevationBoxShadow
    }

    return (
        <MantineModal
            opened={isOpen}
            onClose={onClose}
            title={showHeader ? (
                <span style={{
                    color: 'var(--modal-title-color)',
                    fontFamily: 'var(--modal-header-font-family)',
                    fontSize: 'var(--modal-header-font-size)',
                    fontWeight: 'var(--modal-header-font-weight)',
                    letterSpacing: 'var(--modal-header-letter-spacing)',
                    lineHeight: 'var(--modal-header-line-height)',
                    fontStyle: 'var(--modal-header-font-style)',
                    textDecoration: 'var(--modal-header-text-decoration)',
                    textTransform: 'var(--modal-header-text-transform)',
                } as any}>
                    {title}
                </span>
            ) : null}
            withCloseButton={false} // We implement our own close button
            size={size}
            padding={0}
            className={`recursica-modal ${className || ''}`}
            styles={{
                root: modalStyles,
                content: {
                    backgroundColor: 'var(--modal-bg)',
                    borderRadius: 'var(--modal-border-radius)',
                    minWidth: 'var(--modal-min-width)',
                    maxWidth: 'var(--modal-max-width)',
                    minHeight: 'var(--modal-min-height)',
                    maxHeight: 'var(--modal-max-height)',
                    border: 'var(--modal-border-thickness) solid var(--modal-border-color)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                },
                header: {
                    backgroundColor: 'var(--modal-bg)',
                    padding: 'var(--modal-padding-y) var(--modal-padding-x)',
                    margin: 0,
                    borderBottom: scrollable ? '1px solid var(--modal-divider)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                },
                title: {
                    color: 'var(--modal-title-color)',
                    fontFamily: 'var(--modal-header-font-family)',
                    fontSize: 'var(--modal-header-font-size)',
                    fontWeight: 'var(--modal-header-font-weight)',
                    letterSpacing: 'var(--modal-header-letter-spacing)',
                    lineHeight: 'var(--modal-header-line-height)',
                    fontStyle: 'var(--modal-header-font-style)',
                    textDecoration: 'var(--modal-header-text-decoration)',
                    textTransform: 'var(--modal-header-text-transform)',
                },
                close: {
                    display: 'none', // Hide default close button
                },
                body: {
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    overflow: 'hidden',
                    fontFamily: 'var(--modal-content-font-family)',
                    fontSize: 'var(--modal-content-font-size)',
                    fontWeight: 'var(--modal-content-font-weight)',
                    letterSpacing: 'var(--modal-content-letter-spacing)',
                    lineHeight: 'var(--modal-content-line-height)',
                    fontStyle: 'var(--modal-content-font-style)',
                    textDecoration: 'var(--modal-content-text-decoration)',
                    textTransform: 'var(--modal-content-text-transform)',
                } as any,
                ...mantine?.styles,
            }}
            {...mantine}
            {...props}
        >
            {showHeader && (
                <div style={{
                    position: 'absolute',
                    top: 'var(--modal-padding-y)',
                    right: 'var(--modal-padding-x)',
                    zIndex: 10,
                }}>
                    <Button
                        variant="text"
                        onClick={onClose}
                        layer={layer}
                        style={{ padding: 4, minWidth: 0, width: 32, height: 32 }}
                        icon="x"
                    />
                </div>
            )}
            <Box
                className="recursica-modal-body"
                style={{
                    padding: padding ? 'var(--modal-padding-y) var(--modal-padding-x)' : 0,
                    overflowY: scrollable ? 'auto' : 'visible',
                    flex: 1,
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
                {children}
                {!children && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <p style={{ margin: 0 }}>
                            The quick onyx goblin jumps over the lazy dwarf, executing a superb and swift maneuver with extraordinary zeal. This legendary encounter has been told for generations in the deep mines of the Obsidian Mountains. Every word of this story carries the weight of a thousand hammers striking the anvil of truth. The goblin, known as Zog, was not merely swift; he was a master of the dance between light and shadow, and his leap was more than just a movement—it was a statement of freedom in a world carved from unyielding stone.
                        </p>
                    </div>
                )}
            </Box>

            {showFooter && (
                <Box
                    className="recursica-modal-footer"
                    style={{
                        padding: 'var(--modal-padding-y) var(--modal-padding-x)',
                        borderTop: scrollable ? '1px solid var(--modal-divider)' : 'none',
                        backgroundColor: 'var(--modal-bg)',
                    }}
                >
                    <Group justify="flex-end" gap="var(--modal-button-gap)">
                        {showSecondaryButton && (
                            <Button
                                variant="text"
                                onClick={onSecondaryAction || onClose}
                                layer={layer}
                            >
                                {secondaryActionLabel}
                            </Button>
                        )}
                        <Button
                            variant="solid"
                            onClick={onPrimaryAction}
                            layer={layer}
                        >
                            {primaryActionLabel}
                        </Button>
                    </Group>
                </Box>
            )}
        </MantineModal>
    )
}
