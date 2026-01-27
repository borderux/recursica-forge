import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useVars } from '../vars/VarsContext'
import { readOverrides } from '../theme/tokenOverrides'
import { updateCssVar, clearPendingCssVars, suppressCssVarEvents } from '../../core/css/updateCssVar'
import { readCssVar, readCssVarResolved } from '../../core/css/readCssVar'
import { updateInteractiveColor, updateCoreColorInteractiveOnTones } from './interactiveColorUpdater'
import { buildTokenIndex } from '../../core/resolvers/tokens'
import { parseTokenReference, resolveTokenReferenceToValue, resolveTokenReferenceToCssVar, type TokenReferenceContext } from '../../core/utils/tokenReferenceParser'
import { hexToCssVarRef, getSteppedColor, resolveCssVarToHex, findColorFamilyAndLevel } from '../../core/compliance/layerColorStepping'
import { pickAAOnTone, contrastRatio } from '../theme/contrastUtil'
import { useThemeMode } from '../theme/ThemeModeContext'
import { tokenToCssVar } from '../../core/css/tokenRefs'
import { getVarsStore } from '../../core/store/varsStore'
import { updateCoreColorOnTonesForCompliance } from '../../core/compliance/coreColorAaCompliance'

export default function ColorTokenPicker() {
  const { tokens: tokensJson, theme: themeJson, setTheme } = useVars()
  const { mode } = useThemeMode()
  const modeLower = mode.toLowerCase() as 'light' | 'dark'
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [targetVar, setTargetVar] = useState<string | null>(null)
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: -9999, left: -9999 })
  const [familyNames, setFamilyNames] = useState<Record<string, string>>({})
  const [cssVarUpdateTrigger, setCssVarUpdateTrigger] = useState(0)
  
  // Close picker when mode changes
  useEffect(() => {
    const handleCloseAll = () => {
      setAnchor(null)
      setTargetVar(null)
    }
    window.addEventListener('closeAllPickersAndPanels', handleCloseAll)
    return () => window.removeEventListener('closeAllPickersAndPanels', handleCloseAll)
  }, [])
  
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
    
    // Also process old color structure for backwards compatibility
    const oldColors: any = (tokensJson as any)?.tokens?.color || {}
    Object.keys(oldColors).forEach((fam) => {
      if (fam === 'translucent') return
      if (!colorFamilyMap[fam]) {
        colorFamilyMap[fam] = new Set()
      }
      Object.keys(oldColors[fam] || {}).forEach((lvl) => {
        colorFamilyMap[fam].add(lvl)
      })
    })
    
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
          val = (overrideMap as any)[name] ?? (overrideMap as any)[`color/${fam}/${lvl}`] ?? (oldColors?.[fam]?.[lvl]?.$value)
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

  ;(window as any).openPicker = (el: HTMLElement, cssVar: string) => {
    setAnchor(el)
    setTargetVar(cssVar)
    // Calculate absolute position (relative to document, not viewport)
    const rect = el.getBoundingClientRect()
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft
    const scrollY = window.pageYOffset || document.documentElement.scrollTop
    const top = rect.bottom + scrollY + 8
    const left = Math.min(rect.left + scrollX, window.innerWidth - 420)
    setPos({ top, left })
  }

  // Helper: Build CSS variable name for a color token (matches varsStore format)
  // Always uses scale key (e.g., scale-01) instead of alias (e.g., cornflower)
  const buildTokenCssVar = (family: string, level: string): string => {
    const normalizedLevel = level === '000' ? '050' : level === '1000' ? '1000' : String(level).padStart(3, '0')
    
    // If family is already a scale key (starts with scale-), use it directly
    if (family.startsWith('scale-')) {
      return `--recursica-tokens-colors-${family}-${normalizedLevel}`
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
        return `--recursica-tokens-colors-${scaleKey}-${normalizedLevel}`
      }
    }
    
    // Fallback: if we can't find the scale, try the old format (for backwards compatibility)
    return `--recursica-tokens-colors-${family}-${normalizedLevel}`
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
    // Use --recursica-brand-themes- format to match varsStore.ts and palettes.ts
    const modeLower = mode.toLowerCase()
    const coreColorPrefix = `--recursica-brand-themes-${modeLower}-palettes-core-`
    if (!cssVar.startsWith(coreColorPrefix)) return // Not a core color
    
    // Extract the color name from the CSS var
    // Only update if this is a -tone variable, not -on-tone
    // We should always be updating the tone value, never the on-tone value
    if (cssVar.includes('-on-tone')) {
      console.warn(`updateCoreColorInTheme called with on-tone CSS variable: ${cssVar}. Skipping update - only tone values should be updated.`)
      return
    }
    
    // Extract color name - handle both -tone suffix and base (for backward compatibility)
    let colorName = cssVar.replace(coreColorPrefix, '')
    if (colorName.endsWith('-tone')) {
      colorName = colorName.replace('-tone', '')
    }
    
    // If it's the main interactive variable (not interactive-default-tone or interactive-hover-tone), handle it separately
    if (colorName === 'interactive' && !cssVar.includes('interactive-default-tone') && !cssVar.includes('interactive-hover-tone')) {
      // This is the main interactive var (backward compatibility) - treat as interactive-default
      colorName = 'interactive-default'
    }
    
    // Determine mapping based on color name
    let mapping: { isInteractive?: boolean; isHover?: boolean } | null = null
    if (colorName === 'black' || colorName === 'white' || colorName === 'alert' || colorName === 'warning' || colorName === 'success') {
      mapping = {}
    } else if (colorName === 'interactive') {
      mapping = { isInteractive: true }
    } else if (colorName === 'interactive-default') {
      mapping = { isInteractive: true }
    } else if (colorName === 'interactive-hover') {
      mapping = { isInteractive: true, isHover: true }
    }
    
    if (!mapping) return // Not a recognized core color
    
    try {
      const themeCopy = JSON.parse(JSON.stringify(themeJson))
      const root: any = themeCopy?.brand ? themeCopy.brand : themeCopy
      const themes = root?.themes || root
      
      // Navigate to core-colors.$value
      if (!themes[modeLower]) themes[modeLower] = {}
      if (!themes[modeLower].palettes) themes[modeLower].palettes = {}
      if (!themes[modeLower].palettes['core-colors']) themes[modeLower].palettes['core-colors'] = {}
      if (!themes[modeLower].palettes['core-colors'].$value) themes[modeLower].palettes['core-colors'].$value = {}
      
      const coreColors = themes[modeLower].palettes['core-colors'].$value
      
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
        const isMainInteractive = cssVar === `--recursica-brand-themes-${mode}-palettes-core-interactive`
        
        if (!coreColors.interactive) {
          coreColors.interactive = {
            default: { tone: { $value: tokenRef } },
            hover: { tone: { $value: tokenRef } }
          }
        } else {
          if (mapping.isHover) {
            if (!coreColors.interactive.hover) coreColors.interactive.hover = {}
            if (!coreColors.interactive.hover.tone) coreColors.interactive.hover.tone = {}
            coreColors.interactive.hover.tone.$value = tokenRef
          } else {
            // Update default tone (for both default-tone and main interactive vars)
            if (!coreColors.interactive.default) coreColors.interactive.default = {}
            if (!coreColors.interactive.default.tone) coreColors.interactive.default.tone = {}
            coreColors.interactive.default.tone.$value = tokenRef
          }
        }
      } else {
        // Simple core color (black, white, alert, warning, success)
        // Update tone.$value, preserving the structure
        if (!coreColors[colorName]) {
          coreColors[colorName] = {
            tone: { $value: tokenRef },
            'on-tone': { $value: `{brand.themes.${mode}.palettes.core-colors.white}` },
            interactive: { $value: `{tokens.colors.scale-05.300}` } // Default from Brand.json - will be updated by AA compliance if needed
          }
        } else {
          if (!coreColors[colorName].tone) coreColors[colorName].tone = {}
          coreColors[colorName].tone.$value = tokenRef
          
          // AA compliance is now manual via header button - removed automatic on-tone update
          // Preserve existing on-tone if it exists, otherwise set default
          if (!coreColors[colorName]['on-tone']) {
            coreColors[colorName]['on-tone'] = { $value: `{brand.themes.${mode}.palettes.core-colors.white}` }
          }
        }
      }
      
      // For base color tones (not interactive), update all other base colors' on-tone values
      // This works similarly to how interactive color updates all base colors' interactive properties
      // We do this BEFORE setTheme so we can use themeCopy which has the updated tone
      if (!mapping.isInteractive && normalizedToneHex) {
        const coreColorNames = ['black', 'white', 'alert', 'warning', 'success']
        const tokenIndex = buildTokenIndex(tokensJson)
        const root: any = themeCopy?.brand ? themeCopy.brand : themeCopy
        const themes = root?.themes || root
        const coreColorsObj = themes?.[modeLower]?.palettes?.['core-colors']?.$value || {}
        
        // Get OLD white tone scale key from current theme (before update) for comparison
        // We need to check if on-tones are using the OLD white, not the new one
        const oldRoot: any = themeJson?.brand ? themeJson.brand : themeJson
        const oldThemes = oldRoot?.themes || oldRoot
        const oldCoreColorsObj = oldThemes?.[modeLower]?.palettes?.['core-colors']?.$value || {}
        const oldWhiteColorDef = oldCoreColorsObj.white
        let oldWhiteScaleKey: string | null = null
        if (oldWhiteColorDef?.tone?.$value) {
          const oldWhiteToneRef = oldWhiteColorDef.tone.$value
          if (typeof oldWhiteToneRef === 'string' && oldWhiteToneRef.startsWith('{tokens.colors.')) {
            const oldWhiteMatch = oldWhiteToneRef.match(/\{tokens\.colors\.([^.]+)\.(\d+)\}/)
            if (oldWhiteMatch) {
              oldWhiteScaleKey = oldWhiteMatch[1]
            }
          }
        }
        
        // Helper function to check if an on-tone is currently using white (the OLD white)
        const isOnToneUsingWhite = (onToneColorName: string): boolean => {
          if (!oldWhiteScaleKey) return false
          
          const onToneVar = `--recursica-brand-themes-${modeLower}-palettes-core-${onToneColorName}-on-tone`
          const onToneValue = readCssVar(onToneVar)
          if (!onToneValue) return false
          
          // Check if it's a direct reference to white core color
          // Format: var(--recursica-brand-themes-light-palettes-core-white)
          if (onToneValue.includes('palettes-core-white')) {
            return true
          }
          
          // Parse the on-tone CSS var value to see which scale it's using
          // The on-tone value should be a CSS var like var(--recursica-tokens-colors-scale-XX-level)
          // or a token reference like {tokens.colors.scale-XX.level}
          const context: TokenReferenceContext = {
            currentMode: modeLower as 'light' | 'dark',
            tokenIndex,
            theme: themeJson // Use old theme for context
          }
          
          // Try to parse as token reference first
          const parsed = parseTokenReference(onToneValue, context)
          if (parsed && parsed.type === 'token' && parsed.path.length >= 3 && parsed.path[0] === 'colors') {
            const onToneScaleKey = parsed.path[1]
            return onToneScaleKey === oldWhiteScaleKey
          }
          
          // If it's a CSS var, extract the scale key from the var name
          // Format: var(--recursica-tokens-colors-scale-XX-level)
          const cssVarMatch = onToneValue.match(/--recursica-tokens-colors-([^-]+)-(\d+)/)
          if (cssVarMatch) {
            const onToneScaleKey = cssVarMatch[1]
            return onToneScaleKey === oldWhiteScaleKey
          }
          
          // Also check if it resolves to white by resolving the CSS var to hex and checking
          // if that hex matches the old white tone hex
          const resolvedHex = resolveCssVarToHex(onToneValue, tokenIndex)
          if (resolvedHex) {
            // Get old white tone hex for comparison
            const oldWhiteToneRef = oldWhiteColorDef?.tone?.$value
            if (oldWhiteToneRef && typeof oldWhiteToneRef === 'string' && oldWhiteToneRef.startsWith('{tokens.colors.')) {
              const oldWhiteMatch = oldWhiteToneRef.match(/\{tokens\.colors\.([^.]+)\.(\d+)\}/)
              if (oldWhiteMatch) {
                const [, scaleKey, level] = oldWhiteMatch
                const normalizedLevel = level === '000' ? '050' : level
                const oldWhiteHex = tokenIndex.get(`colors/${scaleKey}/${normalizedLevel}`)
                if (typeof oldWhiteHex === 'string') {
                  const normalizedOldWhiteHex = oldWhiteHex.startsWith('#') ? oldWhiteHex.toLowerCase() : `#${oldWhiteHex.toLowerCase()}`
                  const normalizedResolvedHex = resolvedHex.startsWith('#') ? resolvedHex.toLowerCase() : `#${resolvedHex.toLowerCase()}`
                  if (normalizedResolvedHex === normalizedOldWhiteHex) {
                    return true
                  }
                }
              }
            }
          }
          
          return false
        }
        
        // Update on-tone values for all base colors (including the one that changed)
        // This ensures all on-tones are AA-compliant with their respective tones
        // Use themeCopy which has the updated black/white tone values
        coreColorNames.forEach((otherColorName) => {
          // If white changed:
          // - Always update white's own on-tone (regardless of what it's currently using)
          // - For other colors, only update if their on-tone is currently using white
          if (colorName === 'white' && oldWhiteScaleKey) {
            // Always update white's own on-tone when white changes
            if (otherColorName === 'white') {
              // Continue to update white's on-tone
            } else {
              // For other colors, only update if they're using white
              if (!isOnToneUsingWhite(otherColorName)) {
                return // Skip this color - its on-tone is not using white
              }
            }
          }
          
          // Get the tone hex for this other color from themeCopy (not CSS vars, since they might not be updated yet)
          const otherColorDef = coreColorsObj[otherColorName]
          let otherToneHex: string | null = null
          
          if (otherColorDef?.tone?.$value) {
            // Resolve the tone reference from themeCopy
            const toneRef = otherColorDef.tone.$value
            if (typeof toneRef === 'string' && toneRef.startsWith('{tokens.colors.')) {
              // Parse token reference: {tokens.colors.scale-XX.level}
              const match = toneRef.match(/\{tokens\.colors\.([^.]+)\.(\d+)\}/)
              if (match) {
                const [, scaleKey, level] = match
                const normalizedLevel = level === '000' ? '050' : level
                otherToneHex = tokenIndex.get(`colors/${scaleKey}/${normalizedLevel}`)
                if (typeof otherToneHex === 'string') {
                  otherToneHex = otherToneHex.startsWith('#') ? otherToneHex.toLowerCase() : `#${otherToneHex.toLowerCase()}`
                }
              }
            }
          }
          
          // Fallback: try to read from CSS var if theme doesn't have it
          if (!otherToneHex || otherToneHex === '#000000') {
            const otherToneCssVar = `--recursica-brand-themes-${modeLower}-palettes-core-${otherColorName}-tone`
            const otherToneValue = readCssVarResolved(otherToneCssVar) || readCssVar(otherToneCssVar)
            otherToneHex = otherToneValue 
              ? (resolveCssVarToHex(otherToneValue, tokenIndex) || '#000000')
              : '#000000'
          }
          
          if (otherToneHex && otherToneHex !== '#000000') {
            // Update on-tone for this color - this updates CSS vars directly
            // The function will read the updated black/white tones from themeCopy
            // Force update to ensure we re-check with the new black/white tone values
            updateCoreColorOnTonesForCompliance(
              otherColorName as 'black' | 'white' | 'alert' | 'warning' | 'success',
              otherToneHex,
              tokensJson,
              themeCopy, // Use themeCopy which has the updated black/white tone
              setTheme,
              modeLower as 'light' | 'dark',
              true // forceUpdate = true to always re-check when a base color tone changes
            )
          }
        })
      }
      
      setTheme(themeCopy)
      
      // After core color changes, trigger AA compliance checks
      // This updates all layers and all palette on-tones
      setTimeout(() => {
        const varsStore = getVarsStore()
        if (varsStore.aaWatcher) {
          // Suppress CSS var events during AA compliance check
          suppressCssVarEvents(true)
          
          // Update the watcher with the latest theme so it has the updated core color values
          varsStore.aaWatcher.updateTokensAndTheme(tokensJson, themeCopy)
          
          // Update all layers (0-3) for both modes
          varsStore.aaWatcher.updateAllLayers()
          
          // Update all palette on-tones (core color changes affect all palettes)
          // CSS vars only, never JSON
          varsStore.aaWatcher.checkAllPaletteOnTones()
          
          setTimeout(() => {
            clearPendingCssVars()
            suppressCssVarEvents(false)
          }, 100)
        }
      }, 0)
    } catch (err) {
      console.error('Failed to update core color in theme JSON:', err)
    }
  }

  const handleSelect = (tokenName: string) => {
    if (!targetVar) return
    
    // Parse token name: color/{family}/{level} or colors/{family}/{level}
    const tokenParts = tokenName.split('/')
    if (tokenParts.length !== 3 || (tokenParts[0] !== 'color' && tokenParts[0] !== 'colors')) {
      console.warn('Invalid token name format:', tokenName)
      return
    }
    
    const family = tokenParts[1]
    const level = tokenParts[2] // Use actual level (000, 050, 900, 1000, etc.)
    const tokenCssVar = buildTokenCssVar(family, level)
    
    // Verify the CSS variable exists before trying to use it
    // Check both the prefixed and unprefixed versions
    const tokenVarValue = readCssVar(tokenCssVar) || readCssVar(tokenCssVar.replace('--recursica-', '--'))
    // Still try to set it even if variable doesn't exist yet - it might be created dynamically
    
    // Check if this is a core color CSS var
    const isCoreColor = targetVar.startsWith(`--recursica-brand-themes-${modeLower}-palettes-core-`)
    
    // Check if this is an interactive color change
    const isInteractiveDefault = targetVar === `--recursica-brand-themes-${modeLower}-palettes-core-interactive-default-tone` ||
                                  targetVar === `--recursica-brand-themes-${modeLower}-palettes-core-interactive`
    
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
      // Fallback to old structure
      if (!tokenValue) {
        const oldColors: any = (tokensJson as any)?.tokens?.color || {}
        tokenValue = oldColors?.[family]?.[level]?.$value ?? oldColors?.[family]?.[level]
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
        const targetCssVar = `--recursica-brand-themes-${modeLower}-palettes-core-interactive-default-tone`
        updateCssVar(targetCssVar, `var(${tokenCssVar})`, tokensJson)
        
        // Directly update interactive color with 'keep' option (keep current hover)
        if (!setTheme || !themeJson || !tokensJson) {
          // Fallback: just update CSS vars if we can't update theme
          updateInteractiveColor(normalizedHex, 'keep', tokensJson, modeLower as 'light' | 'dark', themeJson, setTheme)
          setAnchor(null)
          setTargetVar(null)
          // Trigger AA compliance check for core colors
          setTimeout(() => {
            try {
              window.dispatchEvent(new CustomEvent('recheckCoreColorInteractiveOnTones'))
            } catch {}
          }, 10)
          return
        }
        
        try {
          // Build token index to find which token matches the hex
          const tokenIndex = buildTokenIndex(tokensJson)
          
          // Determine default tone token reference
          const defaultToneRef = hexToCssVarRef(normalizedHex, tokensJson)
          
          // Keep current hover color
          const currentHover = readCssVar(`--recursica-brand-themes-${modeLower}-palettes-core-interactive-hover-tone`)
          let hoverHex: string
          if (currentHover && !currentHover.startsWith('var(')) {
            hoverHex = currentHover
          } else {
            hoverHex = resolveCssVarToHex(`var(--recursica-brand-themes-${modeLower}-palettes-core-interactive-hover-tone)`, tokenIndex) || normalizedHex
          }
          const hoverToneRef = hexToCssVarRef(hoverHex, tokensJson)
          
          // Determine on-tone colors
          const defaultOnTone = pickAAOnTone(normalizedHex)
          const hoverOnTone = pickAAOnTone(hoverHex)
          const defaultOnToneCore = defaultOnTone === '#ffffff' ? 'white' : 'black'
          const hoverOnToneCore = hoverOnTone === '#ffffff' ? 'white' : 'black'
          
          // Extract token names from CSS var references
          const extractTokenFromCssVarRef = (cssVarRef: string | null): string | null => {
            if (!cssVarRef || !cssVarRef.startsWith('var(')) return null
            // Support both old format (--recursica-tokens-color-...) and new format (--recursica-tokens-colors-...)
            const match = cssVarRef.match(/var\(--recursica-tokens-colors?-([a-z0-9_-]+)-(\d{3,4})\)/)
            if (match) {
              const family = match[1]
              const level = match[2]
              const normalizedLevel = level === '000' ? '000' : level === '1000' ? '1000' : String(Number(level))
              // Return new format (colors/...) for consistency
              return `colors/${family}/${normalizedLevel}`
            }
            return null
          }
          
          const defaultToken = extractTokenFromCssVarRef(defaultToneRef)
          const hoverToken = extractTokenFromCssVarRef(hoverToneRef)
          
          // Update theme JSON FIRST (before updating CSS vars) to prevent flicker
          const themeCopy = JSON.parse(JSON.stringify(themeJson))
          const root: any = themeCopy?.brand ? themeCopy.brand : themeCopy
          const themes = root?.themes || root
          
          if (!themes[modeLower]) themes[modeLower] = {}
          if (!themes[modeLower].palettes) themes[modeLower].palettes = {}
          if (!themes[modeLower].palettes['core-colors']) themes[modeLower].palettes['core-colors'] = {}
          if (!themes[modeLower].palettes['core-colors'].$value) themes[modeLower].palettes['core-colors'].$value = {}
          
          const coreColors = themes[modeLower].palettes['core-colors'].$value
          if (!coreColors.interactive) {
            coreColors.interactive = { default: {}, hover: {} }
          }
          
          // Update tone colors in theme JSON
          if (defaultToken) {
            const tokenParts = defaultToken.split('/')
            // Use new format (colors) for token references
            const tokenRef = `{tokens.colors.${tokenParts[1]}.${tokenParts[2]}}`
            if (!coreColors.interactive.default) coreColors.interactive.default = {}
            if (!coreColors.interactive.default.tone) coreColors.interactive.default.tone = {}
            coreColors.interactive.default.tone.$value = tokenRef
          }
          
          if (hoverToken) {
            const tokenParts = hoverToken.split('/')
            // Use new format (colors) for token references
            const tokenRef = `{tokens.colors.${tokenParts[1]}.${tokenParts[2]}}`
            if (!coreColors.interactive.hover) coreColors.interactive.hover = {}
            if (!coreColors.interactive.hover.tone) coreColors.interactive.hover.tone = {}
            coreColors.interactive.hover.tone.$value = tokenRef
          }
          
          // Update on-tone colors in theme JSON
          if (!coreColors.interactive.default) coreColors.interactive.default = {}
          coreColors.interactive.default['on-tone'] = {
            $value: `{brand.themes.${modeLower}.palettes.core-colors.${defaultOnToneCore}}`
          }
          
          if (!coreColors.interactive.hover) coreColors.interactive.hover = {}
          coreColors.interactive.hover['on-tone'] = {
            $value: `{brand.themes.${modeLower}.palettes.core-colors.${hoverOnToneCore}}`
          }
          
          // Update core color interactive properties in theme JSON BEFORE calling setTheme
          // This ensures recomputeAndApplyAll generates the correct CSS variables
          if (themeCopy && tokensJson) {
            // Update theme JSON with new interactive values for each core color
            const tokenIndex = buildTokenIndex(tokensJson)
            const AA = 4.5
            const LEVELS = ['000', '050', '100', '200', '300', '400', '500', '600', '700', '800', '900', '1000']
            const coreColors = ['black', 'white', 'alert', 'warning', 'success']
            
            // Find the interactive color's family and level for stepping
            // findColorFamilyAndLevel now returns scale keys directly, not aliases
            const interactiveFamily = findColorFamilyAndLevel(normalizedHex, tokensJson)
            if (interactiveFamily) {
              const { family: interactiveScaleKey, level: interactiveLevel } = interactiveFamily
              const normalizedInteractiveLevel = interactiveLevel === '000' ? '050' : interactiveLevel
              const startIdx = LEVELS.indexOf(normalizedInteractiveLevel)
              
              if (startIdx !== -1 && interactiveScaleKey) {
                const coreColorsPath = themes[modeLower].palettes['core-colors'].$value
                
                // Helper to resolve tone reference to hex
                const context: TokenReferenceContext = {
                  currentMode: modeLower as 'light' | 'dark',
                  tokenIndex,
                  theme: { brand: { themes: themes } }
                }
                const resolveRef = (ref: string): string | null => {
                  const resolved = resolveTokenReferenceToValue(ref, context)
                  if (typeof resolved === 'string') {
                    const hex = resolved.trim()
                    if (/^#?[0-9a-f]{6}$/i.test(hex)) {
                      return hex.startsWith('#') ? hex.toLowerCase() : `#${hex.toLowerCase()}`
                    }
                    if (resolved.startsWith('{') && resolved.endsWith('}')) {
                      return resolveRef(resolved)
                    }
                  }
                  return null
                }
                
                // For each core color, update its interactive property
                for (const colorName of coreColors) {
                  const colorDef = coreColorsPath[colorName]
                  if (!colorDef) continue
                  
                  const toneRef = colorDef.tone?.$value
                  if (!toneRef) continue
                  
                  const toneHex = resolveRef(toneRef)
                  if (!toneHex) continue
                  
                  // Step through interactive scale to find AA-compliant color
                  let interactiveRef: string | null = null
                  let bestContrast = 0
                  let bestLevel: string | null = null
                  
                  // First, check the current interactive color itself
                  const currentContrast = contrastRatio(toneHex, normalizedHex)
                  if (currentContrast >= AA) {
                    // Use scale key, not alias, for token reference
                    interactiveRef = `{tokens.colors.${interactiveScaleKey}.${normalizedInteractiveLevel}}`
                  } else {
                    bestContrast = currentContrast
                    bestLevel = normalizedInteractiveLevel
                    
                    // Try ALL levels in the interactive scale, alternating from the starting point
                    const searchOrder: number[] = []
                    for (let offset = 1; offset < LEVELS.length; offset++) {
                      // Try lighter first
                      if (startIdx - offset >= 0) {
                        searchOrder.push(startIdx - offset)
                      }
                      // Then darker
                      if (startIdx + offset < LEVELS.length) {
                        searchOrder.push(startIdx + offset)
                      }
                    }
                    
                    // Search in alternating order
                    for (const testIdx of searchOrder) {
                      const testLevel = LEVELS[testIdx]
                      const normalizedTestLevel = testLevel === '000' ? '050' : testLevel
                      // Use scale key for lookup (e.g., colors/scale-05/900)
                      // interactiveScaleKey is now always a scale key, not an alias
                      const testHex = tokenIndex.get(`colors/${interactiveScaleKey}/${normalizedTestLevel}`)
                      if (typeof testHex === 'string') {
                        const hex = testHex.startsWith('#') ? testHex.toLowerCase() : `#${testHex.toLowerCase()}`
                        const testContrast = contrastRatio(toneHex, hex)
                        if (testContrast >= AA) {
                          // Use scale key for token reference
                          interactiveRef = `{tokens.colors.${interactiveScaleKey}.${normalizedTestLevel}}`
                          break
                        }
                        // Track best contrast even if it doesn't pass
                        if (testContrast > bestContrast) {
                          bestContrast = testContrast
                          bestLevel = normalizedTestLevel
                        }
                      }
                    }
                    
                    // If no color passed, use the original interactive color (the one user selected)
                    // This will show the warning triangle in the UI
                    if (!interactiveRef) {
                      // Use scale key, not alias, for token reference
                      interactiveRef = `{tokens.colors.${interactiveScaleKey}.${normalizedInteractiveLevel}}`
                    }
                  }
                  
                  // Update interactive property in theme JSON
                  if (interactiveRef) {
                    if (!colorDef.interactive) {
                      colorDef.interactive = {}
                    }
                    colorDef.interactive.$value = interactiveRef
                  }
                }
              }
            }
          }
          
          // Directly update CSS variables for all core color interactive properties BEFORE setTheme
          // This ensures immediate visual feedback and prevents recomputeAndApplyAll from overwriting
          // Use the updated themeCopy structure for proper resolution
          const rootForCssVar: any = themeCopy?.brand ? themeCopy.brand : themeCopy
          const themesForCssVar = rootForCssVar?.themes || rootForCssVar
          const coreColorsPath = themesForCssVar[modeLower]?.palettes?.['core-colors']?.$value
          
          if (coreColorsPath) {
            const coreColorNames = ['black', 'white', 'alert', 'warning', 'success']
            const contextForCssVar: TokenReferenceContext = {
              currentMode: modeLower as 'light' | 'dark',
              tokenIndex: buildTokenIndex(tokensJson),
              theme: themeCopy
            }
            
            coreColorNames.forEach((colorName) => {
              const colorDef = coreColorsPath[colorName]
              if (!colorDef) return
              
              const interactiveRef = colorDef.interactive?.$value
              if (!interactiveRef) return
              
              const interactiveCssVar = `--recursica-brand-themes-${modeLower}-palettes-core-${colorName}-interactive`
              const cssVarValue = resolveTokenReferenceToCssVar(interactiveRef, contextForCssVar)
              if (cssVarValue) {
                updateCssVar(interactiveCssVar, cssVarValue, tokensJson)
              }
            })
          }
          
          // Update theme JSON synchronously - CSS vars were already updated above
          // This includes the updated interactive values for each core color
          setTheme(themeCopy)
          
          // Update other interactive-related CSS vars (hover, on-tones, etc.)
          // The default-tone CSS var was already updated above, so this won't overwrite it
          // Use themeCopy instead of themeJson since we just updated it
          // Use modeLower instead of mode for consistency
          updateInteractiveColor(normalizedHex, 'keep', tokensJson, modeLower as 'light' | 'dark', themeCopy, setTheme)

          // Update CSS variables for core color interactive properties
          // AA compliance is now manual via header button - removed automatic call
          // if (setTheme && themeCopy) {
          //   updateCoreColorInteractiveOnTones(normalizedHex, tokensJson, themeCopy, setTheme, mode)
          // }
          
          // AA compliance is now manual via header button - removed automatic call
        } catch (err) {
          console.error('Failed to update interactive color:', err)
          // Fallback: just update CSS vars (CSS var was already updated above)
          // updateInteractiveColor will update hover and on-tones, but won't overwrite default-tone
          updateInteractiveColor(normalizedHex, 'keep', tokensJson, modeLower as 'light' | 'dark', themeJson, setTheme)
          // AA compliance is now manual via header button - removed automatic call
        }
        
        setAnchor(null)
        setTargetVar(null)
        return
      }
    }
    
    // Set the CSS variable FIRST for immediate visual feedback
    // For core colors, this will be preserved by recomputeAndApplyAll's preservation logic
    const success = updateCssVar(targetVar, `var(${tokenCssVar})`, tokensJson)
    if (!success) {
      console.error(`Failed to update ${targetVar} to var(${tokenCssVar})`)
      return
    }
    
    // Trigger recalculation of targetResolvedValue to update checkmark
    setCssVarUpdateTrigger((prev) => prev + 1)
    
    // Also update theme JSON for core colors so changes persist across navigation
    // This will also check and update on-tone colors for AA compliance
    // The CSS variable we set above will be preserved by recomputeAndApplyAll's preservation logic
    if (isCoreColor) {
      // Use requestAnimationFrame to ensure CSS variable is set in DOM before setTheme triggers recompute
      requestAnimationFrame(() => {
        updateCoreColorInTheme(targetVar, tokenName)
      })
      
      // Dispatch cssVarsUpdated event to trigger on-tone updates
      setTimeout(() => {
        try {
          window.dispatchEvent(new CustomEvent('cssVarsUpdated', { 
            detail: { cssVars: [targetVar] } 
          }))
        } catch {}
      }, 0)
    }
    
    setAnchor(null)
    setTargetVar(null)
  }


  const toTitle = (s: string) => (s || '').replace(/[-_/]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()).trim()
  const getFriendly = (family: string) => {
    const fromMap = (familyNames || {})[family]
    if (typeof fromMap === 'string' && fromMap.trim()) return fromMap
    return toTitle(family)
  }
  const labelCol = 110
  const swatch = 18
  const gap = 1
  // Calculate max width for swatches to wrap nicely (about 12 swatches per row)
  const maxSwatchWidth = 12 * (swatch + gap) - gap

  return (
    <>
      {anchor && targetVar && (
        createPortal(
          <div style={{ position: 'absolute', top: pos.top, left: pos.left, width: 'fit-content', maxWidth: '90vw', background: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-surface)`, color: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-text-color)`, border: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-thickness) solid var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-color)`, borderRadius: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-radius)`, boxShadow: `var(--recursica-brand-themes-${mode}-elevations-elevation-4-x-axis, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-4-y-axis, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-4-blur, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-4-spread, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-4-shadow-color, rgba(0, 0, 0, 0.1))`, padding: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-padding)`, zIndex: 20000 }}>
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, cursor: 'move' }}
              onMouseDown={(e) => {
                const startX = e.clientX
                const startY = e.clientY
                const start = { ...pos }
                const move = (ev: MouseEvent) => {
                  const dx = ev.clientX - startX
                  const dy = ev.clientY - startY
                  // Use a ref or calculate width dynamically, but for now use a reasonable estimate
                  const estimatedWidth = labelCol + maxSwatchWidth + 32
                  const next = { left: Math.max(0, Math.min(window.innerWidth - estimatedWidth, start.left + dx)), top: Math.max(0, Math.min(window.innerHeight - 120, start.top + dy)) }
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
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap, maxWidth: maxSwatchWidth, overflow: 'visible' }}>
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
                            border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-color)`, 
                            flex: '0 0 auto' 
                          }}
                        >
                          {isSelected && (
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 12 12"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                pointerEvents: 'none',
                              }}
                            >
                              {/* White checkmark with dark shadow for visibility on any background */}
                              <path
                                d="M2 6L5 9L10 2"
                                stroke={`var(--recursica-brand-themes-${mode}-palettes-core-black)`}
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                opacity="0.4"
                              />
                              <path
                                d="M2 6L5 9L10 2"
                                stroke={`var(--recursica-brand-themes-${mode}-palettes-core-white)`}
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>,
          document.body
        )
      )}
    </>
  )
}

