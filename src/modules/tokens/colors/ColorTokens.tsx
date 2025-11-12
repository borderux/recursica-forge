import { useEffect, useMemo, useState } from 'react'
import { useVars } from '../../vars/VarsContext'
import { ColorScale } from './ColorScale'
import { clamp, hsvToHex, toTitleCase } from './colorUtils'
import { cascadeColor, computeLevel500Hex, parseLevel, IDX_MAP, LEVELS_ASC } from './colorCascade'
import { getFriendlyNamePreferNtc, getNtcName } from './colorNaming'

type TokenEntry = {
  name: string
  type?: string
  value: string | number
}

type ModeName = 'Mode 1' | 'Mode 2' | string

export default function ColorTokens() {
  const { tokens: tokensJson, updateToken } = useVars()
  const [values, setValues] = useState<Record<string, string | number>>({})
  const [hoveredSwatch, setHoveredSwatch] = useState<string | null>(null)
  const [openPicker, setOpenPicker] = useState<{ tokenName: string; swatchRect: DOMRect } | null>(null)
  const [deletedFamilies, setDeletedFamilies] = useState<Record<string, true>>({})
  const [familyNames, setFamilyNames] = useState<Record<string, string>>({})
  const [namesHydrated, setNamesHydrated] = useState(false)
  const [familyOrder, setFamilyOrder] = useState<string[]>([])

  // Initialize deleted families from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('deleted-color-families')
      if (raw) setDeletedFamilies(JSON.parse(raw) || {})
    } catch {}
  }, [])
  useEffect(() => {
    try { localStorage.setItem('deleted-color-families', JSON.stringify(deletedFamilies)) } catch {}
  }, [deletedFamilies])

  // Initialize family names from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('family-friendly-names')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') setFamilyNames(parsed)
      }
    } catch {}
    setNamesHydrated(true)
  }, [])
  useEffect(() => {
    const onNames = (ev: Event) => {
      try {
        const detail: any = (ev as CustomEvent).detail
        if (detail && typeof detail === 'object') {
          setFamilyNames(detail)
          setNamesHydrated(true)
          return
        }
        const raw = localStorage.getItem('family-friendly-names')
        setFamilyNames(raw ? JSON.parse(raw) : {})
        setNamesHydrated(true)
      } catch {
        setFamilyNames({})
      }
    }
    window.addEventListener('familyNamesChanged', onNames as any)
    return () => window.removeEventListener('familyNamesChanged', onNames as any)
  }, [])
  useEffect(() => {
    if (!namesHydrated) return
    try { localStorage.setItem('family-friendly-names', JSON.stringify(familyNames)) } catch {}
    try { window.dispatchEvent(new CustomEvent('familyNamesChanged', { detail: familyNames })) } catch {}
  }, [familyNames, namesHydrated])

  // Initialize family order from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('color-family-order')
      if (raw) setFamilyOrder(JSON.parse(raw))
    } catch {}
  }, [])
  useEffect(() => {
    try { localStorage.setItem('color-family-order', JSON.stringify(familyOrder)) } catch {}
  }, [familyOrder])

  // Seed family names from tokens
  useEffect(() => {
    try {
      const t: any = (tokensJson as any)?.tokens?.color || {}
      const keys = Object.keys(t).filter((k) => k !== 'translucent')
      const raw = localStorage.getItem('family-friendly-names')
      const existing = raw ? (JSON.parse(raw) || {}) : {}
      const next: Record<string, string> = { ...existing }
      let changed = false
      keys.forEach((fam) => {
        const desired = toTitleCase(fam)
        if (!next[fam] || !String(next[fam]).trim()) {
          next[fam] = desired
          changed = true
        }
      })
      if (changed) setFamilyNames(next)
    } catch {}
  }, [tokensJson])

  // Build flat tokens list
  const flatTokens: TokenEntry[] = useMemo(() => {
    const list: TokenEntry[] = []
    const coerce = (v: any): any => {
      if (v == null) return undefined
      if (typeof v === 'string' || typeof v === 'number') return v
      if (typeof v === 'object') {
        if ('$value' in v) return coerce((v as any)['$value'])
        if ('value' in v) return (v as any).value
        if ('hex' in v) return (v as any).hex
      }
      return undefined
    }
    const push = (name: string, type: string, value: any) => {
      const v = coerce(value)
      if (typeof v === 'string' || typeof v === 'number') list.push({ name, type, value: v })
    }
    try {
      const t: any = (tokensJson as any)?.tokens || {}
      const colors = t?.color || {}
      Object.keys(colors).forEach((family) => {
        if (family === 'translucent') return
        const levels = colors[family] || {}
        Object.keys(levels).forEach((lvl) => {
          push(`color/${family}/${lvl}`, 'color', levels[lvl]?.$value)
        })
      })
      if (t?.color?.gray?.['000']) push('color/gray/000', 'color', t.color.gray['000'].$value)
      if (t?.color?.gray?.['1000']) push('color/gray/1000', 'color', t.color.gray['1000'].$value)
    } catch {}
    return list
  }, [tokensJson])

  // Sync values with tokens
  useEffect(() => {
    const init: Record<string, string | number> = {}
    flatTokens.forEach((entry) => { init[entry.name] = entry.value })
    setValues(init)
  }, [tokensJson, flatTokens])

  // Group colors by family
  const colorFamiliesByMode = useMemo(() => {
    const byMode: Record<ModeName, Record<string, Array<{ level: string; entry: TokenEntry }>>> = {}
    flatTokens.forEach((entry) => {
      if (!entry || entry.type !== 'color') return
      if (!entry.name.startsWith('color/')) return
      const parts = entry.name.split('/')
      if (parts.length < 3) return
      const family = parts[1]
      if (family === 'translucent') return
      const rawLevel = parts[2]
      if (!/^\d+$/.test(rawLevel)) return
      const level = rawLevel.length === 2 ? `0${rawLevel}` : rawLevel.length === 1 ? `00${rawLevel}` : rawLevel
      const mode: ModeName = (entry as any).mode || 'Mode 1'
      if (!byMode[mode]) byMode[mode] = {}
      if (!byMode[mode][family]) byMode[mode][family] = []
      byMode[mode][family].push({ level, entry })
    })
    Object.keys(values).forEach((name) => {
      if (!name.startsWith('color/')) return
      const parts = name.split('/')
      if (parts.length !== 3) return
      const family = parts[1]
      if (family === 'translucent') return
      const rawLevel = parts[2]
      if (!/^\d+$/.test(rawLevel)) return
      const level = rawLevel.length === 2 ? `0${rawLevel}` : rawLevel.length === 1 ? `00${rawLevel}` : rawLevel
      const mode: ModeName = 'Mode 1'
      if (!byMode[mode]) byMode[mode] = {}
      if (!byMode[mode][family]) byMode[mode][family] = []
      if (!byMode[mode][family].some((l) => l.level === level)) {
        byMode[mode][family].push({ level, entry: { name, value: String(values[name]) } as any })
      }
    })
    const levelToNum = (lvl: string) => Number(lvl)
    Object.values(byMode).forEach((fam) => {
      Object.keys(fam).forEach((k) => {
        fam[k] = fam[k].sort((a, b) => levelToNum(b.level) - levelToNum(a.level))
      })
    })
    return byMode
  }, [flatTokens, values])

  // Ensure all families have friendly names
  useEffect(() => {
    (async () => {
      try {
        const famSet = new Set<string>()
        const byMode = colorFamiliesByMode['Mode 1'] || {}
        Object.keys(byMode).forEach((fam) => { if (fam !== 'translucent') famSet.add(fam) })
        if (!famSet.size) return
        const raw = localStorage.getItem('family-friendly-names')
        const existing = raw ? (JSON.parse(raw) || {}) : {}
        let changed = false
        const next: Record<string, string> = { ...existing }
        for (const fam of famSet) {
          if (next[fam] && String(next[fam]).trim()) continue
          const levels = byMode[fam] || []
          const five = levels.find((l: any) => l.level === '500') || levels[Math.floor(levels.length / 2)] || levels[0]
          const hex = five?.entry?.value as string | undefined
          if (typeof hex === 'string' && /^#?[0-9a-fA-F]{6}$/.test(hex.trim())) {
            const normalized = hex.startsWith('#') ? hex : `#${hex}`
            const label = await getFriendlyNamePreferNtc(normalized)
            if (label && label.trim()) {
              next[fam] = label.trim()
              changed = true
            }
          } else {
            next[fam] = toTitleCase(fam)
            changed = true
          }
        }
        if (changed) {
          setFamilyNames(next)
          try { localStorage.setItem('family-friendly-names', JSON.stringify(next)) } catch {}
          try { window.dispatchEvent(new CustomEvent('familyNamesChanged', { detail: next })) } catch {}
        }
      } catch {}
    })()
  }, [colorFamiliesByMode])

  const handleChange = (tokenName: string, next: string) => {
    setValues((prev) => ({ ...prev, [tokenName]: next }))
    updateToken(tokenName, next)
  }

  const handleColorChange = (tokenName: string, hex: string, cascadeDown: boolean, cascadeUp: boolean) => {
    handleChange(tokenName, hex)

    const parts = tokenName.split('/')
    if (parts.length !== 3) return
    const family = parts[1]
    const levelStrRaw = parts[2]
    const levelNum = parseLevel(levelStrRaw)
    if (!Number.isFinite(levelNum)) return

    cascadeColor(tokenName, hex, cascadeDown, cascadeUp, handleChange)

    // Update friendly family name using the 500 level hex
    ;(async () => {
      const startIdx = IDX_MAP[levelNum]
      if (startIdx === undefined) return
      const fiveHex = computeLevel500Hex(tokenName, hex, levelNum, cascadeDown, cascadeUp, startIdx, values)
      if (fiveHex) {
        const label = await getFriendlyNamePreferNtc(fiveHex)
        setFamilyNames((prev) => ({ ...prev, [family]: label }))
        try {
          const raw = localStorage.getItem('family-friendly-names')
          const map = raw ? JSON.parse(raw) || {} : {}
          map[family] = label
          localStorage.setItem('family-friendly-names', JSON.stringify(map))
          try { window.dispatchEvent(new CustomEvent('familyNamesChanged', { detail: map })) } catch {}
        } catch {}
      }
    })()
  }

  const handleAddColor = async () => {
    setOpenPicker(null)
    const families = Object.entries(colorFamiliesByMode['Mode 1'] || {}).filter(([family]) => family !== 'translucent' && !deletedFamilies[family])
    if (!families.length) return

    const baseHSV = { h: Math.random() * 360, s: 0.6 + Math.random() * 0.35, v: 0.6 + Math.random() * 0.35 }
    const newHue = baseHSV.h
    const newFamily = `custom-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`
    const write = (name: string, hex: string) => { handleChange(name, hex) }
    const seedHex = hsvToHex(newHue, Math.max(0.6, baseHSV.s), Math.max(0.6, baseHSV.v))
    write(`color/${newFamily}/500`, seedHex)

    const name = await getFriendlyNamePreferNtc(seedHex)
    setFamilyNames((prev) => ({ ...prev, [newFamily]: name }))
    try {
      const raw = localStorage.getItem('family-friendly-names')
      const map = raw ? JSON.parse(raw) || {} : {}
      map[newFamily] = name
      localStorage.setItem('family-friendly-names', JSON.stringify(map))
      try { window.dispatchEvent(new CustomEvent('familyNamesChanged', { detail: map })) } catch {}
    } catch {}
    setFamilyOrder((prev) => (prev.includes(newFamily) ? prev : [...prev, newFamily]))

    const seedS = baseHSV.s
    const seedV = baseHSV.v
    const endS000 = 0.02
    const endV000 = 0.98
    const endS1000 = clamp(seedS * 1.2, 0, 1)
    const endV1000 = clamp(Math.max(0.03, seedV * 0.08), 0, 1)
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t
    LEVELS_ASC.forEach((lvl) => {
      const idx = IDX_MAP[lvl]
      if (idx === 6) {
        write(`color/${newFamily}/500`, seedHex)
        return
      }
      if (idx < 6) {
        const t = idx / 6
        const s = clamp(lerp(endS000, seedS, t), 0, 1)
        const v = clamp(lerp(endV000, seedV, t), 0, 1)
        write(`color/${newFamily}/${String(lvl).padStart(3, '0')}`, hsvToHex(newHue, s, v))
        return
      }
      const t = (idx - 6) / (11 - 6)
      const s = clamp(lerp(seedS, endS1000, t), 0, 1)
      const v = clamp(lerp(seedV, endV1000, t), 0, 1)
      write(`color/${newFamily}/${String(lvl).padStart(3, '0')}`, hsvToHex(newHue, s, v))
    })
  }

  const handleDeleteFamily = (family: string) => {
    setDeletedFamilies((prev) => ({ ...prev, [family]: true }))
    setOpenPicker(null)
    setFamilyOrder((prev) => prev.filter((f) => f !== family))
  }

  const handleFamilyNameChange = (family: string, newName: string) => {
    const v = toTitleCase(newName)
    setFamilyNames((prev) => ({ ...prev, [family]: v }))
    try {
      const raw = localStorage.getItem('family-friendly-names')
      const map = raw ? JSON.parse(raw) || {} : {}
      map[family] = v
      localStorage.setItem('family-friendly-names', JSON.stringify(map))
      try { window.dispatchEvent(new CustomEvent('familyNamesChanged', { detail: map })) } catch {}
    } catch {}
  }

  const handleNameFromHex = async (family: string, hex: string) => {
    if (!family) return
    const label = await getNtcName(hex)
    setFamilyNames((prev) => ({ ...prev, [family]: toTitleCase(label) }))
  }

  const mode: ModeName = 'Mode 1'
  const familiesData = colorFamiliesByMode[mode] || {}
  let families = Object.entries(familiesData).filter(([family]) => family !== 'translucent' && !deletedFamilies[family]).sort(([a], [b]) => {
    if (a === 'gray' && b !== 'gray') return -1
    if (b === 'gray' && a !== 'gray') return 1
    return a.localeCompare(b)
  })

  const existing = families.filter(([fam]) => !familyOrder.includes(fam))
  const appended = familyOrder.map((fam) => families.find(([f]) => f === fam)).filter((v): v is typeof families[number] => Array.isArray(v))
  families = [...existing, ...appended]

  const presentLevels = new Set<string>(families.flatMap(([_, lvls]) => lvls.map((l) => l.level)))
  const standardLevels = ['900', '800', '700', '600', '500', '400', '300', '200', '100', '050']
  standardLevels.forEach((lvl) => presentLevels.add(lvl))
  const levelOrder = Array.from(presentLevels).sort((a, b) => Number(b) - Number(a))

  return (
    <section style={{ background: 'var(--recursica-brand-light-layer-layer-0-property-surface, #ffffff)', border: '1px solid var(--recursica-brand-light-layer-layer-1-property-border-color, rgba(0,0,0,0.1))', borderRadius: 8, padding: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: `100px repeat(${families.length}, 1fr)`, columnGap: 12, rowGap: 0, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
            <button
              onClick={handleAddColor}
              style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--layer-layer-1-property-border-color)', background: 'transparent', cursor: 'pointer' }}
            >+Color</button>
          </div>
          {levelOrder.map((level) => (
            <div key={'label-' + level} style={{ textAlign: 'center', fontSize: 12, opacity: 0.8, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{level}</div>
          ))}
        </div>
        {families.map(([family, levels]) => (
          <ColorScale
            key={family}
            family={family}
            levels={levels}
            levelOrder={levelOrder}
            values={values}
            familyNames={familyNames}
            deletedFamilies={deletedFamilies}
            hoveredSwatch={hoveredSwatch}
            openPicker={openPicker}
            setHoveredSwatch={setHoveredSwatch}
            setOpenPicker={setOpenPicker}
            onNameFromHex={handleNameFromHex}
            onChange={handleColorChange}
            onFamilyNameChange={handleFamilyNameChange}
            onDeleteFamily={handleDeleteFamily}
          />
        ))}
      </div>
    </section>
  )
}

