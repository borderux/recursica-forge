/**
 * Randomize Options Modal Component
 * 
 * Allows users to select which sections/areas to randomize with nested checkboxes
 */

import { useState, useEffect } from 'react'
import { Modal } from '../../components/adapters/Modal'
import { Button } from '../../components/adapters/Button'
import { Checkbox } from '../../components/adapters/Checkbox'
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
                color: 'inherit',
                opacity: 0.6
              }}
            >
              <span style={{ fontSize: '10px', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.1s' }}>▶</span>
            </button>
          ) : (hasChildren && item.key !== rootKey) ? <div style={{ width: '20px' }} /> : null}

          <Checkbox
            checked={selected}
            indeterminate={indeterminate}
            onChange={(checked) => handleToggle(item, rootKey, checked)}
            label={
              <span style={{
                fontWeight: hasChildren ? 600 : 'inherit',
                fontSize: '14px'
              }}>
                {item.label}
              </span>
            }
            layer="layer-3"
          />
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
    <Modal
      isOpen={show}
      onClose={onCancel}
      title="Randomize Variables"
      primaryActionLabel="Randomize"
      onPrimaryAction={handleRandomize}
      secondaryActionLabel="Cancel"
      onSecondaryAction={onCancel}
      layer="layer-3"
      size="md"
      scrollable={true}
      content={
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: '1px solid var(--modal-border-color)'
          }}>
            <label style={{ fontWeight: 700 }}>Select Options</label>
            <div style={{ display: 'flex', gap: '16px' }}>
              <Button
                variant="text"
                size="small"
                onClick={() => {
                  const newComps: any = {}; ALL_UIKIT_KEYS.forEach(k => newComps[k] = true)
                  setOptions({
                    tokens: { colors: true, sizes: true, opacities: true, fontSizes: true, fontWeights: true, letterSpacing: true, lineHeights: true },
                    theme: { coreProperties: true, type: true, palettes: true, elevations: true, dimensions: true, layers: true },
                    uikit: { components: newComps }
                  })
                }}
              >
                Select All
              </Button>
              <Button
                variant="text"
                size="small"
                onClick={() => {
                  const newComps: any = {}; ALL_UIKIT_KEYS.forEach(k => newComps[k] = false)
                  setOptions({
                    tokens: { colors: false, sizes: false, opacities: false, fontSizes: false, fontWeights: false, letterSpacing: false, lineHeights: false },
                    theme: { coreProperties: false, type: false, palettes: false, elevations: false, dimensions: false, layers: false },
                    uikit: { components: newComps }
                  })
                }}
              >
                Deselect All
              </Button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {OPTIONS_STRUCTURE.map(item => renderCheckbox(item, item.key, 0))}
          </div>
        </div>
      }
    />
  )
}
