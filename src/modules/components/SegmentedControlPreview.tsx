import { useState, useMemo } from 'react'
import { SegmentedControl } from '../../components/adapters/SegmentedControl'
import { iconNameToReactComponent } from './iconUtils'
import { useThemeMode } from '../theme/ThemeModeContext'
import { readCssVar } from '../../core/css/readCssVar'
import { getComponentLevelCssVar } from '../../components/utils/cssVarNames'

interface SegmentedControlPreviewProps {
  selectedVariants: Record<string, string> // e.g., { style: "default", size: "default" }
  selectedLayer: string // e.g., "layer-0"
  componentElevation?: string // e.g., "elevation-0", "elevation-1", etc.
}

export default function SegmentedControlPreview({
  selectedVariants,
  selectedLayer,
  componentElevation,
}: SegmentedControlPreviewProps) {
  const { mode } = useThemeMode()
  
  // Extract variants from selectedVariants
  const orientationVariant = (selectedVariants.orientation || 'horizontal') as 'horizontal' | 'vertical'
  const fillWidthVariant = (selectedVariants['fill-width'] || 'false') as 'true' | 'false'
  
  const fillWidth = fillWidthVariant === 'true'
  
  // State for selected value
  const [selectedValue, setSelectedValue] = useState<string>('option1')
  
  // Get icons
  const Icon1 = iconNameToReactComponent('graduation-cap')
  const Icon2 = iconNameToReactComponent('sliders-horizontal')
  const Icon3 = iconNameToReactComponent('user')
  
  // Create items with three options - can have icon, label, or both
  const items = useMemo(() => [
    {
      value: 'option1',
      label: 'Label',
      icon: Icon1 ? <Icon1 size={16} /> : undefined,
    },
    {
      value: 'option2',
      label: 'Label',
      icon: Icon2 ? <Icon2 size={16} /> : undefined,
    },
    {
      value: 'option3',
      label: 'Label',
      icon: Icon3 ? <Icon3 size={16} /> : undefined,
    },
  ], [Icon1, Icon2, Icon3])
  
  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
      <SegmentedControl
        items={items}
        value={selectedValue}
        onChange={setSelectedValue}
        orientation={orientationVariant}
        fullWidth={fillWidth}
        layer={selectedLayer as any}
        elevation={componentElevation}
      />
    </div>
  )
}
