import { useMemo } from 'react'
import { Label } from '../../components/adapters/Label'
import { useThemeMode } from '../theme/ThemeModeContext'

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

  // Extract layout variant from selectedVariants
  const layoutVariant = (selectedVariants.layout || 'stacked') as 'stacked' | 'side-by-side-large' | 'side-by-side-small'

  // Determine if we're showing side-by-side layout
  const isSideBySide = layoutVariant.startsWith('side-by-side-')
  const isLarge = layoutVariant === 'side-by-side-large'
  const isSmall = layoutVariant === 'side-by-side-small'

  if (isSideBySide) {
    // Show side-by-side layout with all three variants, both left and right aligned
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
        {/* Left-aligned labels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Default label - left */}
          <div style={{ display: 'flex', gap: isLarge ? 16 : 8, alignItems: 'center', width: '100%' }}>
            <Label
              variant="default"
              layout={layoutVariant}
              align="left"
              layer={selectedLayer as any}
              htmlFor="input-1-left"
              style={isLarge ? { width: 'var(--label-column-width)' } : undefined}
            >
              Label
            </Label>
            {isLarge && (
              <input
                id="input-1-left"
                type="text"
                placeholder="Input field"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid var(--recursica-brand-themes-light-palettes-neutral-default-color-tone)',
                  borderRadius: '4px',
                }}
              />
            )}
          </div>
          
          {/* Required label - left */}
          <div style={{ display: 'flex', gap: isLarge ? 16 : 8, alignItems: 'center', width: '100%' }}>
            <Label
              variant="required"
              layout={layoutVariant}
              align="left"
              layer={selectedLayer as any}
              htmlFor="input-2-left"
              style={isLarge ? { width: 'var(--label-column-width)' } : undefined}
            >
              Label
            </Label>
            {isLarge && (
              <input
                id="input-2-left"
                type="text"
                placeholder="Input field"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid var(--recursica-brand-themes-light-palettes-neutral-default-color-tone)',
                  borderRadius: '4px',
                }}
              />
            )}
          </div>
          
          {/* Optional label - left */}
          <div style={{ display: 'flex', gap: isLarge ? 16 : 8, alignItems: 'center', width: '100%' }}>
            <Label
              variant="optional"
              layout={layoutVariant}
              align="left"
              layer={selectedLayer as any}
              htmlFor="input-3-left"
              style={isLarge ? { width: 'var(--label-column-width)' } : undefined}
            >
              Label
            </Label>
            {isLarge && (
              <input
                id="input-3-left"
                type="text"
                placeholder="Input field"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid var(--recursica-brand-themes-light-palettes-neutral-default-color-tone)',
                  borderRadius: '4px',
                }}
              />
            )}
          </div>
        </div>
        
        {/* Right-aligned labels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Default label - right */}
          <div style={{ display: 'flex', gap: isLarge ? 16 : 8, alignItems: 'center', width: '100%', justifyContent: 'flex-end' }}>
            {isLarge && (
              <input
                id="input-1-right"
                type="text"
                placeholder="Input field"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid var(--recursica-brand-themes-light-palettes-neutral-default-color-tone)',
                  borderRadius: '4px',
                }}
              />
            )}
            <Label
              variant="default"
              layout={layoutVariant}
              align="right"
              layer={selectedLayer as any}
              htmlFor="input-1-right"
              style={isLarge ? { width: 'var(--label-column-width)' } : undefined}
            >
              Label
            </Label>
          </div>
          
          {/* Required label - right */}
          <div style={{ display: 'flex', gap: isLarge ? 16 : 8, alignItems: 'center', width: '100%', justifyContent: 'flex-end' }}>
            {isLarge && (
              <input
                id="input-2-right"
                type="text"
                placeholder="Input field"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid var(--recursica-brand-themes-light-palettes-neutral-default-color-tone)',
                  borderRadius: '4px',
                }}
              />
            )}
            <Label
              variant="required"
              layout={layoutVariant}
              align="right"
              layer={selectedLayer as any}
              htmlFor="input-2-right"
              style={isLarge ? { width: 'var(--label-column-width)' } : undefined}
            >
              Label
            </Label>
          </div>
          
          {/* Optional label - right */}
          <div style={{ display: 'flex', gap: isLarge ? 16 : 8, alignItems: 'center', width: '100%', justifyContent: 'flex-end' }}>
            {isLarge && (
              <input
                id="input-3-right"
                type="text"
                placeholder="Input field"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid var(--recursica-brand-themes-light-palettes-neutral-default-color-tone)',
                  borderRadius: '4px',
                }}
              />
            )}
            <Label
              variant="optional"
              layout={layoutVariant}
              align="right"
              layer={selectedLayer as any}
              htmlFor="input-3-right"
              style={isLarge ? { width: 'var(--label-column-width)' } : undefined}
            >
              Label
            </Label>
          </div>
        </div>
      </div>
    )
  }

  // Show stacked layout with all three variants, both left and right aligned
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Left-aligned labels */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Label
          variant="default"
          layout={layoutVariant}
          align="left"
          layer={selectedLayer as any}
          htmlFor="label-1-left"
        >
          Label
        </Label>
        
        <Label
          variant="required"
          layout={layoutVariant}
          align="left"
          layer={selectedLayer as any}
          htmlFor="label-2-left"
        >
          Label
        </Label>
        
        <Label
          variant="optional"
          layout={layoutVariant}
          align="left"
          layer={selectedLayer as any}
          htmlFor="label-3-left"
        >
          Label
        </Label>
      </div>
      
      {/* Right-aligned labels */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Label
          variant="default"
          layout={layoutVariant}
          align="right"
          layer={selectedLayer as any}
          htmlFor="label-1-right"
        >
          Label
        </Label>
        
        <Label
          variant="required"
          layout={layoutVariant}
          align="right"
          layer={selectedLayer as any}
          htmlFor="label-2-right"
        >
          Label
        </Label>
        
        <Label
          variant="optional"
          layout={layoutVariant}
          align="right"
          layer={selectedLayer as any}
          htmlFor="label-3-right"
        >
          Label
        </Label>
      </div>
    </div>
  )
}

