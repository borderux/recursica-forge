/**
 * Loader Preview Component
 * 
 * Shows all three loader types (oval, bars, dots) at each size (small, default, large)
 * in the component detail preview, with properly styled H2 headings.
 * The Mantine implementation renders all sizes internally, so we just render the
 * loader once. The H2 headings are rendered by the component itself.
 */

import { Loader } from '../../components/adapters/Loader'

const h2Style: React.CSSProperties = {
    margin: 0,
    fontFamily: 'var(--recursica-brand-typography-h2-font-family)',
    fontSize: 'var(--recursica-brand-typography-h2-font-size)',
    fontWeight: 'var(--recursica-brand-typography-h2-font-weight)',
    letterSpacing: 'var(--recursica-brand-typography-h2-font-letter-spacing)',
    lineHeight: 'var(--recursica-brand-typography-h2-line-height)',
}

interface LoaderPreviewProps {
    selectedVariants: Record<string, string>
    selectedLayer: string
    componentElevation?: string
}

export default function LoaderPreview({
    selectedVariants,
    selectedLayer,
    componentElevation,
}: LoaderPreviewProps) {
    const sizes = [
        { key: 'small', label: 'Small' },
        { key: 'default', label: 'Default' },
        { key: 'large', label: 'Large' },
    ] as const

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--recursica-brand-dimensions-gutters-vertical)',
            alignItems: 'center',
            width: '100%',
        }}>
            {sizes.map(({ key, label }) => (
                <div
                    key={key}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--recursica-brand-dimensions-gutters-vertical)',
                        alignItems: 'center',
                    }}
                >
                    <h2 style={h2Style}>{label}</h2>
                    <Loader size={key} />
                </div>
            ))}
        </div>
    )
}
