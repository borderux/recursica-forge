import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useVars } from '../vars/VarsContext'
import { readOverrides } from '../theme/tokenOverrides'
import { updateCssVar, removeCssVar, clearPendingCssVars, suppressCssVarEvents } from '../../core/css/updateCssVar'
import { readCssVar, readCssVarResolved } from '../../core/css/readCssVar'
import { updateInteractiveColor, updateCoreColorInteractiveOnTones, updateCoreColorOnTones } from './interactiveColorUpdater'
import { buildTokenIndex } from '../../core/resolvers/tokens'
import { parseTokenReference, resolveTokenReferenceToValue, resolveTokenReferenceToCssVar, type TokenReferenceContext } from '../../core/utils/tokenReferenceParser'
import { hexToCssVarRef, getSteppedColor, resolveCssVarToHex, findColorFamilyAndLevel } from '../../core/compliance/layerColorStepping'
import { getAllFamilyNames } from '../../core/utils/familyNames'
import { pickAAOnTone, contrastRatio } from '../theme/contrastUtil'
import { useThemeMode } from '../theme/ThemeModeContext'
import { tokenToCssVar } from '../../core/css/tokenRefs'
import { getVarsStore } from '../../core/store/varsStore'
import { tokenColors, paletteCore, layerProperty, extractColorToken, colorTokenToPath } from '../../core/css/cssVarBuilder'
import { updateCoreColorOnTonesForCompliance } from '../../core/compliance/coreColorAaCompliance'
import { iconNameToReactComponent } from '../components/iconUtils'
import FloatingPalette from '../toolbar/menu/floating-palette/FloatingPalette'
import { Label } from '../../components/adapters/Label'
import { getGlobalCssVar } from '../../components/utils/cssVarNames'

export default function ColorTokenPicker() {
  const { tokens: tokensJson, theme: themeJson, setTheme } = useVars()
  const { mode } = useThemeMode()
  const modeLower = mode.toLowerCase() as 'light' | 'dark'
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [targetVar, setTargetVar] = useState<string | null>(null)
  const [additionalTargetVars, setAdditionalTargetVars] = useState<string[]>([])
  const [familyNames, setFamilyNames] = useState<Record<string, string>>({})
  const [cssVarUpdateTrigger, setCssVarUpdateTrigger] = useState(0)

  // Close picker when mode changes
  useEffect(() => {
    const handleCloseAll = () => {
      setAnchor(null)
      setTargetVar(null)
      setAdditionalTargetVars([])
    }
    window.addEventListener('closeAllPickersAndPanels', handleCloseAll)
    return () => window.removeEventListener('closeAllPickersAndPanels', handleCloseAll)
  }, [])

  // Close picker on route navigation
  const location = useLocation()
  useEffect(() => {
    setAnchor(null)
    setTargetVar(null)
    setAdditionalTargetVars([])
  }, [location.pathname])

  useEffect(() => {
    try {
      const names = getAllFamilyNames()
      if (Object.keys(names).length > 0) setFamilyNames(names)
    } catch { }
    const onNames = (ev: Event) => {
      try {
        const detail: any = (ev as CustomEvent).detail
        if (detail && typeof detail === 'object') {
          setFamilyNames(detail)
          return
        }
        setFamilyNames(getAllFamilyNames())
      } catch {
        setFamilyNames({})
      }
    }
    window.addEventListener('familyNamesChanged', onNames as any)
    return () => window.removeEventListener('familyNamesChanged', onNames as any)
  }, [])

  const options = useMemo(() => {
    const byFamily: Record<string, Array<{ level: string; name: string; value: string }>> = {}
    const overrideMap = readOverrides()

    // Process new colors structure (colors.scale-XX.level)
    const jsonColors: any = (tokensJson as any)?.tokens?.colors || {}
    const colorFamilyMap: Record<string, Set<string>> = {} // family -> Set of levels

    for (const [scaleKey, scale] of Object.entries(jsonColors)) {
      if (!scaleKey.startsWith('scale-')) continue
      const scaleObj = scale as any
      const alias = scaleObj?.alias // Get the alias (e.g., "cornflower", "gray")
      const familyName = alias && typeof alias === 'string' ? alias : scaleKey

      if (!colorFamilyMap[familyName]) {
        colorFamilyMap[familyName] = new Set()
      }

      // Collect all levels from this scale
      for (const [level, value] of Object.entries(scaleObj)) {
        if (level === 'alias') continue
        colorFamilyMap[familyName].add(level)
      }
    }

    // Add override families
    const overrideFamilies = Array.from(new Set(Object.keys(overrideMap)
      .filter((k) => k.startsWith('color/') || k.startsWith('colors/'))
      .map((k) => {
        const parts = k.split('/')
        return parts.length >= 2 ? parts[1] : null
      })
      .filter((f): f is string => f !== null && f !== 'translucent')))

    overrideFamilies.forEach((fam) => {
      if (!colorFamilyMap[fam]) {
        colorFamilyMap[fam] = new Set()
      }
    })

    const families = Array.from(new Set([...Object.keys(colorFamilyMap), ...overrideFamilies])).sort((a, b) => {
      if (a === 'gray' && b !== 'gray') return -1
      if (b === 'gray' && a !== 'gray') return 1
      return a.localeCompare(b)
    })

    families.forEach((fam) => {
      const allLevels = Array.from(colorFamilyMap[fam] || new Set())

      // Also check override levels
      const overrideLevels = Object.keys(overrideMap)
        .filter((k) => (k.startsWith(`color/${fam}/`) || k.startsWith(`colors/${fam}/`)))
        .map((k) => k.split('/')[2])
        .filter((lvl) => lvl && /^(\d{2,4}|000|050)$/.test(lvl))

      const levelSet = new Set<string>([...allLevels, ...overrideLevels])
      const finalLevels = Array.from(levelSet)

      // Show all levels including 000 and 1000 - no deduplication
      byFamily[fam] = finalLevels.map((lvl) => {
        const name = `colors/${fam}/${lvl}` // Use new format
        // Try to get value from new structure first
        let val: any = null
        // Find the scale that has this alias
        for (const [scaleKey, scale] of Object.entries(jsonColors)) {
          if (!scaleKey.startsWith('scale-')) continue
          const scaleObj = scale as any
          const alias = scaleObj?.alias
          if (alias === fam || scaleKey === fam) {
            val = scaleObj?.[lvl]?.$value
            if (val) break
          }
        }
        // Fallback to old structure
        if (!val) {
          val = (overrideMap as any)[name] ?? (overrideMap as any)[`color/${fam}/${lvl}`]
        }
        return { level: lvl, name, value: String(val ?? '') }
      }).filter((it) => it.value && /^#?[0-9a-fA-F]{6}$/i.test(String(it.value).trim()))
      byFamily[fam].sort((a, b) => {
        const aNum = a.level === '000' ? 0 : a.level === '050' ? 50 : a.level === '1000' ? 1000 : Number(a.level)
        const bNum = b.level === '000' ? 0 : b.level === '050' ? 50 : b.level === '1000' ? 1000 : Number(b.level)
        return bNum - aNum
      })
    })
    return byFamily
  }, [tokensJson])

    // Handle opening from global function
    ; (window as any).openPicker = (el: HTMLElement, cssVar: string, additionalCssVars?: string[]) => {
      window.dispatchEvent(new CustomEvent('closeAllPickersAndPanels'))
      setAnchor(el)
      setTargetVar(cssVar)
      setAdditionalTargetVars(additionalCssVars ?? [])
    }

  // Helper: Build CSS variable name for a color token (matches varsStore format)
  // Always uses scale key (e.g., scale-01) instead of alias (e.g., cornflower)
  const buildTokenCssVar = (family: string, level: string): string => {
    const normalizedLevel = level === '1000' ? '1000' : String(level).padStart(3, '0')

    // If family is already a scale key (starts with scale-), use it directly
    if (family.startsWith('scale-')) {
      return tokenColors(family, normalizedLevel)
    }

    // Otherwise, find the scale key from the alias
    if (tokensJson) {
      const tokensRoot: any = (tokensJson as any)?.tokens || {}
      const colorsRoot: any = tokensRoot?.colors || {}

      // Find the scale that has this alias
      const scaleKey = Object.keys(colorsRoot).find(key => {
        if (!key.startsWith('scale-')) return false
        const scale = colorsRoot[key]
        return scale && typeof scale === 'object' && scale.alias === family
      })

      if (scaleKey) {
        return tokenColors(scaleKey, normalizedLevel)
      }
    }

    // Fallback: if we can't find the scale, try the old format (for backwards compatibility)
    return tokenColors(family, normalizedLevel)
  }

  // Get the resolved value of the target CSS var to compare with color tokens
  // This hook must be called before any early returns to follow Rules of Hooks
  const targetResolvedValue = useMemo(() => {
    if (!targetVar) return null
    const resolved = readCssVarResolved(targetVar)
    const directValue = readCssVar(targetVar)
    return { resolved, direct: directValue }
  }, [targetVar, cssVarUpdateTrigger]) // Include cssVarUpdateTrigger to react to CSS var changes

  // Check if a color token swatch is currently selected
  const isTokenSelected = (tokenName: string, tokenHex: string): boolean => {
    if (!targetResolvedValue || !targetVar) return false

    // Parse token name: color/{family}/{level} or colors/{family}/{level}
    const tokenParts = tokenName.split('/')
    if (tokenParts.length !== 3 || (tokenParts[0] !== 'color' && tokenParts[0] !== 'colors')) return false

    const family = tokenParts[1]
    const level = tokenParts[2]
    const tokenCssVar = buildTokenCssVar(family, level)
    const expectedValue = `var(${tokenCssVar})`

    // Check if target CSS var directly references this token var
    const directValue = readCssVar(targetVar)
    if (directValue) {
      const trimmed = directValue.trim()
      if (trimmed === expectedValue) {
        return true
      }

      // If target is a CSS var reference, check if it resolves to this token
      if (trimmed.startsWith('var(')) {
        // Extract the inner CSS variable name
        const varMatch = trimmed.match(/var\s*\(\s*(--[^)]+?)\s*\)/)
        if (varMatch) {
          const innerVar = varMatch[1].trim()
          // Recursively check if the inner var resolves to our token
          let currentVar = innerVar
          let depth = 0
          const maxDepth = 10
          while (depth < maxDepth) {
            const currentValue = readCssVar(currentVar)
            if (!currentValue) break

            const trimmedValue = currentValue.trim()
            if (trimmedValue === expectedValue) {
              return true
            }

            // If it's another var() reference, continue resolving
            const nextVarMatch = trimmedValue.match(/var\s*\(\s*(--[^)]+?)\s*\)/)
            if (nextVarMatch) {
              currentVar = nextVarMatch[1].trim()
              depth++
            } else {
              break
            }
          }
        }
      }
    }

    // Fallback: compare resolved hex values
    if (targetResolvedValue.resolved) {
      const normalizedHex = tokenHex.startsWith('#') ? tokenHex.toLowerCase().trim() : `#${tokenHex.toLowerCase().trim()}`
      if (/^#[0-9a-f]{6}$/.test(normalizedHex)) {
        const targetHex = targetResolvedValue.resolved.startsWith('#')
          ? targetResolvedValue.resolved.toLowerCase().trim()
          : `#${targetResolvedValue.resolved.toLowerCase().trim()}`
        return targetHex === normalizedHex
      }
    }

    return false
  }

  // Helper function to update theme JSON for core colors and check on-tone AA compliance
  const updateCoreColorInTheme = (cssVar: string, tokenName: string) => {
    if (!setTheme || !themeJson || !tokensJson) return

    // Check if this is a core color CSS var for the current mode
    // Use --recursica_brand_themes_ format to match varsStore.ts and palettes.ts
    // paletteCore() generates `core_` with underscore, not `core-` with hyphen
    const modeLower = mode.toLowerCase()
    const coreColorPrefix = `--recursica_brand_themes_${modeLower}_palettes_core-colors_`
    if (!cssVar.startsWith(coreColorPrefix)) return // Not a core color

    // Extract the color name from the CSS var
    // Only update if this is a -tone variable, not -on-tone
    // We should always be updating the tone value, never the on-tone value
    if (cssVar.includes('_on-tone') || cssVar.includes('_on_tone')) {
      return
    }

    // Extract color name - remove the prefix, then strip trailing `_tone` suffix
    let colorName = cssVar.replace(coreColorPrefix, '')
    if (colorName.endsWith('_tone')) {
      colorName = colorName.slice(0, -'_tone'.length)
    }

    // If it's the main interactive variable (not interactive_tone or interactive_hover_tone), handle it separately
    if (colorName === 'interactive' && !cssVar.includes('interactive_tone') && !cssVar.includes('interactive_hover_tone')) {
      // This is the main interactive var (backward compatibility) - treat as interactive-default
      colorName = 'interactive-default'
    }

    // Determine mapping based on color name
    let mapping: { isInteractive?: boolean; isHover?: boolean } | null = null
    if (colorName === 'high-contrast' || colorName === 'low-contrast' || colorName === 'alert' || colorName === 'warning' || colorName === 'success') {
      mapping = {}
    } else if (colorName === 'interactive') {
      mapping = { isInteractive: true }
    } else if (colorName === 'interactive-default' || colorName === 'interactive_default') {
      mapping = { isInteractive: true }
    } else if (colorName === 'interactive-hover' || colorName === 'interactive_hover') {
      mapping = { isInteractive: true, isHover: true }
    }

    if (!mapping) return // Not a recognized core color


      const themeCopy = getVarsStore().getLatestThemeCopy()
      const root: any = themeCopy?.brand ? themeCopy.brand : themeCopy
      const themes = root?.themes || root

      // Navigate to core-colors (direct children, no $value wrapper)
      if (!themes[modeLower]) themes[modeLower] = {}
      if (!themes[modeLower].palettes) themes[modeLower].palettes = {}
      if (!themes[modeLower].palettes['core-colors']) themes[modeLower].palettes['core-colors'] = {}

      const coreColors = themes[modeLower].palettes['core-colors']

      // Build the token reference string: {tokens.colors.{family}.{level}}
      const tokenParts = tokenName.split('/')
      const family = tokenParts[1]
      const level = tokenParts[2]

      // Resolve alias to scale key for token reference (e.g., greensheen -> scale-05)
      let scaleKeyForRef = family
      if (!family.startsWith('scale-')) {
        const tokensRoot: any = (tokensJson as any)?.tokens || {}
        const colorsRoot: any = tokensRoot?.colors || {}
        const foundScaleKey = Object.keys(colorsRoot).find(key => {
          if (!key.startsWith('scale-')) return false
          const scale = colorsRoot[key]
          return scale && typeof scale === 'object' && scale.alias === family
        })
        if (foundScaleKey) {
          scaleKeyForRef = foundScaleKey
        }
      }

      // Use new format (colors) for token references - always use scale key, not alias
      const tokenRef = `{tokens.colors.${scaleKeyForRef}.${level}}`

      // Get the hex value of the new tone for AA compliance checking
      const tokenIndex = buildTokenIndex(tokensJson)

      // Resolve alias to scale key if needed (e.g., greensheen -> scale-05)
      let scaleKey = family
      if (!family.startsWith('scale-')) {
        const tokensRoot: any = (tokensJson as any)?.tokens || {}
        const colorsRoot: any = tokensRoot?.colors || {}

        // Find the scale that has this alias
        const foundScaleKey = Object.keys(colorsRoot).find(key => {
          if (!key.startsWith('scale-')) return false
          const scale = colorsRoot[key]
          return scale && typeof scale === 'object' && scale.alias === family
        })

        if (foundScaleKey) {
          scaleKey = foundScaleKey
        }
      }

      // Try new format first (colors/scaleKey/level), then old format (color/family/level) for backwards compatibility
      let toneHex = tokenIndex.get(`colors/${scaleKey}/${level}`)
      if (typeof toneHex !== 'string') {
        toneHex = tokenIndex.get(`color/${family}/${level}`)
      }

      const normalizedToneHex = typeof toneHex === 'string'
        ? (toneHex.startsWith('#') ? toneHex.toLowerCase() : `#${toneHex.toLowerCase()}`)
        : null

      // Handle interactive colors with nested structure
      if (mapping.isInteractive) {
        // For main interactive var (backward compatibility), it maps to default.tone
        const isMainInteractive = cssVar === `--recursica_brand_themes_${modeLower}_palettes_core-colors_interactive`

        if (!coreColors.interactive) {
          coreColors.interactive = {
            tone: { $value: tokenRef },
            'on-tone': { $value: `{brand.themes.${modeLower}.palettes.core-colors.low-contrast.tone}` }
          }
        } else {
          // Update tone (flat structure)
          if (!coreColors.interactive.tone) coreColors.interactive.tone = {}
          coreColors.interactive.tone.$value = tokenRef
        }
      } else {
        // Simple core color (black, white, alert, warning, success)
        // Update tone.$value, preserving the structure
        if (!coreColors[colorName]) {
          coreColors[colorName] = {
            tone: { $value: tokenRef },
            'on-tone': { $value: `{brand.themes.${mode}.palettes.core-colors.low-contrast}` },
            interactive: { $value: `{tokens.colors.scale-05.300}` } // Default from recursica_brand.json - will be updated by AA compliance if needed
          }
        } else {
          if (!coreColors[colorName].tone) coreColors[colorName].tone = {}
          coreColors[colorName].tone.$value = tokenRef

          // AA compliance is now manual via header button - removed automatic on-tone update
          // Preserve existing on-tone if it exists, otherwise set default
          if (!coreColors[colorName]['on-tone']) {
            coreColors[colorName]['on-tone'] = { $value: `{brand.themes.${mode}.palettes.core-colors.low-contrast}` }
          }
        }
      }

      // For base color tones (not interactive), update all other base colors' on-tone values
      // This works similarly to how interactive color updates all base colors' interactive properties
      // We do this AFTER updating the tone in themeCopy so the calculations use the new tone
      if (!mapping.isInteractive && normalizedToneHex) {
        // Save the updated tone to theme first so the updater can read it
        getVarsStore().setThemeSilent(themeCopy)
        
        // This calculates and applies the AA compliant on-tones for all 5 core colors
        updateCoreColorOnTones(tokensJson, themeCopy, setTheme, modeLower as 'light' | 'dark')
      } else {
        // If interactive, we still need to save the theme changes
        getVarsStore().setThemeSilent(themeCopy)
      }

      // If black or white changed, we must also update all palette on-tones
      // because they might be using black or white
      if (colorName === 'high-contrast' || colorName === 'low-contrast') {
        getVarsStore().aaWatcher?.checkAllPaletteOnTones()
      }

      // Compliance scan runs via scheduleComplianceScan after setTheme → recomputeAndApplyAll

  }

  const handleSelect = (tokenName: string) => {
    if (!targetVar) return

    // Parse token name: color/{family}/{level} or colors/{family}/{level}
    const tokenParts = tokenName.split('/')
    if (tokenParts.length !== 3 || (tokenParts[0] !== 'color' && tokenParts[0] !== 'colors')) {
      return
    }

    const family = tokenParts[1]
    const level = tokenParts[2] // Use actual level (000, 050, 900, 1000, etc.)
    const tokenCssVar = buildTokenCssVar(family, level)

    // Verify the CSS variable exists before trying to use it
    // Check both the prefixed and unprefixed versions
    const tokenVarValue = readCssVar(tokenCssVar) || readCssVar(tokenCssVar.replace('--recursica_', '--'))
    // Still try to set it even if variable doesn't exist yet - it might be created dynamically

    // Check if this is a core color CSS var
    const isCoreColor = targetVar.startsWith(`--recursica_brand_themes_${modeLower}_palettes_core-colors_`)

    // Check if this is an interactive color change
    const isInteractiveDefault = targetVar === `--recursica_brand_themes_${modeLower}_palettes_core-colors_interactive_tone` ||
      targetVar === `--recursica_brand_themes_${modeLower}_palettes_core-colors_interactive`

    if (isInteractiveDefault) {
      // Get the hex value for the selected token from tokens JSON (checking overrides first)
      const overrideMap = readOverrides()
      // Try new format first, then old format
      const tokenNameNew = `colors/${family}/${level}`
      const tokenNameOld = `color/${family}/${level}`
      const overrideValue = (overrideMap as any)[tokenNameNew] ?? (overrideMap as any)[tokenNameOld]

      // Try to get value from new colors structure
      let tokenValue: any = null
      const jsonColors: any = (tokensJson as any)?.tokens?.colors || {}
      for (const [scaleKey, scale] of Object.entries(jsonColors)) {
        if (!scaleKey.startsWith('scale-')) continue
        const scaleObj = scale as any
        const alias = scaleObj?.alias
        if (alias === family || scaleKey === family) {
          tokenValue = scaleObj?.[level]?.$value
          if (tokenValue) break
        }
      }

      const finalTokenValue = overrideValue ?? tokenValue

      let tokenHex: string | null = null

      if (typeof tokenValue === 'string' && /^#?[0-9a-f]{6}$/i.test(tokenValue)) {
        tokenHex = tokenValue
      } else {
        // Fallback to reading from CSS var
        tokenHex = tokenVarValue && !tokenVarValue.startsWith('var(')
          ? tokenVarValue
          : readCssVarResolved(tokenCssVar) || null
      }

      if (tokenHex && /^#?[0-9a-f]{6}$/i.test(tokenHex)) {
        const normalizedHex = tokenHex.startsWith('#') ? tokenHex.toLowerCase() : `#${tokenHex.toLowerCase()}`

        // Update CSS variable FIRST for immediate visual feedback (before setTheme triggers recompute)
        const tokenCssVar = buildTokenCssVar(family, level)
        const targetCssVar = `--recursica_brand_themes_${modeLower}_palettes_core-colors_interactive_tone`
        updateCssVar(targetCssVar, `var(${tokenCssVar})`, tokensJson)


          // Build token index to find which token matches the hex
          const tokenIndex = buildTokenIndex(tokensJson)

          // Determine default tone token reference
          const defaultToneRef = hexToCssVarRef(normalizedHex, tokensJson)

          // Keep current hover color
          const currentHover = readCssVar(`--recursica_brand_themes_${modeLower}_palettes_core-colors_interactive_hover_tone`)
          let hoverHex: string
          if (currentHover && !currentHover.startsWith('var(')) {
            hoverHex = currentHover
          } else {
            hoverHex = resolveCssVarToHex(`var(--recursica_brand_themes_${modeLower}_palettes_core-colors_interactive_hover_tone)`, tokenIndex) || normalizedHex
          }
          const hoverToneRef = hexToCssVarRef(hoverHex, tokensJson)

          // Determine on-tone colors
          const defaultOnTone = pickAAOnTone(normalizedHex)
          const hoverOnTone = pickAAOnTone(hoverHex)
          const coreKeyForOnTone = (onToneHex: string): 'high-contrast' | 'low-contrast' => {
            const wantsLight = onToneHex === '#ffffff'
            return wantsLight === (modeLower === 'dark') ? 'high-contrast' : 'low-contrast'
          }
          const defaultOnToneCore = coreKeyForOnTone(defaultOnTone)
          const hoverOnToneCore = coreKeyForOnTone(hoverOnTone)

          // Extract token names from CSS var references using central parser
          const extractTokenFromCssVarRef = (cssVarRef: string | null): string | null => {
            if (!cssVarRef) return null
            const parsed = extractColorToken(cssVarRef)
            if (!parsed) return null
            return colorTokenToPath(parsed.family, parsed.level)
          }

          const defaultToken = extractTokenFromCssVarRef(defaultToneRef)
          const hoverToken = extractTokenFromCssVarRef(hoverToneRef)

          // Update theme JSON FIRST (before updating CSS vars) to prevent flicker
          const themeCopy = getVarsStore().getLatestThemeCopy()
          const root: any = themeCopy?.brand ? themeCopy.brand : themeCopy
          const themes = root?.themes || root

          if (!themes[modeLower]) themes[modeLower] = {}
          if (!themes[modeLower].palettes) themes[modeLower].palettes = {}
          if (!themes[modeLower].palettes['core-colors']) themes[modeLower].palettes['core-colors'] = {}

          const coreColors = themes[modeLower].palettes['core-colors']
          if (!coreColors.interactive) {
            coreColors.interactive = {}
          }

          // Update tone in theme JSON (flat structure)
          if (defaultToken) {
            const tokenParts = defaultToken.split('/')
            // Use new format (colors) for token references
            const tokenRef = `{tokens.colors.${tokenParts[1]}.${tokenParts[2]}}`
            if (!coreColors.interactive.tone) coreColors.interactive.tone = {}
            coreColors.interactive.tone.$value = tokenRef
          }

          // Update on-tone in theme JSON (flat structure)
          coreColors.interactive['on-tone'] = {
            $value: `{brand.themes.${modeLower}.palettes.core-colors.${defaultOnToneCore}.tone}`
          }

          // Update theme JSON synchronously - CSS vars were already updated above
          // This includes the updated interactive values for each core color
          getVarsStore().setThemeSilent(themeCopy)

          // Update other interactive-related CSS vars (hover, on-tones, etc.)
          // The default-tone CSS var was already updated above, so this won't overwrite it
          // Use themeCopy instead of themeJson since we just updated it
          // Use modeLower instead of mode for consistency
          updateInteractiveColor(normalizedHex, 'keep', tokensJson, modeLower as 'light' | 'dark', themeCopy, setTheme)


        setAnchor(null)
        setTargetVar(null)
        return
      }
    }

    // Set the CSS variable FIRST for immediate visual feedback
    // For core colors, this will be preserved by recomputeAndApplyAll's preservation logic
    const success = updateCssVar(targetVar, `var(${tokenCssVar})`, tokensJson)
    if (!success) return

    // Also update any additional target CSS vars (e.g. multiple elevation levels)
    additionalTargetVars.forEach((v) => {
      if (v !== targetVar) updateCssVar(v, `var(${tokenCssVar})`, tokensJson)
    })

    // Trigger recalculation of targetResolvedValue to update checkmark
    setCssVarUpdateTrigger((prev) => prev + 1)

    // Also update theme JSON for core colors so changes persist across navigation
    // This will also check and update on-tone colors for AA compliance
    // The CSS variable we set above will be preserved by recomputeAndApplyAll's preservation logic
    if (isCoreColor) {
      updateCoreColorInTheme(targetVar, tokenName)
    }

    setAnchor(null)
    setTargetVar(null)
    setAdditionalTargetVars([])
  }


  const toTitle = (s: string) => (s || '').replace(/[-_/]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()).trim()
  const getFriendly = (family: string) => {
    const fromMap = (familyNames || {})[family]
    if (typeof fromMap === 'string' && fromMap.trim()) return fromMap
    return toTitle(family)
  }

  if (!anchor || !targetVar) return null

  const labelCol = 110
  const swatch = 24
  const gap = 1
  const CheckIcon = iconNameToReactComponent('check')

  const isNoneSelected = !targetResolvedValue?.direct || targetResolvedValue.direct === 'transparent' || targetResolvedValue.direct === 'null' || targetResolvedValue.direct === ''

  return (
    <FloatingPalette
      anchorElement={anchor}
      title="Pick a color"
      onClose={() => {
        setAnchor(null)
        setTargetVar(null)
      }}
      draggable={true}
      className="color-token-picker"
    >
      <div
        style={{
          display: 'grid',
          gap: `var(${getGlobalCssVar('form', 'properties', 'vertical-item-gap', mode)})`,
          minWidth: 280,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* "None" option */}
        <div style={{ display: 'grid', gridTemplateColumns: `${labelCol}px 1fr`, alignItems: 'center', gap: 6 }}>
          <Label size="small">None</Label>
          <div
            onClick={(e) => {
              e.stopPropagation()
              removeCssVar(targetVar)
              setAnchor(null)
              setTargetVar(null)
              window.dispatchEvent(new CustomEvent('cssVarsUpdated', { detail: { cssVars: [targetVar] } }))
            }}
            style={{
              width: swatch,
              height: swatch,
              cursor: 'pointer',
              background: 'transparent',
              border: `1px solid ${isNoneSelected ? `var(${paletteCore(modeLower, 'high-contrast')})` : `var(${layerProperty(modeLower, 3, 'border-color')})`}`,
              position: 'relative',
              padding: isNoneSelected ? '1px' : '0',
              borderRadius: isNoneSelected ? '5px' : '0',
              boxSizing: 'border-box',
            }}
          >
            <div style={{
              width: '100%',
              height: '100%',
              borderRadius: isNoneSelected ? '4px' : '0',
              position: 'relative',
              background: `var(--recursica_brand_themes_${modeLower}_layers_layer-3_properties_surface)`
            }}>
              <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                <line x1="10%" y1="90%" x2="90%" y2="10%" stroke={`var(--recursica_brand_themes_${modeLower}_palettes_neutral_500_color_tone)`} strokeWidth="1.5" />
              </svg>
              {isNoneSelected && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex' }}>
                  {CheckIcon ? <CheckIcon size={12} weight="bold" style={{ color: `var(--recursica_brand_themes_${modeLower}_palettes_core_high-contrast)` }} /> : '✓'}
                </div>
              )}
            </div>
          </div>
        </div>

        {Object.entries(options).map(([family, items]) => (
          <div key={family} style={{ display: 'grid', gridTemplateColumns: `${labelCol}px 1fr`, alignItems: 'center', gap: 6 }}>
            <Label size="small" style={{ textTransform: 'capitalize' }}>{getFriendly(family)}</Label>
            <div style={{ display: 'flex', flexWrap: 'nowrap', gap }}>
              {items.map((it) => {
                const isSelected = isTokenSelected(it.name, it.value)

                // Parse token name and build CSS variable for swatch background
                const tokenParts = it.name.split('/')
                let tokenCssVar: string | null = null
                if (tokenParts.length === 3 && (tokenParts[0] === 'color' || tokenParts[0] === 'colors')) {
                  const family = tokenParts[1]
                  const level = tokenParts[2]
                  tokenCssVar = buildTokenCssVar(family, level)
                }

                // Calculate checkmark color from hex for guaranteed contrast
                const hex = it.value.replace('#', '')
                const r = parseInt(hex.slice(0, 2), 16)
                const g = parseInt(hex.slice(2, 4), 16)
                const b = parseInt(hex.slice(4, 6), 16)
                const yiq = (r * 299 + g * 587 + b * 114) / 1000
                const checkColor = yiq < 128 ? '#ffffff' : '#000000'

                return (
                  <div
                    key={it.name}
                    title={it.name}
                    onClick={() => handleSelect(it.name)}
                    style={{
                      position: 'relative',
                      width: swatch,
                      height: swatch,
                      background: tokenCssVar ? `var(${tokenCssVar})` : it.value,
                      cursor: 'pointer',
                      border: `1px solid ${isSelected ? `var(--recursica_brand_themes_${modeLower}_palettes_core_high-contrast)` : `var(--recursica_brand_themes_${modeLower}_layers_layer-3_properties_border-color)`}`,
                      padding: isSelected ? '1px' : '0',
                      borderRadius: isSelected ? '5px' : '0',
                      boxSizing: 'border-box',
                      flex: '0 0 auto'
                    }}
                  >
                    {isSelected && (
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex' }}>
                        {CheckIcon ? <CheckIcon size={12} weight="bold" style={{ color: checkColor }} /> : <span style={{ color: checkColor }}>✓</span>}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </FloatingPalette>
  )
}

