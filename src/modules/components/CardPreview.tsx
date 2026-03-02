import { useEffect, useState } from 'react'
import { Button } from '../../components/adapters/Button'
import { Badge } from '../../components/adapters/Badge'
import { Group } from '@mantine/core'
import { getComponentLevelCssVar } from '../../components/utils/cssVarNames'
import { useThemeMode } from '../../modules/theme/ThemeModeContext'
import { getLayerElevationBoxShadow } from '../../components/utils/brandCssVars'
import { getCardElevationLayer } from '../../components/adapters/Card'
import { readCssVar } from '../../core/css/readCssVar'
import type { ComponentLayer } from '../../components/registry/types'

interface CardPreviewProps {
    selectedVariants: Record<string, string>
    selectedLayer: string
}

// ─── Goblin-themed content ───────────────────────────────────────────────────

const goblinChapter = "After his legendary leap, Zog the goblin found himself standing at the edge of the Crystalline Abyss—a vast chasm where the walls shimmered with veins of raw amethyst and moonstone. The air hummed with an ancient resonance, as if the mountain itself was breathing."

const goblinParagraph2 = "\"Down, then,\" Zog muttered, tightening the straps of his obsidian gauntlets. He had not come this far—past the sleeping wyrm, through the Thornroot Maze, and over the lazy dwarf—to turn back now."


const shopDescription = "Grindlefax's Emporium has served adventurers for three hundred years. From enchanted compasses that always point to treasure, to ancient maps inked in dragon blood—if it exists, Grindlefax hoards it."

const potionDescription = "Brewed from deepwell moonstone and crystallized wyrm breath. Grants the drinker darkvision for twelve hours and an unsettling ability to taste colours."

export default function CardPreview({
    selectedVariants,
    selectedLayer,
}: CardPreviewProps) {
    const { mode } = useThemeMode()
    const [updateKey, setUpdateKey] = useState(0)

    // Listen for CSS variable updates to force re-render
    useEffect(() => {
        const handler = () => setUpdateKey((k) => k + 1)
        window.addEventListener('cssVarsUpdated', handler as any)

        const observer = new MutationObserver(() => {
            setUpdateKey((k) => k + 1)
        })
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['style'],
        })

        return () => {
            window.removeEventListener('cssVarsUpdated', handler as any)
            observer.disconnect()
        }
    }, [])

    const containerLayer = selectedLayer as ComponentLayer

    // The card always sits one layer above its container
    const cardLayer = getCardElevationLayer(containerLayer)

    // UIKit per-layer CSS vars (reference brand layer props by default, overridable)
    const bgVar = getComponentLevelCssVar('Card', `colors.${containerLayer}.background`)
    const headerBgVar = getComponentLevelCssVar('Card', `colors.${containerLayer}.header-background`)
    const footerBgVar = getComponentLevelCssVar('Card', `colors.${containerLayer}.footer-background`)
    const borderColorVar = getComponentLevelCssVar('Card', `colors.${containerLayer}.border-color`)
    const dividerColorVar = getComponentLevelCssVar('Card', `colors.${containerLayer}.divider-color`)
    const titleColorVar = getComponentLevelCssVar('Card', `colors.${containerLayer}.title`)
    const contentColorVar = getComponentLevelCssVar('Card', `colors.${containerLayer}.content`)
    const borderSizeVar = getComponentLevelCssVar('Card', `borders.${containerLayer}.border-size`)
    const borderRadiusVar = getComponentLevelCssVar('Card', `borders.${containerLayer}.border-radius`)

    // Elevation from the brand layer system (next layer up)
    const elevationBoxShadow = getLayerElevationBoxShadow(mode, cardLayer)

    // Card-specific UIKit properties (internal layout, not per-layer)
    const paddingVar = getComponentLevelCssVar('Card', 'padding')
    const headerPaddingVar = getComponentLevelCssVar('Card', 'header-padding')
    const footerPaddingVar = getComponentLevelCssVar('Card', 'footer-padding')
    const sectionGapVar = getComponentLevelCssVar('Card', 'section-gap')
    const verticalGutterVar = getComponentLevelCssVar('Card', 'vertical-gutter')
    const dividerSizeVar = getComponentLevelCssVar('Card', 'divider-size')
    const minWidthVar = getComponentLevelCssVar('Card', 'min-width')
    const maxWidthVar = getComponentLevelCssVar('Card', 'max-width')

    const headerStyleVar = getComponentLevelCssVar('Card', 'header-style')
    const headerStyleValue = readCssVar(headerStyleVar) || 'h3'

    // ─── Shared styles ───────────────────────────────────────────────────────

    const headerStyle = {
        color: `var(${titleColorVar})`,
        fontFamily: `var(--recursica-brand-typography-${headerStyleValue}-font-family)`,
        fontSize: `var(--recursica-brand-typography-${headerStyleValue}-font-size)`,
        fontWeight: `var(--recursica-brand-typography-${headerStyleValue}-font-weight)`,
        letterSpacing: `var(--recursica-brand-typography-${headerStyleValue}-letter-spacing)`,
        lineHeight: `var(--recursica-brand-typography-${headerStyleValue}-line-height)`,
        fontStyle: `var(--recursica-brand-typography-${headerStyleValue}-font-style)`,
        textDecoration: 'none',
        textTransform: `var(--recursica-brand-typography-${headerStyleValue}-text-transform)`,
        display: 'block',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        paddingBottom: '0.15em',
        minWidth: 0,
        flex: 1,
    } as any

    const bodyStyle = {
        color: `var(${contentColorVar})`,
        fontFamily: 'var(--recursica-brand-typography-body-font-family)',
        fontSize: 'var(--recursica-brand-typography-body-font-size)',
        fontWeight: 'var(--recursica-brand-typography-body-font-weight)',
        lineHeight: 'var(--recursica-brand-typography-body-line-height)',
        letterSpacing: 'var(--recursica-brand-typography-body-letter-spacing)',
    } as React.CSSProperties

    // Card container base style — uses UIKit per-layer CSS vars
    const cardBase: React.CSSProperties = {
        background: `var(${bgVar})`,
        border: `var(${borderSizeVar}, 1px) solid var(${borderColorVar})`,
        borderRadius: `var(${borderRadiusVar})`,
        boxShadow: elevationBoxShadow || 'none',
        color: `var(${contentColorVar})`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
    }

    // Divider color uses the layer divider color var
    const dividerStyle = `var(${dividerSizeVar}) solid var(${dividerColorVar})`

    // ─── Card 1: Full-featured article card ──────────────────────────────────

    const articleCard = (
        <div key={`${updateKey}-article-${containerLayer}`} style={{ ...cardBase, minWidth: `var(${minWidthVar})`, maxWidth: `var(${maxWidthVar})`, width: '100%' }}>
            {/* Header */}
            <div style={{
                padding: `var(${headerPaddingVar})`,
                background: `var(${headerBgVar})`,
                borderBottom: dividerStyle,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <span style={headerStyle}>The Crystalline Abyss</span>
                <Badge layer={cardLayer}>Chapter 4</Badge>
            </div>

            {/* Edge-to-edge image section */}
            <div style={{
                borderBottom: dividerStyle,
                lineHeight: 0,
            }}>
                <img
                    src="/card-preview-goblin.png"
                    alt="Zog at the Crystalline Abyss"
                    style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '220px', objectFit: 'cover' }}
                />
            </div>

            {/* Body */}
            <div style={{
                padding: `var(${paddingVar})`,
                display: 'flex',
                flexDirection: 'column',
                gap: `var(${sectionGapVar})`,
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--recursica-brand-dimensions-general-md)', ...bodyStyle }}>
                    <p style={{ margin: 0 }}>{goblinChapter}</p>
                    <p style={{ margin: 0 }}>{goblinParagraph2}</p>
                </div>
            </div>

            {/* Footer */}
            <div style={{
                padding: `var(${footerPaddingVar})`,
                background: `var(${footerBgVar})`,
                borderTop: dividerStyle,
            }}>
                <Group justify="flex-end" gap="var(--recursica-brand-dimensions-general-md)">
                    <Button variant="text" layer={cardLayer}>Previous</Button>
                    <Button variant="solid" layer={cardLayer}>Continue Reading</Button>
                </Group>
            </div>
        </div>
    )

    // ─── Card 2: Simple product/item card (image + text + CTA) ───────────────

    const simpleCard = (
        <div key={`${updateKey}-simple-${containerLayer}`} style={{ ...cardBase, minWidth: `var(${minWidthVar})`, maxWidth: `var(${maxWidthVar})`, width: '100%' }}>
            {/* Edge-to-edge image at top */}
            <div style={{ lineHeight: 0 }}>
                <img
                    src="/card-preview-potion.png"
                    alt="Elixir of Deepwell Sight"
                    style={{ width: '100%', height: '180px', display: 'block', objectFit: 'cover' }}
                />
            </div>

            {/* Title + badge row */}
            <div style={{
                padding: `var(${paddingVar})`,
                display: 'flex',
                flexDirection: 'column',
                gap: `var(${verticalGutterVar})`,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: `var(${verticalGutterVar})`, minWidth: 0 }}>
                    <span style={{ ...headerStyle, fontSize: 'var(--recursica-brand-typography-h4-font-size)' }}>
                        Elixir of Deepwell Sight
                    </span>
                    <Badge layer={cardLayer}>Rare</Badge>
                </div>
                <div style={{ ...bodyStyle }}>
                    <p style={{ margin: 0 }}>{potionDescription}</p>
                </div>
                <Button variant="solid" layer={cardLayer}>
                    Add to Inventory
                </Button>
            </div>
        </div>
    )

    // ─── Card 3: Compact text-only card (no image) ───────────────────────────

    const textCard = (
        <div key={`${updateKey}-text-${containerLayer}`} style={{ ...cardBase, minWidth: `var(${minWidthVar})`, maxWidth: `var(${maxWidthVar})`, width: '100%' }}>
            <div style={{
                padding: `var(${paddingVar})`,
                display: 'flex',
                flexDirection: 'column',
                gap: `var(${verticalGutterVar})`,
            }}>
                <span style={{ ...headerStyle, fontSize: 'var(--recursica-brand-typography-h4-font-size)' }}>
                    Grindlefax's Emporium
                </span>
                <div style={bodyStyle}>
                    <p style={{ margin: 0 }}>{shopDescription}</p>
                </div>
            </div>
            {/* Edge-to-edge image at bottom */}
            <div style={{ lineHeight: 0, marginTop: 'auto' }}>
                <img
                    src="/card-preview-shop.png"
                    alt="Grindlefax's Emporium interior"
                    style={{ width: '100%', height: '160px', display: 'block', objectFit: 'cover', borderRadius: `0 0 var(${borderRadiusVar}) var(${borderRadiusVar})` }}
                />
            </div>
        </div>
    )

    // ─── Layout: article card on top, two smaller cards below ────────────────

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--recursica-brand-dimensions-general-xl)',
            width: '100%',
            padding: 'var(--recursica-brand-dimensions-general-xl)',
        }}>
            {articleCard}
            {simpleCard}
            {textCard}
        </div>
    )
}
