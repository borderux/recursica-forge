/**
 * TypePage
 *
 * Minimal renderer for typography samples. Reads CSS variables already
 * applied globally and renders each sample without any editing UI.
 */
import { useMemo, useState, useEffect } from 'react'
import TypeTokensPanel from './TypeTokensPanel'
import TypeStylePanel from './TypeStylePanel'

// local helpers retained for legacy but no longer used directly in this file

// no-op placeholder removed (SimpleTypeSample has its own readCssVar)

export function TypePage() {
  type Sample = { label: string; tag: keyof JSX.IntrinsicElements; text: string; prefix: string }

  // removed: family options handled inside TypeSample when needed

  // legacy options removed

  const samples: Sample[] = [
    { label: 'H1', tag: 'h1', text: 'H1 – The quick brown fox jumps over the lazy dog', prefix: 'h1' },
    { label: 'H2', tag: 'h2', text: 'H2 – The quick brown fox jumps over the lazy dog', prefix: 'h2' },
    { label: 'H3', tag: 'h3', text: 'H3 – The quick brown fox jumps over the lazy dog', prefix: 'h3' },
    { label: 'H4', tag: 'h4', text: 'H4 – The quick brown fox jumps over the lazy dog', prefix: 'h4' },
    { label: 'H5', tag: 'h5', text: 'H5 – The quick brown fox jumps over the lazy dog', prefix: 'h5' },
    { label: 'H6', tag: 'h6', text: 'H6 – The quick brown fox jumps over the lazy dog', prefix: 'h6' },
    { label: 'Subtitle', tag: 'p', text: 'Subtitle – The quick brown fox jumps over the lazy dog', prefix: 'subtitle-1' },
    { label: 'Subtitle (small)', tag: 'p', text: 'Subtitle (small) – The quick brown fox jumps over the lazy dog', prefix: 'subtitle-2' },
    { label: 'Body', tag: 'p', text: 'Body – The quick brown fox jumps over the lazy dog', prefix: 'body-1' },
    { label: 'Body (small)', tag: 'p', text: 'Body (small) – The quick brown fox jumps over the lazy dog', prefix: 'body-2' },
    { label: 'Button', tag: 'button', text: 'Button', prefix: 'button' },
    { label: 'Caption', tag: 'p', text: 'Caption – The quick brown fox jumps over the lazy dog', prefix: 'caption' },
    { label: 'Overline', tag: 'p', text: 'Overline – THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG', prefix: 'overline' },
  ]

  // stable samples array
  useMemo(() => undefined, [])

  function SimpleTypeSample({ tag, text, prefix, isSelected, onToggle }: { label: string; tag: keyof JSX.IntrinsicElements; text: string; prefix: string; isSelected: boolean; onToggle: (checked: boolean) => void }) {
    const Tag = tag as any
    const style: React.CSSProperties = {
      fontFamily: `var(--font-${prefix}-font-family, system-ui, -apple-system, Segoe UI, Roboto, Arial)`,
      fontSize: `var(--font-${prefix}-font-size, 16px)`,
      fontWeight: `var(--font-${prefix}-font-weight, var(--font-${prefix}-font-weight-normal, 400))` as any,
      letterSpacing: `var(--font-${prefix}-font-letter-spacing, 0)`,
      lineHeight: `var(--font-${prefix}-line-height, normal)` as any,
      margin: '0',
    }
    return (
      <div
        onClick={() => onToggle(!isSelected)}
        style={{ border: isSelected ? '3px solid var(--palette-alert)' : '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 8, padding: 16, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
      >
        <input type="checkbox" checked={isSelected} onClick={(e) => e.stopPropagation()} onChange={(e) => onToggle((e.target as HTMLInputElement).checked)} aria-label="Select type sample" />
        <Tag style={style}>{text}</Tag>
      </div>
    )
  }

  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [version, setVersion] = useState(0)
  const [selected, setSelected] = useState<string[]>([])
  // Open/close style panel automatically based on selection
  useEffect(() => {
    if (selected.length > 0) setIsPanelOpen(false) // leave tokens panel closed when editing styles
  }, [selected])
  return (
    <div style={{ display: 'grid', gap: 16, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>Type</h2>
        <button onClick={() => setIsPanelOpen(true)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--layer-layer-1-property-border-color)', background: 'transparent', cursor: 'pointer' }}>Edit Type Tokens</button>
      </div>
      {samples.map((s) => (
        <SimpleTypeSample
          key={`${s.label}-${version}`}
          label={s.label}
          tag={s.tag}
          text={s.text}
          prefix={s.prefix}
          isSelected={selected.includes(s.prefix)}
          onToggle={(checked) => {
            setSelected((prev) => {
              const set = new Set(prev)
              if (checked) {
                set.add(s.prefix)
              } else {
                set.delete(s.prefix)
              }
              const arr = Array.from(set)
              return arr
            })
          }}
        />
      ))}
      <TypeTokensPanel open={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
      <TypeStylePanel open={selected.length > 0} selectedPrefixes={selected} title={selected.length === 1 ? (samples.find((x) => x.prefix === selected[0])?.label || 'Type') : 'Multiple'} onClose={() => setSelected([])} />
    </div>
  )
}

export default TypePage


