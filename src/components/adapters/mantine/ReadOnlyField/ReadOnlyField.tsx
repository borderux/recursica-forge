/**
 * Mantine ReadOnlyField Implementation
 */

import { buildComponentCssVarPath, getComponentLevelCssVar, getComponentTextCssVar } from '../../../utils/cssVarNames'
import { Label } from '../../Label'
import type { ReadOnlyFieldProps } from '../../ReadOnlyField'

export default function ReadOnlyField({
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
    labelId,
    className,
    style,
}: ReadOnlyFieldProps & { labelId?: string }) {
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

    // Get Label's gutter for side-by-side layout
    const labelGutterVar = layout === 'side-by-side'
        ? buildComponentCssVarPath('Label', 'variants', 'layouts', 'side-by-side', 'properties', 'gutter')
        : undefined

    // Render Label component if provided
    const labelElement = label ? (
        <Label
            htmlFor={id}
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

    return (
        <div className={className} style={style}>
            {layout === 'stacked' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0, alignItems: labelAlign === 'right' ? 'flex-end' : 'stretch' }}>
                    {labelElement}
                    <div
                        id={id}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            minHeight: `var(${minHeightVar})`,
                            color: `var(${textColorVar})`,
                            fontFamily: `var(${fontFamilyVar})`,
                            fontSize: `var(${fontSizeVar})`,
                            fontWeight: `var(${fontWeightVar})`,
                            fontStyle: `var(${fontStyleVar})`,
                            letterSpacing: `var(${letterSpacingVar})`,
                            lineHeight: `var(${lineHeightVar})`,
                            textDecoration: `var(${textDecorationVar})` as any,
                            textTransform: `var(${textTransformVar})` as any,
                            textAlign: labelAlign === 'right' && layout === 'stacked' ? 'right' : 'left',
                            width: '100%',
                        }}
                    >
                        {value || '—'}
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: labelGutterVar ? `var(${labelGutterVar})` : '8px' }}>
                    {labelElement}
                    <div
                        id={id}
                        style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            minHeight: `var(${minHeightVar})`,
                            color: `var(${textColorVar})`,
                            fontFamily: `var(${fontFamilyVar})`,
                            fontSize: `var(${fontSizeVar})`,
                            fontWeight: `var(${fontWeightVar})`,
                            fontStyle: `var(${fontStyleVar})`,
                            letterSpacing: `var(${letterSpacingVar})`,
                            lineHeight: `var(${lineHeightVar})`,
                            textDecoration: `var(${textDecorationVar})` as any,
                            textTransform: `var(${textTransformVar})` as any,
                        }}
                    >
                        {value || '—'}
                    </div>
                </div>
            )}
        </div>
    )
}
