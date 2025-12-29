/**
 * Component Toolbar
 * 
 * A toolbar for editing component CSS variables with variant selection,
 * layer selection, and prop controls.
 */

import { useState, useMemo, useRef, useEffect } from 'react'
import { parseComponentStructure, toSentenceCase, ComponentProp } from './utils/componentToolbarUtils'
import VariantDropdown from './menu/dropdown/VariantDropdown'
import LayerDropdown from './menu/dropdown/LayerDropdown'
import PropControl from './menu/floating-palette/PropControl'
import MenuIcon from './menu/MenuIcon'
import { iconNameToReactComponent } from '../components/iconUtils'
import { getPropIcon, getPropLabel, getPropVisible, loadToolbarConfig } from './utils/loadToolbarConfig'
import { getComponentCssVar } from '../../components/utils/cssVarNames'
import './ComponentToolbar.css'

export interface ComponentToolbarProps {
  componentName: string
  selectedVariants: Record<string, string> // e.g., { color: "solid", size: "default" }
  selectedLayer: string // e.g., "layer-0"
  onVariantChange: (prop: string, variant: string) => void
  onLayerChange: (layer: string) => void
  onPropControlChange?: (propName: string | null) => void
}

export default function ComponentToolbar({
  componentName,
  selectedVariants,
  selectedLayer,
  onVariantChange,
  onLayerChange,
  onPropControlChange,
}: ComponentToolbarProps) {
  const [openPropControl, setOpenPropControl] = useState<string | null>(null)

  // Notify parent when prop control opens/closes
  useEffect(() => {
    onPropControlChange?.(openPropControl)
  }, [openPropControl, onPropControlChange])
  const [openDropdown, setOpenDropdown] = useState<string | null>(null) // Track which dropdown is open: 'variant-{propName}', 'layer'
  const iconRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  const structure = useMemo(() => parseComponentStructure(componentName), [componentName])

  // Get toolbar config to preserve order
  const toolbarConfig = useMemo(() => {
    return loadToolbarConfig(componentName)
  }, [componentName])

  // Filter variants to only show those with more than one option, sorted by config order
  const visibleVariants = useMemo(() => {
    const filtered = structure.variants.filter(variant => variant.variants.length > 1)
    
    // Sort by order in toolbar config
    if (toolbarConfig?.variants) {
      const configOrder = Object.keys(toolbarConfig.variants)
      return filtered.sort((a, b) => {
        const aIndex = configOrder.indexOf(a.propName.toLowerCase())
        const bIndex = configOrder.indexOf(b.propName.toLowerCase())
        // If not found in config, keep original order (put at end)
        if (aIndex === -1 && bIndex === -1) return 0
        if (aIndex === -1) return 1
        if (bIndex === -1) return -1
        return aIndex - bIndex
      })
    }
    
    return filtered
  }, [structure.variants, toolbarConfig])

  // Close any open dropdowns and prop controls when component changes
  useEffect(() => {
    setOpenDropdown(null)
    setOpenPropControl(null)
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
      let groupedParent: string | null = null
      let matchedGroupKey: string | null = null
      if (toolbarConfig?.props) {
        for (const [key, propConfig] of Object.entries(toolbarConfig.props)) {
          if (propConfig.group) {
            // Check if this prop name matches any key in the group config
            // The group config keys might be hyphenated (border-size) or match exactly
            const groupKeys = Object.keys(propConfig.group)
            for (const groupKey of groupKeys) {
              const groupKeyLower = groupKey.toLowerCase()
              // Exact match
              if (groupKeyLower === propNameLower) {
                groupedParent = key
                matchedGroupKey = groupKey
                break
              }
              // Special case: border-color might be stored as "border" in color category
              if (groupKeyLower === 'border-color' && propNameLower === 'border' && prop.category === 'color') {
                groupedParent = key
                matchedGroupKey = groupKey
                break
              }
            }
            if (groupedParent) break
          }
        }
      }
      if (groupedParent && groupedParent.toLowerCase() !== propNameLower) {
        // This prop is grouped under another prop
        if (!groupedPropsMap.has(groupedParent.toLowerCase())) {
          groupedPropsMap.set(groupedParent.toLowerCase(), new Map())
        }
        // Use the matched group key name (e.g., "border-size", "border-radius", "border-color")
        const mapKey = matchedGroupKey ? matchedGroupKey.toLowerCase() : propNameLower
        groupedPropsMap.get(groupedParent.toLowerCase())!.set(mapKey, prop)
        return // Skip adding to main props for now
      }
    })

    // Second pass: add props to the map, skipping those that are in groups (they'll be added in the grouping pass)
    structure.props.forEach(prop => {
      const propNameLower = prop.name.toLowerCase()
      
      // Skip props that are in a group (they'll be handled in the grouping pass)
      let isGrouped = false
      if (toolbarConfig?.props) {
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
        // If we already have this prop, prefer non-variant over variant-specific
        // OR prefer the one that matches the selected variant
        const existing = propsMap.get(key)!
        
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
          // Start with props already collected in first pass
          const groupedProps = groupedPropsMap.get(parentPropName.toLowerCase()) || new Map()
          
          // Also check if the parent prop itself is in the structure (it might be in its own group)
          const parentProp = structure.props.find(p => p.name.toLowerCase() === parentPropName.toLowerCase())
          if (parentProp && !groupedProps.has(parentPropName.toLowerCase())) {
            groupedProps.set(parentPropName.toLowerCase(), parentProp)
          }
          
          // Also add any props from the group config that might not have been found yet
          for (const [groupedPropName] of Object.entries(parentPropConfig.group)) {
            const groupedPropKey = groupedPropName.toLowerCase()
            
            // Skip if already in the map (from first pass)
            if (groupedProps.has(groupedPropKey)) {
              continue
            }
            
            let groupedProp: ComponentProp | undefined
            
            // First, check if it was already collected in first pass (shouldn't happen, but just in case)
            groupedProp = groupedProps.get(groupedPropKey)
            
              // If not found, search in structure.props
              if (!groupedProp) {
                // Try exact name match first (any category) - this should catch most cases
                groupedProp = structure.props.find(p => p.name.toLowerCase() === groupedPropKey)
                if (componentName === 'Chip' && (groupedPropKey === 'border-size' || groupedPropKey === 'border-radius') && !groupedProp) {
                  console.log(`ComponentToolbar: Third pass - Exact match failed for ${groupedPropKey}, trying alternative search...`)
                  // Try with root category explicitly
                  groupedProp = structure.props.find(p => 
                    p.name.toLowerCase() === groupedPropKey && 
                    (p.category === 'root' || p.category === '' || !p.category || p.category === undefined)
                  )
                  if (groupedProp) {
                    console.log(`ComponentToolbar: Third pass - Found ${groupedPropKey} with root category filter:`, groupedProp.name, groupedProp.category)
                  }
                }
                
                // Special case: border-color is stored as "border" in the color category
                if (!groupedProp && groupedPropKey === 'border-color') {
                  groupedProp = structure.props.find(p => p.name.toLowerCase() === 'border' && p.category === 'color')
                }
                
                // For border-size and border-radius, they're at top level (root category)
                // Try multiple search strategies to ensure we find them
                if (!groupedProp && (groupedPropKey === 'border-size' || groupedPropKey === 'border-radius')) {
                  // Strategy 1: Try root category explicitly (they're at top level)
                  groupedProp = structure.props.find(p => 
                    p.name.toLowerCase() === groupedPropKey && 
                    (p.category === 'root' || p.category === '' || !p.category || p.category === undefined)
                  )
                  // Strategy 2: Try any category (fallback)
                  if (!groupedProp) {
                    groupedProp = structure.props.find(p => p.name.toLowerCase() === groupedPropKey)
                  }
                }
                
                // For min-width and max-width, they might be at top level or in size category
                if (!groupedProp && (groupedPropKey === 'min-width' || groupedPropKey === 'max-width')) {
                  // Try root category first (top level) - max-width is typically at root level in UIKit.json
                  groupedProp = structure.props.find(p => 
                    p.name.toLowerCase() === groupedPropKey && 
                    (p.category === 'root' || p.category === '' || !p.category || p.category === undefined)
                  )
                  // Try size category (for variant-specific min/max-width)
                  if (!groupedProp) {
                    groupedProp = structure.props.find(p => 
                      p.name.toLowerCase() === groupedPropKey && 
                      p.category === 'size'
                    )
                  }
                  // Final fallback: any category - ensure we find it even if category is unexpected
                  if (!groupedProp) {
                    groupedProp = structure.props.find(p => p.name.toLowerCase() === groupedPropKey)
                  }
                  // Additional check: ensure the CSS variable name is correct for component-level properties
                  // max-width should use --recursica-ui-kit-components-{component}-max-width
                  if (groupedProp && groupedPropKey === 'max-width') {
                    const expectedCssVar = `--recursica-ui-kit-components-${componentName.toLowerCase()}-max-width`
                    if (groupedProp.cssVar !== expectedCssVar) {
                      console.warn(`ComponentToolbar: max-width CSS variable mismatch. Expected: ${expectedCssVar}, Found: ${groupedProp.cssVar}`)
                    }
                  }
                }
              }
            
            if (groupedProp) {
              groupedProps.set(groupedPropKey, groupedProp)
            } else {
                // Debug: log all available props to help diagnose
                const allBorderProps = structure.props.filter(p => 
                  p.name.toLowerCase().includes('border') || 
                  (groupedPropKey.includes('border') && p.category === 'color' && p.name.toLowerCase() === 'border')
                )
                const allSizeProps = structure.props.filter(p => p.category === 'size')
                const exactMatches = structure.props.filter(p => p.name.toLowerCase() === groupedPropKey)
                console.warn(`ComponentToolbar: Could not find grouped prop "${groupedPropName}" for "${parentPropName}".`, 
                  `\n  Searched in ${structure.props.length} props.`,
                  `\n  Looking for: "${groupedPropKey}"`,
                  `\n  Exact name matches:`, exactMatches.map(p => `${p.name} (${p.category})`),
                  `\n  Border-related props:`, allBorderProps.map(p => `${p.name} (${p.category})`),
                  `\n  Size props:`, allSizeProps.map(p => `${p.name}`),
                  `\n  All props with "border" in name:`, structure.props.filter(p => p.name.toLowerCase().includes('border')).map(p => `${p.name} (${p.category})`),
                  `\n  Root category props:`, structure.props.filter(p => p.category === 'root' || !p.category).map(p => `${p.name} (${p.category})`),
                  `\n  First 20 all props:`, structure.props.slice(0, 20).map(p => `${p.name} (${p.category})`))
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
              // Always replace any existing prop with this name (combined props take precedence)
              propsMap.set(parentPropName.toLowerCase(), combinedProp)
              seenProps.add(parentPropName.toLowerCase())
            }
          }
        }
      }
    }

    // Filter props based on selected variants and layer
    const filteredProps = Array.from(propsMap.values()).filter(prop => {
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
            } else if (prop.category === 'color' && (prop.variantProp === 'style' || prop.variantProp === 'style-secondary')) {
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
          if ((prop.variantProp === 'style' || prop.variantProp === 'style-secondary') && prop.category === 'color') {
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
      if (prop.category === 'color' && prop.path.some(p => p.startsWith('layer-'))) {
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
    // Remove all CSS var overrides for this component
    // This will make them fall back to their computed values (from JSON defaults)
    structure.props.forEach(prop => {
      // Remove the inline style override to restore to default
      document.documentElement.style.removeProperty(prop.cssVar)
    })

    // Also reset component-level properties that might not be in structure.props
    // For Chip, reset min-width and max-width (Chip uses Button's max-width)
    if (componentName === 'Chip') {
      // Reset Chip's min-width
      const chipMinWidthVar = getComponentCssVar('Chip', 'size', 'min-width', undefined)
      document.documentElement.style.removeProperty(chipMinWidthVar)
      
      // Reset Button's max-width (Chip uses Button's max-width)
      const buttonMaxWidthVar = getComponentCssVar('Button', 'size', 'max-width', undefined)
      document.documentElement.style.removeProperty(buttonMaxWidthVar)
    }

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
    <div className="component-toolbar" data-layer="layer-1">
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
      </div>

      {/* Dynamic Variants Section - Only show if there are variants with more than one option */}
      {visibleVariants.length > 0 && (
        <div className="toolbar-section-group">
          <span className="toolbar-section-label">Variants</span>
          {visibleVariants.map(variant => (
            <VariantDropdown
              key={variant.propName}
              componentName={componentName}
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
      )}

      {/* Dynamic Props Section */}
      <div className="toolbar-section-group">
        <span className="toolbar-section-label">Props</span>
        {allProps.filter(prop => {
          const propNameLower = prop.name.toLowerCase()
          // Only show props that are in the config
          const propConfig = toolbarConfig?.props?.[propNameLower]
          if (!propConfig) {
            return false
          }
          // Filter out props with visible: false
          return getPropVisible(componentName, prop.name)
        }).map(prop => {
          const Icon = getPropIconComponent(prop)
          
          // Ensure all props have an icon - if not, log a warning and skip rendering
          if (!Icon) {
            console.warn(`ComponentToolbar: Prop "${prop.name}" does not have an icon and will not be rendered. Add it to ${componentName}.toolbar.json config or ensure it's handled in a floating panel.`)
            return null
          }
          
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
                title={getPropLabel(componentName, prop.name) || toSentenceCase(prop.name)}
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
        }).filter(Boolean)}
        

      </div>

      {/* Reset Button */}
      <MenuIcon
        icon={iconNameToReactComponent('arrow-path')}
        onClick={handleReset}
        title="Reset to defaults"
        className="toolbar-reset-button"
      />
    </div>
  )
}
