import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useVars } from '../vars/VarsContext'
import { readOverrides } from '../theme/tokenOverrides'
import { updateCssVar } from '../../core/css/updateCssVar'
import { readCssVar, readCssVarResolved } from '../../core/css/readCssVar'
import { updateInteractiveColor, updateCoreColorInteractiveOnTones } from './interactiveColorUpdater'
import { buildTokenIndex } from '../../core/resolvers/tokens'
import { hexToCssVarRef, getSteppedColor, resolveCssVarToHex, findColorFamilyAndLevel } from '../../core/compliance/layerColorStepping'
import { pickAAOnTone, contrastRatio } from '../theme/contrastUtil'
import { useThemeMode } from '../theme/ThemeModeContext'

export default function ColorTokenPicker() {
  const { tokens: tokensJson, theme: themeJson, setTheme } = useVars()
  const { mode } = useThemeMode()
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
        .filter((lvl) => /^(\d{2,4}|000)$/.test(lvl))
      const levelSet = new Set<string>([...jsonLevels, ...overrideLevels])
      const allLevels = Array.from(levelSet)
      
      // Show all levels including 000 and 1000 - no deduplication
      byFamily[fam] = allLevels.map((lvl) => {
        const name = `color/${fam}/${lvl}`
        const val = (overrideMap as any)[name] ?? (jsonColors?.[fam]?.[lvl]?.$value)
        return { level: lvl, name, value: String(val ?? '') }
      }).filter((it) => it.value && /^#?[0-9a-fA-F]{6}$/.test(String(it.value).trim()))
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
    const rect = el.getBoundingClientRect()
    const top = rect.bottom + 8
    const left = Math.min(rect.left, window.innerWidth - 420)
    setPos({ top, left })
  }

  // Helper: Build CSS variable name for a color token (matches varsStore format)
  const buildTokenCssVar = (family: string, level: string): string => {
    // padStart(3) keeps 1000 as "1000" (4 digits), pads others to 3 digits
    const paddedLevel = String(level).padStart(3, '0')
    return `--recursica-tokens-color-${family}-${paddedLevel}`
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
    
    // Parse token name: color/{family}/{level}
    const tokenParts = tokenName.split('/')
    if (tokenParts.length !== 3 || tokenParts[0] !== 'color') return false
    
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
    const coreColorPrefix = `--recursica-brand-${mode}-palettes-core-`
    if (!cssVar.startsWith(coreColorPrefix)) return // Not a core color
    
    // Extract the color name from the CSS var
    const colorName = cssVar.replace(coreColorPrefix, '').replace('-tone', '')
    
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
      if (!themes[mode]) themes[mode] = {}
      if (!themes[mode].palettes) themes[mode].palettes = {}
      if (!themes[mode].palettes['core-colors']) themes[mode].palettes['core-colors'] = {}
      if (!themes[mode].palettes['core-colors'].$value) themes[mode].palettes['core-colors'].$value = {}
      
      const coreColors = themes[mode].palettes['core-colors'].$value
      
      // Build the token reference string: {tokens.color.{family}.{level}}
      const tokenParts = tokenName.split('/')
      const family = tokenParts[1]
      const level = tokenParts[2]
      const tokenRef = `{tokens.color.${family}.${level}}`
      
      // Get the hex value of the new tone for AA compliance checking
      const tokenIndex = buildTokenIndex(tokensJson)
      const toneHex = tokenIndex.get(`color/${family}/${level}`)
      const normalizedToneHex = typeof toneHex === 'string' 
        ? (toneHex.startsWith('#') ? toneHex.toLowerCase() : `#${toneHex.toLowerCase()}`)
        : null
      
      // Handle interactive colors with nested structure
      if (mapping.isInteractive) {
        // For main interactive var (backward compatibility), it maps to default.tone
        const isMainInteractive = cssVar === `--recursica-brand-${mode}-palettes-core-interactive`
        
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
            interactive: { $value: `{brand.themes.${mode}.palettes.core-colors.white}` }
          }
        } else {
          if (!coreColors[colorName].tone) coreColors[colorName].tone = {}
          coreColors[colorName].tone.$value = tokenRef
          
          // Check and update on-tone color for AA compliance
          if (normalizedToneHex) {
            const onToneHex = pickAAOnTone(normalizedToneHex)
            const onToneCore = onToneHex === '#ffffff' ? 'white' : 'black'
            if (!coreColors[colorName]['on-tone']) coreColors[colorName]['on-tone'] = {}
            coreColors[colorName]['on-tone'].$value = `{brand.themes.${mode}.palettes.core-colors.${onToneCore}}`
            
            // Check and update interactive on-tone color for AA compliance
            // Get current interactive color reference
            const currentInteractiveRef = coreColors[colorName].interactive?.$value
            if (currentInteractiveRef) {
              // Resolve interactive color to hex
              const resolveRef = (ref: string): string | null => {
                if (ref.startsWith('{') && ref.endsWith('}')) {
                  const inner = ref.slice(1, -1).trim()
                  if (inner.startsWith('tokens.color.')) {
                    const path = inner.replace('tokens.color.', '').replace(/\./g, '/')
                    const hex = tokenIndex.get(`color/${path}`)
                    if (typeof hex === 'string') {
                      return hex.startsWith('#') ? hex.toLowerCase() : `#${hex.toLowerCase()}`
                    }
                  } else if (inner.startsWith('brand.themes.')) {
                    const parts = inner.split('.')
                    let node: any = themes
                    for (const p of parts.slice(2)) {
                      if (!node) break
                      node = node[p]
                    }
                    if (node && typeof node === 'object' && '$value' in node) {
                      return resolveRef(node.$value)
                    }
                  }
                }
                return null
              }
              
              const interactiveHex = resolveRef(currentInteractiveRef)
              if (interactiveHex) {
                // Check contrast between tone and interactive color
                const AA = 4.5
                const contrast = contrastRatio(normalizedToneHex, interactiveHex)
                
                let accessibleRef: string | null = null
                
                if (contrast >= AA) {
                  // Current interactive color is accessible, keep it
                  accessibleRef = currentInteractiveRef
                } else {
                  // Need to find an accessible color
                  const interactiveFamily = findColorFamilyAndLevel(interactiveHex, tokensJson)
                  
                  if (interactiveFamily) {
                    const LEVELS = ['000', '050', '100', '200', '300', '400', '500', '600', '700', '800', '900', '1000']
                    const { family, level } = interactiveFamily
                    const normalizedLevel = level === '000' ? '050' : level
                    const startIdx = LEVELS.indexOf(normalizedLevel)
                    
                    if (startIdx !== -1) {
                      // Try lighter first
                      for (let i = startIdx - 1; i >= 0; i--) {
                        const testLevel = LEVELS[i]
                        const normalizedTestLevel = testLevel === '000' ? '050' : testLevel
                        const testHex = tokenIndex.get(`color/${family}/${normalizedTestLevel}`)
                        if (typeof testHex === 'string') {
                          const hex = testHex.startsWith('#') ? testHex.toLowerCase() : `#${testHex.toLowerCase()}`
                          const testContrast = contrastRatio(normalizedToneHex, hex)
                          if (testContrast >= AA) {
                            accessibleRef = `{tokens.color.${family}.${normalizedTestLevel}}`
                            break
                          }
                        }
                      }
                      
                      // If no lighter color found, try darker
                      if (!accessibleRef) {
                        for (let i = startIdx + 1; i < LEVELS.length; i++) {
                          const testLevel = LEVELS[i]
                          const normalizedTestLevel = testLevel === '000' ? '050' : testLevel
                          const testHex = tokenIndex.get(`color/${family}/${normalizedTestLevel}`)
                          if (typeof testHex === 'string') {
                            const hex = testHex.startsWith('#') ? testHex.toLowerCase() : `#${testHex.toLowerCase()}`
                            const testContrast = contrastRatio(normalizedToneHex, hex)
                            if (testContrast >= AA) {
                              accessibleRef = `{tokens.color.${family}.${normalizedTestLevel}}`
                              break
                            }
                          }
                        }
                      }
                    }
                  }
                  
                  // If still no accessible color found, try white then black
                  if (!accessibleRef) {
                    const whiteHex = '#ffffff'
                    const blackHex = '#000000'
                    const whiteContrast = contrastRatio(normalizedToneHex, whiteHex)
                    const blackContrast = contrastRatio(normalizedToneHex, blackHex)
                    
                    if (whiteContrast >= AA) {
                      accessibleRef = `{brand.themes.${mode}.palettes.core-colors.white}`
                    } else if (blackContrast >= AA) {
                      accessibleRef = `{brand.themes.${mode}.palettes.core-colors.black}`
                    } else {
                      // Neither passes, use the one with higher contrast
                      accessibleRef = whiteContrast >= blackContrast
                        ? `{brand.themes.${mode}.palettes.core-colors.white}`
                        : `{brand.themes.${mode}.palettes.core-colors.black}`
                    }
                  }
                }
                
                // Update interactive on-tone color
                if (accessibleRef) {
                  if (!coreColors[colorName].interactive) coreColors[colorName].interactive = {}
                  coreColors[colorName].interactive.$value = accessibleRef
                }
              }
            }
          }
        }
      }
      
      setTheme(themeCopy)
    } catch (err) {
      console.error('Failed to update core color in theme JSON:', err)
    }
  }

  const handleSelect = (tokenName: string) => {
    if (!targetVar) return
    
    // Parse token name: color/{family}/{level}
    const tokenParts = tokenName.split('/')
    if (tokenParts.length !== 3 || tokenParts[0] !== 'color') {
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
    const isCoreColor = targetVar.startsWith(`--recursica-brand-${mode}-palettes-core-`)
    
    // Check if this is an interactive color change
    const isInteractiveDefault = targetVar === `--recursica-brand-${mode}-palettes-core-interactive-default-tone` ||
                                  targetVar === `--recursica-brand-${mode}-palettes-core-interactive`
    
    if (isInteractiveDefault) {
      // Get the hex value for the selected token from tokens JSON (checking overrides first)
      const overrideMap = readOverrides()
      const tokenName = `color/${family}/${level}`
      const overrideValue = (overrideMap as any)[tokenName]
      const jsonColors: any = (tokensJson as any)?.tokens?.color || {}
      const tokenValue = overrideValue ?? jsonColors?.[family]?.[level]?.$value ?? jsonColors?.[family]?.[level]
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
        
        // Directly update interactive color with 'keep' option (keep current hover)
        if (!setTheme || !themeJson || !tokensJson) {
          // Fallback: just update CSS vars if we can't update theme
          updateInteractiveColor(normalizedHex, 'keep', tokensJson, mode)
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
          const currentHover = readCssVar(`--recursica-brand-${mode}-palettes-core-interactive-hover-tone`)
          let hoverHex: string
          if (currentHover && !currentHover.startsWith('var(')) {
            hoverHex = currentHover
          } else {
            hoverHex = resolveCssVarToHex(`var(--recursica-brand-${mode}-palettes-core-interactive-hover-tone)`, tokenIndex) || normalizedHex
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
            const match = cssVarRef.match(/var\(--recursica-tokens-color-([a-z0-9_-]+)-(\d{3,4})\)/)
            if (match) {
              const family = match[1]
              const level = match[2]
              const normalizedLevel = level === '000' ? '000' : level === '1000' ? '1000' : String(Number(level))
              return `color/${family}/${normalizedLevel}`
            }
            return null
          }
          
          const defaultToken = extractTokenFromCssVarRef(defaultToneRef)
          const hoverToken = extractTokenFromCssVarRef(hoverToneRef)
          
          // Update theme JSON FIRST (before updating CSS vars) to prevent flicker
          const themeCopy = JSON.parse(JSON.stringify(themeJson))
          const root: any = themeCopy?.brand ? themeCopy.brand : themeCopy
          const themes = root?.themes || root
          
          if (!themes[mode]) themes[mode] = {}
          if (!themes[mode].palettes) themes[mode].palettes = {}
          if (!themes[mode].palettes['core-colors']) themes[mode].palettes['core-colors'] = {}
          if (!themes[mode].palettes['core-colors'].$value) themes[mode].palettes['core-colors'].$value = {}
          
          const coreColors = themes[mode].palettes['core-colors'].$value
          if (!coreColors.interactive) {
            coreColors.interactive = { default: {}, hover: {} }
          }
          
          // Update tone colors in theme JSON
          if (defaultToken) {
            const tokenParts = defaultToken.split('/')
            const tokenRef = `{tokens.color.${tokenParts[1]}.${tokenParts[2]}}`
            if (!coreColors.interactive.default) coreColors.interactive.default = {}
            if (!coreColors.interactive.default.tone) coreColors.interactive.default.tone = {}
            coreColors.interactive.default.tone.$value = tokenRef
          }
          
          if (hoverToken) {
            const tokenParts = hoverToken.split('/')
            const tokenRef = `{tokens.color.${tokenParts[1]}.${tokenParts[2]}}`
            if (!coreColors.interactive.hover) coreColors.interactive.hover = {}
            if (!coreColors.interactive.hover.tone) coreColors.interactive.hover.tone = {}
            coreColors.interactive.hover.tone.$value = tokenRef
          }
          
          // Update on-tone colors in theme JSON
          if (!coreColors.interactive.default) coreColors.interactive.default = {}
          coreColors.interactive.default['on-tone'] = {
            $value: `{brand.themes.${mode}.palettes.core-colors.${defaultOnToneCore}}`
          }
          
          if (!coreColors.interactive.hover) coreColors.interactive.hover = {}
          coreColors.interactive.hover['on-tone'] = {
            $value: `{brand.themes.${mode}.palettes.core-colors.${hoverOnToneCore}}`
          }
          
          // Update theme JSON synchronously BEFORE updating CSS vars
          setTheme(themeCopy)
          
          // Now update CSS vars - this will match what's in theme JSON, preventing flicker
          updateInteractiveColor(normalizedHex, 'keep', tokensJson, mode)
          
          // Update core color interactive on-tone values for AA compliance
          if (setTheme && themeJson) {
            updateCoreColorInteractiveOnTones(normalizedHex, tokensJson, themeJson, setTheme, mode)
          }
          
          // Trigger AA compliance check for core colors
          setTimeout(() => {
            try {
              window.dispatchEvent(new CustomEvent('recheckCoreColorInteractiveOnTones'))
            } catch {}
          }, 10)
        } catch (err) {
          console.error('Failed to update interactive color:', err)
          // Fallback: just update CSS vars
          updateInteractiveColor(normalizedHex, 'keep', tokensJson, mode)
          if (setTheme && themeJson) {
            updateCoreColorInteractiveOnTones(normalizedHex, tokensJson, themeJson, setTheme, mode)
          }
          setTimeout(() => {
            try {
              window.dispatchEvent(new CustomEvent('recheckCoreColorInteractiveOnTones'))
            } catch {}
          }, 10)
        }
        
        setAnchor(null)
        setTargetVar(null)
        return
      }
    }
    
    // Set the CSS variable to reference the token (using exact level, no normalization)
    const success = updateCssVar(targetVar, `var(${tokenCssVar})`, tokensJson)
    if (!success) {
      console.error(`Failed to update ${targetVar} to var(${tokenCssVar})`)
      return
    }
    
    // Trigger recalculation of targetResolvedValue to update checkmark
    setCssVarUpdateTrigger((prev) => prev + 1)
    
    // Also update theme JSON for core colors so changes persist across navigation
    // This will also check and update on-tone colors for AA compliance
    if (isCoreColor) {
      updateCoreColorInTheme(targetVar, tokenName)
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
  const maxCount = Math.max(...Object.values(options).map((arr) => arr.length || 0))
  const labelCol = 110
  const swatch = 18
  const gap = 1
  const overlayWidth = labelCol + maxCount * (swatch + gap) + 32

  return (
    <>
      {anchor && targetVar && (
        createPortal(
          <div style={{ position: 'fixed', top: pos.top, left: pos.left, width: overlayWidth, background: `var(--recursica-brand-${mode}-layer-layer-3-property-surface)`, color: `var(--recursica-brand-${mode}-layer-layer-3-property-element-text-color)`, border: `var(--recursica-brand-${mode}-layer-layer-3-property-border-thickness) solid var(--recursica-brand-${mode}-layer-layer-3-property-border-color)`, borderRadius: `var(--recursica-brand-${mode}-layer-layer-3-property-border-radius)`, boxShadow: `var(--recursica-brand-${mode}-elevations-elevation-4-x-axis, 0px) var(--recursica-brand-${mode}-elevations-elevation-4-y-axis, 0px) var(--recursica-brand-${mode}-elevations-elevation-4-blur, 0px) var(--recursica-brand-${mode}-elevations-elevation-4-spread, 0px) var(--recursica-brand-${mode}-elevations-elevation-4-shadow-color, rgba(0, 0, 0, 0.1))`, padding: `var(--recursica-brand-${mode}-layer-layer-3-property-padding)`, zIndex: 20000 }}>
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
                    {items.map((it) => {
                      const isSelected = isTokenSelected(it.name, it.value)
                      
                      // Parse token name and build CSS variable for swatch background
                      const tokenParts = it.name.split('/')
                      let tokenCssVar: string | null = null
                      if (tokenParts.length === 3 && tokenParts[0] === 'color') {
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
                            border: `1px solid var(--recursica-brand-${mode}-layer-layer-3-property-border-color)`, 
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
                                stroke={`var(--recursica-brand-${mode}-palettes-core-black)`}
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                opacity="0.4"
                              />
                              <path
                                d="M2 6L5 9L10 2"
                                stroke={`var(--recursica-brand-${mode}-palettes-core-white)`}
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

