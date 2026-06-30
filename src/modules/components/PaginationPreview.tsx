/**
 * Pagination Preview Component
 * 
 * Displays the Pagination component in the component detail page with
 * multiple examples: one small set (no truncation), one with truncation,
 * and both with/without edge controls (first/last).
 */

import { Pagination } from '../../components/adapters/Pagination'
import { h4Style } from './typographyStyles'




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
    const activeState = (selectedVariants.states || selectedVariants.__hasStateControl === 'true') ? (selectedVariants.states || selectedVariants.__activeState || 'default') : null
  return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--recursica_brand_dimensions_gutters_vertical)', alignItems: 'flex-start', width: '100%' }}>
      
            {/* Small number of pages — no truncation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--recursica_brand_dimensions_gutters_vertical)', alignItems: 'flex-start' }}>
                <h4 style={h4Style}>Simple</h4>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--recursica_brand_dimensions_gutters_vertical)', alignItems: 'flex-start' }}>
                <h4 style={h4Style}>Many pages</h4>
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
