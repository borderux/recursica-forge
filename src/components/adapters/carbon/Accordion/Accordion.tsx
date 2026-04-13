/**
 * Carbon Accordion Implementation
 */

import { useState, useEffect } from 'react'
import React from 'react'
import { Accordion as CarbonAccordion, AccordionItem } from '@carbon/react'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import type { AccordionProps as AdapterAccordionProps } from '../../Accordion'
import { buildComponentCssVarPath, getComponentLevelCssVar, getComponentTextCssVar } from '../../../utils/cssVarNames'
import { getElevationBoxShadow, parseElevationValue } from '../../../utils/brandCssVars'
import { readCssVar, readCssVarResolved } from '../../../../core/css/readCssVar'
import './Accordion.css'

export default function Accordion({
  items,
  layer = 'layer-0',
  allowMultiple = false,
  openItems,
  onItemToggle,
  onOpenItemsChange: _onOpenItemsChange,
  onToggle: _onToggle,
  elevation,
  className,
  style: _style,
  carbon,
  ...props
}: Omit<AdapterAccordionProps, 'onOpenItemsChange' | 'onToggle'> & {
  openItems: string[]
  onItemToggle: (id: string, open: boolean) => void
  onOpenItemsChange?: (openItems: string[]) => void
  onToggle?: (id: string, open: boolean) => void
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
  const dividerSizeVar = getComponentLevelCssVar('Accordion', 'divider-size')
  const dividerColorVar = buildComponentCssVarPath('Accordion', 'properties', 'colors', layer, 'divider')

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
  const contentBgVar = buildComponentCssVarPath('AccordionItem', 'properties', 'colors', layer, 'content-background')
  const contentTextVar = buildComponentCssVarPath('AccordionItem', 'properties', 'colors', layer, 'content-text')
  const itemBorderColorVar = buildComponentCssVarPath('AccordionItem', 'properties', 'colors', layer, 'item-border-color')
  const contentBorderColorVar = buildComponentCssVarPath('AccordionItem', 'properties', 'colors', layer, 'content-border-color')

  // Get hover color and opacity from component-level UIKit tokens (not the global overlay)
  const hoverColorVar = getComponentLevelCssVar('AccordionItem', 'hover-color')
  const hoverOpacityVar = getComponentLevelCssVar('AccordionItem', 'hover-opacity')

  const headerPaddingHVar = getComponentLevelCssVar('AccordionItem', 'header-horizontal-padding')
  const contentPaddingHVar = getComponentLevelCssVar('AccordionItem', 'content-horizontal-padding')
  const headerPaddingVVar = getComponentLevelCssVar('AccordionItem', 'header-vertical-padding')
  const iconLeftSizeVar = getComponentLevelCssVar('AccordionItem', 'icon-left-size')
  const iconRightSizeVar = getComponentLevelCssVar('AccordionItem', 'icon-right-size')
  const iconGapVar = getComponentLevelCssVar('AccordionItem', 'icon-gap')
  const borderRadiusVar = getComponentLevelCssVar('AccordionItem', 'border-radius')
  const contentTopPaddingVar = getComponentLevelCssVar('AccordionItem', 'content-top-padding')
  const contentBottomPaddingVar = getComponentLevelCssVar('AccordionItem', 'content-bottom-padding')
  const itemBorderSizeVar = getComponentLevelCssVar('AccordionItem', 'item-border-size')
  const itemBorderRadiusVar = getComponentLevelCssVar('AccordionItem', 'item-border-radius')
  const contentBorderSizeVar = getComponentLevelCssVar('AccordionItem', 'content-border-size')
  const contentBorderRadiusVar = getComponentLevelCssVar('AccordionItem', 'content-border-radius')
  const contentMarginVar = getComponentLevelCssVar('AccordionItem', 'content-margin')

  // Item elevation - reactive pattern for toolbar control
  const itemElevationVar = getComponentLevelCssVar('AccordionItem', 'elevation-item')
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

  // Content elevation - reactive pattern for toolbar control
  const contentElevationVar = getComponentLevelCssVar('AccordionItem', 'elevation-content')
  const [contentElevationFromVar, setContentElevationFromVar] = useState<string | undefined>(() => {
    if (!contentElevationVar) return undefined
    const value = readCssVar(contentElevationVar)
    return value ? parseElevationValue(value) : undefined
  })

  useEffect(() => {
    if (!contentElevationVar) return

    const handleCssVarUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (!detail?.cssVars || detail.cssVars.includes(contentElevationVar)) {
        const value = readCssVar(contentElevationVar)
        setContentElevationFromVar(value ? parseElevationValue(value) : undefined)
      }
    }

    window.addEventListener('cssVarsUpdated', handleCssVarUpdate)
    window.addEventListener('cssVarsReset', handleCssVarUpdate)

    const observer = new MutationObserver(() => {
      const value = readCssVar(contentElevationVar)
      setContentElevationFromVar(value ? parseElevationValue(value) : undefined)
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
  }, [contentElevationVar])

  const contentElevationBoxShadow = contentElevationFromVar && contentElevationFromVar !== 'elevation-0'
    ? getElevationBoxShadow(mode, contentElevationFromVar)
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
  const [, setTextVarsUpdate] = useState(0)

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

  return (
    <div
      className={`recursica-accordion carbon-accordion ${className || ''}`}
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
        ['--accordion-item-hover-opacity' as string]: `var(${hoverOpacityVar}, 0.08)`,
        ['--accordion-item-hover-color' as string]: `var(${hoverColorVar}, #000000)`,
        ['--accordion-item-icon-color' as string]: `var(${iconColorVar})`,
        ['--accordion-item-divider-color' as string]: `var(${dividerColorVar})`,
        ['--accordion-item-content-bg' as string]: `var(${contentBgVar})`,
        ['--accordion-item-content-text' as string]: `var(${contentTextVar})`,
        ['--accordion-item-header-padding-horizontal' as string]: `var(${headerPaddingHVar})`,
        ['--accordion-item-content-padding-horizontal' as string]: `var(${contentPaddingHVar})`,
        ['--accordion-item-header-padding-vertical' as string]: `var(${headerPaddingVVar})`,
        ['--accordion-item-divider-size' as string]: `var(${dividerSizeVar})`,
        ['--accordion-item-icon-left-size' as string]: `var(${iconLeftSizeVar})`,
        ['--accordion-item-icon-right-size' as string]: `var(${iconRightSizeVar})`,
        ['--accordion-item-icon-gap' as string]: `var(${iconGapVar})`,
        ['--accordion-item-border-radius' as string]: `var(${borderRadiusVar})`,
        ['--accordion-item-content-top-padding' as string]: `var(${contentTopPaddingVar})`,
        ['--accordion-item-content-bottom-padding' as string]: `var(${contentBottomPaddingVar})`,
        ['--accordion-item-elevation-box-shadow' as string]: itemElevationBoxShadow || 'none',
        ['--accordion-item-border-size' as string]: `var(${itemBorderSizeVar})`,
        ['--accordion-item-border-color' as string]: `var(${itemBorderColorVar})`,
        ['--accordion-item-border-radius-item' as string]: `var(${itemBorderRadiusVar})`,
        ['--accordion-item-content-border-size' as string]: `var(${contentBorderSizeVar})`,
        ['--accordion-item-content-border-color' as string]: `var(${contentBorderColorVar})`,
        ['--accordion-item-content-border-radius' as string]: `var(${contentBorderRadiusVar})`,
        ['--accordion-item-content-margin' as string]: `var(${contentMarginVar})`,
        ['--accordion-item-content-elevation-box-shadow' as string]: contentElevationBoxShadow || 'none',
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
        ..._style,
      } as React.CSSProperties}
    >
      <CarbonAccordion
        {...carbon}
        {...props}
      >
        {items.map((item, index) => {
          const isOpen = openItems.includes(item.id)
          const open = allowMultiple ? isOpen : isOpen
          const ItemIcon = item.icon
          const titleWithIcon = ItemIcon ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--accordion-item-icon-gap, 8px)' }}>
              <div style={{ flexShrink: 0, color: `var(--accordion-item-icon-color)`, width: 'var(--accordion-item-icon-left-size, 16px)', height: 'var(--accordion-item-icon-left-size, 16px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ItemIcon style={{ width: '100%', height: '100%', display: 'block' }} />
              </div>
              <span>{item.title}</span>
            </div>
          ) : item.title
          return (
            <AccordionItem
              key={item.id}
              title={titleWithIcon}
              open={open}
              onHeadingClick={() => onItemToggle(item.id, !isOpen)}
              disabled={item.disabled}
              className="recursica-accordion-item"
            >
              {item.content}
            </AccordionItem>
          )
        })}
      </CarbonAccordion>
    </div>
  )
}

