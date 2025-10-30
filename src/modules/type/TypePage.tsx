import { useEffect, useMemo, useState } from 'react'
import TypeSample from './TypeSample'
import FontFamiliesTokens from '../tokens/FontFamiliesTokens'
import FontSizeTokens from '../tokens/FontSizeTokens'
import FontWeightTokens from '../tokens/FontWeightTokens'
import FontLetterSpacingTokens from '../tokens/FontLetterSpacingTokens'
import FontLineHeightTokens from '../tokens/FontLineHeightTokens'
import { useVars } from '../vars/VarsContext'
import { readOverrides } from '../theme/tokenOverrides'

// local helpers retained for legacy but no longer used directly in this file

function readCssVar(name: string, fallback?: string): string | undefined {
  if (typeof document === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

// --- Theme resolver (Light mode) ---
type ThemeRecord = { name: string; mode?: string; value?: any }

// title casing handled in TypeSample

function ensureGoogleFontLoaded(family: string | undefined) {
  if (!family) return
  const trimmed = String(family).trim()
  if (!trimmed) return
  const id = `gf-${trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  if (document.getElementById(id)) return
  const href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(trimmed).replace(/%20/g, '+')}:wght@100..900&display=swap`
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = href
  document.head.appendChild(link)
}

// moved to TypeSample

export function TypePage() {
  const { tokens, theme } = useVars()
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
    { label: 'Subtitle 1', tag: 'p', text: 'Subtitle 1 – The quick brown fox jumps over the lazy dog', prefix: 'subtitle-1' },
    { label: 'Subtitle 2', tag: 'p', text: 'Subtitle 2 – The quick brown fox jumps over the lazy dog', prefix: 'subtitle-2' },
    { label: 'Body 1', tag: 'p', text: 'Body 1 – The quick brown fox jumps over the lazy dog', prefix: 'body-1' },
    { label: 'Body 2', tag: 'p', text: 'Body 2 – The quick brown fox jumps over the lazy dog', prefix: 'body-2' },
    { label: 'Button', tag: 'button', text: 'Button', prefix: 'button' },
    { label: 'Caption', tag: 'p', text: 'Caption – The quick brown fox jumps over the lazy dog', prefix: 'caption' },
    { label: 'Overline', tag: 'p', text: 'Overline – THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG', prefix: 'overline' },
  ]

  // (removed) token-backed helpers replaced by TypeSample

  // removed: options built in TypeSample

  // (removed) no longer displaying value-derived chip text

  // removed

  // removed

  // (removed) superseded by getTokenNameFor

  // (removed) no longer displaying value-derived chip text

  // moved per-sample editing into TypeSample
  // editing handled inside TypeSample
  const [tokenVersion, setTokenVersion] = useState(0)
  useEffect(() => {
    const handler = () => setTokenVersion((v) => v + 1)
    window.addEventListener('tokenOverridesChanged', handler as any)
    return () => window.removeEventListener('tokenOverridesChanged', handler as any)
  }, [])
  const overrides = useMemo(() => readOverrides(), [tokenVersion])

  // Ensure fonts used by samples are loaded on initial load and whenever overrides change
  useEffect(() => {
    const families = new Set<string>()
    const getThemeEntry = (prefix: string, prop: 'size' | 'font-family' | 'letter-spacing' | 'weight' | 'weight-normal'): ThemeRecord | undefined => {
      const map: Record<string, string> = { 'subtitle-1': 'subtitle', 'subtitle-2': 'subtitle-small', 'body-1': 'body', 'body-2': 'body-small' }
      const themePrefix = map[prefix] || prefix
      const key = `[themes][Light][font/${themePrefix}/${prop}]`
      const rec: any = (theme as any)?.RecursicaBrand
      return rec ? (rec[key] as ThemeRecord | undefined) : undefined
    }
    const getTokenNameFor = (prefix: string, prop: 'size' | 'font-family' | 'letter-spacing' | 'weight'): string | undefined => {
      const rec = prop === 'weight' ? (getThemeEntry(prefix, 'weight') || getThemeEntry(prefix, 'weight-normal')) : getThemeEntry(prefix, prop)
      const v: any = rec?.value
      if (v && typeof v === 'object' && v.collection === 'Tokens' && typeof v.name === 'string') return v.name
      return undefined
    }
    const getTokenValueWithOverrides = (name: string | undefined, overrides: Record<string, any>): string | number | undefined => {
      if (!name) return undefined
      if (Object.prototype.hasOwnProperty.call(overrides, name)) return overrides[name]
      const entry = Object.values(tokens as Record<string, any>).find((e: any) => e && e.name === name)
      return entry ? (entry as any).value : undefined
    }
    samples.forEach((s) => {
      const token = getTokenNameFor(s.prefix, 'font-family')
      const val = token ? getTokenValueWithOverrides(token, overrides) : readCssVar(`--font-${s.prefix}-font-family`)
      if (typeof val === 'string' && val.trim()) families.add(val)
    })
    families.forEach((fam) => ensureGoogleFontLoaded(fam))
  }, [tokenVersion])
  // Also bump tokenVersion after successful save to refresh chips immediately
  // no bumpVersion needed here; samples listen themselves

  // (removed) chips show token names only, edits handled inside TypeSample

  const [isPanelOpen, setIsPanelOpen] = useState(false)

  return (
    <div style={{ display: 'grid', gap: 16, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>Type</h2>
        <button onClick={() => setIsPanelOpen(true)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--layer-layer-1-property-border-color)', background: 'transparent', cursor: 'pointer' }}>Edit Tokens</button>
      </div>
      {samples.map((s) => (
        <TypeSample key={s.label} label={s.label} tag={s.tag} text={s.text} prefix={s.prefix} />
      ))}
      {/* Slide-in fonts panel */}
      <div
        aria-hidden={!isPanelOpen}
        style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: 'clamp(200px, 30vw, 500px)', background: 'var(--layer-layer-0-property-surface)', borderLeft: '1px solid var(--layer-layer-1-property-border-color)', boxShadow: '-8px 0 24px rgba(0,0,0,0.15)', transform: isPanelOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 200ms ease', zIndex: 1000, padding: 12, overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontWeight: 600 }}>Font Tokens</div>
          <button onClick={() => setIsPanelOpen(false)} aria-label="Close" style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16 }}>&times;</button>
        </div>
        <div style={{ display: 'grid', gap: 16 }}>
          <FontFamiliesTokens />
          <FontSizeTokens />
          <FontWeightTokens />
          <FontLetterSpacingTokens />
          <FontLineHeightTokens />
        </div>
      </div>
    </div>
  )
}

export default TypePage


