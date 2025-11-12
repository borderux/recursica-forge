/**
 * FontFamiliesTokens
 *
 * Editor for font family and typeface tokens. Reads built-in tokens and
 * override-only entries, allows adding/renaming, and persists changes via
 * tokenOverrides. Maintains a helper list of deleted rows across reloads.
 */
import { useEffect, useMemo, useState } from 'react'
import { useVars } from '../../vars/VarsContext'
import { readOverrides, writeOverrides } from '../../theme/tokenOverrides'

type FamilyRow = { name: string; value: string; custom: boolean }

export default function FontFamiliesTokens() {
  const { tokens: tokensJson, updateToken } = useVars()
  // Local snapshot writer (we don't read it to avoid re-renders)
  const [, setValues] = useState<Record<string, string | number>>(() => {
    const init: Record<string, string | number> = {}
    try {
      const fontRoot: any = (tokensJson as any)?.tokens?.font || (tokensJson as any)?.font || {}
      const fams: any = fontRoot?.family || {}
      const typeface: any = fontRoot?.typeface || {}
      Object.keys(fams).filter((k) => !k.startsWith('$')).forEach((k) => {
        const v = fams[k]?.$value
        if (typeof v === 'string' && v) init[`font/family/${k}`] = v
      })
      Object.keys(typeface).filter((k) => !k.startsWith('$')).forEach((k) => {
        const v = typeface[k]?.$value
        if (typeof v === 'string' && v) init[`font/typeface/${k}`] = v
      })
    } catch {}
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
  

  const ORDER = ['primary','secondary','tertiary','quaternary','quinary','senary','septenary','octonary']
  const buildRows = (): FamilyRow[] => {
    const base: Record<string, FamilyRow> = {}
    const overrides = readOverrides()
    // from tokens
    try {
      const fontRoot: any = (tokensJson as any)?.tokens?.font || (tokensJson as any)?.font || {}
      const fams: any = fontRoot?.family || {}
      const typeface: any = fontRoot?.typeface || {}
      Object.keys(fams).filter((key) => !key.startsWith('$')).forEach((key) => {
        const name = `font/family/${key}`
        const val = fams[key]?.$value
        const ov = (overrides as any)[name]
        base[name] = { name, value: String(ov ?? val ?? ''), custom: false }
      })
      Object.keys(typeface).filter((key) => !key.startsWith('$')).forEach((key) => {
        const name = `font/typeface/${key}`
        const val = typeface[key]?.$value
        const ov = (overrides as any)[name]
        base[name] = { name, value: String(ov ?? val ?? ''), custom: false }
      })
    } catch {}
    // from overrides-only (newly added)
    Object.keys(overrides as Record<string, any>).forEach((name) => {
      if (!(name.startsWith('font/family/') || name.startsWith('font/typeface/'))) return
      if (!base[name]) base[name] = { name, value: String((overrides as any)[name]), custom: false }
    })
    const rows = Object.values(base)
    // Sort: typeface in canonical order first, then families alphabetically
    rows.sort((a, b) => {
      const aTF = a.name.startsWith('font/typeface/')
      const bTF = b.name.startsWith('font/typeface/')
      if (aTF && bTF) {
        const aKey = a.name.replace('font/typeface/','')
        const bKey = b.name.replace('font/typeface/','')
        const ai = ORDER.indexOf(aKey)
        const bi = ORDER.indexOf(bKey)
        return (ai === -1 ? Number.POSITIVE_INFINITY : ai) - (bi === -1 ? Number.POSITIVE_INFINITY : bi)
      }
      if (aTF !== bTF) return aTF ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    return rows
  }

  const [rows, setRows] = useState<FamilyRow[]>(() => buildRows())
  const [deleted, setDeleted] = useState<Record<string, true>>(() => readDeleted())
  const [fonts, setFonts] = useState<string[]>(["Inter","Roboto","Open Sans","Lato","Montserrat","Poppins","Source Sans 3","Nunito","Raleway","Merriweather","PT Sans","Ubuntu","Noto Sans","Playfair Display","Work Sans","Rubik","Fira Sans","Manrope","Crimson Pro","Space Grotesk","Custom..."])

  useEffect(() => {
    const handler = (ev: Event) => {
      const detail: any = (ev as CustomEvent).detail
      if (!detail) return
      const { all, name, value, reset } = detail
      if (all && typeof all === 'object') {
        // Only update values for font/family tokens, not all tokens
        const filtered: Record<string, string | number> = {}
        Object.keys(all).forEach((key) => {
          if (key.startsWith('font/family/') || key.startsWith('font/typeface/')) {
            filtered[key] = all[key]
          }
        })
        setValues((prev) => ({ ...prev, ...filtered }))
        setRows(buildRows())
        if (reset) {
          // clear any locally persisted deletions so all default families reappear
          setDeleted(() => {
            const empty: Record<string, true> = {}
            writeDeleted(empty)
            return empty
          })
        }
        return
      }
      if (typeof name === 'string' && (name.startsWith('font/family/') || name.startsWith('font/typeface/'))) {
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

  // Ensure there is always at least one visible font family row
  useEffect(() => {
    if (visibleRows.length === 0) {
      const name = uniqueTokenName(`font/family/`)
      const row: FamilyRow = { name, value: '', custom: false }
      setRows((prev) => [...prev, row])
      setDeleted((prev) => {
        const next: Record<string, true> = { ...prev }
        delete (next as any)[name]
        try { localStorage.setItem(DELETED_KEY, JSON.stringify(next)) } catch {}
        return next
      })
    }
  }, [visibleRows.length])

  const toTitle = (s: string) => (s || '').replace(/[-_/]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()).trim()
  // no renaming of token keys; values only
  const uniqueTokenName = (base: string) => {
    let attempt = base
    let i = 2
    const names = new Set(rows.map((r) => r.name))
    while (names.has(attempt)) {
      attempt = `${base}-${i++}`
    }
    return attempt
  }

  const isFromTokens = (name: string): boolean => {
    if (!name.startsWith('font/family/')) return false
    const key = name.replace('font/family/','')
    return Boolean((tokensJson as any)?.tokens?.font?.family?.[key] || (tokensJson as any)?.font?.family?.[key])
  }

  const sanitizeFamilyShort = (family: string): string => {
    const first = String(family || '').trim().split(/\s+/)[0] || ''
    return first.replace(/[^a-z0-9]/gi, '').toLowerCase()
  }

  const renameRowTokenIfNeeded = (rowName: string, familyValue: string) => {
    if (!familyValue) return
    // Only rename rows that are not sourced from Tokens.json to avoid duplicating source tokens
    if (isFromTokens(rowName)) return
    const short = sanitizeFamilyShort(familyValue)
    if (!short) return
    const base = `font/family/${short}`
    const nextName = uniqueTokenName(base)
    if (nextName === rowName) return
    const all = readOverrides()
    const currentValue = (all as any)[rowName] ?? familyValue
    delete (all as any)[rowName]
    ;(all as any)[nextName] = currentValue
    writeOverrides(all)
    try { window.dispatchEvent(new CustomEvent('tokenOverridesChanged', { detail: { all } })) } catch {}
    // reflect locally
    setRows((prev) => prev.map((r) => r.name === rowName ? ({ ...r, name: nextName }) : r))
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
            // add next typeface row in canonical order
            const existing = new Set(visibleRows.filter((r) => r.name.startsWith('font/typeface/')).map((r) => r.name.replace('font/typeface/','')))
            const nextKey = ORDER.find((k) => !existing.has(k)) || `custom-${existing.size+1}`
            const name = `font/typeface/${nextKey}`
            const row: FamilyRow = { name, value: '', custom: false }
            setRows((prev) => [...prev, row])
          }}
          style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--layer-layer-1-property-border-color)', background: 'transparent', cursor: 'pointer' }}
        >+Font Family</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(240px, 1fr) auto', gap: 8, alignItems: 'center' }}>
        {visibleRows.map((r) => {
          const label = (() => {
            if (r.name.startsWith('font/typeface/')) return toTitle(r.name.replace('font/typeface/',''))
            return toTitle(r.name.replace('font/family/', ''))
          })()
          const options = (() => {
            // Exclude families already selected in other rows to prevent duplicates
            const used = new Set(visibleRows.filter((x) => x.name !== r.name).map((x) => x.value).filter((v) => v && v !== 'Custom...'))
            // Union of built-in fonts, token-defined families, and override-only families
            const set = new Set<string>()
            fonts.forEach((f) => { if (f && f !== 'Custom...') set.add(f) })
            try {
              const fontRoot: any = (tokensJson as any)?.tokens?.font || (tokensJson as any)?.font || {}
              const fams: any = fontRoot?.family || {}
              const typeface: any = fontRoot?.typeface || {}
              Object.keys(fams).filter((k) => !k.startsWith('$')).forEach((k) => { const v = String(fams[k]?.$value || ''); if (v) set.add(v) })
              Object.keys(typeface).filter((k) => !k.startsWith('$')).forEach((k) => { const v = String(typeface[k]?.$value || ''); if (v) set.add(v) })
            } catch {}
            try {
              const ov = readOverrides() as Record<string, any>
              Object.entries(ov || {}).forEach(([name, val]) => {
                if (name.startsWith('font/family/')) { const v = String(val || ''); if (v) set.add(v) }
              })
            } catch {}
            let list = Array.from(set)
              .filter((f) => !used.has(f))
              .sort((a, b) => a.localeCompare(b))
            // Ensure the current value is present so the control shows it
            if (r.value && !list.includes(r.value)) list = [r.value, ...list]
            return [...list, 'Custom...']
          })()
          const isCustom = r.custom || (!options.includes(r.value) && r.value !== '')
          return (
            <span key={r.name} style={{ display: 'contents' }}>
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
                    updateToken(r.name, next)
                  }}
                  onBlur={(ev) => {
                    const next = ev.currentTarget.value
                    renameRowTokenIfNeeded(r.name, next)
                  }}
                  placeholder="Enter font family"
                />
              ) : (
                <select
                  key={r.name}
                  id={r.name}
                  value={r.value || ''}
                  onChange={(ev) => {
                    const chosen = ev.currentTarget.value
                    if (chosen === 'Custom...') {
                      setRows((prev) => prev.map((row) => row.name === r.name ? ({ ...row, custom: true }) : row))
                      return
                    }
                    const newValue = chosen
                    setRows((prev) => prev.map((row) => row.name === r.name ? ({ ...row, value: newValue, custom: false }) : row))
                    updateToken(r.name, newValue)
                  }}
                  onBlur={(ev) => {
                    const chosen = ev.currentTarget.value
                    if (chosen && chosen !== 'Custom...') renameRowTokenIfNeeded(r.name, chosen)
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
                  if (visibleRows.length <= 1) return
                  setDeleted((prev) => {
                    const next: Record<string, true> = { ...prev, [r.name]: true as true }
                    writeDeleted(next)
                    return next
                  })
                  removeOverride(r.name)
                }}
                title="Delete"
                disabled={visibleRows.length <= 1}
                style={{ border: '1px solid var(--layer-layer-1-property-border-color)', background: 'transparent', cursor: visibleRows.length <= 1 ? 'not-allowed' : 'pointer', borderRadius: 6, padding: '6px 8px', opacity: visibleRows.length <= 1 ? 0.5 : 1 }}
              >🗑️</button>
            </span>
          )
        })}
      </div>
    </section>
  )
}

