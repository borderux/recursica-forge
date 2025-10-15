import { useEffect, useMemo, useState } from 'react'
import tokensJson from '../../vars/Tokens.json'
import { extractCssVarsFromObject, applyCssVars } from '../theme/varsUtil'

type TokenEntry = {
  collection?: string
  mode?: string
  name: string
  type?: string
  value: string | number
}

type ModeName = 'Mode 1' | 'Mode 2' | string

export default function TokensPage() {
  const [values, setValues] = useState<Record<string, string | number>>({})

  const groupedByMode = useMemo(() => {
    const byMode: Record<ModeName, Array<{ key: string; entry: TokenEntry }>> = {}
    Object.entries(tokensJson as Record<string, TokenEntry>).forEach(([key, entry]) => {
      if (!entry || !entry.name) return
      const mode = entry.mode as ModeName || 'Mode 1'
      if (!byMode[mode]) byMode[mode] = []
      byMode[mode].push({ key, entry })
    })
    // Stable sort by token name
    Object.values(byMode).forEach((arr) => arr.sort((a, b) => a.entry.name.localeCompare(b.entry.name)))
    return byMode
  }, [])

  const colorFamiliesByMode = useMemo(() => {
    const ORDER = ['900','800','700','600','500','400','300','200','100','050']
    const byMode: Record<ModeName, Record<string, Array<{ level: string; entry: TokenEntry }>>> = {}
    Object.values(groupedByMode).forEach(() => {}) // force dependency for TS
    Object.entries(tokensJson as Record<string, TokenEntry>).forEach(([_, entry]) => {
      if (!entry || entry.type !== 'color') return
      if (!entry.name.startsWith('color/')) return
      const parts = entry.name.split('/')
      if (parts.length < 3) return
      const family = parts[1]
      const level = parts[2]
      if (!ORDER.includes(level)) return
      const mode = (entry.mode as ModeName) || 'Mode 1'
      if (!byMode[mode]) byMode[mode] = {}
      if (!byMode[mode][family]) byMode[mode][family] = []
      byMode[mode][family].push({ level, entry })
    })
    // sort each family by ORDER
    Object.values(byMode).forEach((fam) => {
      Object.keys(fam).forEach((k) => {
        fam[k] = fam[k].sort((a, b) => ORDER.indexOf(a.level) - ORDER.indexOf(b.level))
      })
    })
    return byMode
  }, [groupedByMode])

  useEffect(() => {
    // Initialize form values from tokens JSON
    const init: Record<string, string | number> = {}
    Object.entries(tokensJson as Record<string, TokenEntry>).forEach(([_, entry]) => {
      if (!entry || !entry.name) return
      init[entry.name] = entry.value
    })
    setValues(init)
  }, [])

  const handleChange = (tokenName: string, next: string) => {
    setValues((prev) => ({ ...prev, [tokenName]: next }))
  }

  const handleApply = () => {
    // Convert token map back to CSS variables and apply
    const map: Record<string, any> = {}
    Object.entries(values).forEach(([tokenName, v]) => {
      map[tokenName] = v
    })
    const cssVars = extractCssVarsFromObject(map)
    applyCssVars(cssVars)
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gap: 16 }}>
      <h2 style={{ margin: 0 }}>Tokens</h2>
      <p style={{ marginTop: -4, opacity: 0.8 }}>Edit token values by mode. Mode 1 = Light, Mode 2 = Dark.</p>
      {Object.entries(groupedByMode).map(([mode, items]) => (
        <section key={mode} style={{ background: 'var(--layer-layer-0-property-surface)', border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 8, padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>{mode === 'Mode 1' ? 'Light Mode' : mode === 'Mode 2' ? 'Dark Mode' : mode}</h3>
          {/* Color families laid out horizontally (900 -> 050) */}
          {colorFamiliesByMode[mode as ModeName] && (
            <div style={{ display: 'grid', gap: 16 }}>
              {Object.entries(colorFamiliesByMode[mode as ModeName]).sort((a, b) => a[0].localeCompare(b[0])).map(([family, levels]) => (
                <div key={family}>
                  <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>{`color/${family}`}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${levels.length}, 1fr)`, gap: 6 }}>
                    {levels.map(({ level, entry }) => {
                      let inputEl: HTMLInputElement | null = null
                      const current = String(values[entry.name] ?? entry.value)
                      return (
                        <div key={family + '-' + level}>
                          <div
                            onClick={() => inputEl && inputEl.click()}
                            role="button"
                            title={`${entry.name} ${entry.value}`}
                            style={{ height: 72, borderRadius: 8, border: '1px solid var(--layer-layer-1-property-border-color)', background: current, cursor: 'pointer' }}
                          />
                          <input
                            ref={(el) => { inputEl = el }}
                            type="color"
                            value={/^#([0-9a-f]{6})$/i.test(current) ? current : '#000000'}
                            onChange={(e) => handleChange(entry.name, e.currentTarget.value)}
                            style={{ display: 'none' }}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Measurements (non-color tokens) */}
          {(() => {
            const measurementItems = items.filter(({ entry }) => entry.type !== 'color' && (typeof entry.value === 'number' || typeof entry.value === 'string'))
            if (!measurementItems.length) return null
            return (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Measurements</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 8, alignItems: 'center' }}>
                  {measurementItems.map(({ entry }) => (
                    <>
                      <label key={entry.name + '-label'} htmlFor={entry.name} style={{ fontSize: 13, opacity: 0.9 }}>{entry.name}</label>
                      <input
                        key={entry.name}
                        id={entry.name}
                        type={typeof entry.value === 'number' ? 'number' : 'text'}
                        value={(values[entry.name] as any) ?? (entry.value as any)}
                        onChange={(e) => handleChange(entry.name, e.currentTarget.value)}
                      />
                    </>
                  ))}
                </div>
              </div>
            )
          })()}
        </section>
      ))}
      <div>
        <button onClick={handleApply} style={{ padding: '6px 12px', borderRadius: 6 }}>Apply tokens</button>
      </div>
    </div>
  )
}


