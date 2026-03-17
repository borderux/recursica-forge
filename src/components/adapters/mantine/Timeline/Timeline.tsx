/**
 * Mantine Timeline Implementation
 *
 * Mantine-specific Timeline component that uses CSS variables for theming.
 * Handles active/inactive states for bullets and connectors.
 * Display-only — no click handlers.
 *
 * Bullet styles now come from the TimelineBullet subcomponent in recursica_ui-kit.json.
 */

import { Timeline as MantineTimeline } from '@mantine/core'
import type { TimelineProps as AdapterTimelineProps } from '../../Timeline'
import { buildComponentCssVarPath, getComponentTextCssVar } from '../../../utils/cssVarNames'
import './Timeline.css'

export default function Timeline({
    active = 1,
    align = 'left',
    layer = 'layer-0',
    items,
    children,
    className,
    style,
    mantine,
    ...props
}: AdapterTimelineProps & { layer?: string }) {
    // --- Timeline (parent) CSS variables ---
    const timelineColorVar = (prop: string) => buildComponentCssVarPath('Timeline', 'properties', 'colors', layer, prop)
    const timelinePropVar = (prop: string) => buildComponentCssVarPath('Timeline', 'properties', prop)

    // --- Bullet CSS variables (from TimelineBullet subcomponent) ---
    const bulletColorVar = (variant: string, prop: string) =>
        buildComponentCssVarPath('TimelineBullet', 'variants', 'types', variant, 'properties', 'colors', layer, prop)
    const bulletPropVar = (variant: string, prop: string) =>
        buildComponentCssVarPath('TimelineBullet', 'variants', 'types', variant, 'properties', prop)

    // --- Text style properties ---
    const titleFontFamilyVar = getComponentTextCssVar('Timeline', 'title-text', 'font-family')
    const titleFontSizeVar = getComponentTextCssVar('Timeline', 'title-text', 'font-size')
    const titleFontWeightVar = getComponentTextCssVar('Timeline', 'title-text', 'font-weight')
    const titleLetterSpacingVar = getComponentTextCssVar('Timeline', 'title-text', 'letter-spacing')
    const titleLineHeightVar = getComponentTextCssVar('Timeline', 'title-text', 'line-height')
    const titleTextDecorationVar = getComponentTextCssVar('Timeline', 'title-text', 'text-decoration')
    const titleTextTransformVar = getComponentTextCssVar('Timeline', 'title-text', 'text-transform')
    const titleFontStyleVar = getComponentTextCssVar('Timeline', 'title-text', 'font-style')

    const descriptionFontFamilyVar = getComponentTextCssVar('Timeline', 'description-text', 'font-family')
    const descriptionFontSizeVar = getComponentTextCssVar('Timeline', 'description-text', 'font-size')
    const descriptionFontWeightVar = getComponentTextCssVar('Timeline', 'description-text', 'font-weight')
    const descriptionLetterSpacingVar = getComponentTextCssVar('Timeline', 'description-text', 'letter-spacing')
    const descriptionLineHeightVar = getComponentTextCssVar('Timeline', 'description-text', 'line-height')
    const descriptionTextDecorationVar = getComponentTextCssVar('Timeline', 'description-text', 'text-decoration')
    const descriptionTextTransformVar = getComponentTextCssVar('Timeline', 'description-text', 'text-transform')
    const descriptionFontStyleVar = getComponentTextCssVar('Timeline', 'description-text', 'font-style')

    const timestampFontFamilyVar = getComponentTextCssVar('Timeline', 'timestamp-text', 'font-family')
    const timestampFontSizeVar = getComponentTextCssVar('Timeline', 'timestamp-text', 'font-size')
    const timestampFontWeightVar = getComponentTextCssVar('Timeline', 'timestamp-text', 'font-weight')
    const timestampLetterSpacingVar = getComponentTextCssVar('Timeline', 'timestamp-text', 'letter-spacing')
    const timestampLineHeightVar = getComponentTextCssVar('Timeline', 'timestamp-text', 'line-height')
    const timestampTextDecorationVar = getComponentTextCssVar('Timeline', 'timestamp-text', 'text-decoration')
    const timestampTextTransformVar = getComponentTextCssVar('Timeline', 'timestamp-text', 'text-transform')
    const timestampFontStyleVar = getComponentTextCssVar('Timeline', 'timestamp-text', 'font-style')

    // Build CSS custom properties
    const cssVars: { [key: string]: string } = {
        // Connector (from Timeline parent)
        '--timeline-active-connector-color': `var(${timelineColorVar('active-connector-color')})`,
        '--timeline-inactive-connector-color': `var(${timelineColorVar('inactive-connector-color')})`,
        '--timeline-active-connector-size': `var(${timelinePropVar('active-connector-size')})`,
        '--timeline-inactive-connector-size': `var(${timelinePropVar('inactive-connector-size')})`,

        // Default bullet (from TimelineBullet > variants > types > default)
        '--timeline-default-active-bullet-bg': `var(${bulletColorVar('default', 'active-background')})`,
        '--timeline-default-active-bullet-border': `var(${bulletColorVar('default', 'active-border-color')})`,
        '--timeline-default-inactive-bullet-bg': `var(${bulletColorVar('default', 'inactive-background')})`,
        '--timeline-default-inactive-bullet-border': `var(${bulletColorVar('default', 'inactive-border-color')})`,
        '--timeline-default-bullet-size': `var(${bulletPropVar('default', 'bullet-size')})`,
        '--timeline-default-bullet-border-size': `var(${bulletPropVar('default', 'border-size')})`,
        '--timeline-default-bullet-border-radius': `var(${bulletPropVar('default', 'border-radius')})`,

        // Icon bullet (from TimelineBullet > variants > types > icon)
        '--timeline-icon-active-icon-color': `var(${bulletColorVar('icon', 'active-icon-color')})`,
        '--timeline-icon-active-bullet-bg': `var(${bulletColorVar('icon', 'active-background')})`,
        '--timeline-icon-active-bullet-border': `var(${bulletColorVar('icon', 'active-border-color')})`,
        '--timeline-icon-inactive-icon-color': `var(${bulletColorVar('icon', 'inactive-icon-color')})`,
        '--timeline-icon-inactive-bullet-bg': `var(${bulletColorVar('icon', 'inactive-background')})`,
        '--timeline-icon-inactive-bullet-border': `var(${bulletColorVar('icon', 'inactive-border-color')})`,
        '--timeline-icon-bullet-size': `var(${bulletPropVar('icon', 'bullet-size')})`,
        '--timeline-icon-icon-size': `var(${bulletPropVar('icon', 'icon-size')})`,
        '--timeline-icon-bullet-border-size': `var(${bulletPropVar('icon', 'border-size')})`,
        '--timeline-icon-bullet-border-radius': `var(${bulletPropVar('icon', 'border-radius')})`,

        // Icon-alternative (from TimelineBullet > variants > types > icon-alternative)
        '--timeline-icon-alt-active-icon-color': `var(${bulletColorVar('icon-alternative', 'active-icon-color')})`,
        '--timeline-icon-alt-active-bullet-bg': `var(${bulletColorVar('icon-alternative', 'active-background')})`,
        '--timeline-icon-alt-inactive-icon-color': `var(${bulletColorVar('icon-alternative', 'inactive-icon-color')})`,
        '--timeline-icon-alt-inactive-bullet-bg': `var(${bulletColorVar('icon-alternative', 'inactive-background')})`,
        '--timeline-icon-alt-active-bullet-border': `var(${bulletColorVar('icon-alternative', 'active-border-color')})`,
        '--timeline-icon-alt-inactive-bullet-border': `var(${bulletColorVar('icon-alternative', 'inactive-border-color')})`,
        '--timeline-icon-alt-bullet-size': `var(${bulletPropVar('icon-alternative', 'bullet-size')})`,
        '--timeline-icon-alt-icon-size': `var(${bulletPropVar('icon-alternative', 'icon-size')})`,
        '--timeline-icon-alt-bullet-border-size': `var(${bulletPropVar('icon-alternative', 'border-size')})`,
        '--timeline-icon-alt-bullet-border-radius': `var(${bulletPropVar('icon-alternative', 'border-radius')})`,

        // Avatar (from TimelineBullet > variants > types > avatar)
        // Avatar size resolves through Avatar component's sizes variants (small/default/large)
        '--timeline-avatar-size-small': `var(${buildComponentCssVarPath('Avatar', 'variants', 'sizes', 'small', 'properties', 'size')}, 32px)`,
        '--timeline-avatar-size-default': `var(${buildComponentCssVarPath('Avatar', 'variants', 'sizes', 'default', 'properties', 'size')}, 40px)`,
        '--timeline-avatar-size-large': `var(${buildComponentCssVarPath('Avatar', 'variants', 'sizes', 'large', 'properties', 'size')}, 64px)`,
        // Read the stored avatar-size string and resolve to the correct Avatar size
        '--timeline-avatar-bullet-size': (() => {
            const sizeVarName = bulletPropVar('avatar', 'avatar-size')
            const sizeValue = typeof document !== 'undefined'
                ? getComputedStyle(document.documentElement).getPropertyValue(sizeVarName).trim().replace(/^["']|["']$/g, '')
                : 'default'
            const sizeKey = sizeValue === 'small' || sizeValue === 'large' ? sizeValue : 'default'
            return `var(--timeline-avatar-size-${sizeKey}, 40px)`
        })(),
        '--timeline-avatar-active-bg': `var(${bulletColorVar('avatar', 'active-background')})`,
        '--timeline-avatar-inactive-bg': `var(${bulletColorVar('avatar', 'inactive-background')})`,
        '--timeline-avatar-active-border': `var(${bulletColorVar('avatar', 'active-border-color')})`,
        '--timeline-avatar-inactive-border': `var(${bulletColorVar('avatar', 'inactive-border-color')})`,
        '--timeline-avatar-border-size': `var(${bulletPropVar('avatar', 'border-size')})`,
        '--timeline-avatar-border-radius': `var(${bulletPropVar('avatar', 'border-radius')})`,
        '--timeline-avatar-active-opacity': `var(${bulletPropVar('avatar', 'active-avatar-opacity')})`,
        '--timeline-avatar-inactive-opacity': `var(${bulletPropVar('avatar', 'inactive-avatar-opacity')})`,

        // Text colors (from Timeline parent)
        '--timeline-active-title-color': `var(${timelineColorVar('active-title-color')})`,
        '--timeline-inactive-title-color': `var(${timelineColorVar('inactive-title-color')})`,
        '--timeline-active-description-color': `var(${timelineColorVar('active-description-color')})`,
        '--timeline-inactive-description-color': `var(${timelineColorVar('inactive-description-color')})`,
        '--timeline-active-timestamp-color': `var(${timelineColorVar('active-timestamp-color')})`,
        '--timeline-inactive-timestamp-color': `var(${timelineColorVar('inactive-timestamp-color')})`,

        // Spacing (from Timeline parent)
        '--timeline-bullet-content-gap': `var(${timelinePropVar('bullet-content-gap')})`,
        '--timeline-max-text-width': `var(${timelinePropVar('max-text-width')})`,
        '--timeline-title-description-gap': `var(${timelinePropVar('title-description-gap')})`,
        '--timeline-description-timestamp-gap': `var(${timelinePropVar('description-timestamp-gap')})`,

        // Title text style
        '--timeline-title-font-family': `var(${titleFontFamilyVar})`,
        '--timeline-title-font-size': `var(${titleFontSizeVar})`,
        '--timeline-title-font-weight': `var(${titleFontWeightVar})`,
        '--timeline-title-letter-spacing': `var(${titleLetterSpacingVar})`,
        '--timeline-title-line-height': `var(${titleLineHeightVar})`,
        '--timeline-title-text-decoration': `var(${titleTextDecorationVar})`,
        '--timeline-title-text-transform': `var(${titleTextTransformVar})`,
        '--timeline-title-font-style': `var(${titleFontStyleVar})`,

        // Value text style
        '--timeline-description-font-family': `var(${descriptionFontFamilyVar})`,
        '--timeline-description-font-size': `var(${descriptionFontSizeVar})`,
        '--timeline-description-font-weight': `var(${descriptionFontWeightVar})`,
        '--timeline-description-letter-spacing': `var(${descriptionLetterSpacingVar})`,
        '--timeline-description-line-height': `var(${descriptionLineHeightVar})`,
        '--timeline-description-text-decoration': `var(${descriptionTextDecorationVar})`,
        '--timeline-description-text-transform': `var(${descriptionTextTransformVar})`,
        '--timeline-description-font-style': `var(${descriptionFontStyleVar})`,

        // Timestamp text style
        '--timeline-timestamp-font-family': `var(${timestampFontFamilyVar})`,
        '--timeline-timestamp-font-size': `var(${timestampFontSizeVar})`,
        '--timeline-timestamp-font-weight': `var(${timestampFontWeightVar})`,
        '--timeline-timestamp-letter-spacing': `var(${timestampLetterSpacingVar})`,
        '--timeline-timestamp-line-height': `var(${timestampLineHeightVar})`,
        '--timeline-timestamp-text-decoration': `var(${timestampTextDecorationVar})`,
        '--timeline-timestamp-text-transform': `var(${timestampTextTransformVar})`,
        '--timeline-timestamp-font-style': `var(${timestampFontStyleVar})`,
    }

    const rootStyle = { ...cssVars, ...style } as React.CSSProperties

    return (
        <MantineTimeline
            active={active}
            align={align}
            className={`recursica-timeline ${className || ''}`}
            style={rootStyle as React.CSSProperties}
            {...(mantine || {})}
        >
            {items?.map((item, index) => (
                <MantineTimeline.Item
                    key={index}
                    title={item.title}
                    bullet={item.bullet}
                    lineVariant={item.lineVariant}
                >
                    {item.description && (
                        <div className="recursica-timeline-description">
                            {item.description}
                        </div>
                    )}
                    {item.timestamp && (
                        <div className="recursica-timeline-timestamp">
                            {item.timestamp}
                        </div>
                    )}
                </MantineTimeline.Item>
            ))}
            {children}
        </MantineTimeline>
    )
}
