/**
 * GridPreview — the grid drawn at a breakpoint with the headings set into it.
 *
 * Shared by the Breakpoints page and the standalone preview window, so a device window shows
 * exactly what the page shows.
 */

import { genericLayerProperty, palette, tokenOpacity } from '../../core/css/cssVarBuilder'
import { styleOf, type Grid, type SizeToken, type Style } from './TypeAndBreakpointsPage'

/**
 * The preview shows a heading, a subheading and a paragraph — enough to judge a layout. Each line
 * is its own copy rather than the sample sentence repeated, so the block reads like a real page.
 */
const PREVIEW_COPY: Array<{ style: string; text: string }> = [
  { style: 'h1', text: 'Nightfall at the Onyx Crossing' },
  { style: 'h2', text: 'What the dwarf saw, and what the village wrote down' },
  {
    style: 'body',
    text:
      'Goblins have crossed here since the river was narrow enough to argue over, and every one ' +
      'of them is measured against the onyx. The dwarf keeps the ledger, though he keeps it badly, ' +
      'and the village has learned to read around his handwriting. Ask three of them how far the ' +
      'last jump carried and you will get three numbers, a long silence, and a fourth number ' +
      'nobody will stand behind.',
  },
]

const PREVIEW_ROWS = PREVIEW_COPY.length

type Props = {
  grid: Grid
  styles: Style[]
  scale: SizeToken[]
  themeJson: any
  mode: string
  /** Fills the window rather than sitting in the page's container. */
  standalone?: boolean
}

export default function GridPreview({ grid, styles, scale, themeJson, mode, standalone }: Props) {
  const pxOf = (ref: string, fallback: number) => scale.find((s) => s.ref === ref)?.px ?? fallback
  const colGap = pxOf(grid.columnGutter, 16)
  const rowGap = pxOf(grid.rowGutter, 24)
  const margin = pxOf(grid.margin, 24)
  const cols = Math.max(2, Math.min(24, grid.columns))
  // Fall back to whatever styles the brand has, in case it renamed or dropped the usual ones.
  const samples = PREVIEW_COPY.map((row, i) =>
    styles.find((st) => st.key === row.style) ?? styles[i]).filter(Boolean)
  const border = `var(${genericLayerProperty(1, 'border-color')})`
  const capped = grid.maxWidth != null || grid.minWidth != null
  const accent = 'var(--recursica_brand_palettes_core-colors_interactive_tone)'

  return (
    <div style={{
      width: '100%',
      // Drawn at the top of its range, which is the width it has to hold.
      maxWidth: standalone ? '100%' : (grid.maxWidth ?? grid.minWidth ?? '100%'),
      margin: '0 auto',
      // Neutral 050 at the mist opacity, mixed into the colour rather than set as element
      // opacity, so the samples on top stay at full strength.
      background: `color-mix(in srgb, var(${palette(mode, 'neutral', '050', 'color_tone')}) calc(var(${tokenOpacity('mist')}) * 100%), transparent)`,
      // A capped grid is narrower than the space around it, so it gets an edge to show where it
      // stops. The base grid fills that space and needs none.
      border: !standalone && capped ? `1px solid ${border}` : 'none',
      borderRadius: !standalone && capped ? 'var(--recursica_brand_dimensions_border-radii_default)' : 0,
      paddingInline: margin,
      paddingBlock: margin,
      minHeight: standalone ? '100vh' : undefined,
      boxSizing: 'border-box',
    }}>
      <div style={{ display: 'grid', gap: rowGap }}>
        {samples.map((s, r) => {
          return (
            <div key={r} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: colGap }}>
              {/* Column guides sit behind the text so both read at once */}
              {Array.from({ length: cols }).map((__, c) => (
                <div key={c} style={{ background: accent, opacity: 0.09, borderRadius: 2, minHeight: 8, gridRow: 1, gridColumn: c + 1 }} />
              ))}
              {s && (
                <div style={{ gridRow: 1, gridColumn: '1 / -1', padding: '2px 0' }}>
                  {(() => {
                    const Tag = s.tag as any
                    return (
                      <Tag style={styleOf(s.prefix, { themeJson, breakpoint: grid.name, styleKey: s.key })}>
                        {PREVIEW_COPY[r].text}
                      </Tag>
                    )
                  })()}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
