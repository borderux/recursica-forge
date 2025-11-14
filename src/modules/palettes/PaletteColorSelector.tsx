import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useVars } from '../vars/VarsContext'
import { readOverrides } from '../theme/tokenOverrides'
import { contrastRatio, hexToRgb } from '../theme/contrastUtil'
import { updateCssVar } from '../../core/css/updateCssVar'
import { readCssVar, readCssVarNumber } from '../../core/css/readCssVar'

type PaletteColorSelectorProps = {
  paletteKey: string
  mode: 'Light' | 'Dark'
  primaryLevel: string
  headerLevels: string[]
  onFamilyChange?: (family: string) => void
}

// Blend a foreground color over a background color with opacity
function blendHexOver(fgHex: string, bgHex: string, opacity: number): string {
  const fg = hexToRgb(fgHex)
  const bg = hexToRgb(bgHex)
  if (!fg || !bg) return fgHex
  const a = Math.max(0, Math.min(1, opacity))
  const r = Math.round(a * fg.r + (1 - a) * bg.r)
  const g = Math.round(a * fg.g + (1 - a) * bg.g)
  const b = Math.round(a * fg.b + (1 - a) * bg.b)
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`
}

// readCssVarNumber is now imported from centralized utility

// Determine the correct on-tone color (white or black) considering opacity for AA compliance
function pickOnToneWithOpacity(toneHex: string, modeLabel: 'Light' | 'Dark'): 'white' | 'black' {
  const AA = 4.5
  const black = '#000000'
  const white = '#ffffff'
  const modeLower = modeLabel.toLowerCase()
  
  // First, check contrast without opacity (baseline)
  const whiteBaseContrast = contrastRatio(toneHex, white)
  const blackBaseContrast = contrastRatio(toneHex, black)
  
  // Get emphasis opacity values from CSS variables
  const highEmphasisOpacity = readCssVarNumber(`--recursica-brand-${modeLower}-text-emphasis-high`)
  const lowEmphasisOpacity = readCssVarNumber(`--recursica-brand-${modeLower}-text-emphasis-low`)
  
  // Blend white and black with tone using both opacity values
  const whiteHighBlended = blendHexOver(white, toneHex, highEmphasisOpacity)
  const whiteLowBlended = blendHexOver(white, toneHex, lowEmphasisOpacity)
  const blackHighBlended = blendHexOver(black, toneHex, highEmphasisOpacity)
  const blackLowBlended = blendHexOver(black, toneHex, lowEmphasisOpacity)
  
  // Calculate contrast ratios with opacity applied
  const whiteHighContrast = contrastRatio(toneHex, whiteHighBlended)
  const whiteLowContrast = contrastRatio(toneHex, whiteLowBlended)
  const blackHighContrast = contrastRatio(toneHex, blackHighBlended)
  const blackLowContrast = contrastRatio(toneHex, blackLowBlended)
  
  // Check which option meets AA for both emphasis levels
  const whiteMeetsHighAA = whiteHighContrast >= AA
  const whiteMeetsLowAA = whiteLowContrast >= AA
  const whiteMeetsBothAA = whiteMeetsHighAA && whiteMeetsLowAA
  
  const blackMeetsHighAA = blackHighContrast >= AA
  const blackMeetsLowAA = blackLowContrast >= AA
  const blackMeetsBothAA = blackMeetsHighAA && blackMeetsLowAA
  
  // Priority 1: Both meet AA - choose based on baseline contrast first
  if (whiteMeetsBothAA && blackMeetsBothAA) {
    if (Math.abs(whiteBaseContrast - blackBaseContrast) > 1.0) {
      return whiteBaseContrast >= blackBaseContrast ? 'white' : 'black'
    }
    return whiteLowContrast >= blackLowContrast ? 'white' : 'black'
  }
  
  // Priority 2: Only one meets both AA levels
  if (whiteMeetsBothAA) return 'white'
  if (blackMeetsBothAA) return 'black'
  
  // Priority 3: Check low emphasis (harder case) - prioritize this
  if (whiteMeetsLowAA && !blackMeetsLowAA) return 'white'
  if (blackMeetsLowAA && !whiteMeetsLowAA) return 'black'
  
  // Priority 4: Check high emphasis
  if (whiteMeetsHighAA && !blackMeetsHighAA) return 'white'
  if (blackMeetsHighAA && !whiteMeetsHighAA) return 'black'
  
  // Priority 5: Neither meets AA - choose based on baseline contrast
  if (Math.abs(whiteBaseContrast - blackBaseContrast) > 0.5) {
    return whiteBaseContrast >= blackBaseContrast ? 'white' : 'black'
  }
  return whiteLowContrast >= blackLowContrast ? 'white' : 'black'
}

export default function PaletteColorSelector({
  paletteKey,
  mode,
  primaryLevel,
  headerLevels,
  onFamilyChange,
}: PaletteColorSelectorProps) {
  const { tokens: tokensJson, theme: themeJson, setTheme } = useVars()
  const [overrideVersion, setOverrideVersion] = useState(0)

  // Detect which families are used by which palettes from theme JSON
  const familiesUsedByPalettes = useMemo(() => {
    const usedBy: Record<string, string> = {} // paletteKey -> family
    const themeIndex: Record<string, { value: any }> = {}
    
    const visit = (node: any, prefix: string, modeLabel: 'Light' | 'Dark') => {
      if (!node || typeof node !== 'object') return
      if (Object.prototype.hasOwnProperty.call(node, '$value')) {
        themeIndex[`${modeLabel}::${prefix}`] = { value: (node as any)['$value'] }
        return
      }
      Object.keys(node).forEach((k) => visit((node as any)[k], prefix ? `${prefix}/${k}` : k, modeLabel))
    }
    
    const root: any = (themeJson as any)?.brand ? (themeJson as any).brand : themeJson
    // Support both old structure (brand.light.*) and new structure (brand.themes.light.*)
    const themes = root?.themes || root
    // Use 'palette' prefix (singular) to match resolver's buildThemeIndex
    if (themes?.light?.palettes) visit(themes.light.palettes, 'palette', 'Light')
    if (themes?.dark?.palettes) visit(themes.dark.palettes, 'palette', 'Dark')
    // Also support old structure for backward compatibility
    if (root?.light?.palettes) visit(root.light.palettes, 'palette', 'Light')
    if (root?.dark?.palettes) visit(root.dark.palettes, 'palette', 'Dark')
    
    // Check all palettes in theme to see which families they use
    const checkLevels = ['200', '500', '400', '300']
    const paletteKeys = new Set<string>()
    
    // First, find all palette keys
    // Note: theme index uses 'palette' prefix (singular) to match resolver
    Object.keys(themeIndex).forEach((key) => {
      const match = key.match(/^(?:Light|Dark)::palette\/([^/]+)\//)
      if (match && match[1]) {
        paletteKeys.add(match[1])
      }
    })
    
    // Then detect family for each palette
    // Note: theme index uses 'palette' prefix (singular) to match resolver
    for (const pk of paletteKeys) {
      for (const lvl of checkLevels) {
        const toneName = `palette/${pk}/${lvl}/color/tone`
        const toneRaw = themeIndex[`Light::${toneName}`]?.value || themeIndex[`Dark::${toneName}`]?.value
        if (typeof toneRaw === 'string') {
          const match = toneRaw.match(/\{tokens\.color\.([a-z0-9_-]+)\./)
          if (match && match[1]) {
            usedBy[pk] = match[1]
            break // Found family for this palette, move to next
          }
        }
      }
    }
    
    return usedBy
  }, [themeJson])

  // Get available color families
  const allFamilies = useMemo(() => {
    const fams = new Set<string>(Object.keys((tokensJson as any)?.tokens?.color || {}))
    try {
      const overrides = readOverrides() as Record<string, any>
      Object.keys(overrides || {}).forEach((name) => {
        if (typeof name !== 'string') return
        if (!name.startsWith('color/')) return
        const parts = name.split('/')
        const fam = parts[1]
        if (fam && fam !== 'translucent') fams.add(fam)
      })
    } catch {}
    fams.delete('translucent')
    const list = Array.from(fams)
    list.sort((a, b) => {
      if (a === 'gray' && b !== 'gray') return -1
      if (b === 'gray' && a !== 'gray') return 1
      return a.localeCompare(b)
    })
    return list
  }, [tokensJson, overrideVersion])

  // Filter families to exclude those used by other palettes
  const families = useMemo(() => {
    const familiesUsedByOthers = new Set<string>()
    Object.entries(familiesUsedByPalettes).forEach(([pk, fam]) => {
      if (pk !== paletteKey) {
        familiesUsedByOthers.add(fam)
      }
    })
    
    return allFamilies.filter((fam) => {
      // Include if not used by others, or if it's the current palette's family
      return !familiesUsedByOthers.has(fam) || familiesUsedByPalettes[paletteKey] === fam
    })
  }, [allFamilies, familiesUsedByPalettes, paletteKey])

  // Get token value by name - memoize to prevent unnecessary recalculations
  const getTokenValueByName = useCallback((tokenName: string): string | number | undefined => {
    const parts = tokenName.split('/')
    if (parts[0] === 'color' && parts.length >= 3) {
      const family = parts[1]
      const level = parts[2]
      const overrideMap = readOverrides()
      if ((overrideMap as any)[tokenName]) return (overrideMap as any)[tokenName]
      return (tokensJson as any)?.tokens?.color?.[family]?.[level]?.$value
    }
    return undefined
  }, [tokensJson, overrideVersion])

  // Detect current family from theme (use the already computed familiesUsedByPalettes)
  const detectFamilyFromTheme = useMemo(() => {
    return familiesUsedByPalettes[paletteKey] || null
  }, [familiesUsedByPalettes, paletteKey])

  const [selectedFamily, setSelectedFamily] = useState<string>(() => {
    const detected = detectFamilyFromTheme
    if (detected) return detected
    return families[0] || ''
  })

  // Sync selectedFamily when theme changes (but don't update CSS vars here)
  useEffect(() => {
    const detected = detectFamilyFromTheme
    if (detected && detected !== selectedFamily) {
      setSelectedFamily(detected)
    }
  }, [detectFamilyFromTheme])

  // Re-check AA compliance for a palette when token values change
  const recheckAACompliance = useCallback((family: string) => {
    if (family !== selectedFamily) return
    
    const rootEl = document.documentElement
    const modeLower = mode.toLowerCase()
    
    headerLevels.forEach((lvl) => {
      const tokenName = `color/${family}/${lvl}`
      const hex = getTokenValueByName(tokenName)
      if (typeof hex === 'string') {
        // Re-check AA compliance and update on-tone if needed
        const onToneCore = pickOnToneWithOpacity(hex, mode)
        updateCssVar(
          `--recursica-brand-${modeLower}-palettes-${paletteKey}-${lvl}-on-tone`,
          `var(--recursica-brand-${modeLower}-palettes-core-${onToneCore})`
        )
      }
    })
    
    // Also update theme JSON for both modes to persist the new on-tone values
    if (setTheme && themeJson) {
      try {
        const themeCopy = JSON.parse(JSON.stringify(themeJson))
        const root: any = themeCopy?.brand ? themeCopy.brand : themeCopy
        
        for (const modeKey of ['light', 'dark']) {
          const modeLabel = modeKey === 'light' ? 'Light' : 'Dark'
          if (!root[modeKey]?.palettes?.[paletteKey]) continue
          
          headerLevels.forEach((lvl) => {
            const tokenName = `color/${family}/${lvl}`
            const hex = getTokenValueByName(tokenName)
            if (typeof hex === 'string') {
              const onToneCore = pickOnToneWithOpacity(hex, modeLabel)
              if (!root[modeKey].palettes[paletteKey][lvl]) root[modeKey].palettes[paletteKey][lvl] = {}
              root[modeKey].palettes[paletteKey][lvl]['on-tone'] = {
                $value: `{brand.${modeKey}.palettes.core-colors.${onToneCore}}`
              }
            }
          })
        }
        
        setTheme(themeCopy)
      } catch (err) {
        console.error('Failed to update theme for AA compliance:', err)
      }
    }
  }, [selectedFamily, mode, paletteKey, headerLevels, getTokenValueByName, setTheme, themeJson])

  useEffect(() => {
    const handler = (ev: Event) => {
      const detail: any = (ev as CustomEvent).detail
      if (!detail) {
        setOverrideVersion((v) => v + 1)
        return
      }
      
      // Check if a color token was changed
      const tokenName = detail.name
      if (tokenName && typeof tokenName === 'string' && tokenName.startsWith('color/')) {
        const parts = tokenName.split('/')
        if (parts.length >= 3) {
          const changedFamily = parts[1]
          // If this palette uses the changed family, re-check AA compliance
          if (selectedFamily === changedFamily) {
            recheckAACompliance(changedFamily)
          }
        }
      }
      
      setOverrideVersion((v) => v + 1)
    }
    window.addEventListener('tokenOverridesChanged', handler as any)
    return () => window.removeEventListener('tokenOverridesChanged', handler as any)
  }, [selectedFamily, recheckAACompliance])

  // Set CSS vars only on mount and when mode changes (not when selectedFamily changes from theme)
  // Use a ref to track if we've initialized to avoid unnecessary updates
  const hasInitialized = useRef(false)
  useEffect(() => {
    if (!selectedFamily) return
    
    const rootEl = document.documentElement
    const modeLower = mode.toLowerCase()
    headerLevels.forEach((lvl) => {
      const tokenName = `color/${selectedFamily}/${lvl}`
      const hex = getTokenValueByName(tokenName)
      if (typeof hex === 'string') {
        // Set tone CSS variable - only for this specific palette
        updateCssVar(
          `--recursica-brand-${modeLower}-palettes-${paletteKey}-${lvl}-tone`,
          `var(--recursica-tokens-${tokenName.replace(/\//g, '-')})`
        )
        
        // Determine on-tone color considering opacity for AA compliance - only for this palette
        const onToneCore = pickOnToneWithOpacity(hex, mode)
        updateCssVar(
          `--recursica-brand-${modeLower}-palettes-${paletteKey}-${lvl}-on-tone`,
          `var(--recursica-brand-${modeLower}-palettes-core-${onToneCore})`
        )
      }
    })
    hasInitialized.current = true
    // Only depend on mode and paletteKey, not selectedFamily - CSS vars are set via updatePaletteForFamily
  }, [mode, paletteKey, headerLevels, getTokenValueByName])

  // Update theme JSON and CSS variables when family changes
  const updatePaletteForFamily = (family: string) => {
    if (!setTheme || !themeJson) return

    try {
      const themeCopy = JSON.parse(JSON.stringify(themeJson))
      const root: any = themeCopy?.brand ? themeCopy.brand : themeCopy
      // Support both old structure (brand.light.*) and new structure (brand.themes.light.*)
      const themes = root?.themes || root
      
      // Update for both light and dark modes
      for (const modeKey of ['light', 'dark']) {
        const modeLabel = modeKey === 'light' ? 'Light' : 'Dark'
        // Use themes structure if available, otherwise fall back to root structure
        const targetRoot = themes !== root ? themes : root
        if (!targetRoot[modeKey]) targetRoot[modeKey] = {}
        if (!targetRoot[modeKey].palettes) targetRoot[modeKey].palettes = {}
        if (!targetRoot[modeKey].palettes[paletteKey]) targetRoot[modeKey].palettes[paletteKey] = {}
        
        headerLevels.forEach((lvl) => {
          if (!targetRoot[modeKey].palettes[paletteKey][lvl]) targetRoot[modeKey].palettes[paletteKey][lvl] = {}
          if (!targetRoot[modeKey].palettes[paletteKey][lvl].color) targetRoot[modeKey].palettes[paletteKey][lvl].color = {}
          
          // Update tone to reference the new family token
          targetRoot[modeKey].palettes[paletteKey][lvl].color.tone = {
            $value: `{tokens.color.${family}.${lvl}}`
          }
          
          // Determine on-tone color considering opacity for AA compliance
          const tokenName = `color/${family}/${lvl}`
          const hex = getTokenValueByName(tokenName)
          if (typeof hex === 'string') {
            const onToneCore = pickOnToneWithOpacity(hex, modeLabel)
            // Update on-tone to reference the correct core color (white or black)
            // Use themes structure in reference if available
            const refPrefix = themes !== root ? 'brand.themes' : 'brand'
            targetRoot[modeKey].palettes[paletteKey][lvl]['on-tone'] = {
              $value: `{${refPrefix}.${modeKey}.palettes.core-colors.${onToneCore}}`
            }
          }
        })
      }
      
      // Update CSS variables FIRST (before setTheme) to avoid flicker
      // This ensures CSS vars are set before theme update triggers re-renders
      const modeLower = mode.toLowerCase()
      headerLevels.forEach((lvl) => {
        const tokenName = `color/${family}/${lvl}`
        const hex = getTokenValueByName(tokenName)
        if (typeof hex === 'string') {
          // Set tone CSS variable - only for this specific palette
          updateCssVar(
            `--recursica-brand-${modeLower}-palettes-${paletteKey}-${lvl}-tone`,
            `var(--recursica-tokens-${tokenName.replace(/\//g, '-')})`
          )
          
          // Determine on-tone color considering opacity for AA compliance - only for this palette
          const onToneCore = pickOnToneWithOpacity(hex, mode)
          updateCssVar(
            `--recursica-brand-${modeLower}-palettes-${paletteKey}-${lvl}-on-tone`,
            `var(--recursica-brand-${modeLower}-palettes-core-${onToneCore})`
          )
        }
      })
      
      // Update theme AFTER CSS vars are set to minimize flicker
      // Other palettes will re-render but CSS vars are already correct
      setTheme(themeCopy)
      
      // Call optional callback
      onFamilyChange?.(family)
    } catch (err) {
      console.error('Failed to update palette for family:', err)
    }
  }

  const handleFamilySelect = (family: string) => {
    if (family !== selectedFamily) {
      setSelectedFamily(family)
      updatePaletteForFamily(family)
    }
  }

  return (
    <FamilyDropdown
      paletteKey={paletteKey}
      families={families}
      selectedFamily={selectedFamily}
      onSelect={handleFamilySelect}
      getSwatchHex={(fam) => {
        return getTokenValueByName(`color/${fam}/${primaryLevel}`) as string | undefined
      }}
    />
  )
}

// FamilyDropdown component
function FamilyDropdown({
  paletteKey,
  families,
  selectedFamily,
  onSelect,
  getSwatchHex,
}: {
  paletteKey: string
  families: string[]
  selectedFamily: string
  onSelect: (fam: string) => void
  getSwatchHex: (fam: string) => string | undefined
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)
  const [tokenVersion, setTokenVersion] = useState(0)
  
  let ntcReadyPromise: Promise<void> | null = null
  function ensureNtcLoaded(): Promise<void> {
    if ((window as any).ntc) return Promise.resolve()
    if (ntcReadyPromise) return ntcReadyPromise
    ntcReadyPromise = new Promise<void>((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://chir.ag/projects/ntc/ntc.js'
      s.async = true
      s.onload = () => resolve()
      s.onerror = () => reject(new Error('Failed to load ntc.js'))
      document.head.appendChild(s)
    })
    return ntcReadyPromise
  }
  
  async function getNtcName(hex: string): Promise<string | null> {
    try {
      await ensureNtcLoaded()
      const res = (window as any).ntc?.name?.(hex)
      if (Array.isArray(res) && typeof res[1] === 'string' && res[1]) return res[1]
    } catch {}
    return null
  }
  
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current) return
      if (!ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])
  
  useEffect(() => {
    const handler = () => setTokenVersion((v) => v + 1)
    window.addEventListener('tokenOverridesChanged', handler as any)
    window.addEventListener('familyNamesChanged', handler as any)
    return () => {
      window.removeEventListener('tokenOverridesChanged', handler as any)
      window.removeEventListener('familyNamesChanged', handler as any)
    }
  }, [])
  
  useEffect(() => {
    (async () => {
      try {
        const raw = localStorage.getItem('family-friendly-names')
        const map = raw ? JSON.parse(raw || '{}') || {} : {}
        let changed = false
        for (const fam of families) {
          if (map[fam]) continue
          const hex = getSwatchHex(fam)
          if (typeof hex === 'string' && /^#?[0-9a-fA-F]{6}$/.test(hex.trim())) {
            const normalized = hex.startsWith('#') ? hex : `#${hex}`
            const label = await getNtcName(normalized)
            if (label && label.trim()) {
              map[fam] = label.trim()
              changed = true
            }
          }
        }
        if (changed) {
          try { localStorage.setItem('family-friendly-names', JSON.stringify(map)) } catch {}
          try { window.dispatchEvent(new CustomEvent('familyNamesChanged', { detail: map })) } catch {}
          setTokenVersion((v) => v + 1)
        }
      } catch {}
    })()
  }, [families, getSwatchHex])
  
  const titleCase = (s: string) => (s || '').replace(/[-_/]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()).trim()
  
  const getFriendlyName = (family: string): string => {
    try {
      const raw = localStorage.getItem('family-friendly-names')
      if (raw) {
        const map = JSON.parse(raw)
        const v = map?.[family]
        if (typeof v === 'string' && v.trim()) return v
      }
    } catch {}
    return titleCase(family)
  }
  
  const currentHex = getSwatchHex(selectedFamily)
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} data-token-version={tokenVersion}>
      <label htmlFor={`family-${paletteKey}`} style={{ fontSize: 12, opacity: 0.8 }}>Color Token</label>
      <div ref={ref} style={{ position: 'relative' }}>
        <button
          id={`family-${paletteKey}`}
          type="button"
          onClick={() => setOpen((v) => !v)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 10px', border: '1px solid var(--layer-layer-1-property-border-color)', background: 'transparent', borderRadius: 6, cursor: 'pointer', minWidth: 160, justifyContent: 'space-between' }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span aria-hidden style={{ width: 14, height: 14, borderRadius: 3, border: '1px solid rgba(0,0,0,0.15)', background: currentHex || 'transparent' }} />
            <span>{getFriendlyName(selectedFamily)}</span>
          </span>
          <span aria-hidden style={{ opacity: 0.6 }}>▾</span>
        </button>
        {open && (
          <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 1200, background: 'var(--layer-layer-0-property-surface, #ffffff)', border: '1px solid var(--layer-layer-1-property-border-color, rgba(0,0,0,0.1))', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', padding: 6, minWidth: 200 }}>
            <div style={{ maxHeight: 280, overflow: 'auto', display: 'grid' }}>
              {families.map((fam) => {
                const hex = getSwatchHex(fam)
                return (
                  <button
                    key={fam}
                    onClick={() => { onSelect(fam); setOpen(false) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer' }}
                  >
                    <span aria-hidden style={{ width: 14, height: 14, borderRadius: 3, border: '1px solid rgba(0,0,0,0.15)', background: hex || 'transparent' }} />
                    <span>{getFriendlyName(fam)}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

