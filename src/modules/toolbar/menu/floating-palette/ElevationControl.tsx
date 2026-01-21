import React from 'react'
import { Slider } from '../../../../components/adapters/Slider'
import { Label } from '../../../../components/adapters/Label'
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
          {(() => {
            const tokens = elevationOptions.map((opt, index) => ({ name: opt.name, label: opt.label, index }))
            const thumbIdx = tokens.findIndex(t => t.name === (currentThumbElevation || 'elevation-0')) || 0
            
            // Extract elevation number from token name
            const getElevationNumber = (token: typeof tokens[0] | undefined): number => {
              if (!token) return 0
              const match = token.name.match(/elevation-(\d+)/)
              return match ? parseInt(match[1], 10) : 0
            }
            
            const getValueLabel = React.useCallback((value: number) => {
              const token = tokens[Math.round(value)]
              if (!token) return 'None'
              const elevationNum = getElevationNumber(token)
              return elevationNum === 0 ? 'None' : String(elevationNum)
            }, [tokens])
            
            const minToken = tokens[0]
            const maxToken = tokens[tokens.length - 1]
            const minElevationNum = getElevationNumber(minToken)
            const minLabel = minElevationNum === 0 ? 'None' : String(minElevationNum)
            const maxElevationNum = getElevationNumber(maxToken)
            const maxLabel = String(maxElevationNum)
            
            return (
              <Slider
                value={thumbIdx}
                onChange={(val) => {
                  const idx = typeof val === 'number' ? val : val[0]
                  const token = tokens[Math.round(idx)]
                  if (token) handleThumbElevationChange(token.name)
                }}
                min={0}
                max={tokens.length - 1}
                step={1}
                layer="layer-1"
                layout="stacked"
                showInput={false}
                showValueLabel={true}
                valueLabel={getValueLabel}
                minLabel={minLabel}
                maxLabel={maxLabel}
                label={<Label layer="layer-1" layout="stacked">Thumb Elevation</Label>}
              />
            )
          })()}
          <div style={{ marginTop: 'var(--recursica-brand-dimensions-general-md)' }}>
            {(() => {
              const tokens = elevationOptions.map((opt, index) => ({ name: opt.name, label: opt.label, index }))
              const trackIdx = tokens.findIndex(t => t.name === (currentTrackElevation || 'elevation-0')) || 0
              
              // Extract elevation number from token name
              const getElevationNumber = (token: typeof tokens[0] | undefined): number => {
                if (!token) return 0
                const match = token.name.match(/elevation-(\d+)/)
                return match ? parseInt(match[1], 10) : 0
              }
              
              const getValueLabel = React.useCallback((value: number) => {
                const token = tokens[Math.round(value)]
                if (!token) return 'None'
                const elevationNum = getElevationNumber(token)
                return elevationNum === 0 ? 'None' : String(elevationNum)
              }, [tokens])
              
              const minToken = tokens[0]
              const maxToken = tokens[tokens.length - 1]
              const minElevationNum = getElevationNumber(minToken)
              const minLabel = minElevationNum === 0 ? 'None' : String(minElevationNum)
              const maxElevationNum = getElevationNumber(maxToken)
              const maxLabel = String(maxElevationNum)
              
              return (
                <Slider
                  value={trackIdx}
                  onChange={(val) => {
                    const idx = typeof val === 'number' ? val : val[0]
                    const token = tokens[Math.round(idx)]
                    if (token) handleTrackElevationChange(token.name)
                  }}
                  min={0}
                  max={tokens.length - 1}
                  step={1}
                  layer="layer-1"
                  layout="stacked"
                  showInput={false}
                  showValueLabel={true}
                  valueLabel={getValueLabel}
                  minLabel={minLabel}
                  maxLabel={maxLabel}
                  label={<Label layer="layer-1" layout="stacked">Track Elevation</Label>}
                />
              )
            })()}
          </div>
        </>
      ) : (
        (() => {
          const tokens = elevationOptions.map((opt, index) => ({ name: opt.name, label: opt.label, index }))
          const currentIdx = tokens.findIndex(t => t.name === currentElevation) || 0
          
          // Extract elevation number from token name
          const getElevationNumber = (token: typeof tokens[0] | undefined): number => {
            if (!token) return 0
            const match = token.name.match(/elevation-(\d+)/)
            return match ? parseInt(match[1], 10) : 0
          }
          
          const getValueLabel = React.useCallback((value: number) => {
            const token = tokens[Math.round(value)]
            if (!token) return 'None'
            const elevationNum = getElevationNumber(token)
            return elevationNum === 0 ? 'None' : String(elevationNum)
          }, [tokens])
          
          const minToken = tokens[0]
          const maxToken = tokens[tokens.length - 1]
          const minElevationNum = getElevationNumber(minToken)
          const minLabel = minElevationNum === 0 ? 'None' : String(minElevationNum)
          const maxElevationNum = getElevationNumber(maxToken)
          const maxLabel = String(maxElevationNum)
          
          return (
            <Slider
              value={currentIdx}
              onChange={(val) => {
                const idx = typeof val === 'number' ? val : val[0]
                const token = tokens[Math.round(idx)]
                if (token) onElevationChange(token.name)
              }}
              min={0}
              max={tokens.length - 1}
              step={1}
              layer="layer-1"
              layout="stacked"
              showInput={false}
              showValueLabel={true}
              valueLabel={getValueLabel}
              minLabel={minLabel}
              maxLabel={maxLabel}
              label={<Label layer="layer-1" layout="stacked">Elevation</Label>}
            />
          )
        })()
      )}
    </FloatingPalette>
  )
}

