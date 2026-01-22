import { useMemo, useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useVars } from '../vars/VarsContext'
import { updateCssVar, removeCssVar } from '../../core/css/updateCssVar'
import { readCssVar, readCssVarResolved } from '../../core/css/readCssVar'
import { useThemeMode } from '../theme/ThemeModeContext'
import { iconNameToReactComponent } from '../components/iconUtils'

export default function PaletteSwatchPicker({ onSelect }: { onSelect?: (cssVarName: string) => void }) {
  const { palettes, theme: themeJson, tokens: tokensJson, setTheme } = useVars()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [targetCssVar, setTargetCssVar] = useState<string | null>(null)
  const [targetCssVars, setTargetCssVars] = useState<string[]>([])
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: -9999, left: -9999 })
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const firstHexMatchRef = useRef<string | null>(null)

  // Close picker when mode changes
  useEffect(() => {
    const handleCloseAll = () => {
      setAnchor(null)
      setTargetCssVar(null)
      setTargetCssVars([])
    }
    window.addEventListener('closeAllPickersAndPanels', handleCloseAll)
    return () => window.removeEventListener('closeAllPickersAndPanels', handleCloseAll)
  }, [])

  // Listen for CSS variable updates to refresh selection state
  useEffect(() => {
    const handleCssVarsUpdated = () => {
      setRefreshTrigger(prev => prev + 1)
    }
    window.addEventListener('cssVarsUpdated', handleCssVarsUpdated)
    return () => window.removeEventListener('cssVarsUpdated', handleCssVarsUpdated)
  }, [])

  const paletteKeys = useMemo(() => {
    const dynamic = palettes?.dynamic?.map((p) => p.key) || []
    const staticPalettes: string[] = []
    try {
      const root: any = (themeJson as any)?.brand ? (themeJson as any).brand : themeJson
      // Support both old structure (brand.light.*) and new structure (brand.themes.light.*)
      const themes = root?.themes || root
      const lightPal: any = themes?.light?.palettes || themes?.light?.palette || {}
      Object.keys(lightPal).forEach((k) => {
        // Include all palettes except core and core-colors (we'll handle core colors separately)
        if (k !== 'core' && k !== 'core-colors' && !dynamic.includes(k)) {
          staticPalettes.push(k)
        }
      })
    } catch {}
    return Array.from(new Set([...dynamic, ...staticPalettes]))
  }, [palettes, themeJson])

  const { mode } = useThemeMode()

  // Get core colors (black, white, interactive, alert, warning, success)
  const coreColors = useMemo(() => {
    const colors: Array<{ key: string; cssVar: string; label: string }> = []
    try {
      const root: any = (themeJson as any)?.brand ? (themeJson as any).brand : themeJson
      const themes = root?.themes || root
      const coreColorsRaw: any = themes?.[mode]?.palettes?.['core-colors'] || themes?.[mode]?.palettes?.core || {}
      const coreColorsObj: any = coreColorsRaw?.$value || coreColorsRaw || {}
      
      // Add interactive colors (default and hover states)
      if (coreColorsObj?.interactive) {
        const interactive = coreColorsObj.interactive
        if (interactive.default?.tone) {
          colors.push({
            key: 'interactive-default',
            cssVar: `--recursica-brand-themes-${mode}-palettes-core-interactive-default-tone`,
            label: 'Interactive / Default'
          })
        }
        if (interactive.hover?.tone) {
          colors.push({
            key: 'interactive-hover',
            cssVar: `--recursica-brand-themes-${mode}-palettes-core-interactive-hover-tone`,
            label: 'Interactive / Hover'
          })
        }
        // Fallback to base interactive if no states
        if (!interactive.default && !interactive.hover && interactive.tone) {
          colors.push({
            key: 'interactive',
            cssVar: `--recursica-brand-themes-${mode}-palettes-core-interactive`,
            label: 'Interactive'
          })
        }
      }
      
      // Add other core colors
      const coreColorKeys = ['black', 'white', 'alert', 'warning', 'success']
      coreColorKeys.forEach((colorKey) => {
        if (coreColorsObj[colorKey]) {
          colors.push({
            key: colorKey,
            cssVar: `--recursica-brand-themes-${mode}-palettes-core-${colorKey}`,
            label: colorKey.charAt(0).toUpperCase() + colorKey.slice(1)
          })
        }
      })
    } catch {}
    return colors
  }, [themeJson, mode])

  const paletteLevels = useMemo(() => {
    const levelsByPalette: Record<string, string[]> = {}
    paletteKeys.forEach((pk) => {
      try {
        const root: any = (themeJson as any)?.brand ? (themeJson as any).brand : themeJson
        // Support both old structure (brand.light.*) and new structure (brand.themes.light.*)
        const themes = root?.themes || root
        const paletteData: any = themes?.light?.palettes?.[pk] || themes?.light?.palette?.[pk]
        if (paletteData) {
          // Get all numeric levels including 000 and 1000 - no normalization or deduplication
          const levels = Object.keys(paletteData).filter((k) => /^(\d{2,4}|000|1000)$/.test(k))
          // Sort: 1000, 900, 800, ..., 100, 050, 000
          levels.sort((a, b) => {
            const aNum = a === '000' ? 0 : a === '050' ? 50 : a === '1000' ? 1000 : Number(a)
            const bNum = b === '000' ? 0 : b === '050' ? 50 : b === '1000' ? 1000 : Number(b)
            return bNum - aNum
          })
          levelsByPalette[pk] = levels
        }
      } catch {}
      // Fallback to standard levels if not found (including 000 and 1000)
      if (!levelsByPalette[pk]) {
        levelsByPalette[pk] = ['1000', '900', '800', '700', '600', '500', '400', '300', '200', '100', '050', '000']
      }
    })
    return levelsByPalette
  }, [paletteKeys, themeJson])

  const buildPaletteCssVar = (paletteKey: string, level: string): string => {
    // Use actual level - no normalization (000 stays 000, 1000 stays 1000)
    // Use new brand.json structure: --recursica-brand-themes-{mode}-palettes-${paletteKey}-${level}-tone
    return `--recursica-brand-themes-${mode}-palettes-${paletteKey}-${level}-tone`
  }

  const buildPaletteOnToneCssVar = (paletteKey: string, level: string): string => {
    // Build the on-tone CSS variable for a palette swatch
    return `--recursica-brand-themes-${mode}-palettes-${paletteKey}-${level}-on-tone`
  }

  // Get the resolved value of the target CSS var to compare with palette swatches
  // This hook must be called before any early returns to follow Rules of Hooks
  const targetResolvedValue = useMemo(() => {
    if (!targetCssVar) return null
    const resolved = readCssVarResolved(targetCssVar)
    const directValue = readCssVar(targetCssVar)
    return { resolved, direct: directValue }
  }, [targetCssVar, refreshTrigger])

  // Track which palette swatch we've already selected to avoid multiple selections
  const selectedPaletteSwatch = useMemo(() => {
    if (!targetResolvedValue || !targetCssVar) return null
    
    const directValue = readCssVar(targetCssVar)
    if (!directValue) return null
    
    const trimmed = directValue.trim()
    
    // Helper function to follow CSS variable chain and find palette reference
    const findPaletteInChain = (cssVarName: string, depth: number = 0, visited: Set<string> = new Set()): string | null => {
      if (depth > 10) return null // Prevent infinite loops
      if (visited.has(cssVarName)) return null // Prevent circular references
      visited.add(cssVarName)
      
      const value = readCssVar(cssVarName)
      if (!value) return null
      
      const trimmedValue = value.trim()
      
      // Check if this value directly contains a core color reference
      const coreMatch = trimmedValue.match(/var\s*\(\s*--recursica-brand-themes-(?:light|dark)-palettes-core-([a-z0-9-]+(?:-tone|-default-tone|-hover-tone)?)\s*\)/i)
      if (coreMatch) {
        const [, coreKey] = coreMatch
        // For interactive colors, preserve -default and -hover suffixes
        // Normalize: remove -tone suffix if present, but keep -default and -hover
        let normalizedKey = coreKey
        if (coreKey.endsWith('-tone') && !coreKey.includes('-default-tone') && !coreKey.includes('-hover-tone')) {
          normalizedKey = coreKey.replace(/-tone$/, '')
        }
        // Check if this matches any of our core colors - exact match first
        for (const coreColor of coreColors) {
          // Exact match (including -default-tone, -hover-tone)
          if (coreKey === coreColor.key || normalizedKey === coreColor.key) {
            return `core-${coreColor.key}`
          }
          // Match without -tone suffix for non-interactive colors
          const colorKey = coreColor.key.replace(/-tone$/, '')
          if (normalizedKey === colorKey && !coreColor.key.includes('-default') && !coreColor.key.includes('-hover')) {
            return `core-${coreColor.key}`
          }
        }
        // If we found a core color reference but it doesn't match our list, still return it
        return `core-${normalizedKey}`
      }
      
      // Check if this value directly contains a palette reference
      const paletteMatch = trimmedValue.match(/var\s*\(\s*--recursica-brand-themes-(?:light|dark)-palettes-([a-z0-9-]+)-(\d+|primary|000|1000|default|hover)-tone\s*\)/i)
      if (paletteMatch) {
        const [, paletteKey, level] = paletteMatch
        return `${paletteKey}-${level}`
      }
      
      // If it's a var() reference, extract the inner variable name and recurse
      const varMatch = trimmedValue.match(/var\s*\(\s*(--[^)]+?)\s*\)/)
      if (varMatch) {
        const innerVarName = varMatch[1].trim()
        const result = findPaletteInChain(innerVarName, depth + 1, visited)
        if (result) return result
      }
      
      return null
    }
    
    // First, try direct match
    // Check if target directly references a core color
    // Match patterns like: var(--recursica-brand-themes-light-palettes-core-black)
    // or: var(--recursica-brand-themes-light-palettes-core-interactive-default-tone)
    // or: var(--recursica-brand-themes-light-palettes-core-interactive-hover-tone)
    const directCoreMatch = trimmed.match(/var\s*\(\s*--recursica-brand-themes-(?:light|dark)-palettes-core-([a-z0-9-]+(?:-tone|-default-tone|-hover-tone)?)\s*\)/i)
    if (directCoreMatch) {
      const [, coreKey] = directCoreMatch
      // For interactive colors, preserve -default and -hover suffixes
      // Normalize: remove -tone suffix if present, but keep -default and -hover
      let normalizedKey = coreKey
      if (coreKey.endsWith('-tone') && !coreKey.includes('-default-tone') && !coreKey.includes('-hover-tone')) {
        normalizedKey = coreKey.replace(/-tone$/, '')
      }
      // Check if this matches any of our core colors - exact match first
      for (const coreColor of coreColors) {
        // Exact match (including -default-tone, -hover-tone)
        if (coreKey === coreColor.key || normalizedKey === coreColor.key) {
          return `core-${coreColor.key}`
        }
        // Match without -tone suffix for non-interactive colors
        const colorKey = coreColor.key.replace(/-tone$/, '')
        if (normalizedKey === colorKey && !coreColor.key.includes('-default') && !coreColor.key.includes('-hover')) {
          return `core-${coreColor.key}`
        }
      }
      // If no exact match found, return the normalized key
      return `core-${normalizedKey}`
    }
    
    // If direct match didn't work, try following the chain (for UIKit variables)
    const chainResult = findPaletteInChain(targetCssVar)
    if (chainResult) {
      return chainResult
    }
    
    // Check if target directly references a palette var
    // Use new brand.json structure: --recursica-brand-themes-{mode}-palettes-{paletteKey}-{level}-tone
    const directPaletteMatch = trimmed.match(/var\(--recursica-brand-themes-(?:light|dark)-palettes-([a-z0-9-]+)-(\d+|primary|000|1000)-tone\)/)
    if (directPaletteMatch) {
      const [, paletteKey, level] = directPaletteMatch
      return `${paletteKey}-${level}`
    }
    
    // Check if target is a color-mix() that contains a palette var
    if (trimmed.includes('color-mix')) {
      const colorMixPaletteMatch = trimmed.match(/--recursica-brand-themes-(?:light|dark)-palettes-([a-z0-9-]+)-(\d+|primary|000|1000)-tone/)
      if (colorMixPaletteMatch) {
        const [, paletteKey, level] = colorMixPaletteMatch
        return `${paletteKey}-${level}`
      }
      
      // Check if color-mix() contains a core color reference
      // Note: interactive colors have -default-tone or -hover-tone suffixes
      const colorMixCoreMatch = trimmed.match(/--recursica-brand-themes-(?:light|dark)-palettes-core-([a-z0-9-]+(?:-tone|-default-tone|-hover-tone)?)/i)
      if (colorMixCoreMatch) {
        const [, coreKey] = colorMixCoreMatch
        // Normalize: remove -tone suffix if present, but keep -default and -hover
        const normalizedKey = coreKey.replace(/-tone$/, '').replace(/-default$/, '-default').replace(/-hover$/, '-hover')
        // Check if this matches any of our core colors
        for (const coreColor of coreColors) {
          const colorKey = coreColor.key.replace(/-tone$/, '')
          if (normalizedKey === colorKey || coreKey === coreColor.key || normalizedKey === coreColor.key) {
            return `core-${coreColor.key}`
          }
        }
        return `core-${normalizedKey}`
      }
      
      // Check if color-mix() contains a token reference - extract and resolve the token directly (not the color-mix result)
      const tokenMatch = trimmed.match(/var\(--recursica-tokens-color-([a-z0-9-]+)-(\d+|050|000)\)/)
      if (tokenMatch) {
        const [, family, level] = tokenMatch
        // Try to follow the chain first
        const tokenCssVar = `--recursica-tokens-color-${family}-${level}`
        const chainResult = findPaletteInChain(tokenCssVar)
        if (chainResult) {
          return chainResult
        }
        // If chain doesn't work, try hex matching as fallback
        // Resolve the token directly (not the color-mix result which includes opacity)
        const tokenHex = readCssVarResolved(tokenCssVar)
        if (tokenHex && /^#[0-9a-f]{6}$/i.test(tokenHex)) {
          const targetHex = tokenHex.toLowerCase().trim()
          // First check core colors - return immediately on first match
          for (const coreColor of coreColors) {
            const coreResolved = readCssVarResolved(coreColor.cssVar)
            if (coreResolved && /^#[0-9a-f]{6}$/i.test(coreResolved)) {
              const coreHex = coreResolved.toLowerCase().trim()
              if (targetHex === coreHex) {
                return `core-${coreColor.key}`
              }
            }
          }
          // Find the first palette swatch that matches this hex - return immediately on first match
          for (const pk of paletteKeys) {
            const levels = paletteLevels[pk] || []
            for (const level of levels) {
              const paletteCssVar = buildPaletteCssVar(pk, level)
              const paletteResolved = readCssVarResolved(paletteCssVar)
              if (paletteResolved && /^#[0-9a-f]{6}$/i.test(paletteResolved)) {
                const paletteHex = paletteResolved.toLowerCase().trim()
                if (targetHex === paletteHex) {
                  return `${pk}-${level}`
                }
              }
            }
          }
        }
      }
    }
    
    // If target is a direct token reference (not in color-mix), try to follow the chain first
    const isTokenReference = trimmed.startsWith('var(--recursica-tokens-color-')
    if (isTokenReference) {
      // Try to follow the chain to find a palette reference
      const chainResult = findPaletteInChain(targetCssVar)
      if (chainResult) {
        return chainResult
      }
      // If chain doesn't work and we have a resolved hex, use hex matching as last resort
      // BUT: Only return the FIRST match to prevent multiple selections
      if (targetResolvedValue.resolved && /^#[0-9a-f]{6}$/i.test(targetResolvedValue.resolved)) {
        const targetHex = targetResolvedValue.resolved.toLowerCase().trim()
        // First check core colors - return immediately on first match
        for (const coreColor of coreColors) {
          const coreResolved = readCssVarResolved(coreColor.cssVar)
          if (coreResolved && /^#[0-9a-f]{6}$/i.test(coreResolved)) {
            const coreHex = coreResolved.toLowerCase().trim()
            if (targetHex === coreHex) {
              return `core-${coreColor.key}`
            }
          }
        }
        // Find the first palette swatch that matches this hex - return immediately on first match
        for (const pk of paletteKeys) {
          const levels = paletteLevels[pk] || []
          for (const level of levels) {
            const paletteCssVar = buildPaletteCssVar(pk, level)
            const paletteResolved = readCssVarResolved(paletteCssVar)
            if (paletteResolved && /^#[0-9a-f]{6}$/i.test(paletteResolved)) {
              const paletteHex = paletteResolved.toLowerCase().trim()
              if (targetHex === paletteHex) {
                return `${pk}-${level}`
              }
            }
          }
        }
      }
    }
    
    return null
  }, [targetResolvedValue, targetCssVar, paletteKeys, paletteLevels, buildPaletteCssVar, coreColors])

  // Check if "none" is selected (CSS var is empty, null, or transparent)
  const isNoneSelected = useMemo(() => {
    if (!targetCssVar) return false
    const directValue = readCssVar(targetCssVar)
    if (!directValue || directValue.trim() === '' || directValue === 'null' || directValue === 'transparent') {
      return true
    }
    // Check if resolved value is transparent
    const resolved = readCssVarResolved(targetCssVar)
    if (resolved && (resolved === 'transparent' || resolved === 'rgba(0, 0, 0, 0)' || resolved === 'rgba(255, 255, 255, 0)')) {
      return true
    }
    return false
  }, [targetCssVar])

  // Get elevation level from layer 3
  const elevationLevel = useMemo(() => {
    try {
      const root: any = (themeJson as any)?.brand ? (themeJson as any).brand : themeJson
      const themes = root?.themes || root
      const layerSpec: any = themes?.[mode]?.layers?.['layer-3'] || themes?.[mode]?.layer?.['layer-3'] || {}
      const v: any = layerSpec?.properties?.elevation?.$value
      if (typeof v === 'string') {
        // Match both old format (brand.light.elevations.elevation-X) and new format (brand.themes.light.elevations.elevation-X)
        const m = v.match(/elevations?\.(elevation-(\d+))/i)
        if (m) return m[2]
      }
    } catch {}
    return '3' // Default to elevation-3 if not found
  }, [themeJson, mode])

  // Reset hex match ref when target changes
  useEffect(() => {
    firstHexMatchRef.current = null
  }, [targetCssVar, selectedPaletteSwatch])

  // Check if a palette swatch is currently selected
  const isSwatchSelected = (paletteCssVar: string): boolean => {
    if (!targetResolvedValue || !targetCssVar) return false
    
    // PRIORITY 1: Use the tracked selected swatch - this prevents multiple selections
    if (selectedPaletteSwatch) {
      // Check if this is a core color
      // Note: interactive colors have -default-tone or -hover-tone suffixes
      const coreColorMatch = paletteCssVar.match(/--recursica-brand-themes-(?:light|dark)-palettes-core-([a-z0-9-]+(?:-tone|-default-tone|-hover-tone)?)$/i)
      if (coreColorMatch) {
        const [, coreKey] = coreColorMatch
        // Normalize: remove -tone suffix if present, but keep -default and -hover
        const normalizedKey = coreKey.replace(/-tone$/, '').replace(/-default$/, '-default').replace(/-hover$/, '-hover')
        // Find matching core color from our list to get the correct key
        const matchingCoreColor = coreColors.find(cc => {
          const cssVarMatch = cc.cssVar.match(/--recursica-brand-themes-(?:light|dark)-palettes-core-([a-z0-9-]+(?:-tone|-default-tone|-hover-tone)?)$/i)
          if (!cssVarMatch) return false
          const [, ccKey] = cssVarMatch
          const normalizedCcKey = ccKey.replace(/-tone$/, '').replace(/-default$/, '-default').replace(/-hover$/, '-hover')
          return normalizedCcKey === normalizedKey || ccKey === coreKey || cc.cssVar === paletteCssVar || normalizedCcKey === cc.key
        })
        
        if (matchingCoreColor) {
          const coreId = `core-${matchingCoreColor.key}`
          return selectedPaletteSwatch === coreId
        }
        
        // Fallback: use the coreKey directly (normalize it first)
        const normalizedCoreKey = normalizedKey
        const coreId = `core-${normalizedCoreKey}`
        return selectedPaletteSwatch === coreId
      }
      
      // Check if this is a regular palette swatch
      const paletteMatch = paletteCssVar.match(/--recursica-brand-themes-(?:light|dark)-palettes-([a-z0-9-]+)-(\d+|primary|000|1000|default|hover)-tone/)
      if (paletteMatch) {
        const [, paletteKey, level] = paletteMatch
        const paletteId = `${paletteKey}-${level}`
        return selectedPaletteSwatch === paletteId
      }
      
      // If selectedPaletteSwatch is set but doesn't match, return false
      return false
    }
    
    // PRIORITY 2: Check for exact CSS variable match (only if no selectedPaletteSwatch is set)
    if (!selectedPaletteSwatch) {
      const directValue = readCssVar(targetCssVar)
      if (directValue) {
        const trimmed = directValue.trim()
        const expectedValue = `var(${paletteCssVar})`
        if (trimmed === expectedValue) {
          return true
        }
        
        // Check if target is a color-mix() that contains this palette var
        const paletteVarName = paletteCssVar.replace(/^var\(/, '').replace(/\)$/, '')
        if (trimmed.includes('color-mix') && trimmed.includes(paletteVarName)) {
          return true
        }
      }
      
      // PRIORITY 3: Hex comparison (only as last resort, and only if no selectedPaletteSwatch)
      // Use a ref to track the first swatch that matches to prevent multiple matches
      if (targetResolvedValue.resolved && /^#[0-9a-f]{6}$/i.test(targetResolvedValue.resolved)) {
        const paletteHex = readCssVarResolved(paletteCssVar, 10)
        if (paletteHex && /^#[0-9a-f]{6}$/i.test(paletteHex.trim())) {
          if (targetResolvedValue.resolved.trim().toLowerCase() === paletteHex.trim().toLowerCase()) {
            // Only match the first swatch that matches this hex
            if (firstHexMatchRef.current === null) {
              firstHexMatchRef.current = paletteCssVar
              return true
            }
            // If we've already matched a swatch, only return true if this is the same one
            return firstHexMatchRef.current === paletteCssVar
          }
        }
      }
    }
    
    return false
  }

  // Update position on scroll and resize
  useEffect(() => {
    if (!anchor) return

    const calculatePosition = () => {
      const rect = anchor.getBoundingClientRect()
      const scrollX = window.scrollX || window.pageXOffset || 0
      const scrollY = window.scrollY || window.pageYOffset || 0
      const top = rect.bottom + scrollY + 8
      const left = Math.min(rect.left + scrollX, scrollX + window.innerWidth - 420)
      setPos({ top, left })
    }

    const handleScroll = () => {
      calculatePosition()
    }
    const handleResize = () => {
      calculatePosition()
    }

    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleResize)
    }
  }, [anchor])

  // Handle dragging
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const scrollX = window.scrollX || window.pageXOffset || 0
      const scrollY = window.scrollY || window.pageYOffset || 0
      setPos({
        top: e.clientY + scrollY - dragStart.y,
        left: e.clientX + scrollX - dragStart.x,
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragStart])

  ;(window as any).openPalettePicker = (el: HTMLElement, cssVar: string, cssVarsArray?: string[]) => {
    setAnchor(el)
    setTargetCssVar(cssVar || null)
    setTargetCssVars(cssVarsArray && cssVarsArray.length > 0 ? cssVarsArray : [])
    const rect = el.getBoundingClientRect()
    const scrollX = window.scrollX || window.pageXOffset || 0
    const scrollY = window.scrollY || window.pageYOffset || 0
    const top = rect.bottom + scrollY + 8
    const left = Math.min(rect.left + scrollX, scrollX + window.innerWidth - 420)
    setPos({ top, left })
  }

  if (!anchor || !targetCssVar) return null

  const labelCol = 80 // Reduced from 120 to give more space for swatches
  const swatch = 18
  const gap = 1
  const maxLevelCount = Math.max(...Object.values(paletteLevels).map((levels) => levels.length), coreColors.length, 0)
  // Calculate width to fit all swatches without wrapping - hug the content
  const swatchAreaWidth = maxLevelCount * (swatch + gap) - gap // Exact width needed for all swatches
  const overlayWidth = labelCol + swatchAreaWidth + 32
  const toTitle = (s: string) => (s || '').replace(/[-_/]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()).trim()

  const elevationBoxShadow = `var(--recursica-brand-themes-${mode}-elevations-elevation-${elevationLevel}-x-axis, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-${elevationLevel}-y-axis, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-${elevationLevel}-blur, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-${elevationLevel}-spread, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-${elevationLevel}-shadow-color, rgba(0, 0, 0, 0.1))`

  // Get the Check icon component
  const CheckIcon = iconNameToReactComponent('check')

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
    setIsDragging(true)
  }

  return createPortal(
    <div style={{ position: 'absolute', top: pos.top, left: pos.left, width: 'auto', minWidth: overlayWidth, maxWidth: '90vw', background: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-surface, var(--recursica-brand-themes-${mode}-layer-layer-3-property-surface))`, color: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-text-color, var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-text-color))`, border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-color, var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-color))`, borderRadius: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-radius, var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-radius))`, boxShadow: elevationBoxShadow, padding: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-padding, var(--recursica-brand-themes-${mode}-layer-layer-3-property-padding))`, zIndex: 20000, cursor: isDragging ? 'grabbing' : 'default' }}>
      <div 
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, cursor: 'move' }}
        onMouseDown={handleHeaderMouseDown}
      >
        <div style={{ fontWeight: 600 }}>Pick palette color</div>
        <button onClick={() => setAnchor(null)} aria-label="Close" style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16 }}>&times;</button>
      </div>
      <div style={{ display: 'grid', gap: 4 }}>
        {/* None option */}
        <div style={{ display: 'grid', gridTemplateColumns: `${labelCol}px 1fr`, alignItems: 'center', gap: 6 }}>
          <div style={{ fontSize: 12, opacity: 0.8 }}>None</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap }}>
            <div
              title="None"
              onClick={(e) => {
                e.stopPropagation()
                try {
                  const cssVarsToUpdate = targetCssVars.length > 0 ? targetCssVars : [targetCssVar!]
                  
                  // Remove CSS variables for "none" (remove the CSS var to use default/transparent)
                  cssVarsToUpdate.forEach((cssVar) => {
                    const prefixedTarget = cssVar.startsWith('--recursica-')
                      ? cssVar
                      : cssVar.startsWith('--')
                        ? `--recursica-${cssVar.slice(2)}`
                        : `--recursica-${cssVar}`
                    
                    // Remove the CSS var to clear the color (falls back to default/transparent)
                    removeCssVar(prefixedTarget)
                  })
                  
                        try {
                          window.dispatchEvent(new CustomEvent('cssVarsUpdated', { 
                            detail: { cssVars: cssVarsToUpdate } 
                          }))
                        } catch {}
                        
                        // Force re-render to update selection state
                        setRefreshTrigger(prev => prev + 1)
                        
                        // Trigger a delay to ensure CSS vars are updated before notifying
                        setTimeout(() => {
                          try {
                            window.dispatchEvent(new CustomEvent('cssVarsUpdated', { 
                              detail: { cssVars: cssVarsToUpdate } 
                            }))
                          } catch {}
                        }, 0)
                        
                        onSelect?.('none')
                } catch (err) {
                  console.error('Failed to set none:', err)
                }
                setAnchor(null)
                setTargetCssVar(null)
                setTargetCssVars([])
              }}
              style={{
                position: 'relative',
                width: swatch,
                height: swatch,
                cursor: 'pointer',
                border: `1px solid ${isNoneSelected ? `var(--recursica-brand-themes-${mode}-palettes-core-black)` : `var(--recursica-brand-themes-${mode}-palettes-neutral-500-tone)`}`,
                flex: '0 0 auto',
                padding: isNoneSelected ? '1px' : '0',
                borderRadius: isNoneSelected ? '5px' : '0',
                boxSizing: 'border-box',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-surface)`,
                  borderRadius: isNoneSelected ? '4px' : '0',
                  position: 'relative',
                }}
              >
                {/* Diagonal line through box */}
                <svg
                  width={swatch - (isNoneSelected ? 2 : 0)}
                  height={swatch - (isNoneSelected ? 2 : 0)}
                  viewBox={`0 0 ${swatch} ${swatch}`}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                  }}
                >
                  <line
                    x1="2"
                    y1="2"
                    x2={swatch - 2}
                    y2={swatch - 2}
                    stroke={`var(--recursica-brand-themes-${mode}-palettes-neutral-500-tone)`}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
        {paletteKeys.map((pk) => (
          <div key={pk} style={{ display: 'grid', gridTemplateColumns: `${labelCol}px 1fr`, alignItems: 'center', gap: 6 }}>
            <div style={{ fontSize: 12, opacity: 0.8, textTransform: 'capitalize' }}>{toTitle(pk)}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap }}>
              {(paletteLevels[pk] || []).map((level) => {
                const paletteCssVar = buildPaletteCssVar(pk, level)
                const onToneCssVar = buildPaletteOnToneCssVar(pk, level)
                const isSelected = isSwatchSelected(paletteCssVar)
                return (
                  <div
                    key={`${pk}-${level}`}
                    title={`${pk}/${level}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      try {
                        // Get all CSS vars to update (use array if provided, otherwise just the single target)
                        const cssVarsToUpdate = targetCssVars.length > 0 ? targetCssVars : [targetCssVar!]
                        
                        // Update all CSS variables - only update CSS vars, never JSON
                        cssVarsToUpdate.forEach((cssVar) => {
                          // Ensure target CSS var has --recursica- prefix if it doesn't already
                          const prefixedTarget = cssVar.startsWith('--recursica-')
                            ? cssVar
                            : cssVar.startsWith('--')
                              ? `--recursica-${cssVar.slice(2)}`
                              : `--recursica-${cssVar}`

                          // Set the target CSS variable to reference the selected palette CSS variable
                          updateCssVar(prefixedTarget, `var(${paletteCssVar})`, tokensJson)
                        })
                        
                        // Persist to theme JSON if this is an overlay color
                        const isOverlayColor = cssVarsToUpdate.some(cssVar => cssVar.includes('state-overlay-color'))
                        if (isOverlayColor && setTheme && themeJson) {
                          try {
                            const themeCopy = JSON.parse(JSON.stringify(themeJson))
                            const root: any = themeCopy?.brand ? themeCopy.brand : themeCopy
                            const themes = root?.themes || root
                            
                            // Determine which mode (light or dark)
                            const isDark = cssVarsToUpdate.some(cssVar => cssVar.includes('-dark-'))
                            const modeKey = isDark ? 'dark' : 'light'
                            
                            // Extract palette key and level from paletteCssVar
                            // Format: --recursica-brand-themes-{mode}-palettes-{paletteKey}-{level}-tone
                            const paletteMatch = paletteCssVar.match(/--recursica-brand-themes-(?:light|dark)-palettes-([a-z0-9-]+)-([a-z0-9]+)-tone/)
                            if (paletteMatch) {
                              const [, paletteKey, level] = paletteMatch
                              const cssLevel = level === 'primary' ? 'default' : level
                              
                              // Ensure state structure exists
                              if (!themes[modeKey]) themes[modeKey] = {}
                              if (!themes[modeKey].states) themes[modeKey].states = {}
                              if (!themes[modeKey].states.overlay) themes[modeKey].states.overlay = {}
                              
                              // Update the overlay color reference in theme JSON
                              themes[modeKey].states.overlay.color = {
                                $type: 'color',
                                $value: `{brand.themes.${modeKey}.palettes.${paletteKey}.${cssLevel}.color.tone}`
                              }
                              
                              setTheme(themeCopy)
                            }
                          } catch (err) {
                            console.error('Failed to update theme JSON for overlay color:', err)
                          }
                        }
                        
                        // Force re-render to update selection state
                        setRefreshTrigger(prev => prev + 1)
                        
                        // Trigger a delay to ensure CSS vars are updated before notifying
                        setTimeout(() => {
                          try {
                            window.dispatchEvent(new CustomEvent('cssVarsUpdated', { 
                              detail: { cssVars: cssVarsToUpdate, paletteCssVar } 
                            }))
                          } catch {}
                        }, 0)
                        
                        onSelect?.(paletteCssVar)
                      } catch (err) {
                        console.error('Failed to set palette CSS variable:', err)
                      }
                      setAnchor(null)
                      setTargetCssVar(null)
                      setTargetCssVars([])
                    }}
                    style={{
                      position: 'relative',
                      width: swatch,
                      height: swatch,
                      cursor: 'pointer',
                      border: `1px solid ${isSelected ? `var(--recursica-brand-themes-${mode}-palettes-core-black)` : `var(--recursica-brand-themes-${mode}-palettes-neutral-500-tone)`}`,
                      flex: '0 0 auto',
                      padding: isSelected ? '1px' : '0',
                      borderRadius: isSelected ? '5px' : '0',
                      boxSizing: 'border-box',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        background: `var(${paletteCssVar})`,
                        borderRadius: isSelected ? '4px' : '0',
                        position: 'relative',
                      }}
                    >
                      {isSelected && CheckIcon && (
                        <CheckIcon
                          style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            pointerEvents: 'none',
                            width: 12,
                            height: 12,
                            color: `var(${onToneCssVar})`,
                          }}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        {coreColors.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: `${labelCol}px 1fr`, alignItems: 'center', gap: 6 }}>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Core</div>
            <div style={{ display: 'flex', flexWrap: 'nowrap', gap }}>
              {coreColors.map((coreColor) => {
                const isSelected = isSwatchSelected(coreColor.cssVar)
                // Build on-tone CSS var for core colors
                // For interactive, use the state-specific on-tone (default or hover)
                let onToneCssVar: string
                if (coreColor.key === 'interactive-default') {
                  onToneCssVar = `--recursica-brand-themes-${mode}-palettes-core-interactive-default-on-tone`
                } else if (coreColor.key === 'interactive-hover') {
                  onToneCssVar = `--recursica-brand-themes-${mode}-palettes-core-interactive-hover-on-tone`
                } else if (coreColor.key === 'interactive') {
                  // Fallback for base interactive
                  onToneCssVar = `--recursica-brand-themes-${mode}-palettes-core-interactive-default-on-tone`
                } else {
                  // For other core colors (black, white, alert, warning, success)
                  onToneCssVar = `--recursica-brand-themes-${mode}-palettes-core-${coreColor.key}-on-tone`
                }
                return (
                  <div
                    key={coreColor.key}
                    title={coreColor.label}
                    onClick={(e) => {
                      e.stopPropagation()
                      try {
                        const cssVarsToUpdate = targetCssVars.length > 0 ? targetCssVars : [targetCssVar!]
                        
                        // First, update theme JSON for base colors BEFORE updating CSS vars
                        // This ensures recomputeAndApplyAll generates the correct CSS variable values
                        const coreColorPrefix = `--recursica-brand-themes-${mode}-palettes-core-`
                        const baseColorUpdates: Array<{ targetColorName: string; sourceColorName: string; isInteractive: boolean; isHover: boolean }> = []
                        
                        cssVarsToUpdate.forEach((cssVar) => {
                          const prefixedTarget = cssVar.startsWith('--recursica-')
                            ? cssVar
                            : cssVar.startsWith('--')
                              ? `--recursica-${cssVar.slice(2)}`
                              : `--recursica-${cssVar}`
                          
                          // Check if this is a base color tone CSS variable
                          if (prefixedTarget.startsWith(coreColorPrefix) && prefixedTarget.includes('-tone') && !prefixedTarget.includes('-on-tone') && !prefixedTarget.includes('-interactive')) {
                            // Extract the color name from the CSS var (e.g., black-tone -> black)
                            let targetColorName = prefixedTarget.replace(coreColorPrefix, '').replace('-tone', '')
                            
                            // Extract the source color name from coreColor.cssVar (e.g., core-white-tone -> white)
                            const sourceColorMatch = coreColor.cssVar.match(/--recursica-brand-themes-(?:light|dark)-palettes-core-([a-z0-9-]+(?:-default-tone|-hover-tone|-tone)?)/i)
                            if (sourceColorMatch) {
                              const [, sourceColorKey] = sourceColorMatch
                              let sourceColorName = sourceColorKey.replace(/-tone$/, '').replace(/-default$/, '-default').replace(/-hover$/, '-hover')
                              const isInteractive = sourceColorName.includes('interactive')
                              const isHover = sourceColorName.includes('hover')
                              baseColorUpdates.push({ targetColorName, sourceColorName, isInteractive, isHover })
                            }
                          }
                        })
                        
                        // Update theme JSON FIRST if we have base color updates
                        if (baseColorUpdates.length > 0 && setTheme && themeJson) {
                          try {
                            const themeCopy = JSON.parse(JSON.stringify(themeJson))
                            const root: any = themeCopy?.brand ? themeCopy.brand : themeCopy
                            const themes = root?.themes || root
                            
                            if (!themes[mode]) themes[mode] = {}
                            if (!themes[mode].palettes) themes[mode].palettes = {}
                            if (!themes[mode].palettes['core-colors']) themes[mode].palettes['core-colors'] = {}
                            if (!themes[mode].palettes['core-colors'].$value) themes[mode].palettes['core-colors'].$value = {}
                            
                            const coreColors = themes[mode].palettes['core-colors'].$value
                            
                            baseColorUpdates.forEach(({ targetColorName, sourceColorName, isInteractive, isHover }) => {
                              // Handle interactive colors with nested structure
                              if (isInteractive) {
                                if (isHover) {
                                  if (!coreColors[targetColorName]) coreColors[targetColorName] = {}
                                  if (!coreColors[targetColorName].tone) coreColors[targetColorName].tone = {}
                                  coreColors[targetColorName].tone.$value = `{brand.themes.${mode}.palettes.core-colors.interactive.hover.tone}`
                                } else {
                                  if (!coreColors[targetColorName]) coreColors[targetColorName] = {}
                                  if (!coreColors[targetColorName].tone) coreColors[targetColorName].tone = {}
                                  coreColors[targetColorName].tone.$value = `{brand.themes.${mode}.palettes.core-colors.interactive.default.tone}`
                                }
                              } else {
                                // Simple core color reference - reference the source color's tone value
                                if (!coreColors[targetColorName]) {
                                  coreColors[targetColorName] = {
                                    tone: { $value: `{brand.themes.${mode}.palettes.core-colors.${sourceColorName}.tone}` },
                                    'on-tone': { $value: `{brand.themes.${mode}.palettes.core-colors.white}` },
                                    interactive: { $value: `{brand.themes.${mode}.palettes.core-colors.white}` }
                                  }
                                } else {
                                  if (!coreColors[targetColorName].tone) coreColors[targetColorName].tone = {}
                                  coreColors[targetColorName].tone.$value = `{brand.themes.${mode}.palettes.core-colors.${sourceColorName}.tone}`
                                }
                              }
                            })
                            
                            // Update theme BEFORE updating CSS vars
                            setTheme(themeCopy)
                          } catch (themeErr) {
                            console.error('Failed to update theme JSON for core color:', themeErr)
                          }
                        }
                        
                        // Now update CSS variables AFTER theme JSON is updated
                        cssVarsToUpdate.forEach((cssVar) => {
                          const prefixedTarget = cssVar.startsWith('--recursica-')
                            ? cssVar
                            : cssVar.startsWith('--')
                              ? `--recursica-${cssVar.slice(2)}`
                              : `--recursica-${cssVar}`
                          
                          updateCssVar(prefixedTarget, `var(${coreColor.cssVar})`, tokensJson)
                        })
                        
                        // Force re-render to update selection state
                        setRefreshTrigger(prev => prev + 1)
                        
                        // Trigger a delay to ensure CSS vars are updated before notifying
                        setTimeout(() => {
                          try {
                            window.dispatchEvent(new CustomEvent('cssVarsUpdated', { 
                              detail: { cssVars: cssVarsToUpdate, paletteCssVar: coreColor.cssVar } 
                            }))
                          } catch {}
                        }, 0)
                        
                        onSelect?.(coreColor.cssVar)
                      } catch (err) {
                        console.error('Failed to set core color CSS variable:', err)
                      }
                      setAnchor(null)
                      setTargetCssVar(null)
                      setTargetCssVars([])
                    }}
                    style={{
                      position: 'relative',
                      width: swatch,
                      height: swatch,
                      cursor: 'pointer',
                      border: `1px solid ${isSelected ? `var(--recursica-brand-themes-${mode}-palettes-core-black)` : `var(--recursica-brand-themes-${mode}-palettes-neutral-500-tone)`}`,
                      flex: '0 0 auto',
                      padding: isSelected ? '1px' : '0',
                      borderRadius: isSelected ? '5px' : '0',
                      boxSizing: 'border-box',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        background: `var(${coreColor.cssVar})`,
                        borderRadius: isSelected ? '4px' : '0',
                        position: 'relative',
                      }}
                    >
                      {isSelected && CheckIcon && (
                        <CheckIcon
                          style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            pointerEvents: 'none',
                            width: 12,
                            height: 12,
                            color: `var(${onToneCssVar})`,
                          }}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
