import { useMemo } from 'react'
import { Label } from '../../components/adapters/Label'
import { useThemeMode } from '../theme/ThemeModeContext'
import { buildComponentCssVarPath } from '../../components/utils/cssVarNames'

interface LabelPreviewProps {
  selectedVariants: Record<string, string> // e.g., { style: "default", layout: "stacked" }
  selectedLayer: string // e.g., "layer-0"
  componentElevation?: string // Not used for Label, but kept for consistency
}

export default function LabelPreview({
  selectedVariants,
  selectedLayer,
  componentElevation,
}: LabelPreviewProps) {
  const { mode } = useThemeMode()

  // Extract variants from selectedVariants
  const layoutVariant = (selectedVariants.layout || 'stacked') as 'stacked' | 'side-by-side'
  const sizeVariant = selectedVariants.size as 'large' | 'small' | undefined

  // Determine if we're showing side-by-side layout
  const isSideBySide = layoutVariant === 'side-by-side'
  const isLarge = sizeVariant === 'large'
  const isSmall = sizeVariant === 'small'
  
  // Get gutter CSS variable for side-by-side layout
  const gutterVar = isSideBySide 
    ? buildComponentCssVarPath('Label', 'variants', 'layouts', 'side-by-side', 'properties', 'gutter')
    : null
  // Use the CSS variable reference directly so it updates when the gutter prop changes
  const gapValue = gutterVar ? `var(${gutterVar})` : '0px'

  if (isSideBySide) {
    // Show side-by-side layout with all three style variants, both alignments, and selected size
    // If no size is selected, show both sizes
    const styleVariants: Array<'default' | 'required' | 'optional'> = ['default', 'required', 'optional']
    const alignments: Array<'left' | 'right'> = ['left', 'right']
    const sizesToShow: Array<'large' | 'small'> = sizeVariant ? [sizeVariant] : ['large', 'small']
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>
        {sizesToShow.map((size) =>
          alignments.map((align) => (
            <div key={`${size}-${align}`} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#666', marginBottom: 4 }}>
                {size.charAt(0).toUpperCase() + size.slice(1)} Size, {align.charAt(0).toUpperCase() + align.slice(1)} Aligned
              </div>
              {styleVariants.map((styleVariant) => (
                <div key={`${size}-${align}-${styleVariant}`} style={{ display: 'flex', gap: gapValue, alignItems: 'center', width: '100%' }}>
                  <Label
                    variant={styleVariant}
                    size={size}
                    layout={layoutVariant}
                    align={align}
                    layer={selectedLayer as any}
                    htmlFor={`input-${size}-${align}-${styleVariant}`}
                  >
                    Label
                  </Label>
                  <input
                    id={`input-${size}-${align}-${styleVariant}`}
                    type="text"
                    placeholder="Input field"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      border: '1px solid var(--recursica-brand-themes-light-palettes-neutral-default-color-tone)',
                      borderRadius: '4px',
                    }}
                  />
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    )
  }

  // Show stacked layout with all three variants, both left and right aligned
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Left-aligned labels */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Label
            variant="default"
            size={sizeVariant}
            layout={layoutVariant}
            align="left"
            layer={selectedLayer as any}
            htmlFor="label-1-left"
          >
            Label
          </Label>
          <input
            id="label-1-left"
            type="text"
            placeholder="Input field"
            style={{
              padding: '8px 12px',
              border: '1px solid var(--recursica-brand-themes-light-palettes-neutral-default-color-tone)',
              borderRadius: '4px',
            }}
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Label
            variant="required"
            size={sizeVariant}
            layout={layoutVariant}
            align="left"
            layer={selectedLayer as any}
            htmlFor="label-2-left"
          >
            Label
          </Label>
          <input
            id="label-2-left"
            type="text"
            placeholder="Input field"
            style={{
              padding: '8px 12px',
              border: '1px solid var(--recursica-brand-themes-light-palettes-neutral-default-color-tone)',
              borderRadius: '4px',
            }}
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Label
            variant="optional"
            size={sizeVariant}
            layout={layoutVariant}
            align="left"
            layer={selectedLayer as any}
            htmlFor="label-3-left"
          >
            Label
          </Label>
          <input
            id="label-3-left"
            type="text"
            placeholder="Input field"
            style={{
              padding: '8px 12px',
              border: '1px solid var(--recursica-brand-themes-light-palettes-neutral-default-color-tone)',
              borderRadius: '4px',
            }}
          />
        </div>
      </div>
      
      {/* Right-aligned labels */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Label
            variant="default"
            size={sizeVariant}
            layout={layoutVariant}
            align="right"
            layer={selectedLayer as any}
            htmlFor="label-1-right"
          >
            Label
          </Label>
          <input
            id="label-1-right"
            type="text"
            placeholder="Input field"
            style={{
              padding: '8px 12px',
              border: '1px solid var(--recursica-brand-themes-light-palettes-neutral-default-color-tone)',
              borderRadius: '4px',
            }}
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Label
            variant="required"
            size={sizeVariant}
            layout={layoutVariant}
            align="right"
            layer={selectedLayer as any}
            htmlFor="label-2-right"
          >
            Label
          </Label>
          <input
            id="label-2-right"
            type="text"
            placeholder="Input field"
            style={{
              padding: '8px 12px',
              border: '1px solid var(--recursica-brand-themes-light-palettes-neutral-default-color-tone)',
              borderRadius: '4px',
            }}
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Label
            variant="optional"
            size={sizeVariant}
            layout={layoutVariant}
            align="right"
            layer={selectedLayer as any}
            htmlFor="label-3-right"
          >
            Label
          </Label>
          <input
            id="label-3-right"
            type="text"
            placeholder="Input field"
            style={{
              padding: '8px 12px',
              border: '1px solid var(--recursica-brand-themes-light-palettes-neutral-default-color-tone)',
              borderRadius: '4px',
            }}
          />
        </div>
      </div>
    </div>
  )
}

