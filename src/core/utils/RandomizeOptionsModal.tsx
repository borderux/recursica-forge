/**
 * Randomize Options Modal Component
 * 
 * Allows users to select which sections/areas to randomize with nested checkboxes
 */

import { useState, useEffect, useMemo } from 'react'
import { useThemeMode } from '../../modules/theme/ThemeModeContext'
import uikitJson from '../../vars/UIKit.json'

// Extract available components from UIKit.json
const availableComponents = Object.keys((uikitJson as any)?.['ui-kit']?.components || {}).sort()

// Helper to format component name (kebab-case to Title Case)
const formatComponentName = (name: string) => {
  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

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

interface CheckboxItem {
  key: string
  label: string
  children?: CheckboxItem[]
}

// Generate component items for the structure
const componentItems: CheckboxItem[] = availableComponents.map(comp => ({
  key: comp,
  label: formatComponentName(comp)
}))

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
    children: componentItems,
  },
]

interface RandomizeOptionsModalProps {
  show: boolean
  onRandomize: (options: RandomizeOptions) => void
  onCancel: () => void
}

function getDefaultOptions(): RandomizeOptions {
  // Default all components to true
  const defaultComponents: Record<string, boolean> = {}
  availableComponents.forEach(comp => {
    defaultComponents[comp] = true
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

function areAllChildrenSelected(options: RandomizeOptions, parentKey: string): boolean {
  if (parentKey === 'tokens') {
    return Object.values(options.tokens).every(v => v === true)
  }
  if (parentKey === 'theme') {
    return Object.values(options.theme).every(v => v === true)
  }
  if (parentKey === 'uikit') {
    return Object.values(options.uikit.components).every(v => v === true)
  }
  return false
}

function areAnyChildrenSelected(options: RandomizeOptions, parentKey: string): boolean {
  if (parentKey === 'tokens') {
    return Object.values(options.tokens).some(v => v === true)
  }
  if (parentKey === 'theme') {
    return Object.values(options.theme).some(v => v === true)
  }
  if (parentKey === 'uikit') {
    return Object.values(options.uikit.components).some(v => v === true)
  }
  return false
}

export function RandomizeOptionsModal({ show, onRandomize, onCancel }: RandomizeOptionsModalProps) {
  const { mode } = useThemeMode()
  const [options, setOptions] = useState<RandomizeOptions>(getDefaultOptions())

  // Reset to all selected when modal opens
  useEffect(() => {
    if (show) {
      setOptions(getDefaultOptions())
    }
  }, [show])

  const allSelected = useMemo(() => {
    return areAllChildrenSelected(options, 'tokens') &&
      areAllChildrenSelected(options, 'theme') &&
      areAllChildrenSelected(options, 'uikit')
  }, [options])

  if (!show) return null

  const handleAllChange = (checked: boolean) => {
    if (checked) {
      setOptions(getDefaultOptions())
    } else {
      const emptyComponents: Record<string, boolean> = {}
      availableComponents.forEach(comp => {
        emptyComponents[comp] = false
      })

      setOptions({
        tokens: { colors: false, sizes: false, opacities: false, fontSizes: false, fontWeights: false, letterSpacing: false, lineHeights: false },
        theme: { coreProperties: false, type: false, palettes: false, elevations: false, dimensions: false, layers: false },
        uikit: { components: emptyComponents },
      })
    }
  }

  const handleParentChange = (parentKey: string, checked: boolean) => {
    if (parentKey === 'tokens') {
      setOptions({
        ...options,
        tokens: {
          colors: checked,
          sizes: checked,
          opacities: checked,
          fontSizes: checked,
          fontWeights: checked,
          letterSpacing: checked,
          lineHeights: checked,
        },
      })
    } else if (parentKey === 'theme') {
      setOptions({
        ...options,
        theme: {
          coreProperties: checked,
          type: checked,
          palettes: checked,
          elevations: checked,
          dimensions: checked,
          layers: checked,
        },
      })
    } else if (parentKey === 'uikit') {
      const newComponents: Record<string, boolean> = {}
      availableComponents.forEach(comp => {
        newComponents[comp] = checked
      })

      setOptions({
        ...options,
        uikit: {
          components: newComponents,
        },
      })
    }
  }

  const handleChildChange = (parentKey: string, childKey: string, checked: boolean) => {
    if (parentKey === 'tokens') {
      setOptions({
        ...options,
        tokens: {
          ...options.tokens,
          [childKey]: checked,
        },
      })
    } else if (parentKey === 'theme') {
      setOptions({
        ...options,
        theme: {
          ...options.theme,
          [childKey]: checked,
        },
      })
    } else if (parentKey === 'uikit') {
      setOptions({
        ...options,
        uikit: {
          components: {
            ...options.uikit.components,
            [childKey]: checked,
          },
        },
      })
    }
  }

  const handleRandomize = () => {
    // Ensure at least one option is selected
    if (!areAnyChildrenSelected(options, 'tokens') &&
      !areAnyChildrenSelected(options, 'theme') &&
      !areAnyChildrenSelected(options, 'uikit')) {
      return
    }
    onRandomize(options)
  }

  const getChildValue = (parentKey: string, childKey: string): boolean => {
    if (parentKey === 'tokens') {
      return (options.tokens as any)[childKey] || false
    }
    if (parentKey === 'theme') {
      return (options.theme as any)[childKey] || false
    }
    if (parentKey === 'uikit') {
      return options.uikit.components[childKey] || false
    }
    return false
  }

  const renderCheckbox = (item: CheckboxItem, parentItem?: CheckboxItem, level: number = 0) => {
    const isParent = item.children && item.children.length > 0
    const parentKey = parentItem?.key || ''
    const isRoot = !parentItem && isParent
    const currentKey = isRoot ? item.key : item.key

    const isSelected = isRoot
      ? areAllChildrenSelected(options, item.key)
      : parentKey
        ? getChildValue(parentKey, item.key)
        : false

    // For indeterminate, we only care if it's a parent
    const isIndeterminate = isRoot && areAnyChildrenSelected(options, item.key) && !areAllChildrenSelected(options, item.key)

    return (
      <div key={item.key} style={{ marginLeft: level * 24 }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          fontFamily: 'var(--recursica-brand-typography-body-font-family)',
          fontSize: 'var(--recursica-brand-typography-body-font-size)',
          fontWeight: isParent ? 600 : 'var(--recursica-brand-typography-body-font-weight)',
          lineHeight: 'var(--recursica-brand-typography-body-line-height)',
          letterSpacing: 'var(--recursica-brand-typography-body-font-letter-spacing)',
          marginBottom: '4px',
        }}>
          <input
            type="checkbox"
            checked={isSelected}
            ref={(el) => {
              if (el) (el as HTMLInputElement).indeterminate = isIndeterminate ?? false
            }}
            onChange={(e) => {
              if (isRoot) {
                handleParentChange(item.key, e.target.checked)
              } else if (parentKey) {
                handleChildChange(parentKey, item.key, e.target.checked)
              }
            }}
            style={{
              width: '16px',
              height: '16px',
              cursor: 'pointer',
            }}
          />
          <span>{item.label}</span>
        </label>
        {isParent && item.children && (
          <div style={{ marginTop: '4px' }}>
            {item.children.map(child => renderCheckbox(child, item, level + 1))}
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
          maxHeight: '90vh',
          overflowY: 'auto',
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontFamily: 'var(--recursica-brand-typography-body-font-family)',
            fontSize: 'var(--recursica-brand-typography-body-font-size)',
            fontWeight: 700,
            lineHeight: 'var(--recursica-brand-typography-body-line-height)',
            letterSpacing: 'var(--recursica-brand-typography-body-font-letter-spacing)',
            marginBottom: '8px',
          }}>
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(e) => handleAllChange(e.target.checked)}
              style={{
                width: '16px',
                height: '16px',
                cursor: 'pointer',
              }}
            />
            <span>All</span>
          </label>

          {OPTIONS_STRUCTURE.map(item => renderCheckbox(item, undefined, 0))}
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
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
