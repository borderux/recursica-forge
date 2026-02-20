/**
 * TypeControls
 *
 * Renders editing controls (chips/badges) for individual type samples.
 * Provides live preview via onPreview callback and persists choices via localStorage.
 */
import { useMemo, useState } from 'react'

const CHOICES_KEY = 'type-token-choices'

export function readChoices(): Record<string, { family?: string; size?: string; weight?: string; spacing?: string; lineHeight?: string }> {
  try { const raw = localStorage.getItem(CHOICES_KEY); if (raw) return JSON.parse(raw) } catch {}
  return {}
}

export function writeChoices(next: Record<string, { family?: string; size?: string; weight?: string; spacing?: string; lineHeight?: string }>) {
  try { localStorage.setItem(CHOICES_KEY, JSON.stringify(next)) } catch {}
  try { window.dispatchEvent(new CustomEvent('typeChoicesChanged', { detail: next })) } catch {}
}

function toTitleCase(label: string): string {
  return (label || '').replace(/[-_/]+/g, ' ').replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()).trim()
}

function getTokenValueWithOverrides(name: string | undefined, overrides: Record<string, any>, tokens: Record<string, any>): string | number | undefined {
  if (!name) return undefined
  if (Object.prototype.hasOwnProperty.call(overrides, name)) return overrides[name]
  // Fallback 1: flat map structure
  const flatEntry = Object.values(tokens as Record<string, any>).find((e: any) => e && e.name === name)
  if (flatEntry) return (flatEntry as any).value
  // Fallback 2: nested tokens structure tokens.tokens.*
  try {
    const path = name.replace(/^token\./, '').split('/')
    const root: any = (tokens as any)?.tokens || tokens
    let cur: any = root
    for (const seg of path) {
      if (cur == null) return undefined
      if (typeof cur[seg] !== 'undefined') {
        cur = cur[seg]
      } else {
        // handle kebab keys like 'letter-spacing'
        cur = cur?.[seg]
      }
    }
    const val = (cur && typeof cur === 'object' && '$value' in cur) ? (cur as any)['$value'] : cur
    if (typeof val === 'number' || typeof val === 'string') return val
    if (val && typeof val === 'object' && typeof (val as any).value !== 'undefined') return (val as any).value
  } catch {}
  return undefined
}

type Style = React.CSSProperties

export default function TypeControls({
  prefix,
  currentStyle,
  sizeToken,
  weightToken,
  spacingToken,
  lineHeightToken,
  hasLineHeightDefault,
  overrides,
  tokens,
  onPreview,
}: {
  prefix: string
  currentStyle: Style
  sizeToken: string
  weightToken: string
  spacingToken: string
  lineHeightToken: string | undefined
  hasLineHeightDefault: boolean
  overrides: Record<string, any>
  tokens: Record<string, any>
  onPreview: (style: Partial<Style> | null) => void
}) {
  const choices = readChoices()
  const current = choices[prefix] || {}

  // Options
  const sizeOptions = useMemo(() => {
    const out: Array<{ short: string; label: string }> = []
    try { Object.keys((tokens as any)?.tokens?.font?.size || {}).forEach((k) => out.push({ short: k, label: toTitleCase(k) })) } catch {}
    return out
  }, [tokens])

  const weightOptions = useMemo(() => {
    const out: Array<{ short: string; label: string }> = []
    try { Object.keys((tokens as any)?.tokens?.font?.weight || {}).forEach((k) => out.push({ short: k, label: toTitleCase(k) })) } catch {}
    return out
  }, [tokens])

  const spacingOptions = useMemo(() => {
    const out: Array<{ short: string; label: string }> = []
    try { Object.keys((tokens as any)?.tokens?.font?.['letter-spacing'] || {}).forEach((k) => out.push({ short: k, label: toTitleCase(k) })) } catch {}
    return out
  }, [tokens])

  const lineHeightOptions = useMemo(() => {
    const out: Array<{ short: string; label: string }> = []
    try { Object.keys((tokens as any)?.tokens?.font?.['line-height'] || {}).forEach((k) => out.push({ short: k, label: toTitleCase(k) })) } catch {}
    return out
  }, [tokens])

  const familyOptions = useMemo(() => {
    const out: Array<{ short: string; label: string; value: string }> = []
    const seen = new Set<string>()
    // from Tokens.json (font.family)
    try {
      Object.entries((tokens as any)?.tokens?.font?.family || {}).forEach(([short, rec]: [string, any]) => {
        const val = String((rec as any)?.$value || '')
        if (val && !seen.has(val)) { seen.add(val); out.push({ short, label: toTitleCase(short), value: val }) }
      })
    } catch {}
    // from Tokens.json (font.typeface)
    try {
      Object.entries((tokens as any)?.tokens?.font?.['typeface'] || {}).forEach(([short, rec]: [string, any]) => {
        const val = String((rec as any)?.$value || '')
        if (val && !seen.has(val)) { seen.add(val); out.push({ short, label: toTitleCase(short), value: val }) }
      })
    } catch {}
    // include overrides-only additions (font/family/* and font/typeface/*)
    try {
      const ov = (window && typeof window !== 'undefined') ? ((): Record<string, any> => { try { return JSON.parse(localStorage.getItem('token-overrides') || '{}') } catch { return {} } })() : {}
      Object.entries(ov || {}).forEach(([name, val]) => {
        if (typeof name !== 'string') return
        if (!(name.startsWith('font/family/') || name.startsWith('font/typeface/'))) return
        const short = name.split('/').pop() as string
        const literal = String(val || '')
        if (literal && !seen.has(literal)) { seen.add(literal); out.push({ short, label: toTitleCase(short), value: literal }) }
      })
    } catch {}
    out.sort((a, b) => a.label.localeCompare(b.label))
    return out
  }, [tokens])

  // Get current token shorts
  const currentSize = current.size || sizeToken.split('/').pop() || ''
  const currentWeight = current.weight || weightToken.split('/').pop() || ''
  const currentSpacing = current.spacing || spacingToken.split('/').pop() || ''
  const currentLineHeight = current.lineHeight || (lineHeightToken ? lineHeightToken.split('/').pop() : (hasLineHeightDefault ? 'default' : undefined)) || undefined
  const currentFamily = current.family || currentStyle.fontFamily || ''

  const [hovered, setHovered] = useState<string | null>(null)

  const updateChoice = (key: 'size' | 'weight' | 'spacing' | 'lineHeight' | 'family', value: string) => {
    const next = { ...choices, [prefix]: { ...current, [key]: value } }
    writeChoices(next)
    // Trigger re-render by dispatching event
    try { window.dispatchEvent(new CustomEvent('typeChoicesChanged', { detail: next })) } catch {}
  }

  const handlePreview = (key: 'size' | 'weight' | 'spacing' | 'lineHeight' | 'family', value: string | undefined) => {
    if (!value) {
      onPreview(null)
      return
    }
    const preview: Partial<Style> = {}
    if (key === 'size') {
      const tokenName = `font/size/${value}`
      const v = getTokenValueWithOverrides(tokenName, overrides, tokens)
      if (typeof v === 'number' || typeof v === 'string') {
        const px = String(v)
        preview.fontSize = /px$|em$|rem$|%$/.test(px) ? px : `${px}px`
      }
    } else if (key === 'weight') {
      const tokenName = `font/weight/${value}`
      const v = getTokenValueWithOverrides(tokenName, overrides, tokens)
      if (typeof v === 'number' || typeof v === 'string') preview.fontWeight = v as any
    } else if (key === 'spacing') {
      const tokenName = `font/letter-spacing/${value}`
      const v = getTokenValueWithOverrides(tokenName, overrides, tokens)
      if (typeof v === 'number') preview.letterSpacing = `${v}em`
      else if (typeof v === 'string') preview.letterSpacing = v
    } else if (key === 'lineHeight') {
      const tokenName = `font/line-height/${value}`
      const v = getTokenValueWithOverrides(tokenName, overrides, tokens)
      if (typeof v === 'number' || typeof v === 'string') preview.lineHeight = v as any
    } else if (key === 'family') {
      preview.fontFamily = value
    }
    onPreview(preview)
  }

  const renderChip = (label: string, key: 'size' | 'weight' | 'spacing' | 'lineHeight' | 'family', currentValue: string | undefined, options: Array<{ short: string; label: string; value?: string }>) => {
    if (!currentValue && key !== 'family') return null
    const isHovered = hovered === key
    const option = options.find((o) => (key === 'family' ? o.value === currentValue : o.short === currentValue))
    const displayLabel = option ? option.label : toTitleCase(currentValue || '')

    return (
      <div
        key={key}
        style={{ position: 'relative', display: 'inline-block' }}
        onMouseEnter={() => setHovered(key)}
        onMouseLeave={() => setHovered(null)}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 8px',
            borderRadius: 4,
            border: '1px solid var(--layers-layer-1-properties-border-color)',
            background: isHovered ? 'var(--layers-layer-1-properties-surface)' : 'transparent',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          <span style={{ opacity: 0.7 }}>{label}:</span>
          <span>{displayLabel}</span>
        </div>
        {isHovered && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: 4,
              zIndex: 1000,
              background: 'var(--layers-layer-0-properties-surface)',
              border: '1px solid var(--layers-layer-1-properties-border-color)',
              borderRadius: 4,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              padding: 4,
              minWidth: 120,
              maxHeight: 200,
              overflowY: 'auto',
            }}
          >
            {options.map((opt) => {
              const optValue = key === 'family' ? opt.value : opt.short
              return (
                <div
                  key={opt.short}
                  onClick={() => {
                    updateChoice(key, optValue || '')
                    setHovered(null)
                    onPreview(null)
                  }}
                  onMouseEnter={() => handlePreview(key, optValue)}
                  onMouseLeave={() => onPreview(null)}
                  style={{
                    padding: '6px 8px',
                    cursor: 'pointer',
                    background: optValue === currentValue ? 'var(--layers-layer-1-properties-surface)' : 'transparent',
                    borderRadius: 2,
                  }}
                >
                  {opt.label}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
      {renderChip('Font', 'family', currentFamily, familyOptions)}
      {renderChip('Size', 'size', currentSize, sizeOptions)}
      {renderChip('Weight', 'weight', currentWeight, weightOptions)}
      {renderChip('Spacing', 'spacing', currentSpacing, spacingOptions)}
      {(currentLineHeight || hasLineHeightDefault) && renderChip('Line Height', 'lineHeight', currentLineHeight, lineHeightOptions)}
    </div>
  )
}

