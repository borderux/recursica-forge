/**
 * Timeline Bullet Preview Component
 *
 * Dedicated preview for the Timeline Bullet subcomponent.
 * Shows a mini timeline using only the selected bullet variant.
 * The variant selector (default/icon/icon-alternative/avatar) controls
 * which bullet type is displayed.
 */

import { useState, useEffect } from 'react'
import { Timeline as MantineTimeline, ThemeIcon, Avatar as MantineAvatar } from '@mantine/core'
import { buildComponentCssVarPath, getComponentTextCssVar } from '../../components/utils/cssVarNames'
import { iconNameToReactComponent } from './iconUtils'
import '../../components/adapters/mantine/Timeline/Timeline.css'

interface TimelineBulletPreviewProps {
    selectedVariants: Record<string, string>
    selectedLayer: string
    componentElevation?: string
}

type PreviewItem = {
    title: string
    description: string
    timestamp: string
}

const ITEMS: PreviewItem[] = [
    {
        title: 'Active',
        description: '',
        timestamp: '',
    },
    {
        title: 'Inactive',
        description: '',
        timestamp: '',
    },
]

/**
 * Build CSS vars for both the bullet subcomponent AND the parent timeline
 * (we need timeline vars for connector, text, and spacing).
 */
function buildCssVars(layer: string, bulletType: string) {
    // Bullet variant color var
    const bulletColorVar = (prop: string) =>
        buildComponentCssVarPath('TimelineBullet', 'variants', 'types', bulletType, 'properties', 'colors', layer, prop)
    // Bullet variant dimension var
    const bulletPropVar = (prop: string) =>
        buildComponentCssVarPath('TimelineBullet', 'variants', 'types', bulletType, 'properties', prop)

    // Timeline (parent) vars for non-bullet props
    const timelineColorVar = (prop: string) =>
        buildComponentCssVarPath('Timeline', 'properties', 'colors', layer, prop)
    const timelinePropVar = (prop: string) =>
        buildComponentCssVarPath('Timeline', 'properties', prop)
    const textVar = (group: string, prop: string) =>
        getComponentTextCssVar('Timeline', group, prop)

    const baseVars: Record<string, string> = {
        // Connector (from parent timeline)
        '--timeline-active-connector-color': `var(${timelineColorVar('active-connector-color')})`,
        '--timeline-inactive-connector-color': `var(${timelineColorVar('inactive-connector-color')})`,
        '--timeline-active-connector-size': `var(${timelinePropVar('active-connector-size')})`,
        '--timeline-inactive-connector-size': `var(${timelinePropVar('inactive-connector-size')})`,
        // Spacing (from parent timeline)
        '--timeline-bullet-content-gap': `var(${timelinePropVar('bullet-content-gap')})`,
        '--timeline-max-text-width': `var(${timelinePropVar('max-text-width')})`,
        // Text colors (from parent timeline)
        '--timeline-active-title-color': `var(${timelineColorVar('active-title-color')})`,
        '--timeline-inactive-title-color': `var(${timelineColorVar('inactive-title-color')})`,
        '--timeline-active-description-color': `var(${timelineColorVar('active-description-color')})`,
        '--timeline-inactive-description-color': `var(${timelineColorVar('inactive-description-color')})`,
        '--timeline-active-timestamp-color': `var(${timelineColorVar('active-timestamp-color')})`,
        '--timeline-inactive-timestamp-color': `var(${timelineColorVar('inactive-timestamp-color')})`,
        // Text styles (from parent timeline)
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
    }

    // Now set bullet-type-specific CSS vars based on the selected variant
    if (bulletType === 'default') {
        Object.assign(baseVars, {
            '--_tl-bullet-size': `var(${bulletPropVar('bullet-size')}, 20px)`,
            '--timeline-default-active-bullet-bg': `var(${bulletColorVar('active-background')})`,
            '--timeline-default-active-bullet-border': `var(${bulletColorVar('active-border-color')})`,
            '--timeline-default-inactive-bullet-bg': `var(${bulletColorVar('inactive-background')})`,
            '--timeline-default-inactive-bullet-border': `var(${bulletColorVar('inactive-border-color')})`,
            '--timeline-default-bullet-size': `var(${bulletPropVar('bullet-size')})`,
            '--timeline-default-bullet-border-size': `var(${bulletPropVar('border-size')})`,
            '--timeline-default-bullet-border-radius': `var(${bulletPropVar('border-radius')})`,
        })
    } else if (bulletType === 'icon') {
        Object.assign(baseVars, {
            '--_tl-bullet-size': `var(${bulletPropVar('bullet-size')}, 24px)`,
            '--timeline-icon-active-icon-color': `var(${bulletColorVar('active-icon-color')})`,
            '--timeline-icon-active-bullet-bg': `var(${bulletColorVar('active-background')})`,
            '--timeline-icon-active-bullet-border': `var(${bulletColorVar('active-border-color')})`,
            '--timeline-icon-inactive-icon-color': `var(${bulletColorVar('inactive-icon-color')})`,
            '--timeline-icon-inactive-bullet-bg': `var(${bulletColorVar('inactive-background')})`,
            '--timeline-icon-inactive-bullet-border': `var(${bulletColorVar('inactive-border-color')})`,
            '--timeline-icon-bullet-size': `var(${bulletPropVar('bullet-size')})`,
            '--timeline-icon-icon-size': `var(${bulletPropVar('icon-size')})`,
            '--timeline-icon-bullet-border-size': `var(${bulletPropVar('border-size')})`,
            '--timeline-icon-bullet-border-radius': `var(${bulletPropVar('border-radius')})`,
        })
    } else if (bulletType === 'icon-alternative') {
        Object.assign(baseVars, {
            '--_tl-bullet-size': `var(${bulletPropVar('bullet-size')}, 28px)`,
            '--timeline-icon-alt-active-icon-color': `var(${bulletColorVar('active-icon-color')})`,
            '--timeline-icon-alt-active-bullet-bg': `var(${bulletColorVar('active-background')})`,
            '--timeline-icon-alt-inactive-icon-color': `var(${bulletColorVar('inactive-icon-color')})`,
            '--timeline-icon-alt-inactive-bullet-bg': `var(${bulletColorVar('inactive-background')})`,
            '--timeline-icon-alt-active-bullet-border': `var(${bulletColorVar('active-border-color')})`,
            '--timeline-icon-alt-inactive-bullet-border': `var(${bulletColorVar('inactive-border-color')})`,
            '--timeline-icon-alt-bullet-size': `var(${bulletPropVar('bullet-size')})`,
            '--timeline-icon-alt-icon-size': `var(${bulletPropVar('icon-size')})`,
            '--timeline-icon-alt-bullet-border-size': `var(${bulletPropVar('border-size')})`,
            '--timeline-icon-alt-bullet-border-radius': `var(${bulletPropVar('border-radius')})`,
        })
    } else if (bulletType === 'avatar') {
        // Read the stored avatar-size string and resolve to the correct Avatar size
        const sizeVarName = bulletPropVar('avatar-size')
        const sizeValue = typeof document !== 'undefined'
            ? getComputedStyle(document.documentElement).getPropertyValue(sizeVarName).trim().replace(/^["']|["']$/g, '')
            : 'default'
        const sizeKey = sizeValue === 'small' || sizeValue === 'large' ? sizeValue : 'default'
        const avatarSizeVar = buildComponentCssVarPath('Avatar', 'variants', 'sizes', sizeKey, 'properties', 'size')
        Object.assign(baseVars, {
            '--_tl-bullet-size': `var(${avatarSizeVar}, 40px)`,
            '--timeline-avatar-size-small': `var(${buildComponentCssVarPath('Avatar', 'variants', 'sizes', 'small', 'properties', 'size')}, 32px)`,
            '--timeline-avatar-size-default': `var(${buildComponentCssVarPath('Avatar', 'variants', 'sizes', 'default', 'properties', 'size')}, 40px)`,
            '--timeline-avatar-size-large': `var(${buildComponentCssVarPath('Avatar', 'variants', 'sizes', 'large', 'properties', 'size')}, 64px)`,
            '--timeline-avatar-bullet-size': `var(--timeline-avatar-size-${sizeKey}, 40px)`,
            '--timeline-avatar-active-bg': `var(${bulletColorVar('active-background')})`,
            '--timeline-avatar-inactive-bg': `var(${bulletColorVar('inactive-background')})`,
            '--timeline-avatar-active-border': `var(${bulletColorVar('active-border-color')})`,
            '--timeline-avatar-inactive-border': `var(${bulletColorVar('inactive-border-color')})`,
            '--timeline-avatar-border-size': `var(${bulletPropVar('border-size')})`,
            '--timeline-avatar-border-radius': `var(${bulletPropVar('border-radius')})`,
            '--timeline-avatar-active-opacity': `var(${bulletPropVar('active-avatar-opacity')})`,
            '--timeline-avatar-inactive-opacity': `var(${bulletPropVar('inactive-avatar-opacity')})`,
        })
    }

    return baseVars
}

/**
 * Returns an array of bullet React nodes for the selected bullet type.
 */
function useBullets(bulletType: string) {
    const StarIcon = iconNameToReactComponent('star')
    const CheckIcon = iconNameToReactComponent('check')

    if (bulletType === 'default') {
        // Default: no custom bullet (Mantine renders a dot)
        return [undefined, undefined]
    }

    if (bulletType === 'icon') {
        return [
            StarIcon ? <StarIcon size={14} /> : undefined,
            CheckIcon ? <CheckIcon size={14} /> : undefined,
        ]
    }

    if (bulletType === 'icon-alternative') {
        return [
            <ThemeIcon size={28} radius="xl" variant="filled" className="recursica-timeline-icon-alt-bullet">
                {StarIcon ? <StarIcon size={14} /> : null}
            </ThemeIcon>,
            <ThemeIcon size={28} radius="xl" variant="filled" className="recursica-timeline-icon-alt-bullet">
                {CheckIcon ? <CheckIcon size={14} /> : null}
            </ThemeIcon>,
        ]
    }

    if (bulletType === 'avatar') {
        return [
            <div className="recursica-timeline-avatar-container">
                <MantineAvatar size={32} radius="xl" src="/goblin-avatar-smith.png" className="recursica-timeline-avatar-bullet" />
            </div>,
            <div className="recursica-timeline-avatar-container">
                <MantineAvatar size={32} radius="xl" src="/goblin-avatar-elder.png" className="recursica-timeline-avatar-bullet" />
            </div>,
        ]
    }

    return [undefined, undefined]
}

export default function TimelineBulletPreview({
    selectedVariants,
    selectedLayer,
    componentElevation,
}: TimelineBulletPreviewProps) {
    const [updateKey, setUpdateKey] = useState(0)

    useEffect(() => {
        const handleCssVarUpdate = () => setUpdateKey(k => k + 1)
        window.addEventListener('cssVarsUpdated', handleCssVarUpdate)
        return () => window.removeEventListener('cssVarsUpdated', handleCssVarUpdate)
    }, [])

    const bulletType = selectedVariants?.types || 'default'
    const cssVars = buildCssVars(selectedLayer, bulletType)
    const bullets = useBullets(bulletType)

    return (
        <div
            key={updateKey}
            style={{
                display: 'flex',
                justifyContent: 'flex-start',
                padding: '16px',
                alignItems: 'flex-start',
            }}
        >
            <MantineTimeline
                active={0}
                align="left"
                className="recursica-timeline"
                style={cssVars as React.CSSProperties}
            >
                {ITEMS.map((item, i) => (
                    <MantineTimeline.Item
                        key={i}
                        title={item.title}
                        bullet={bullets[i]}
                    >
                        {item.description && (
                            <div className="recursica-timeline-description">{item.description}</div>
                        )}
                        {item.timestamp && (
                            <div className="recursica-timeline-timestamp">{item.timestamp}</div>
                        )}
                    </MantineTimeline.Item>
                ))}
            </MantineTimeline>
        </div>
    )
}
