import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useVars } from '../vars/VarsContext'
import { readOverrides } from '../theme/tokenOverrides'
import { updateCssVar } from '../../core/css/updateCssVar'
import { readCssVar, readCssVarResolved } from '../../core/css/readCssVar'
import { InteractiveHoverModal } from './InteractiveHoverModal'
import { updateInteractiveColor } from './interactiveColorUpdater'
import { buildTokenIndex } from '../../core/resolvers/tokens'
import { hexToCssVarRef, getSteppedColor, resolveCssVarToHex } from '../../core/compliance/layerColorStepping'
import { pickAAOnTone } from '../theme/contrastUtil'
import { useThemeMode } from '../theme/ThemeModeContext'

export default function ColorTokenPicker() {
  const { tokens: tokensJson, theme: themeJson, setTheme } = useVars()
  const { mode } = useThemeMode()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [targetVar, setTargetVar] = useState<string | null>(null)
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: -9999, left: -9999 })
  const [familyNames, setFamilyNames] = useState<Record<string, string>>({})
  const [showHoverModal, setShowHoverModal] = useState(false)
  const [pendingInteractiveHex, setPendingInteractiveHex] = useState<string | null>(null)
  
  // Close picker when mode changes
  useEffect(() => {
    const handleCloseAll = () => {
      setAnchor(null)
      setTargetVar(null)
      setShowHoverModal(false)
      setPendingInteractiveHex(null)
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
  }, [targetVar])

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
      // If target is a CSS var reference (not hex), only match exact references
      if (trimmed.startsWith('var(')) {
        return false
      }
    }
    
    // Fallback: compare resolved hex values (only if target is a direct hex, not a var reference)
    if (targetResolvedValue.direct && !targetResolvedValue.direct.trim().startsWith('var(')) {
      const normalizedHex = tokenHex.startsWith('#') ? tokenHex.toLowerCase().trim() : `#${tokenHex.toLowerCase().trim()}`
      if (targetResolvedValue.resolved && /^#[0-9a-f]{6}$/.test(normalizedHex)) {
        const targetHex = targetResolvedValue.resolved.startsWith('#') 
          ? targetResolvedValue.resolved.toLowerCase().trim() 
          : `#${targetResolvedValue.resolved.toLowerCase().trim()}`
        return targetHex === normalizedHex
      }
    }
    
    return false
  }

  // Helper function to update theme JSON for core colors
  const updateCoreColorInTheme = (cssVar: string, tokenName: string) => {
    if (!setTheme || !themeJson) return
    
    // Check if this is a core color CSS var for the current mode
    const coreColorPrefix = `--recursica-brand-${mode}-palettes-core-`
    if (!cssVar.startsWith(coreColorPrefix)) return // Not a core color
    
    // Extract the color name from the CSS var
    const colorName = cssVar.replace(coreColorPrefix, '')
    
    // Determine mapping based on color name
    let mapping: { isInteractive?: boolean; isHover?: boolean } | null = null
    if (colorName === 'black' || colorName === 'white' || colorName === 'alert' || colorName === 'warning' || colorName === 'success') {
      mapping = {}
    } else if (colorName === 'interactive') {
      mapping = { isInteractive: true }
    } else if (colorName === 'interactive-default-tone') {
      mapping = { isInteractive: true }
    } else if (colorName === 'interactive-hover-tone') {
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
      
      // Color name was already extracted above
      
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
        coreColors[colorName] = tokenRef
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
    if (!tokenVarValue) {
      console.error(`CSS variable ${tokenCssVar} does not exist. Cannot select level ${level} for ${family}.`)
      console.error(`This may indicate that varsStore is not generating CSS variables for level ${level}.`)
      // Still try to set it - the variable might be created dynamically
    } else {
      console.log(`Selecting ${tokenCssVar} (value: ${tokenVarValue})`)
    }
    
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
        // Show modal instead of directly updating
        setPendingInteractiveHex(normalizedHex)
        setShowHoverModal(true)
        setAnchor(null)
        // Don't clear targetVar yet - we'll use it in the modal callback
        return
      }
    }
    
    // Set the CSS variable to reference the token (using exact level, no normalization)
    const success = updateCssVar(targetVar, `var(${tokenCssVar})`, tokensJson)
    if (!success) {
      console.error(`Failed to update ${targetVar} to var(${tokenCssVar})`)
      return
    }
    
    // Also update theme JSON for core colors so changes persist across navigation
    if (isCoreColor) {
      updateCoreColorInTheme(targetVar, tokenName)
      
      // If core black or white changed, re-check all palette on-tone colors
      // Use setTimeout to ensure CSS var and theme updates complete first
      const isCoreBlackOrWhite = targetVar === `--recursica-brand-${mode}-palettes-core-black` ||
                                  targetVar === `--recursica-brand-${mode}-palettes-core-white`
      if (isCoreBlackOrWhite) {
        setTimeout(() => {
          try {
            window.dispatchEvent(new CustomEvent('recheckAllPaletteOnTones'))
          } catch {}
        }, 10)
      }
    }
    
    setAnchor(null)
    setTargetVar(null)
  }

  const handleHoverModalSelect = (option: 'keep' | 'darker' | 'lighter') => {
    if (!pendingInteractiveHex) return
    
    // First, determine what the token references will be after updateInteractiveColor runs
    // We need to predict what tokens will be used so we can update theme JSON first
    if (!setTheme || !themeJson || !tokensJson) {
      // Fallback: just update CSS vars if we can't update theme
      updateInteractiveColor(pendingInteractiveHex, option, tokensJson)
      setShowHoverModal(false)
      setPendingInteractiveHex(null)
      setTargetVar(null)
      return
    }
    
    try {
      // Build token index to find which token matches the hex
      const tokenIndex = buildTokenIndex(tokensJson)
      
      const normalizedHex = pendingInteractiveHex.startsWith('#') ? pendingInteractiveHex.toLowerCase() : `#${pendingInteractiveHex.toLowerCase()}`
      
      // Determine default tone token reference
      const defaultToneRef = hexToCssVarRef(normalizedHex, tokensJson)
      
      // Determine hover tone token reference
      let hoverHex: string
      if (option === 'keep') {
        // Keep current hover color - read it now
        const currentHover = readCssVar(`--recursica-brand-${mode}-palettes-core-interactive-hover-tone`)
        if (currentHover && !currentHover.startsWith('var(')) {
          hoverHex = currentHover
        } else {
          hoverHex = resolveCssVarToHex(`var(--recursica-brand-${mode}-palettes-core-interactive-hover-tone)`, tokenIndex) || normalizedHex
        }
      } else {
        hoverHex = getSteppedColor(normalizedHex, option, tokensJson) || normalizedHex
      }
      const hoverToneRef = hexToCssVarRef(hoverHex, tokensJson)
      
      // Determine on-tone colors (only on-tone changes, not tone)
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
      
      // Update on-tone colors in theme JSON (only on-tone, not tone)
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
      updateInteractiveColor(pendingInteractiveHex, option, tokensJson)
      
      // Trigger AA compliance check
      try {
        window.dispatchEvent(new CustomEvent('paletteVarsChanged'))
      } catch {}
    } catch (err) {
      console.error('Failed to update interactive color:', err)
      // Fallback: just update CSS vars
    updateInteractiveColor(pendingInteractiveHex, option, tokensJson)
    }
    
    setShowHoverModal(false)
    setPendingInteractiveHex(null)
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
          <div style={{ position: 'fixed', top: pos.top, left: pos.left, width: overlayWidth, background: `var(--recursica-brand-${mode}-layer-layer-2-property-surface)`, color: `var(--recursica-brand-${mode}-layer-layer-2-property-element-text-color)`, border: `1px solid var(--recursica-brand-${mode}-layer-layer-2-property-border-color)`, borderRadius: 8, boxShadow: `var(--recursica-brand-${mode}-elevations-elevation-2-x-axis) var(--recursica-brand-${mode}-elevations-elevation-2-y-axis) var(--recursica-brand-${mode}-elevations-elevation-2-blur) var(--recursica-brand-${mode}-elevations-elevation-2-spread) var(--recursica-brand-${mode}-elevations-elevation-2-shadow-color)`, padding: 10, zIndex: 20000 }}>
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
                            border: `1px solid var(--recursica-brand-${mode}-layer-layer-2-property-border-color)`, 
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
      
      <InteractiveHoverModal
        open={showHoverModal}
        newInteractiveHex={pendingInteractiveHex || `var(--recursica-brand-${mode}-palettes-core-black)`}
        onClose={() => {
          setShowHoverModal(false)
          setPendingInteractiveHex(null)
          setTargetVar(null)
        }}
        onSelect={handleHoverModalSelect}
      />
    </>
  )
}

