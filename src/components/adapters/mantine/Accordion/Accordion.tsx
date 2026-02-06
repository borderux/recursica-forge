/**
 * Mantine Accordion Implementation
 */

import { useState, useEffect, useMemo } from 'react'
import { Accordion as MantineAccordion } from '@mantine/core'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import type { AccordionProps as AdapterAccordionProps } from '../../Accordion'
import { buildComponentCssVarPath, getComponentLevelCssVar, getComponentTextCssVar, getGlobalCssVar } from '../../../utils/cssVarNames'
import { getElevationBoxShadow, parseElevationValue, getBrandStateCssVar } from '../../../utils/brandCssVars'
import { readCssVar, readCssVarResolved } from '../../../../core/css/readCssVar'
import './Accordion.css'

export default function Accordion({
  items,
  layer = 'layer-0',
  allowMultiple = false,
  openItems,
  onOpenItemsChange,
  onItemToggle: _onItemToggle,
  onToggle: _onToggle,
  elevation,
  className,
  style,
  mantine,
  ...props
}: AdapterAccordionProps & {
  openItems: string[]
  onOpenItemsChange: (openItems: string[]) => void
  onItemToggle: (id: string, open: boolean) => void
}) {
  const { mode } = useThemeMode()
  
  // Container properties (Accordion)
  const containerBgVar = buildComponentCssVarPath('Accordion', 'properties', 'colors', layer, 'background')
  const containerBorderVar = buildComponentCssVarPath('Accordion', 'properties', 'colors', layer, 'border-color')
  const containerBorderSizeVar = getComponentLevelCssVar('Accordion', 'border-size')
  const containerBorderRadiusVar = getComponentLevelCssVar('Accordion', 'border-radius')
  const containerPaddingVar = getComponentLevelCssVar('Accordion', 'padding')
  const containerMinWidthVar = getComponentLevelCssVar('Accordion', 'min-width')
  const containerMaxWidthVar = getComponentLevelCssVar('Accordion', 'max-width')
  const itemGapVar = getComponentLevelCssVar('Accordion', 'item-gap')
  
  // Elevation - reactive pattern for toolbar control
  const elevationVar = getComponentLevelCssVar('Accordion', 'elevation')
  const [elevationFromVar, setElevationFromVar] = useState<string | undefined>(() => {
    if (!elevationVar) return undefined
    const value = readCssVar(elevationVar)
    return value ? parseElevationValue(value) : undefined
  })
  
  // State to force re-render when container CSS variables change
  const [, setContainerVarsUpdate] = useState(0)
  
  useEffect(() => {
    if (!elevationVar) return
    
    const handleCssVarUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (!detail?.cssVars || detail.cssVars.includes(elevationVar)) {
        const value = readCssVar(elevationVar)
        setElevationFromVar(value ? parseElevationValue(value) : undefined)
      }
    }
    
    window.addEventListener('cssVarsUpdated', handleCssVarUpdate)
    window.addEventListener('cssVarsReset', handleCssVarUpdate)
    
    const observer = new MutationObserver(() => {
      const value = readCssVar(elevationVar)
      setElevationFromVar(value ? parseElevationValue(value) : undefined)
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    })
    
    return () => {
      window.removeEventListener('cssVarsUpdated', handleCssVarUpdate)
      window.removeEventListener('cssVarsReset', handleCssVarUpdate)
      observer.disconnect()
    }
  }, [elevationVar])
  
  // Listen for container CSS variable updates
  useEffect(() => {
    const containerCssVars = [
      containerBgVar, containerBorderVar, containerBorderSizeVar, containerBorderRadiusVar,
      containerPaddingVar, containerMinWidthVar, containerMaxWidthVar, itemGapVar
    ]
    
    const handleCssVarUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      const updatedVars = detail?.cssVars || []
      const shouldUpdate = updatedVars.length === 0 || updatedVars.some((cssVar: string) => 
        containerCssVars.includes(cssVar)
      )
      if (shouldUpdate) {
        setContainerVarsUpdate(prev => prev + 1)
      }
    }
    
    window.addEventListener('cssVarsUpdated', handleCssVarUpdate)
    window.addEventListener('cssVarsReset', handleCssVarUpdate)
    
    const observer = new MutationObserver(() => {
      setContainerVarsUpdate(prev => prev + 1)
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    })
    
    return () => {
      window.removeEventListener('cssVarsUpdated', handleCssVarUpdate)
      window.removeEventListener('cssVarsReset', handleCssVarUpdate)
      observer.disconnect()
    }
  }, [containerBgVar, containerBorderVar, containerBorderSizeVar, containerBorderRadiusVar, containerPaddingVar, containerMinWidthVar, containerMaxWidthVar, itemGapVar])
  
  const componentElevation = elevation ?? elevationFromVar ?? undefined
  const elevationBoxShadow = componentElevation && componentElevation !== 'elevation-0'
    ? getElevationBoxShadow(mode, componentElevation)
    : undefined

  // Item properties (AccordionItem)
  const headerBgCollapsedVar = buildComponentCssVarPath('AccordionItem', 'properties', 'colors', layer, 'background-collapsed')
  const headerBgExpandedVar = buildComponentCssVarPath('AccordionItem', 'properties', 'colors', layer, 'background-expanded')
  const headerTextVar = buildComponentCssVarPath('AccordionItem', 'properties', 'colors', layer, 'text')
  const iconColorVar = buildComponentCssVarPath('AccordionItem', 'properties', 'colors', layer, 'icon')
  const dividerColorVar = buildComponentCssVarPath('AccordionItem', 'properties', 'colors', layer, 'divider')
  const contentBgVar = buildComponentCssVarPath('AccordionItem', 'properties', 'colors', layer, 'content-background')
  const contentTextVar = buildComponentCssVarPath('AccordionItem', 'properties', 'colors', layer, 'content-text')
  
  // Get hover opacity and overlay color from brand theme (not user-configurable)
  const hoverOpacityVar = getBrandStateCssVar(mode, 'hover')
  const overlayColorVar = getBrandStateCssVar(mode, 'overlay.color')

  const itemPaddingVar = getComponentLevelCssVar('AccordionItem', 'padding')
  const contentPaddingVar = getComponentLevelCssVar('AccordionItem', 'content-padding')
  const iconSizeVar = getComponentLevelCssVar('AccordionItem', 'icon-size')
  const iconGapVar = getComponentLevelCssVar('AccordionItem', 'icon-gap')
  const borderRadiusVar = getComponentLevelCssVar('AccordionItem', 'border-radius')
  const headerContentGapVar = getComponentLevelCssVar('AccordionItem', 'header-content-gap')
  const formVerticalItemGapVar = getGlobalCssVar('form', 'properties', 'vertical-item-gap', mode)
  
  // Item elevation - reactive pattern for toolbar control
  const itemElevationVar = getComponentLevelCssVar('AccordionItem', 'elevation')
  const [itemElevationFromVar, setItemElevationFromVar] = useState<string | undefined>(() => {
    if (!itemElevationVar) return undefined
    const value = readCssVar(itemElevationVar)
    return value ? parseElevationValue(value) : undefined
  })
  
  useEffect(() => {
    if (!itemElevationVar) return
    
    const handleCssVarUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (!detail?.cssVars || detail.cssVars.includes(itemElevationVar)) {
        const value = readCssVar(itemElevationVar)
        setItemElevationFromVar(value ? parseElevationValue(value) : undefined)
      }
    }
    
    window.addEventListener('cssVarsUpdated', handleCssVarUpdate)
    window.addEventListener('cssVarsReset', handleCssVarUpdate)
    
    const observer = new MutationObserver(() => {
      const value = readCssVar(itemElevationVar)
      setItemElevationFromVar(value ? parseElevationValue(value) : undefined)
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    })
    
    return () => {
      window.removeEventListener('cssVarsUpdated', handleCssVarUpdate)
      window.removeEventListener('cssVarsReset', handleCssVarUpdate)
      observer.disconnect()
    }
  }, [itemElevationVar])
  
  const itemElevationBoxShadow = itemElevationFromVar && itemElevationFromVar !== 'elevation-0'
    ? getElevationBoxShadow(mode, itemElevationFromVar)
    : undefined

  // Get header text properties
  const headerFontFamilyVar = getComponentTextCssVar('AccordionItem', 'header-text', 'font-family')
  const headerFontSizeVar = getComponentTextCssVar('AccordionItem', 'header-text', 'font-size')
  const headerFontWeightVar = getComponentTextCssVar('AccordionItem', 'header-text', 'font-weight')
  const headerLetterSpacingVar = getComponentTextCssVar('AccordionItem', 'header-text', 'letter-spacing')
  const headerLineHeightVar = getComponentTextCssVar('AccordionItem', 'header-text', 'line-height')
  const headerTextDecorationVar = getComponentTextCssVar('AccordionItem', 'header-text', 'text-decoration')
  const headerTextTransformVar = getComponentTextCssVar('AccordionItem', 'header-text', 'text-transform')
  const headerFontStyleVar = getComponentTextCssVar('AccordionItem', 'header-text', 'font-style')
  
  // Get content text properties
  const contentFontFamilyVar = getComponentTextCssVar('AccordionItem', 'content-text', 'font-family')
  const contentFontSizeVar = getComponentTextCssVar('AccordionItem', 'content-text', 'font-size')
  const contentFontWeightVar = getComponentTextCssVar('AccordionItem', 'content-text', 'font-weight')
  const contentLetterSpacingVar = getComponentTextCssVar('AccordionItem', 'content-text', 'letter-spacing')
  const contentLineHeightVar = getComponentTextCssVar('AccordionItem', 'content-text', 'line-height')
  const contentTextDecorationVar = getComponentTextCssVar('AccordionItem', 'content-text', 'text-decoration')
  const contentTextTransformVar = getComponentTextCssVar('AccordionItem', 'content-text', 'text-transform')
  const contentFontStyleVar = getComponentTextCssVar('AccordionItem', 'content-text', 'font-style')
  
  // State to force re-renders when text CSS variables change
  const [textVarsUpdate, setTextVarsUpdate] = useState(0)
  
  // Read resolved CSS variable values for use in Mantine's styles prop
  // Mantine's styles prop may not resolve CSS variables properly, so we use resolved values
  // These are recalculated on every render when textVarsUpdate changes
  const headerFontWeight = readCssVarResolved(headerFontWeightVar) || '400'
  const headerFontFamily = readCssVarResolved(headerFontFamilyVar) || undefined
  const headerFontSize = readCssVarResolved(headerFontSizeVar) || undefined
  const headerFontStyle = readCssVarResolved(headerFontStyleVar) || undefined
  const headerLetterSpacing = readCssVarResolved(headerLetterSpacingVar) || undefined
  const headerLineHeight = readCssVarResolved(headerLineHeightVar) || undefined
  const headerTextDecoration = readCssVarResolved(headerTextDecorationVar) || undefined
  const headerTextTransform = readCssVarResolved(headerTextTransformVar) || undefined
  
  // Listen for CSS variable updates from the toolbar
  useEffect(() => {
    const textCssVars = [
      headerFontFamilyVar, headerFontSizeVar, headerFontWeightVar, headerLetterSpacingVar,
      headerLineHeightVar, headerTextDecorationVar, headerTextTransformVar, headerFontStyleVar,
      contentFontFamilyVar, contentFontSizeVar, contentFontWeightVar, contentLetterSpacingVar,
      contentLineHeightVar, contentTextDecorationVar, contentTextTransformVar, contentFontStyleVar
    ]
    
    const handleCssVarUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      const updatedVars = detail?.cssVars || []
      // Update if any text CSS var was updated, or if no specific vars were mentioned (global update)
      const shouldUpdate = updatedVars.length === 0 || updatedVars.some((cssVar: string) => textCssVars.includes(cssVar))
      
      if (shouldUpdate) {
        // Force re-render by updating state
        setTextVarsUpdate(prev => prev + 1)
      }
    }
    
    window.addEventListener('cssVarsUpdated', handleCssVarUpdate)
    
    // Also watch for direct style changes using MutationObserver
    const observer = new MutationObserver(() => {
      // Force re-render for text vars
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
  }, [
    headerFontFamilyVar, headerFontSizeVar, headerFontWeightVar, headerLetterSpacingVar,
    headerLineHeightVar, headerTextDecorationVar, headerTextTransformVar, headerFontStyleVar,
    contentFontFamilyVar, contentFontSizeVar, contentFontWeightVar, contentLetterSpacingVar,
    contentLineHeightVar, contentTextDecorationVar, contentTextTransformVar, contentFontStyleVar
  ])

  const value = allowMultiple ? openItems : openItems[0] || null
  
  // Memoize styles object to ensure it's recreated when textVarsUpdate changes
  const mantineStyles = useMemo(() => {
    const controlStyles = {
      border: 'none',
      borderTop: 'none',
      borderBottom: 'none',
      borderLeft: 'none',
      borderRight: 'none',
      ...(headerFontFamily && { fontFamily: headerFontFamily }),
      ...(headerFontSize && { fontSize: headerFontSize }),
      fontWeight: headerFontWeight,
      ...(headerFontStyle && { fontStyle: headerFontStyle }),
      ...(headerLetterSpacing && { letterSpacing: headerLetterSpacing }),
      ...(headerLineHeight && { lineHeight: headerLineHeight }),
      ...(headerTextDecoration && { textDecoration: headerTextDecoration }),
      ...(headerTextTransform && { textTransform: headerTextTransform }),
    }
    // Merge with mantine?.styles, ensuring our control styles override any existing ones
    // We spread mantine?.styles first, then override with our control styles
    return {
      ...(mantine?.styles || {}),
      root: {
        ...(mantine?.styles?.root || {}),
        border: `var(--accordion-border-size, 1px) solid var(--accordion-border)`,
        borderRadius: `var(--accordion-border-radius)`,
        background: `var(--accordion-bg)`,
      },
      item: {
        ...(mantine?.styles?.item || {}),
        border: 'none',
        borderTop: 'none',
        borderBottom: 'none',
        borderLeft: 'none',
        borderRight: 'none',
      },
      control: {
        ...(mantine?.styles?.control || {}),
        ...controlStyles, // Our styles come last to ensure they override
      },
    }
  }, [
    textVarsUpdate,
    headerFontWeight,
    headerFontFamily,
    headerFontSize,
    headerFontStyle,
    headerLetterSpacing,
    headerLineHeight,
    headerTextDecoration,
    headerTextTransform,
    mantine?.styles,
  ])

  return (
    <MantineAccordion
      multiple={allowMultiple}
      value={value}
      onChange={(nextValue) => {
        const nextOpenItems = Array.isArray(nextValue)
          ? nextValue
          : nextValue
            ? [nextValue]
            : []
        onOpenItemsChange(nextOpenItems)
      }}
      className={`recursica-accordion mantine-accordion ${className || ''}`}
      style={{
        // Container properties
        ['--accordion-bg' as string]: `var(${containerBgVar})`,
        ['--accordion-border' as string]: `var(${containerBorderVar})`,
        ['--accordion-border-size' as string]: `var(${containerBorderSizeVar})`,
        ['--accordion-border-radius' as string]: `var(${containerBorderRadiusVar})`,
        ['--accordion-padding' as string]: `var(${containerPaddingVar})`,
        ['--accordion-min-width' as string]: `var(${containerMinWidthVar})`,
        ['--accordion-max-width' as string]: `var(${containerMaxWidthVar})`,
        ['--accordion-item-gap' as string]: `var(${itemGapVar})`,
        boxShadow: elevationBoxShadow,
        // Item properties
        ['--accordion-item-header-bg-collapsed' as string]: `var(${headerBgCollapsedVar})`,
        ['--accordion-item-header-bg-expanded' as string]: `var(${headerBgExpandedVar})`,
        ['--accordion-item-header-text' as string]: `var(${headerTextVar})`,
        ['--accordion-item-hover-opacity' as string]: `var(${hoverOpacityVar}, 0.08)`, // Hover overlay opacity
        ['--accordion-item-overlay-color' as string]: `var(${overlayColorVar}, #000000)`, // Overlay color
        ['--accordion-item-icon-color' as string]: `var(${iconColorVar})`,
        ['--accordion-item-divider-color' as string]: `var(${dividerColorVar})`,
        ['--accordion-item-content-bg' as string]: `var(${contentBgVar})`,
        ['--accordion-item-content-text' as string]: `var(${contentTextVar})`,
        ['--accordion-item-padding' as string]: `var(${itemPaddingVar})`,
        ['--accordion-item-content-padding' as string]: `var(${contentPaddingVar})`,
        ['--accordion-item-icon-size' as string]: `var(${iconSizeVar})`,
        ['--accordion-item-icon-gap' as string]: `var(${iconGapVar})`,
        ['--accordion-item-border-radius' as string]: `var(${borderRadiusVar})`,
        ['--accordion-item-header-content-gap' as string]: `var(${headerContentGapVar})`,
        // Header text properties
        ['--accordion-item-header-font-family' as string]: `var(${headerFontFamilyVar})`,
        ['--accordion-item-header-font-size' as string]: `var(${headerFontSizeVar})`,
        ['--accordion-item-header-font-weight' as string]: `var(${headerFontWeightVar})`,
        ['--accordion-item-header-letter-spacing' as string]: headerLetterSpacingVar ? `var(${headerLetterSpacingVar})` : 'normal',
        ['--accordion-item-header-line-height' as string]: `var(${headerLineHeightVar})`,
        ['--accordion-item-header-text-decoration' as string]: `var(${headerTextDecorationVar}, none)`,
        ['--accordion-item-header-text-transform' as string]: `var(${headerTextTransformVar}, none)`,
        ['--accordion-item-header-font-style' as string]: `var(${headerFontStyleVar}, normal)`,
        // Content text properties
        ['--accordion-item-content-font-family' as string]: `var(${contentFontFamilyVar})`,
        ['--accordion-item-content-font-size' as string]: `var(${contentFontSizeVar})`,
        ['--accordion-item-content-font-weight' as string]: `var(${contentFontWeightVar})`,
        ['--accordion-item-content-letter-spacing' as string]: contentLetterSpacingVar ? `var(${contentLetterSpacingVar})` : 'normal',
        ['--accordion-item-content-line-height' as string]: `var(${contentLineHeightVar})`,
        ['--accordion-item-content-text-decoration' as string]: `var(${contentTextDecorationVar}, none)`,
        ['--accordion-item-content-text-transform' as string]: `var(${contentTextTransformVar}, none)`,
        ['--accordion-item-content-font-style' as string]: `var(${contentFontStyleVar}, normal)`,
        // Form vertical item gap for accordion content spacing
        ['--accordion-item-content-gap' as string]: `var(${formVerticalItemGapVar})`,
        ...style,
      } as React.CSSProperties}
      styles={mantineStyles}
      {...mantine}
      {...props}
    >
      {items.map((item, index) => {
        const showDivider = item.divider !== false && index < items.length - 1
        const isOpen = openItems.includes(item.id)
        const ItemIcon = item.icon
        const titleWithIcon = ItemIcon ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--accordion-item-icon-gap, 8px)' }}>
            <div style={{ flexShrink: 0, color: `var(--accordion-item-icon-color)`, width: 'var(--accordion-item-icon-size, 16px)', height: 'var(--accordion-item-icon-size, 16px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ItemIcon size={16} />
            </div>
            <span>{item.title}</span>
          </div>
        ) : item.title
        return (
          <MantineAccordion.Item
            key={item.id}
            value={item.id}
            data-divider={showDivider}
            data-open={isOpen}
            {...(item.disabled ? { 'data-disabled': true } : {})}
            style={{
              border: 'none',
              borderTop: 'none',
              borderBottom: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              boxShadow: itemElevationBoxShadow,
              ...(mantine?.itemStyle || {}),
            }}
          >
            <MantineAccordion.Control
              style={{
                border: 'none',
                borderTop: 'none',
                borderBottom: 'none',
                borderLeft: 'none',
                borderRight: 'none',
              }}
            >
              {titleWithIcon}
            </MantineAccordion.Control>
            <MantineAccordion.Panel>{item.content}</MantineAccordion.Panel>
          </MantineAccordion.Item>
        )
      })}
    </MantineAccordion>
  )
}

