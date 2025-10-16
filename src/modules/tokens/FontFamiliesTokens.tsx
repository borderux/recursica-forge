import { useEffect, useMemo, useState } from 'react'
import tokensJson from '../../vars/Tokens.json'
import { readOverrides, setOverride, writeOverrides } from '../theme/tokenOverrides'

type FamilyRow = { name: string; value: string; custom: boolean }

export default function FontFamiliesTokens() {
  // Local snapshot writer (we don't read it to avoid re-renders)
  const [, setValues] = useState<Record<string, string | number>>(() => {
    const init: Record<string, string | number> = {}
    Object.values(tokensJson as Record<string, any>).forEach((entry: any) => {
      if (entry && typeof entry.name === 'string' && (typeof entry.value === 'number' || typeof entry.value === 'string')) {
        init[entry.name] = entry.value
      }
    })
    const overrides = readOverrides()
    return { ...init, ...overrides }
  })
  // helpers to persist deleted families across components
  const DELETED_KEY = 'font-families-deleted'
  const readDeleted = (): Record<string, true> => {
    try {
      const raw = localStorage.getItem(DELETED_KEY)
      if (!raw) return {}
      const obj = JSON.parse(raw)
      if (obj && typeof obj === 'object') return obj as Record<string, true>
    } catch {}
    return {}
  }
  const writeDeleted = (m: Record<string, true>) => {
    try { localStorage.setItem(DELETED_KEY, JSON.stringify(m)) } catch {}
    try { window.dispatchEvent(new CustomEvent('fontFamiliesDeletedChanged', { detail: m })) } catch {}
  }

  const buildRows = (): FamilyRow[] => {
    const base: Record<string, FamilyRow> = {}
    const overrides = readOverrides()
    // from tokens
    Object.values(tokensJson as Record<string, any>).forEach((entry: any) => {
      if (!entry || typeof entry.name !== 'string') return
      if (!entry.name.startsWith('font/family/')) return
      const ov = (overrides as any)[entry.name]
      base[entry.name] = { name: entry.name, value: String(ov ?? entry.value), custom: false }
    })
    // from overrides-only (newly added)
    Object.keys(overrides as Record<string, any>).forEach((name) => {
      if (!name.startsWith('font/family/')) return
      if (!base[name]) base[name] = { name, value: String((overrides as any)[name]), custom: false }
    })
    return Object.values(base).sort((a, b) => a.name.localeCompare(b.name))
  }

  const [rows, setRows] = useState<FamilyRow[]>(() => buildRows())
  const [deleted, setDeleted] = useState<Record<string, true>>(() => readDeleted())
  const [fonts, setFonts] = useState<string[]>(["Inter","Roboto","Open Sans","Lato","Montserrat","Poppins","Source Sans 3","Nunito","Raleway","Merriweather","PT Sans","Ubuntu","Noto Sans","Playfair Display","Work Sans","Rubik","Fira Sans","Manrope","Crimson Pro","Space Grotesk","Custom..."])

  useEffect(() => {
    const handler = (ev: Event) => {
      const detail: any = (ev as CustomEvent).detail
      if (!detail) return
      const { all, name, value } = detail
      if (all && typeof all === 'object') {
        setValues(all)
        setRows(buildRows())
        return
      }
      if (typeof name === 'string') {
        setValues((prev) => ({ ...prev, [name]: value }))
        setRows(buildRows())
      }
    }
    window.addEventListener('tokenOverridesChanged', handler)
    return () => window.removeEventListener('tokenOverridesChanged', handler)
  }, [])

  useEffect(() => {
    const handler = () => {
      setDeleted(readDeleted())
      setRows(buildRows())
    }
    window.addEventListener('fontFamiliesDeletedChanged', handler)
    return () => window.removeEventListener('fontFamiliesDeletedChanged', handler)
  }, [])

  useEffect(() => {
    const apiKey = (import.meta as any).env?.VITE_GOOGLE_FONTS_API_KEY as string | undefined
    if (!apiKey) return
    fetch(`https://www.googleapis.com/webfonts/v1/webfonts?key=${apiKey}&sort=popularity`).then(async (r) => {
      if (!r.ok) return
      const data = await r.json()
      if (data && Array.isArray(data.items)) {
        const names = data.items.map((it: any) => String(it.family)).filter(Boolean).sort((a: string, b: string) => a.localeCompare(b))
        setFonts([...names, 'Custom...'])
      }
    }).catch(() => {})
  }, [])

  const visibleRows = useMemo(() => rows.filter((r) => !deleted[r.name]), [rows, deleted])

  const toTitle = (s: string) => (s || '').replace(/[-_/]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()).trim()
  const firstWordSlug = (family: string) => (family.split(/\s+/)[0] || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const uniqueTokenName = (base: string) => {
    let attempt = base
    let i = 2
    const names = new Set(rows.map((r) => r.name))
    while (names.has(attempt)) {
      attempt = `${base}-${i++}`
    }
    return attempt
  }

  const removeOverride = (key: string) => {
    const all = readOverrides()
    if (key in all) {
      delete (all as any)[key]
      writeOverrides(all)
      try { window.dispatchEvent(new CustomEvent('tokenOverridesChanged', { detail: { all } })) } catch {}
    }
  }

  return (
    <section style={{ background: 'var(--layer-layer-0-property-surface)', border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 8, padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontWeight: 600 }}>Families</div>
        <button
          onClick={() => {
            const defaultFamily = ''
            const name = uniqueTokenName(`font/family/`)
            const row: FamilyRow = { name, value: defaultFamily, custom: false }
            setRows((prev) => [...prev, row])
            // clear any deleted flag for this new row (local only; avoid broadcast until a value is chosen)
            setDeleted((prev) => {
              const next: Record<string, true> = { ...prev }
              delete (next as any)[name]
              try { localStorage.setItem(DELETED_KEY, JSON.stringify(next)) } catch {}
              return next
            })
          }}
          style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--layer-layer-1-property-border-color)', background: 'transparent', cursor: 'pointer' }}
        >+Font Family</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(240px, 1fr) auto', gap: 8, alignItems: 'center' }}>
        {visibleRows.map((r) => {
          const label = toTitle(r.name.replace('font/family/', ''))
          const options = (() => {
            const list = fonts.filter((f) => f !== 'Custom...').slice().sort((a, b) => a.localeCompare(b))
            return [...list, 'Custom...']
          })()
          const isCustom = r.custom || (!options.includes(r.value) && r.value !== '')
          return (
            <>
              <label key={r.name + '-label'} htmlFor={r.name} style={{ fontSize: 13, opacity: 0.9 }}>{label}</label>
              {isCustom ? (
                <input
                  key={r.name + '-custom'}
                  id={r.name}
                  type="text"
                  value={r.value}
                  onChange={(ev) => {
                    const next = ev.currentTarget.value
                    setRows((prev) => prev.map((row) => row.name === r.name ? ({ ...row, value: next, custom: true }) : row))
                    setOverride(r.name, next)
                  }}
                  onBlur={(ev) => {
                    const next = ev.currentTarget.value
                    const newSlug = firstWordSlug(next)
                    if (!newSlug) return
                    const newNameBase = `font/family/${newSlug}`
                    const newName = r.name === newNameBase ? r.name : uniqueTokenName(newNameBase)
                    if (newName !== r.name) {
                      removeOverride(r.name)
                      setOverride(newName, next)
                      setRows((prev) => prev.map((row) => row.name === r.name ? ({ name: newName, value: next, custom: true }) : row))
                    }
                  }}
                  placeholder="Enter font family"
                />
              ) : (
                <select
                  key={r.name}
                  id={r.name}
                  value={options.includes(r.value) ? r.value : ''}
                  onChange={(ev) => {
                    const chosen = ev.currentTarget.value
                    if (chosen === 'Custom...') {
                      setRows((prev) => prev.map((row) => row.name === r.name ? ({ ...row, custom: true }) : row))
                      return
                    }
                    const newValue = chosen
                    const newSlug = firstWordSlug(newValue)
                    const newNameBase = `font/family/${newSlug}`
                    const newName = r.name === newNameBase ? r.name : uniqueTokenName(newNameBase)
                    // rename: remove old override, set new override
                    removeOverride(r.name)
                    setOverride(newName, newValue)
                    setRows((prev) => prev.map((row) => row.name === r.name ? ({ name: newName, value: newValue, custom: false }) : row))
                    // clear deleted flag for new name
                    setDeleted((prev) => {
                      const next: Record<string, true> = { ...prev }
                      delete (next as any)[newName]
                      writeDeleted(next)
                      return next
                    })
                  }}
                  style={{ width: '100%' }}
                >
                  <option value=""></option>
                  {options.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              )}
              <button
                onClick={() => {
                  setDeleted((prev) => {
                    const next: Record<string, true> = { ...prev, [r.name]: true as true }
                    writeDeleted(next)
                    return next
                  })
                  removeOverride(r.name)
                }}
                title="Delete"
                style={{ border: '1px solid var(--layer-layer-1-property-border-color)', background: 'transparent', cursor: 'pointer', borderRadius: 6, padding: '6px 8px' }}
              >🗑️</button>
            </>
          )
        })}
      </div>
    </section>
  )
}


