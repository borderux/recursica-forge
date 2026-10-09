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
import { coveringRange, readGrids, readSizeScale, readStyles } from './TypeAndBreakpointsPage'

/** The store keys a theme edit lands in. A change to any of them means this view is stale. */
const WATCHED = ['recursica_brand_edited', 'recursica_tokens_edited', 'recursica_uikit_edited']
const SAMPLE_STORAGE_KEY = 'recursica_type_sample_text'

export default function BreakpointWindowPage() {
  // The route names the breakpoint the window opened on, but from then on the window's own width
  // decides — resize it and the grid switches like it would on a real device.
  const { name = 'default' } = useParams()
  const { tokens: tokensJson, theme: themeJson } = useVars()
  const { mode } = useThemeMode()

  const grids = useMemo(() => readGrids(themeJson), [themeJson])
  const styles = useMemo(() => readStyles(themeJson), [themeJson])
  const scale = useMemo(() => readSizeScale(tokensJson), [tokensJson])
  const [viewport, setViewport] = useState(() => (typeof window === 'undefined' ? 0 : window.innerWidth))

  const edges = useMemo(() => {
    const values = new Set<number>()
    for (const g of grids) {
      if (g.minWidth != null) values.add(g.minWidth)
      if (g.maxWidth != null) values.add(g.maxWidth + 1)
    }
    return [...values].sort((a, b) => a - b)
  }, [grids])

  /**
   * Watches the width from three angles, because no single one fires everywhere: the resize event,
   * a ResizeObserver on the document, and a media query per breakpoint edge — the last is what
   * still fires under device emulation, where the window itself never reports a resize.
   */
  useEffect(() => {
    const measure = () => setViewport(document.documentElement.clientWidth || window.innerWidth)
    measure()
    window.addEventListener('resize', measure)
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    observer?.observe(document.documentElement)
    const queries = edges.map((edge) => window.matchMedia(`(min-width: ${edge}px)`))
    queries.forEach((q) => q.addEventListener('change', measure))
    // Last resort for hosts that deliver none of the above (a preview pane emulating a device):
    // re-read on a slow timer so the grid can never sit on the wrong breakpoint.
    const timer = setInterval(measure, 300)
    return () => {
      window.removeEventListener('resize', measure)
      observer?.disconnect()
      queries.forEach((q) => q.removeEventListener('change', measure))
      clearInterval(timer)
    }
  }, [edges])

  const grid =
    coveringRange(grids, viewport)
    ?? grids.find((g) => g.name === 'default')
    ?? grids.find((g) => g.name === name)
    ?? grids[0]

  // An edit in the editor window lands in localStorage; reload so the whole var pipeline reruns
  // against it. Debounced, because a drag writes several times in a row.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const onStorage = (e: StorageEvent) => {
      if (e.key && !WATCHED.includes(e.key) && e.key !== SAMPLE_STORAGE_KEY) return
      if (e.key === SAMPLE_STORAGE_KEY) return
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
        themeJson={themeJson}
        mode={mode}
        standalone
      />
    </div>
  )
}
