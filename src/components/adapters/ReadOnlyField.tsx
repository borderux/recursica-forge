/**
 * ReadOnlyField Component Adapter
 * 
 * Unified ReadOnlyField component that displays read-only text in a form-like structure.
 * Similar to TextField but without input functionality - just displays text.
 * Composes Label internally.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import { buildComponentCssVarPath, getComponentLevelCssVar, getComponentTextCssVar } from '../utils/cssVarNames'
import { Label } from './Label'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'

export type ReadOnlyFieldProps = {
    value?: string | number
    label?: string
    layout?: 'stacked' | 'side-by-side'
    layer?: ComponentLayer
    required?: boolean
    optional?: boolean
    labelAlign?: 'left' | 'right'
    labelSize?: 'default' | 'small'
    editIcon?: React.ReactNode | boolean
    editIconGap?: string | number
    id?: string
    className?: string
    style?: React.CSSProperties
    disableTopBottomMargin?: boolean
} & LibrarySpecificProps

export function ReadOnlyField({
    value,
    label,
    layout = 'stacked',
    layer = 'layer-0',
    required = false,
    optional = false,
    labelAlign = 'left',
    labelSize,
    editIcon,
    editIconGap,
    id,
    className,
    style,
    disableTopBottomMargin = false,
    mantine,
    material,
    carbon,
}: ReadOnlyFieldProps) {
    const Component = useComponent('ReadOnlyField')

    // Generate unique ID if not provided
    const fieldId = id || `read-only-field-${Math.random().toString(36).substr(2, 9)}`
    const labelId = `${fieldId}-label`

    // Get CSS variables for colors
    const textColorVar = buildComponentCssVarPath('ReadOnlyField', 'properties', 'colors', layer, 'text')

    // Get CSS variables for text properties
    const fontFamilyVar = getComponentTextCssVar('ReadOnlyField', 'text', 'font-family')
    const fontSizeVar = getComponentTextCssVar('ReadOnlyField', 'text', 'font-size')
    const fontWeightVar = getComponentTextCssVar('ReadOnlyField', 'text', 'font-weight')
    const letterSpacingVar = getComponentTextCssVar('ReadOnlyField', 'text', 'letter-spacing')
    const lineHeightVar = getComponentTextCssVar('ReadOnlyField', 'text', 'line-height')
    const textDecorationVar = getComponentTextCssVar('ReadOnlyField', 'text', 'text-decoration')
    const textTransformVar = getComponentTextCssVar('ReadOnlyField', 'text', 'text-transform')
    const fontStyleVar = getComponentTextCssVar('ReadOnlyField', 'text', 'font-style')

    // Get component-level properties
    const minHeightVar = getComponentLevelCssVar('ReadOnlyField', 'min-height')

    // Get top-bottom-margin from layout variant
    const topBottomMarginVar = buildComponentCssVarPath('ReadOnlyField', 'variants', 'layouts', layout, 'properties', 'top-bottom-margin')

    // Get Label's gutter for side-by-side layout
    const labelGutterVar = layout === 'side-by-side'
        ? buildComponentCssVarPath('Label', 'variants', 'layouts', 'side-by-side', 'properties', 'gutter')
        : undefined

    const labelElement = label ? (
        <Label
            htmlFor={fieldId}
            variant={required ? 'required' : (optional ? 'optional' : 'default')}
            size={labelSize}
            layout={layout}
            align={labelAlign}
            layer={layer}
            id={labelId}
            editIcon={editIcon}
            editIconGap={editIconGap}
            style={layout === 'side-by-side' ? { minHeight: `var(${minHeightVar})` } : undefined}
        >
            {label}
        </Label>
    ) : null

    if (!Component) {
        return null
    }

    // Render library-specific component
    return (
        <div style={{
            marginTop: disableTopBottomMargin ? 0 : `var(${topBottomMarginVar})`,
            marginBottom: disableTopBottomMargin ? 0 : `var(${topBottomMarginVar})`,
        }}>
            <Suspense fallback={<span />}>
                <Component
                    value={value}
                    label={label}
                    layout={layout}
                    layer={layer}
                    required={required}
                    optional={optional}
                    labelAlign={labelAlign}
                    labelSize={labelSize}
                    editIcon={editIcon}
                    id={fieldId}
                    labelId={labelId}
                    className={className}
                    style={style}
                    mantine={mantine}
                    material={material}
                    carbon={carbon}
                />
            </Suspense>
        </div>
    )
}
