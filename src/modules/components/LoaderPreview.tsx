/**
 * Loader Preview Component
 * 
 * Shows all three loader types (oval, bars, dots) at each size (small, default, large)
 * in the component detail preview, with properly styled H2 headings.
 * The Mantine implementation renders all sizes internally, so we just render the
 * loader once. The H2 headings are rendered by the component itself.
 */

import { Loader } from '../../components/adapters/Loader'

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
    const sizeVariant = (selectedVariants.size || 'default') as 'small' | 'default' | 'large'

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            width: '100%',
            padding: 0,
        }}>
            <Loader size={sizeVariant} />
        </div>
    )
}
