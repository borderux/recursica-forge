/**
 * Pagination Preview Component
 * 
 * Displays the Pagination component in the component detail page with
 * multiple examples: one small set (no truncation), one with truncation,
 * and both with/without edge controls (first/last).
 */

import { Pagination } from '../../components/adapters/Pagination'

const h2Style: React.CSSProperties = {
    margin: 0,
    fontFamily: 'var(--recursica_brand_typography_h2-font-family)',
    fontSize: 'var(--recursica_brand_typography_h2-font-size)',
    fontWeight: 'var(--recursica_brand_typography_h2-font-weight)',
    letterSpacing: 'var(--recursica_brand_typography_h2-font-letter-spacing)',
    lineHeight: 'var(--recursica_brand_typography_h2-line-height)',
}

interface PaginationPreviewProps {
    selectedVariants: Record<string, string>
    selectedLayer: string
    componentElevation?: string
}

export default function PaginationPreview({
    selectedVariants,
    selectedLayer,
    componentElevation,
}: PaginationPreviewProps) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--recursica_brand_dimensions_gutters_vertical)', alignItems: 'center', width: '100%' }}>
            {/* Small number of pages — no truncation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--recursica_brand_dimensions_gutters_vertical)', alignItems: 'center' }}>
                <h2 style={h2Style}>Simple</h2>
                <Pagination
                    total={5}
                    defaultValue={2}
                    siblings={1}
                    boundaries={1}
                    withEdges={false}
                    layer={selectedLayer as any}
                />
            </div>

            {/* Larger number of pages — shows truncation with ellipsis */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--recursica_brand_dimensions_gutters_vertical)', alignItems: 'center' }}>
                <h2 style={h2Style}>Many pages</h2>
                <Pagination
                    total={20}
                    defaultValue={10}
                    siblings={1}
                    boundaries={1}
                    withEdges={true}
                    layer={selectedLayer as any}
                />
            </div>
        </div>
    )
}
