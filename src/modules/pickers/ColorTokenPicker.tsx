import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useVars } from '../vars/VarsContext'
import { readOverrides } from '../theme/tokenOverrides'
import { findTokenByHex } from '../../core/css/tokenRefs'
import { updateCssVar } from '../../core/css/updateCssVar'

export default function ColorTokenPicker() {
  const { tokens: tokensJson, theme: themeJson, setTheme } = useVars()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [targetVar, setTargetVar] = useState<string | null>(null)
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: -9999, left: -9999 })
  const [familyNames, setFamilyNames] = useState<Record<string, string>>({})
  
  useEffect(() => {
    try {
      const raw = localStorage.getItem('family-friendly-names')
      if (raw) setFamilyNames(JSON.parse(raw))
    } catch {}
    const onNames = (ev: Event) => {
      try {
        const detail: any = (ev as CustomEvent).detail
        if (detail && typeof detail === 'object') {
          setFamilyNames(detail)
          return
        }
        const raw = localStorage.getItem('family-friendly-names')
        setFamilyNames(raw ? JSON.parse(raw) : {})
      } catch {
        setFamilyNames({})
      }
    }
    window.addEventListener('familyNamesChanged', onNames as any)
    return () => window.removeEventListener('familyNamesChanged', onNames as any)
  }, [])
  
  const options = useMemo(() => {
    const byFamily: Record<string, Array<{ level: string; name: string; value: string }>> = {}
    const jsonColors: any = (tokensJson as any)?.tokens?.color || {}
    const overrideMap = readOverrides()
    const jsonFamilies = Object.keys(jsonColors).filter((f) => f !== 'translucent')
    const overrideFamilies = Array.from(new Set(Object.keys(overrideMap)
      .filter((k) => k.startsWith('color/'))
      .map((k) => k.split('/')[1])
      .filter((f) => f && f !== 'translucent')))
    const families = Array.from(new Set([...jsonFamilies, ...overrideFamilies])).sort((a, b) => {
      if (a === 'gray' && b !== 'gray') return -1
      if (b === 'gray' && a !== 'gray') return 1
      return a.localeCompare(b)
    })
    families.forEach((fam) => {
      const jsonLevels = Object.keys(jsonColors?.[fam] || {})
      const overrideLevels = Object.keys(overrideMap)
        .filter((k) => k.startsWith(`color/${fam}/`))
        .map((k) => k.split('/')[2])
        .filter((lvl) => /^(\d{2,4})$/.test(lvl))
      const levelSet = new Set<string>([...jsonLevels, ...overrideLevels])
      const levels = Array.from(levelSet)
      byFamily[fam] = levels.map((lvl) => {
        const name = `color/${fam}/${lvl}`
        const val = (overrideMap as any)[name] ?? (jsonColors?.[fam]?.[lvl]?.$value)
        return { level: lvl, name, value: String(val ?? '') }
      }).filter((it) => it.value && /^#?[0-9a-fA-F]{6}$/.test(String(it.value).trim()))
      byFamily[fam].sort((a, b) => Number(b.level) - Number(a.level))
    })
    return byFamily
  }, [tokensJson])

  ;(window as any).openPicker = (el: HTMLElement, cssVar: string) => {
    setAnchor(el)
    setTargetVar(cssVar)
    const rect = el.getBoundingClientRect()
    const top = rect.bottom + 8
    const left = Math.min(rect.left, window.innerWidth - 420)
    setPos({ top, left })
  }

  const handleSelect = (tokenName: string, hex: string) => {
    if (!targetVar) return
    
    // Ensure we have a valid token name - if not, try to find matching token by hex
    let finalTokenName = tokenName
    if (!finalTokenName || !finalTokenName.startsWith('color/')) {
      // Try to find token by hex value
      const tokenMatch = findTokenByHex(hex, tokensJson)
      if (tokenMatch) {
        finalTokenName = `color/${tokenMatch.family}/${tokenMatch.level}`
        console.log(`Found matching token for hex ${hex}: ${finalTokenName}`)
      } else {
        console.warn(`No matching token found for hex ${hex} in core palette ${targetVar}. Using provided token name or default.`)
      }
    }
    
    // Build the token CSS variable reference with normalized level
    const tokenParts = finalTokenName.split('/')
    if (tokenParts.length === 3 && tokenParts[0] === 'color') {
      const family = tokenParts[1]
      let level = tokenParts[2]
      // Normalize level (000 -> 050, 1000 -> 900)
      const padded = level.padStart(3, '0')
      if (padded === '000') level = '050'
      else if (padded === '1000') level = '900'
      else level = padded
      
      const tokenCssVar = `--recursica-tokens-color-${family}-${level}`
      
      // Set the CSS variable to reference the token using centralized function
      updateCssVar(targetVar, `var(${tokenCssVar})`, tokensJson)
      
      // If this is a core color, update the theme JSON to persist the change
      const coreColorMatch = targetVar.match(/--recursica-brand-light-palettes-core-(black|white|alert|warning|success|interactive)/)
      if (coreColorMatch && setTheme && themeJson) {
        const coreColorName = coreColorMatch[1] as 'black' | 'white' | 'alert' | 'warning' | 'success' | 'interactive'
        const tokenRef = `{tokens.color.${family}.${level}}`
        
        // Update theme JSON to persist the change
        try {
          const nextTheme = JSON.parse(JSON.stringify(themeJson)) // Deep clone
          const root: any = nextTheme?.brand ? nextTheme.brand : nextTheme
          
          // Update light mode
          if (root?.light?.palettes?.core) {
            const core = root.light.palettes['core-colors'] || root.light.palettes.core
            if (core.$value) {
              core.$value[coreColorName] = tokenRef
            } else {
              core[coreColorName] = tokenRef
            }
          }
          
          // Also update dark mode to keep them in sync
          if (root?.dark?.palettes?.core) {
            const core = root.dark.palettes.core
            if (core.$value) {
              core.$value[coreColorName] = tokenRef
            } else {
              core[coreColorName] = tokenRef
            }
          }
          
          setTheme(nextTheme)
        } catch (err) {
          console.error('Failed to update theme state for core color:', err)
        }
      }
      
      // AA compliance is now handled reactively by AAComplianceWatcher
      // No manual calls needed - the watcher will detect CSS var changes automatically
    }
    
    setAnchor(null)
    setTargetVar(null)
  }

  if (!anchor || !targetVar) return null
  
  const toTitle = (s: string) => (s || '').replace(/[-_/]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()).trim()
  const getFriendly = (family: string) => {
    const fromMap = (familyNames || {})[family]
    if (typeof fromMap === 'string' && fromMap.trim()) return fromMap
    return toTitle(family)
  }
  const maxCount = Math.max(...Object.values(options).map((arr) => arr.length || 0))
  const labelCol = 110
  const swatch = 18
  const gap = 1
  const overlayWidth = labelCol + maxCount * (swatch + gap) + 32
  
  return createPortal(
    <div style={{ position: 'fixed', top: pos.top, left: pos.left, width: overlayWidth, background: 'var(--recursica-brand-light-layer-layer-0-property-surface)', color: 'var(--recursica-brand-light-layer-layer-0-property-element-text-color)', border: '1px solid var(--recursica-brand-light-layer-layer-1-property-border-color)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', padding: 10, zIndex: 9999 }}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, cursor: 'move' }}
        onMouseDown={(e) => {
          const startX = e.clientX
          const startY = e.clientY
          const start = { ...pos }
          const move = (ev: MouseEvent) => {
            const dx = ev.clientX - startX
            const dy = ev.clientY - startY
            const next = { left: Math.max(0, Math.min(window.innerWidth - overlayWidth, start.left + dx)), top: Math.max(0, Math.min(window.innerHeight - 120, start.top + dy)) }
            setPos(next)
          }
          const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
          window.addEventListener('mousemove', move)
          window.addEventListener('mouseup', up)
        }}
      >
        <div style={{ fontWeight: 600 }}>Pick color</div>
        <button onClick={() => { setAnchor(null); setTargetVar(null) }} aria-label="Close" style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16 }}>&times;</button>
      </div>
      <div style={{ display: 'grid', gap: 6 }}>
        {Object.entries(options).map(([family, items]) => (
          <div key={family} style={{ display: 'grid', gridTemplateColumns: `${labelCol}px 1fr`, alignItems: 'center', gap: 6 }}>
            <div style={{ fontSize: 12, opacity: 0.8, textTransform: 'capitalize' }}>{getFriendly(family)}</div>
            <div style={{ display: 'flex', flexWrap: 'nowrap', gap, overflow: 'auto' }}>
              {items.map((it) => (
                <div 
                  key={it.name} 
                  title={it.name} 
                  onClick={() => handleSelect(it.name, it.value)} 
                  style={{ width: swatch, height: swatch, background: it.value, cursor: 'pointer', border: '1px solid rgba(0,0,0,0.15)', flex: '0 0 auto' }} 
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>,
    document.body
  )
}

