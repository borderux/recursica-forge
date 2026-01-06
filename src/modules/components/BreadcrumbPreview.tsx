import { Breadcrumb } from '../../components/adapters/Breadcrumb'
import type { BreadcrumbItem } from '../../components/adapters/Breadcrumb'

interface BreadcrumbPreviewProps {
  selectedVariants: Record<string, string> // e.g., { style: "interactive" }
  selectedLayer: string // e.g., "layer-0"
  componentElevation?: string // Not used for breadcrumb, but kept for consistency
}

export default function BreadcrumbPreview({
  selectedVariants,
  selectedLayer,
}: BreadcrumbPreviewProps) {
  // Get style variant (interactive or read-only)
  const styleVariant = selectedVariants.style || 'interactive'
  
  // Create sample breadcrumb items (up to 5 levels)
  const sampleItems: BreadcrumbItem[] = [
    { label: 'Home', href: '#' },
    { label: 'Category', href: '#' },
    { label: 'Subcategory', href: '#' },
    { label: 'Item', href: '#' },
    { label: 'Current Page' }, // Last item is read-only
  ]
  
  // Limit to 5 items
  const items = sampleItems.slice(0, 5)
  
  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
      {/* Chevron separator with home icon */}
      <Breadcrumb
        items={items}
        separator="chevron"
        showHomeIcon={true}
        layer={selectedLayer as any}
      />
    </div>
  )
}

