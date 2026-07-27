/**
 * Loader Preview Component
 * 
 * Shows all three loader types (oval, bars, dots) at each size (small, default, large)
 * in the component detail preview, with properly styled H2 headings.
 * The Mantine implementation renders all sizes internally, so we just render the
 * loader once. The H2 headings are rendered by the component itself.
 */

import { Loader } from '../../components/adapters/Loader'
import { h2Style } from './typographyStyles'




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
    // Read the currently-selected size variant so custom variants mount and
    // reflect prop edits (falls back to the built-in default).
    const sizeVariant = selectedVariants.size || 'default'

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--recursica_brand_dimensions_gutters_vertical)',
            alignItems: 'center',
            width: '100%',
        }}>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--recursica_brand_dimensions_gutters_vertical)',
                    alignItems: 'center',
                }}
            >
                <h2 style={h2Style}>{sizeVariant}</h2>
                <Loader size={sizeVariant as any} />
            </div>
        </div>
    )
}
