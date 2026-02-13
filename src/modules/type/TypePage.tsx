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
import { useVars } from '../vars/VarsContext'
import { Button } from '../../components/adapters/Button'

// local helpers retained for legacy but no longer used directly in this file

// no-op placeholder removed (SimpleTypeSample has its own readCssVar)

export function TypePage() {
  const { mode } = useThemeMode()
  const { theme } = useVars()
  const layer0Base = `--recursica-brand-themes-${mode}-layers-layer-0-properties`
  
  type Sample = { label: string; tag: keyof JSX.IntrinsicElements; text: string; prefix: string }

  // Read samples from Brand.json typography
  const samples: Sample[] = useMemo(() => {
    const root: any = (theme as any)?.brand ? (theme as any).brand : theme
    const typography = root?.typography || {}
    const result: Sample[] = []
    
    // Map of typography keys to display labels and HTML tags
    const labelMap: Record<string, { label: string; tag: keyof JSX.IntrinsicElements }> = {
      'h1': { label: 'H1', tag: 'h1' },
      'h2': { label: 'H2', tag: 'h2' },
      'h3': { label: 'H3', tag: 'h3' },
      'h4': { label: 'H4', tag: 'h4' },
      'h5': { label: 'H5', tag: 'h5' },
      'h6': { label: 'H6', tag: 'h6' },
      'subtitle': { label: 'Subtitle', tag: 'p' },
      'subtitle-small': { label: 'Subtitle (small)', tag: 'p' },
      'body': { label: 'Body', tag: 'p' },
      'body-small': { label: 'Body (small)', tag: 'p' },
      'caption': { label: 'Caption', tag: 'p' },
      'overline': { label: 'Overline', tag: 'p' },
    }
    
    // Map Brand.json keys to prefix format used by the component
    const prefixMap: Record<string, string> = {
      'subtitle': 'subtitle-1',
      'subtitle-small': 'subtitle-2',
      'body': 'body-1',
      'body-small': 'body-2',
    }
    
    // Iterate through typography entries in Brand.json
    Object.keys(typography).forEach((key) => {
      if (key.startsWith('$')) return
      
      const typographyEntry = typography[key]
      if (typographyEntry && typeof typographyEntry === 'object' && '$type' in typographyEntry && typographyEntry.$type === 'typography') {
        const labelInfo = labelMap[key]
        if (labelInfo) {
          const prefix = prefixMap[key] || key
          const defaultText = labelInfo.label === 'Overline' 
            ? 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG'
            : `${labelInfo.label} – The quick brown fox jumps over the lazy dog`
          
          result.push({
            label: labelInfo.label,
            tag: labelInfo.tag,
            text: defaultText,
            prefix: prefix,
          })
        }
      }
    })
    
    // Sort samples to maintain a consistent order (h1-h6, then subtitle, body, caption, overline)
    const order = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'subtitle-1', 'subtitle-2', 'body-1', 'body-2', 'caption', 'overline']
    result.sort((a, b) => {
      const aIndex = order.indexOf(a.prefix)
      const bIndex = order.indexOf(b.prefix)
      if (aIndex === -1 && bIndex === -1) return 0
      if (aIndex === -1) return 1
      if (bIndex === -1) return -1
      return aIndex - bIndex
    })
    
    return result
  }, [theme])

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
    const layer1Base = `--recursica-brand-themes-${mode}-layers-layer-1-properties`
    
    // CSS variables update automatically, but React needs to re-render to pick up changes
    const style: React.CSSProperties = useMemo(() => ({
      fontFamily: `var(--recursica-brand-typography-${cssVarName}-font-family)`,
      fontSize: `var(--recursica-brand-typography-${cssVarName}-font-size, 16px)`,
      fontWeight: `var(--recursica-brand-typography-${cssVarName}-font-weight, 400)` as any,
      letterSpacing: `var(--recursica-brand-typography-${cssVarName}-font-letter-spacing, 0)`,
      lineHeight: `var(--recursica-brand-typography-${cssVarName}-line-height, normal)` as any,
      color: `var(${layer0Base.replace('-properties', '-elements')}-text-color)`,
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
        color: `var(${layer0Base.replace('-properties', '-elements')}-text-color)`,
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
          color: `var(${layer0Base.replace('-properties', '-elements')}-text-color)`,
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


