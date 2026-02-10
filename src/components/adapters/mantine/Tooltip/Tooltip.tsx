/**
 * Mantine Tooltip Implementation
 * 
 * Mantine-specific Tooltip component that uses CSS variables for theming.
 */

import { Tooltip as MantineTooltip, Box } from '@mantine/core'
import type { TooltipProps as AdapterTooltipProps } from '../../Tooltip'
import { getComponentCssVar, getComponentLevelCssVar, getComponentTextCssVar, buildComponentCssVarPath } from '../../../utils/cssVarNames'
import { getElevationBoxShadow } from '../../../utils/brandCssVars'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../../../core/css/readCssVar'
import './Tooltip.css'

export default function Tooltip({
    children,
    label,
    position = 'top',
    alignment = 'middle',
    layer = 'layer-0',
    elevation,
    opened,
    zIndex,
    className,
    style,
    mantine,
    ...props
}: AdapterTooltipProps) {
    const { mode } = useThemeMode()

    // Map unified position + alignment to Mantine position
    const mantinePosition = (() => {
        if (alignment === 'middle') return position
        const suffix = alignment === 'start' ? 'start' : 'end'
        return `${position}-${suffix}`
    })() as any

    // Get CSS variables from UIKit.json (explicit paths)
    const colorPath = ['properties', 'colors', layer]
    const propPath = ['properties']
    const textPath = ['properties', 'text']

    const tooltipBgVar = buildComponentCssVarPath('Tooltip', ...colorPath, 'background', mode)
    const tooltipColorVar = buildComponentCssVarPath('Tooltip', ...colorPath, 'text', mode)
    const tooltipBorderColorVar = buildComponentCssVarPath('Tooltip', ...colorPath, 'border-color', mode)

    const verticalPaddingVar = buildComponentCssVarPath('Tooltip', ...propPath, 'vertical-padding', mode)
    const horizontalPaddingVar = buildComponentCssVarPath('Tooltip', ...propPath, 'horizontal-padding', mode)
    const borderRadiusVar = buildComponentCssVarPath('Tooltip', ...propPath, 'border-radius', mode)
    const minWidthVar = buildComponentCssVarPath('Tooltip', ...propPath, 'min-width', mode)
    const maxWidthVar = buildComponentCssVarPath('Tooltip', ...propPath, 'max-width', mode)
    const beakSizeVar = buildComponentCssVarPath('Tooltip', ...propPath, 'beak-size', mode)

    // Text properties
    const fontFamilyVar = buildComponentCssVarPath('Tooltip', ...textPath, 'font-family', mode)
    const fontSizeVar = buildComponentCssVarPath('Tooltip', ...textPath, 'font-size', mode)
    const fontWeightVar = buildComponentCssVarPath('Tooltip', ...textPath, 'font-weight', mode)
    const letterSpacingVar = buildComponentCssVarPath('Tooltip', ...textPath, 'letter-spacing', mode)
    const lineHeightVar = buildComponentCssVarPath('Tooltip', ...textPath, 'line-height', mode)
    const textDecorationVar = buildComponentCssVarPath('Tooltip', ...textPath, 'text-decoration', mode)
    const textTransformVar = buildComponentCssVarPath('Tooltip', ...textPath, 'text-transform', mode)
    const fontStyleVar = buildComponentCssVarPath('Tooltip', ...textPath, 'font-style', mode)

    const beakSizeValue = parseInt(readCssVar(beakSizeVar) || '8')

    const tooltipStyles = {
        '--tooltip-bg': `var(${tooltipBgVar})`,
        '--tooltip-color': `var(${tooltipColorVar})`,
        '--tooltip-border-color': `var(${tooltipBorderColorVar})`,
        '--tooltip-padding-y': `var(${verticalPaddingVar})`,
        '--tooltip-padding-x': `var(${horizontalPaddingVar})`,
        '--tooltip-border-radius': `var(${borderRadiusVar})`,
        '--tooltip-min-width': `var(${minWidthVar})`,
        '--tooltip-max-width': `var(${maxWidthVar})`,
        '--tooltip-beak-size': `var(${beakSizeVar})`,

        '--tooltip-font-family': `var(${fontFamilyVar})`,
        '--tooltip-font-size': `var(${fontSizeVar})`,
        '--tooltip-font-weight': `var(${fontWeightVar})`,
        '--tooltip-letter-spacing': `var(${letterSpacingVar})`,
        '--tooltip-line-height': `var(${lineHeightVar})`,
        '--tooltip-text-decoration': readCssVar(textDecorationVar) || 'none',
        '--tooltip-text-transform': readCssVar(textTransformVar) || 'none',
        '--tooltip-font-style': readCssVar(fontStyleVar) || 'normal',
        '--tooltip-box-shadow': getElevationBoxShadow(mode, elevation) || 'none',

        ...style,
    } as React.CSSProperties

    const content = label ? (
        <Box className="recursica-tooltip-content">
            {label}
        </Box>
    ) : children

    return (
        <MantineTooltip
            label={content}
            position={mantinePosition}
            withArrow
            arrowSize={beakSizeValue}
            opened={opened}
            zIndex={zIndex ?? 300}
            classNames={{
                tooltip: 'recursica-tooltip-root',
                arrow: 'recursica-tooltip-arrow',
                ...mantine?.classNames,
            }}
            styles={{
                tooltip: tooltipStyles,
            }}
            {...mantine}
            {...props}
        >
            <Box
                component="span"
                className={className}
                style={{ display: 'inline-block' }}
            >
                {children}
            </Box>
        </MantineTooltip>
    )
}
