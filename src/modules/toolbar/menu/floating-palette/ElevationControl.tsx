import TokenSlider from '../../../forms/TokenSlider'
import FloatingPalette from './FloatingPalette'
import { getComponentLevelCssVar } from '../../../../components/utils/cssVarNames'
import { readCssVar } from '../../../../core/css/readCssVar'
import { updateCssVar } from '../../../../core/css/updateCssVar'
import { useThemeMode } from '../../../theme/ThemeModeContext'

export interface ElevationOption {
  name: string
  label: string
}

export interface ElevationControlProps {
  anchorElement: HTMLElement | null
  elevationOptions: ElevationOption[]
  currentElevation: string
  onElevationChange: (elevation: string) => void
  componentName: string
  onClose: () => void
}

export default function ElevationControl({
  anchorElement,
  elevationOptions,
  currentElevation,
  onElevationChange,
  componentName,
  onClose,
}: ElevationControlProps) {
  const { mode } = useThemeMode()
  const isSwitch = componentName.toLowerCase() === 'switch'

  if (!anchorElement) {
    return null
  }

  // Get track and thumb elevation values for Switch
  const thumbElevationVar = isSwitch ? getComponentLevelCssVar('Switch' as any, 'thumb-elevation') : null
  const trackElevationVar = isSwitch ? getComponentLevelCssVar('Switch' as any, 'track-elevation') : null

  const currentThumbElevation = thumbElevationVar ? (() => {
    const value = readCssVar(thumbElevationVar)
    if (value) {
      const match = value.match(/elevations\.(elevation-\d+)/)
      if (match) return match[1]
      if (/^elevation-\d+$/.test(value)) return value
    }
    return 'elevation-0'
  })() : null

  const currentTrackElevation = trackElevationVar ? (() => {
    const value = readCssVar(trackElevationVar)
    if (value) {
      const match = value.match(/elevations\.(elevation-\d+)/)
      if (match) return match[1]
      if (/^elevation-\d+$/.test(value)) return value
    }
    return 'elevation-0'
  })() : null

  const handleThumbElevationChange = (elevationName: string) => {
    if (thumbElevationVar) {
      updateCssVar(thumbElevationVar, `{brand.themes.${mode}.elevations.${elevationName}}`)
      window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
        detail: { cssVars: [thumbElevationVar] }
      }))
    }
  }

  const handleTrackElevationChange = (elevationName: string) => {
    if (trackElevationVar) {
      updateCssVar(trackElevationVar, `{brand.themes.${mode}.elevations.${elevationName}}`)
      window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
        detail: { cssVars: [trackElevationVar] }
      }))
    }
  }

  return (
    <FloatingPalette
      anchorElement={anchorElement}
      title="Elevation"
      onClose={onClose}
    >
      {isSwitch ? (
        <>
          <TokenSlider
            label="Thumb Elevation"
            tokens={elevationOptions.map(opt => ({ name: opt.name, label: opt.label }))}
            currentToken={currentThumbElevation || 'elevation-0'}
            onChange={handleThumbElevationChange}
            getTokenLabel={(token) => {
              const opt = elevationOptions.find((o) => o.name === token.name)
              return opt?.label || token.label || token.name
            }}
          />
          <div style={{ marginTop: 'var(--recursica-brand-dimensions-md)' }}>
            <TokenSlider
              label="Track Elevation"
              tokens={elevationOptions.map(opt => ({ name: opt.name, label: opt.label }))}
              currentToken={currentTrackElevation || 'elevation-0'}
              onChange={handleTrackElevationChange}
              getTokenLabel={(token) => {
                const opt = elevationOptions.find((o) => o.name === token.name)
                return opt?.label || token.label || token.name
              }}
            />
          </div>
        </>
      ) : (
        <TokenSlider
          label="Elevation"
          tokens={elevationOptions.map(opt => ({ name: opt.name, label: opt.label }))}
          currentToken={currentElevation}
          onChange={onElevationChange}
          getTokenLabel={(token) => {
            const opt = elevationOptions.find((o) => o.name === token.name)
            return opt?.label || token.label || token.name
          }}
        />
      )}
    </FloatingPalette>
  )
}

