import React, { useEffect, useMemo, useState } from 'react'
import { useVars } from '../vars/VarsContext'
import { readOverrides, setOverride } from '../theme/tokenOverrides'
import { updateCssVar } from '../../core/css/updateCssVar'
import { readCssVar } from '../../core/css/readCssVar'
import { useThemeMode } from '../theme/ThemeModeContext'

import { Slider } from '../../components/adapters/Slider'
import { Label } from '../../components/adapters/Label'
import { Modal } from '../../components/adapters/Modal'

function toTitleCase(label: string): string {
  return (label || '')
    .replace(/[-_/]+/g, ' ')
    .replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase())
    .trim()
}

const toPctNumber = (v: any) => {
  const n = typeof v === 'number' ? v : parseFloat(v)
  if (!Number.isFinite(n)) return 0
  return n <= 1 ? Math.round(n * 100) : Math.round(n)
}

export type OpacityPickerOverlayProps = {
  tokenName?: string
  onClose?: () => void
  onSelect?: (tokenName: string, value: number, cssVarName?: string) => void
}

export default function OpacityPickerOverlay({ tokenName: propTokenName, onClose, onSelect }: OpacityPickerOverlayProps) {
  const { tokens: tokensJson, theme: themeJson, setTheme } = useVars()
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const [selectedTokenName, setSelectedTokenName] = useState<string | undefined>(propTokenName)
  const [targetCssVar, setTargetCssVar] = useState<string | null>(null)
  const [currentToken, setCurrentToken] = useState<string | null>(null)
  const [cssVarUpdateTrigger, setCssVarUpdateTrigger] = useState(0)
  const overlayRef = React.useRef<HTMLDivElement | null>(null)

  // Close overlay when mode changes
  useEffect(() => {
    const handleCloseAll = () => {
      setTargetCssVar(null)
      setCurrentToken(null)
      onClose?.()
    }
    window.addEventListener('closeAllPickersAndPanels', handleCloseAll)
    return () => window.removeEventListener('closeAllPickersAndPanels', handleCloseAll)
  }, [onClose])

  const flattened = useMemo(() => {
    const list: Array<{ name: string; value: number }> = []
    try {
      // Support both plural (opacities) and singular (opacity) for backwards compatibility
      const src: any = (tokensJson as any)?.tokens?.opacities || (tokensJson as any)?.tokens?.opacity || {}
      Object.keys(src).filter((k) => !k.startsWith('$')).forEach((k) => {
        const v = src[k]?.$value
        const num = typeof v === 'number' ? v : Number(v)
        if (Number.isFinite(num)) list.push({ name: `opacity/${k}`, value: num })
      })
    } catch { }
    return list
  }, [tokensJson])

  // Reflect latest overrides; listen to tokenOverridesChanged events
  const [version, setVersion] = useState(0)
  useEffect(() => {
    const handler = () => setVersion((v) => v + 1)
    window.addEventListener('tokenOverridesChanged', handler as any)
    return () => window.removeEventListener('tokenOverridesChanged', handler as any)
  }, [])
  const overrides = useMemo(() => readOverrides(), [version])

  const items = useMemo(() => {
    const out: Array<{ name: string; value: number | string }> = flattened
    const toPct = (v: any) => {
      const n = typeof v === 'number' ? v : parseFloat(v)
      if (!Number.isFinite(n)) return Number.POSITIVE_INFINITY
      return n <= 1 ? n * 100 : n
    }
    return out.sort((a, b) => toPct(a.value) - toPct(b.value))
  }, [flattened])

  // If tokenName is provided, filter to show only that token
  const filteredItems = useMemo(() => {
    const tokenToFilter = selectedTokenName || propTokenName
    if (!tokenToFilter) return items
    return items.filter((item) => item.name === tokenToFilter)
  }, [items, selectedTokenName, propTokenName])

  // Extract token name from CSS variable value
  const extractTokenFromCssVar = (cssVar: string): string | null => {
    try {
      // Ensure CSS var has --recursica- prefix if it doesn't already
      const prefixedTarget = cssVar.startsWith('--recursica-')
        ? cssVar
        : cssVar.startsWith('--')
          ? `--recursica-${cssVar.slice(2)}`
          : `--recursica-${cssVar}`

      const value = readCssVar(prefixedTarget)
      if (!value) return null
      // Match patterns like: var(--recursica-tokens-opacities-solid) or var(--recursica-tokens-opacity-solid) or var(--tokens-opacities-solid)
      // Support both plural (opacities) and singular (opacity) for backwards compatibility
      const match = value.match(/var\(--(?:recursica-)?tokens-opacities?-([^)]+)\)/)
      if (match) return `opacity/${match[1]}`
    } catch { }
    return null
  }

  // Recalculate currentToken whenever targetCssVar changes or CSS var is updated
  const resolvedCurrentToken = useMemo(() => {
    if (!targetCssVar) return null
    return extractTokenFromCssVar(targetCssVar)
  }, [targetCssVar, version, cssVarUpdateTrigger]) // Include version and cssVarUpdateTrigger to react to changes

  const calculatePosition = (el: HTMLElement) => {
    const rect = el.getBoundingClientRect()
    const overlayW = 400 // Fixed width in props
    const overlayH = overlayRef.current?.offsetHeight || 200

    const candidates = [
      { y: rect.bottom + 8, x: rect.left },
      { y: rect.top - overlayH - 8, x: rect.left },
      { y: rect.bottom + 8, x: rect.left - overlayW + rect.width },
      { y: rect.top - overlayH - 8, x: rect.left - overlayW + rect.width },
    ]

    const fits = (p: { y: number; x: number }) => {
      return p.x >= 0 && p.x + overlayW <= window.innerWidth && p.y >= 0 && p.y + overlayH <= window.innerHeight
    }

    const chosen = candidates.find(fits) || candidates[0]
    setPos({ top: chosen.y, left: chosen.x })
  }

    ; (window as any).openOpacityPicker = (el: HTMLElement, targetTokenNameOrCssVar?: string) => {
      // If it looks like a CSS variable (starts with --), treat it as targetCssVar
      if (targetTokenNameOrCssVar?.startsWith('--')) {
        setTargetCssVar(targetTokenNameOrCssVar)
        setSelectedTokenName(undefined)
        // Extract current token from CSS var value
        const current = extractTokenFromCssVar(targetTokenNameOrCssVar)
        setCurrentToken(current)
      } else {
        // Otherwise, treat it as a token name filter
        setTargetCssVar(null)
        setSelectedTokenName(targetTokenNameOrCssVar)
        setCurrentToken(null)
      }

      // Calculate viewport-relative position for Modal's fixed positioning
      calculatePosition(el)
    }

  const handleClose = () => {
    setTargetCssVar(null)
    setCurrentToken(null)
    setPos(null)
    onClose?.()
  }

  const handleTokenSelect = (tokenName: string, value: number) => {
    // Build the CSS variable name for the opacity token - use plural form (opacities)
    const tokenKey = tokenName.replace('opacity/', '')
    const opacityCssVar = `--recursica-tokens-opacities-${tokenKey}`

    // If we have a target CSS variable, set it to reference the opacity token
    if (targetCssVar) {
      try {
        // Ensure target CSS var has --recursica- prefix if it doesn't already
        const prefixedTarget = targetCssVar.startsWith('--recursica-')
          ? targetCssVar
          : targetCssVar.startsWith('--')
            ? `--recursica-${targetCssVar.slice(2)}`
            : `--recursica-${targetCssVar}`

        // Set the target CSS variable to reference the opacity token CSS variable
        updateCssVar(prefixedTarget, `var(${opacityCssVar})`, tokensJson)

        // Persist to theme JSON if this is a text-emphasis opacity, hover opacity, disabled opacity, or overlay opacity
        const isEmphasisOpacity = prefixedTarget.includes('text-emphasis-high') ||
          prefixedTarget.includes('text-emphasis-low')
        const isHoverOpacity = prefixedTarget.includes('state-hover')
        const isDisabledOpacity = prefixedTarget.includes('state-disabled')
        const isOverlayOpacity = prefixedTarget.includes('state-overlay-opacity')

        if ((isEmphasisOpacity || isHoverOpacity || isDisabledOpacity || isOverlayOpacity) && setTheme && themeJson) {
          try {
            const themeCopy = JSON.parse(JSON.stringify(themeJson))
            const root: any = themeCopy?.brand ? themeCopy.brand : themeCopy
            const themes = root?.themes || root

            // Determine which mode (light or dark)
            const isDark = prefixedTarget.includes('-dark-')
            const modeKey = isDark ? 'dark' : 'light'

            if (isEmphasisOpacity) {
              // Handle text-emphasis opacity
              const isHigh = prefixedTarget.includes('text-emphasis-high')
              const emphasisKey = isHigh ? 'high' : 'low'

              // Ensure text-emphasis structure exists
              if (!themes[modeKey]) themes[modeKey] = {}
              if (!themes[modeKey]['text-emphasis']) themes[modeKey]['text-emphasis'] = {}

              // Update the opacity reference in theme JSON
              themes[modeKey]['text-emphasis'][emphasisKey] = {
                // Use plural form (opacities) for token references
                $value: `{tokens.opacities.${tokenKey}}`
              }
            } else if (isHoverOpacity) {
              // Handle hover opacity
              // Ensure states structure exists
              if (!themes[modeKey]) themes[modeKey] = {}
              if (!themes[modeKey].states) themes[modeKey].states = {}

              // Update the hover opacity reference in theme JSON
              themes[modeKey].states.hover = {
                $type: 'number',
                // Use plural form (opacities) for token references
                $value: `{tokens.opacities.${tokenKey}}`
              }
            } else if (isDisabledOpacity) {
              // Handle disabled opacity
              // Ensure states structure exists
              if (!themes[modeKey]) themes[modeKey] = {}
              if (!themes[modeKey].states) themes[modeKey].states = {}

              // Update the disabled opacity reference in theme JSON
              themes[modeKey].states.disabled = {
                $type: 'number',
                // Use plural form (opacities) for token references
                $value: `{tokens.opacities.${tokenKey}}`
              }
            } else if (isOverlayOpacity) {
              // Handle overlay opacity
              // Ensure states structure exists
              if (!themes[modeKey]) themes[modeKey] = {}
              if (!themes[modeKey].states) themes[modeKey].states = {}
              if (!themes[modeKey].states.overlay) themes[modeKey].states.overlay = {}

              // Update the overlay opacity reference in theme JSON
              themes[modeKey].states.overlay.opacity = {
                $type: 'number',
                // Use plural form (opacities) for token references
                $value: `{tokens.opacities.${tokenKey}}`
              }
            }

            setTheme(themeCopy)
          } catch (err) {
            console.error('Failed to update theme JSON for opacity:', err)
          }
        }

        // Trigger recalculation of resolvedCurrentToken
        setCssVarUpdateTrigger((prev) => prev + 1)

        // Call onSelect with the opacity token CSS var name
        onSelect?.(tokenName, value, opacityCssVar)
      } catch (err) {
        console.error('Failed to set opacity CSS variable:', err)
      }
    } else {
      // No target CSS var, just call onSelect
      onSelect?.(tokenName, value)
    }

    handleClose()
  }

  if (!pos && !propTokenName) return null

  const { mode } = useThemeMode()
  return (
    <Modal
      isOpen={true}
      onClose={handleClose}
      title="Opacity"
      size={400}
      withOverlay={false}
      centered={false}
      position={pos ? { x: pos.left, y: pos.top } : { x: 0, y: 0 }}
      onPositionChange={(newPos) => setPos({ top: newPos.y, left: newPos.x })}
      draggable={true}
      zIndex={20000}
      showHeader={true}
      showFooter={false}
      padding={true}
      layer="layer-3"
      className="opacity-picker-overlay"
      style={{
        overflow: 'visible',
        visibility: pos ? 'visible' : 'hidden'
      }}
    >
      <div
        ref={overlayRef}
        style={{ display: 'grid', gap: 8 }}
        onClick={(e) => e.stopPropagation()}
      >
        {filteredItems.map((it) => {
          const label = toTitleCase(it.name.replace('opacity/', ''))
          const currentRaw = (overrides as any)[it.name] ?? it.value
          const current = toPctNumber(currentRaw)
          const tokenKey = it.name.replace('opacity/', '')
          // Use plural form (opacities) for CSS variable
          const opacityCssVar = `--recursica-tokens-opacities-${tokenKey}`
          const isClickable = targetCssVar !== null || onSelect !== undefined
          // Use resolvedCurrentToken if available, otherwise fall back to currentToken
          const effectiveCurrentToken = resolvedCurrentToken !== null ? resolvedCurrentToken : currentToken
          const isSelected = effectiveCurrentToken === it.name

          return (
            <div
              key={it.name}
              style={{
                marginBottom: 12
              }}
            >
              <Slider
                value={current}
                onChange={(val: number | [number, number]) => {
                  setOverride(it.name, typeof val === 'number' ? val : val[0])
                }}
                min={0}
                max={100}
                step={1}
                layer="layer-3"
                layout="stacked"
                showInput={false}
                showValueLabel={true}
                valueLabel={(val: number) => `${Math.round(val)}%`}
                showMinMaxLabels={false}
                label={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isSelected && (
                      <span style={{ fontSize: 14, color: `var(--recursica-brand-${mode}-palettes-core-interactive-default-tone)` }}>✓</span>
                    )}
                    {isClickable ? (
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleTokenSelect(it.name, typeof currentRaw === 'number' ? currentRaw : Number(currentRaw))
                        }}
                        style={{
                          fontSize: 13,
                          opacity: 0.9,
                          textAlign: 'left',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          padding: 0,
                          color: 'inherit',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                        title={targetCssVar ? `Set ${targetCssVar} to ${opacityCssVar}` : `Select ${it.name}`}
                      >
                        {label}
                      </button>
                    ) : (
                      <Label layer="layer-3" layout="stacked">{label}</Label>
                    )}
                  </div>
                }
              />
            </div>
          )
        })}
      </div>
    </Modal>
  )
}

