/**
 * Component Toolbar
 * 
 * A toolbar for editing component CSS variables with variant selection,
 * layer selection, and prop controls.
 */

import { useState, useMemo, useRef, useEffect } from 'react'
import { parseComponentStructure, toSentenceCase, ComponentProp, pathMatchesVariant, VARIANT_PROP_TO_CATEGORY } from './utils/componentToolbarUtils'
import VariantDropdown from './menu/dropdown/VariantDropdown'
import VariantSwitch from './menu/dropdown/VariantSwitch'
import { SegmentedControl } from '../../components/adapters/SegmentedControl'
import type { SegmentedControlItem } from '../../components/adapters/SegmentedControl'
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
import tokensJson from '../../../recursica_tokens.json'
import brandJson from '../../../recursica_brand.json'
import { getComponentTextCssVar, buildComponentCssVarPath } from '../../components/utils/cssVarNames'
import type { ComponentName } from '../../components/registry/types'
import './ComponentToolbar.css'
import { layerProperty, layerText } from '../../core/css/cssVarBuilder'
import { getVarsStore } from '../../core/store/varsStore'
import {
  cloneVariantInUIKit,
  deleteCustomVariant,
  listCustomVariants,
  getExistingVariantNames,
  getExistingAxes,
  axisToCategoryKey,
  categoryKeyToAxis,
} from '../../core/uikit/createVariantInUIKit'
import { CreateVariantModal } from './modals/CreateVariantModal'
import { DeleteVariantModal } from './modals/DeleteVariantModal'
import { Modal } from '../../components/adapters/Modal'

export interface ComponentToolbarProps {
  componentName: ComponentName
  selectedVariants: Record<string, string> // e.g., { color: "solid", size: "default" }
  selectedLayer: string // e.g., "layer-0"
  onVariantChange: (prop: string, variant: string) => void
  onLayerChange: (layer: string) => void
}

/**
 * Returns suffixes that disambiguate sub-components whose CSS var keys
 * share a prefix with the given componentKey.
 * e.g. "timeline" has sub-component "timeline-bullet", so suffix is "bullet-".
 */
const SUB_COMPONENT_MAP: Record<string, string[]> = {
  'timeline': ['bullet-'],
  // Add more entries here as needed for other parent/child component pairs
}

function getSubComponentSuffixes(componentKey: string): string[] {
  return SUB_COMPONENT_MAP[componentKey] || []
}

// pathMatchesVariant and VARIANT_PROP_TO_CATEGORY imported from shared utils

export default function ComponentToolbar({
  componentName,
  selectedVariants,
  selectedLayer,
  onVariantChange,
  onLayerChange,
}: ComponentToolbarProps) {
  const { mode } = useThemeMode()
  const { tokens, theme, uikit } = useVars()
  const { debugMode, setDebugMode } = useDebugMode()
  const [openPropControl, setOpenPropControl] = useState<Set<string>>(new Set())

  // Custom variant modal state
  const [createVariantModalOpen, setCreateVariantModalOpen] = useState(false)
  const [deleteVariantModalOpen, setDeleteVariantModalOpen] = useState(false)
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
  const [createVariantAxis, setCreateVariantAxis] = useState<string>('')
  const [createVariantExistingNames, setCreateVariantExistingNames] = useState<string[]>([])

  // Build a lightweight signature of the custom variant names in the LIVE store.
  // Only changes when variants are added/deleted — NOT on color edits (setUiKitSilent
  // uses the same object reference, so VarsContext never re-renders).
  const liveUikitVariantSignature = useMemo(() => {
    const liveUikit = getVarsStore().getState().uikit as any
    const components = liveUikit?.['ui-kit']?.components ?? liveUikit?.components ?? {}
    let compKey = componentName.toLowerCase().replace(/\s+/g, '-')
    if (compKey === 'checkbox-group-item') compKey = 'checkbox-item'
    if (compKey === 'radio-button-group-item') compKey = 'radio-button-item'
    if (compKey === 'hover-card-/-popover') compKey = 'hover-card-popover'
    const comp = components[compKey]
    if (!comp?.variants) return componentName
    return Object.entries(comp.variants as Record<string, any>)
      .map(([axis, axisObj]) => {
        const names = Object.keys(axisObj ?? {}).filter((k: string) => !k.startsWith('$'))
        return `${axis}:${names.join(',')}`
      })
      .join('|')
  }, [componentName, uikit])

  // Use the static import for base structure so color edits (setUiKitSilent, same object
  // reference) do not re-run this memo and interrupt in-progress prop control interactions.
  const structure = useMemo(() => parseComponentStructure(componentName), [componentName])

  // A separate parse from the LIVE store gives us props for custom variants only.
  // Keyed on liveUikitVariantSignature so it only recomputes when variants change.
  const liveStructure = useMemo(
    () => parseComponentStructure(componentName, getVarsStore().getState().uikit),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [componentName, liveUikitVariantSignature]
  )

  // Get toolbar config to preserve order
  const toolbarConfig = useMemo(() => {
    return loadToolbarConfig(componentName)
  }, [componentName])

  // Filter variants to only show those with more than one option AND are in the toolbar config, sorted by config order
  const visibleVariants = useMemo(() => {
    const filtered = liveStructure.variants.filter(variant => variant.variants.length >= 1)

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

    // No toolbar config variants section: show any axes that exist in the live uikit.
    // This is needed for custom variants created on zero-variant components (e.g. breadcrumb)
    // which have no pre-existing toolbar config for their axis.
    return filtered

  }, [liveStructure.variants, toolbarConfig, componentName, selectedVariants, liveUikitVariantSignature])

  useEffect(() => {
    setOpenPropControl(new Set())
  }, [componentName])

  // Resolve the component key as used in uikit JSON
  const componentKey = useMemo(() => {
    let key = componentName.toLowerCase().replace(/\s+/g, '-')
    if (key === 'checkbox-group-item') key = 'checkbox-item'
    if (key === 'radio-button-group-item') key = 'radio-button-item'
    if (key === 'hover-card-/-popover') key = 'hover-card-popover'
    return key
  }, [componentName])

  // List custom variants for this component (re-derived from live uikit store)
  const customVariants = useMemo(() => {
    const liveUikit = getVarsStore().getState().uikit
    return listCustomVariants(liveUikit, componentKey)
  }, [componentKey, uikit]) // uikit dep causes re-run when store is updated

  // Detect whether this component has zero variant axes
  const hasNoVariantAxes = visibleVariants.length === 0

  // Handlers
  const handleOpenCreateVariant = (axisName: string, existingNames: string[]) => {
    setCreateVariantAxis(axisName)
    setCreateVariantExistingNames(existingNames)
    setCreateVariantModalOpen(true)
  }

  const handleCreateVariant = (axisCategory: string, sourceVariantName: string, newVariantName: string) => {
    const store = getVarsStore()
    // cloneVariantInUIKit returns a fresh deep-clone (never mutates the input)
    const updated = cloneVariantInUIKit(store.getState().uikit, componentKey, axisCategory, sourceVariantName, newVariantName)
    store.setUiKit(updated)
    // Auto-select the new variant (use lowercase key to match the JSON key stored by cloneVariantInUIKit)
    const axisName = categoryKeyToAxis(axisCategory)
    onVariantChange(axisName, newVariantName.toLowerCase())
  }

  const handleDeleteVariant = (axisCategory: string, variantName: string) => {
    const store = getVarsStore()
    const liveUikit = store.getState().uikit
    // deleteCustomVariant returns a fresh deep-clone (never mutates the input)
    const updated = deleteCustomVariant(liveUikit, componentKey, axisCategory, variantName)
    store.setUiKit(updated)
    // If the deleted variant was currently selected, switch to first remaining variant on that axis
    const axisName = categoryKeyToAxis(axisCategory)
    if (selectedVariants[axisName] === variantName) {
      const remaining = getExistingVariantNames(updated, componentKey, axisCategory)
      if (remaining.length > 0) {
        onVariantChange(axisName, remaining[0])
      }
    }
  }

  // Get all unique props (one icon per prop name, regardless of variants or layers)
  // Show both non-variant props and variant props (both color and size), but only one icon per prop name
  // Build props list based purely on toolbar config
  const allProps = useMemo(() => {
    const propsMap = new Map<string, ComponentProp>()
    const seenProps = new Set<string>()
    const groupedPropsMap = new Map<string, Map<string, ComponentProp>>() // Map of parent prop name -> map of grouped prop names -> props

    // First pass: collect all props and identify which ones are grouped
    liveStructure.props.forEach(prop => {
      const propNameLower = prop.name.toLowerCase()

      // Check if this prop is part of a group in the config (but not if it's the parent prop itself)
      // IMPORTANT: Skip grouping check for text-group props - they are always standalone
      // For nested groups like selected/unselected (Tabs), match by path so border-size under "selected" goes to selected, not unselected
      let groupedParent: string | null = null
      if (prop.type !== 'text-group' && toolbarConfig?.props) {
        for (const [key, propConfig] of Object.entries(toolbarConfig.props)) {
          if (propConfig.group && propConfig.group[propNameLower]) {
            const keyLower = key.toLowerCase()
            if (prop.path.includes(keyLower)) {
              groupedParent = key
              break
            }
          }
        }
        if (!groupedParent) {
          for (const [key, propConfig] of Object.entries(toolbarConfig.props)) {
            if (propConfig.group && propConfig.group[propNameLower]) {
              groupedParent = key
              break
            }
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
    liveStructure.props.forEach(prop => {
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
            pathMatchesVariant(existing.path, existing.variantProp, selectedVariants[existing.variantProp])
          const newMatches = prop.variantProp && selectedVariants[prop.variantProp] &&
            pathMatchesVariant(prop.path, prop.variantProp, selectedVariants[prop.variantProp])

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

    // Third pass: create grouped props from config AND add props from config that aren't in structure yet
    if (toolbarConfig?.props) {
      // First, add any props from config that aren't in structure yet (like text-group props)
      for (const [configPropName, propConfig] of Object.entries(toolbarConfig.props)) {
        const configPropNameLower = configPropName.toLowerCase()
        // Skip if it's already in propsMap or if it has a group (groups are handled separately)
        if (!propsMap.has(configPropNameLower) && !propConfig.group) {
          // Check if this prop exists in structure but wasn't added (shouldn't happen, but check anyway)
          let structureProp = liveStructure.props.find(p => p.name.toLowerCase() === configPropNameLower)
          // Special case: text-color in toolbar config maps to "text" in UIKit structure (colors category)
          // Must also filter by selected variant for components with variant-specific colors
          if (!structureProp && configPropNameLower === 'text-color') {
            const textColorProp = liveStructure.props.find(p => {
              if (p.name.toLowerCase() !== 'text' || p.category !== 'colors') return false
              // Filter by variant if prop is variant-specific
              if (p.isVariantSpecific && p.variantProp) {
                const selectedVariant = selectedVariants[p.variantProp]
                if (!selectedVariant) return false
                if (!pathMatchesVariant(p.path, p.variantProp, selectedVariant)) return false
              }
              // Filter by layer
              const layerInPath = p.path.find(part => part.startsWith('layer-'))
              if (layerInPath && layerInPath !== selectedLayer) return false
              return true
            })
            if (textColorProp) {
              // Clone the prop with name overridden to "text-color" so label/icon lookup uses the config's text-color entry
              structureProp = { ...textColorProp, name: 'text-color' }
            }
          }
          if (structureProp) {
            // It exists in structure but wasn't added - add it now
            if (!seenProps.has(configPropNameLower)) {
              seenProps.add(configPropNameLower)
              propsMap.set(configPropNameLower, structureProp)
            }
          }
        }

        // If a prop has a group but doesn't exist in structure, create a synthetic prop for it
        // This allows grouping-only props (like "spacing") to appear in the toolbar
        if (propConfig.group && !propsMap.has(configPropNameLower)) {
          const syntheticProp: ComponentProp = {
            name: configPropName,
            category: 'size', // Default category for grouping props
            type: 'dimension',
            cssVar: '', // Empty CSS var since this is just a grouping prop
            path: ['properties', configPropNameLower],
            isVariantSpecific: false,
          }
          if (!seenProps.has(configPropNameLower)) {
            seenProps.add(configPropNameLower)
            propsMap.set(configPropNameLower, syntheticProp)
          }
        }
      }

      for (const [parentPropName, parentPropConfig] of Object.entries(toolbarConfig.props)) {
        if (parentPropConfig.group) {
          // Get or create the grouped props map for this parent prop
          let groupedProps = groupedPropsMap.get(parentPropName.toLowerCase())
          if (!groupedProps) {
            groupedProps = new Map()
            groupedPropsMap.set(parentPropName.toLowerCase(), groupedProps)
          }

          // Also check if the parent prop itself is in the structure (it might be in its own group)
          const parentProp = liveStructure.props.find(p => p.name.toLowerCase() === parentPropName.toLowerCase())
          if (parentProp && !groupedProps.has(parentPropName.toLowerCase())) {
            groupedProps.set(parentPropName.toLowerCase(), parentProp)
          }

          // Also add any props from the group config that might not have been found yet
          for (const [groupedPropName] of Object.entries(parentPropConfig.group)) {
            const groupedPropKey = groupedPropName.toLowerCase()
            // Check if we need to update the cached prop (if layer changed, variant changed, or prop doesn't exist)
            const cachedProp = groupedProps.get(groupedPropKey)
            const needsUpdate = !cachedProp ||
              (cachedProp.path.some(part => part.startsWith('layer-')) &&
                !cachedProp.path.includes(selectedLayer)) ||
              (cachedProp.isVariantSpecific && cachedProp.variantProp &&
                selectedVariants[cachedProp.variantProp] &&
                !pathMatchesVariant(cachedProp.path, cachedProp.variantProp, selectedVariants[cachedProp.variantProp]))

            if (!groupedProps.has(groupedPropKey) || needsUpdate) {
              // For nested property groups like "container", "selected", "selected-item", and "unselected-item", match props by name AND path
              // Check if the parent prop name is in the path (e.g., "container", "selected", "selected-item", or "unselected-item")
              const parentPropNameLower = parentPropName.toLowerCase()
              const isNestedPropertyGroup = parentPropNameLower === 'container' || parentPropNameLower === 'selected' || parentPropNameLower === 'unselected' || parentPropNameLower === 'active' || parentPropNameLower === 'inactive' || parentPropNameLower === 'selected-item' || parentPropNameLower === 'unselected-item' || parentPropNameLower === 'thumb-selected' || parentPropNameLower === 'thumb-unselected' || parentPropNameLower === 'track-selected' || parentPropNameLower === 'track-unselected'


              let groupedProp = liveStructure.props.find(p => {
                const nameMatches = p.name.toLowerCase() === groupedPropKey
                const pathMatches = p.path.includes(parentPropNameLower)
                // For color props, also filter by selectedLayer to ensure we get the correct layer
                const layerMatches = !p.path.some(part => part.startsWith('layer-')) || p.path.includes(selectedLayer)
                // For variant-specific props, filter by selected variant (e.g., state variant for TextField border-size)
                let variantMatches = true
                if (p.isVariantSpecific && p.variantProp) {
                  const selectedVariant = selectedVariants[p.variantProp]
                  if (selectedVariant) {
                    variantMatches = pathMatchesVariant(p.path, p.variantProp, selectedVariant)
                  } else {
                    // If no variant is selected for this variantProp, don't match variant-specific props
                    variantMatches = false
                  }
                }
                return nameMatches && pathMatches && layerMatches && variantMatches
              })


              // Special case: placeholder-opacity is a component-level property, not a variant-level color
              // It's in the "colors" group but doesn't have "colors" in its path
              if (!groupedProp && groupedPropKey === 'placeholder-opacity') {
                groupedProp = liveStructure.props.find(p => {
                  const nameMatches = p.name.toLowerCase() === 'placeholder-opacity'
                  // Must be component-level (not variant-specific)
                  const isComponentLevel = !p.isVariantSpecific
                  return nameMatches && isComponentLevel
                })
              }

              if (!groupedProp && (groupedPropKey === 'label-optional-text-gap' || groupedPropKey === 'edit-icon-gap')) {
                groupedProp = liveStructure.props.find(p => {
                  const nameMatches = p.name.toLowerCase() === groupedPropKey
                  // Must be component-level (not variant-specific)
                  const isComponentLevel = !p.isVariantSpecific
                  return nameMatches && isComponentLevel
                })
              }

              // Special case: tab-content-alignment is a component-level property for Tabs
              // It's in the "spacing" group but doesn't have "spacing" in its path
              if (!groupedProp && groupedPropKey === 'tab-content-alignment' && componentName.toLowerCase() === 'tabs') {
                groupedProp = liveStructure.props.find(p => {
                  const nameMatches = p.name.toLowerCase() === 'tab-content-alignment'
                  const isComponentLevel = !p.isVariantSpecific
                  return nameMatches && isComponentLevel
                })
              }
              // tabs-content-gap is under both style and orientation; match by both
              if (!groupedProp && groupedPropKey === 'tabs-content-gap' && componentName.toLowerCase() === 'tabs') {
                groupedProp = liveStructure.props.find(p => {
                  const nameMatches = p.name.toLowerCase() === 'tabs-content-gap'
                  const styleMatches = !selectedVariants.style || pathMatchesVariant(p.path, 'style', selectedVariants.style)
                  const orientationMatches = !selectedVariants.orientation || pathMatchesVariant(p.path, 'orientation', selectedVariants.orientation)
                  return nameMatches && styleMatches && orientationMatches
                })
              }

              // Special case: "text" or "text-hover" as children of the "text-color" group
              // Need to find color-category props specifically (not text-group props which also have name "text")
              // and filter by selected variant for components with variant-specific colors (e.g., Button)
              if (!groupedProp && (groupedPropKey === 'text' || groupedPropKey === 'text-hover') && parentPropNameLower === 'text-color') {
                groupedProp = liveStructure.props.find(p => {
                  if (p.name.toLowerCase() !== groupedPropKey || p.category !== 'colors' || !p.path.includes('colors')) return false
                  // Filter by layer
                  const layerInPath = p.path.find(part => part.startsWith('layer-'))
                  if (layerInPath && layerInPath !== selectedLayer) return false
                  // Filter by variant if prop is variant-specific
                  if (p.isVariantSpecific && p.variantProp) {
                    const selectedVariant = selectedVariants[p.variantProp]
                    if (!selectedVariant) return false
                    if (!pathMatchesVariant(p.path, p.variantProp, selectedVariant)) return false
                  }
                  return true
                })
              }



              // For nested property groups (selected, unselected, etc.), fall back to component-level
              // props that don't have the parent path (e.g., icon-size in a "selected" group)
              if (!groupedProp && isNestedPropertyGroup) {
                groupedProp = liveStructure.props.find(p => {
                  const nameMatches = p.name.toLowerCase() === groupedPropKey
                  const isComponentLevel = !p.isVariantSpecific
                  // Don't match props that belong to a DIFFERENT nested group
                  const notInOtherGroup = !p.path.includes('unselected') && !p.path.includes('indeterminate')
                  const layerMatches = p.category !== 'colors' || !p.path.some(part => part.startsWith('layer-')) || p.path.includes(selectedLayer)
                  return nameMatches && isComponentLevel && notInOtherGroup && layerMatches
                })
              }

              // Special case: border-color is stored as "border" in the color category
              if (!groupedProp && groupedPropKey === 'border-color') {
                groupedProp = liveStructure.props.find(p => {
                  const nameMatches = p.name.toLowerCase() === 'border-color' || (p.name.toLowerCase() === 'border' && p.category === 'colors')
                  const pathMatches = p.path.includes(parentPropNameLower)
                  // For color props, also filter by selectedLayer
                  const layerMatches = !p.path.some(part => part.startsWith('layer-')) || p.path.includes(selectedLayer)
                  return nameMatches && pathMatches && layerMatches
                })
                // Variant-aware fallback: find border-color in colors category for the selected variant
                // (badge and similar components have border-color at colors.layer-0.border-color,
                //  so path never contains 'border' as a standalone segment)
                if (!groupedProp) {
                  groupedProp = liveStructure.props.find(p => {
                    if ((p.name.toLowerCase() !== 'border-color' && !(p.name.toLowerCase() === 'border' && p.category === 'colors')) || p.category !== 'colors') return false
                    const layerMatches = !p.path.some(part => part.startsWith('layer-')) || p.path.includes(selectedLayer)
                    if (!layerMatches) return false
                    if (p.isVariantSpecific && p.variantProp) {
                      const selectedVariant = selectedVariants[p.variantProp]
                      if (!selectedVariant) return false
                      if (!pathMatchesVariant(p.path, p.variantProp, selectedVariant)) return false
                    }
                    return true
                  })
                }
              }
              // Special case: interactive-color maps to "interactive" prop under colors.layer-X.interactive
              if (!groupedProp && groupedPropKey === 'interactive-color') {
                // Find all matching props and ensure we get the interactive one
                const matchingProps = liveStructure.props.filter(p => {
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
                const matchingProps = liveStructure.props.filter(p => {
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
                groupedProp = liveStructure.props.find(p =>
                  p.name.toLowerCase() === 'separator-color' &&
                  p.category === 'colors' &&
                  !p.isVariantSpecific &&
                  p.path.includes('colors') &&
                  p.path.includes('separator-color') &&
                  p.path.includes(selectedLayer)
                )
              }
              // Special case: text-color maps to "text" prop under colors.layer-X
              // Must also filter by selected variant for components with variant-specific colors (e.g., Button solid/outline/text)
              if (!groupedProp && groupedPropKey === 'text-color') {
                groupedProp = liveStructure.props.find(p => {
                  if (p.name.toLowerCase() !== 'text' || p.category !== 'colors' || !p.path.includes('colors')) return false
                  // Filter by layer
                  const layerInPath = p.path.find(part => part.startsWith('layer-'))
                  if (layerInPath && layerInPath !== selectedLayer) return false
                  // Filter by variant if prop is variant-specific
                  if (p.isVariantSpecific && p.variantProp) {
                    const selectedVariant = selectedVariants[p.variantProp]
                    if (!selectedVariant) return false
                    if (!pathMatchesVariant(p.path, p.variantProp, selectedVariant)) return false
                  }
                  return true
                })
                // Clone with overridden name so label/icon lookup works correctly
                if (groupedProp) {
                  groupedProp = { ...groupedProp, name: 'text-color' }
                }
              }


              // Special handling: if parent prop is "spacing" or "layout", collect props from all layout variants
              if (!groupedProp && (parentPropName.toLowerCase() === 'spacing' || parentPropName.toLowerCase() === 'layout')) {
                // Find props that match the name and are variant-specific for layout
                const layoutProps = liveStructure.props.filter(p =>
                  p.name.toLowerCase() === groupedPropKey &&
                  p.isVariantSpecific &&
                  p.variantProp === 'layout'
                )
                // Use the first one found (they should all have the same name, just different variant paths)
                if (layoutProps.length > 0) {
                  groupedProp = layoutProps[0]
                }
              }
              // Virtual prop fallback: if config has options (dropdown/segmented), create a virtual prop
              if (!groupedProp && parentPropConfig.group) {
                const childConfig = parentPropConfig.group[groupedPropKey] || parentPropConfig.group[groupedPropName]
                if (childConfig && (childConfig as any).options) {
                  const normalizedName = componentName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '') as ComponentName
                  // Build the correct CSS var path:
                  // If the child key starts with the parent group name (e.g. "active-pages-style" under "active-pages"),
                  // extract the suffix and build path as properties/parentName/suffix.
                  // Otherwise, use the flat key as before.
                  const parentName = parentPropName.toLowerCase()
                  let cssVarPath: string
                  let pathSegments: string[]
                  if (groupedPropKey.startsWith(parentName + '-')) {
                    const suffix = groupedPropKey.slice(parentName.length + 1) // "style", "size", etc.
                    cssVarPath = buildComponentCssVarPath(normalizedName, 'properties', parentName, suffix)
                    pathSegments = ['properties', parentName, suffix]
                  } else {
                    cssVarPath = buildComponentCssVarPath(normalizedName, 'properties', groupedPropKey)
                    pathSegments = ['properties', groupedPropKey]
                  }
                  groupedProp = {
                    name: groupedPropKey,
                    category: 'size',
                    type: 'string',
                    cssVar: cssVarPath,
                    path: pathSegments,
                    isVariantSpecific: false,
                  }
                }
              }
              if (groupedProp) {
                groupedProps.set(groupedPropKey, groupedProp)
                // Also update the groupedPropsMap to ensure consistency
                groupedPropsMap.set(parentPropName.toLowerCase(), groupedProps)
              } else if (needsUpdate && cachedProp) {
                // If we couldn't find a matching prop for the new layer, remove the cached one
                // This prevents using the wrong layer's prop
                groupedProps.delete(groupedPropKey)
                groupedPropsMap.set(parentPropName.toLowerCase(), groupedProps)
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
    // Also handles text-group props that might not have been parsed correctly
    if (toolbarConfig?.props) {
      for (const [propName, propConfig] of Object.entries(toolbarConfig.props)) {
        const propNameLower = propName.toLowerCase()

        // Skip if prop already exists or is a grouped prop
        if (propsMap.has(propNameLower) || propConfig.group) {
          continue
        }

        // Check if this is a text-group prop that exists in recursica_ui-kit.json but wasn't parsed
        const textPropertyGroupNames = ['text', 'header-text', 'content-text', 'label-text', 'optional-text', 'supporting-text']
        if (textPropertyGroupNames.includes(propNameLower)) {
          // Try to find it in liveStructure.props - it should have been parsed
          const structureProp = liveStructure.props.find(p => p.name.toLowerCase() === propNameLower && p.type === 'text-group')
          if (structureProp) {
            // It exists but wasn't added - add it now
            if (!seenProps.has(propNameLower)) {
              seenProps.add(propNameLower)
              propsMap.set(propNameLower, structureProp)
            }
          }
        }

        // Create virtual prop for label-width
        if (componentName.toLowerCase() === 'label' && propNameLower === 'label-width') {
          const layoutVariant = selectedVariants.layout || 'stacked'
          const sizeVariant = selectedVariants.size || 'default'
          const virtualProp: ComponentProp = {
            name: 'label-width',
            category: 'size',
            type: 'dimension',
            cssVar: buildComponentCssVarPath('Label', 'variants', 'layouts', layoutVariant, 'variants', 'sizes', sizeVariant, 'properties', 'width'),
            path: ['variants', 'layouts', layoutVariant, 'variants', 'sizes', sizeVariant, 'properties', 'width'],
            isVariantSpecific: true,
            variantProp: 'layout',
          }
          propsMap.set(propNameLower, virtualProp)
          seenProps.add(propNameLower)
        }

        // Create virtual props for checkbox-group top-bottom-margin (stacked and side-by-side)
        if (componentName.toLowerCase().replace(/\s+/g, '-') === 'checkbox-group' && propNameLower === 'stacked-top-bottom-margin') {
          const virtualProp: ComponentProp = {
            name: 'stacked-top-bottom-margin',
            category: 'size',
            type: 'dimension',
            cssVar: buildComponentCssVarPath('CheckboxGroup', 'variants', 'layouts', 'stacked', 'properties', 'top-bottom-margin'),
            path: ['variants', 'layouts', 'stacked', 'properties', 'top-bottom-margin'],
            isVariantSpecific: false,
          }
          propsMap.set(propNameLower, virtualProp)
          seenProps.add(propNameLower)
        }
        if (componentName.toLowerCase().replace(/\s+/g, '-') === 'checkbox-group' && propNameLower === 'sbs-top-bottom-margin') {
          const virtualProp: ComponentProp = {
            name: 'sbs-top-bottom-margin',
            category: 'size',
            type: 'dimension',
            cssVar: buildComponentCssVarPath('CheckboxGroup', 'variants', 'layouts', 'side-by-side', 'properties', 'top-bottom-margin'),
            path: ['variants', 'layouts', 'side-by-side', 'properties', 'top-bottom-margin'],
            isVariantSpecific: false,
          }
          propsMap.set(propNameLower, virtualProp)
          seenProps.add(propNameLower)
        }

        // Create virtual props for radio-button-group top-bottom-margin (stacked and side-by-side)
        if (componentName.toLowerCase().replace(/\s+/g, '-') === 'radio-button-group' && propNameLower === 'stacked-top-bottom-margin') {
          const virtualProp: ComponentProp = {
            name: 'stacked-top-bottom-margin',
            category: 'size',
            type: 'dimension',
            cssVar: buildComponentCssVarPath('RadioButtonGroup', 'variants', 'layouts', 'stacked', 'properties', 'top-bottom-margin'),
            path: ['variants', 'layouts', 'stacked', 'properties', 'top-bottom-margin'],
            isVariantSpecific: false,
          }
          propsMap.set(propNameLower, virtualProp)
          seenProps.add(propNameLower)
        }
        if (componentName.toLowerCase().replace(/\s+/g, '-') === 'radio-button-group' && propNameLower === 'sbs-top-bottom-margin') {
          const virtualProp: ComponentProp = {
            name: 'sbs-top-bottom-margin',
            category: 'size',
            type: 'dimension',
            cssVar: buildComponentCssVarPath('RadioButtonGroup', 'variants', 'layouts', 'side-by-side', 'properties', 'top-bottom-margin'),
            path: ['variants', 'layouts', 'side-by-side', 'properties', 'top-bottom-margin'],
            isVariantSpecific: false,
          }
          propsMap.set(propNameLower, virtualProp)
          seenProps.add(propNameLower)
        }

        // Create virtual props for Pagination variant/size configuration
        if (componentName.toLowerCase() === 'pagination') {
          // New structure: active-pages/{style,size}, inactive-pages/{style,size}, navigation-controls/{style,size}
          const paginationVirtualProps = [
            { key: 'active-pages-style', parent: 'active-pages', suffix: 'style' },
            { key: 'active-pages-size', parent: 'active-pages', suffix: 'size' },
            { key: 'inactive-pages-style', parent: 'inactive-pages', suffix: 'style' },
            { key: 'inactive-pages-size', parent: 'inactive-pages', suffix: 'size' },
            { key: 'navigation-controls-style', parent: 'navigation-controls', suffix: 'style' },
            { key: 'navigation-controls-size', parent: 'navigation-controls', suffix: 'size' },
            { key: 'navigation-controls-display', parent: 'navigation-controls', suffix: 'display' },
          ]
          for (const { key, parent, suffix } of paginationVirtualProps) {
            if (propNameLower === key) {
              const virtualProp: ComponentProp = {
                name: key,
                category: 'size',
                type: 'string',
                cssVar: buildComponentCssVarPath('Pagination', 'properties', parent, suffix),
                path: ['properties', parent, suffix],
                isVariantSpecific: false,
              }
              propsMap.set(key, virtualProp)
              seenProps.add(key)
            }
          }
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
        const variantInPath = pathMatchesVariant(prop.path, prop.variantProp, selectedVariant)

        if (!variantInPath) {
          // The primary variant is not in the path, check if any selected variant matches
          // This handles cases where we might have multiple variant levels
          const allSelectedVariants = Object.entries(selectedVariants)
          const hasAnySelectedVariant = allSelectedVariants.some(([vProp, vName]) => pathMatchesVariant(prop.path, vProp, vName))

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

      // NOTE: We do NOT filter by layer here. Props like "background" exist on all layers
      // and should always be available in allProps. Layer-specific resolution happens
      // inside individual toolbars (e.g., BackgroundToolbar) which receive selectedLayer.

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
  }, [liveStructure.props, componentName, selectedVariants, selectedLayer, toolbarConfig, liveUikitVariantSignature])

  const handleReset = () => {
    let componentKey = componentName.toLowerCase().replace(/\s+/g, '-')
    // Normalize display names that differ from recursica_ui-kit.json keys
    if (componentKey === 'checkbox-group-item') componentKey = 'checkbox-item'
    if (componentKey === 'radio-button-group-item') componentKey = 'radio-button-item'
    if (componentKey === 'hover-card-/-popover') componentKey = 'hover-card-popover'

    // Helper: check if a CSS var belongs to exactly this component (not a sub-component).
    // CSS vars can have two formats:
    //   Themed:     --recursica_ui-kit_themes_light_components_button_variants_...
    //   Non-themed: --recursica_ui-kit_components_button_variants_...
    // Both use underscores as segment separators.
    const isExactComponentVar = (cssVar: string) => {
      const marker = `_components_${componentKey}_`
      const idx = cssVar.indexOf(marker)
      if (idx === -1) return false
      // Check what follows the component key to ensure it's not a sub-component
      const afterKey = cssVar.substring(idx + marker.length)
      const subComponentSuffixes = getSubComponentSuffixes(componentKey)
      for (const suffix of subComponentSuffixes) {
        if (afterKey.startsWith(suffix)) return false
      }
      return true
    }

    // 1. Remove ALL overrides for this component from the document element
    // This handles all modes, layers, and states by looking for the component key in the variable name
    if (typeof document !== 'undefined') {
      const style = document.documentElement.style
      const propsToRemove: string[] = []

      for (let i = 0; i < style.length; i++) {
        const prop = style[i]
        if (isExactComponentVar(prop)) {
          propsToRemove.push(prop)
        }
      }

      propsToRemove.forEach(prop => style.removeProperty(prop))
    }

    // 2. Build default values from the PRISTINE uikit (deep-cloned at init, never mutated).
    // Using uikitJson directly would include any in-place mutations made by updateUIKitValue
    // (custom variants, color changes), causing reset to restore a modified state.
    const pristineUikit = getVarsStore().getPristineUikit()
    const lightUIKitVars = buildUIKitVars(tokensJson as any, brandJson as any, pristineUikit, 'light')
    const darkUIKitVars = buildUIKitVars(tokensJson as any, brandJson as any, pristineUikit, 'dark')

    const componentDefaults: Record<string, string> = {}

    // Filter to only this component's variables from both modes
    const filterAndAdd = (allVars: Record<string, string>, currentMode: 'light' | 'dark') => {
      Object.entries(allVars).forEach(([cssVar, value]) => {
        if (isExactComponentVar(cssVar)) {
          componentDefaults[cssVar] = value
        }
        // For checkbox-item, also include base checkbox component vars
        if (componentKey === 'checkbox-item' && cssVar.includes('-components-checkbox-')) {
          componentDefaults[cssVar] = value
        }
        // For radio-button-item, also include base radio-button component vars
        if (componentKey === 'radio-button-item' && cssVar.includes('-components-radio-button-')) {
          componentDefaults[cssVar] = value
        }
      })
    }

    filterAndAdd(lightUIKitVars, 'light')
    filterAndAdd(darkUIKitVars, 'dark')

    // 3. Restore defaults from the pristine JSON by setting them as explicit overrides
    Object.entries(componentDefaults).forEach(([cssVar, value]) => {
      updateCssVar(cssVar, value, tokensJson as any)
    })

    // 4. Re-apply CSS vars for any CUSTOM VARIANTS that exist in the current live uikit
    // but not in the pristine uikit. Step 1 removed all component CSS vars from the DOM;
    // Step 2-3 only restores original variants. Without this step, custom variant controls
    // would show null swatches. Custom variants keep their current JSON-defined color values.
    const currentUiKit = getVarsStore().getState().uikit
    const lightCurrentVars = buildUIKitVars(tokensJson as any, brandJson as any, currentUiKit, 'light')
    const darkCurrentVars = buildUIKitVars(tokensJson as any, brandJson as any, currentUiKit, 'dark')
    const pristineVarKeys = new Set(Object.keys(componentDefaults))

    const customVariantDefaults: Record<string, string> = {}
    const addCustom = (allVars: Record<string, string>) => {
      Object.entries(allVars).forEach(([cssVar, value]) => {
        if (isExactComponentVar(cssVar) && !pristineVarKeys.has(cssVar)) {
          customVariantDefaults[cssVar] = value
        }
      })
    }
    addCustom(lightCurrentVars)
    addCustom(darkCurrentVars)

    Object.entries(customVariantDefaults).forEach(([cssVar, value]) => {
      updateCssVar(cssVar, value, tokensJson as any)
    })

    // Force a re-render and notification of reset
    window.dispatchEvent(new CustomEvent('cssVarsReset'))
    window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
      detail: { cssVars: [...Object.keys(componentDefaults), ...Object.keys(customVariantDefaults)] }
    }))
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


  // Dynamically get all available layers from theme
  const layers = useMemo(() => {
    const t: any = theme
    const themeRoot: any = (t as any)?.brand ? (t as any) : ({ brand: t } as any)
    const themes = themeRoot?.themes || themeRoot
    const layersData: any = themes?.[mode]?.layers || themes?.[mode]?.layer || {}
    const layerKeys = Object.keys(layersData).filter(key => /^layer-\d+$/.test(key)).sort((a, b) => {
      const aNum = parseInt(a.replace('layer-', ''), 10)
      const bNum = parseInt(b.replace('layer-', ''), 10)
      return aNum - bNum
    })
    return layerKeys.length > 0 ? layerKeys : ['layer-0', 'layer-1', 'layer-2', 'layer-3'] // Fallback for initial load
  }, [theme, mode])

  // Convert layers to SegmentedControlItem format
  const layerItems: SegmentedControlItem[] = useMemo(() => {
    return layers.map((layer, index) => ({
      value: layer,
      label: index.toString(),
    }))
  }, [layers])

  const LayerIcon = iconNameToReactComponent('square-3-stack-3d')

  // Get accordion header font tokens to match accordion headers
  const accordionHeaderFontFamilyVar = getComponentTextCssVar('AccordionItem', 'header-text', 'font-family')
  const accordionHeaderFontSizeVar = getComponentTextCssVar('AccordionItem', 'header-text', 'font-size')
  const accordionHeaderFontWeightVar = getComponentTextCssVar('AccordionItem', 'header-text', 'font-weight')

  // Helper function to detect if variants are boolean-like (true/false, yes/no, etc.)
  const isBooleanVariant = (variants: string[]): boolean => {
    if (variants.length !== 2) return false

    const normalized = variants.map(v => v.toLowerCase())
    const booleanPairs = [
      ['true', 'false'],
      ['yes', 'no'],
      ['on', 'off'],
      ['enabled', 'disabled'],
      ['show', 'hide'],
      ['visible', 'hidden'],
      ['active', 'inactive'],
    ]

    return booleanPairs.some(([a, b]) =>
      (normalized.includes(a) && normalized.includes(b))
    )
  }

  return (
    <div className="component-toolbar-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Layers Segmented Control */}
      <div style={{ padding: 'var(--recursica_brand_dimensions_general_md)', borderBottom: `1px solid var(${layerProperty(mode, 0, 'border-color')})` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--recursica_brand_dimensions_general_sm)' }}>
            {LayerIcon && <LayerIcon style={{
              width: '16px',
              height: '16px',
              color: `var(${layerText(mode, 0, 'color')})`,
              opacity: `var(${layerText(mode, 0, 'low-emphasis')})`
            }} />}
            <span style={{
              fontFamily: `var(${accordionHeaderFontFamilyVar})`,
              fontSize: `var(${accordionHeaderFontSizeVar})`,
              fontWeight: `var(${accordionHeaderFontWeightVar})`,
              color: `var(${layerText(mode, 0, 'color')})`
            }}>Layer</span>
          </div>
          <SegmentedControl
            items={layerItems}
            value={selectedLayer}
            onChange={(value) => {
              onLayerChange(value)
            }}
            orientation="horizontal"
            fullWidth={false}
            layer="layer-0"
            componentNameForCssVars="SegmentedControl"
            style={{
              '--segmented-control-font-family': `var(${accordionHeaderFontFamilyVar})`,
              '--segmented-control-font-size': `var(${accordionHeaderFontSizeVar})`,
              '--segmented-control-font-weight': `var(${accordionHeaderFontWeightVar})`,
            } as React.CSSProperties}
          />
        </div>
      </div>

      {/* Variants Dropdowns */}
      {visibleVariants.length > 0 && (
        <div style={{ padding: 'var(--recursica_brand_dimensions_general_md)', borderBottom: `1px solid var(${layerProperty(mode, 0, 'border-color')})` }}>
          {visibleVariants.map((variant, index) => {
            const isBoolean = isBooleanVariant(variant.variants)
            return (
              <div
                key={variant.propName}
                style={{
                  marginBottom: index < visibleVariants.length - 1 ? 'var(--recursica_brand_dimensions_general_sm)' : 0,
                  paddingBottom: index < visibleVariants.length - 1 ? 'var(--recursica_brand_dimensions_general_sm)' : 0,
                }}
              >
                {isBoolean ? (
                  <VariantSwitch
                    componentName={componentName}
                    propName={variant.propName}
                    variants={variant.variants}
                    selected={selectedVariants[variant.propName] || variant.variants[0]}
                    onSelect={(variantName) => {
                      onVariantChange(variant.propName, variantName)
                    }}
                    className="full-width"
                  />
                ) : (
                  <VariantDropdown
                    componentName={componentName}
                    propName={variant.propName}
                    variants={variant.variants}
                    selected={selectedVariants[variant.propName] || variant.variants[0]}
                    onSelect={(variantName) => {
                      onVariantChange(variant.propName, variantName)
                    }}
                    onCreateVariant={() => {
                      handleOpenCreateVariant(variant.propName, variant.variants)
                    }}
                    className="full-width"
                  />
                )}
              </div>
            )
          })}
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
          if (!isVisible) return false

          // Filter by showForVariants if specified at top level
          if ((propConfig as any).showForVariants && (propConfig as any).showForVariants.length > 0) {
            const anyVariantMatch = (propConfig as any).showForVariants.some((v: string) =>
              Object.values(selectedVariants).includes(v)
            )
            if (!anyVariantMatch) {
              return false
            }
          }

          return true
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
                key={`${propKey}-${selectedLayer}`}
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
        style={(componentName === 'Accordion' || componentName === 'AccordionItem'
          ? {}
          : {
            /* Override the component-specific CSS vars that the Accordion adapter sets.
               These prevent the preview accordion's colors from leaking into the toolbar.
               The adapter spreads ...style last, so these override the adapter's computed values.
               Skipped for Accordion/AccordionItem so the toolbar acts as a live preview. */
            ['--accordion-bg' as string]: 'transparent',
            ['--accordion-border' as string]: 'transparent',
            ['--accordion-border-size' as string]: '0',
            ['--accordion-border-radius' as string]: '0',
            ['--accordion-padding' as string]: '0',
            ['--accordion-item-gap' as string]: '0',
            ['--accordion-item-header-bg-collapsed' as string]: 'transparent',
            ['--accordion-item-header-bg-expanded' as string]: 'transparent',
            ['--accordion-item-border-radius' as string]: '0',
            ['--accordion-item-content-bg' as string]: 'transparent',
            ['--accordion-item-divider-color' as string]: `var(${layerProperty(mode, 0, 'border-color')})`,
            ['--accordion-item-header-text' as string]: `var(${layerText(mode, 0, 'color')})`,
            ['--accordion-item-icon-color' as string]: `var(${layerText(mode, 0, 'color')})`,
            ['--accordion-item-content-text' as string]: `var(${layerText(mode, 0, 'color')})`,
            boxShadow: 'none',
          }
        ) as React.CSSProperties}
      />

      {/* Reset + Delete Variant Buttons */}
      <div style={{ padding: 'var(--recursica_brand_dimensions_general_md)', borderTop: `1px solid var(${layerProperty(mode, 0, 'border-color')})`, display: 'flex', flexDirection: 'row', gap: 'var(--recursica_brand_dimensions_gutters_horizontal)' }}>
        <Button
          onClick={() => setResetConfirmOpen(true)}
          variant="outline"
          size="small"
          layer="layer-0"
          style={{ flex: 1 }}
          icon={(() => {
            const ResetIcon = iconNameToReactComponent('arrow-path')
            return ResetIcon ? <ResetIcon style={{ width: 14, height: 14 }} /> : undefined
          })()}
        >
          Reset
        </Button>
        <Button
          onClick={() => setDeleteVariantModalOpen(true)}
          variant="outline"
          size="small"
          layer="layer-0"
          disabled={customVariants.length === 0}
          style={{ flex: 1 }}
          icon={(() => {
            const TrashIcon = iconNameToReactComponent('trash')
            return TrashIcon ? <TrashIcon style={{ width: 14, height: 14 }} /> : undefined
          })()}
        >
          Delete variant
        </Button>
      </div>

      {/* Switches Section */}
      <div style={{
        padding: 'var(--recursica_brand_dimensions_general_md)',
        borderTop: `1px solid var(${layerProperty(mode, 0, 'border-color')})`,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--recursica_brand_dimensions_general_sm)',
      }}>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--recursica_brand_dimensions_general_default)',
        }}>
          <Switch
            checked={debugMode}
            onChange={setDebugMode}
            layer="layer-0"
          />
          <label
            onClick={() => setDebugMode(!debugMode)}
            style={{
              color: `var(${layerText(mode, 0, 'color')})`,
              opacity: `var(${layerText(mode, 0, 'low-emphasis')})`,
              fontSize: 'var(--recursica_brand_typography_body-small-font-size)',
              cursor: 'pointer',
              flex: 1,
            }}>
            Debug mode
          </label>
        </div>
      </div>

      {/* Create Variant Modal */}
      <CreateVariantModal
        isOpen={createVariantModalOpen}
        onClose={() => setCreateVariantModalOpen(false)}
        onConfirm={handleCreateVariant}
        axisName={createVariantAxis}
        existingVariantNames={createVariantExistingNames}
        showAxisField={hasNoVariantAxes}
        existingAxisNames={getExistingAxes(getVarsStore().getState().uikit, componentKey)}
      />

      {/* Delete Variant Modal */}
      <DeleteVariantModal
        isOpen={deleteVariantModalOpen}
        onClose={() => setDeleteVariantModalOpen(false)}
        onConfirm={handleDeleteVariant}
        customVariants={customVariants}
      />

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        title="Reset component"
        size="sm"
        layer="layer-1"
        primaryActionLabel="Reset"
        onPrimaryAction={() => {
          setResetConfirmOpen(false)
          handleReset()
        }}
        secondaryActionLabel="Cancel"
        onSecondaryAction={() => setResetConfirmOpen(false)}
      >
        <p style={{ margin: 0, fontSize: 'var(--recursica_brand_typography_body-small-font-size)', opacity: 0.75 }}>
          All customisations for {componentName} will be reset to their default token values.
        </p>
      </Modal>
    </div>
  )
}
