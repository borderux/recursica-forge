/**
 * Component Toolbar
 * 
 * A toolbar for editing component CSS variables with variant selection,
 * layer selection, and prop controls.
 */

import { useState, useMemo, useRef, useEffect } from 'react'
import { parseComponentStructure, toSentenceCase, ComponentProp } from './utils/componentToolbarUtils'
import VariantDropdown from './menu/dropdown/VariantDropdown'
import LayerSegmentedControl from './menu/segmented/LayerSegmentedControl'
import { Accordion } from '../../components/adapters/Accordion'
import PropControlContent from './menu/floating-palette/PropControlContent'
import MenuIcon from './menu/MenuIcon'
import { iconNameToReactComponent } from '../components/iconUtils'
import { getPropIcon, getPropLabel, getPropVisible, loadToolbarConfig } from './utils/loadToolbarConfig'
import { useThemeMode } from '../theme/ThemeModeContext'
import { useVars } from '../vars/VarsContext'
import { buildUIKitVars } from '../../core/resolvers/uikit'
import { updateCssVar } from '../../core/css/updateCssVar'
import { Switch } from '../../components/adapters/Switch'
import { Button } from '../../components/adapters/Button'
import { useDebugMode } from '../preview/PreviewPage'
import uikitJson from '../../vars/UIKit.json'
import './ComponentToolbar.css'

export interface ComponentToolbarProps {
  componentName: string
  selectedVariants: Record<string, string> // e.g., { color: "solid", size: "default" }
  selectedLayer: string // e.g., "layer-0"
  onVariantChange: (prop: string, variant: string) => void
  onLayerChange: (layer: string) => void
}

export default function ComponentToolbar({
  componentName,
  selectedVariants,
  selectedLayer,
  onVariantChange,
  onLayerChange,
}: ComponentToolbarProps) {
  const { mode } = useThemeMode()
  const { tokens, theme, uikit } = useVars()
  const { showUnmapped, setShowUnmapped, debugMode, setDebugMode } = useDebugMode()
  const [openPropControl, setOpenPropControl] = useState<Set<string>>(new Set())
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  // Calculate unmapped count (same logic as ComponentsSidebar)
  const { unmappedCount, totalCount } = useMemo(() => {
    const components = (uikitJson as any)?.['ui-kit']?.components || {}
    const mappedComponents = new Set(Object.keys(components).map(name => {
      const words = name.split('-')
      return words
        .map((word, index) => 
          index === 0 
            ? word.charAt(0).toUpperCase() + word.slice(1)
            : word.toLowerCase()
        )
        .join(' ')
    }))
    
    const baseComponents = [
      'Accordion', 'Avatar', 'Badge', 'Breadcrumb', 'Button', 'Card', 'Checkbox', 'Chip',
      'Date picker', 'Dropdown', 'File input', 'File upload', 'Hover card', 'Label', 'Link',
      'Loader', 'Menu', 'Menu item', 'Modal', 'Number input', 'Pagination', 'Panel', 'Popover',
      'Radio', 'Read-only field', 'Search', 'Segmented control', 'Slider', 'Stepper', 'Switch',
      'Tabs', 'Text field', 'Time picker', 'Timeline', 'Toast', 'Tooltip', 'Transfer list',
    ]
    
    const unmapped = baseComponents.filter(name => !mappedComponents.has(name)).length
    return { unmappedCount: unmapped, totalCount: baseComponents.length }
  }, [])

  const structure = useMemo(() => parseComponentStructure(componentName), [componentName])

  // Get toolbar config to preserve order
  const toolbarConfig = useMemo(() => {
    return loadToolbarConfig(componentName)
  }, [componentName])

  // Filter variants to only show those with more than one option AND are in the toolbar config, sorted by config order
  const visibleVariants = useMemo(() => {
    const filtered = structure.variants.filter(variant => variant.variants.length > 1)
    
    // Only show variants that are explicitly listed in the toolbar config
    if (toolbarConfig?.variants) {
      const configOrder = Object.keys(toolbarConfig.variants)
      const configVariants = filtered.filter(variant => {
        const isInConfig = configOrder.includes(variant.propName.toLowerCase())
        return isInConfig
      })
      return configVariants.sort((a, b) => {
        const aIndex = configOrder.indexOf(a.propName.toLowerCase())
        const bIndex = configOrder.indexOf(b.propName.toLowerCase())
        return aIndex - bIndex
      })
    }
    
    // If no toolbar config, don't show any variants (they should be configured)
    return []
  }, [structure.variants, toolbarConfig, componentName, selectedVariants])

  // Close any open dropdowns and prop controls when component changes
  useEffect(() => {
    setOpenDropdown(null)
    setOpenPropControl(new Set())
  }, [componentName])

  // Get all unique props (one icon per prop name, regardless of variants or layers)
  // Show both non-variant props and variant props (both color and size), but only one icon per prop name
  // Build props list based purely on toolbar config
  const allProps = useMemo(() => {
    const propsMap = new Map<string, ComponentProp>()
    const seenProps = new Set<string>()
    const groupedPropsMap = new Map<string, Map<string, ComponentProp>>() // Map of parent prop name -> map of grouped prop names -> props

    // First pass: collect all props and identify which ones are grouped
    structure.props.forEach(prop => {
      const propNameLower = prop.name.toLowerCase()
      
      // Check if this prop is part of a group in the config (but not if it's the parent prop itself)
      // IMPORTANT: Skip grouping check for text-group props - they are always standalone
      let groupedParent: string | null = null
      if (prop.type !== 'text-group' && toolbarConfig?.props) {
        for (const [key, propConfig] of Object.entries(toolbarConfig.props)) {
          if (propConfig.group && propConfig.group[propNameLower]) {
            groupedParent = key
            break
          }
        }
      }
      if (groupedParent && groupedParent.toLowerCase() !== propNameLower) {
        // This prop is grouped under another prop
        if (!groupedPropsMap.has(groupedParent)) {
          groupedPropsMap.set(groupedParent, new Map())
        }
        groupedPropsMap.get(groupedParent)!.set(propNameLower, prop)
        return // Skip adding to main props for now
      }
    })

    // Second pass: add props to the map, skipping those that are in groups (they'll be added in the grouping pass)
    structure.props.forEach(prop => {
      const propNameLower = prop.name.toLowerCase()
      
      // Skip props that are in a group (they'll be handled in the grouping pass)
      // IMPORTANT: Skip grouping check for text-group props - they are always standalone
      let isGrouped = false
      if (prop.type !== 'text-group' && toolbarConfig?.props) {
        for (const [, propConfig] of Object.entries(toolbarConfig.props)) {
          if (propConfig.group && propConfig.group[propNameLower]) {
            isGrouped = true
            break
          }
        }
      }
      if (isGrouped) {
        return
      }

      // Use just the prop name as the key (case-insensitive)
      const key = propNameLower

      // Skip if we've already seen this prop name
      if (seenProps.has(key)) {
        // If we already have this prop, prefer text-group props over other types
        // OR prefer non-variant over variant-specific
        // OR prefer the one that matches the selected variant
        const existing = propsMap.get(key)!
        
        // Always prefer text-group props over other types (e.g., color props with same name)
        if (prop.type === 'text-group' && existing.type !== 'text-group') {
          propsMap.set(key, prop)
          return
        }
        if (existing.type === 'text-group' && prop.type !== 'text-group') {
          // Keep existing text-group prop
          return
        }
        
        // If new prop is non-variant and existing is variant-specific, use new one
        if (!prop.isVariantSpecific && existing.isVariantSpecific) {
          propsMap.set(key, prop)
        } else if (prop.isVariantSpecific && existing.isVariantSpecific) {
          // Both are variant-specific - prefer the one that matches selected variant
          const existingMatches = existing.variantProp && selectedVariants[existing.variantProp] && 
                                  existing.path.includes(selectedVariants[existing.variantProp])
          const newMatches = prop.variantProp && selectedVariants[prop.variantProp] && 
                            prop.path.includes(selectedVariants[prop.variantProp])
          
          if (newMatches && !existingMatches) {
            // New prop matches selected variant, existing doesn't - use new one
            propsMap.set(key, prop)
          }
          // Otherwise keep existing
        }
        // Otherwise keep existing
        return
      }

      // Mark as seen and add to map
      seenProps.add(key)
      propsMap.set(key, prop)
    })
    
    // Third pass: create grouped props from config
    if (toolbarConfig?.props) {
      for (const [parentPropName, parentPropConfig] of Object.entries(toolbarConfig.props)) {
        if (parentPropConfig.group) {
          // Get or create the grouped props map for this parent prop
          let groupedProps = groupedPropsMap.get(parentPropName.toLowerCase())
          if (!groupedProps) {
            groupedProps = new Map()
            groupedPropsMap.set(parentPropName.toLowerCase(), groupedProps)
          }
          
          // Also check if the parent prop itself is in the structure (it might be in its own group)
          const parentProp = structure.props.find(p => p.name.toLowerCase() === parentPropName.toLowerCase())
          if (parentProp && !groupedProps.has(parentPropName.toLowerCase())) {
            groupedProps.set(parentPropName.toLowerCase(), parentProp)
          }
          
          // Also add any props from the group config that might not have been found yet
          for (const [groupedPropName] of Object.entries(parentPropConfig.group)) {
            const groupedPropKey = groupedPropName.toLowerCase()
            if (!groupedProps.has(groupedPropKey)) {
              // Special case: border-color is stored as "border" in the color category
              let groupedProp = structure.props.find(p => p.name.toLowerCase() === groupedPropKey)
              if (!groupedProp && groupedPropKey === 'border-color') {
                groupedProp = structure.props.find(p => p.name.toLowerCase() === 'border' && p.category === 'colors')
              }
              // Special case: interactive-color maps to "interactive" prop under colors.layer-X.interactive
              if (!groupedProp && groupedPropKey === 'interactive-color') {
                // Find all matching props and ensure we get the interactive one
                const matchingProps = structure.props.filter(p => {
                  const pathMatches = p.name.toLowerCase() === 'interactive' && 
                    p.category === 'colors' &&
                    !p.isVariantSpecific &&
                    p.path.includes('colors') &&
                    p.path.includes('interactive') &&
                    !p.path.includes('read-only') && // Explicitly exclude read-only
                    p.path.includes(selectedLayer)
                  // Also validate the CSS variable name contains interactive and NOT read-only
                  return pathMatches && 
                    p.cssVar.includes('interactive') && 
                    !p.cssVar.includes('read-only')
                })
                // Use the first matching prop (should only be one)
                groupedProp = matchingProps[0]
              }
              // Special case: read-only-color maps to "read-only" prop under colors.layer-X.read-only
              if (!groupedProp && groupedPropKey === 'read-only-color') {
                // Find all matching props and ensure we get the read-only one
                const matchingProps = structure.props.filter(p => {
                  const pathMatches = p.name.toLowerCase() === 'read-only' && 
                    p.category === 'colors' &&
                    !p.isVariantSpecific &&
                    p.path.includes('colors') &&
                    p.path.includes('read-only') &&
                    !p.path.includes('interactive') && // Explicitly exclude interactive
                    p.path.includes(selectedLayer)
                  // Also validate the CSS variable name contains read-only and NOT interactive
                  return pathMatches && 
                    p.cssVar.includes('read-only') && 
                    !p.cssVar.includes('interactive')
                })
                // Use the first matching prop (should only be one)
                groupedProp = matchingProps[0]
              }
              // Special case: separator-color maps to "separator-color" prop under colors.layer-X
              if (!groupedProp && groupedPropKey === 'separator-color') {
                groupedProp = structure.props.find(p => 
                  p.name.toLowerCase() === 'separator-color' && 
                  p.category === 'colors' &&
                  !p.isVariantSpecific &&
                  p.path.includes('colors') &&
                  p.path.includes('separator-color') &&
                  p.path.some(part => part.startsWith('layer-'))
                )
              }
              // If still not found, try to find it by exact name match (case-insensitive)
              // For variant-specific props, find the first matching prop regardless of variant
              if (!groupedProp) {
                groupedProp = structure.props.find(p => 
                  p.name.toLowerCase() === groupedPropKey ||
                  p.name === groupedPropName
                )
              }
              // Special handling: if parent prop is "spacing" or "layout", collect props from all layout variants
              if (!groupedProp && (parentPropName.toLowerCase() === 'spacing' || parentPropName.toLowerCase() === 'layout')) {
                // Find props that match the name and are variant-specific for layout
                const layoutProps = structure.props.filter(p => 
                  p.name.toLowerCase() === groupedPropKey &&
                  p.isVariantSpecific &&
                  p.variantProp === 'layout'
                )
                // Use the first one found (they should all have the same name, just different variant paths)
                if (layoutProps.length > 0) {
                  groupedProp = layoutProps[0]
                }
              }
              if (groupedProp) {
                groupedProps.set(groupedPropKey, groupedProp)
                // Also update the groupedPropsMap to ensure consistency
                groupedPropsMap.set(parentPropName.toLowerCase(), groupedProps)
              } else {
                // Debug: log if prop is not found
                console.warn(`ComponentToolbar: Grouped prop "${groupedPropName}" not found in structure.props for ${componentName}. Available props:`, structure.props.map(p => `${p.name} (${p.isVariantSpecific ? 'variant' : 'component-level'})`))
              }
            }
          }
          
          if (groupedProps.size > 0) {
            // Use the parent prop if found, otherwise use the first grouped prop as base
            const baseProp = parentProp || Array.from(groupedProps.values())[0]
            
            if (baseProp) {
              // Create a combined prop with all grouped properties
              const combinedProp: ComponentProp = {
                ...baseProp,
                name: parentPropName,
                isVariantSpecific: false,
                variantProp: undefined,
                borderProps: groupedProps, // Reuse borderProps field for grouped props
              }
              
              // Use parent prop name as the key
              const parentPropKey = parentPropName.toLowerCase()
              // Always set/update the combined prop, even if it already exists
              // This ensures grouped props have the borderProps map
              propsMap.set(parentPropKey, combinedProp)
              if (!seenProps.has(parentPropKey)) {
                seenProps.add(parentPropKey)
              }
            }
          }
        }
      }
    }
    
    // Fourth pass: create virtual props for props in toolbar config but not in structure
    // This allows props like "label-width" that are handled specially but don't exist as component-level props
    if (toolbarConfig?.props) {
      for (const [propName, propConfig] of Object.entries(toolbarConfig.props)) {
        const propNameLower = propName.toLowerCase()
        
        // Skip if prop already exists or is a grouped prop
        if (propsMap.has(propNameLower) || propConfig.group) {
          continue
        }
        
        // Create virtual prop for label-width
        if (componentName.toLowerCase() === 'label' && propNameLower === 'label-width') {
          const layoutVariant = selectedVariants.layout || 'stacked'
          const sizeVariant = selectedVariants.size || 'default'
          const virtualProp: ComponentProp = {
            name: 'label-width',
            category: 'size',
            type: 'dimension',
            cssVar: `--recursica-ui-kit-components-label-variants-layouts-${layoutVariant}-variants-sizes-${sizeVariant}-properties-width`,
            path: ['variants', 'layouts', layoutVariant, 'variants', 'sizes', sizeVariant, 'properties', 'width'],
            isVariantSpecific: true,
            variantProp: 'layout',
          }
          propsMap.set(propNameLower, virtualProp)
          seenProps.add(propNameLower)
        }
      }
    }

    // Filter props based on selected variants and layer
    const propsArray = Array.from(propsMap.values())
    const filteredProps = propsArray.filter(prop => {
      // Props with groups (borderProps) should never be filtered out - they handle their own variant logic internally
      if (prop.borderProps && prop.borderProps.size > 0) {
        return true
      }
      
      // Filter variant-specific props that don't match selected variants
      if (prop.isVariantSpecific && prop.variantProp) {
        const selectedVariant = selectedVariants[prop.variantProp]
        if (!selectedVariant) {
          // If no variant is selected for this prop type, exclude variant-specific props
          return false
        }
        
        // Check if this prop belongs to the selected variant
        // For nested variants (like Avatar's style and style-secondary), we need to check all variant levels
        const variantInPath = prop.path.find(pathPart => pathPart === selectedVariant)
        
        if (!variantInPath) {
          // The primary variant is not in the path, check if any selected variant matches
          // This handles cases where we might have multiple variant levels
          const allSelectedVariants = Object.values(selectedVariants)
          const hasAnySelectedVariant = allSelectedVariants.some(v => prop.path.includes(v))
          
          if (!hasAnySelectedVariant) {
            return false
          }
          
          // For nested variants, if we have multiple selected variants, check if they're all in the path
          // This ensures props only show when all relevant variants are selected
          // Example: text-size should only show when size variant is selected (not color variants)
          if (allSelectedVariants.length > 1) {
            // Check if the prop's category matches the variant prop
            // Size props should match size variants, color props should match color/style variants
            if (prop.category === 'size' && prop.variantProp !== 'size') {
              // Size props should only match size variants
              const sizeVariant = selectedVariants['size']
              if (sizeVariant && !prop.path.includes(sizeVariant)) {
                return false
              }
            } else if (prop.category === 'colors' && (prop.variantProp === 'style' || prop.variantProp === 'style-secondary')) {
              // Color props with style variant should match both style and style-secondary if selected
              const styleVariant = selectedVariants['style']
              const styleSecondary = selectedVariants['style-secondary']
              
              // Always check that the first-level variant (style) is in the path
              if (styleVariant && !prop.path.includes(styleVariant)) {
                return false
              }
              
              // If style-secondary is selected and the style is text or icon, check for secondary variant
              // This applies to both style and style-secondary props (nested props need both levels)
              if (styleSecondary && (styleVariant === 'text' || styleVariant === 'icon')) {
                if (!prop.path.includes(styleSecondary)) {
                  return false
                }
              }
            }
          }
        } else {
          // Primary variant is in path, but for nested variants we may need to check secondary
          // For Avatar: if style="text" and style-secondary="solid", ensure both are in path
          if ((prop.variantProp === 'style' || prop.variantProp === 'style-secondary') && prop.category === 'colors') {
            const styleSecondary = selectedVariants['style-secondary']
            const styleVariant = selectedVariants['style']
            
            // For nested props (style-secondary), also check that the first-level variant is in path
            if (prop.variantProp === 'style-secondary' && styleVariant && !prop.path.includes(styleVariant)) {
              return false
            }
            
            // If style-secondary is selected and style is text or icon, both must be in path
            if (styleSecondary && (styleVariant === 'text' || styleVariant === 'icon')) {
              if (!prop.path.includes(styleSecondary)) {
                return false
              }
            }
          }
        }
      }
      
      // For color props, check if layer matches (if prop has a layer in path)
      if (prop.category === 'colors' && prop.path.some(p => p.startsWith('layer-'))) {
        const layerInPath = prop.path.find(p => p.startsWith('layer-'))
        if (layerInPath && layerInPath !== selectedLayer) {
          return false
        }
      }
      
      return true
    })

    // Sort by toolbar config order
    if (toolbarConfig?.props) {
      const configPropOrder = Object.keys(toolbarConfig.props)
      return filteredProps.sort((a, b) => {
        // Get the prop name (might be grouped, so check for grouped parent)
        // Use toolbarConfig directly instead of calling getGroupedPropParent to avoid initialization issues
        let aPropName = a.name
        let bPropName = b.name
        if (toolbarConfig?.props) {
          for (const [key, propConfig] of Object.entries(toolbarConfig.props)) {
            if (propConfig.group) {
              if (propConfig.group[a.name.toLowerCase()]) {
                aPropName = key
              }
              if (propConfig.group[b.name.toLowerCase()]) {
                bPropName = key
              }
            }
          }
        }
        
        const aIndex = configPropOrder.indexOf(aPropName.toLowerCase())
        const bIndex = configPropOrder.indexOf(bPropName.toLowerCase())
        
        // If both found in config, sort by config order
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex
        }
        
        // If only one found, prioritize it
        if (aIndex !== -1) return -1
        if (bIndex !== -1) return 1
        
        // If neither found, simple fallback: non-variant props first, then alphabetical
        if (a.isVariantSpecific && !b.isVariantSpecific) return 1
        if (!a.isVariantSpecific && b.isVariantSpecific) return -1
        return a.name.localeCompare(b.name)
      })
    }
    
    // Fallback if no config: non-variant props first, then variant props, then alphabetical
    return filteredProps.sort((a, b) => {
      if (a.isVariantSpecific && !b.isVariantSpecific) return 1
      if (!a.isVariantSpecific && b.isVariantSpecific) return -1
      return a.name.localeCompare(b.name)
    })
  }, [structure.props, componentName, selectedVariants, toolbarConfig])

  const handleReset = () => {
    // Get all CSS variables for this component from structure
    const componentCssVars = new Set<string>()
    structure.props.forEach(prop => {
      componentCssVars.add(prop.cssVar)
    })

    // Rebuild UIKit vars from JSON defaults
    const allUIKitVars = buildUIKitVars(tokens, theme, uikit, mode)
    
    // Filter to only this component's CSS variables
    const componentKey = componentName.toLowerCase().replace(/\s+/g, '-')
    const componentDefaults: Record<string, string> = {}
    
    Object.entries(allUIKitVars).forEach(([cssVar, value]) => {
      // Check if this CSS var belongs to this component
      // Format: --recursica-ui-kit-components-{component}-...
      if (cssVar.includes(`components-${componentKey}-`)) {
        componentDefaults[cssVar] = value
      }
    })

    // Remove all overrides for this component first
    componentCssVars.forEach(cssVar => {
      document.documentElement.style.removeProperty(cssVar)
    })

    // Then restore defaults from JSON
    Object.entries(componentDefaults).forEach(([cssVar, value]) => {
      updateCssVar(cssVar, value, tokens)
    })

    // Force a re-render by triggering a custom event
    window.dispatchEvent(new CustomEvent('cssVarsReset'))
  }


  // Get icon for prop using component-specific toolbar config
  const getPropIconComponent = (prop: ComponentProp) => {
    const iconName = getPropIcon(componentName, prop.name)
    
    if (iconName) {
      const iconComponent = iconNameToReactComponent(iconName)
      if (iconComponent) {
        return iconComponent
      }
    }
    
    // Fallback to default icon if not found in config
    const defaultIcon = iconNameToReactComponent('square-2-stack')
    return defaultIcon || null
  }


  return (
    <div className="component-toolbar-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Layers Segmented Control */}
      <div style={{ padding: 'var(--recursica-brand-dimensions-general-md)', borderBottom: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-0-property-border-color)` }}>
        <LayerSegmentedControl
          selected={selectedLayer}
          onSelect={(layer) => {
            onLayerChange(layer)
          }}
        />
      </div>

      {/* Variants Dropdowns */}
      {visibleVariants.length > 0 && (
        <div style={{ padding: 'var(--recursica-brand-dimensions-general-md)', borderBottom: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-0-property-border-color)` }}>
          {visibleVariants.map((variant, index) => (
            <div 
              key={variant.propName}
              style={{ 
                marginBottom: index < visibleVariants.length - 1 ? 'var(--recursica-brand-dimensions-general-sm)' : 0,
                paddingBottom: index < visibleVariants.length - 1 ? 'var(--recursica-brand-dimensions-general-sm)' : 0,
                borderBottom: index < visibleVariants.length - 1 ? `1px solid var(--recursica-brand-themes-${mode}-layer-layer-0-property-border-color)` : 'none'
              }}
            >
              <VariantDropdown
                componentName={componentName}
                propName={variant.propName}
                variants={variant.variants}
                selected={selectedVariants[variant.propName] || variant.variants[0]}
                onSelect={(variantName) => {
                  onVariantChange(variant.propName, variantName)
                }}
                open={openDropdown === `variant-${variant.propName}`}
                onOpenChange={(isOpen) => {
                  if (isOpen) {
                    setOpenDropdown(`variant-${variant.propName}`)
                  } else {
                    setOpenDropdown(null)
                  }
                }}
                className="full-width"
              />
            </div>
          ))}
        </div>
      )}

      {/* Dynamic Props Section - Accordion Style */}
      <Accordion
        items={allProps.filter(prop => {
          const propNameLower = prop.name.toLowerCase()
          const propConfig = toolbarConfig?.props?.[propNameLower]
          if (!propConfig) {
            return false
          }
          const isVisible = getPropVisible(componentName, prop.name)
          return isVisible
        }).map(prop => {
          const Icon = getPropIconComponent(prop)
          const propKey = prop.name
          const isOpen = openPropControl.has(propKey)
          
          return {
            id: propKey,
            title: getPropLabel(componentName, prop.name) || toSentenceCase(prop.name),
            icon: Icon || undefined,
            content: (
              <PropControlContent
                key={`${propKey}-${isOpen ? 'open' : 'closed'}`}
                prop={prop}
                componentName={componentName}
                selectedVariants={selectedVariants}
                selectedLayer={selectedLayer}
              />
            ),
            open: isOpen,
          }
        }).filter(item => item.icon != null).sort((a, b) => {
          // Sort alphabetically by title
          return a.title.localeCompare(b.title)
        })}
        allowMultiple={true}
        onToggle={(id, open) => {
          if (open) {
            setOpenPropControl(prev => new Set(prev).add(id))
          } else {
            setOpenPropControl(prev => {
              const next = new Set(prev)
              next.delete(id)
              return next
            })
          }
        }}
        layer="layer-0"
      />

      {/* Reset Button */}
      <div style={{ padding: 'var(--recursica-brand-dimensions-general-md)', borderTop: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-0-property-border-color)` }}>
        <Button
          onClick={handleReset}
          variant="outline"
          layer="layer-0"
          style={{
            width: '100%',
          }}
          icon={(() => {
            const ResetIcon = iconNameToReactComponent('arrow-path')
            return ResetIcon ? <ResetIcon style={{ width: 16, height: 16 }} /> : undefined
          })()}
        >
          Reset to defaults
        </Button>
      </div>

      {/* Switches Section */}
      <div style={{ 
        padding: 'var(--recursica-brand-dimensions-general-md)', 
        borderTop: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-0-property-border-color)`,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--recursica-brand-dimensions-general-sm)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--recursica-brand-dimensions-general-default)',
        }}>
          <Switch
            checked={showUnmapped}
            onChange={setShowUnmapped}
            layer="layer-0"
          />
          <label 
            onClick={() => setShowUnmapped(!showUnmapped)}
            style={{
              color: `var(--recursica-brand-themes-${mode}-layer-layer-0-property-element-text-color)`,
              opacity: `var(--recursica-brand-themes-${mode}-layer-layer-0-property-element-text-low-emphasis)`,
              fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
              cursor: 'pointer',
              flex: 1,
            }}>
            Show unmapped ({unmappedCount} / {totalCount})
          </label>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--recursica-brand-dimensions-general-default)',
        }}>
          <Switch
            checked={debugMode}
            onChange={setDebugMode}
            layer="layer-0"
          />
          <label 
            onClick={() => setDebugMode(!debugMode)}
            style={{
              color: `var(--recursica-brand-themes-${mode}-layer-layer-0-property-element-text-color)`,
              opacity: `var(--recursica-brand-themes-${mode}-layer-layer-0-property-element-text-low-emphasis)`,
              fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
              cursor: 'pointer',
              flex: 1,
            }}>
            Debug mode
          </label>
        </div>
      </div>
    </div>
  )
}
