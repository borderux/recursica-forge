/**
 * TypePage
 *
 * Minimal renderer for typography samples. Reads CSS variables already
 * applied globally and renders each sample without any editing UI.
 */
import { useMemo, useState, useEffect } from 'react'
import TypeTokensPanel from './TypeTokensPanel'
import TypeStylePanel from './TypeStylePanel'
import { useThemeMode } from '../theme/ThemeModeContext'
import { Button } from '../../components/adapters/Button'

// local helpers retained for legacy but no longer used directly in this file

// no-op placeholder removed (SimpleTypeSample has its own readCssVar)

export function TypePage() {
  const { mode } = useThemeMode()
  const layer0Base = `--recursica-brand-themes-${mode}-layer-layer-0-property`
  
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
    const { mode } = useThemeMode()
    const Tag = tag as any
    const cssVarName = prefixToCssVarName(prefix)
    
    // Build layer-1 base CSS variable prefix
    const layer1Base = `--recursica-brand-themes-${mode}-layer-layer-1-property`
    
    // CSS variables update automatically, but React needs to re-render to pick up changes
    const style: React.CSSProperties = useMemo(() => ({
      fontFamily: `var(--recursica-brand-typography-${cssVarName}-font-family, system-ui, -apple-system, Segoe UI, Roboto, Arial)`,
      fontSize: `var(--recursica-brand-typography-${cssVarName}-font-size, 16px)`,
      fontWeight: `var(--recursica-brand-typography-${cssVarName}-font-weight, 400)` as any,
      letterSpacing: `var(--recursica-brand-typography-${cssVarName}-font-letter-spacing, 0)`,
      lineHeight: `var(--recursica-brand-typography-${cssVarName}-line-height, normal)` as any,
      color: `var(${layer1Base}-element-text-color)`,
      margin: '0',
    }), [cssVarName, mode, layer1Base, updateKey])
    
    // Container style using layer-1 properties
    // When selected, use core alert color for border instead of dropshadow
    const containerStyle = useMemo(() => {
      const borderColor = isSelected 
        ? `var(--recursica-brand-themes-${mode}-palettes-core-alert)`
        : `var(${layer1Base}-border-color)`
      
      return {
        backgroundColor: `var(${layer1Base}-surface)`,
        color: `var(${layer1Base}-element-text-color)`,
        border: `var(${layer1Base}-border-thickness) solid ${borderColor}`, 
        borderRadius: `var(${layer1Base}-border-radius)`, 
        padding: `var(${layer1Base}-padding)`, 
        display: 'flex' as const, 
        alignItems: 'center' as const, 
        gap: 12, 
        cursor: 'pointer' as const,
        boxShadow: 'none', // Layer 1 uses elevation-0 (no elevation)
      }
    }, [layer1Base, mode, isSelected, updateKey])
    
    return (
      <div
        onClick={() => onToggle(!isSelected)}
        style={containerStyle}
      >
        <input type="checkbox" checked={isSelected} onClick={(e) => e.stopPropagation()} onChange={(e) => onToggle((e.target as HTMLInputElement).checked)} aria-label="Select type sample" />
        <Tag style={style}>{text}</Tag>
      </div>
    )
  }

  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [updateKey, setUpdateKey] = useState(0)
  const [selected, setSelected] = useState<string[]>([])
  // Listen for type choices changes and CSS variable updates - CSS variables update automatically, but React needs to re-render
  useEffect(() => {
    const handler = () => setUpdateKey((k) => k + 1)
    window.addEventListener('typeChoicesChanged', handler as any)
    window.addEventListener('cssVarsUpdated', handler as any)
    return () => {
      window.removeEventListener('typeChoicesChanged', handler as any)
      window.removeEventListener('cssVarsUpdated', handler as any)
    }
  }, [])
  // Open/close style panel automatically based on selection
  useEffect(() => {
    if (selected.length > 0) setIsPanelOpen(false) // leave tokens panel closed when editing styles
  }, [selected])

  // Close panels when mode changes
  useEffect(() => {
    const handleCloseAll = () => {
      setIsPanelOpen(false)
      setSelected([])
    }
    window.addEventListener('closeAllPickersAndPanels', handleCloseAll)
    return () => window.removeEventListener('closeAllPickersAndPanels', handleCloseAll)
  }, [])
  return (
    <div style={{ display: 'grid', gap: 16, maxWidth: 1400, margin: '0 auto', padding: 'var(--recursica-brand-dimensions-general-xl)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ 
          marginTop: 0, 
          marginBottom: 0,
          fontFamily: 'var(--recursica-brand-typography-h1-font-family)',
          fontSize: 'var(--recursica-brand-typography-h1-font-size)',
          fontWeight: 'var(--recursica-brand-typography-h1-font-weight)',
          letterSpacing: 'var(--recursica-brand-typography-h1-font-letter-spacing)',
          lineHeight: 'var(--recursica-brand-typography-h1-line-height)',
          color: `var(${layer0Base}-element-text-color)`,
        }}>Type</h1>
        <Button onClick={() => setIsPanelOpen(true)} variant="outline" size="small" layer="layer-0">Edit Type Tokens</Button>
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


