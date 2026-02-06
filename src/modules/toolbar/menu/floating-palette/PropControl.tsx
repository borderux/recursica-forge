import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { ComponentProp, toSentenceCase, parseComponentStructure } from '../../utils/componentToolbarUtils'
import { getPropLabel, getPropVisible, getGroupedProps, getGroupedPropConfig, getPropConfig } from '../../utils/loadToolbarConfig'
import { readCssVar, readCssVarResolved } from '../../../../core/css/readCssVar'
import { updateCssVar } from '../../../../core/css/updateCssVar'
import PaletteColorControl from '../../../forms/PaletteColorControl'
import DimensionTokenSelector from '../../../components/DimensionTokenSelector'
import FloatingPalette from './FloatingPalette'
import { buildComponentCssVarPath } from '../../../../components/utils/cssVarNames'
import type { ComponentName } from '../../../../components/registry/types'
import PropControlContent from './PropControlContent'
import { Label } from '../../../../components/adapters/Label'
import { useVars } from '../../../vars/VarsContext'
import { useThemeMode } from '../../../theme/ThemeModeContext'
import './PropControl.css' // Keep prop-control specific styles

// Separate component for elevation control to properly use hooks
// This component has been moved to its own file: ./ElevationPropControl.tsx
// function ElevationPropControl(...) { ... }

interface PropControlProps {
  prop: ComponentProp
  componentName: string
  selectedVariants: Record<string, string>
  selectedLayer: string
  anchorElement?: HTMLElement | null
  onClose: () => void
}

export default function PropControl({
  prop,
  componentName,
  selectedVariants,
  selectedLayer,
  anchorElement,
  onClose,
}: PropControlProps) {
  const { theme: themeJson } = useVars()
  const { mode } = useThemeMode()

  // Get elevation options from brand theme
  const elevationOptions = useMemo(() => {
    try {
      const root: any = (themeJson as any)?.brand ? (themeJson as any).brand : themeJson
      const themes = root?.themes || root
      const elev: any = themes?.[mode]?.elevations || root?.[mode]?.elevations || {}
      const names = Object.keys(elev).filter((k) => /^elevation-\d+$/.test(k)).sort((a, b) => Number(a.split('-')[1]) - Number(b.split('-')[1]))
      return names.map((n) => {
        const idx = Number(n.split('-')[1])
        const label = idx === 0 ? 'Elevation 0 (No elevation)' : `Elevation ${idx} `
        return { name: n, label }
      })
    } catch {
      return []
    }
  }, [themeJson, mode])
  // Helper function to get CSS vars for a given prop
  // Simply finds the CSS var that matches the current selected variants and layer
  const getCssVarsForProp = useCallback((propToCheck: ComponentProp): string[] => {
    const structure = parseComponentStructure(componentName)

    // Find the prop that matches:
    // 1. Same prop name
    // 2. Same category
    // 3. Same path structure (for distinguishing interactive vs read-only)
    // 4. Selected variant (if variant-specific)
    // 5. Selected layer (if color prop with layer)
    const matchingProp = structure.props.find(p => {
      // Must match prop name and category
      if (p.name !== propToCheck.name || p.category !== propToCheck.category) {
        return false
      }

      // For breadcrumb interactive/read-only colors, must match the path structure
      // Both have name "color" and category "colors", but different paths
      if (componentName.toLowerCase() === 'breadcrumb' &&
        propToCheck.name === 'color' &&
        propToCheck.category === 'colors') {
        // Check if both paths include "interactive" or both include "read-only"
        const propToCheckHasInteractive = propToCheck.path.includes('interactive')
        const propToCheckHasReadOnly = propToCheck.path.includes('read-only')
        const pHasInteractive = p.path.includes('interactive')
        const pHasReadOnly = p.path.includes('read-only')

        if (propToCheckHasInteractive && !pHasInteractive) return false
        if (propToCheckHasReadOnly && !pHasReadOnly) return false
        if (!propToCheckHasInteractive && !propToCheckHasReadOnly && (pHasInteractive || pHasReadOnly)) return false
      }

      // CRITICAL FIX: Check if prop path contains variant information - if so, MUST match selected variant
      // This handles cases where multiple variants have the same prop name (e.g., border-size for solid/outline/text)
      // Check if the prop being searched (p) has variant info in its path
      if (p.isVariantSpecific && p.variantProp) {
        const selectedVariant = selectedVariants[p.variantProp]
        if (!selectedVariant) {
          // If no variant is selected for this variantProp, don't match variant-specific props
          return false
        }
        const variantInPath = p.path.find(pathPart => pathPart === selectedVariant)
        if (!variantInPath) {
          // Prop is variant-specific but doesn't match selected variant - skip it
          return false
        }
      }
      // Also check propToCheck's variant requirements if it explicitly has them
      if (propToCheck.isVariantSpecific && propToCheck.variantProp) {
        const selectedVariant = selectedVariants[propToCheck.variantProp]
        if (!selectedVariant) return false

        const variantInPath = p.path.find(pathPart => pathPart === selectedVariant)
        if (!variantInPath) return false
      }

      // If color prop, must match selected layer (if prop has a layer in path)
      if (propToCheck.category === 'colors') {
        const layerInPath = p.path.find(pathPart => pathPart.startsWith('layer-'))
        if (layerInPath) {
          if (layerInPath !== selectedLayer) return false
        }
      }

      return true
    })

    // Return the matching prop's CSS var, or fallback to the prop's own CSS var
    return matchingProp ? [matchingProp.cssVar] : [propToCheck.cssVar]
  }, [componentName, selectedVariants, selectedLayer])

  // Get CSS vars for base prop
  const baseCssVars = getCssVarsForProp(prop)
  let primaryCssVar = baseCssVars[0] || prop.cssVar
  let cssVarsForControl = baseCssVars

  // For Badge height, override to target the size variant's min-height instead of component-level height
  if (prop.name.toLowerCase() === 'height' && componentName.toLowerCase() === 'badge') {
    const sizeVariant = selectedVariants.size || 'small'
    const minHeightVar = `--recursica - ui - kit - components - badge - size - variants - ${sizeVariant} -min - height`
    primaryCssVar = minHeightVar
    cssVarsForControl = [minHeightVar]
  }

  // For Label width, override to target the size variant's width property based on layout and size
  if (prop.name.toLowerCase() === 'label-width' && componentName.toLowerCase() === 'label') {
    const layoutVariant = selectedVariants.layout || 'stacked'
    const sizeVariant = selectedVariants.size || 'default'
    // Build CSS var path using buildComponentCssVarPath to include theme prefix
    const widthVar = buildComponentCssVarPath('Label', 'variants', 'layouts', layoutVariant, 'variants', 'sizes', sizeVariant, 'properties', 'width')
    primaryCssVar = widthVar
    cssVarsForControl = [widthVar]
  }

  // Helper to determine contrast color CSS var based on prop name
  const getContrastColorVar = useCallback((propToRender: ComponentProp): string | undefined => {
    const propName = propToRender.name.toLowerCase()
    const structure = parseComponentStructure(componentName)

    // For text colors, check against background
    if (propName === 'text' || propName === 'text-hover') {
      const bgPropName = propName === 'text-hover' ? 'background-hover' : 'background'
      const bgProp = structure.props.find(p =>
        p.name.toLowerCase() === bgPropName &&
        p.category === 'colors' &&
        (!p.isVariantSpecific || (p.variantProp && selectedVariants[p.variantProp] && p.path.includes(selectedVariants[p.variantProp]))) &&
        (p.category !== 'colors' || !p.path.includes('layer-') || p.path.includes(selectedLayer))
      )
      if (bgProp) {
        const bgCssVars = getCssVarsForProp(bgProp)
        return bgCssVars[0]
      }
    }

    // For background colors, check against text
    if (propName === 'background' || propName === 'background-hover') {
      const textPropName = propName === 'background-hover' ? 'text-hover' : 'text'
      const textProp = structure.props.find(p =>
        p.name.toLowerCase() === textPropName &&
        p.category === 'colors' &&
        (!p.isVariantSpecific || (p.variantProp && selectedVariants[p.variantProp] && p.path.includes(selectedVariants[p.variantProp]))) &&
        (p.category !== 'colors' || !p.path.includes('layer-') || p.path.includes(selectedLayer))
      )
      if (textProp) {
        const textCssVars = getCssVarsForProp(textProp)
        return textCssVars[0]
      }
    }

    // For switch track-selected, check against thumb
    if (propName === 'track-selected' || propName === 'track-unselected') {
      const thumbProp = structure.props.find(p =>
        p.name.toLowerCase() === 'thumb' &&
        p.category === 'colors' &&
        (!p.isVariantSpecific || (p.variantProp && selectedVariants[p.variantProp] && p.path.includes(selectedVariants[p.variantProp]))) &&
        (p.category !== 'colors' || !p.path.includes('layer-') || p.path.includes(selectedLayer))
      )
      if (thumbProp) {
        const thumbCssVars = getCssVarsForProp(thumbProp)
        return thumbCssVars[0]
      }
    }

    // For switch thumb, check against track-selected (when checked)
    if (propName === 'thumb') {
      const trackProp = structure.props.find(p =>
        p.name.toLowerCase() === 'track-selected' &&
        p.category === 'colors' &&
        (!p.isVariantSpecific || (p.variantProp && selectedVariants[p.variantProp] && p.path.includes(selectedVariants[p.variantProp]))) &&
        (p.category !== 'colors' || !p.path.includes('layer-') || p.path.includes(selectedLayer))
      )
      if (trackProp) {
        const trackCssVars = getCssVarsForProp(trackProp)
        return trackCssVars[0]
      }
    }

    return undefined
  }, [componentName, selectedVariants, selectedLayer, getCssVarsForProp])

  const renderControls = () => {
    return (
      <PropControlContent
        prop={prop}
        componentName={componentName as ComponentName}
        selectedVariants={selectedVariants}
        selectedLayer={selectedLayer}
      />
    )
  }

  if (!anchorElement) {
    return null
  }

  return (
    <FloatingPalette
      anchorElement={anchorElement}
      title={getPropLabel(componentName, prop.name) || toSentenceCase(prop.name)}
      onClose={onClose}
    >
      {renderControls()}
    </FloatingPalette>
  )
}

