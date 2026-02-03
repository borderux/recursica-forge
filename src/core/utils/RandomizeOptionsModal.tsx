/**
 * Randomize Options Modal Component
 * 
 * Allows users to select which sections/areas to randomize with nested checkboxes
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useThemeMode } from '../../modules/theme/ThemeModeContext'
import { getUiKitStructure, type CheckboxItem } from './getUiKitStructure'

export interface RandomizeOptions {
  tokens: {
    colors: boolean
    sizes: boolean
    opacities: boolean
    fontSizes: boolean
    fontWeights: boolean
    letterSpacing: boolean
    lineHeights: boolean
  }
  theme: {
    coreProperties: boolean
    type: boolean
    palettes: boolean
    elevations: boolean
    dimensions: boolean
    layers: boolean
  }
  uikit: {
    components: Record<string, boolean>
  }
}

// Recursively get all keys from a list of items
const getAllKeys = (items: CheckboxItem[]): string[] => {
  let keys: string[] = []
  items.forEach(item => {
    keys.push(item.key)
    if (item.children) {
      keys = [...keys, ...getAllKeys(item.children)]
    }
  })
  return keys
}

const UIKIT_ITEMS = getUiKitStructure()
const ALL_UIKIT_KEYS = getAllKeys(UIKIT_ITEMS)

const OPTIONS_STRUCTURE: CheckboxItem[] = [
  {
    key: 'tokens',
    label: 'Tokens',
    children: [
      { key: 'colors', label: 'Colors' },
      { key: 'sizes', label: 'Sizes' },
      { key: 'opacities', label: 'Opacities' },
      { key: 'fontSizes', label: 'Font Sizes' },
      { key: 'fontWeights', label: 'Font Weights' },
      { key: 'letterSpacing', label: 'Letter Spacing' },
      { key: 'lineHeights', label: 'Line Heights' },
    ],
  },
  {
    key: 'theme',
    label: 'Theme',
    children: [
      { key: 'coreProperties', label: 'Core Properties' },
      { key: 'type', label: 'Type' },
      { key: 'palettes', label: 'Palettes' },
      { key: 'elevations', label: 'Elevations' },
      { key: 'dimensions', label: 'Dimensions' },
      { key: 'layers', label: 'Layers' },
    ],
  },
  {
    key: 'uikit',
    label: 'UIKit',
    children: UIKIT_ITEMS,
  },
]

interface RandomizeOptionsModalProps {
  show: boolean
  onRandomize: (options: RandomizeOptions) => void
  onCancel: () => void
}

function getDefaultOptions(): RandomizeOptions {
  // Default all uikit components/props to true
  const defaultComponents: Record<string, boolean> = {}
  ALL_UIKIT_KEYS.forEach(key => {
    defaultComponents[key] = true
  })

  return {
    tokens: {
      colors: true,
      sizes: true,
      opacities: true,
      fontSizes: true,
      fontWeights: true,
      letterSpacing: true,
      lineHeights: true,
    },
    theme: {
      coreProperties: true,
      type: true,
      palettes: true,
      elevations: true,
      dimensions: true,
      layers: true,
    },
    uikit: {
      components: defaultComponents,
    },
  }
}

// Find item in tree by key
const findItem = (items: CheckboxItem[], key: string): CheckboxItem | null => {
  for (const item of items) {
    if (item.key === key) return item
    if (item.children) {
      const found = findItem(item.children, key)
      if (found) return found
    }
  }
  return null
}

const findParent = (items: CheckboxItem[], childKey: string): CheckboxItem | null => {
  for (const item of items) {
    if (item.children) {
      if (item.children.some(c => c.key === childKey)) return item
      const found = findParent(item.children, childKey)
      if (found) return found
    }
  }
  return null
}

export function RandomizeOptionsModal({ show, onRandomize, onCancel }: RandomizeOptionsModalProps) {
  const { mode } = useThemeMode()
  const [options, setOptions] = useState<RandomizeOptions>(getDefaultOptions())
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // Reset to all selected when modal opens
  useEffect(() => {
    if (show) {
      setOptions(getDefaultOptions())
      // Collapse all by default
      setExpanded(new Set())
    }
  }, [show])

  const toggleExpand = (key: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  if (!show) return null

  // Helpers to check selection status
  const isSelected = (section: 'tokens' | 'theme' | 'uikit', key: string): boolean => {
    if (section === 'tokens') return (options.tokens as any)[key]
    if (section === 'theme') return (options.theme as any)[key]
    if (section === 'uikit') return options.uikit.components[key]
    return false
  }

  const areAllDescendantsSelected = (items: CheckboxItem[], section: 'tokens' | 'theme' | 'uikit'): boolean => {
    return items.every(item => {
      const selected = isSelected(section, item.key)
      if (!selected) return false
      if (item.children) return areAllDescendantsSelected(item.children, section)
      return true
    })
  }

  const areAnyDescendantsSelected = (items: CheckboxItem[], section: 'tokens' | 'theme' | 'uikit'): boolean => {
    return items.some(item => {
      const selected = isSelected(section, item.key)
      if (selected) return true
      if (item.children) return areAnyDescendantsSelected(item.children, section)
      return false
    })
  }

  // Update logic

  const updateUikitState = (key: string, checked: boolean) => {
    const newComponents = { ...options.uikit.components }

    // 1. Update self and descendants
    const item = findItem(UIKIT_ITEMS, key)
    if (item) {
      const keysToUpdate = [item.key, ...getAllKeys(item.children || [])]
      keysToUpdate.forEach(k => {
        newComponents[k] = checked
      })
    }

    // 2. Update ancestors
    let currentKey = key
    while (true) {
      const parent = findParent(UIKIT_ITEMS, currentKey)
      if (!parent) break

      // Check if all siblings are now checked
      const allSiblingsChecked = parent.children?.every(child => newComponents[child.key])
      newComponents[parent.key] = !!allSiblingsChecked

      currentKey = parent.key
    }

    setOptions({
      ...options,
      uikit: { components: newComponents }
    })
  }

  const handleToggle = (item: CheckboxItem, rootKey: string, checked: boolean) => {
    if (rootKey === 'tokens') {
      if (item.key === 'tokens') {
        // All tokens
        const newTokens = { ...options.tokens }
        Object.keys(newTokens).forEach(k => (newTokens as any)[k] = checked)
        setOptions({ ...options, tokens: newTokens })
      } else {
        setOptions({ ...options, tokens: { ...options.tokens, [item.key]: checked } })
      }
    } else if (rootKey === 'theme') {
      if (item.key === 'theme') {
        // All theme
        const newTheme = { ...options.theme }
        Object.keys(newTheme).forEach(k => (newTheme as any)[k] = checked)
        setOptions({ ...options, theme: newTheme })
      } else {
        setOptions({ ...options, theme: { ...options.theme, [item.key]: checked } })
      }
    } else if (rootKey === 'uikit') {
      if (item.key === 'uikit') {
        // All uikit
        const newComponents = { ...options.uikit.components }
        ALL_UIKIT_KEYS.forEach(k => newComponents[k] = checked)
        setOptions({ ...options, uikit: { components: newComponents } })
      } else {
        updateUikitState(item.key, checked)
      }
    }
  }

  const handleRandomize = () => {
    // Basic validation: ensure something is selected
    // (Simply passing options is fine, randomizer will just do nothing if empty)
    onRandomize(options)
  }

  const renderCheckbox = (item: CheckboxItem, rootKey: string, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0
    let selected = false
    let indeterminate = false

    // Determine state
    if (rootKey === 'uikit' && item.key !== 'uikit') {
      selected = options.uikit.components[item.key]
      if (!selected && hasChildren) {
        // Check indeterminate
        if (areAnyDescendantsSelected(item.children!, 'uikit')) {
          indeterminate = true
        }
      }
    } else if (item.key === rootKey) {
      // Root section (Tokens, Theme, UIKit)
      if (hasChildren) {
        const all = areAllDescendantsSelected(item.children!, rootKey as any)
        const any = areAnyDescendantsSelected(item.children!, rootKey as any)
        selected = all
        indeterminate = !all && any
      }
    } else {
      // Leaf items for tokens/theme
      selected = isSelected(rootKey as any, item.key)
    }

    const isExpanded = expanded.has(item.key)

    return (
      <div key={item.key} style={{ marginLeft: level * 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
          {/* Expander Arrow */}
          {hasChildren && item.key !== rootKey ? (
            <button
              onClick={() => toggleExpand(item.key)}
              style={{
                border: 'none', background: 'transparent', cursor: 'pointer',
                padding: 0, width: '16px', height: '16px', marginRight: '4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-text-color)`,
                opacity: 0.6
              }}
            >
              <span style={{ fontSize: '10px', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.1s' }}>▶</span>
            </button>
          ) : (hasChildren && item.key !== rootKey) ? <div style={{ width: '20px' }} /> : null}

          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontFamily: 'var(--recursica-brand-typography-body-font-family)',
            fontSize: 'var(--recursica-brand-typography-body-font-size)',
            fontWeight: hasChildren ? 600 : 'var(--recursica-brand-typography-body-font-weight)',
            lineHeight: 'var(--recursica-brand-typography-body-line-height)',
            letterSpacing: 'var(--recursica-brand-typography-body-font-letter-spacing)',
            color: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-text-color)`,
          }}>
            <input
              type="checkbox"
              checked={selected}
              ref={(el) => {
                if (el) (el as HTMLInputElement).indeterminate = indeterminate
              }}
              onChange={(e) => handleToggle(item, rootKey, e.target.checked)}
              style={{
                width: '16px',
                height: '16px',
                cursor: 'pointer',
              }}
            />
            <span>{item.label}</span>
          </label>
        </div>

        {/* Children (always show for roots, toggle for deeper levels) */}
        {hasChildren && (item.key === rootKey || isExpanded) && (
          <div style={{ marginTop: '4px' }}>
            {item.children!.map(child => renderCheckbox(child, rootKey, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel()
        }
      }}
    >
      <div
        style={{
          backgroundColor: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-surface)`,
          color: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-text-color)`,
          border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-color)`,
          borderRadius: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-radius)`,
          padding: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-padding)`,
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: `var(--recursica-brand-themes-${mode}-elevations-elevation-4-x-axis) var(--recursica-brand-themes-${mode}-elevations-elevation-4-y-axis) var(--recursica-brand-themes-${mode}-elevations-elevation-4-blur) var(--recursica-brand-themes-${mode}-elevations-elevation-4-spread) var(--recursica-brand-themes-${mode}-elevations-elevation-4-shadow-color)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{
          marginTop: 0,
          marginBottom: '16px',
          fontFamily: 'var(--recursica-brand-typography-h2-font-family)',
          fontSize: 'var(--recursica-brand-typography-h2-font-size)',
          fontWeight: 'var(--recursica-brand-typography-h2-font-weight)',
          lineHeight: 'var(--recursica-brand-typography-h2-line-height)',
          letterSpacing: 'var(--recursica-brand-typography-h2-font-letter-spacing)',
        }}>
          Randomize Variables
        </h2>

        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '24px', paddingRight: '8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontWeight: 700 }}>Select Options</label>
              <button
                onClick={() => {
                  const newComps: any = {}; ALL_UIKIT_KEYS.forEach(k => newComps[k] = true)
                  setOptions({
                    tokens: { colors: true, sizes: true, opacities: true, fontSizes: true, fontWeights: true, letterSpacing: true, lineHeights: true },
                    theme: { coreProperties: true, type: true, palettes: true, elevations: true, dimensions: true, layers: true },
                    uikit: { components: newComps }
                  })
                }}
                style={{ background: 'none', border: 'none', color: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-interactive-tone)`, cursor: 'pointer', fontSize: '12px' }}
              >
                Select All
              </button>
              <button
                onClick={() => {
                  const newComps: any = {}; ALL_UIKIT_KEYS.forEach(k => newComps[k] = false)
                  setOptions({
                    tokens: { colors: false, sizes: false, opacities: false, fontSizes: false, fontWeights: false, letterSpacing: false, lineHeights: false },
                    theme: { coreProperties: false, type: false, palettes: false, elevations: false, dimensions: false, layers: false },
                    uikit: { components: newComps }
                  })
                }}
                style={{ background: 'none', border: 'none', color: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-interactive-tone)`, cursor: 'pointer', fontSize: '12px' }}
              >
                Deselect All
              </button>
            </div>

            {OPTIONS_STRUCTURE.map(item => renderCheckbox(item, item.key, 0))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-color)` }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-color)`,
              borderRadius: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-radius)`,
              color: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-text-color)`,
              cursor: 'pointer',
              fontFamily: 'var(--recursica-brand-typography-body-font-family)',
              fontSize: 'var(--recursica-brand-typography-body-font-size)',
              fontWeight: 'var(--recursica-brand-typography-body-font-weight)',
              lineHeight: 'var(--recursica-brand-typography-body-line-height)',
              letterSpacing: 'var(--recursica-brand-typography-body-font-letter-spacing)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleRandomize}
            style={{
              padding: '8px 16px',
              backgroundColor: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-interactive-tone)`,
              border: 'none',
              borderRadius: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-radius)`,
              color: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-interactive-on-tone)`,
              cursor: 'pointer',
              fontFamily: 'var(--recursica-brand-typography-body-font-family)',
              fontSize: 'var(--recursica-brand-typography-body-font-size)',
              fontWeight: 'var(--recursica-brand-typography-body-font-weight)',
              lineHeight: 'var(--recursica-brand-typography-body-line-height)',
              letterSpacing: 'var(--recursica-brand-typography-body-font-letter-spacing)',
            }}
          >
            Randomize
          </button>
        </div>
      </div>
    </div>
  )
}
