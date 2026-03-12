/**
 * Timeline Preview Component
 *
 * Display-only preview showing left-aligned and right-aligned timelines
 * side by side. Each item uses a different bullet type:
 *   1. Default (dot)
 *   2. Icon
 *   3. Icon-alternative (ThemeIcon)
 *   4. Avatar
 *
 * Bullet props now come from the TimelineBullet subcomponent in recursica_ui-kit.json.
 */

import { useState, useEffect } from 'react'
import { Timeline as MantineTimeline, ThemeIcon, Avatar as MantineAvatar } from '@mantine/core'
import { buildComponentCssVarPath, getComponentTextCssVar } from '../../components/utils/cssVarNames'
import { iconNameToReactComponent } from './iconUtils'
import '../../components/adapters/mantine/Timeline/Timeline.css'

interface TimelinePreviewProps {
    selectedVariants: Record<string, string>
    selectedLayer: string
    componentElevation?: string
}

type PreviewItem = {
    title: string
    description: string
    timestamp: string
}

const LEFT_ITEMS: PreviewItem[] = [
    {
        title: 'Discovery of the Ancient Forge',
        description: 'Deep in the mountain caverns, a goblin scout uncovered the legendary forge of the Iron King.',
        timestamp: '3 moons ago',
    },
    {
        title: 'Binding the Fire Crystal',
        description: 'The master goblin smith channeled the crystal\'s energy into the forge\'s dormant hearth.',
        timestamp: '2 moons ago',
    },
    {
        title: 'Forging the Runic Blade',
        description: 'Hammered through three nights under starlight, the blade took shape.',
        timestamp: '1 moon ago',
    },
    {
        title: 'Enchantment of the Hilt',
        description: 'Ancient runes were etched into the hilt by the clan elder.',
        timestamp: '2 sunsets ago',
    },
    {
        title: 'Tempering in Dragon Fire',
        description: 'The blade was plunged into the last remaining dragonfire pit beneath the mountain.',
        timestamp: 'Yesterday',
    },
    {
        title: 'Polishing with Moonstone Dust',
        description: 'A fine layer of crushed moonstone was rubbed along the edge for arcane sharpness.',
        timestamp: 'This morning',
    },
    {
        title: 'Wrapping the Grip',
        description: 'Wyvern leather was carefully wound around the hilt for a sure grip.',
        timestamp: 'This afternoon',
    },
    {
        title: 'Final Inspection',
        description: 'The clan elder performed the ritual of verification on the completed weapon.',
        timestamp: 'Just now',
    },
]

const RIGHT_ITEMS: PreviewItem[] = [
    {
        title: 'The Mushroom Harvest',
        description: 'A bountiful crop of glowing cave mushrooms was gathered for the feast.',
        timestamp: 'Last quarter moon',
    },
    {
        title: 'Brewing the Elixir',
        description: 'The shaman combined rare fungi with moonstone dust in the great cauldron.',
        timestamp: '3 dawns ago',
    },
    {
        title: 'Testing on Volunteers',
        description: 'Three brave goblins sampled the elixir and reported heightened senses.',
        timestamp: '2 dawns ago',
    },
    {
        title: 'Distribution to the Clan',
        description: 'The finished elixir was distributed across all warrens of the mountain.',
        timestamp: 'This dawn',
    },
    {
        title: 'Gathering Feedback',
        description: 'Scouts returned with reports from each warren on the elixir\'s effectiveness.',
        timestamp: 'Yesterday',
    },
    {
        title: 'Refining the Recipe',
        description: 'The shaman adjusted the ratios based on the feedback from the clan members.',
        timestamp: 'This morning',
    },
    {
        title: 'Second Batch Preparation',
        description: 'Fresh ingredients were prepared for the improved version of the elixir.',
        timestamp: 'This afternoon',
    },
    {
        title: 'Storage and Preservation',
        description: 'The completed elixir was sealed in enchanted vials for long-term storage.',
        timestamp: 'Just now',
    },
]

/**
 * Helper to build a CSS var path for a bullet variant's color property.
 * Path: TimelineBullet > variants > types > {variant} > properties > colors > {layer} > {prop}
 */
function bulletColorVar(variant: string, layer: string, prop: string) {
    return buildComponentCssVarPath('TimelineBullet', 'variants', 'types', variant, 'properties', 'colors', layer, prop)
}

/**
 * Helper to build a CSS var path for a bullet variant's dimension property.
 * Path: TimelineBullet > variants > types > {variant} > properties > {prop}
 */
function bulletPropVar(variant: string, prop: string) {
    return buildComponentCssVarPath('TimelineBullet', 'variants', 'types', variant, 'properties', prop)
}

function buildCssVars(layer: string) {
    // Timeline (parent) vars — connector, text colors, spacing, text styles
    const timelineColorVar = (prop: string) =>
        buildComponentCssVarPath('Timeline', 'properties', 'colors', layer, prop)
    const timelinePropVar = (prop: string) =>
        buildComponentCssVarPath('Timeline', 'properties', prop)
    const textVar = (group: string, prop: string) =>
        getComponentTextCssVar('Timeline', group, prop)

    return {
        // Connector
        '--timeline-active-connector-color': `var(${timelineColorVar('active-connector-color')})`,
        '--timeline-inactive-connector-color': `var(${timelineColorVar('inactive-connector-color')})`,
        '--timeline-active-connector-size': `var(${timelinePropVar('active-connector-size')})`,
        '--timeline-inactive-connector-size': `var(${timelinePropVar('inactive-connector-size')})`,

        // Default bullet (from TimelineBullet > variants > types > default)
        '--timeline-default-active-bullet-bg': `var(${bulletColorVar('default', layer, 'active-background')})`,
        '--timeline-default-active-bullet-border': `var(${bulletColorVar('default', layer, 'active-border-color')})`,
        '--timeline-default-inactive-bullet-bg': `var(${bulletColorVar('default', layer, 'inactive-background')})`,
        '--timeline-default-inactive-bullet-border': `var(${bulletColorVar('default', layer, 'inactive-border-color')})`,
        '--timeline-default-bullet-size': `var(${bulletPropVar('default', 'bullet-size')})`,
        '--timeline-default-bullet-border-size': `var(${bulletPropVar('default', 'border-size')})`,
        '--timeline-default-bullet-border-radius': `var(${bulletPropVar('default', 'border-radius')})`,

        // Icon bullet (from TimelineBullet > variants > types > icon)
        '--timeline-icon-active-icon-color': `var(${bulletColorVar('icon', layer, 'active-icon-color')})`,
        '--timeline-icon-active-bullet-bg': `var(${bulletColorVar('icon', layer, 'active-background')})`,
        '--timeline-icon-active-bullet-border': `var(${bulletColorVar('icon', layer, 'active-border-color')})`,
        '--timeline-icon-inactive-icon-color': `var(${bulletColorVar('icon', layer, 'inactive-icon-color')})`,
        '--timeline-icon-inactive-bullet-bg': `var(${bulletColorVar('icon', layer, 'inactive-background')})`,
        '--timeline-icon-inactive-bullet-border': `var(${bulletColorVar('icon', layer, 'inactive-border-color')})`,
        '--timeline-icon-bullet-size': `var(${bulletPropVar('icon', 'bullet-size')})`,
        '--timeline-icon-icon-size': `var(${bulletPropVar('icon', 'icon-size')})`,
        '--timeline-icon-bullet-border-size': `var(${bulletPropVar('icon', 'border-size')})`,
        '--timeline-icon-bullet-border-radius': `var(${bulletPropVar('icon', 'border-radius')})`,

        // Icon-alternative bullet (from TimelineBullet > variants > types > icon-alternative)
        '--timeline-icon-alt-active-icon-color': `var(${bulletColorVar('icon-alternative', layer, 'active-icon-color')})`,
        '--timeline-icon-alt-active-bullet-bg': `var(${bulletColorVar('icon-alternative', layer, 'active-background')})`,
        '--timeline-icon-alt-inactive-icon-color': `var(${bulletColorVar('icon-alternative', layer, 'inactive-icon-color')})`,
        '--timeline-icon-alt-inactive-bullet-bg': `var(${bulletColorVar('icon-alternative', layer, 'inactive-background')})`,
        '--timeline-icon-alt-active-bullet-border': `var(${bulletColorVar('icon-alternative', layer, 'active-border-color')})`,
        '--timeline-icon-alt-inactive-bullet-border': `var(${bulletColorVar('icon-alternative', layer, 'inactive-border-color')})`,
        '--timeline-icon-alt-bullet-size': `var(${bulletPropVar('icon-alternative', 'bullet-size')})`,
        '--timeline-icon-alt-icon-size': `var(${bulletPropVar('icon-alternative', 'icon-size')})`,
        '--timeline-icon-alt-bullet-border-size': `var(${bulletPropVar('icon-alternative', 'border-size')})`,
        '--timeline-icon-alt-bullet-border-radius': `var(${bulletPropVar('icon-alternative', 'border-radius')})`,

        // Avatar bullet (from TimelineBullet > variants > types > avatar)
        // Avatar size resolves through Avatar component's sizes variants (small/default/large)
        '--timeline-avatar-size-small': `var(${buildComponentCssVarPath('Avatar', 'variants', 'sizes', 'small', 'properties', 'size')}, 32px)`,
        '--timeline-avatar-size-default': `var(${buildComponentCssVarPath('Avatar', 'variants', 'sizes', 'default', 'properties', 'size')}, 40px)`,
        '--timeline-avatar-size-large': `var(${buildComponentCssVarPath('Avatar', 'variants', 'sizes', 'large', 'properties', 'size')}, 64px)`,
        '--timeline-avatar-bullet-size': (() => {
            const sizeVarName = bulletPropVar('avatar', 'avatar-size')
            const sizeValue = typeof document !== 'undefined'
                ? getComputedStyle(document.documentElement).getPropertyValue(sizeVarName).trim().replace(/^["']|["']$/g, '')
                : 'default'
            const sizeKey = sizeValue === 'small' || sizeValue === 'large' ? sizeValue : 'default'
            return `var(--timeline-avatar-size-${sizeKey}, 40px)`
        })(),
        '--timeline-avatar-active-bg': `var(${bulletColorVar('avatar', layer, 'active-background')})`,
        '--timeline-avatar-inactive-bg': `var(${bulletColorVar('avatar', layer, 'inactive-background')})`,
        '--timeline-avatar-active-border': `var(${bulletColorVar('avatar', layer, 'active-border-color')})`,
        '--timeline-avatar-inactive-border': `var(${bulletColorVar('avatar', layer, 'inactive-border-color')})`,
        '--timeline-avatar-border-size': `var(${bulletPropVar('avatar', 'border-size')})`,
        '--timeline-avatar-border-radius': `var(${bulletPropVar('avatar', 'border-radius')})`,
        '--timeline-avatar-active-opacity': `var(${bulletPropVar('avatar', 'active-avatar-opacity')})`,
        '--timeline-avatar-inactive-opacity': `var(${bulletPropVar('avatar', 'inactive-avatar-opacity')})`,

        // Text colors (from parent timeline)
        '--timeline-active-title-color': `var(${timelineColorVar('active-title-color')})`,
        '--timeline-inactive-title-color': `var(${timelineColorVar('inactive-title-color')})`,
        '--timeline-active-description-color': `var(${timelineColorVar('active-description-color')})`,
        '--timeline-inactive-description-color': `var(${timelineColorVar('inactive-description-color')})`,
        '--timeline-active-timestamp-color': `var(${timelineColorVar('active-timestamp-color')})`,
        '--timeline-inactive-timestamp-color': `var(${timelineColorVar('inactive-timestamp-color')})`,

        // Spacing
        '--timeline-bullet-content-gap': `var(${timelinePropVar('bullet-content-gap')})`,
        '--timeline-max-text-width': `var(${timelinePropVar('max-text-width')})`,
        '--timeline-title-description-gap': `var(${timelinePropVar('title-description-gap')})`,
        '--timeline-description-timestamp-gap': `var(${timelinePropVar('description-timestamp-gap')})`,

        // Text styles
        '--timeline-title-font-family': `var(${textVar('title-text', 'font-family')})`,
        '--timeline-title-font-size': `var(${textVar('title-text', 'font-size')})`,
        '--timeline-title-font-weight': `var(${textVar('title-text', 'font-weight')})`,
        '--timeline-title-letter-spacing': `var(${textVar('title-text', 'letter-spacing')})`,
        '--timeline-title-line-height': `var(${textVar('title-text', 'line-height')})`,
        '--timeline-title-text-decoration': `var(${textVar('title-text', 'text-decoration')})`,
        '--timeline-title-text-transform': `var(${textVar('title-text', 'text-transform')})`,
        '--timeline-title-font-style': `var(${textVar('title-text', 'font-style')})`,
        '--timeline-description-font-family': `var(${textVar('description-text', 'font-family')})`,
        '--timeline-description-font-size': `var(${textVar('description-text', 'font-size')})`,
        '--timeline-description-font-weight': `var(${textVar('description-text', 'font-weight')})`,
        '--timeline-description-letter-spacing': `var(${textVar('description-text', 'letter-spacing')})`,
        '--timeline-description-line-height': `var(${textVar('description-text', 'line-height')})`,
        '--timeline-description-text-decoration': `var(${textVar('description-text', 'text-decoration')})`,
        '--timeline-description-text-transform': `var(${textVar('description-text', 'text-transform')})`,
        '--timeline-description-font-style': `var(${textVar('description-text', 'font-style')})`,
        '--timeline-timestamp-font-family': `var(${textVar('timestamp-text', 'font-family')})`,
        '--timeline-timestamp-font-size': `var(${textVar('timestamp-text', 'font-size')})`,
        '--timeline-timestamp-font-weight': `var(${textVar('timestamp-text', 'font-weight')})`,
        '--timeline-timestamp-letter-spacing': `var(${textVar('timestamp-text', 'letter-spacing')})`,
        '--timeline-timestamp-line-height': `var(${textVar('timestamp-text', 'line-height')})`,
        '--timeline-timestamp-text-decoration': `var(${textVar('timestamp-text', 'text-decoration')})`,
        '--timeline-timestamp-text-transform': `var(${textVar('timestamp-text', 'text-transform')})`,
        '--timeline-timestamp-font-style': `var(${textVar('timestamp-text', 'font-style')})`,
    } as Record<string, string>
}

/**
 * Build the bullet React node for a given index.
 * Index 0 = default (no bullet), 1 = icon, 2 = icon-alternative, 3 = avatar
 */
function useBullets() {
    const StarIcon = iconNameToReactComponent('star')
    const CheckIcon = iconNameToReactComponent('check')
    const BellIcon = iconNameToReactComponent('bell')
    const HeartIcon = iconNameToReactComponent('heart')
    const WarningIcon = iconNameToReactComponent('warning')
    const InfoIcon = iconNameToReactComponent('info')

    // Cycle: default, icon, hc, avatar × 2
    const leftBullets = [
        undefined, // default dot
        StarIcon ? <StarIcon size={14} /> : undefined, // icon
        <ThemeIcon size={28} radius="xl" variant="filled" className="recursica-timeline-icon-alt-bullet">
            {CheckIcon ? <CheckIcon size={14} /> : null}
        </ThemeIcon>, // icon-alt
        <div className="recursica-timeline-avatar-container">
            <MantineAvatar size={32} radius="xl" src="/goblin-avatar-smith.png" className="recursica-timeline-avatar-bullet" />
        </div>, // avatar
        undefined, // default dot
        BellIcon ? <BellIcon size={14} /> : undefined, // icon
        <ThemeIcon size={28} radius="xl" variant="filled" className="recursica-timeline-icon-alt-bullet">
            {WarningIcon ? <WarningIcon size={14} /> : null}
        </ThemeIcon>, // icon-alt
        <div className="recursica-timeline-avatar-container">
            <MantineAvatar size={32} radius="xl" src="/goblin-avatar-elder.png" className="recursica-timeline-avatar-bullet" />
        </div>, // avatar
    ]

    const rightBullets = [
        undefined,
        BellIcon ? <BellIcon size={14} /> : undefined,
        <ThemeIcon size={28} radius="xl" variant="filled" className="recursica-timeline-icon-alt-bullet">
            {HeartIcon ? <HeartIcon size={14} /> : null}
        </ThemeIcon>,
        <div className="recursica-timeline-avatar-container">
            <MantineAvatar size={32} radius="xl" src="/goblin-avatar-shaman.png" className="recursica-timeline-avatar-bullet" />
        </div>,
        undefined,
        InfoIcon ? <InfoIcon size={14} /> : undefined,
        <ThemeIcon size={28} radius="xl" variant="filled" className="recursica-timeline-icon-alt-bullet">
            {StarIcon ? <StarIcon size={14} /> : null}
        </ThemeIcon>,
        <div className="recursica-timeline-avatar-container">
            <MantineAvatar size={32} radius="xl" src="/goblin-avatar-scout.png" className="recursica-timeline-avatar-bullet" />
        </div>,
    ]

    return { leftBullets, rightBullets }
}

export default function TimelinePreview({
    selectedVariants,
    selectedLayer,
    componentElevation,
}: TimelinePreviewProps) {
    const [updateKey, setUpdateKey] = useState(0)

    useEffect(() => {
        const handleCssVarUpdate = () => setUpdateKey(k => k + 1)
        window.addEventListener('cssVarsUpdated', handleCssVarUpdate)
        return () => window.removeEventListener('cssVarsUpdated', handleCssVarUpdate)
    }, [])

    const cssVars = buildCssVars(selectedLayer)
    const { leftBullets, rightBullets } = useBullets()

    const h2Style = {
        margin: 0,
        marginBottom: 12,
        fontFamily: 'var(--recursica-brand-typography-h2-font-family)',
        fontSize: 'var(--recursica-brand-typography-h2-font-size)',
        fontWeight: 'var(--recursica-brand-typography-h2-font-weight)',
        letterSpacing: 'var(--recursica-brand-typography-h2-font-letter-spacing)',
        lineHeight: 'var(--recursica-brand-typography-h2-line-height)',
    } as React.CSSProperties

    return (
        <div
            key={updateKey}
            style={{
                display: 'flex',
                gap: '48px',
                width: '100%',
                justifyContent: 'space-between',
                padding: '16px',
                alignItems: 'flex-start',
            }}
        >
            {/* Left-aligned timeline */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={h2Style}>Left aligned</h2>
                <MantineTimeline
                    active={3}
                    align="left"
                    className="recursica-timeline"
                    style={cssVars as React.CSSProperties}
                >
                    {LEFT_ITEMS.map((item, i) => (
                        <MantineTimeline.Item
                            key={i}
                            title={item.title}
                            bullet={leftBullets[i]}
                        >
                            <div className="recursica-timeline-description">{item.description}</div>
                            <div className="recursica-timeline-timestamp">{item.timestamp}</div>
                        </MantineTimeline.Item>
                    ))}
                </MantineTimeline>
            </div>

            {/* Right-aligned timeline */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{ ...h2Style, textAlign: 'right' }}>Right aligned</h2>
                <MantineTimeline
                    active={3}
                    align="right"
                    className="recursica-timeline"
                    style={cssVars as React.CSSProperties}
                >
                    {RIGHT_ITEMS.map((item, i) => (
                        <MantineTimeline.Item
                            key={i}
                            title={item.title}
                            bullet={rightBullets[i]}
                        >
                            <div className="recursica-timeline-description">{item.description}</div>
                            <div className="recursica-timeline-timestamp">{item.timestamp}</div>
                        </MantineTimeline.Item>
                    ))}
                </MantineTimeline>
            </div>
        </div>
    )
}
