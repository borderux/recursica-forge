/**
 * Chip Component Adapter
 * 
 * Unified Chip component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense, useState, useEffect } from 'react'
import { useComponent } from '../hooks/useComponent'
import { buildVariantColorCssVar, getComponentLevelCssVar, getComponentTextCssVar } from '../utils/cssVarNames'
import { parseElevationValue } from '../utils/brandCssVars'
import { readCssVar } from '../../core/css/readCssVar'
import type { ChipProps } from './common/Chip'

// Re-exported so existing `import type { ChipProps } from '.../adapters/Chip'`
// call sites keep working — the types now live in common/Chip.ts.
export type { ChipProps } from './common/Chip'

export function Chip({
  children,
  variant = 'unselected',
  size = 'default',
  layer = 'layer-0',
  elevation,
  onClick,
  onDelete,
  deletable = false,
  className,
  style,
  icon,
  mantine,
  material,
  carbon,
}: ChipProps) {
  const Component = useComponent('Chip')

  // Get elevation from CSS vars if not provided as props
  const elevationVar = getComponentLevelCssVar('Chip', 'elevation')

  // Reactively read elevation from CSS variable
  const [elevationFromVar, setElevationFromVar] = useState<string | undefined>(() => {
    const value = readCssVar(elevationVar)
    return value ? parseElevationValue(value) : undefined
  })

  // State to force re-renders when text CSS variables change
  const [, setTextVarsUpdate] = useState(0)

  // Listen for CSS variable updates from the toolbar
  useEffect(() => {
    // Get text CSS variables for reactive updates
    const fontFamilyVar = getComponentTextCssVar('Chip', 'text', 'font-family')
    const fontSizeVar = getComponentTextCssVar('Chip', 'text', 'font-size')
    const fontWeightVar = getComponentTextCssVar('Chip', 'text', 'font-weight')
    const letterSpacingVar = getComponentTextCssVar('Chip', 'text', 'letter-spacing')
    const lineHeightVar = getComponentTextCssVar('Chip', 'text', 'line-height')
    const textDecorationVar = getComponentTextCssVar('Chip', 'text', 'text-decoration')
    const textTransformVar = getComponentTextCssVar('Chip', 'text', 'text-transform')
    const fontStyleVar = getComponentTextCssVar('Chip', 'text', 'font-style')

    const textCssVars = [fontFamilyVar, fontSizeVar, fontWeightVar, letterSpacingVar, lineHeightVar, textDecorationVar, textTransformVar, fontStyleVar]

    // Get color CSS variables for reactive updates
    const chipBgForListener = buildVariantColorCssVar('Chip', variant, 'background-color', layer)
    const chipTextForListener = buildVariantColorCssVar('Chip', variant, 'text', layer)
    const chipBorderForListener = buildVariantColorCssVar('Chip', variant, 'border-color', layer)

    const colorCssVars = [chipBgForListener, chipTextForListener, chipBorderForListener]

    const handleCssVarUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      // Update elevation if it was changed
      const shouldUpdateElevation = !detail?.cssVars || detail.cssVars.includes(elevationVar)
      const shouldUpdateText = !detail?.cssVars || detail.cssVars.some((cssVar: string) => textCssVars.includes(cssVar))
      const shouldUpdateColor = !detail?.cssVars || detail.cssVars.some((cssVar: string) => colorCssVars.includes(cssVar))

      if (shouldUpdateElevation) {
        const value = readCssVar(elevationVar)
        setElevationFromVar(value ? parseElevationValue(value) : undefined)
      }

      if (shouldUpdateText || shouldUpdateColor) {
        // Force re-render by updating state
        setTextVarsUpdate(prev => prev + 1)
      }
    }

    window.addEventListener('cssVarsUpdated', handleCssVarUpdate)

    // Also watch for direct style changes using MutationObserver
    const observer = new MutationObserver(() => {
      const value = readCssVar(elevationVar)
      setElevationFromVar(value ? parseElevationValue(value) : undefined)
      // Force re-render for text vars and color vars
      setTextVarsUpdate(prev => prev + 1)
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    })

    return () => {
      window.removeEventListener('cssVarsUpdated', handleCssVarUpdate)
      observer.disconnect()
    }
  }, [elevationVar, variant, layer])

  const componentElevation = elevation ?? elevationFromVar ?? undefined

  // Map unified props to library-specific props
  const libraryProps = mapChipProps({
    variant,
    size,
    layer,
    elevation: componentElevation,
    onClick,
    onDelete,
    deletable,
    className,
    style,
    icon,
    mantine,
    material,
    carbon,
  })

  return (
    <Suspense fallback={<span />}>
      <Component {...libraryProps}>{children}</Component>
    </Suspense>
  )
}

function mapChipProps(props: ChipProps & { elevation?: string }): any {
  const { mantine, material, carbon, ...rest } = props

  const baseProps: any = {
    ...rest,
  }

  return {
    ...baseProps,
    ...(mantine && { mantine }),
    ...(material && { material }),
    ...(carbon && { carbon }),
  }
}

