/**
 * Mantine Stepper Implementation
 *
 * Mantine-specific Stepper component that uses CSS variables for theming.
 * Handles 3 step states: completed, current, upcoming with configurable colors.
 */

import { Stepper as MantineStepper } from '@mantine/core'
import type { StepperProps as AdapterStepperProps } from '../../Stepper'
import { buildComponentCssVarPath, getComponentTextCssVar } from '../../../utils/cssVarNames'
import { iconNameToReactComponent } from '../../../../modules/components/iconUtils'
import './Stepper.css'

export default function Stepper({
    active,
    onStepClick,
    orientation = 'horizontal',
    size = 'large',
    layer = 'layer-0',
    steps,
    children,
    className,
    style,
    mantine,
    ...props
}: AdapterStepperProps & { layer?: string }) {
    // --- Color CSS variables for 3 states ---
    // Path: components.stepper.properties.colors.{layer}.{prop}
    const colorVar = (prop: string) => buildComponentCssVarPath('Stepper', 'properties', 'colors', layer, prop)

    const completedIndicatorBgVar = colorVar('completed-indicator-background')
    const completedIndicatorTextVar = colorVar('completed-indicator-text')
    const completedLabelColorVar = colorVar('completed-label-color')
    const completedDescColorVar = colorVar('completed-description-color')
    const completedIndicatorBorderColorVar = colorVar('completed-indicator-border-color')

    const currentIndicatorBgVar = colorVar('current-indicator-background')
    const currentIndicatorTextVar = colorVar('current-indicator-text')
    const currentLabelColorVar = colorVar('current-label-color')
    const currentDescColorVar = colorVar('current-description-color')
    const currentIndicatorBorderColorVar = colorVar('current-indicator-border-color')

    const upcomingIndicatorBgVar = colorVar('upcoming-indicator-background')
    const upcomingIndicatorTextVar = colorVar('upcoming-indicator-text')
    const upcomingLabelColorVar = colorVar('upcoming-label-color')
    const upcomingDescColorVar = colorVar('upcoming-description-color')
    const upcomingIndicatorBorderColorVar = colorVar('upcoming-indicator-border-color')

    const completedConnectorColorVar = colorVar('completed-connector-color')
    const upcomingConnectorColorVar = colorVar('upcoming-connector-color')

    // --- Component-level dimension/style properties ---
    // Path: components.stepper.properties.{prop}
    const propVar = (prop: string) => buildComponentCssVarPath('Stepper', 'properties', prop)

    const completedConnectorSizeVar = propVar('completed-connector-size')
    const upcomingConnectorSizeVar = propVar('upcoming-connector-size')

    // --- Size variant properties ---
    // Path: components.stepper.variants.sizes.{size}.properties.{prop}
    const sizeVar = (prop: string) => buildComponentCssVarPath('Stepper', 'variants', 'sizes', size, 'properties', prop)

    const indicatorSizeVar = sizeVar('indicator-size')
    const stepNumberFontSizeVar = sizeVar('step-number-font-size')
    const indicatorBorderRadiusVar = sizeVar('indicator-border-radius')
    const indicatorBorderSizeVar = sizeVar('indicator-border-size')
    const completedIconSizeVar = sizeVar('completed-icon-size')
    const stepGapVar = sizeVar('step-gap')
    const indicatorLabelGapVar = sizeVar('indicator-label-gap')
    const labelDescriptionGapVar = sizeVar('label-description-gap')

    const maxTextWidthVar = propVar('max-text-width')

    // --- Text style properties ---
    const labelFontFamilyVar = getComponentTextCssVar('Stepper', 'label-text', 'font-family')
    const labelFontSizeVar = getComponentTextCssVar('Stepper', 'label-text', 'font-size')
    const labelFontWeightVar = getComponentTextCssVar('Stepper', 'label-text', 'font-weight')
    const labelLetterSpacingVar = getComponentTextCssVar('Stepper', 'label-text', 'letter-spacing')
    const labelLineHeightVar = getComponentTextCssVar('Stepper', 'label-text', 'line-height')
    const labelTextDecorationVar = getComponentTextCssVar('Stepper', 'label-text', 'text-decoration')
    const labelTextTransformVar = getComponentTextCssVar('Stepper', 'label-text', 'text-transform')
    const labelFontStyleVar = getComponentTextCssVar('Stepper', 'label-text', 'font-style')

    const descFontFamilyVar = getComponentTextCssVar('Stepper', 'description-text', 'font-family')
    const descFontSizeVar = getComponentTextCssVar('Stepper', 'description-text', 'font-size')
    const descFontWeightVar = getComponentTextCssVar('Stepper', 'description-text', 'font-weight')
    const descLetterSpacingVar = getComponentTextCssVar('Stepper', 'description-text', 'letter-spacing')
    const descLineHeightVar = getComponentTextCssVar('Stepper', 'description-text', 'line-height')
    const descTextDecorationVar = getComponentTextCssVar('Stepper', 'description-text', 'text-decoration')
    const descTextTransformVar = getComponentTextCssVar('Stepper', 'description-text', 'text-transform')
    const descFontStyleVar = getComponentTextCssVar('Stepper', 'description-text', 'font-style')

    // Get the Check icon for completed steps
    const CheckIcon = iconNameToReactComponent('check')

    // Map size to Mantine size
    const mantineSize = size === 'small' ? 'sm' : 'md'

    // Build CSS custom properties
    const cssVars: { [key: string]: string } = {
        // Completed state
        '--stepper-completed-indicator-bg': `var(${completedIndicatorBgVar})`,
        '--stepper-completed-indicator-text': `var(${completedIndicatorTextVar})`,
        '--stepper-completed-label-color': `var(${completedLabelColorVar})`,
        '--stepper-completed-desc-color': `var(${completedDescColorVar})`,
        '--stepper-completed-indicator-border-color': `var(${completedIndicatorBorderColorVar})`,
        // Current state
        '--stepper-current-indicator-bg': `var(${currentIndicatorBgVar})`,
        '--stepper-current-indicator-text': `var(${currentIndicatorTextVar})`,
        '--stepper-current-label-color': `var(${currentLabelColorVar})`,
        '--stepper-current-desc-color': `var(${currentDescColorVar})`,
        '--stepper-current-indicator-border-color': `var(${currentIndicatorBorderColorVar})`,
        // Upcoming state
        '--stepper-upcoming-indicator-bg': `var(${upcomingIndicatorBgVar})`,
        '--stepper-upcoming-indicator-text': `var(${upcomingIndicatorTextVar})`,
        '--stepper-upcoming-label-color': `var(${upcomingLabelColorVar})`,
        '--stepper-upcoming-desc-color': `var(${upcomingDescColorVar})`,
        '--stepper-upcoming-indicator-border-color': `var(${upcomingIndicatorBorderColorVar})`,
        // Connector
        '--stepper-completed-connector-color': `var(${completedConnectorColorVar})`,
        '--stepper-completed-connector-size': `var(${completedConnectorSizeVar})`,
        '--stepper-upcoming-connector-color': `var(${upcomingConnectorColorVar})`,
        '--stepper-upcoming-connector-size': `var(${upcomingConnectorSizeVar})`,
        // Dimensions
        '--stepper-indicator-border-radius': `var(${indicatorBorderRadiusVar})`,
        '--stepper-indicator-border-size': `var(${indicatorBorderSizeVar})`,
        '--stepper-completed-icon-size': `var(${completedIconSizeVar})`,
        '--stepper-step-gap': `var(${stepGapVar})`,
        '--stepper-indicator-label-gap': `var(${indicatorLabelGapVar})`,
        '--stepper-label-description-gap': `var(${labelDescriptionGapVar})`,
        // Max text width
        '--stepper-max-text-width': `var(${maxTextWidthVar})`,
        // Size
        '--stepper-indicator-size': `var(${indicatorSizeVar})`,
        '--stepper-step-number-font-size': `var(${stepNumberFontSizeVar})`,
        // Label text style
        '--stepper-label-font-family': `var(${labelFontFamilyVar})`,
        '--stepper-label-font-size': `var(${labelFontSizeVar})`,
        '--stepper-label-font-weight': `var(${labelFontWeightVar})`,
        '--stepper-label-letter-spacing': `var(${labelLetterSpacingVar})`,
        '--stepper-label-line-height': `var(${labelLineHeightVar})`,
        '--stepper-label-text-decoration': `var(${labelTextDecorationVar})`,
        '--stepper-label-text-transform': `var(${labelTextTransformVar})`,
        '--stepper-label-font-style': `var(${labelFontStyleVar})`,
        // Description text style
        '--stepper-desc-font-family': `var(${descFontFamilyVar})`,
        '--stepper-desc-font-size': `var(${descFontSizeVar})`,
        '--stepper-desc-font-weight': `var(${descFontWeightVar})`,
        '--stepper-desc-letter-spacing': `var(${descLetterSpacingVar})`,
        '--stepper-desc-line-height': `var(${descLineHeightVar})`,
        '--stepper-desc-text-decoration': `var(${descTextDecorationVar})`,
        '--stepper-desc-text-transform': `var(${descTextTransformVar})`,
        '--stepper-desc-font-style': `var(${descFontStyleVar})`,
    }

    const rootStyle = { ...cssVars, ...style } as React.CSSProperties

    // Build completedIcon
    const completedIcon = CheckIcon ? <CheckIcon style={{ width: '60%', height: '60%' }} /> : undefined

    return (
        <MantineStepper
            active={active}
            onStepClick={onStepClick}
            orientation={orientation}
            size={mantineSize}
            completedIcon={completedIcon}
            className={`recursica-stepper ${className || ''}`}
            style={rootStyle as React.CSSProperties}
            {...(mantine || {})}
        >
            {steps?.map((step, index) => (
                <MantineStepper.Step
                    key={index}
                    label={step.label}
                    description={step.description}
                    loading={step.loading}
                    allowStepSelect={step.allowStepSelect}
                    icon={step.icon}
                />
            ))}
            {children}
        </MantineStepper>
    )
}
