/**
 * Component Toolbar
 * 
 * A toolbar for editing component CSS variables with variant selection,
 * layer selection, and prop controls.
 */

import { useState, useMemo, useRef, useEffect } from 'react'
import { parseComponentStructure, toSentenceCase, ComponentProp } from './utils/componentToolbarUtils'
import { useThemeMode } from '../theme/ThemeModeContext'
import { useVars } from '../vars/VarsContext'
import VariantDropdown from './menu/dropdown/VariantDropdown'
import LayerDropdown from './menu/dropdown/LayerDropdown'
import AltLayerDropdown from './menu/dropdown/AltLayerDropdown'
import PropControl from './menu/floating-palette/PropControl'
import ElevationControl from './menu/floating-palette/ElevationControl'
import MenuIcon from './menu/MenuIcon'
import TokenSlider from '../forms/TokenSlider'
import { getComponentLevelCssVar } from '../../components/utils/cssVarNames'
import { readCssVar } from '../../core/css/readCssVar'
import { updateCssVar } from '../../core/css/updateCssVar'
import propIconMapping from './utils/propIconMapping.json'
import { iconNameToReactComponent } from '../components/iconUtils'
import './ComponentToolbar.css'

export interface ComponentToolbarProps {
  componentName: string
  selectedVariants: Record<string, string> // e.g., { color: "solid", size: "default" }
  selectedLayer: string // e.g., "layer-0"
  selectedAltLayer: string | null // e.g., "high-contrast" or null
  componentElevation?: string // e.g., "elevation-0", "elevation-1", etc.
  onVariantChange: (prop: string, variant: string) => void
  onLayerChange: (layer: string) => void
  onAltLayerChange: (altLayer: string | null) => void
  onElevationChange?: (elevation: string) => void
}

export default function ComponentToolbar({
  componentName,
  selectedVariants,
  selectedLayer,
  selectedAltLayer,
  componentElevation,
  onVariantChange,
  onLayerChange,
  onAltLayerChange,
  onElevationChange,
}: ComponentToolbarProps) {
  const { mode } = useThemeMode()
  const { theme: themeJson } = useVars()
  const [openPropControl, setOpenPropControl] = useState<string | null>(null)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null) // Track which dropdown is open: 'variant-{propName}', 'layer', 'altLayer'
  const iconRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const elevationButtonRef = useRef<HTMLButtonElement>(null)

  const structure = useMemo(() => parseComponentStructure(componentName), [componentName])

  // Get all unique props (one icon per prop name, regardless of variants or layers)
  // Show both non-variant props and variant props (both color and size), but only one icon per prop name
  // When editing a variant prop, it will edit for the selected variant and layer
  // Combine props with "-hover" suffix into the base prop
  // Combine track-selected and track-unselected into "track" prop
  const allProps = useMemo(() => {
    const propsMap = new Map<string, ComponentProp>()
    const seenProps = new Set<string>()
    const hoverPropsMap = new Map<string, ComponentProp>() // Map of base name -> hover prop
    let firstTrackSelected: ComponentProp | undefined
    let firstTrackUnselected: ComponentProp | undefined

    // First pass: collect all props and identify hover props and track props
    structure.props.forEach(prop => {
      const propNameLower = prop.name.toLowerCase()
      
      // Check if this is a hover prop
      if (propNameLower.endsWith('-hover')) {
        const baseName = propNameLower.slice(0, -6) // Remove "-hover"
        hoverPropsMap.set(baseName, prop)
      }
      
      // Check if this is a track prop (track-selected or track-unselected)
      if (propNameLower === 'track-selected' && !firstTrackSelected) {
        firstTrackSelected = prop
      } else if (propNameLower === 'track-unselected' && !firstTrackUnselected) {
        firstTrackUnselected = prop
      }
    })

    // Second pass: combine props with their hover variants and track variants
    structure.props.forEach(prop => {
      const propNameLower = prop.name.toLowerCase()
      
      // Skip hover props in the main list (they'll be attached to base props)
      if (propNameLower.endsWith('-hover')) {
        return
      }
      
      // Skip track-selected and track-unselected (they'll be combined into "track")
      if (propNameLower === 'track-selected' || propNameLower === 'track-unselected') {
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
    
    // Third pass: create a combined "track" prop from track-selected and track-unselected
    if (firstTrackSelected || firstTrackUnselected) {
      // Use track-selected as the base prop, or track-unselected if track-selected doesn't exist
      const baseTrackProp = firstTrackSelected || firstTrackUnselected!
      
      // Create a new prop that represents "track" with both variants
      // PropControl will use getCssVarsForProp to find the right CSS vars based on selectedVariants and selectedLayer
      const combinedTrackProp: ComponentProp = {
        ...baseTrackProp,
        name: 'track',
        trackSelectedProp: firstTrackSelected,
        trackUnselectedProp: firstTrackUnselected,
      }
      
      // Use "track" as the key - only one track icon
      if (!seenProps.has('track')) {
        propsMap.set('track', combinedTrackProp)
        seenProps.add('track')
      }
    }

    // Filter out font-size for Button component (it's controlled by theme typography)
    const filteredProps = Array.from(propsMap.values()).filter(prop => {
      if (componentName.toLowerCase() === 'button' && prop.name.toLowerCase() === 'font-size') {
        return false
      }
      return true
    })

    // Function to get category and order for sorting
    const getPropCategory = (propName: string): { category: number; order: number } => {
      const name = propName.toLowerCase()
      
      // Category 1: Colors
      if (name.includes('background') || name.includes('color') || name === 'text' || name === 'text-hover') {
        const colorOrder: Record<string, number> = {
          'background': 1,
          'background-hover': 2,
          'color': 3,
          'text': 4,
          'text-hover': 5,
          'border-color': 6,
        }
        return { category: 1, order: colorOrder[name] || 99 }
      }
      
      // Category 2: Typography
      if (name.includes('font') || name.includes('letter-spacing') || name.includes('line-height')) {
        const typographyOrder: Record<string, number> = {
          'font-size': 1,
          'font-weight': 2,
          'font-family': 3,
          'letter-spacing': 4,
          'line-height': 5,
        }
        return { category: 2, order: typographyOrder[name] || 99 }
      }
      
      // Category 3: Widths
      if (name.includes('width')) {
        const widthOrder: Record<string, number> = {
          'width': 1,
          'min-width': 2,
          'max-width': 3,
          'max-width': 3,
        }
        return { category: 3, order: widthOrder[name] || 99 }
      }
      
      // Category 4: Heights
      if (name.includes('height')) {
        const heightOrder: Record<string, number> = {
          'height': 1,
          'min-height': 2,
          'max-height': 3,
        }
        return { category: 4, order: heightOrder[name] || 99 }
      }
      
      // Category 5: Padding
      if (name.includes('padding')) {
        const paddingOrder: Record<string, number> = {
          'padding': 1,
          'padding-top': 2,
          'padding-bottom': 3,
          'padding-left': 4,
          'padding-right': 5,
          'padding-horizontal': 6,
          'padding-vertical': 7,
        }
        return { category: 5, order: paddingOrder[name] || 99 }
      }
      
      // Category 6: Margin
      if (name.includes('margin')) {
        const marginOrder: Record<string, number> = {
          'margin': 1,
          'margin-top': 2,
          'margin-bottom': 3,
          'margin-left': 4,
          'margin-right': 5,
        }
        return { category: 6, order: marginOrder[name] || 99 }
      }
      
      // Category 7: Gap
      if (name === 'gap') {
        return { category: 7, order: 1 }
      }
      
      // Category 8: Borders
      if (name.includes('border')) {
        const borderOrder: Record<string, number> = {
          'border-width': 1,
          'border-style': 2,
          'border-radius': 3,
        }
        return { category: 8, order: borderOrder[name] || 99 }
      }
      
      // Category 9: Icons
      if (name.includes('icon')) {
        const iconOrder: Record<string, number> = {
          'icon': 1,
          'icon-padding': 2,
          'icon-text-gap': 3,
        }
        return { category: 9, order: iconOrder[name] || 99 }
      }
      
      // Category 10: Other (alphabetical)
      return { category: 10, order: 0 }
    }

    return filteredProps.sort((a, b) => {
      // Sort: non-variant props first, then variant props
      if (a.isVariantSpecific && !b.isVariantSpecific) return 1
      if (!a.isVariantSpecific && b.isVariantSpecific) return -1
      
      // Then sort by category and order
      const aCat = getPropCategory(a.name)
      const bCat = getPropCategory(b.name)
      
      if (aCat.category !== bCat.category) {
        return aCat.category - bCat.category
      }
      
      if (aCat.order !== bCat.order) {
        return aCat.order - bCat.order
      }
      
      // Fallback to alphabetical
      return a.name.localeCompare(b.name)
    })
  }, [structure.props, componentName])

  // Get elevation options from brand theme
  const elevationOptions = useMemo(() => {
    try {
      const root: any = (themeJson as any)?.brand ? (themeJson as any).brand : themeJson
      const themes = root?.themes || root
      const elev: any = themes?.light?.elevations || root?.light?.elevations || {}
      const names = Object.keys(elev).filter((k) => /^elevation-\d+$/.test(k)).sort((a,b) => Number(a.split('-')[1]) - Number(b.split('-')[1]))
      return names.map((n) => {
        const idx = Number(n.split('-')[1])
        const label = idx === 0 ? 'Elevation 0 (No elevation)' : `Elevation ${idx}`
        return { name: n, label }
      })
    } catch {
      return []
    }
  }, [themeJson])

  // Get current elevation value from CSS var or prop
  const currentElevation = useMemo(() => {
    if (componentElevation !== undefined) return componentElevation
    const elevationVar = getComponentLevelCssVar(componentName as any, 'elevation')
    const value = readCssVar(elevationVar)
    if (value) {
      // Parse elevation value - could be a brand reference like "{brand.themes.light.elevations.elevation-1}"
      const match = value.match(/elevations\.(elevation-\d+)/)
      if (match) return match[1]
      // Or could be direct value like "elevation-1"
      if (/^elevation-\d+$/.test(value)) return value
    }
    return 'elevation-0' // Default
  }, [componentElevation, componentName])

  // Handle elevation change
  const handleElevationChange = (elevationName: string) => {
    const elevationVar = getComponentLevelCssVar(componentName as any, 'elevation')
    // Store as brand reference
    updateCssVar(elevationVar, `{brand.themes.${mode}.elevations.${elevationName}}`)
    onElevationChange?.(elevationName)
  }

  const handleReset = () => {
    // Remove all CSS var overrides for this component
    // This will make them fall back to their computed values (from JSON defaults)
    structure.props.forEach(prop => {
      // Remove the inline style override to restore to default
      document.documentElement.style.removeProperty(prop.cssVar)
    })

    // Also reset elevation
    const elevationVar = getComponentLevelCssVar(componentName as any, 'elevation')
    document.documentElement.style.removeProperty(elevationVar)
    
    // Reset elevation state in parent component to default (elevation-0)
    onElevationChange?.('elevation-0')

    // Force a re-render by triggering a custom event
    window.dispatchEvent(new CustomEvent('cssVarsReset'))
  }


  // Get icon for prop type using mapping dictionary
  const getPropIcon = (prop: ComponentProp) => {
    const name = prop.name.toLowerCase()
    
    // Look up icon name from mapping dictionary (kebab-case)
    const iconName = (propIconMapping as Record<string, string>)[name]
    
    if (iconName) {
      const iconComponent = iconNameToReactComponent(iconName)
      if (iconComponent) {
        return iconComponent
      }
    }
    
    // Fallback to default icon if not found in mapping
    const defaultIcon = iconNameToReactComponent('square-2-stack')
    return defaultIcon || null
  }


  return (
    <div className="component-toolbar" data-layer="layer-1">
      {/* Dynamic Variants Section */}
      <div className="toolbar-section-group">
        {structure.variants.length > 0 && (
          <span className="toolbar-section-label">Variants</span>
        )}
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

      {/* Consistent Layers Section */}
      <div className="toolbar-section-group">
        <span className="toolbar-section-label">Layers</span>
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

      {/* Dynamic Props Section */}
      <div className="toolbar-section-group">
        <span className="toolbar-section-label">Props</span>
        {allProps.filter(prop => {
          const propNameLower = prop.name.toLowerCase()
          return propNameLower !== 'elevation' && propNameLower !== 'alternative-layer' && propNameLower !== 'alt-layer'
        }).map(prop => {
          const Icon = getPropIcon(prop)
          // Use prop name as key instead of cssVar since we have unique prop names now
          const propKey = prop.name
          return (
            <div key={propKey} className="toolbar-icon-wrapper">
              <MenuIcon
                ref={(el) => {
                  if (el) {
                    iconRefs.current.set(propKey, el)
                  } else {
                    iconRefs.current.delete(propKey)
                  }
                }}
                icon={Icon}
                active={openPropControl === propKey}
                onClick={() => {
                  if (openPropControl === propKey) {
                    setOpenPropControl(null)
                  } else {
                    setOpenDropdown(null) // Close any open dropdown
                    setOpenPropControl(propKey)
                  }
                }}
                title={toSentenceCase(prop.name)}
              />
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
        
        {/* Elevation Control - Special Prop */}
        <div className="toolbar-icon-wrapper">
          <MenuIcon
            ref={elevationButtonRef}
            icon={iconNameToReactComponent('copy-simple')}
            active={openPropControl === 'elevation'}
            onClick={() => {
              if (openPropControl === 'elevation') {
                setOpenPropControl(null)
              } else {
                setOpenDropdown(null)
                setOpenPropControl('elevation')
              }
            }}
            title="Elevation"
          />
          {openPropControl === 'elevation' && elevationButtonRef.current && (
            <ElevationControl
              anchorElement={elevationButtonRef.current}
              elevationOptions={elevationOptions}
              currentElevation={currentElevation}
              onElevationChange={handleElevationChange}
              onClose={() => setOpenPropControl(null)}
            />
          )}
        </div>

      </div>

      {/* Reset Button */}
      <MenuIcon
        icon={(() => {
          const iconName = (propIconMapping as Record<string, string>).reset
          return iconName ? iconNameToReactComponent(iconName) : null
        })()}
        onClick={handleReset}
        title="Reset to defaults"
        className="toolbar-reset-button"
      />
    </div>
  )
}
