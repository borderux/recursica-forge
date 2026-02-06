import { TextField } from '../../components/adapters/TextField'
import { useThemeMode } from '../theme/ThemeModeContext'
import { getGlobalCssVar } from '../../components/utils/cssVarNames'

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
  const sizeVariant = (selectedVariants.size || 'default') as 'default' | 'small'
  
  // Get vertical gap token for form properties
  const formVerticalItemGapVar = getGlobalCssVar('form', 'properties', 'vertical-item-gap', mode)
  const verticalGapValue = `var(${formVerticalItemGapVar})`

  // Show stacked layout with TextField components (which include labels)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: verticalGapValue }}>
      {/* Left-aligned section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: verticalGapValue }}>
        <h2 style={{ margin: 0 }}>Left aligned</h2>
        <TextField
          label="Label"
          placeholder="Input field"
          layout={layoutVariant}
          labelSize={sizeVariant}
          layer={selectedLayer as any}
          disableTopBottomMargin
        />
        <TextField
          label="Label"
          placeholder="Input field"
          required
          layout={layoutVariant}
          labelSize={sizeVariant}
          layer={selectedLayer as any}
          disableTopBottomMargin
        />
        <TextField
          label="Label"
          placeholder="Input field"
          optional
          layout={layoutVariant}
          labelSize={sizeVariant}
          layer={selectedLayer as any}
          disableTopBottomMargin
        />
      </div>
      
      {/* Right-aligned section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: verticalGapValue }}>
        <h2 style={{ margin: 0 }}>Right aligned</h2>
        <TextField
          label="Label"
          placeholder="Input field"
          labelAlign="right"
          layout={layoutVariant}
          labelSize={sizeVariant}
          layer={selectedLayer as any}
          disableTopBottomMargin
        />
        <TextField
          label="Label"
          placeholder="Input field"
          required
          labelAlign="right"
          layout={layoutVariant}
          labelSize={sizeVariant}
          layer={selectedLayer as any}
          disableTopBottomMargin
        />
        <TextField
          label="Label"
          placeholder="Input field"
          optional
          labelAlign="right"
          layout={layoutVariant}
          labelSize={sizeVariant}
          layer={selectedLayer as any}
          disableTopBottomMargin
        />
      </div>
    </div>
  )
}
