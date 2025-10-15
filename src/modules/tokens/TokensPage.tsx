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
  const [subTab, setSubTab] = useState<'color' | 'measurements'>('color')

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
    const byMode: Record<ModeName, Record<string, Array<{ level: string; entry: TokenEntry }>>> = {}
    Object.values(groupedByMode).forEach(() => {}) // force dependency for TS
    Object.entries(tokensJson as Record<string, TokenEntry>).forEach(([_, entry]) => {
      if (!entry || entry.type !== 'color') return
      if (!entry.name.startsWith('color/')) return
      const parts = entry.name.split('/')
      if (parts.length < 3) return
      const family = parts[1]
      if (family === 'translucent') return
      const rawLevel = parts[2]
      if (!/^\d+$/.test(rawLevel)) return
      const level = rawLevel.length === 2 ? `0${rawLevel}` : rawLevel.length === 1 ? `00${rawLevel}` : rawLevel
      const mode = (entry.mode as ModeName) || 'Mode 1'
      if (!byMode[mode]) byMode[mode] = {}
      if (!byMode[mode][family]) byMode[mode][family] = []
      byMode[mode][family].push({ level, entry })
    })
    // sort each family numerically descending (e.g., 1000, 900 ... 050, 000)
    const levelToNum = (lvl: string) => Number(lvl)
    Object.values(byMode).forEach((fam) => {
      Object.keys(fam).forEach((k) => {
        fam[k] = fam[k].sort((a, b) => levelToNum(b.level) - levelToNum(a.level))
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

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <h2 style={{ margin: 0 }}>Tokens</h2>
        <div style={{ display: 'inline-flex', border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 999, overflow: 'hidden' }}>
          <button
            onClick={() => setSubTab('color')}
            style={{ padding: '6px 12px', border: 0, cursor: 'pointer', background: subTab === 'color' ? 'var(--layer-layer-alternative-primary-color-property-element-interactive-color)' : 'transparent', color: subTab === 'color' ? '#fff' : 'inherit' }}
          >Color</button>
          <button
            onClick={() => setSubTab('measurements')}
            style={{ padding: '6px 12px', border: 0, cursor: 'pointer', background: subTab === 'measurements' ? 'var(--layer-layer-alternative-primary-color-property-element-interactive-color)' : 'transparent', color: subTab === 'measurements' ? '#fff' : 'inherit' }}
          >Measurements</button>
        </div>
      </div>
      {Object.entries(groupedByMode).map(([mode, items]) => {
        const colorSection = (
          <section key={mode + '-color'} style={{ background: 'var(--layer-layer-0-property-surface)', border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 8, padding: 12 }}>
            {colorFamiliesByMode[mode as ModeName] && (() => {
              const families = Object.entries(colorFamiliesByMode[mode as ModeName]).sort(([a], [b]) => {
                if (a === 'gray' && b !== 'gray') return -1
                if (b === 'gray' && a !== 'gray') return 1
                return a.localeCompare(b)
              })
              const levelOrder = Array.from(new Set(families.flatMap(([_, lvls]) => lvls.map((l) => l.level))))
                .sort((a, b) => Number(b) - Number(a))
              return (
                <div style={{ display: 'grid', gridTemplateColumns: `100px repeat(${families.length}, 1fr)`, columnGap: 12, rowGap: 0, alignItems: 'start' }}>
                  <div />
                  {families.map(([family]) => (
                    <input key={family + '-name'} required defaultValue={family} style={{ fontSize: 13, padding: '4px 8px', border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 6, width: '100%' }} />
                  ))}
                  <div style={{ gridColumn: `1 / span ${families.length + 1}`, height: 20 }} />
                  {levelOrder.map((level) => (
                    <>
                      <div key={'label-' + level} style={{ textAlign: 'center', fontSize: 12, opacity: 0.8, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{level}</div>
                      {families.map(([family, lvls]) => {
                        const match = lvls.find((l) => l.level === level)
                        const entry = match?.entry
                        const tokenName = entry?.name
                        const current = tokenName ? String(values[tokenName] ?? entry!.value) : ''
                        let inputEl: HTMLInputElement | null = null
                        return (
                          <div key={family + '-' + level}>
                            <div
                              onClick={() => inputEl && inputEl.click()}
                              role="button"
                              title={tokenName ? `${tokenName} ${current}` : ''}
                              style={{ height: 40, background: tokenName ? current : 'transparent', cursor: tokenName ? 'pointer' : 'default' }}
                            />
                            {tokenName && (
                              <input
                                ref={(el) => { inputEl = el }}
                                type="color"
                                value={/^#([0-9a-f]{6})$/i.test(current) ? current : '#000000'}
                                onChange={(e) => handleChange(tokenName, e.currentTarget.value)}
                                style={{ display: 'none' }}
                              />
                            )}
                          </div>
                        )
                      })}
                    </>
                  ))}
                </div>
              )
            })()}
          </section>
        )

        const measurementSection = (() => {
          const measurementItems = items.filter(({ entry }) => entry.type !== 'color' && (typeof entry.value === 'number' || typeof entry.value === 'string'))
          if (!measurementItems.length) return null
          const groups: Record<string, typeof measurementItems> = {
            Effects: measurementItems.filter(({ entry }) => entry.name.startsWith('effect/')),
            Font: measurementItems.filter(({ entry }) => entry.name.startsWith('font/')),
            Opacity: measurementItems.filter(({ entry }) => entry.name.startsWith('opacity/')),
            Size: measurementItems.filter(({ entry }) => entry.name.startsWith('size/')),
          }
          return (
            <section key={mode + '-measurements'} style={{ background: 'var(--layer-layer-0-property-surface)', border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 8, padding: 12 }}>
              <div style={{ display: 'grid', gap: 16 }}>
                {Object.entries(groups).map(([groupName, groupItems]) => (
                  groupItems.length ? (
                    <div key={groupName}>
                      <div style={{ fontWeight: 600, marginBottom: 8 }}>{groupName}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 8, alignItems: 'center' }}>
                        {groupItems.map(({ entry }) => (
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
                  ) : null
                ))}
              </div>
            </section>
          )
        })()

        return (
          <div key={mode} style={{ display: 'grid', gap: 12 }}>
            {subTab === 'color' ? colorSection : measurementSection}
          </div>
        )
      })}
      
    </div>
  )
}


