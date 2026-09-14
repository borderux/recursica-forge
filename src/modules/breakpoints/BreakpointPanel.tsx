/**
 * BreakpointPanel — the right-hand editor for the selected grid.
 *
 * Built like the type panel: discrete sliders, the value shown beside the label, and token names
 * rather than raw pixels wherever the value is a token. Columns and width are counts, so they read
 * as numbers.
 *
 * Dragging updates local state only; the theme is written on release, so a drag is one write
 * instead of one per step.
 */

import { useEffect, useState } from 'react'
import { Panel } from '../../components/adapters/Panel'
import { Slider } from '../../components/adapters/Slider'
import { Label } from '../../components/adapters/Label'
import type { Grid, SizeToken } from './TypeAndBreakpointsPage'

const MIN_COLUMNS = 2
const MAX_COLUMNS = 24
const MIN_WIDTH = 320
const MAX_WIDTH = 2560
const WIDTH_STEP = 20

type Props = {
  open: boolean
  grid: Grid
  scale: SizeToken[]
  isDefault: boolean
  onChange: (patch: Partial<Grid>) => void
  onClose: () => void
}

const asNumber = (v: number | [number, number]) => Math.round(typeof v === 'number' ? v : v[0])
const titleCase = (s: string) => s.replace(/[-_]+/g, ' ').replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1))

export default function BreakpointPanel({ open, grid, scale, isDefault, onChange, onClose }: Props) {
  // Slider positions while dragging. Null means "read the stored value".
  const [draft, setDraft] = useState<Partial<Record<keyof Grid, number>>>({})

  useEffect(() => { setDraft({}) }, [grid.name, open])

  if (!open) return null

  const indexOf = (ref: string) => {
    const i = scale.findIndex((s) => s.ref === ref)
    return i < 0 ? 0 : i
  }
  const tokenLabel = (index: number) => {
    const token = scale[index]
    return token ? `${token.key} · ${token.px}px` : ''
  }

  const sizeSlider = (
    label: string,
    field: 'columnGutter' | 'rowGutter' | 'margin',
    ref: string,
  ) => (
    <Slider
      value={draft[field] ?? indexOf(ref)}
      onChange={(v) => setDraft((d) => ({ ...d, [field]: asNumber(v) }))}
      onChangeCommitted={(v) => {
        const token = scale[asNumber(v)]
        if (token) onChange({ [field]: token.ref } as Partial<Grid>)
      }}
      min={0}
      max={Math.max(0, scale.length - 1)}
      step={1}
      type="discrete"
      layer="layer-3"
      layout="stacked"
      showInput={false}
      showValueLabel
      showMinMaxLabels={false}
      valueLabel={tokenLabel}
      tooltipText={tokenLabel}
      label={<Label layer="layer-3" layout="stacked">{label}</Label>}
    />
  )

  return (
    <Panel
      overlay
      position="right"
      title={titleCase(grid.name)}
      onClose={onClose}
      width="400px"
      zIndex={10000}
      layer="layer-0"
    >
      {/* Room at the top so the first slider's tooltip isn't clipped by the panel header. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 20 }}>
        <Slider
          value={draft.columns ?? Math.min(MAX_COLUMNS, Math.max(MIN_COLUMNS, grid.columns))}
          onChange={(v) => setDraft((d) => ({ ...d, columns: asNumber(v) }))}
          onChangeCommitted={(v) => onChange({ columns: asNumber(v) })}
          min={MIN_COLUMNS}
          max={MAX_COLUMNS}
          step={1}
          type="discrete"
          layer="layer-3"
          layout="stacked"
          showInput={false}
          showValueLabel
          showMinMaxLabels={false}
          valueLabel={(v: number) => String(v)}
          tooltipText={(v: number) => String(v)}
          label={<Label layer="layer-3" layout="stacked">Columns</Label>}
        />

        {sizeSlider('Column gutter', 'columnGutter', grid.columnGutter)}
        {sizeSlider('Row gutter', 'rowGutter', grid.rowGutter)}
        {sizeSlider('Side margin', 'margin', grid.margin)}

        {/* The base grid has no width — it is what applies when no breakpoint does. */}
        {!isDefault && (
          <>
            <Slider
              value={draft.minWidth ?? grid.minWidth ?? MIN_WIDTH}
              onChange={(v) => setDraft((d) => ({ ...d, minWidth: asNumber(v) }))}
              onChangeCommitted={(v) => onChange({ minWidth: asNumber(v) })}
              min={MIN_WIDTH}
              max={MAX_WIDTH}
              step={WIDTH_STEP}
              layer="layer-3"
              layout="stacked"
              showInput={false}
              showValueLabel
              showMinMaxLabels={false}
              valueLabel={(v: number) => `${v}px`}
              tooltipText={(v: number) => `${v}px`}
              label={<Label layer="layer-3" layout="stacked">From</Label>}
            />
            <Slider
              value={draft.maxWidth ?? grid.maxWidth ?? MAX_WIDTH}
              onChange={(v) => setDraft((d) => ({ ...d, maxWidth: asNumber(v) }))}
              onChangeCommitted={(v) => onChange({ maxWidth: asNumber(v) })}
              min={MIN_WIDTH}
              max={MAX_WIDTH}
              step={WIDTH_STEP}
              layer="layer-3"
              layout="stacked"
              showInput={false}
              showValueLabel
              showMinMaxLabels={false}
              valueLabel={(v: number) => `${v}px`}
              tooltipText={(v: number) => `${v}px`}
              label={<Label layer="layer-3" layout="stacked">To</Label>}
            />
          </>
        )}
      </div>
    </Panel>
  )
}
