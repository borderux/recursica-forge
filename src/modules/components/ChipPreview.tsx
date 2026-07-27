import { useMemo, useState } from 'react'
import { Chip } from '../../components/adapters/Chip'
import { useThemeMode } from '../theme/ThemeModeContext'
import { iconNameToReactComponent } from './iconUtils'

interface ChipPreviewProps {
  selectedVariants: Record<string, string> // e.g., { "selection-states": "unselected" }
  selectedLayer: string // e.g., "layer-0"
  selectedAltLayer: string | null // e.g., "high-contrast" or null
  activeState?: string // active interaction-state tab (base/error)
  componentElevation?: string // e.g., "elevation-0", "elevation-1", etc.
}

export default function ChipPreview({
  selectedVariants,
  selectedLayer,
  selectedAltLayer,
  activeState = 'base',
  componentElevation,
}: ChipPreviewProps) {
  const { mode } = useThemeMode()

  // The Error interaction-state tab promotes chips to their error/error-selected colour set.
  // Chips have no disabled state — a non-interactive chip is simply a default chip.
  const isError = activeState === 'error'

  // The selection-state currently chosen in the toolbar. Built-ins are unselected/selected;
  // any other value is a custom variant the user created and is now editing.
  const selectedState = selectedVariants['selection-states'] || 'unselected'
  const isBuiltInState = selectedState === 'unselected' || selectedState === 'selected'

  // Selectable chips own their selection state so the user can toggle them on/off.
  const [selected, setSelected] = useState<Record<string, boolean>>({
    moonstone: false,
    mithril: true,
  })
  const toggle = (key: string) =>
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }))

  // For built-in states, keep the rich demo: unselected + selected shown together, with the
  // Error tab overlaying the error colours. For a custom state, every chip renders that state
  // so its property edits are reflected in the preview.
  const variantFor = (isSelected: boolean): string => {
    if (!isBuiltInState) return selectedState
    return isError
      ? isSelected ? 'error-selected' : 'error'
      : isSelected ? 'selected' : 'unselected'
  }

  // Determine the actual layer to use
  const actualLayer = useMemo(() => {
    if (selectedAltLayer) {
      return `layer-alternative-${selectedAltLayer}` as any
    }
    return selectedLayer as any
  }, [selectedAltLayer, selectedLayer])

  const ShieldIcon = iconNameToReactComponent('shield')
  const LightningIcon = iconNameToReactComponent('lightning')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'flex-start' }}>
      {/* Default (non-selectable) chips — not interactive, no selection toggle */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <Chip
          variant={variantFor(false)}
          layer={actualLayer}
          elevation={componentElevation}
        >
          Obsidian
        </Chip>
        <Chip
          variant={variantFor(false)}
          layer={actualLayer}
          elevation={componentElevation}
          icon={ShieldIcon ? <ShieldIcon /> : undefined}
        >
          Dragon Scale
        </Chip>
      </div>

      {/* Selectable chips — click to toggle the selection on/off */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <Chip
          variant={variantFor(selected.moonstone)}
          layer={actualLayer}
          elevation={componentElevation}
          onClick={() => toggle('moonstone')}
        >
          Moonstone
        </Chip>
        <Chip
          variant={variantFor(selected.mithril)}
          layer={actualLayer}
          elevation={componentElevation}
          icon={LightningIcon ? <LightningIcon /> : undefined}
          onClick={() => toggle('mithril')}
        >
          Mithril Wire
        </Chip>
      </div>
    </div>
  )
}
