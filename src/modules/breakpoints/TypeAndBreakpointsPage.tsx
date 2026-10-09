/**
 * Type & Breakpoints — the grid and the type scale in one place.
 *
 * A brand starts with a single grid, `default`, and a single set of type styles. Extra breakpoints
 * are created deliberately; each one holds only what differs from the default.
 *
 * The preview is the point of the page: the grid is drawn at the selected breakpoint's width with
 * real columns, gutters and margin, and headings sit inside it so the type is judged against the
 * layout rather than on its own.
 *
 * Storage: the grid lives in `brand.layout-grids.<name>`. Per-breakpoint type overrides live in
 * `brand.breakpoints.<name>.typography.<style>`.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useVars } from '../vars/VarsContext'
import { useThemeMode } from '../theme/ThemeModeContext'
import { getVarsStore } from '../../core/store/varsStore'
import { genericLayerProperty, genericLayerText, palette, paletteCore, tokenOpacity } from '../../core/css/cssVarBuilder'
import { Checkbox } from '../../components/adapters/Checkbox'
import { Button } from '../../components/adapters/Button'
import { TextField } from '../../components/adapters/TextField'
import { Dropdown } from '../../components/adapters/Dropdown'
import { Textarea } from '../../components/adapters/Textarea'
import { Modal } from '../../components/adapters/Modal'
import { iconNameToReactComponent } from '../components/iconUtils'
import { Menu } from '../../components/adapters/Menu'
import { MenuItem } from '../../components/adapters/MenuItem'
import { ArrowSquareOut, DotsThreeOutline, PencilSimple, Trash } from '@phosphor-icons/react'
import TypeStylePanel from '../type/TypeStylePanel'
import BreakpointPanel from './BreakpointPanel'
import GridPreview from './GridPreview'
import {
  TYPE_PROPS,
  type TypeProp,
  overrideRef,
  overriddenStyles,
  writeTypeOverride,
} from './breakpointTypography'

const DEFAULT_GRID = 'default'
const LEGACY_GUTTER = 'gutter'
const PREVIEW_ROWS = 4
/** A width at or above this reads as wider than the base grid, so it applies from there up. */
const DESKTOP_WIDTH = 1280

export type SizeToken = { ref: string; key: string; px: number }
export type Grid = {
  name: string
  /** Applies below this width. Null on the base grid and on an 'up' breakpoint. */
  maxWidth: number | null
  /** Applies from this width up. Null on the base grid and on a 'down' breakpoint. */
  minWidth: number | null
  columns: number
  rowGutter: string
  columnGutter: string
  margin: string
}

/** A breakpoint's range as plain numbers; an open end reads as 0 or Infinity. */
export const rangeOf = (g: Grid): [number, number] => [g.minWidth ?? 0, g.maxWidth ?? Number.POSITIVE_INFINITY]

/**
 * A breakpoint is defined by one width: its edge. Below the base grid that edge is a ceiling, above
 * it a floor. The missing bound is imputed from the neighbouring breakpoints, which is what keeps
 * the ranges unique — there is no way to express an overlap.
 */
export const edgeOf = (g: Grid): number | null => g.maxWidth ?? g.minWidth ?? null

/**
 * Rewrites every breakpoint's imputed bound so the ladder stays contiguous: the narrowest starts at
 * 0, each next one starts just past the one below it, and a breakpoint above the base has no
 * ceiling at all. Run after any edge changes.
 */
export function imputeRanges(brand: any): void {
  const group = brand?.['layout-grids']
  if (!group) return
  const entries = Object.keys(group)
    .filter((k) => !k.startsWith('$') && k !== DEFAULT_GRID)
    .map((name) => ({ name, node: group[name] }))
    .filter((e) => e.node && typeof e.node === 'object')

  const ceilings = entries
    .filter((e) => e.node['max-width'] != null)
    .map((e) => ({ ...e, edge: numOrNull(e.node['max-width']) ?? 0 }))
    .sort((a, b) => a.edge - b.edge)

  let floor = 0
  for (const entry of ceilings) {
    if (floor > 0) entry.node['min-width'] = { $type: 'number', $value: floor }
    else delete entry.node['min-width']
    floor = entry.edge + 1
  }

  // Anything above the base keeps its floor as its edge and stays open-ended.
  for (const entry of entries) {
    if (entry.node['max-width'] == null) delete entry.node['max-width']
  }
}

/** How far a breakpoint's edge may move before it would pass a neighbour's. */
export function limitsFor(grids: Grid[], name: string): { floor: number; ceiling: number } {
  const own = grids.find((g) => g.name === name)
  const ownEdge = own ? edgeOf(own) : null
  if (ownEdge == null) return { floor: 0, ceiling: Number.POSITIVE_INFINITY }
  let floor = 0
  let ceiling = Number.POSITIVE_INFINITY
  for (const other of grids) {
    if (other.name === name || other.name === DEFAULT_GRID) continue
    const edge = edgeOf(other)
    if (edge == null) continue
    if (edge < ownEdge) floor = Math.max(floor, edge + 1)
    if (edge > ownEdge) ceiling = Math.min(ceiling, edge - 1)
  }
  return { floor, ceiling }
}

/** The breakpoint whose range already covers this width, if any. */
export const coveringRange = (grids: Grid[], width: number, exclude?: string): Grid | undefined =>
  grids.find((g) => {
    if (g.name === DEFAULT_GRID || g.name === exclude) return false
    const [from, to] = rangeOf(g)
    return width >= from && width <= to
  })

/** How a breakpoint's range reads on its tab. */
export const rangeLabel = (g: Grid): string => {
  if (g.minWidth != null && g.maxWidth != null) return `${g.minWidth}–${g.maxWidth}px`
  if (g.maxWidth != null) return `≤${g.maxWidth}px`
  if (g.minWidth != null) return `≥${g.minWidth}px`
  return ''
}

/** Where a grid sits relative to the base: below it, the base itself, or above it. */
export const directionOf = (g: Grid): 'down' | 'base' | 'up' =>
  g.name === DEFAULT_GRID ? 'base' : g.maxWidth != null ? 'down' : 'up'

export const unwrap = (node: any) => (node && typeof node === 'object' && '$value' in node ? node.$value : node)
const numOf = (node: any, fallback: number) => {
  const n = Number(unwrap(node))
  return Number.isFinite(n) ? n : fallback
}
const numOrNull = (node: any) => {
  const n = Number(unwrap(node))
  return Number.isFinite(n) ? n : null
}
const refOf = (node: any) => (typeof unwrap(node) === 'string' ? String(unwrap(node)) : '')

/** The spacing scale gutters and margins sit on, smallest first. */
export function readSizeScale(tokensJson: any): SizeToken[] {
  const sizes = tokensJson?.tokens?.sizes ?? tokensJson?.sizes ?? {}
  return Object.keys(sizes)
    .filter((k) => !k.startsWith('$'))
    .map((key) => {
      const raw = unwrap(sizes[key])
      const px = raw && typeof raw === 'object' && 'value' in raw ? Number(raw.value) : Number(raw)
      return { ref: `{tokens.sizes.${key}}`, key, px: Number.isFinite(px) ? px : 0 }
    })
    .sort((a, b) => a.px - b.px)
}

export function readGrids(themeJson: any): Grid[] {
  const brand = themeJson?.brand ?? themeJson
  const group = brand?.['layout-grids'] ?? {}
  const grids: Grid[] = Object.keys(group)
    .filter((k) => !k.startsWith('$'))
    .map((name) => {
      const g = group[name] ?? {}
      const legacy = refOf(g[LEGACY_GUTTER])
      const base = name === DEFAULT_GRID
      return {
        name,
        maxWidth: base ? null : numOrNull(g['max-width']),
        minWidth: base ? null : numOrNull(g['min-width']),
        columns: numOf(g.columns, 6),
        rowGutter: refOf(g['row-gutter']) || legacy,
        columnGutter: refOf(g['column-gutter']) || legacy,
        margin: refOf(g.margin),
      }
    })
  // Narrow breakpoints, then the base grid, then wide ones — the base always sits in the middle.
  const rank = (g: Grid) => (directionOf(g) === 'down' ? -1 : directionOf(g) === 'base' ? 0 : 1)
  return grids.sort((a, b) => {
    if (rank(a) !== rank(b)) return rank(a) - rank(b)
    return (a.maxWidth ?? a.minWidth ?? 0) - (b.maxWidth ?? b.minWidth ?? 0)  // by ceiling, else floor
  })
}

const SAMPLE_KEY = 'recursica_type_sample_text'
const DEFAULT_SAMPLE = 'The quick onyx goblin jumps over the lazy dwarf, executing a superb and swift maneuver with extraordinary zeal.'

export function readSampleText(): string {
  try { return localStorage.getItem(SAMPLE_KEY) || DEFAULT_SAMPLE } catch { return DEFAULT_SAMPLE }
}

export type Style = { key: string; label: string; prefix: string; tag: string }

/** Where a custom style records the element it is applied to. */
const ELEMENT_EXT = 'com.recursica.element'

/** The semantic elements a type style can be applied to. */
export const ELEMENT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'h1', label: 'Heading 1 (h1)' },
  { value: 'h2', label: 'Heading 2 (h2)' },
  { value: 'h3', label: 'Heading 3 (h3)' },
  { value: 'h4', label: 'Heading 4 (h4)' },
  { value: 'h5', label: 'Heading 5 (h5)' },
  { value: 'h6', label: 'Heading 6 (h6)' },
  { value: 'p', label: 'Paragraph (p)' },
  { value: 'caption', label: 'Caption (caption)' },
]

/** Labels, heading tags and reading order for the styles a brand ships with. */
/**
 * `tag` is what the sample renders as; `element` is the semantic element the style is applied to.
 * They differ where an element cannot stand on its own — a <caption> outside a table is invalid.
 */
const KNOWN: Record<string, { label: string; tag: string; element?: string }> = {
  h1: { label: 'H1', tag: 'h1' },
  h2: { label: 'H2', tag: 'h2' },
  h3: { label: 'H3', tag: 'h3' },
  h4: { label: 'H4', tag: 'h4' },
  h5: { label: 'H5', tag: 'h5' },
  h6: { label: 'H6', tag: 'h6' },
  body: { label: 'Body (p)', tag: 'p', element: 'p' },
  caption: { label: 'Caption (caption)', tag: 'p', element: 'caption' },
  overline: { label: 'Overline', tag: 'p' },
}
const KNOWN_ORDER = Object.keys(KNOWN)

/** The key a typed name becomes. */
const slugOf = (name: string) =>
  name.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')

const titleCase = (key: string) =>
  key.replace(/[-_]+/g, ' ').replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1))

/** The brand's own typography styles, known ones first, anything custom after. */
export function readStyles(themeJson: any): Style[] {
  const typography = (themeJson?.brand ?? themeJson)?.typography ?? {}
  return Object.keys(typography)
    .filter((k) => !k.startsWith('$'))
    .map((key) => ({
      key,
      label: KNOWN[key]?.label ?? titleCase(key),
      prefix: key,
      tag: KNOWN[key]?.tag
        ?? typography[key]?.$extensions?.[ELEMENT_EXT]?.element
        ?? 'p',
    }))
    .sort((a, b) => {
      const ai = KNOWN_ORDER.indexOf(a.key)
      const bi = KNOWN_ORDER.indexOf(b.key)
      if (ai === -1 && bi === -1) return a.key.localeCompare(b.key)
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
}

/** `{tokens.font.sizes.4xl}` → `var(--recursica_tokens_font_sizes_4xl)`. */
const refToVar = (ref: string) =>
  `var(--recursica_${ref.replace(/^\{|\}$/g, '').split('.').join('_')})`

/** Which CSS property each typography sub-property drives. */
const CSS_PROP: Record<TypeProp, keyof React.CSSProperties> = {
  fontFamily: 'fontFamily',
  fontSize: 'fontSize',
  fontWeight: 'fontWeight',
  letterSpacing: 'letterSpacing',
  lineHeight: 'lineHeight',
  fontStyle: 'fontStyle',
  textDecoration: 'textDecoration',
  textCase: 'textTransform',
}

/**
 * The style a sample renders with: the base type vars, then whatever this breakpoint overrides
 * pointed straight at its token. Reading the override here rather than re-declaring the base var
 * keeps the preview from changing type everywhere else in the app.
 */
export const styleOf = (
  prefix: string,
  opts?: { themeJson?: any; breakpoint?: string; styleKey?: string },
): React.CSSProperties => {
  const base: React.CSSProperties = {
    fontFamily: `var(--recursica_brand_typography_${prefix}-font-family)`,
    fontSize: `var(--recursica_brand_typography_${prefix}-font-size, 16px)`,
    fontWeight: `var(--recursica_brand_typography_${prefix}-font-weight, 400)` as any,
    fontStyle: `var(--recursica_brand_typography_${prefix}-font-style, normal)` as any,
    letterSpacing: `var(--recursica_brand_typography_${prefix}-font-letter-spacing, 0)`,
    lineHeight: `var(--recursica_brand_typography_${prefix}-line-height, normal)` as any,
    textDecoration: `var(--recursica_brand_typography_${prefix}-text-decoration, none)` as any,
    textTransform: `var(--recursica_brand_typography_${prefix}-text-transform, none)` as any,
    margin: 0,
  }
  const { themeJson, breakpoint, styleKey } = opts ?? {}
  if (!themeJson || !breakpoint || !styleKey || breakpoint === DEFAULT_GRID) return base
  for (const p of TYPE_PROPS) {
    const ref = overrideRef(themeJson, breakpoint, styleKey, p.key)
    if (ref) (base as any)[CSS_PROP[p.key]] = refToVar(ref)
  }
  return base
}

export default function TypeAndBreakpointsPage() {
  const { tokens: tokensJson, theme: themeJson, setTheme } = useVars()
  const { mode } = useThemeMode()
  const grids = useMemo(() => readGrids(themeJson), [themeJson])
  const styles = useMemo(() => readStyles(themeJson), [themeJson])
  const scale = useMemo(() => readSizeScale(tokensJson), [tokensJson])
  const [selectedBp, setSelectedBp] = useState(DEFAULT_GRID)
  const [selectedStyles, setSelectedStyles] = useState<string[]>([])
  const [gridPanelOpen, setGridPanelOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newWidth, setNewWidth] = useState('')
  const [adding, setAdding] = useState(false)
  const [sample, setSample] = useState(readSampleText)
  const [sampleDraft, setSampleDraft] = useState('')
  const [sampleOpen, setSampleOpen] = useState(false)
  const [newStyle, setNewStyle] = useState('')
  const [newStyleTag, setNewStyleTag] = useState('p')
  const [styleModalOpen, setStyleModalOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [typeMenuOpen, setTypeMenuOpen] = useState(false)
  const typeMenuRef = useRef<HTMLDivElement>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [renameTo, setRenameTo] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!menuOpen) return
    const onOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [menuOpen])

  useEffect(() => {
    if (!typeMenuOpen) return
    const onOutside = (e: MouseEvent) => {
      if (typeMenuRef.current && !typeMenuRef.current.contains(e.target as Node)) setTypeMenuOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [typeMenuOpen])


  // CSS vars change outside React; re-render so the samples reflect the current values.
  useEffect(() => {
    const handler = () => setTick((k) => k + 1)
    window.addEventListener('cssVarsUpdated', handler as any)
    window.addEventListener('typeChoicesChanged', handler as any)
    return () => {
      window.removeEventListener('cssVarsUpdated', handler as any)
      window.removeEventListener('typeChoicesChanged', handler as any)
    }
  }, [])

  useEffect(() => {
    const close = () => { setSelectedStyles([]); setGridPanelOpen(false) }
    window.addEventListener('closeAllPickersAndPanels', close)
    return () => window.removeEventListener('closeAllPickersAndPanels', close)
  }, [])

  const grid = grids.find((g) => g.name === selectedBp) ?? grids[0]
  const isDefault = !grid || grid.name === DEFAULT_GRID
  const pxOf = (ref: string, fallback: number) => scale.find((s) => s.ref === ref)?.px ?? fallback

  const commitTheme = (mutate: (brand: any) => void) => {
    const next = getVarsStore().getLatestThemeCopy()
    mutate(next.brand ?? next)
    setTheme(next)
  }

  const writeGrid = (name: string, patch: Partial<Grid>) => {
    // An edge cannot move past the breakpoints either side of it.
    const { floor, ceiling } = limitsFor(grids, name)
    const clampEdge = (v: number) => Math.min(Math.max(v, floor), ceiling)

    commitTheme((brand) => {
      if (!brand['layout-grids']) brand['layout-grids'] = {}
      const entry = { ...(brand['layout-grids'][name] ?? {}) }
      // The base grid is what applies when no breakpoint does, so it never carries a width —
      // clear one left behind by an older brand.
      if (name === DEFAULT_GRID) {
        delete entry['max-width']
        delete entry['min-width']
      }
      // Carry a legacy single `gutter` onto both axes before dropping it, so editing one field
      // never throws the other value away.
      const legacy = entry[LEGACY_GUTTER]
      if (legacy !== undefined) {
        if (entry['row-gutter'] === undefined) entry['row-gutter'] = legacy
        if (entry['column-gutter'] === undefined) entry['column-gutter'] = legacy
        delete entry[LEGACY_GUTTER]
      }
      if (patch.maxWidth != null) entry['max-width'] = { $type: 'number', $value: clampEdge(patch.maxWidth) }
      if (patch.minWidth != null) entry['min-width'] = { $type: 'number', $value: clampEdge(patch.minWidth) }
      if (patch.columns !== undefined) entry.columns = { $type: 'number', $value: patch.columns }
      if (patch.rowGutter !== undefined) entry['row-gutter'] = { $type: 'number', $value: patch.rowGutter }
      if (patch.columnGutter !== undefined) entry['column-gutter'] = { $type: 'number', $value: patch.columnGutter }
      if (patch.margin !== undefined) entry.margin = { $type: 'number', $value: patch.margin }
      brand['layout-grids'][name] = entry
      // Moving one edge moves the neighbour's imputed bound with it, so the ladder stays
      // contiguous — no gaps, no overlaps.
      imputeRanges(brand)
    })
  }

  /**
   * A new breakpoint needs a name and a width. Which side of the base grid it applies on comes
   * from that width: narrower than a desktop container applies up to it, wider applies from it.
   */
  /** A name already in use, so Create can say so rather than quietly doing nothing. */
  const nameConflict = useMemo(() => {
    const name = slugOf(newName)
    if (!name) return undefined
    if (name === DEFAULT_GRID) return 'default'
    return grids.find((g) => g.name === name)?.name
  }, [newName, grids])

  /** Two breakpoints cannot share an edge — that would leave one of them with no range at all. */
  const widthConflict = useMemo(() => {
    const width = Number(newWidth)
    if (!Number.isFinite(width) || width <= 0) return undefined
    return grids.find((g) => g.name !== DEFAULT_GRID && edgeOf(g) === width)
  }, [newWidth, grids])

  const addBreakpoint = () => {
    const name = slugOf(newName)
    const width = Number(newWidth)
    if (!name || nameConflict || widthConflict) return
    if (!Number.isFinite(width) || width <= 0) return
    const base = grids.find((g) => g.name === DEFAULT_GRID) ?? grids[0]
    // The width given is the breakpoint's edge; the other bound is imputed from its neighbours.
    const up = width >= DESKTOP_WIDTH
    commitTheme((brand) => {
      if (!brand['layout-grids']) brand['layout-grids'] = {}
      brand['layout-grids'][name] = {
        [up ? 'min-width' : 'max-width']: { $type: 'number', $value: width },
        columns: { $type: 'number', $value: up ? (base?.columns ?? 6) : Math.max(2, Math.round((base?.columns ?? 6) / 2)) },
        'row-gutter': { $type: 'number', $value: base?.rowGutter || scale[2]?.ref || '' },
        'column-gutter': { $type: 'number', $value: base?.columnGutter || scale[2]?.ref || '' },
        margin: { $type: 'number', $value: base?.margin || scale[2]?.ref || '' },
      }
      imputeRanges(brand)
    })
    setSelectedBp(name)
    setNewName('')
    setNewWidth('')
    setAdding(false)
    // Straight into fine tuning on the new breakpoint.
    setSelectedStyles([])
    setGridPanelOpen(true)
  }

  /**
   * Opens this breakpoint on its own so it can be dragged onto a second screen or phone. The
   * window reads the same store, and reloads itself when an edit here lands in it.
   */
  const openInWindow = () => {
    if (!grid) return
    const width = grid.maxWidth ?? grid.minWidth ?? 1280
    window.open(
      `/breakpoint-window/${encodeURIComponent(grid.name)}`,
      `recursica-breakpoint-${grid.name}`,
      `width=${Math.min(width, 1600)},height=900`,
    )
  }

  /**
   * Renames a breakpoint, carrying its grid and its type overrides to the new key. Object key
   * order is rebuilt so the tab does not jump to the end of the list.
   */
  const renameBreakpoint = (from: string, to: string) => {
    const name = to.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')
    if (!name || name === DEFAULT_GRID || name === from || grids.some((g) => g.name === name)) return
    commitTheme((brand) => {
      const rekey = (group: any) => {
        if (!group?.[from]) return
        const rebuilt: Record<string, unknown> = {}
        for (const [key, value] of Object.entries(group)) rebuilt[key === from ? name : key] = value
        for (const key of Object.keys(group)) delete group[key]
        Object.assign(group, rebuilt)
      }
      rekey(brand['layout-grids'])
      rekey(brand.breakpoints)
    })
    setSelectedBp(name)
    setRenaming(null)
  }

  const removeBreakpoint = (name: string) => {
    commitTheme((brand) => {
      delete brand['layout-grids']?.[name]
      delete brand.breakpoints?.[name]
      if (brand.breakpoints && Object.keys(brand.breakpoints).length === 0) delete brand.breakpoints
    })
    setSelectedBp(DEFAULT_GRID)
    setGridPanelOpen(false)
  }

  /** Styles this breakpoint overrides, so the list can mark them. */
  const overridden = useMemo(() => overriddenStyles(themeJson, selectedBp), [themeJson, selectedBp])

  const saveSample = () => {
    const next = sampleDraft.trim()
    if (!next) return
    try { localStorage.setItem(SAMPLE_KEY, next) } catch {}
    setSample(next)
    setSampleOpen(false)
  }

  /** A new style copies the body style, so it starts from something real rather than blank. */
  const addStyle = () => {
    const key = newStyle.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    if (!key || styles.some((x) => x.key === key)) return
    commitTheme((brand) => {
      // Start from the style that already uses this element, so the new one is a sane variant of it.
      const sibling = Object.keys(KNOWN).find((k) => KNOWN[k].tag === newStyleTag)
      const source = brand.typography?.[sibling ?? 'body'] ?? brand.typography?.[styles[0]?.key]
      if (!source) return
      const next = JSON.parse(JSON.stringify(source))
      next.$extensions = { ...(next.$extensions ?? {}), [ELEMENT_EXT]: { element: newStyleTag } }
      brand.typography[key] = next
    })
    setStyleModalOpen(false)
    setNewStyle('')
    setSelectedStyles([key])
  }

  const text = `var(${genericLayerText(0, 'color')})`
  const border = `var(${genericLayerProperty(1, 'border-color')})`
  const surface1 = `var(${genericLayerProperty(1, 'surface')})`
  const accent = 'var(--recursica_brand_palettes_core-colors_interactive_tone)'
  const onAccent = 'var(--recursica_brand_palettes_core-colors_interactive_on-tone)'

  const PlusIcon = iconNameToReactComponent('plus')
  const plusIcon = PlusIcon
    ? <PlusIcon style={{ width: 'var(--recursica_brand_dimensions_icons_default)', height: 'var(--recursica_brand_dimensions_icons_default)' }} />
    : null

  const panelCard: React.CSSProperties = {
    background: `var(${genericLayerProperty(0, 'surface')})`,
    border: `1px solid var(${genericLayerProperty(0, 'border-color')})`,
    borderRadius: 'var(--recursica_brand_dimensions_border-radii_xl)',
    padding: 0,
  }

  const colGap = pxOf(grid?.columnGutter ?? '', 16)
  const rowGap = pxOf(grid?.rowGutter ?? '', 24)
  const margin = pxOf(grid?.margin ?? '', 24)
  const cols = Math.max(2, Math.min(24, grid?.columns ?? 6))
  const samples = styles.slice(0, PREVIEW_ROWS)

  return (
    <div style={{ padding: 'var(--recursica_brand_dimensions_general_xl)', color: text }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <h1 style={{ ...styleOf('h1'), margin: '0 0 24px' }}>Breakpoints</h1>

        {/* The breakpoints, in a panel of their own */}
        <div data-recursica-layer="0" style={{ ...panelCard, marginBottom: 32 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 12, flexWrap: 'wrap',
            paddingTop: 'var(--recursica_brand_dimensions_gutters_vertical)',
            paddingBottom: 'var(--recursica_brand_dimensions_gutters_vertical)',
            paddingLeft: 'var(--recursica_brand_dimensions_gutters_horizontal)',
            paddingRight: 'var(--recursica_brand_dimensions_gutters_horizontal)',
            borderBottom: `1px solid var(${genericLayerProperty(0, 'border-color')})`,
          }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {grids.map((g) => {
                const active = g.name === selectedBp
                return (
                  <button key={g.name} onClick={() => { setSelectedBp(g.name); setSelectedStyles([]) }}
                    style={{
                      padding: '8px 14px', borderRadius: 'var(--recursica_brand_dimensions_border-radii_default)',
                      border: `1px solid ${active ? accent : 'transparent'}`,
                      background: active ? accent : 'transparent',
                      color: active ? onAccent : text,
                      cursor: 'pointer', font: 'inherit', fontSize: 14, textTransform: 'capitalize',
                    }}>
                    {g.name}{g.name !== DEFAULT_GRID
                      ? ` (${rangeLabel(g)})`
                      : ''}
                  </button>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Button variant="outline" size="small" icon={plusIcon} layer="layer-0"
                onClick={() => { setNewName(''); setNewWidth(''); setAdding(true) }}>Add breakpoint</Button>
              <Button size="small" layer="layer-0"
                onClick={() => { setGridPanelOpen(true); setSelectedStyles([]) }}>Edit grid</Button>
              <div ref={menuRef} style={{ position: 'relative' }}>
                  <Button
                    variant="text"
                    size="small"
                    layer="layer-0"
                    icon={<DotsThreeOutline size={16} weight="fill" />}
                    onClick={() => setMenuOpen((prev) => !prev)}
                  />
                {menuOpen && (
                  <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, zIndex: 100 }}>
                    <Menu layer="layer-1">
                      <MenuItem
                        layer="layer-1"
                        leadingIcon={<ArrowSquareOut size={14} />}
                        leadingIconType="icon"
                        onClick={() => { openInWindow(); setMenuOpen(false) }}
                      >
                        Open window
                      </MenuItem>
                      {/* The base grid is not a breakpoint, so it cannot be renamed or deleted. */}
                      {!isDefault && (
                        <MenuItem
                          layer="layer-1"
                          leadingIcon={<PencilSimple size={14} />}
                          leadingIconType="icon"
                          onClick={() => { setRenameTo(selectedBp); setRenaming(selectedBp); setMenuOpen(false) }}
                        >
                          Rename breakpoint
                        </MenuItem>
                      )}
                      {!isDefault && (
                        <MenuItem
                          layer="layer-1"
                          leadingIcon={<Trash size={14} />}
                          leadingIconType="icon"
                          onClick={() => { setConfirmDelete(selectedBp); setMenuOpen(false) }}
                        >
                          Delete
                        </MenuItem>
                      )}
                    </Menu>
                  </div>
                )}
              </div>
            </div>
          </div>

        {/* Preview — the grid at this breakpoint, with headings set into it */}
        {grid && (
          <div>
            <GridPreview
              grid={grid}
              styles={styles}
              scale={scale}
              themeJson={themeJson}
              mode={mode}
            />
          </div>
        )}
        </div>

        {/* Type styles for this breakpoint */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <h2 style={{ ...styleOf('h2'), margin: 0 }}>Type</h2>
          <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <Button variant="outline" size="small" icon={plusIcon} layer="layer-0"
              onClick={() => { setNewStyle(''); setNewStyleTag('p'); setStyleModalOpen(true) }}>Add type style</Button>
            <div ref={typeMenuRef} style={{ position: 'relative' }}>
              <Button
                variant="text"
                size="small"
                layer="layer-0"
                icon={<DotsThreeOutline size={16} weight="fill" />}
                onClick={() => setTypeMenuOpen((prev) => !prev)}
              />
              {typeMenuOpen && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, zIndex: 100 }}>
                  <Menu layer="layer-1">
                    <MenuItem
                      layer="layer-1"
                      leadingIcon={<PencilSimple size={14} />}
                      leadingIconType="icon"
                      onClick={() => { setSampleDraft(sample); setSampleOpen(true); setTypeMenuOpen(false) }}
                    >
                      Edit sample text
                    </MenuItem>
                  </Menu>
                </div>
              )}
            </div>
          </span>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          {styles.map((s) => {
            const checked = selectedStyles.includes(s.prefix)
            const isOverridden = overridden.has(s.key)
            const select = (on: boolean) => {
              setGridPanelOpen(false)
              setSelectedStyles((prev) => {
                const set = new Set(prev)
                if (on) set.add(s.prefix); else set.delete(s.prefix)
                return Array.from(set)
              })
            }
            // The layer-1 card, same as the Type page shipped: the whole card is the hit area,
            // and its surface, border and padding come from the layer rather than fixed numbers.
            const cardBorder = checked
              ? `var(${paletteCore(mode, 'alert', 'tone')})`
              : isOverridden
                ? accent
                : `var(${genericLayerProperty(1, 'border-color')})`
            return (
              <div
                key={s.key}
                data-recursica-layer="1"
                onClick={() => select(!checked)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  backgroundColor: `var(${genericLayerProperty(1, 'surface')})`,
                  color: text,
                  border: `var(${genericLayerProperty(1, 'border-size')}) solid ${cardBorder}`,
                  borderRadius: `var(${genericLayerProperty(1, 'border-radius')})`,
                  padding: `var(${genericLayerProperty(1, 'padding')})`,
                  boxShadow: 'none', // layer 1 is elevation-0
                }}
              >
                <div onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={checked}
                    onChange={(c: any) => select(typeof c === 'boolean' ? c : !!c?.target?.checked)}
                    layer="layer-1"
                  />
                </div>
                {(() => {
                  const Tag = s.tag as any
                  return (
                    <Tag style={styleOf(s.prefix, { themeJson, breakpoint: selectedBp, styleKey: s.key })}>
                      {s.label} – {sample}
                    </Tag>
                  )
                })()}
              </div>
            )
          })}
        </div>
      </div>

      <Modal
        isOpen={sampleOpen}
        onClose={() => setSampleOpen(false)}
        title="Sample text"
        primaryActionLabel="Save"
        onPrimaryAction={saveSample}
        primaryActionDisabled={!sampleDraft.trim()}
        showSecondaryButton
        secondaryActionLabel="Reset"
        onSecondaryAction={() => setSampleDraft(DEFAULT_SAMPLE)}
        layer="layer-0"
      >
        {sampleOpen && <Textarea
          value={sampleDraft}
          onChange={(e: any) => setSampleDraft(typeof e === 'string' ? e : e?.target?.value ?? '')}
          layer="layer-1"
          disableTopBottomMargin
        />}
      </Modal>

      <Modal
        isOpen={!!renaming}
        onClose={() => setRenaming(null)}
        title="Rename breakpoint"
        primaryActionLabel="Rename"
        onPrimaryAction={() => { if (renaming) renameBreakpoint(renaming, renameTo) }}
        primaryActionDisabled={!renameTo.trim() || renameTo.trim() === renaming}
        showSecondaryButton
        secondaryActionLabel="Cancel"
        onSecondaryAction={() => setRenaming(null)}
        layer="layer-0"
      >
        {renaming && <TextField
          label="Name"
          value={renameTo}
          onChange={(e: any) => setRenameTo(typeof e === 'string' ? e : e?.target?.value ?? '')}
          layer="layer-1"
        />}
      </Modal>

      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title={`Delete ${confirmDelete ?? ''}?`}
        primaryActionLabel="Delete"
        onPrimaryAction={() => {
          if (confirmDelete) removeBreakpoint(confirmDelete)
          setConfirmDelete(null)
        }}
        showSecondaryButton
        secondaryActionLabel="Cancel"
        onSecondaryAction={() => setConfirmDelete(null)}
        layer="layer-0"
      >
        <p style={{ margin: 0 }}>
          Its grid and any type changes made for it are removed. The base grid is not affected.
        </p>
      </Modal>

      <Modal
        isOpen={adding}
        onClose={() => setAdding(false)}
        title="New breakpoint"
        primaryActionLabel="Create"
        onPrimaryAction={addBreakpoint}
        primaryActionDisabled={!newName.trim() || !(Number(newWidth) > 0) || !!widthConflict || !!nameConflict}
        showSecondaryButton
        secondaryActionLabel="Cancel"
        onSecondaryAction={() => setAdding(false)}
        layer="layer-0"
      >
        {adding && <><TextField
          label="Name"
          placeholder="e.g. mobile"
          errorText={nameConflict ? `${nameConflict} already exists` : undefined}
          value={newName}
          onChange={(e: any) => setNewName(typeof e === 'string' ? e : e?.target?.value ?? '')}
          layer="layer-1"
        />
        <TextField
          label="Width (px)"
          placeholder="e.g. 480"
          errorText={widthConflict ? `${widthConflict.name} already ends at ${edgeOf(widthConflict)}px` : undefined}
          value={newWidth}
          onChange={(e: any) => {
            const raw = typeof e === 'string' ? e : e?.target?.value ?? ''
            setNewWidth(raw.replace(/[^0-9]/g, ''))
          }}
          layer="layer-1"
        /></>}
      </Modal>

      <Modal
        isOpen={styleModalOpen}
        onClose={() => setStyleModalOpen(false)}
        title="New type style"
        primaryActionLabel="Create"
        onPrimaryAction={addStyle}
        primaryActionDisabled={!newStyle.trim()}
        showSecondaryButton
        secondaryActionLabel="Cancel"
        onSecondaryAction={() => setStyleModalOpen(false)}
        layer="layer-0"
      >
        {styleModalOpen && <><TextField
          label="Name"
          placeholder="e.g. lead"
          value={newStyle}
          onChange={(e: any) => setNewStyle(typeof e === 'string' ? e : e?.target?.value ?? '')}
          layer="layer-1"
        />
        <Dropdown
          label="Applies to"
          items={ELEMENT_OPTIONS}
          value={newStyleTag}
          onChange={(v) => setNewStyleTag(v || 'p')}
          layer="layer-1"
          zIndex={10001}
        /></>}
      </Modal>

      <TypeStylePanel
        open={selectedStyles.length > 0}
        selectedPrefixes={selectedStyles}
        breakpoint={isDefault ? undefined : selectedBp}
        title={`${selectedStyles.length === 1
          ? (styles.find((x) => x.prefix === selectedStyles[0])?.label || 'Type')
          : 'Multiple'}${isDefault ? '' : ` · ${selectedBp}`}`}
        onClose={() => setSelectedStyles([])}
      />

      {grid && (
        <BreakpointPanel
          open={gridPanelOpen}
          grid={grid}
          scale={scale}
          isDefault={isDefault}
          limits={limitsFor(grids, grid.name)}
          onChange={(patch) => writeGrid(grid.name, patch)}
          onClose={() => setGridPanelOpen(false)}
        />
      )}
    </div>
  )
}
