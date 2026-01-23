/**
 * Randomize Options Modal Component
 * 
 * Allows users to select which sections/areas to randomize with nested checkboxes
 */

import { useState, useEffect, useMemo } from 'react'
import { useThemeMode } from '../../modules/theme/ThemeModeContext'

export interface RandomizeOptions {
  tokens: {
    colors: boolean
    sizes: boolean
    opacities: boolean
    fontSizes: boolean
    fontWeights: boolean
    letterSpacing: boolean
    lineHeights: boolean
    fontFamilies: boolean
  }
  theme: {
    palettes: boolean
    dimensions: boolean
    layers: boolean
  }
  uikit: {
    components: boolean
  }
}

interface CheckboxItem {
  key: string
  label: string
  children?: CheckboxItem[]
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
      { key: 'fontWeights', label: 'Font Weights' },
      { key: 'letterSpacing', label: 'Letter Spacing' },
      { key: 'lineHeights', label: 'Line Heights' },
      { key: 'fontFamilies', label: 'Font Families' },
    ],
  },
  {
    key: 'theme',
    label: 'Theme',
    children: [
      { key: 'palettes', label: 'Palettes' },
      { key: 'dimensions', label: 'Dimensions' },
      { key: 'layers', label: 'Layers' },
    ],
  },
  {
    key: 'uikit',
    label: 'UIKit',
    children: [
      { key: 'components', label: 'Components' },
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
      fontWeights: true,
      letterSpacing: true,
      lineHeights: true,
      fontFamilies: true,
    },
    theme: {
      palettes: true,
      dimensions: true,
      layers: true,
    },
    uikit: {
      components: true,
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
    return Object.values(options.uikit).every(v => v === true)
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
    return Object.values(options.uikit).some(v => v === true)
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
    setOptions(getDefaultOptions())
    if (!checked) {
      setOptions({
        tokens: { colors: false, sizes: false, opacities: false, fontSizes: false, fontWeights: false, letterSpacing: false, lineHeights: false, fontFamilies: false },
        theme: { palettes: false, dimensions: false, layers: false },
        uikit: { components: false },
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
          fontFamilies: checked,
        },
      })
    } else if (parentKey === 'theme') {
      setOptions({
        ...options,
        theme: {
          palettes: checked,
          dimensions: checked,
          layers: checked,
        },
      })
    } else if (parentKey === 'uikit') {
      setOptions({
        ...options,
        uikit: {
          components: checked,
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
          ...options.uikit,
          [childKey]: checked,
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
      return (options.uikit as any)[childKey] || false
    }
    return false
  }
  
  const renderCheckbox = (item: CheckboxItem, parentItem?: CheckboxItem, level: number = 0) => {
    const isParent = item.children && item.children.length > 0
    const parentKey = parentItem?.key || ''
    
    const isSelected = isParent 
      ? areAllChildrenSelected(options, item.key)
      : parentKey
      ? getChildValue(parentKey, item.key)
      : false
    
    const isIndeterminate = isParent && areAnyChildrenSelected(options, item.key) && !areAllChildrenSelected(options, item.key)
    
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
              if (el) el.indeterminate = isIndeterminate
            }}
            onChange={(e) => {
              if (isParent) {
                handleParentChange(item.key, e.target.checked)
              } else {
                const parentKey = OPTIONS_STRUCTURE.find(p => p.children?.some(c => c.key === item.key))?.key || ''
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
              backgroundColor: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-interactive-color)`,
              border: 'none',
              borderRadius: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-radius)`,
              color: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-interactive-text-color)`,
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
