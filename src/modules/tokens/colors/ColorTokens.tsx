import { useEffect, useMemo, useState } from 'react'
import { iconNameToReactComponent } from '../../components/iconUtils'
import { useVars } from '../../vars/VarsContext'
import { getVarsStore } from '../../../core/store/varsStore'
import { removeCssVar } from '../../../core/css/updateCssVar'
import { ColorScale } from './ColorScale'
import { clamp, hsvToHex, hexToHsv, toTitleCase, toKebabCase } from './colorUtils'
import { cascadeColor, computeLevel500Hex, parseLevel, IDX_MAP, LEVELS_ASC } from './colorCascade'
import { getFriendlyNamePreferNtc, getNtcName } from '../../utils/colorNaming'
import { ColorPickerModal } from '../../pickers/ColorPickerModal'
import { useThemeMode } from '../../theme/ThemeModeContext'
import { Button } from '../../../components/adapters/Button'
import { parseTokenReference, type TokenReferenceContext } from '../../../core/utils/tokenReferenceParser'
import { buildTokenIndex } from '../../../core/resolvers/tokens'

type TokenEntry = {
  name: string
  type?: string
  value: string | number
}

type ModeName = 'Mode 1' | 'Mode 2' | string

export default function ColorTokens() {
  const { tokens: tokensJson, updateToken, setTokens, theme, palettes } = useVars()
  const { mode: themeMode } = useThemeMode()
  const [values, setValues] = useState<Record<string, string | number>>({})
  const [hoveredSwatch, setHoveredSwatch] = useState<string | null>(null)
  const [openPicker, setOpenPicker] = useState<{ tokenName: string; swatchRect: DOMRect } | null>(null)

  // Close picker when mode changes
  useEffect(() => {
    const handleCloseAll = () => {
      setOpenPicker(null)
    }
    window.addEventListener('closeAllPickersAndPanels', handleCloseAll)
    return () => window.removeEventListener('closeAllPickersAndPanels', handleCloseAll)
  }, [])
  const [deletedFamilies, setDeletedFamilies] = useState<Record<string, true>>({})
  const [familyNames, setFamilyNames] = useState<Record<string, string>>({})
  const [namesHydrated, setNamesHydrated] = useState(false)
  const [familyOrder, setFamilyOrder] = useState<string[]>([])
  const [showAddColorModal, setShowAddColorModal] = useState(false)
  const [pendingColorHex, setPendingColorHex] = useState<string>('var(--recursica-brand-themes-light-palettes-core-black)')

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

  const handleAddColor = () => {
    setOpenPicker(null)
    const families = Object.entries(colorFamiliesByMode['Mode 1'] || {}).filter(([family]) => family !== 'translucent' && !deletedFamilies[family])
    if (!families.length) return

    // Generate a random default color
    const baseHSV = { h: Math.random() * 360, s: 0.6 + Math.random() * 0.35, v: 0.6 + Math.random() * 0.35 }
    const seedHex = hsvToHex(baseHSV.h, Math.max(0.6, baseHSV.s), Math.max(0.6, baseHSV.v))
    
    // Show modal with default color
    setPendingColorHex(seedHex)
    setShowAddColorModal(true)
  }

  const createColorScale = async (seedHex: string) => {
    setOpenPicker(null)
    const families = Object.entries(colorFamiliesByMode['Mode 1'] || {}).filter(([family]) => family !== 'translucent' && !deletedFamilies[family])
    if (!families.length) return

    // Parse the seed hex to get HSV values for generating the scale
    const seedHsv = hexToHsv(seedHex)

    const newHue = seedHsv.h
    const tempFamily = `custom-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`
    const write = (name: string, hex: string) => { handleChange(name, hex) }
    write(`color/${tempFamily}/500`, seedHex)

    // Get friendly name and convert to slug
    const friendlyName = await getFriendlyNamePreferNtc(seedHex)
    const newFamilySlug = toKebabCase(friendlyName)
    
    // Generate all color levels with temporary family name first
    const seedS = seedHsv.s
    const seedV = seedHsv.v
    const endS000 = 0.02
    const endV000 = 0.98
    const endS1000 = clamp(seedS * 1.2, 0, 1)
    const endV1000 = clamp(Math.max(0.03, seedV * 0.08), 0, 1)
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t
    
    // Store all the hex values we're creating
    const tempTokenValues: Record<string, string> = {}
    LEVELS_ASC.forEach((lvl) => {
      const idx = IDX_MAP[lvl]
      let hex: string
      if (idx === 6) {
        hex = seedHex
      } else if (idx < 6) {
        const t = idx / 6
        const s = clamp(lerp(endS000, seedS, t), 0, 1)
        const v = clamp(lerp(endV000, seedV, t), 0, 1)
        hex = hsvToHex(newHue, s, v)
      } else {
        const t = (idx - 6) / (11 - 6)
        const s = clamp(lerp(seedS, endS1000, t), 0, 1)
        const v = clamp(lerp(seedV, endV1000, t), 0, 1)
        hex = hsvToHex(newHue, s, v)
      }
      const levelStr = String(lvl).padStart(3, '0')
      const tempTokenName = `color/${tempFamily}/${levelStr}`
      tempTokenValues[tempTokenName] = hex
      write(tempTokenName, hex)
    })

    // Now rename all tokens from tempFamily to newFamilySlug
    if (newFamilySlug && newFamilySlug !== tempFamily && newFamilySlug.length > 0) {
      // Wait for next tick to ensure all updateToken() calls have completed
      await new Promise(resolve => setTimeout(resolve, 0))
      
      try {
        // Read fresh tokens directly from the store (tokensJson prop might be stale due to React async updates)
        const store = getVarsStore()
        const currentState = store.getState()
        const currentTokens = currentState.tokens
        const nextTokens = JSON.parse(JSON.stringify(currentTokens)) as any
        const tokensRoot = nextTokens?.tokens || {}
        const colorsRoot = tokensRoot?.color || {}
        
        // Get all levels for the temp family
        const tempFamilyData = colorsRoot[tempFamily]
        if (tempFamilyData && typeof tempFamilyData === 'object') {
          // Create new family with all levels
          if (!tokensRoot.color) tokensRoot.color = {}
          tokensRoot.color[newFamilySlug] = { ...tempFamilyData }
          
          // Delete temp family
          delete tokensRoot.color[tempFamily]
          
          // Update tokens structure
          if (!nextTokens.tokens) nextTokens.tokens = tokensRoot
          setTokens(nextTokens)
          
          // Remove old CSS variables for the temp family
          Object.keys(tempTokenValues).forEach((tempTokenName) => {
            const parts = tempTokenName.split('/')
            if (parts.length === 3) {
              const level = parts[2]
              const levelStr = String(level).padStart(3, '0')
              const oldCssVar = `--recursica-tokens-color-${tempFamily}-${levelStr}`
              removeCssVar(oldCssVar)
            }
          })
          
          // Update local values state - rename all tokens
          // The tokens JSON structure is already updated above with setTokens(), which triggers recomputeAndApplyAll()
          // So we just need to update the local values state to match the new token names
          const newValues = { ...values }
          Object.keys(tempTokenValues).forEach((tempTokenName) => {
            const parts = tempTokenName.split('/')
            if (parts.length === 3) {
              const level = parts[2]
              const newTokenName = `color/${newFamilySlug}/${level}`
              // Use the value we stored when creating the token
              const value = tempTokenValues[tempTokenName]
              // Remove old temp token name
              delete newValues[tempTokenName]
              // Add new token name with the same value
              newValues[newTokenName] = value
            }
          })
          setValues(newValues)
          
          // Update family order - always append new family to the end, not sorted alphabetically
          setFamilyOrder((prev) => {
            const updated = prev.map(f => f === tempFamily ? newFamilySlug : f).filter(f => f !== tempFamily)
            // If newFamilySlug is not already in the order, append it to the end
            if (!updated.includes(newFamilySlug)) {
              return [...updated, newFamilySlug]
            }
            return updated
          })
          
          // Update family names map
          const updatedFamilyNames = { ...familyNames }
          delete updatedFamilyNames[tempFamily]
          updatedFamilyNames[newFamilySlug] = toTitleCase(friendlyName)
          setFamilyNames(updatedFamilyNames)
          
          // Update localStorage
          try {
            const raw = localStorage.getItem('family-friendly-names')
            const map = raw ? JSON.parse(raw) || {} : {}
            delete map[tempFamily]
            map[newFamilySlug] = toTitleCase(friendlyName)
            localStorage.setItem('family-friendly-names', JSON.stringify(map))
            try { window.dispatchEvent(new CustomEvent('familyNamesChanged', { detail: map })) } catch {}
          } catch {}
        } else {
          // Fallback: if rename failed, just update the display name
          setFamilyNames((prev) => ({ ...prev, [tempFamily]: toTitleCase(friendlyName) }))
          // Always append to end, not sorted alphabetically
          setFamilyOrder((prev) => (prev.includes(tempFamily) ? prev : [...prev, tempFamily]))
        }
      } catch (error) {
        console.error('Failed to rename color family after creation:', error)
        // Fallback: just update the display name
        setFamilyNames((prev) => ({ ...prev, [tempFamily]: toTitleCase(friendlyName) }))
        // Always append to end, not sorted alphabetically
        setFamilyOrder((prev) => (prev.includes(tempFamily) ? prev : [...prev, tempFamily]))
      }
    } else {
      // If slug generation failed, just use temp name with friendly display name
      setFamilyNames((prev) => ({ ...prev, [tempFamily]: toTitleCase(friendlyName) }))
      // Always append to end, not sorted alphabetically
      setFamilyOrder((prev) => (prev.includes(tempFamily) ? prev : [...prev, tempFamily]))
    }
  }

  // Check if a color scale is used in palettes
  const isColorScaleUsedInPalettes = useMemo(() => {
    const mapPaletteToTokenFamily: Record<string, string> = {
      neutral: 'gray',
      'palette-1': 'salmon',
      'palette-2': 'mandarin',
      'palette-3': 'cornflower',
      'palette-4': 'greensheen',
    }
    
    const usedFamilies = new Set<string>()
    
    // Helper function to get persisted family from localStorage
    const getPersistedFamily = (key: string): string | undefined => {
      try {
        const raw = localStorage.getItem(`palette-grid-family:${key}`)
        if (raw) return JSON.parse(raw)
      } catch {}
      if (key === 'neutral') return 'gray'
      if (key === 'palette-1') return 'salmon'
      if (key === 'palette-2') return 'mandarin'
      return undefined
    }
    
    // Check dynamic palettes from palettesState
    try {
      const dynamicPalettes = palettes?.dynamic || []
      dynamicPalettes.forEach((p) => {
        const fam = p.initialFamily || getPersistedFamily(p.key)
        if (fam) {
          usedFamilies.add(fam)
        }
      })
    } catch {}
    
    // Check which palettes actually exist in theme and add their mapped families
    try {
      const root: any = (theme as any)?.brand ? (theme as any).brand : theme
      const lightPalettes: any = root?.light?.palettes || {}
      const paletteKeys = Object.keys(lightPalettes).filter((k) => k !== 'core')
      
      // Only add families for palettes that actually exist
      paletteKeys.forEach((pk) => {
        const mappedFamily = mapPaletteToTokenFamily[pk]
        if (mappedFamily) {
          usedFamilies.add(mappedFamily)
        }
      })
      
      // Also check for direct token references in non-core palettes
      // Extract all family names referenced in specific palette sections (excluding core)
      const extractReferencedFamilies = (obj: any): Set<string> => {
        const families = new Set<string>()
        if (!obj || typeof obj !== 'object') return families
        
        if (Array.isArray(obj)) {
          obj.forEach((item) => {
            extractReferencedFamilies(item).forEach((f) => families.add(f))
          })
          return families
        }
        
        for (const [, value] of Object.entries(obj)) {
          if (typeof value === 'string') {
            // Use centralized parser to check for token references
            const tokenIndex = buildTokenIndex(tokensJson)
            const context: TokenReferenceContext = { currentMode: 'light', tokenIndex }
            const parsed = parseTokenReference(value, context)
            if (parsed && parsed.type === 'token' && parsed.path.length >= 2 && parsed.path[0] === 'color') {
              // Extract family name from token path (e.g., color/gray/100 -> gray)
              const familyName = parsed.path[1]
              if (familyName) {
                families.add(familyName)
              }
            }
          } else if (value && typeof value === 'object') {
            extractReferencedFamilies(value).forEach((f) => families.add(f))
          }
        }
        return families
      }
      
      // Check each palette individually (excluding core)
      paletteKeys.forEach((pk) => {
        const paletteData = lightPalettes[pk]
        if (paletteData) {
          const referencedFamilies = extractReferencedFamilies(paletteData)
          referencedFamilies.forEach((fam) => {
            if (fam !== 'translucent') {
              usedFamilies.add(fam)
            }
          })
        }
      })
      
      // Check core colors - extract all families used in core palette
      const corePalette: any = lightPalettes?.core || {}
      const coreReferencedFamilies = extractReferencedFamilies(corePalette)
      coreReferencedFamilies.forEach((fam) => {
        if (fam !== 'translucent') {
          usedFamilies.add(fam)
        }
      })
    } catch {}
    
    return (family: string) => usedFamilies.has(family)
  }, [theme, tokensJson, palettes])

  // Count total color scales (excluding deleted ones)
  const totalColorScales = useMemo(() => {
    try {
      const tokensRoot: any = (tokensJson as any)?.tokens || {}
      const colorsRoot = tokensRoot?.color || {}
      return Object.keys(colorsRoot).filter((fam) => fam !== 'translucent' && !deletedFamilies[fam]).length
    } catch {
      return 0
    }
  }, [tokensJson, deletedFamilies])

  const handleDeleteFamily = (family: string) => {
    try {
      // Deep clone tokens to avoid mutation
      const nextTokens = JSON.parse(JSON.stringify(tokensJson)) as any
      const tokensRoot = nextTokens?.tokens || {}
      const colorsRoot = tokensRoot?.color || {}
      
      // Delete the color family from tokens
      if (colorsRoot[family]) {
        delete colorsRoot[family]
        setTokens(nextTokens)
      }
      
      // Remove all CSS variables for this color family
      const root = document.documentElement
      const style = root.style
      const cssVarsToRemove: string[] = []
      
      // Collect all CSS variables for this color family from inline styles
      // Iterate backwards to avoid index shifting issues
      for (let i = style.length - 1; i >= 0; i--) {
        const prop = style[i]
        if (prop && prop.startsWith(`--recursica-tokens-color-${family}-`)) {
          cssVarsToRemove.push(prop)
        }
      }
      
      // Remove all CSS variables
      cssVarsToRemove.forEach(prop => root.style.removeProperty(prop))
      
      // Update local values state - remove all tokens for this family
      const newValues = { ...values }
      Object.keys(newValues).forEach((tokenName) => {
        if (tokenName.startsWith(`color/${family}/`)) {
          delete newValues[tokenName]
        }
      })
      setValues(newValues)
      
      // Mark as deleted and update order
      setDeletedFamilies((prev) => ({ ...prev, [family]: true }))
      setOpenPicker(null)
      setFamilyOrder((prev) => prev.filter((f) => f !== family))
      
      // Update localStorage for deleted families
      try {
        const updatedDeleted = { ...deletedFamilies, [family]: true }
        localStorage.setItem('deleted-color-families', JSON.stringify(updatedDeleted))
      } catch {}
    } catch (error) {
      console.error('Failed to delete color family:', error)
    }
  }

  const handleFamilyNameChange = (family: string, newName: string) => {
    const v = toTitleCase(newName)
    const newFamilySlug = toKebabCase(newName)
    
    // If the slug differs from the current family key, rename all tokens
    if (newFamilySlug && newFamilySlug !== family && newFamilySlug.length > 0) {
      try {
        // Deep clone tokens to avoid mutation
        const nextTokens = JSON.parse(JSON.stringify(tokensJson)) as any
        const tokensRoot = nextTokens?.tokens || {}
        const colorsRoot = tokensRoot?.color || {}
        
        // Get all levels for the old family
        const oldFamilyData = colorsRoot[family]
        if (oldFamilyData && typeof oldFamilyData === 'object') {
          // Create new family with all levels
          if (!tokensRoot.color) tokensRoot.color = {}
          tokensRoot.color[newFamilySlug] = { ...oldFamilyData }
          
          // Delete old family
          delete tokensRoot.color[family]
          
          // Update tokens structure
          if (!nextTokens.tokens) nextTokens.tokens = tokensRoot
          setTokens(nextTokens)
          
          // Update local values state
          const oldTokenNames = Object.keys(values).filter(name => name.startsWith(`color/${family}/`))
          const newValues = { ...values }
          oldTokenNames.forEach(oldTokenName => {
            const parts = oldTokenName.split('/')
            if (parts.length === 3) {
              const level = parts[2]
              const newTokenName = `color/${newFamilySlug}/${level}`
              const value = values[oldTokenName]
              delete newValues[oldTokenName]
              newValues[newTokenName] = value
            }
          })
          setValues(newValues)
          
          // Update family order
          setFamilyOrder((prev) => prev.map(f => f === family ? newFamilySlug : f))
          
          // Update deleted families if needed
          if (deletedFamilies[family]) {
            setDeletedFamilies((prev) => {
              const next = { ...prev }
              delete next[family]
              next[newFamilySlug] = true
              return next
            })
          }
          
          // Update family names map
          const updatedFamilyNames = { ...familyNames }
          delete updatedFamilyNames[family]
          updatedFamilyNames[newFamilySlug] = v
          setFamilyNames(updatedFamilyNames)
          
          // Update localStorage
          try {
            const raw = localStorage.getItem('family-friendly-names')
            const map = raw ? JSON.parse(raw) || {} : {}
            delete map[family]
            map[newFamilySlug] = v
            localStorage.setItem('family-friendly-names', JSON.stringify(map))
            try { window.dispatchEvent(new CustomEvent('familyNamesChanged', { detail: map })) } catch {}
          } catch {}
          
          // Close picker if open for this family
          if (openPicker && openPicker.tokenName.startsWith(`color/${family}/`)) {
            setOpenPicker(null)
          }
          
          return // Early return since we've handled the rename
        }
      } catch (error) {
        console.error('Failed to rename color family:', error)
      }
    }
    
    // If slug matches or rename failed, just update the display name
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
    const newName = toTitleCase(label)
    // Update the display name
    setFamilyNames((prev) => ({ ...prev, [family]: newName }))
    // Immediately trigger the rename logic (like on blur) to handle slug changes
    handleFamilyNameChange(family, newName)
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
  // Include 1000 and 000 in standard levels
  const standardLevels = ['1000', '900', '800', '700', '600', '500', '400', '300', '200', '100', '050', '000']
  standardLevels.forEach((lvl) => presentLevels.add(lvl))
  const levelOrder = Array.from(presentLevels).sort((a, b) => {
    // Handle 000 specially - it should be last
    if (a === '000') return 1
    if (b === '000') return -1
    return Number(b) - Number(a)
  })

  const layer0Base = `--recursica-brand-${themeMode}-layer-layer-0-property`
  const layer1Base = `--recursica-brand-${themeMode}-layer-layer-1-property`
  const interactiveColor = `--recursica-brand-${themeMode}-palettes-core-interactive`

  return (
    <section style={{ 
      background: `var(${layer0Base}-surface)`, 
      border: `1px solid var(${layer1Base}-border-color)`, 
      borderRadius: 'var(--recursica-brand-dimensions-border-radius-default)', 
      padding: 'var(--recursica-brand-dimensions-spacer-md)',
    }}>
      {/* Header with Add Color Scale button */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 'var(--recursica-brand-dimensions-spacer-md)',
      }}>
        <div style={{ flex: 1 }} /> {/* Spacer */}
        <Button
          variant="outline"
          onClick={handleAddColor}
          icon={(() => {
            const PlusIcon = iconNameToReactComponent('plus')
            return PlusIcon ? <PlusIcon style={{ width: 'var(--recursica-brand-dimensions-icon-default)', height: 'var(--recursica-brand-dimensions-icon-default)' }} /> : null
          })()}
          style={{
            borderColor: `var(${interactiveColor})`,
            color: `var(${interactiveColor})`,
          }}
        >
          Add color scale
        </Button>
      </div>

      {/* Color scales grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: `100px repeat(${families.length}, 1fr)`, 
        columnGap: 'var(--recursica-brand-dimensions-spacer-md)', 
        rowGap: 0, 
        alignItems: 'start' 
      }}>
        {/* Numerical scale column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div style={{ height: 40, marginBottom: 'var(--recursica-brand-dimensions-spacer-sm)' }} /> {/* Spacer for header */}
          {levelOrder.map((level) => (
            <div 
              key={'label-' + level} 
              style={{ 
                textAlign: 'center', 
                fontSize: 'var(--recursica-brand-typography-caption-font-size)', 
                color: `var(${layer0Base}-element-text-color)`,
                opacity: `var(${layer0Base}-element-text-low-emphasis)`,
                height: 40, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}
            >
              {level}
            </div>
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
            isUsedInPalettes={isColorScaleUsedInPalettes(family)}
            isLastColorScale={totalColorScales <= 1}
          />
        ))}
      </div>
      <ColorPickerModal
        open={showAddColorModal}
        defaultHex={pendingColorHex}
        onClose={() => setShowAddColorModal(false)}
        onAccept={(hex) => {
          setShowAddColorModal(false)
          createColorScale(hex)
        }}
      />
    </section>
  )
}

