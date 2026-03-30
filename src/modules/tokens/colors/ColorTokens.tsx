import { useEffect, useMemo, useState } from 'react'
import { iconNameToReactComponent } from '../../components/iconUtils'
import { useVars } from '../../vars/VarsContext'
import { getVarsStore } from '../../../core/store/varsStore'
import { removeCssVar } from '../../../core/css/updateCssVar'
import { tokenColor, tokenColors, layerProperty, layerText } from '../../../core/css/cssVarBuilder'
import { ColorScale } from './ColorScale'
import { clamp, hsvToHex, hexToHsv, toTitleCase, toKebabCase } from './colorUtils'
import { cascadeColor, computeLevel500Hex, parseLevel, IDX_MAP, LEVELS_ASC } from './colorCascade'
import { getFriendlyNamePreferNtc, getNtcName } from '../../utils/colorNaming'
import { ColorPickerModal } from '../../pickers/ColorPickerModal'
import { useThemeMode } from '../../theme/ThemeModeContext'
import { Button } from '../../../components/adapters/Button'
import { TextField } from '../../../components/adapters/TextField'
import { parseTokenReference, type TokenReferenceContext } from '../../../core/utils/tokenReferenceParser'
import { buildTokenIndex } from '../../../core/resolvers/tokens'
import { getAllFamilyNames, setFamilyNameByAlias, renameFamilyName } from '../../../core/utils/familyNames'

type TokenEntry = {
  name: string
  type?: string
  value: string | number
}

type ModeName = 'Mode 1' | 'Mode 2' | string

// Export AddButton component for use in header
export function AddColorScaleButton() {
  const { mode: themeMode } = useThemeMode()
  const [showAddColorModal, setShowAddColorModal] = useState(false)
  const [pendingColorHex, setPendingColorHex] = useState<string>('var(--recursica_brand_palettes_core_black)')
  const { setTokens } = useVars()

  const handleAddColor = () => {
    // Generate a random default color
    const baseHSV = { h: Math.random() * 360, s: 0.6 + Math.random() * 0.35, v: 0.6 + Math.random() * 0.35 }
    const seedHex = hsvToHex(baseHSV.h, Math.max(0.6, baseHSV.s), Math.max(0.6, baseHSV.v))

    // Close any open color pickers before opening the modal
    window.dispatchEvent(new CustomEvent('closeAllPickersAndPanels'))

    // Show modal with default color
    setPendingColorHex(seedHex)
    setShowAddColorModal(true)
  }

  const createColorScale = async (seedHex: string) => {
    // Parse the seed hex to get HSV values for generating the scale
    const seedHsv = hexToHsv(seedHex)
    const newHue = seedHsv.h

    // Get friendly name and convert to slug
    const friendlyName = await getFriendlyNamePreferNtc(seedHex)
    const newFamilySlug = toKebabCase(friendlyName)

    // Generate all color levels using the same logic as the main component
    const seedS = seedHsv.s
    const seedV = seedHsv.v
    const endS000 = 0.02
    const endV000 = 0.98
    const endS1000 = clamp(seedS * 1.2, 0, 1)
    const endV1000 = clamp(Math.max(0.03, seedV * 0.08), 0, 1)
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t

    // Store all the hex values we're creating
    const tokenValues: Record<string, string> = {}
    LEVELS_ASC.forEach((lvl) => {
      const idx = IDX_MAP[lvl]
      if (idx === undefined) return

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
      tokenValues[levelStr] = hex
    })

    // Read fresh tokens directly from the store
    const store = getVarsStore()
    const currentState = store.getState()
    const currentTokens = currentState.tokens
    const nextTokens = JSON.parse(JSON.stringify(currentTokens)) as any
    const tokensRoot = nextTokens?.tokens || {}

    // Find the next available scale number
    const colorsRoot = tokensRoot?.colors || {}
    let scaleNumber = 1
    while (colorsRoot[`scale-${String(scaleNumber).padStart(2, '0')}`]) {
      scaleNumber++
    }
    const scaleKey = `scale-${String(scaleNumber).padStart(2, '0')}`

    // Create the new scale in the new format with alias
    if (!tokensRoot.colors) tokensRoot.colors = {}
    tokensRoot.colors[scaleKey] = {
      alias: newFamilySlug,
      ...Object.fromEntries(
        Object.entries(tokenValues).map(([level, hex]) => [
          level,
          { $type: 'color', $value: hex }
        ])
      )
    }

    // Update tokens structure
    if (!nextTokens.tokens) nextTokens.tokens = tokensRoot
    setTokens(nextTokens)

    // Create token entries for each level
    Object.entries(tokenValues).forEach(([level, hex]) => {
      const aliasTokenName = `colors/${newFamilySlug}/${level}`
      const scaleTokenName = `colors/${scaleKey}/${level}`
      store.updateToken(scaleTokenName, hex)
      store.updateToken(aliasTokenName, hex)
    })

    // Update family names via CSS var
    setFamilyNameByAlias(newFamilySlug, toTitleCase(friendlyName))
  }

  return (
    <>
      <Button
        variant="outline"
        size="small"
        onClick={handleAddColor}
        icon={(() => {
          const PlusIcon = iconNameToReactComponent('plus')
          return PlusIcon ? <PlusIcon style={{ width: 'var(--recursica_brand_dimensions_icons_default)', height: 'var(--recursica_brand_dimensions_icons_default)' }} /> : null
        })()}
      >
        Add color scale
      </Button>
      <ColorPickerModal
        open={showAddColorModal}
        defaultHex={pendingColorHex}
        onClose={() => setShowAddColorModal(false)}
        onAccept={(hex) => {
          setShowAddColorModal(false)
          createColorScale(hex)
        }}
      />
    </>
  )
}

export default function ColorTokens() {
  const { tokens: tokensJson, updateToken, setTokens, theme, palettes } = useVars()
  const { mode: themeMode } = useThemeMode()
  const [values, setValues] = useState<Record<string, string | number>>({})
  const [hoveredSwatch, setHoveredSwatch] = useState<string | null>(null)
  const [openPicker, setOpenPicker] = useState<{ tokenName: string; anchorElement: HTMLElement } | null>(null)

  // Track theme changes via direct store subscription so colorScaleUsageMap
  // always reflects the freshest theme even when this component was unmounted
  // during a theme update (e.g. changing warning color on Core Properties page).
  const [themeVersion, setThemeVersion] = useState(0)

  // Close picker when mode changes
  useEffect(() => {
    const handleCloseAll = () => {
      setOpenPicker(null)
    }
    window.addEventListener('closeAllPickersAndPanels', handleCloseAll)
    return () => window.removeEventListener('closeAllPickersAndPanels', handleCloseAll)
  }, [])

  // Increment themeVersion whenever the store's theme object changes
  useEffect(() => {
    return getVarsStore().subscribe(() => {
      setThemeVersion(v => v + 1)
    })
  }, [])
  const [deletedFamilies, setDeletedFamilies] = useState<Record<string, true>>({})
  const [familyNames, setFamilyNames] = useState<Record<string, string>>({})
  const [namesHydrated, setNamesHydrated] = useState(false)
  const [familyOrder, setFamilyOrder] = useState<string[]>([])
  const [showAddColorModal, setShowAddColorModal] = useState(false)
  const [pendingColorHex, setPendingColorHex] = useState<string>('var(--recursica_brand_palettes_core_black)')

  // Listen for theme reset to clear deleted families and family order
  useEffect(() => {
    const handleReset = () => {
      setDeletedFamilies({})
      setFamilyOrder([])
    }
    window.addEventListener('themeReset', handleReset)
    return () => window.removeEventListener('themeReset', handleReset)
  }, [])

  // Initialize family names from CSS vars
  useEffect(() => {
    try {
      const names = getAllFamilyNames(tokensJson)
      if (Object.keys(names).length > 0) setFamilyNames(names)
    } catch { }
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
        setFamilyNames(getAllFamilyNames(tokensJson))
        setNamesHydrated(true)
      } catch {
        setFamilyNames({})
      }
    }
    window.addEventListener('familyNamesChanged', onNames as any)
    return () => window.removeEventListener('familyNamesChanged', onNames as any)
  }, [])



  // Seed family names from CSS vars (re-read when tokens change)
  useEffect(() => {
    try {
      const names = getAllFamilyNames(tokensJson)
      if (Object.keys(names).length > 0) setFamilyNames(names)
    } catch { }
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

      // Process new scale structure (colors.scale-XX.level)
      const colorsRoot = t?.colors || {}
      if (colorsRoot && typeof colorsRoot === 'object' && !Array.isArray(colorsRoot)) {
        Object.keys(colorsRoot).forEach((scaleKey) => {
          if (!scaleKey || !scaleKey.startsWith('scale-')) return
          const scale = colorsRoot[scaleKey]
          if (!scale || typeof scale !== 'object' || Array.isArray(scale)) return

          const alias = scale.alias // Get the alias (e.g., "cornflower", "gray")
          const familyName = alias && typeof alias === 'string' ? alias : scaleKey

          Object.keys(scale).forEach((lvl) => {
            // Skip the alias property
            if (lvl === 'alias') return
            // Accept levels that are: 2-4 digits, or exactly '000' or '050'
            if (!/^(\d{2,4}|000|050)$/.test(lvl)) return

            const levelObj = scale[lvl]
            if (levelObj && typeof levelObj === 'object' && '$value' in levelObj) {
              // Use alias-based token name for display (e.g., colors/cornflower/100)
              // Also support scale-based name for backwards compatibility
              push(`colors/${familyName}/${lvl}`, 'color', levelObj.$value)
              // Also create scale-based token name (e.g., colors/scale-01/100)
              if (familyName !== scaleKey) {
                push(`colors/${scaleKey}/${lvl}`, 'color', levelObj.$value)
              }
            }
          })
        })
      }

      // Backwards compatibility: also process old color structure if it exists
      const oldColors = t?.color || {}
      if (oldColors && typeof oldColors === 'object' && !Array.isArray(oldColors)) {
        Object.keys(oldColors).forEach((family) => {
          if (family === 'translucent') return
          const levels = oldColors[family] || {}
          Object.keys(levels).forEach((lvl) => {
            push(`color/${family}/${lvl}`, 'color', levels[lvl]?.$value)
          })
        })
        if (oldColors.gray?.['000']) push('color/gray/000', 'color', oldColors.gray['000'].$value)
        if (oldColors.gray?.['1000']) push('color/gray/1000', 'color', oldColors.gray['1000'].$value)
      }
    } catch { }
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
      // Support both old format (color/family/level) and new format (colors/family/level or colors/scale-XX/level)
      if (!entry.name.startsWith('color/') && !entry.name.startsWith('colors/')) return
      const parts = entry.name.split('/')
      if (parts.length < 3) return
      const family = parts[1]
      if (family === 'translucent' || family.startsWith('scale-')) {
        // Skip scale-XX keys, only use alias-based names for grouping
        return
      }
      const rawLevel = parts[2]
      if (!/^\d+$/.test(rawLevel)) return
      const level = rawLevel.length === 2 ? `0${rawLevel}` : rawLevel.length === 1 ? `00${rawLevel}` : rawLevel
      const mode: ModeName = (entry as any).mode || 'Mode 1'
      if (!byMode[mode]) byMode[mode] = {}
      if (!byMode[mode][family]) byMode[mode][family] = []
      byMode[mode][family].push({ level, entry })
    })
    Object.keys(values).forEach((name) => {
      // Support both old format (color/family/level) and new format (colors/family/level)
      if (!name.startsWith('color/') && !name.startsWith('colors/')) return
      const parts = name.split('/')
      if (parts.length !== 3) return
      const family = parts[1]
      if (family === 'translucent' || family.startsWith('scale-')) {
        // Skip scale-XX keys, only use alias-based names for grouping
        return
      }
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
        const existing = getAllFamilyNames(tokensJson)
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
          // Persist each changed name to CSS var
          for (const fam of famSet) {
            if (next[fam] && next[fam] !== existing[fam]) {
              setFamilyNameByAlias(fam, next[fam], tokensJson)
            }
          }
        }
      } catch { }
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
      ; (async () => {
        const startIdx = IDX_MAP[levelNum]
        if (startIdx === undefined) return
        const fiveHex = computeLevel500Hex(tokenName, hex, levelNum, cascadeDown, cascadeUp, startIdx, values)
        if (fiveHex) {
          const label = await getFriendlyNamePreferNtc(fiveHex)
          setFamilyNames((prev) => ({ ...prev, [family]: label }))
          setFamilyNameByAlias(family, label, tokensJson)
        }
      })()
  }

  const createColorScale = async (seedHex: string) => {
    setOpenPicker(null)
    const families = Object.entries(colorFamiliesByMode['Mode 1'] || {}).filter(([family]) => family !== 'translucent' && !deletedFamilies[family])
    if (!families.length) return

    // Parse the seed hex to get HSV values for generating the scale
    const seedHsv = hexToHsv(seedHex)

    const newHue = seedHsv.h

    // Get friendly name and convert to slug
    const friendlyName = await getFriendlyNamePreferNtc(seedHex)
    const newFamilySlug = toKebabCase(friendlyName)

    // Generate all color levels
    const seedS = seedHsv.s
    const seedV = seedHsv.v
    const endS000 = 0.02
    const endV000 = 0.98
    const endS1000 = clamp(seedS * 1.2, 0, 1)
    const endV1000 = clamp(Math.max(0.03, seedV * 0.08), 0, 1)
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t

    // Store all the hex values we're creating
    const tokenValues: Record<string, string> = {}
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
      tokenValues[levelStr] = hex
    })

    // Read fresh tokens directly from the store
    const store = getVarsStore()
    const currentState = store.getState()
    const currentTokens = currentState.tokens
    const nextTokens = JSON.parse(JSON.stringify(currentTokens)) as any
    const tokensRoot = nextTokens?.tokens || {}

    // Find the next available scale number
    const colorsRoot = tokensRoot?.colors || {}
    let scaleNumber = 1
    while (colorsRoot[`scale-${String(scaleNumber).padStart(2, '0')}`]) {
      scaleNumber++
    }
    const scaleKey = `scale-${String(scaleNumber).padStart(2, '0')}`

    // Create the new scale in the new format with alias
    if (!tokensRoot.colors) tokensRoot.colors = {}
    tokensRoot.colors[scaleKey] = {
      alias: newFamilySlug,
      ...Object.fromEntries(
        Object.entries(tokenValues).map(([level, hex]) => [
          level,
          { $type: 'color', $value: hex }
        ])
      )
    }

    // Update tokens structure
    if (!nextTokens.tokens) nextTokens.tokens = tokensRoot
    setTokens(nextTokens)

    // Update local values state - use alias-based token names for display
    const newValues = { ...values }
    Object.entries(tokenValues).forEach(([level, hex]) => {
      const aliasTokenName = `colors/${newFamilySlug}/${level}`
      const scaleTokenName = `colors/${scaleKey}/${level}`
      newValues[aliasTokenName] = hex
      newValues[scaleTokenName] = hex
    })
    setValues(newValues)

    // Update family order - always append new family to the end
    setFamilyOrder((prev) => {
      if (!prev.includes(newFamilySlug)) {
        return [...prev, newFamilySlug]
      }
      return prev
    })

    // Update family names via CSS var
    const updatedFamilyNames = { ...familyNames }
    updatedFamilyNames[newFamilySlug] = toTitleCase(friendlyName)
    setFamilyNames(updatedFamilyNames)
    setFamilyNameByAlias(newFamilySlug, toTitleCase(friendlyName), tokensJson)
  }

  // Build detailed usage map: family -> Array<{ label, url }>
  const colorScaleUsageMap = useMemo(() => {

    // Helper to resolve a token reference string to its color family alias
    const resolveToFamily = (ref: string, mode: 'light' | 'dark'): string | null => {
      if (!ref.includes('{') || !ref.includes('}')) return null
      const tokenIndex = buildTokenIndex(tokensJson)
      const context: TokenReferenceContext = { currentMode: mode, tokenIndex }
      const parsed = parseTokenReference(ref, context)
      if (!parsed || parsed.type !== 'token' || parsed.path.length < 2) return null
      if (parsed.path[0] === 'colors') {
        const scaleOrAlias = parsed.path[1]
        if (scaleOrAlias?.startsWith('scale-')) {
          const tokensRoot: any = (tokensJson as any)?.tokens || {}
          const colorsRoot: any = tokensRoot?.colors || {}
          const scale = colorsRoot?.[scaleOrAlias]
          if (scale?.alias && typeof scale.alias === 'string') {
            return scale.alias.trim() || scaleOrAlias
          }
          return scaleOrAlias
        }
        return scaleOrAlias?.trim() || null
      }
      if (parsed.path[0] === 'color') return parsed.path[1]?.trim() || null
      return null
    }

    // Recursively extract families from an arbitrary palette object
    const extractFamiliesFromObj = (obj: any, mode: 'light' | 'dark'): Set<string> => {
      const families = new Set<string>()
      if (!obj || typeof obj !== 'object') return families
      if (Array.isArray(obj)) {
        obj.forEach((item) => extractFamiliesFromObj(item, mode).forEach((f) => families.add(f)))
        return families
      }
      for (const [, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          const fam = resolveToFamily(value, mode)
          if (fam) families.add(fam)
        } else if (value && typeof value === 'object') {
          extractFamiliesFromObj(value, mode).forEach((f) => families.add(f))
        }
      }
      return families
    }

    // Human-readable labels for core color sub-keys
    const coreColorLabels: Record<string, string> = {
      interactive: 'Interactive',
      alert: 'Alert',
      warning: 'Warning',
      success: 'Success',
      black: 'Black',
      white: 'White',
    }

    // Palette key to human label + URL
    const paletteKeyToInfo = (pk: string, index?: number): { label: string; url: string } => {
      if (pk === 'core' || pk === 'core-colors') return { label: 'Core Properties', url: '/theme/core-properties' }
      if (pk === 'neutral') return { label: 'Neutral Palette', url: '/theme/palettes' }
      // palette-N
      const match = pk.match(/^palette-(\d+)$/)
      if (match) return { label: `Palette ${match[1]}`, url: '/theme/palettes' }
      return { label: pk, url: '/theme/palettes' }
    }

    // Collect raw usages per mode: family -> { label, url } -> Set<mode>
    type UsageKey = string // "label|||url"
    const rawUsages = new Map<string, Map<UsageKey, Set<'light' | 'dark'>>>()

    const addRawUsage = (family: string, label: string, url: string, mode: 'light' | 'dark') => {
      if (!rawUsages.has(family)) rawUsages.set(family, new Map())
      const familyMap = rawUsages.get(family)!
      const key: UsageKey = `${label}|||${url}`
      if (!familyMap.has(key)) familyMap.set(key, new Set())
      familyMap.get(key)!.add(mode)
    }

    try {
      const liveTheme = getVarsStore().getLatestThemeCopy()
      const root: any = (liveTheme as any)?.brand ? (liveTheme as any).brand : liveTheme
      const themes = root?.themes || root

      for (const mode of ['light', 'dark'] as const) {
        const modePalettes: any = themes?.[mode]?.palettes || root?.[mode]?.palettes || {}
        const paletteKeys = Object.keys(modePalettes)

        paletteKeys.forEach((pk) => {
          const paletteData = modePalettes[pk]
          if (!paletteData || typeof paletteData !== 'object') return

          if (pk === 'core' || pk === 'core-colors') {
            // For core-colors, check each sub-key individually for more granular labels
            Object.keys(paletteData).forEach((subKey) => {
              // Skip meta keys like $type, $value
              if (subKey.startsWith('$')) return
              const subData = paletteData[subKey]
              if (!subData || typeof subData !== 'object') return
              const families = extractFamiliesFromObj(subData, mode)
              const subLabel = coreColorLabels[subKey] || subKey
              families.forEach((fam) => {
                if (fam && fam !== 'translucent') {
                  addRawUsage(fam, `Core: ${subLabel}`, '/theme/core-properties', mode)
                }
              })
            })
          } else {
            // Numbered palettes and neutral
            const families = extractFamiliesFromObj(paletteData, mode)
            const info = paletteKeyToInfo(pk)
            families.forEach((fam) => {
              if (fam && fam !== 'translucent') {
                addRawUsage(fam, info.label, info.url, mode)
              }
            })
          }
        })
      }
    } catch { }

    // Merge: if a usage exists in both modes, list once without suffix.
    // If only in one mode, append "(Light)" or "(Dark)".
    const usageMap = new Map<string, Array<{ label: string; url: string; targetMode?: 'Light' | 'Dark' }>>()
    rawUsages.forEach((familyMap, family) => {
      const entries: Array<{ label: string; url: string; targetMode?: 'Light' | 'Dark' }> = []
      familyMap.forEach((modes, key) => {
        const [label, url] = key.split('|||')
        if (modes.size === 2) {
          entries.push({ label, url })
        } else {
          const modeStr = modes.has('light') ? 'Light' : 'Dark'
          entries.push({ label: `${label} (${modeStr})`, url, targetMode: modeStr })
        }
      })
      if (entries.length > 0) usageMap.set(family, entries)
    })

    return usageMap
  }, [themeVersion, tokensJson])

  // Helper: get usage locations for a family
  const getUsageLocations = (family: string): Array<{ label: string; url: string; targetMode?: 'Light' | 'Dark' }> => {
    return colorScaleUsageMap.get(family) || []
  }

  // Count total color scales (excluding deleted ones)
  const totalColorScales = useMemo(() => {
    try {
      const tokensRoot: any = (tokensJson as any)?.tokens || {}
      // Check new format (colors) - count scales by their aliases
      const colorsRoot: any = tokensRoot?.colors || {}
      const scaleAliases = new Set<string>()
      Object.keys(colorsRoot).forEach((key) => {
        if (key.startsWith('scale-')) {
          const scale = colorsRoot[key]
          if (scale && typeof scale === 'object' && scale.alias && typeof scale.alias === 'string') {
            const alias = scale.alias.trim()
            if (alias && !deletedFamilies[alias]) {
              scaleAliases.add(alias)
            }
          }
        }
      })
      // Also check old format (color) for backwards compatibility
      const oldColorsRoot = tokensRoot?.color || {}
      Object.keys(oldColorsRoot).forEach((fam) => {
        if (fam !== 'translucent' && !deletedFamilies[fam]) {
          scaleAliases.add(fam)
        }
      })
      return scaleAliases.size
    } catch {
      return 0
    }
  }, [tokensJson, deletedFamilies])

  const handleDeleteFamily = (family: string) => {
    // Deep clone tokens to avoid mutation
      const nextTokens = JSON.parse(JSON.stringify(tokensJson)) as any
      const tokensRoot = nextTokens?.tokens || {}
      const oldColorsRoot = tokensRoot?.color || {}
      const newColorsRoot = tokensRoot?.colors || {}
      let tokensChanged = false

      // Delete from OLD color structure (color.family)
      if (oldColorsRoot[family]) {
        delete oldColorsRoot[family]
        tokensChanged = true
      }

      // Delete from NEW colors structure (colors.scale-XX with matching alias)
      let deletedScaleKey: string | null = null
      Object.keys(newColorsRoot).forEach((scaleKey) => {
        if (!scaleKey.startsWith('scale-')) return
        const scale = newColorsRoot[scaleKey]
        if (scale && typeof scale === 'object' && scale.alias === family) {
          delete newColorsRoot[scaleKey]
          deletedScaleKey = scaleKey
          tokensChanged = true
        }
      })

      if (tokensChanged) {
        setTokens(nextTokens)
      }

      // Remove all CSS variables for this color family from inline styles
      const root = document.documentElement
      const style = root.style
      const cssVarsToRemove: string[] = []

      // Iterate backwards to avoid index shifting issues
      for (let i = style.length - 1; i >= 0; i--) {
        const prop = style[i]
        if (!prop) continue
        // Match old format: --recursica_tokens_color_{family}-*
        if (prop.startsWith(`${tokenColor(family, '')}`)) {
          cssVarsToRemove.push(prop)
        }
        // Match new format by alias: --recursica_tokens_colors_{family}-*
        if (prop.startsWith(`${tokenColors(family, '')}`)) {
          cssVarsToRemove.push(prop)
        }
        // Match new format by scale key: --recursica_tokens_colors_{scale-XX}-*
        if (deletedScaleKey && prop.startsWith(`${tokenColors(deletedScaleKey, '')}`)) {
          cssVarsToRemove.push(prop)
        }
      }

      // Remove all collected CSS variables
      cssVarsToRemove.forEach(prop => root.style.removeProperty(prop))

      // Update local values state - remove all tokens for this family (both formats)
      const newValues = { ...values }
      Object.keys(newValues).forEach((tokenName) => {
        if (tokenName.startsWith(`color/${family}/`) || tokenName.startsWith(`colors/${family}/`)) {
          delete newValues[tokenName]
        }
        if (deletedScaleKey && tokenName.startsWith(`colors/${deletedScaleKey}/`)) {
          delete newValues[tokenName]
        }
      })
      setValues(newValues)

      // Mark as deleted and update order
      setDeletedFamilies((prev) => ({ ...prev, [family]: true }))
      setOpenPicker(null)
      setFamilyOrder((prev) => prev.filter((f) => f !== family))

  }

  const handleFamilyNameChange = (family: string, newName: string) => {
    const v = toTitleCase(newName)
    const newFamilySlug = toKebabCase(newName)

    // If the slug differs from the current family key, rename all tokens
    if (newFamilySlug && newFamilySlug !== family && newFamilySlug.length > 0) {
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

          // Update CSS var
          renameFamilyName(family, newFamilySlug, v, tokensJson)

          // Close picker if open for this family
          if (openPicker && openPicker.tokenName.startsWith(`color/${family}/`)) {
            setOpenPicker(null)
          }

          return // Early return since we've handled the rename
        }

    }

    // If slug matches or rename failed, just update the display name
    setFamilyNames((prev) => ({ ...prev, [family]: v }))
    setFamilyNameByAlias(family, v, tokensJson)
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

  // Helper function to get scale key for a family alias
  const getScaleKeyForFamily = (familyAlias: string): string | null => {
    try {
      const tokensRoot: any = (tokensJson as any)?.tokens || {}
      const colorsRoot: any = tokensRoot?.colors || {}
      for (const [scaleKey, scale] of Object.entries(colorsRoot)) {
        if (!scaleKey.startsWith('scale-')) continue
        const scaleObj = scale as any
        if (scaleObj?.alias === familyAlias) {
          return scaleKey
        }
      }
    } catch { }
    return null
  }

  // Helper function to extract scale number from scale key (e.g., "scale-01" -> 1)
  const getScaleNumber = (scaleKey: string | null): number => {
    if (!scaleKey || !scaleKey.startsWith('scale-')) return 9999 // Put non-scale families at the end
    const match = scaleKey.match(/scale-(\d+)/)
    return match ? parseInt(match[1], 10) : 9999
  }

  // Sort families by scale number (scale-01, scale-02, etc.) - always use scale-based ordering
  let families = Object.entries(familiesData).filter(([family]) => family !== 'translucent' && !deletedFamilies[family]).sort(([a], [b]) => {
    // Sort by scale number (scale-01, scale-02, etc.)
    const scaleKeyA = getScaleKeyForFamily(a)
    const scaleKeyB = getScaleKeyForFamily(b)
    const scaleNumA = getScaleNumber(scaleKeyA)
    const scaleNumB = getScaleNumber(scaleKeyB)

    if (scaleNumA !== scaleNumB) {
      return scaleNumA - scaleNumB
    }

    // Fallback to alphabetical if scale numbers are the same (shouldn't happen)
    return a.localeCompare(b)
  })

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

  const layer0Surface = layerProperty(themeMode, 0, 'surface')
  const layer0TextColor = layerText(themeMode, 0, 'color')
  const layer0TextLow = layerText(themeMode, 0, 'low-emphasis')

  return (
    <section style={{
      background: `var(${layer0Surface})`,
      padding: 'var(--recursica_brand_dimensions_general_md)',
    }}>
      {/* Color scales grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `100px repeat(${families.length}, minmax(80px, 200px))`,
        columnGap: 'var(--recursica_brand_dimensions_gutters_horizontal)',
        rowGap: 0,
        alignItems: 'start',
        justifyContent: 'start'
      }}>
        {/* Numerical scale column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Use a hidden TextField as spacer to ensure exact height match with scale headers */}
          <div style={{ marginBottom: 'var(--recursica_brand_dimensions_gutters_vertical)', visibility: 'hidden', pointerEvents: 'none' }}>
            <TextField value="" onChange={() => { }} layer="layer-1" style={{ width: '100%' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 1 }}> {/* 1px offset to match scale container border */}
            {levelOrder.map((level) => (
              <div
                key={'label-' + level}
                style={{
                  textAlign: 'center',
                  fontSize: 'var(--recursica_brand_typography_caption-font-size)',
                  color: `var(${layer0TextColor})`,
                  opacity: `var(${layer0TextLow})`,
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
            usageLocations={getUsageLocations(family)}
            isLastColorScale={totalColorScales <= 1}
            tokens={tokensJson}
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

