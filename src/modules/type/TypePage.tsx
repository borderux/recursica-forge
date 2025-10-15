import { useMemo } from 'react'

type Style = React.CSSProperties

function readCssVar(name: string, fallback?: string): string | undefined {
  if (typeof document === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

function pxOrUndefined(value?: string) {
  if (!value) return undefined
  if (/px$|em$|rem$|%$/.test(value)) return value
  if (!Number.isNaN(Number(value))) return `${value}px`
  return value
}

function sampleStyle(prefix: string): Style {
  const fontFamily = readCssVar(`--font-${prefix}-font-family`)
  const fontSize = readCssVar(`--font-${prefix}-font-size`)
  const fontWeight = readCssVar(`--font-${prefix}-font-weight`) || readCssVar(`--font-${prefix}-font-weight-normal`)
  const letterSpacing = readCssVar(`--font-${prefix}-font-letter-spacing`)
  return {
    fontFamily: fontFamily || 'system-ui, -apple-system, Segoe UI, Roboto, Arial',
    fontSize: pxOrUndefined(fontSize),
    fontWeight: fontWeight as any,
    letterSpacing: pxOrUndefined(letterSpacing),
    margin: '0 0 12px 0',
  }
}

export function TypePage() {
  const samples = useMemo(() => (
    [
      { label: 'H1', tag: 'h1', style: sampleStyle('h1'), text: 'Heading 1 – The quick brown fox jumps over the lazy dog' },
      { label: 'H2', tag: 'h2', style: sampleStyle('h2'), text: 'Heading 2 – The quick brown fox jumps over the lazy dog' },
      { label: 'H3', tag: 'h3', style: sampleStyle('h3'), text: 'Heading 3 – The quick brown fox jumps over the lazy dog' },
      { label: 'H4', tag: 'h4', style: sampleStyle('h4'), text: 'Heading 4 – The quick brown fox jumps over the lazy dog' },
      { label: 'H5', tag: 'h5', style: sampleStyle('h5'), text: 'Heading 5 – The quick brown fox jumps over the lazy dog' },
      { label: 'H6', tag: 'h6', style: sampleStyle('h6'), text: 'Heading 6 – The quick brown fox jumps over the lazy dog' },
      { label: 'Subtitle 1', tag: 'p', style: sampleStyle('subtitle-1'), text: 'Subtitle 1 – The quick brown fox jumps over the lazy dog' },
      { label: 'Subtitle 2', tag: 'p', style: sampleStyle('subtitle-2'), text: 'Subtitle 2 – The quick brown fox jumps over the lazy dog' },
      { label: 'Body 1', tag: 'p', style: sampleStyle('body-1'), text: 'Body 1 – The quick brown fox jumps over the lazy dog' },
      { label: 'Body 2', tag: 'p', style: sampleStyle('body-2'), text: 'Body 2 – The quick brown fox jumps over the lazy dog' },
      { label: 'Button', tag: 'button', style: sampleStyle('button'), text: 'Button' },
      { label: 'Caption', tag: 'p', style: sampleStyle('caption'), text: 'Caption – The quick brown fox jumps over the lazy dog' },
      { label: 'Overline', tag: 'p', style: sampleStyle('overline'), text: 'OVERLINE – THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG' },
    ] as Array<{ label: string; tag: keyof JSX.IntrinsicElements; style: Style; text: string }>
  ), [])

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h2 style={{ marginTop: 0 }}>Type Scale</h2>
      {samples.map((s) => {
        const Tag = s.tag as any
        return (
          <div key={s.label} style={{ border: '1px solid var(--temp-disabled)', borderRadius: 8, padding: 16 }}>
            <div style={{ opacity: 0.65, marginBottom: 6 }}>{s.label}</div>
            <Tag style={s.style}>{s.text}</Tag>
            <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
              <code>
                family: {String((s.style.fontFamily || '')).split(',')[0]} · size: {s.style.fontSize || '—'} · weight: {s.style.fontWeight || '—'} · spacing: {s.style.letterSpacing || '—'}
              </code>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default TypePage


