/**
 * BreakpointWindowPage — one breakpoint's grid, on its own, for putting on a real device.
 *
 * Opened with window.open from the Breakpoints page. It stays connected to the editor: the store
 * persists the brand and tokens to localStorage, and a write in one window fires a `storage` event
 * in every other window on the same origin. This window reloads on that event, so the grid always
 * shows the current values. It only ever reads — nothing here writes back.
 */

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useVars } from '../vars/VarsContext'
import { useThemeMode } from '../theme/ThemeModeContext'
import { genericLayerProperty, genericLayerText } from '../../core/css/cssVarBuilder'
import GridPreview from './GridPreview'
import { readGrids, readSizeScale, readStyles, readSampleText } from './TypeAndBreakpointsPage'

/** The store keys a theme edit lands in. A change to any of them means this view is stale. */
const WATCHED = ['recursica_brand_edited', 'recursica_tokens_edited', 'recursica_uikit_edited']
const SAMPLE_STORAGE_KEY = 'recursica_type_sample_text'

export default function BreakpointWindowPage() {
  const { name = 'default' } = useParams()
  const { tokens: tokensJson, theme: themeJson } = useVars()
  const { mode } = useThemeMode()
  const [sample, setSample] = useState(readSampleText)

  const grids = useMemo(() => readGrids(themeJson), [themeJson])
  const styles = useMemo(() => readStyles(themeJson), [themeJson])
  const scale = useMemo(() => readSizeScale(tokensJson), [tokensJson])
  const grid = grids.find((g) => g.name === name) ?? grids[0]

  // An edit in the editor window lands in localStorage; reload so the whole var pipeline reruns
  // against it. Debounced, because a drag writes several times in a row.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const onStorage = (e: StorageEvent) => {
      if (e.key && !WATCHED.includes(e.key) && e.key !== SAMPLE_STORAGE_KEY) return
      if (e.key === SAMPLE_STORAGE_KEY) {
        setSample(readSampleText())
        return
      }
      clearTimeout(timer)
      timer = setTimeout(() => window.location.reload(), 150)
    }
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('storage', onStorage)
      clearTimeout(timer)
    }
  }, [])

  const text = `var(${genericLayerText(0, 'color')})`

  if (!grid) return null

  return (
    <div style={{
      minHeight: '100vh',
      background: `var(${genericLayerProperty(0, 'surface')})`,
      color: text,
    }}>
      <GridPreview
        grid={grid}
        styles={styles}
        scale={scale}
        sample={sample}
        themeJson={themeJson}
        mode={mode}
        standalone
      />
    </div>
  )
}
