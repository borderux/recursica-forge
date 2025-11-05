import './index.css'
import LayerModule from './LayerModule'
import { useEffect, useMemo, useState } from 'react'
import { useVars } from '../vars/VarsContext'
import { readOverrides } from './tokenOverrides'
import ElevationModule from '../elevation/ElevationModule'
import ElevationStylePanel from '../elevation/ElevationStylePanel'

export default function LayersPage() {
  const { tokens: tokensJson } = useVars()
  const { theme: themeJson } = useVars()
  const [blurScaleByDefault] = useState<boolean>(() => { const v = localStorage.getItem('blur-scale-by-default'); return v === null ? true : v === 'true' })
  const [spreadScaleByDefault] = useState<boolean>(() => { const v = localStorage.getItem('spread-scale-by-default'); return v === null ? false : v === 'true' })
  const [offsetXScaleByDefault] = useState<boolean>(() => { const v = localStorage.getItem('offset-x-scale-by-default'); return v === null ? false : v === 'true' })
  const [offsetYScaleByDefault] = useState<boolean>(() => { const v = localStorage.getItem('offset-y-scale-by-default'); return v === null ? false : v === 'true' })
  const [xDirection, setXDirection] = useState<'left' | 'right'>(() => {
    try {
      const saved = localStorage.getItem('offset-x-direction')
      if (saved === 'left' || saved === 'right') return saved
    } catch {}
    try {
      const brand: any = (themeJson as any)?.brand || (themeJson as any)
      const node: any = brand?.light?.elevations?.['elevation-1']?.['$value'] || {}
      const raw = Number((node?.['x-direction']?.['$value'] ?? node?.['x-direction']) as any)
      return Number.isFinite(raw) ? (raw >= 0 ? 'right' : 'left') : 'right'
    } catch { return 'right' }
  })
  const [yDirection, setYDirection] = useState<'up' | 'down'>(() => {
    try {
      const saved = localStorage.getItem('offset-y-direction')
      if (saved === 'up' || saved === 'down') return saved
    } catch {}
    try {
      const brand: any = (themeJson as any)?.brand || (themeJson as any)
      const node: any = brand?.light?.elevations?.['elevation-1']?.['$value'] || {}
      const raw = Number((node?.['y-direction']?.['$value'] ?? node?.['y-direction']) as any)
      return Number.isFinite(raw) ? (raw >= 0 ? 'down' : 'up') : 'down'
    } catch { return 'down' }
  })
  const [elevationDirections, setElevationDirections] = useState<Record<string, { x: 'left' | 'right'; y: 'up' | 'down' }>>(() => {
    try { const saved = localStorage.getItem('elevation-directions'); if (saved) return JSON.parse(saved) } catch {}
    const base: Record<string, { x: 'left' | 'right'; y: 'up' | 'down' }> = {}
    for (let i = 1; i <= 4; i += 1) base[`elevation-${i}`] = { x: 'right', y: 'down' }
    return base
  })
  const [selectedLevels, setSelectedLevels] = useState<Set<number>>(() => new Set<number>())
  const [shadowColorControl, setShadowColorControl] = useState<{ colorToken: string; alphaToken: string }>(() => {
    try { const saved = localStorage.getItem('shadow-color-control'); if (saved) return JSON.parse(saved) } catch {}
    const brand: any = (themeJson as any)?.brand || (themeJson as any)
    const elev: any = brand?.light?.elevations?.['elevation-1']?.['$value'] || {}
    const alphaRef = elev?.opacity?.['$value'] as string | undefined
    const colorRef = elev?.color?.['$value'] as string | undefined
    const parseOpacity = (s?: string) => {
      if (!s) return 'opacity/veiled'
      const inner = s.startsWith('{') ? s.slice(1, -1) : s
      const parts = inner.split('.')
      if ((parts[0] || '').toLowerCase() === 'tokens' && parts[1] === 'opacity' && parts[2]) return `opacity/${parts[2]}`
      return 'opacity/veiled'
    }
    const parseColorToken = (s?: string) => {
      if (!s) return 'color/gray/900'
      const inner = s.startsWith('{') ? s.slice(1, -1) : s
      const parts = inner.split('.')
      if ((parts[0] || '').toLowerCase() === 'tokens' && parts[1] === 'color' && parts[2] && parts[3]) return `color/${parts[2]}/${parts[3]}`
      const idx = parts.findIndex((p) => p === 'palettes')
      if (idx >= 0) {
        const paletteKey = parts[idx + 1]
        const shade = parts[idx + 2]
        const map: Record<string, string> = { neutral: 'gray', 'palette-1': 'salmon', 'palette-2': 'mandarin', 'palette-3': 'cornflower', 'palette-4': 'greensheen' }
        const family = map[paletteKey] || 'gray'
        const defaultLevelMap: Record<string, string> = { neutral: '200', 'palette-1': '400', 'palette-2': '400' }
        const level = shade === 'default' ? (defaultLevelMap[paletteKey] || '500') : shade
        if (family && level) return `color/${family}/${level}`
      }
      return 'color/gray/900'
    }
    return { colorToken: parseColorToken(colorRef), alphaToken: parseOpacity(alphaRef) }
  })
  const [elevationColorTokens, setElevationColorTokens] = useState<Record<string, string>>(() => {
    try { const saved = localStorage.getItem('elevation-color-tokens'); if (saved) return JSON.parse(saved) } catch {}
    return {}
  })
  const [elevationPaletteSelections, setElevationPaletteSelections] = useState<Record<string, { paletteKey: string; level: string }>>(() => {
    try { const saved = localStorage.getItem('elevation-palette-selections'); if (saved) return JSON.parse(saved) } catch {}
    return {}
  })
  const [elevationAlphaTokens, setElevationAlphaTokens] = useState<Record<string, string>>(() => {
    try { const saved = localStorage.getItem('elevation-alpha-tokens'); if (saved) return JSON.parse(saved) } catch {}
    return {}
  })
  const [elevationControls, setElevationControls] = useState<Record<string, { blurToken: string; spreadToken: string; offsetXToken: string; offsetYToken: string }>>(() => {
    const makeFromBrand = (): Record<string, { blurToken: string; spreadToken: string; offsetXToken: string; offsetYToken: string }> => {
      const fromBrand: Record<string, { blurToken: string; spreadToken: string; offsetXToken: string; offsetYToken: string }> = {}
      const brand: any = (themeJson as any)?.brand || (themeJson as any)
      const light: any = brand?.light?.elevations || {}
      const toSize = (ref?: any): string => {
        const s: string | undefined = typeof ref === 'string' ? ref : (ref?.['$value'] as any)
        if (!s) return 'size/none'
        const inner = s.startsWith('{') ? s.slice(1, -1) : s
        const parts = inner.split('.')
        if ((parts[0] || '').toLowerCase() === 'tokens' && parts[1] === 'size') {
          const key = parts.slice(2).join('.')
          return `size/${key}`
        }
        return 'size/none'
      }
      for (let i = 0; i <= 4; i++) {
        const node: any = light[`elevation-${i}`]?.['$value'] || {}
        fromBrand[`elevation-${i}`] = {
          blurToken: toSize(node?.blur?.['$value'] ?? node?.blur),
          spreadToken: toSize(node?.spread?.['$value'] ?? node?.spread),
          offsetXToken: toSize(node?.x?.['$value'] ?? node?.x),
          offsetYToken: toSize(node?.y?.['$value'] ?? node?.y),
        }
      }
      return fromBrand
    }
    return makeFromBrand()
  })
  const [sizeTokens, setSizeTokens] = useState<Record<string, number>>(() => {
    const tokens: Record<string, number> = {}
    try {
      const src: any = (tokensJson as any)?.tokens?.size || {}
      Object.keys(src).filter((k) => !k.startsWith('$')).forEach((k) => {
        const raw = src[k]?.$value
        const v = (raw && typeof raw === 'object' && typeof raw.value !== 'undefined') ? raw.value : raw
        const num = typeof v === 'number' ? v : Number(v)
        if (Number.isFinite(num)) tokens[`size/${k}`] = num
      })
    } catch {}
    const overrides = readOverrides(); const sizeOverrides: Record<string, number> = {}
    Object.entries(overrides).forEach(([key, value]) => { if (key.startsWith('size/') && typeof value === 'number') sizeOverrides[key] = value as number })
    return { ...tokens, ...sizeOverrides }
  })
  useEffect(() => {
    try { const saved = localStorage.getItem('elevation-controls'); if (saved) setElevationControls(JSON.parse(saved)) } catch {}
  }, [])
  useEffect(() => {
    try { localStorage.setItem('elevation-controls', JSON.stringify(elevationControls)) } catch {}
  }, [elevationControls])
  useEffect(() => { try { localStorage.setItem('shadow-color-control', JSON.stringify(shadowColorControl)) } catch {} }, [shadowColorControl])
  useEffect(() => { try { localStorage.setItem('elevation-color-tokens', JSON.stringify(elevationColorTokens)) } catch {} }, [elevationColorTokens])
  useEffect(() => { try { localStorage.setItem('elevation-palette-selections', JSON.stringify(elevationPaletteSelections)) } catch {} }, [elevationPaletteSelections])
  useEffect(() => { try { localStorage.setItem('elevation-alpha-tokens', JSON.stringify(elevationAlphaTokens)) } catch {} }, [elevationAlphaTokens])
  useEffect(() => { try { localStorage.setItem('offset-x-direction', xDirection) } catch {} }, [xDirection])
  useEffect(() => { try { localStorage.setItem('offset-y-direction', yDirection) } catch {} }, [yDirection])
  useEffect(() => { try { localStorage.setItem('elevation-directions', JSON.stringify(elevationDirections)) } catch {} }, [elevationDirections])
  useEffect(() => {
    const handler = (ev: Event) => {
      const detail: any = (ev as CustomEvent).detail
      if (!detail) return
      const { all, name, value } = detail
      if (all && typeof all === 'object') {
        const newSizeTokens: Record<string, number> = {}
        try {
          const src: any = (tokensJson as any)?.tokens?.size || {}
          Object.keys(src).filter((k) => !k.startsWith('$')).forEach((k) => {
            const raw = src[k]?.$value
            const v = (raw && typeof raw === 'object' && typeof raw.value !== 'undefined') ? raw.value : raw
            const num = typeof v === 'number' ? v : Number(v)
            if (Number.isFinite(num)) newSizeTokens[`size/${k}`] = num
          })
        } catch {}
        setSizeTokens({ ...newSizeTokens, ...all }); setShadowColorControl(prev => ({ ...prev })); return
      }
      if (typeof name === 'string' && (name.startsWith('size/') || name.startsWith('opacity/') || name.startsWith('color/'))) {
        if (name.startsWith('size/')) setSizeTokens(prev => ({ ...prev, [name]: value }))
        setShadowColorControl(prev => ({ ...prev }))
      }
    }
    window.addEventListener('tokenOverridesChanged', handler)
    return () => window.removeEventListener('tokenOverridesChanged', handler)
  }, [])
  useEffect(() => {
    const onReset = () => {
      const brand: any = (themeJson as any)?.brand || (themeJson as any)
      const light: any = brand?.light?.elevations || {}
      const toSize = (ref?: any): string => {
        const s: string | undefined = typeof ref === 'string' ? ref : (ref?.['$value'] as any)
        if (!s) return 'size/none'
        const inner = s.startsWith('{') ? s.slice(1, -1) : s
        const parts = inner.split('.')
        if ((parts[0] || '').toLowerCase() === 'tokens' && parts[1] === 'size') {
          const key = parts.slice(2).join('.')
          return `size/${key}`
        }
        return 'size/none'
      }
      const nextCtrls: Record<string, { blurToken: string; spreadToken: string; offsetXToken: string; offsetYToken: string }> = {}
      for (let i = 0; i <= 4; i++) {
        const node: any = light[`elevation-${i}`]?.['$value'] || {}
        nextCtrls[`elevation-${i}`] = {
          blurToken: toSize(node?.blur?.['$value'] ?? node?.blur),
          spreadToken: toSize(node?.spread?.['$value'] ?? node?.spread),
          offsetXToken: toSize(node?.x?.['$value'] ?? node?.x),
          offsetYToken: toSize(node?.y?.['$value'] ?? node?.y),
        }
      }
      setElevationControls(nextCtrls)
      setElevationColorTokens({})
      setElevationAlphaTokens({})
      setElevationPaletteSelections({})
      const baseX = Number((light['elevation-1']?.['$value']?.['x-direction']?.['$value'] ?? 1))
      const baseY = Number((light['elevation-1']?.['$value']?.['y-direction']?.['$value'] ?? 1))
      setXDirection(baseX >= 0 ? 'right' : 'left')
      setYDirection(baseY >= 0 ? 'down' : 'up')
      const dirRec: Record<string, { x: 'left' | 'right'; y: 'up' | 'down' }> = {}
      for (let i = 1; i <= 4; i += 1) {
        const node: any = light[`elevation-${i}`]?.['$value'] || {}
        const xraw = Number((node?.['x-direction']?.['$value'] ?? baseX))
        const yraw = Number((node?.['y-direction']?.['$value'] ?? baseY))
        dirRec[`elevation-${i}`] = { x: xraw >= 0 ? 'right' : 'left', y: yraw >= 0 ? 'down' : 'up' }
      }
      setElevationDirections(dirRec)
      const parseOpacity = (s?: any) => {
        const v: string | undefined = typeof s === 'string' ? s : (s?.['$value'] as any)
        if (!v) return 'opacity/veiled'
        const inner = v.startsWith('{') ? v.slice(1, -1) : v
        const parts = inner.split('.')
        if ((parts[0] || '').toLowerCase() === 'tokens' && parts[1] === 'opacity' && parts[2]) return `opacity/${parts[2]}`
        return 'opacity/veiled'
      }
      const parseColorToken = (s?: any) => {
        const v: string | undefined = typeof s === 'string' ? s : (s?.['$value'] as any)
        if (!v) return 'color/gray/900'
        const inner = v.startsWith('{') ? v.slice(1, -1) : v
        const parts = inner.split('.')
        if ((parts[0] || '').toLowerCase() === 'tokens' && parts[1] === 'color' && parts[2] && parts[3]) return `color/${parts[2]}/${parts[3]}`
        const idx = parts.findIndex((p) => p === 'palettes')
        if (idx >= 0) {
          const paletteKey = parts[idx + 1]
          const shade = parts[idx + 2]
          const map: Record<string, string> = { neutral: 'gray', 'palette-1': 'salmon', 'palette-2': 'mandarin', 'palette-3': 'cornflower', 'palette-4': 'greensheen' }
          const family = map[paletteKey] || 'gray'
          const defaultLevelMap: Record<string, string> = { neutral: '200', 'palette-1': '400', 'palette-2': '400' }
          const level = shade === 'default' ? (defaultLevelMap[paletteKey] || '500') : shade
          if (family && level) return `color/${family}/${level}`
        }
        return 'color/gray/900'
      }
      const baseNode: any = light['elevation-1']?.['$value'] || {}
      setShadowColorControl({ colorToken: parseColorToken(baseNode?.color), alphaToken: parseOpacity(baseNode?.opacity) })
      setSelectedLevels(new Set<number>())
    }
    window.addEventListener('paletteReset', onReset)
    return () => window.removeEventListener('paletteReset', onReset)
  }, [themeJson])
  const updateElevationControl = (elevation: string, property: 'blurToken' | 'spreadToken' | 'offsetXToken' | 'offsetYToken', value: string) => {
    setElevationControls(prev => ({ ...prev, [elevation]: { ...prev[elevation], [property]: value } }))
  }
  const setElevationColorToken = (elevation: string, token: string) => {
    if (elevation === 'elevation-0') return
    setElevationColorTokens((prev) => ({ ...prev, [elevation]: token }))
  }
  const setElevationPaletteSelection = (elevation: string, paletteKey: string, level: string) => {
    if (elevation === 'elevation-0') return
    setElevationPaletteSelections((prev) => ({ ...prev, [elevation]: { paletteKey, level } }))
  }
  const setElevationAlphaToken = (elevation: string, token: string) => {
    if (elevation === 'elevation-0') return
    setElevationAlphaTokens((prev) => ({ ...prev, [elevation]: token }))
  }
  const getNextTokenInProgression = useMemo(() => {
    return (baseToken: string, steps: number): string => {
      const sizeItems: Array<{ name: string; value: number }> = []
      Object.entries(sizeTokens).forEach(([name, value]) => { if (name.startsWith('size/') && typeof value === 'number') sizeItems.push({ name, value }) })
      const weight = (full: string) => { const n = full.replace('size/', '').replace('-', '.'); if (n === 'none') return [0, 0] as const; if (n === '0.5x') return [1, 0] as const; if (n === 'default') return [2, 0] as const; const asNum = parseFloat(n.replace('x', '')); return [3, isNaN(asNum) ? Number.POSITIVE_INFINITY : asNum] as const }
      const sortedTokens = sizeItems.sort((a, b) => { const wa = weight(a.name); const wb = weight(b.name); if (wa[0] !== wb[0]) return wa[0] - wb[0]; return wa[1] - wb[1] })
      const currentIndex = sortedTokens.findIndex(token => token.name === baseToken)
      if (currentIndex === -1) return baseToken
      const nextIndex = Math.min(currentIndex + steps, sortedTokens.length - 1)
      return sortedTokens[nextIndex].name
    }
  }, [sizeTokens])
  const getBlurValue = (elevation: string) => {
    if (elevation === 'elevation-0') return 0
    const control = elevationControls[elevation]; if (!control) return 0
    const tokenValue = sizeTokens[control.blurToken]; const baseValue = tokenValue || 0
    if (blurScaleByDefault) {
      const level0Token = elevationControls['elevation-0']?.blurToken || 'size/default'
      if (control.blurToken === level0Token) {
        const elevationLevel = parseInt(elevation.replace('elevation-', ''))
        const nextToken = getNextTokenInProgression(level0Token, elevationLevel)
        return sizeTokens[nextToken] || baseValue
      }
    }
    return baseValue
  }
  const getSpreadValue = (elevation: string) => {
    if (elevation === 'elevation-0') return 0
    const control = elevationControls[elevation]; if (!control) return 0
    const tokenValue = sizeTokens[control.spreadToken]; const baseValue = tokenValue || 0
    if (spreadScaleByDefault) {
      const level0Token = elevationControls['elevation-0']?.spreadToken || 'size/default'
      if (control.spreadToken === level0Token) {
        const elevationLevel = parseInt(elevation.replace('elevation-', ''))
        const nextToken = getNextTokenInProgression(level0Token, elevationLevel)
        return sizeTokens[nextToken] || baseValue
      }
    }
    return baseValue
  }
  const getXDirForLevel = (elevation: string): 'left' | 'right' => (elevationDirections[elevation]?.x ?? xDirection)
  const getYDirForLevel = (elevation: string): 'up' | 'down' => (elevationDirections[elevation]?.y ?? yDirection)
  const getOffsetXValue = (elevation: string) => {
    if (elevation === 'elevation-0') return 0
    const control = elevationControls[elevation]; if (!control) return 0
    const tokenValue = sizeTokens[control.offsetXToken]
    const baseValue = tokenValue || 0
    const scaled = (() => {
      if (offsetXScaleByDefault) {
        const level0Token = elevationControls['elevation-0']?.offsetXToken || 'size/default'
        if (control.offsetXToken === level0Token) {
          const elevationLevel = parseInt(elevation.replace('elevation-', ''))
          const nextToken = getNextTokenInProgression(level0Token, elevationLevel)
          return sizeTokens[nextToken] || baseValue
        }
      }
      return baseValue
    })()
    const dir = getXDirForLevel(elevation)
    const sign = dir === 'right' ? 1 : -1
    return scaled * sign
  }
  const getOffsetYValue = (elevation: string) => {
    if (elevation === 'elevation-0') return 0
    const control = elevationControls[elevation]; if (!control) return 0
    const tokenValue = sizeTokens[control.offsetYToken]
    const baseValue = tokenValue || 0
    const scaled = (() => {
      if (offsetYScaleByDefault) {
        const level0Token = elevationControls['elevation-0']?.offsetYToken || 'size/default'
        if (control.offsetYToken === level0Token) {
          const elevationLevel = parseInt(elevation.replace('elevation-', ''))
          const nextToken = getNextTokenInProgression(level0Token, elevationLevel)
          return sizeTokens[nextToken] || baseValue
        }
      }
      return baseValue
    })()
    const dir = getYDirForLevel(elevation)
    const sign = dir === 'down' ? 1 : -1
    return scaled * sign
  }
  const getTokenValueByName = (name: string): string | number | undefined => {
    try {
      const overrides = readOverrides() as Record<string, any>
      if (overrides && Object.prototype.hasOwnProperty.call(overrides, name)) {
        const ov = overrides[name]
        if (ov != null) return ov as any
      }
    } catch {}
    try {
      const parts = (name || '').split('/')
      const root: any = (tokensJson as any)?.tokens || {}
      if (parts[0] === 'color' && parts.length >= 3) {
        const v = root?.color?.[parts[1]]?.[parts[2]]?.$value
        return typeof v === 'string' ? v : undefined
      }
      if (parts[0] === 'opacity' && parts[1]) {
        const v = root?.opacity?.[parts[1]]?.$value
        return typeof v === 'number' ? v : (typeof v === 'string' ? Number(v) : undefined)
      }
    } catch {}
    return undefined
  }
  const getPaletteFamily = (paletteKey: string): string | undefined => {
    try {
      const raw = localStorage.getItem(`palette-grid-family:${paletteKey}`)
      if (raw) return JSON.parse(raw)
    } catch {}
    if (paletteKey === 'neutral') return 'gray'
    if (paletteKey === 'palette-1') return 'salmon'
    if (paletteKey === 'palette-2') return 'mandarin'
    if (paletteKey === 'palette-3') return 'cornflower'
    if (paletteKey === 'palette-4') return 'greensheen'
    return undefined
  }
  const getColorHexForLevel = (level: number): string => {
    const key = `elevation-${level}`
    const sel = elevationPaletteSelections[key]
    if (sel) {
      const family = getPaletteFamily(sel.paletteKey)
      if (family) {
        const name = `color/${family}/${sel.level}`
        const v = getTokenValueByName(name)
        if (typeof v === 'string' && v) return v
      }
    }
    const token = elevationColorTokens[key] || shadowColorControl.colorToken
    const v = getTokenValueByName(token)
    return (typeof v === 'string' && v) ? v : '#000000'
  }
  const getAlphaTokenForLevel = (level: number): string => {
    const key = `elevation-${level}`
    return elevationAlphaTokens[key] || shadowColorControl.alphaToken
  }
  const getAlphaForLevel = (level: number): number => {
    const token = getAlphaTokenForLevel(level)
    const v = getTokenValueByName(token)
    const n = typeof v === 'number' ? v : Number(v)
    return Number.isFinite(n) ? n : 0
  }
  useEffect(() => { try { const root = document.documentElement; const apply = (level: number) => { const key = `elevation-${level}`; const blur = getBlurValue(key); const spread = getSpreadValue(key); const x = getOffsetXValue(key); const y = getOffsetYValue(key); const color = getColorHexForLevel(level); root.style.setProperty(`--elevation-elevation-${level}-shadow-color`, color); root.style.setProperty(`--elevation-elevation-${level}-blur`, `${blur}px`); root.style.setProperty(`--elevation-elevation-${level}-spread`, `${spread}px`); root.style.setProperty(`--elevation-elevation-${level}-x-axis`, `${x}px`); root.style.setProperty(`--elevation-elevation-${level}-y-axis`, `${y}px`) }; for (let i = 0; i <= 4; i += 1) apply(i) } catch {} }, [sizeTokens, elevationControls, elevationColorTokens, shadowColorControl.colorToken, blurScaleByDefault, spreadScaleByDefault, offsetXScaleByDefault, offsetYScaleByDefault])
  const getColorTokenForLevel = (elevationKey: string): string => elevationColorTokens[elevationKey] || shadowColorControl.colorToken
  const availableSizeTokens = useMemo(() => {
    const tokens: Array<{ name: string; value: number; label: string }> = []
    Object.entries(sizeTokens).forEach(([name, value]) => {
      if (name.startsWith('size/') && typeof value === 'number') {
        const baseLabel = name.replace('size/', '').replace('-', '.')
        const label = baseLabel === 'none' ? 'None' : baseLabel === 'default' ? 'Default' : baseLabel.endsWith('x') ? baseLabel : `${baseLabel}x`
        tokens.push({ name, value, label })
      }
    })
    return tokens.sort((a, b) => a.value - b.value)
  }, [sizeTokens])
  const availableOpacityTokens = useMemo(() => {
    const out: Array<{ name: string; value: number; label: string }> = []
    try {
      const src: any = (tokensJson as any)?.tokens?.opacity || {}
      Object.keys(src).filter((k) => !k.startsWith('$')).forEach((k) => {
        const raw = src[k]?.$value
        const v = (raw && typeof raw === 'object' && typeof raw.value !== 'undefined') ? raw.value : raw
        const num = typeof v === 'number' ? v : Number(v)
        if (Number.isFinite(num)) out.push({ name: `opacity/${k}`, value: num, label: k.charAt(0).toUpperCase() + k.slice(1) })
      })
    } catch {}
    return out.sort((a, b) => a.value - b.value)
  }, [tokensJson])
  const revertSelected = (levels: Set<number>) => {
    const brand: any = (themeJson as any)?.brand || (themeJson as any)
    const light: any = brand?.light?.elevations || {}
    const toSize = (ref?: any): string => {
      const s: string | undefined = typeof ref === 'string' ? ref : (ref?.['$value'] as any)
      if (!s) return 'size/none'
      const inner = s.startsWith('{') ? s.slice(1, -1) : s
      const parts = inner.split('.')
      if ((parts[0] || '').toLowerCase() === 'tokens' && parts[1] === 'size') {
        const key = parts.slice(2).join('.')
        return `size/${key}`
      }
      return 'size/none'
    }
    const parseColorToken = (s?: any) => {
      const v: string | undefined = typeof s === 'string' ? s : (s?.['$value'] as any)
      if (!v) return undefined
      const inner = v.startsWith('{') ? v.slice(1, -1) : v
      const parts = inner.split('.')
      if ((parts[0] || '').toLowerCase() === 'tokens' && parts[1] === 'color' && parts[2] && parts[3]) return `color/${parts[2]}/${parts[3]}`
      const idx = parts.findIndex((p) => p === 'palettes')
      if (idx >= 0) {
        const paletteKey = parts[idx + 1]
        const shade = parts[idx + 2]
        const map: Record<string, string> = { neutral: 'gray', 'palette-1': 'salmon', 'palette-2': 'mandarin', 'palette-3': 'cornflower', 'palette-4': 'greensheen' }
        const family = map[paletteKey] || 'gray'
        const level = shade === 'default' ? '500' : shade
        return `color/${family}/${level}`
      }
      return undefined
    }
    setElevationControls((prev) => {
      const next = { ...prev }
      levels.forEach((lvl) => {
        const node: any = light[`elevation-${lvl}`]?.['$value'] || {}
        next[`elevation-${lvl}`] = {
          blurToken: toSize(node?.blur?.['$value'] ?? node?.blur),
          spreadToken: toSize(node?.spread?.['$value'] ?? node?.spread),
          offsetXToken: toSize(node?.x?.['$value'] ?? node?.x),
          offsetYToken: toSize(node?.y?.['$value'] ?? node?.y),
        }
      })
      return next
    })
    setElevationColorTokens((prev) => {
      const next = { ...prev }
      levels.forEach((lvl) => {
        const node: any = light[`elevation-${lvl}`]?.['$value'] || {}
        const token = parseColorToken(node?.color)
        if (token) next[`elevation-${lvl}`] = token; else delete next[`elevation-${lvl}`]
      })
      return next
    })
    setElevationPaletteSelections((prev) => {
      const next = { ...prev }
      levels.forEach((lvl) => { delete next[`elevation-${lvl}`] })
      return next
    })
    setElevationAlphaTokens((prev) => {
      const next = { ...prev }
      const parseOpacityToken = (s?: any) => {
        const v: string | undefined = typeof s === 'string' ? s : (s?.['$value'] as any)
        if (!v) return undefined
        const inner = v.startsWith('{') ? v.slice(1, -1) : v
        const parts = inner.split('.')
        if ((parts[0] || '').toLowerCase() === 'tokens' && parts[1] === 'opacity' && parts[2]) return `opacity/${parts[2]}`
        return undefined
      }
      levels.forEach((lvl) => {
        const node: any = light[`elevation-${lvl}`]?.['$value'] || {}
        const tok = parseOpacityToken(node?.opacity)
        if (tok) next[`elevation-${lvl}`] = tok; else delete next[`elevation-${lvl}`]
      })
      return next
    })
    setElevationDirections((prev) => {
      const next = { ...prev }
      const baseX = Number((light['elevation-1']?.['$value']?.['x-direction']?.['$value'] ?? 1))
      const baseY = Number((light['elevation-1']?.['$value']?.['y-direction']?.['$value'] ?? 1))
      levels.forEach((lvl) => {
        const node: any = light[`elevation-${lvl}`]?.['$value'] || {}
        const xraw = Number((node?.['x-direction']?.['$value'] ?? baseX))
        const yraw = Number((node?.['y-direction']?.['$value'] ?? baseY))
        next[`elevation-${lvl}`] = { x: xraw >= 0 ? 'right' : 'left', y: yraw >= 0 ? 'down' : 'up' }
      })
      return next
    })
  }
  return (
    <div id="body" className="antialiased" style={{ backgroundColor: 'var(--layer-layer-0-property-surface)', color: 'var(--layer-layer-0-property-element-text-color)' }}>
      <div className="container-padding">
        <div className="section">
          <h2>Layers</h2>
          <LayerModule level={0} title="Layer 0 (Background)">
            <LayerModule level={1} title="Layer 1">
              <LayerModule level={2} title="Layer 2">
                <LayerModule level={3} title="Layer 3" />
              </LayerModule>
            </LayerModule>
          </LayerModule>
        </div>

        <div className="section">
          <h2>Alternative Layers</h2>
          <div className="alt-layers-wrapper">
            <LayerModule alternativeKey="high-contrast" title="High Contrast" className="card alt-layer-card" />
            <LayerModule alternativeKey="primary-color" title="Primary Color" className="card alt-layer-card" />
            <LayerModule alternativeKey="alert" title="Alert" className="card alt-layer-card" />
            <LayerModule alternativeKey="warning" title="Warning" className="card alt-layer-card" />
            <LayerModule alternativeKey="success" title="Success" className="card alt-layer-card" />
          </div>
        </div>

        <div className="section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>Elevation</h2>
          </div>
          <div style={{ border: '1px solid var(--temp-disabled)', borderRadius: 8, padding: 32, display: 'grid', gap: 16 }}>
            <div className="elevation-grid" style={{ display: 'grid', gap: 48 }}>
              {[0,1,2,3,4].map((i) => (
                <ElevationModule
                  key={i}
                  label={`Elevation ${i}`}
                  blurPx={getBlurValue(`elevation-${i}`)}
                  spreadPx={getSpreadValue(`elevation-${i}`)}
                  offsetXPx={getOffsetXValue(`elevation-${i}`)}
                  offsetYPx={getOffsetYValue(`elevation-${i}`)}
                  colorHex={getColorHexForLevel(i)}
                  alpha={getAlphaForLevel(i)}
                  isSelected={i === 0 ? false : selectedLevels.has(i)}
                  onToggle={i === 0 ? undefined : () => setSelectedLevels(prev => { const next = new Set(prev); if (next.has(i)) next.delete(i); else next.add(i); return next })}
                  selectable={i > 0}
                  zIndex={i}
                />
              ))}
            </div>
          </div>
        </div>

        {selectedLevels.size > 0 && (
          <ElevationStylePanel
            selectedLevels={selectedLevels}
            elevationControls={elevationControls}
            availableSizeTokens={availableSizeTokens}
            availableOpacityTokens={availableOpacityTokens}
            neutralColorOptions={(() => {
              const opts: Array<{ name: string; label: string }> = []
              const gray: any = (tokensJson as any)?.tokens?.color?.gray || {}
              const levels = Object.keys(gray).filter((k) => /^(\d{2,4}|000)$/.test(k)).sort((a,b) => Number(b.replace(/^0+/,'')) - Number(a.replace(/^0+/,'')))
              levels.forEach((lvl) => { opts.push({ name: `color/gray/${lvl}`, label: `Gray ${lvl}` }) })
              return opts
            })()}
            shadowColorControl={shadowColorControl}
            setShadowColorControl={setShadowColorControl as any}
            getColorTokenForLevel={getColorTokenForLevel}
            setElevationColorToken={setElevationColorToken}
            getPaletteForLevel={(key: string) => elevationPaletteSelections[key]}
            setPaletteForSelected={(paletteKey: string, level: string) => {
              selectedLevels.forEach((lvl) => setElevationPaletteSelection(`elevation-${lvl}`, paletteKey, level))
            }}
            getAlphaTokenForLevel={(key: string) => {
              const lvl = Number(key.replace('elevation-',''))
              return getAlphaTokenForLevel(lvl)
            }}
            setElevationAlphaToken={setElevationAlphaToken}
            updateElevationControl={updateElevationControl}
            getDirectionForLevel={(key: string) => ({ x: getXDirForLevel(key), y: getYDirForLevel(key) })}
            setXDirectionForSelected={(dir: 'left' | 'right') => {
              setElevationDirections((prev) => {
                const next = { ...prev }
                selectedLevels.forEach((lvl) => { const k = `elevation-${lvl}`; next[k] = { x: dir, y: getYDirForLevel(k) } })
                return next
              })
            }}
            setYDirectionForSelected={(dir: 'up' | 'down') => {
              setElevationDirections((prev) => {
                const next = { ...prev }
                selectedLevels.forEach((lvl) => { const k = `elevation-${lvl}`; next[k] = { x: getXDirForLevel(k), y: dir } })
                return next
              })
            }}
            revertSelected={revertSelected}
            blurScaleByDefault={blurScaleByDefault}
            spreadScaleByDefault={spreadScaleByDefault}
            offsetXScaleByDefault={offsetXScaleByDefault}
            offsetYScaleByDefault={offsetYScaleByDefault}
            onClose={() => setSelectedLevels(new Set())}
          />
        )}
      </div>
    </div>
  )
}


