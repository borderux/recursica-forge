/**
 * Component Toolbar
 * 
 * A toolbar for editing component CSS variables with variant selection,
 * layer selection, and prop controls.
 */

import { useState, useMemo, useRef } from 'react'
import {
  Bars3Icon,
  RectangleStackIcon,
  PaintBrushIcon,
  ArrowsPointingOutIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { parseComponentStructure, toSentenceCase, ComponentProp } from './componentToolbarUtils'
import { useThemeMode } from '../theme/ThemeModeContext'
import VariantDropdown from './VariantDropdown'
import LayerDropdown from './LayerDropdown'
import AltLayerDropdown from './AltLayerDropdown'
import PropControl from './PropControl'
import './ComponentToolbar.css'

export interface ComponentToolbarProps {
  componentName: string
  selectedVariants: Record<string, string> // e.g., { color: "solid", size: "default" }
  selectedLayer: string // e.g., "layer-0"
  selectedAltLayer: string | null // e.g., "high-contrast" or null
  onVariantChange: (prop: string, variant: string) => void
  onLayerChange: (layer: string) => void
  onAltLayerChange: (altLayer: string | null) => void
}

export default function ComponentToolbar({
  componentName,
  selectedVariants,
  selectedLayer,
  selectedAltLayer,
  onVariantChange,
  onLayerChange,
  onAltLayerChange,
}: ComponentToolbarProps) {
  const { mode } = useThemeMode()
  const [openPropControl, setOpenPropControl] = useState<string | null>(null)
  const iconRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  const structure = useMemo(() => parseComponentStructure(componentName), [componentName])

  // Get all unique props (one icon per prop name, regardless of variants or layers)
  // Show both non-variant props and variant props (both color and size), but only one icon per prop name
  // When editing a variant prop, it will edit for the selected variant and layer
  // Combine props with "-hover" suffix into the base prop
  const allProps = useMemo(() => {
    const propsMap = new Map<string, ComponentProp>()
    const seenProps = new Set<string>()
    const hoverPropsMap = new Map<string, ComponentProp>() // Map of base name -> hover prop

    // First pass: collect all props and identify hover props
    structure.props.forEach(prop => {
      const propNameLower = prop.name.toLowerCase()
      
      // Check if this is a hover prop
      if (propNameLower.endsWith('-hover')) {
        const baseName = propNameLower.slice(0, -6) // Remove "-hover"
        hoverPropsMap.set(baseName, prop)
      }
    })

    // Second pass: combine props with their hover variants
    structure.props.forEach(prop => {
      const propNameLower = prop.name.toLowerCase()
      
      // Skip hover props in the main list (they'll be attached to base props)
      if (propNameLower.endsWith('-hover')) {
        return
      }

      // Use just the prop name as the key (case-insensitive)
      const key = propNameLower

      // Skip if we've already seen this prop name
      if (seenProps.has(key)) {
        // If we already have this prop, prefer non-variant over variant-specific
        const existing = propsMap.get(key)!
        if (!prop.isVariantSpecific && existing.isVariantSpecific) {
          // Check if there's a hover prop for this base prop
          const hoverProp = hoverPropsMap.get(key)
          if (hoverProp) {
            prop.hoverProp = hoverProp
          }
          propsMap.set(key, prop)
        } else {
          // Attach hover prop to existing prop if it exists
          const hoverProp = hoverPropsMap.get(key)
          if (hoverProp && !existing.hoverProp) {
            existing.hoverProp = hoverProp
          }
        }
        return
      }

      // Check if there's a hover prop for this base prop
      const hoverProp = hoverPropsMap.get(key)
      if (hoverProp) {
        prop.hoverProp = hoverProp
      }

      // Mark as seen and add to map
      seenProps.add(key)
      propsMap.set(key, prop)
    })

    return Array.from(propsMap.values()).sort((a, b) => {
      // Sort: non-variant props first, then variant props
      if (a.isVariantSpecific && !b.isVariantSpecific) return 1
      if (!a.isVariantSpecific && b.isVariantSpecific) return -1
      return a.name.localeCompare(b.name)
    })
  }, [structure.props])

  const handleReset = () => {
    // Remove all CSS var overrides for this component
    // This will make them fall back to their computed values (from JSON defaults)
    structure.props.forEach(prop => {
      // Remove the inline style override to restore to default
      document.documentElement.style.removeProperty(prop.cssVar)
    })

    // Force a re-render by triggering a custom event
    window.dispatchEvent(new CustomEvent('cssVarsReset'))
  }

  // Get icon for prop type
  const getPropIcon = (prop: ComponentProp) => {
    const name = prop.name.toLowerCase()
    if (name.includes('color') || name.includes('background')) {
      return PaintBrushIcon
    }
    if (name.includes('font') || name.includes('text') || name.includes('size')) {
      return Bars3Icon
    }
    if (name.includes('padding') || name.includes('margin') || name.includes('gap')) {
      return ArrowsPointingOutIcon
    }
    if (name.includes('border') || name.includes('radius')) {
      return RectangleStackIcon
    }
    if (name.includes('height')) {
      return ArrowsPointingOutIcon
    }
    if (name.includes('width')) {
      return ArrowsPointingOutIcon
    }
    return RectangleStackIcon
  }

  return (
    <div className="component-toolbar" data-layer="layer-1">
      {/* Dynamic Variants Section */}
      <div className="toolbar-section-group">
        {structure.variants.map(variant => (
          <VariantDropdown
            key={variant.propName}
            propName={variant.propName}
            variants={variant.variants}
            selected={selectedVariants[variant.propName] || variant.variants[0]}
            onSelect={(variantName) => onVariantChange(variant.propName, variantName)}
          />
        ))}
      </div>
      {structure.variants.length > 0 && <div className="toolbar-separator" />}

      {/* Consistent Layers Section */}
      <div className="toolbar-section-group">
        <LayerDropdown
          selected={selectedLayer}
          onSelect={onLayerChange}
        />
        <AltLayerDropdown
          selected={selectedAltLayer}
          onSelect={onAltLayerChange}
          mode={mode}
        />
      </div>
      <div className="toolbar-separator" />

      {/* Dynamic Props Section */}
      <div className="toolbar-section-group">
        {allProps.map(prop => {
          const Icon = getPropIcon(prop)
          // Use prop name as key instead of cssVar since we have unique prop names now
          const propKey = prop.name
          return (
            <div key={propKey} className="toolbar-icon-wrapper">
              <button
                ref={(el) => {
                  if (el) {
                    iconRefs.current.set(propKey, el)
                  } else {
                    iconRefs.current.delete(propKey)
                  }
                }}
                className="toolbar-icon-button"
                onClick={() => {
                  if (openPropControl === propKey) {
                    setOpenPropControl(null)
                  } else {
                    setOpenPropControl(propKey)
                  }
                }}
                title={toSentenceCase(prop.name)}
                aria-label={toSentenceCase(prop.name)}
              >
                <Icon className="toolbar-icon" />
              </button>
              {openPropControl === propKey && iconRefs.current.get(propKey) && (
                <PropControl
                  prop={prop}
                  componentName={componentName}
                  selectedVariants={selectedVariants}
                  selectedLayer={selectedLayer}
                  anchorElement={iconRefs.current.get(propKey)!}
                  onClose={() => setOpenPropControl(null)}
                />
              )}
            </div>
          )
        })}
      </div>
      {allProps.length > 0 && <div className="toolbar-separator" />}

      {/* Reset Section */}
      <div className="toolbar-section-group">
        <button
          className="toolbar-icon-button toolbar-reset-button"
          onClick={handleReset}
          title="Reset to defaults"
          aria-label="Reset to defaults"
        >
          <ArrowPathIcon className="toolbar-icon" />
        </button>
      </div>
    </div>
  )
}
