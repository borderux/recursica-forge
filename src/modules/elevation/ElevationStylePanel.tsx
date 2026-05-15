import React from 'react'
import { Slider } from '../../components/adapters/Slider'
import { Label } from '../../components/adapters/Label'
import { Switch } from '../../components/adapters/Switch'
import { Panel } from '../../components/adapters/Panel'
import { useThemeMode } from '../theme/ThemeModeContext'
import { useVars } from '../vars/VarsContext'
import { iconNameToReactComponent } from '../components/iconUtils'
import { getGlobalCssVar } from '../../components/utils/cssVarNames'
import { applyElevationShadow } from './elevationShadowFactory'
import { ResetButton } from '../../components/shared/ResetButton'
import PaletteColorControl from '../forms/PaletteColorControl'

type SizeToken = { name: string; value: number; label: string }

/** Reads the palette selection for the first selected elevation from state. */
function usePaletteSelection(
  levelsArr: number[],
  elevation: ReturnType<typeof useVars>['elevation'],
  mode: 'light' | 'dark',
): { paletteKey: string; paletteLevel: string } | null {
  if (!levelsArr.length || !elevation) return null
  const key = `elevation-${levelsArr[0]}`
  const sel = elevation.paletteSelections?.[mode]?.[key]
  if (!sel?.paletteKey || !sel?.level) return null
  return { paletteKey: sel.paletteKey, paletteLevel: sel.level }
}

/** Reads the stored opacity (0-100) for the first selected elevation from controls. */
function useStoredOpacity(
  levelsArr: number[],
  elevation: ReturnType<typeof useVars>['elevation'],
  mode: string,
): number {
  if (!levelsArr.length || !elevation) return 84
  const key = `elevation-${levelsArr[0]}`
  const ctrl = elevation.controls?.[(mode as 'light' | 'dark')]?.[key]
  if (ctrl?.opacity != null) return Math.round(ctrl.opacity * 100)
  return 84
}


export type ElevationControl = {
  blur: number
  spread: number
  offsetX: number
  offsetY: number
  opacity: number
}

export default function ElevationStylePanel({
  selectedLevels,
  elevationControls,
  availableSizeTokens,
  shadowColorControl,
  updateElevationControlsBatch,
  getDirectionForLevel,
  setXDirectionForSelected,
  setYDirectionForSelected,
  revertSelected,
  onShadowColorSelect,
  colorMirrorEnabled,
  onToggleColorMirror,
  onClose,
}: {
  selectedLevels: Set<number>
  elevationControls: Record<string, ElevationControl>
  availableSizeTokens: SizeToken[]
  shadowColorControl: { alphaToken: string; colorToken: string }
  updateElevationControlsBatch: (elevationKeys: string[], property: 'blur' | 'spread' | 'offsetX' | 'offsetY' | 'opacity', value: number) => void
  getDirectionForLevel: (elevationKey: string) => { x: 'left' | 'right'; y: 'up' | 'down' }
  setXDirectionForSelected: (dir: 'left' | 'right') => void
  setYDirectionForSelected: (dir: 'up' | 'down') => void
  revertSelected: (levels: Set<number>) => void
  onShadowColorSelect?: (cssVar: string) => void
  colorMirrorEnabled: boolean
  onToggleColorMirror: () => void
  onClose: () => void
}) {
  const levelsArr = React.useMemo(() => Array.from(selectedLevels), [selectedLevels])
  const { mode } = useThemeMode()
  const { elevation } = useVars()

  // ─── Read committed values from state ───────────────────────────────────────

  const firstKey = levelsArr.length ? `elevation-${levelsArr[0]}` : ''
  const firstCtrl = firstKey ? elevationControls[firstKey] : undefined
  const firstDir = firstKey ? getDirectionForLevel(firstKey) : { x: 'right' as const, y: 'down' as const }

  const committedBlur = firstCtrl?.blur ?? 0
  const committedSpread = firstCtrl?.spread ?? 0
  const committedOffsetX = firstDir.x === 'right' ? (firstCtrl?.offsetX ?? 0) : -(firstCtrl?.offsetX ?? 0)
  const committedOffsetY = firstDir.y === 'down' ? (firstCtrl?.offsetY ?? 0) : -(firstCtrl?.offsetY ?? 0)

  const statePaletteSel = usePaletteSelection(levelsArr, elevation, mode)
  const committedOpacity = useStoredOpacity(levelsArr, elevation, mode)

  // ─── Local form state (live during drag) ────────────────────────────────────

  const [localBlur, setLocalBlur] = React.useState<number | null>(null)
  const [localSpread, setLocalSpread] = React.useState<number | null>(null)
  const [localOffsetX, setLocalOffsetX] = React.useState<number | null>(null)
  const [localOffsetY, setLocalOffsetY] = React.useState<number | null>(null)
  const [localOpacity, setLocalOpacity] = React.useState<number | null>(null)

  // Active resolved values — local state takes priority over committed state
  const activeBlur = localBlur ?? committedBlur
  const activeSpread = localSpread ?? committedSpread
  const activeOffsetX = localOffsetX ?? committedOffsetX
  const activeOffsetY = localOffsetY ?? committedOffsetY
  const activeOpacity = localOpacity ?? committedOpacity

  // Default palette when none is selected in state yet
  const defaultPaletteKey = 'neutral'
  const defaultPaletteLevel = '500'
  const activePaletteKey = statePaletteSel?.paletteKey ?? defaultPaletteKey
  const activePaletteLevel = statePaletteSel?.paletteLevel ?? defaultPaletteLevel

  // Reset local state when selection changes
  React.useEffect(() => {
    setLocalBlur(null)
    setLocalSpread(null)
    setLocalOffsetX(null)
    setLocalOffsetY(null)
    setLocalOpacity(null)
  }, [firstKey])

  // ─── Mutable values ref ──────────────────────────────────────────────────────
  // Refs are never stale in closures, so every handler always reads the latest
  // value for every property — not just the one currently being dragged.

  const valuesRef = React.useRef({
    blur: activeBlur,
    spread: activeSpread,
    offsetX: activeOffsetX,
    offsetY: activeOffsetY,
    opacity: activeOpacity,
    paletteKey: activePaletteKey,
    paletteLevel: activePaletteLevel,
  })

  // Keep the ref current on every render (cheap, synchronous)
  valuesRef.current = {
    blur: activeBlur,
    spread: activeSpread,
    offsetX: activeOffsetX,
    offsetY: activeOffsetY,
    opacity: activeOpacity,
    paletteKey: activePaletteKey,
    paletteLevel: activePaletteLevel,
  }

  // ─── Factory helper ──────────────────────────────────────────────────────────
  // Reads directly from valuesRef.current which every handler writes to
  // synchronously before calling this function, so it is never stale.

  const applyFactory = React.useCallback((changedProp: 'blur' | 'spread' | 'offsetX' | 'offsetY' | 'opacity') => {
    const v = valuesRef.current

    for (const lvl of levelsArr) {
      if (lvl === 0) continue
      const key = `elevation-${lvl}`
      const ctrl = elevationControls[key]
      const dir = getDirectionForLevel(key)

      // For each prop, use the changed value from valuesRef; use each elevation's
      // own committed value for all other props so multi-selection only edits one prop.
      const blur     = changedProp === 'blur'    ? v.blur    : (ctrl?.blur    ?? 0)
      const spread   = changedProp === 'spread'  ? v.spread  : (ctrl?.spread  ?? 0)
      // offsetX/Y are stored as unsigned magnitude; the panel shows a signed value.
      // The committed signed value is direction-dependent.
      const rawOffsetX = ctrl?.offsetX ?? 0
      const rawOffsetY = ctrl?.offsetY ?? 0
      const committedSignedX = dir.x === 'right' ? rawOffsetX : -rawOffsetX
      const committedSignedY = dir.y === 'down'  ? rawOffsetY : -rawOffsetY
      const offsetX  = changedProp === 'offsetX' ? v.offsetX  : committedSignedX
      const offsetY  = changedProp === 'offsetY' ? v.offsetY  : committedSignedY
      const opacityNormalized = changedProp === 'opacity'
        ? Math.max(0, Math.min(1, v.opacity / 100))
        : Math.max(0, Math.min(1, (ctrl?.opacity ?? 0.84)))

      applyElevationShadow([lvl], mode, {
        blur,
        spread,
        offsetX,
        offsetY,
        opacityNormalized,
        paletteKey:   v.paletteKey,
        paletteLevel: v.paletteLevel,
      })
    }
  }, [levelsArr, mode, elevationControls, getDirectionForLevel])

  // ─── Blur ────────────────────────────────────────────────────────────────────

  const handleBlurChange = React.useCallback((value: number) => {
    valuesRef.current.blur = value
    setLocalBlur(value)
    applyFactory('blur')
  }, [applyFactory])

  const handleBlurChangeCommitted = React.useCallback((value: number) => {
    valuesRef.current.blur = value
    setLocalBlur(null)
    applyFactory('blur')
    const keys = levelsArr.map(lvl => `elevation-${lvl}`)
    updateElevationControlsBatch(keys, 'blur', value)
  }, [levelsArr, applyFactory, updateElevationControlsBatch])

  // ─── Spread ──────────────────────────────────────────────────────────────────

  const handleSpreadChange = React.useCallback((value: number) => {
    valuesRef.current.spread = value
    setLocalSpread(value)
    applyFactory('spread')
  }, [applyFactory])

  const handleSpreadChangeCommitted = React.useCallback((value: number) => {
    valuesRef.current.spread = value
    setLocalSpread(null)
    applyFactory('spread')
    const keys = levelsArr.map(lvl => `elevation-${lvl}`)
    updateElevationControlsBatch(keys, 'spread', value)
  }, [levelsArr, applyFactory, updateElevationControlsBatch])

  // ─── Offset X ────────────────────────────────────────────────────────────────

  const handleOffsetXChange = React.useCallback((value: number) => {
    valuesRef.current.offsetX = value
    setLocalOffsetX(value)
    applyFactory('offsetX')
  }, [applyFactory])

  const handleOffsetXChangeCommitted = React.useCallback((value: number) => {
    valuesRef.current.offsetX = value
    setLocalOffsetX(null)
    applyFactory('offsetX')
    const keys = levelsArr.map(lvl => `elevation-${lvl}`)
    updateElevationControlsBatch(keys, 'offsetX', value)
  }, [levelsArr, applyFactory, updateElevationControlsBatch])

  // ─── Offset Y ────────────────────────────────────────────────────────────────

  const handleOffsetYChange = React.useCallback((value: number) => {
    valuesRef.current.offsetY = value
    setLocalOffsetY(value)
    applyFactory('offsetY')
  }, [applyFactory])

  const handleOffsetYChangeCommitted = React.useCallback((value: number) => {
    valuesRef.current.offsetY = value
    setLocalOffsetY(null)
    applyFactory('offsetY')
    const keys = levelsArr.map(lvl => `elevation-${lvl}`)
    updateElevationControlsBatch(keys, 'offsetY', value)
  }, [levelsArr, applyFactory, updateElevationControlsBatch])

  // ─── Opacity ─────────────────────────────────────────────────────────────────

  const handleOpacityChange = React.useCallback((value: number) => {
    valuesRef.current.opacity = value
    setLocalOpacity(value)
    applyFactory('opacity')
  }, [applyFactory])

  const handleOpacityChangeCommitted = React.useCallback((value: number) => {
    valuesRef.current.opacity = value
    setLocalOpacity(null)
    applyFactory('opacity')
    const keys = levelsArr.map(lvl => `elevation-${lvl}`)
    updateElevationControlsBatch(keys, 'opacity', value / 100)
  }, [levelsArr, applyFactory, updateElevationControlsBatch])

  // ─── Shadow color CSS var helpers ────────────────────────────────────────────

  const getShadowColorCssVar = React.useCallback((level: number): string =>
    `--recursica_brand_themes_${mode}_elevations_elevation-${level}_shadow-color`,
    [mode])

  // ─── Panel chrome ────────────────────────────────────────────────────────────

  const panelTitle = (() => {
    if (levelsArr.length === 0) return 'Elevation'
    if (levelsArr.length === 1) return `Elevation ${levelsArr[0]}`
    const list = levelsArr.slice().sort((a, b) => a - b).join(', ')
    return `Elevations ${list}`
  })()

  const panelFooter = (
    <ResetButton
      onReset={() => revertSelected(new Set(selectedLevels))}
      layer="layer-0"
      modalTitle="Reset elevation"
      modalMessage="The selected elevation customisations will be reset to their defaults."
    />
  )

  return (
    <Panel
      overlay
      position="right"
      title={panelTitle}
      onClose={onClose}
      footer={panelFooter}
      width="400px"
      zIndex={10000}
      layer="layer-0"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: `var(${getGlobalCssVar('form', 'properties', 'vertical-item-gap', mode)})` }}>

        {/* Blur */}
        <div style={{ width: '100%', margin: 0, padding: 0 }}>
          <Slider
            key={`blur-${firstKey}-${committedBlur}`}
            value={activeBlur}
            onChange={(val) => handleBlurChange(typeof val === 'number' ? val : val[0])}
            onChangeCommitted={(val) => handleBlurChangeCommitted(typeof val === 'number' ? val : val[0])}
            min={0}
            max={200}
            step={1}
            layer="layer-3"
            layout="stacked"
            showInput={false}
            showValueLabel={true}
            showMinMaxLabels={false}
            valueLabel={(val) => `${val}px`}
            label={<Label layer="layer-3" layout="stacked">Blur</Label>}
          />
        </div>

        {/* Spread */}
        <div style={{ width: '100%', margin: 0, padding: 0 }}>
          <Slider
            key={`spread-${firstKey}-${committedSpread}`}
            value={activeSpread}
            onChange={(val) => handleSpreadChange(typeof val === 'number' ? val : val[0])}
            onChangeCommitted={(val) => handleSpreadChangeCommitted(typeof val === 'number' ? val : val[0])}
            min={0}
            max={200}
            step={1}
            layer="layer-3"
            layout="stacked"
            showInput={false}
            showValueLabel={true}
            showMinMaxLabels={false}
            valueLabel={(val) => `${val}px`}
            label={<Label layer="layer-3" layout="stacked">Spread</Label>}
          />
        </div>

        {/* Offset X */}
        <div style={{ width: '100%', margin: 0, padding: 0 }}>
          <Slider
            key={`offsetX-${firstKey}-${committedOffsetX}`}
            value={activeOffsetX}
            onChange={(val) => handleOffsetXChange(typeof val === 'number' ? val : val[0])}
            onChangeCommitted={(val) => handleOffsetXChangeCommitted(typeof val === 'number' ? val : val[0])}
            min={-50}
            max={50}
            step={1}
            layer="layer-3"
            layout="stacked"
            showInput={false}
            showValueLabel={true}
            showMinMaxLabels={false}
            valueLabel={(val) => `${val}px`}
            label={<Label layer="layer-3" layout="stacked">Offset X</Label>}
          />
        </div>

        {/* Offset Y */}
        <div style={{ width: '100%', margin: 0, padding: 0 }}>
          <Slider
            key={`offsetY-${firstKey}-${committedOffsetY}`}
            value={activeOffsetY}
            onChange={(val) => handleOffsetYChange(typeof val === 'number' ? val : val[0])}
            onChangeCommitted={(val) => handleOffsetYChangeCommitted(typeof val === 'number' ? val : val[0])}
            min={-50}
            max={50}
            step={1}
            layer="layer-3"
            layout="stacked"
            showInput={false}
            showValueLabel={true}
            showMinMaxLabels={false}
            valueLabel={(val) => `${val}px`}
            label={<Label layer="layer-3" layout="stacked">Offset Y</Label>}
          />
        </div>

        {/* Opacity */}
        <div style={{ width: '100%', margin: 0, padding: 0 }}>
          <Slider
            value={activeOpacity}
            onChange={(val) => handleOpacityChange(typeof val === 'number' ? val : val[0])}
            onChangeCommitted={(val) => handleOpacityChangeCommitted(typeof val === 'number' ? val : val[0])}
            min={0}
            max={100}
            step={1}
            layer="layer-3"
            layout="stacked"
            showInput={false}
            showValueLabel={true}
            showMinMaxLabels={false}
            valueLabel={(val) => `${val}%`}
            label={<Label layer="layer-3" layout="stacked">Opacity</Label>}
          />
        </div>

        {/* Shadow color picker + light/dark mirror toggle */}
        <div style={{ width: '100%', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <PaletteColorControl
            label="Shadow Color"
            targetCssVar={levelsArr.length > 0 ? getShadowColorCssVar(levelsArr[0]) : getShadowColorCssVar(1)}
            targetCssVars={levelsArr.length > 0 ? levelsArr.map(lvl => getShadowColorCssVar(lvl)) : [getShadowColorCssVar(1)]}
            currentValueCssVar={statePaletteSel
              ? `--recursica_brand_palettes_${statePaletteSel.paletteKey}_${statePaletteSel.paletteLevel}${statePaletteSel.paletteKey.startsWith('core') ? '_tone' : '_color_tone'}`
              : undefined}
            onSelect={onShadowColorSelect}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Switch
              checked={colorMirrorEnabled}
              onChange={onToggleColorMirror}
              layer="layer-0"
            />
            <label
              onClick={onToggleColorMirror}
              style={{
                color: `var(--recursica_brand_themes_${mode}_layers_layer-0_elements_text-color)`,
                opacity: `var(--recursica_brand_themes_${mode}_layers_layer-0_elements_text-low-emphasis)`,
                fontSize: 'var(--recursica_brand_typography_body-small-font-size)',
                cursor: 'pointer',
                flex: 1,
              }}
            >
              Link light/dark mode changes
            </label>
          </div>
        </div>
      </div>
    </Panel>
  )
}
