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
  SwatchIcon,
  Square2StackIcon,
  BarsArrowUpIcon,
  ScaleIcon,
  EqualsIcon,
  ArrowLongUpIcon,
  ArrowLongDownIcon,
  ArrowLongLeftIcon,
  ArrowLongRightIcon,
  PauseIcon,
  EqualsIcon as EqualsIconAlias,
  ArrowsPointingInIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronDoubleRightIcon,
  ArrowsUpDownIcon,
  ArrowsRightLeftIcon,
  ArrowRightStartOnRectangleIcon,
  ArrowUpOnSquareIcon,
  ArrowUturnRightIcon,
  RectangleGroupIcon,
  SquaresPlusIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ViewColumnsIcon,
} from '@heroicons/react/24/outline'
import { parseComponentStructure, toSentenceCase, ComponentProp } from './componentToolbarUtils'
import { useThemeMode } from '../theme/ThemeModeContext'
import VariantDropdown from './VariantDropdown'
import LayerDropdown from './LayerDropdown'
import AltLayerDropdown from './AltLayerDropdown'
import PropControl from './PropControl'
import propIconMapping from './propIconMapping.json'
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
  const [openDropdown, setOpenDropdown] = useState<string | null>(null) // Track which dropdown is open: 'variant-{propName}', 'layer', 'altLayer'
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

    // Filter out font-size for Button component (it's controlled by theme typography)
    const filteredProps = Array.from(propsMap.values()).filter(prop => {
      if (componentName.toLowerCase() === 'button' && prop.name.toLowerCase() === 'font-size') {
        return false
      }
      return true
    })

    return filteredProps.sort((a, b) => {
      // Sort: non-variant props first, then variant props
      if (a.isVariantSpecific && !b.isVariantSpecific) return 1
      if (!a.isVariantSpecific && b.isVariantSpecific) return -1
      return a.name.localeCompare(b.name)
    })
  }, [structure.props, componentName])

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

  // Icon name to component mapping - includes all icons from propIconMapping.json
  // Maps the names from the JSON file (which may or may not have "Icon" suffix) to the actual imported icon components
  const iconMap = useMemo(() => ({
    // Icons with "Icon" suffix in JSON
    PaintBrushIcon,
    Bars3Icon,
    ArrowsPointingOutIcon,
    RectangleStackIcon,
    ArrowPathIcon,
    ArrowLongUpIcon,
    ArrowLongDownIcon,
    ArrowLongLeftIcon,
    ArrowLongRightIcon,
    PauseIcon,
    EqualsIcon: EqualsIconAlias,
    ArrowsPointingInIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    ArrowLeftIcon,
    ArrowRightIcon,
    ChevronDoubleRightIcon,
    ArrowsUpDownIcon,
    ArrowsRightLeftIcon,
    ArrowRightStartOnRectangleIcon,
    ArrowUpOnSquareIcon,
    ArrowUturnRightIcon,
    RectangleGroupIcon,
    SquaresPlusIcon,
    Squares2X2Icon,
    ListBulletIcon,
    ViewColumnsIcon,
    // Icons without "Icon" suffix in JSON - map to their Icon versions
    Swatch: SwatchIcon,
    Square2Stack: Square2StackIcon,
    BarsArrowUp: BarsArrowUpIcon,
    Scale: ScaleIcon,
    Equals: EqualsIcon,
  } as Record<string, React.ComponentType<any>>), [])

  // Get icon for prop type using mapping dictionary
  const getPropIcon = (prop: ComponentProp) => {
    const name = prop.name.toLowerCase()
    
    // Look up icon name from mapping dictionary
    const iconName = (propIconMapping as Record<string, string>)[name]
    
    if (iconName && iconMap[iconName]) {
      return iconMap[iconName]
    }
    
    // Fallback to default icon if not found in mapping
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
            onSelect={(variantName) => {
              onVariantChange(variant.propName, variantName)
              setOpenDropdown(null)
            }}
            open={openDropdown === `variant-${variant.propName}`}
            onOpenChange={(isOpen) => {
              if (isOpen) {
                setOpenPropControl(null) // Close any open palette
                setOpenDropdown(`variant-${variant.propName}`)
              } else {
                setOpenDropdown(null)
              }
            }}
          />
        ))}
      </div>
      {structure.variants.length > 0 && <div className="toolbar-separator" />}

      {/* Consistent Layers Section */}
      <div className="toolbar-section-group">
        <LayerDropdown
          selected={selectedLayer}
          onSelect={(layer) => {
            onLayerChange(layer)
            setOpenDropdown(null)
          }}
          open={openDropdown === 'layer'}
          onOpenChange={(isOpen) => {
            if (isOpen) {
              setOpenPropControl(null) // Close any open palette
              setOpenDropdown('layer')
            } else {
              setOpenDropdown(null)
            }
          }}
        />
        <AltLayerDropdown
          selected={selectedAltLayer}
          onSelect={(altLayer) => {
            onAltLayerChange(altLayer)
            setOpenDropdown(null)
          }}
          mode={mode}
          open={openDropdown === 'altLayer'}
          onOpenChange={(isOpen) => {
            if (isOpen) {
              setOpenPropControl(null) // Close any open palette
              setOpenDropdown('altLayer')
            } else {
              setOpenDropdown(null)
            }
          }}
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
                className={`toolbar-icon-button ${openPropControl === propKey ? 'active' : ''}`}
                onClick={() => {
                  if (openPropControl === propKey) {
                    setOpenPropControl(null)
                  } else {
                    setOpenDropdown(null) // Close any open dropdown
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
