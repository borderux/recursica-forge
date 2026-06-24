/**
 * Randomize Options Modal Component
 * 
 * Allows users to select which sections/areas to randomize with nested checkboxes.
 * Keeps only global Tokens and Brand/Theme randomization options.
 */

import { useState, useEffect } from 'react'
import { Modal } from '../../components/adapters/Modal'
import { Button } from '../../components/adapters/Button'
import { Checkbox } from '../../components/adapters/Checkbox'

export interface CheckboxItem {
  key: string
  label: string
  children?: CheckboxItem[]
}

export interface RandomizeOptions {
  tokens: {
    colors: boolean
    sizes: boolean
    opacities: boolean
    fontSizes: boolean
    letterSpacing: boolean
    lineHeights: boolean
  }
  theme: {
    coreProperties: boolean
    corePropertyElements: boolean
    type: boolean
    palettes: boolean
    elevations: boolean
    dimensions: boolean
    layers: boolean
    overlay: boolean
  }
}

const OPTIONS_STRUCTURE: CheckboxItem[] = [
  {
    key: 'tokens',
    label: 'Tokens',
    children: [
      { key: 'colors', label: 'Colors' },
      { key: 'sizes', label: 'Sizes' },
      { key: 'opacities', label: 'Opacities' },
      { key: 'fontSizes', label: 'Font Sizes' },
      { key: 'letterSpacing', label: 'Letter Spacing' },
      { key: 'lineHeights', label: 'Line Heights' },
    ],
  },
  {
    key: 'theme',
    label: 'Theme',
    children: [
      { key: 'coreProperties', label: 'Core Colors' },
      { key: 'corePropertyElements', label: 'Elements' },
      { key: 'overlay', label: 'Overlay' },
      { key: 'type', label: 'Type' },
      { key: 'palettes', label: 'Palettes' },
      { key: 'elevations', label: 'Elevations' },
      { key: 'dimensions', label: 'Dimensions' },
      { key: 'layers', label: 'Layers' },
    ],
  },
]

interface RandomizeOptionsModalProps {
  show: boolean
  onRandomize: (options: RandomizeOptions) => void
  onCancel: () => void
}

function getDefaultOptions(): RandomizeOptions {
  return {
    tokens: {
      colors: true,
      sizes: true,
      opacities: true,
      fontSizes: true,
      letterSpacing: true,
      lineHeights: true,
    },
    theme: {
      coreProperties: true,
      corePropertyElements: true,
      type: true,
      palettes: true,
      elevations: true,
      dimensions: true,
      layers: true,
      overlay: true,
    },
  }
}

export function RandomizeOptionsModal({ show, onRandomize, onCancel }: RandomizeOptionsModalProps) {
  const [options, setOptions] = useState<RandomizeOptions>(getDefaultOptions())

  // Reset to all selected when modal opens
  useEffect(() => {
    if (show) {
      setOptions(getDefaultOptions())
    }
  }, [show])

  // Helpers to check selection status
  const isSelected = (section: 'tokens' | 'theme', key: string): boolean => {
    if (section === 'tokens') return (options.tokens as any)[key]
    if (section === 'theme') return (options.theme as any)[key]
    return false
  }

  const areAllDescendantsSelected = (items: CheckboxItem[], section: 'tokens' | 'theme'): boolean => {
    return items.every(item => {
      const selected = isSelected(section, item.key)
      if (!selected) return false
      if (item.children) return areAllDescendantsSelected(item.children, section)
      return true
    })
  }

  const areAnyDescendantsSelected = (items: CheckboxItem[], section: 'tokens' | 'theme'): boolean => {
    return items.some(item => {
      const selected = isSelected(section, item.key)
      if (selected) return true
      if (item.children) return areAnyDescendantsSelected(item.children, section)
      return false
    })
  }

  const handleToggle = (item: CheckboxItem, rootKey: string, checked: boolean) => {
    if (rootKey === 'tokens') {
      if (item.key === 'tokens') {
        const newTokens = { ...options.tokens }
        Object.keys(newTokens).forEach(k => (newTokens as any)[k] = checked)
        setOptions({ ...options, tokens: newTokens })
      } else {
        setOptions({ ...options, tokens: { ...options.tokens, [item.key]: checked } })
      }
    } else if (rootKey === 'theme') {
      if (item.key === 'theme') {
        const newTheme = { ...options.theme }
        Object.keys(newTheme).forEach(k => (newTheme as any)[k] = checked)
        setOptions({ ...options, theme: newTheme })
      } else {
        setOptions({ ...options, theme: { ...options.theme, [item.key]: checked } })
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

    if (item.key === rootKey) {
      if (hasChildren) {
        const all = areAllDescendantsSelected(item.children!, rootKey as any)
        const any = areAnyDescendantsSelected(item.children!, rootKey as any)
        selected = all
        indeterminate = !all && any
      }
    } else {
      selected = isSelected(rootKey as any, item.key)
    }

    return (
      <div key={item.key} style={{ marginLeft: level * 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
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

        {hasChildren && (
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
                  setOptions({
                    tokens: { colors: true, sizes: true, opacities: true, fontSizes: true, letterSpacing: true, lineHeights: true },
                    theme: { coreProperties: true, corePropertyElements: true, type: true, palettes: true, elevations: true, dimensions: true, layers: true, overlay: true }
                  })
                }}
              >
                Select All
              </Button>
              <Button
                variant="text"
                size="small"
                onClick={() => {
                  setOptions({
                    tokens: { colors: false, sizes: false, opacities: false, fontSizes: false, letterSpacing: false, lineHeights: false },
                    theme: { coreProperties: false, corePropertyElements: false, type: false, palettes: false, elevations: false, dimensions: false, layers: false, overlay: false }
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
