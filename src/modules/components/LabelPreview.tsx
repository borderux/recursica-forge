import { useMemo } from 'react'
import { Label } from '../../components/adapters/Label'
import { TextField } from '../../components/adapters/TextField'
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
  const sizeVariant = selectedVariants.size as 'default' | 'small' | undefined

  // Determine if we're showing side-by-side layout
  const isSideBySide = layoutVariant === 'side-by-side'
  const isDefault = sizeVariant === 'default' || sizeVariant === undefined
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
    const sizesToShow: Array<'default' | 'small'> = sizeVariant ? [sizeVariant] : ['default', 'small']
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>
        {sizesToShow.map((size) =>
          alignments.map((align) => (
            <div key={`${size}-${align}`} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                  <TextField
                    placeholder="Input field"
                    layout={layoutVariant}
                    layer={selectedLayer as any}
                    id={`input-${size}-${align}-${styleVariant}`}
                    style={{ flex: 1 }}
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
          <TextField
            placeholder="Input field"
            layout={layoutVariant}
            layer={selectedLayer as any}
            id="label-1-left"
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
          <TextField
            placeholder="Input field"
            required
            layout={layoutVariant}
            layer={selectedLayer as any}
            id="label-2-left"
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
          <TextField
            placeholder="Input field"
            layout={layoutVariant}
            layer={selectedLayer as any}
            id="label-3-left"
          />
        </div>
      </div>
      
      {/* Right-aligned labels */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%', alignItems: 'flex-end' }}>
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
          <TextField
            placeholder="Input field"
            layout={layoutVariant}
            layer={selectedLayer as any}
            id="label-1-right"
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%', alignItems: 'flex-end' }}>
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
          <TextField
            placeholder="Input field"
            required
            layout={layoutVariant}
            layer={selectedLayer as any}
            id="label-2-right"
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%', alignItems: 'flex-end' }}>
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
          <TextField
            placeholder="Input field"
            layout={layoutVariant}
            layer={selectedLayer as any}
            id="label-3-right"
          />
        </div>
      </div>
    </div>
  )
}

