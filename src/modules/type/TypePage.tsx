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

  // Map prefix to CSS variable name (matches Brand.json naming)
  function prefixToCssVarName(prefix: string): string {
    const map: Record<string, string> = { 'subtitle-1': 'subtitle', 'subtitle-2': 'subtitle-small', 'body-1': 'body', 'body-2': 'body-small' }
    return map[prefix] || prefix
  }

  function SimpleTypeSample({ tag, text, prefix, isSelected, onToggle, updateKey }: { label: string; tag: keyof JSX.IntrinsicElements; text: string; prefix: string; isSelected: boolean; onToggle: (checked: boolean) => void; updateKey: number }) {
    const Tag = tag as any
    const cssVarName = prefixToCssVarName(prefix)
    // CSS variables update automatically, but React needs to re-render to pick up changes
    const style: React.CSSProperties = useMemo(() => ({
      fontFamily: `var(--recursica-brand-typography-${cssVarName}-font-family, system-ui, -apple-system, Segoe UI, Roboto, Arial)`,
      fontSize: `var(--recursica-brand-typography-${cssVarName}-font-size, 16px)`,
      fontWeight: `var(--recursica-brand-typography-${cssVarName}-font-weight, 400)` as any,
      letterSpacing: `var(--recursica-brand-typography-${cssVarName}-font-letter-spacing, 0)`,
      lineHeight: `var(--recursica-brand-typography-${cssVarName}-line-height, normal)` as any,
      margin: '0',
    }), [cssVarName, updateKey])
    
    // Elevation level 1 box-shadow CSS variables for selected state
    const selectedElevation = isSelected 
      ? `var(--recursica-brand-light-elevations-elevation-1-x-axis) var(--recursica-brand-light-elevations-elevation-1-y-axis) var(--recursica-brand-light-elevations-elevation-1-blur) var(--recursica-brand-light-elevations-elevation-1-spread) var(--recursica-brand-light-elevations-elevation-1-shadow-color)`
      : undefined
    
    return (
      <div
        onClick={() => onToggle(!isSelected)}
        style={{ 
          backgroundColor: 'var(--recursica-brand-light-layer-layer-1-property-surface)',
          color: 'var(--recursica-brand-light-layer-layer-1-element-text-color)',
          border: 'var(--recursica-brand-light-layer-layer-1-property-border-thickness) solid var(--recursica-brand-light-layer-layer-1-property-border-color)', 
          borderRadius: 'var(--recursica-brand-light-layer-layer-1-property-border-radius)', 
          padding: 'var(--recursica-brand-light-layer-layer-1-property-padding)', 
          display: 'flex', 
          alignItems: 'center', 
          gap: 12, 
          cursor: 'pointer',
          boxShadow: selectedElevation || 'var(--recursica-brand-light-layer-layer-1-property-elevation)',
        }}
      >
        <input type="checkbox" checked={isSelected} onClick={(e) => e.stopPropagation()} onChange={(e) => onToggle((e.target as HTMLInputElement).checked)} aria-label="Select type sample" />
        <Tag style={style}>{text}</Tag>
      </div>
    )
  }

  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [updateKey, setUpdateKey] = useState(0)
  const [selected, setSelected] = useState<string[]>([])
  // Listen for type choices changes - CSS variables update automatically, but React needs to re-render
  useEffect(() => {
    const handler = () => setUpdateKey((k) => k + 1)
    window.addEventListener('typeChoicesChanged', handler as any)
    return () => window.removeEventListener('typeChoicesChanged', handler as any)
  }, [])
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
          key={`${s.label}-${updateKey}`}
          label={s.label}
          tag={s.tag}
          text={s.text}
          prefix={s.prefix}
          isSelected={selected.includes(s.prefix)}
          updateKey={updateKey}
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


