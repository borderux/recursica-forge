import { useState, useMemo, useEffect } from 'react'
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

  // State for selected values (one for each SegmentedControl)
  const [selectedValue1, setSelectedValue1] = useState<string>('option1')
  const [selectedValue2, setSelectedValue2] = useState<string>('option1')
  const [selectedValue3, setSelectedValue3] = useState<string>('option1')

  // Get icons
  const Icon1 = iconNameToReactComponent('fire')
  const Icon2 = iconNameToReactComponent('diamond')
  const Icon3 = iconNameToReactComponent('shield')
  const Icon4 = iconNameToReactComponent('crown')

  // Create items with icons and labels (original)
  const itemsWithIconsAndLabels = useMemo(() => [
    {
      value: 'option1',
      label: 'Forge',
      icon: Icon1 ? <Icon1 size={16} /> : undefined,
      tooltip: 'Forge',
    },
    {
      value: 'option2',
      label: 'Mines',
      icon: Icon2 ? <Icon2 size={16} /> : undefined,
      tooltip: 'Mines',
    },
    {
      value: 'option3',
      label: 'Armory',
      icon: Icon3 ? <Icon3 size={16} /> : undefined,
      tooltip: 'Armory',
    },
    {
      value: 'option4',
      label: 'Treasury',
      icon: Icon4 ? <Icon4 size={16} /> : undefined,
      tooltip: 'Treasury',
    },
  ], [Icon1, Icon2, Icon3, Icon4])

  // Create items with labels only (no icons)
  const itemsWithLabelsOnly = useMemo(() => [
    {
      value: 'option1',
      label: 'Forge',
      tooltip: 'Forge',
    },
    {
      value: 'option2',
      label: 'Mines',
      tooltip: 'Mines',
    },
    {
      value: 'option3',
      label: 'Armory',
      tooltip: 'Armory',
    },
    {
      value: 'option4',
      label: 'Treasury',
      tooltip: 'Treasury',
    },
  ], [])

  // Create items with icons only (no labels, but with tooltips)
  const itemsWithIconsOnly = useMemo(() => [
    {
      value: 'option1',
      label: 'Forge',
      icon: Icon1 ? <Icon1 size={16} /> : undefined,
      tooltip: 'Forge',
    },
    {
      value: 'option2',
      label: 'Mines',
      icon: Icon2 ? <Icon2 size={16} /> : undefined,
      tooltip: 'Mines',
    },
    {
      value: 'option3',
      label: 'Armory',
      icon: Icon3 ? <Icon3 size={16} /> : undefined,
      tooltip: 'Armory',
    },
    {
      value: 'option4',
      label: 'Treasury',
      icon: Icon4 ? <Icon4 size={16} /> : undefined,
      tooltip: 'Treasury',
    },
  ], [Icon1, Icon2, Icon3, Icon4])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', minWidth: 0, maxWidth: '100%' }}>
      {/* Original: Icons and Labels */}
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <SegmentedControl
          items={itemsWithIconsAndLabels}
          value={selectedValue1}
          onChange={setSelectedValue1}
          orientation={orientationVariant}
          fullWidth={fillWidth}
          layer={selectedLayer as any}
          elevation={componentElevation}
        />
      </div>

      {/* Labels Only */}
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <SegmentedControl
          items={itemsWithLabelsOnly}
          value={selectedValue2}
          onChange={setSelectedValue2}
          orientation={orientationVariant}
          fullWidth={fillWidth}
          layer={selectedLayer as any}
          elevation={componentElevation}
        />
      </div>

      {/* Icons Only (with tooltips) */}
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <SegmentedControl
          items={itemsWithIconsOnly}
          value={selectedValue3}
          onChange={setSelectedValue3}
          orientation={orientationVariant}
          fullWidth={fillWidth}
          layer={selectedLayer as any}
          elevation={componentElevation}
          showLabel={false}
        />
      </div>
    </div>
  )
}
