/**
 * Material UI Accordion Implementation
 */

import { useState, useEffect } from 'react'
import {
  Accordion as MaterialAccordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import type { AccordionProps as AdapterAccordionProps } from '../../Accordion'
import { buildComponentCssVarPath, getComponentLevelCssVar } from '../../../utils/cssVarNames'
import { getBrandTypographyCssVar, getElevationBoxShadow, parseElevationValue } from '../../../utils/brandCssVars'
import { readCssVar } from '../../../../core/css/readCssVar'
import './Accordion.css'

const ExpandIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 9l6 6 6-6" />
  </svg>
)

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
  style,
  material,
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
  const containerBorderVar = buildComponentCssVarPath('Accordion', 'properties', 'colors', layer, 'border')
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
  
  const componentElevation = elevation ?? elevationFromVar ?? undefined
  const elevationBoxShadow = componentElevation && componentElevation !== 'elevation-0'
    ? getElevationBoxShadow(mode, componentElevation)
    : undefined

  // Item properties (AccordionItem)
  const headerBgVar = buildComponentCssVarPath('AccordionItem', 'properties', 'colors', layer, 'background')
  const headerHoverVar = buildComponentCssVarPath('AccordionItem', 'properties', 'colors', layer, 'background-hover')
  const headerTextVar = buildComponentCssVarPath('AccordionItem', 'properties', 'colors', layer, 'text')
  const iconColorVar = buildComponentCssVarPath('AccordionItem', 'properties', 'colors', layer, 'icon')
  const dividerColorVar = buildComponentCssVarPath('AccordionItem', 'properties', 'colors', layer, 'divider')
  const contentBgVar = buildComponentCssVarPath('AccordionItem', 'properties', 'colors', layer, 'content-background')
  const contentTextVar = buildComponentCssVarPath('AccordionItem', 'properties', 'colors', layer, 'content-text')

  const itemPaddingVar = getComponentLevelCssVar('AccordionItem', 'padding')
  const contentPaddingVar = getComponentLevelCssVar('AccordionItem', 'content-padding')
  const iconSizeVar = getComponentLevelCssVar('AccordionItem', 'icon-size')
  const iconGapVar = getComponentLevelCssVar('AccordionItem', 'icon-gap')
  const borderRadiusVar = getComponentLevelCssVar('AccordionItem', 'border-radius')
  const headerContentGapVar = getComponentLevelCssVar('AccordionItem', 'header-content-gap')
  
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

  const fontFamilyVar = getBrandTypographyCssVar('body', 'font-family')
  const fontSizeVar = getBrandTypographyCssVar('body', 'font-size')
  const fontWeightVar = getBrandTypographyCssVar('body', 'font-weight')
  const letterSpacingVar = getBrandTypographyCssVar('body', 'font-letter-spacing')
  const lineHeightVar = getBrandTypographyCssVar('body', 'line-height')

  return (
    <div
      className={`recursica-accordion material-accordion ${className || ''}`}
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
        ['--accordion-item-header-bg' as string]: `var(${headerBgVar})`,
        ['--accordion-item-header-hover' as string]: `var(${headerHoverVar})`,
        ['--accordion-item-header-text' as string]: `var(${headerTextVar})`,
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
        ['--accordion-item-elevation-box-shadow' as string]: itemElevationBoxShadow || 'none',
        ['--accordion-item-font-family' as string]: `var(${fontFamilyVar})`,
        ['--accordion-item-font-size' as string]: `var(${fontSizeVar})`,
        ['--accordion-item-font-weight' as string]: `var(${fontWeightVar})`,
        ['--accordion-item-letter-spacing' as string]: `var(${letterSpacingVar})`,
        ['--accordion-item-line-height' as string]: `var(${lineHeightVar})`,
        ...style,
      } as React.CSSProperties}
      {...material}
      {...props}
    >
      {items.map((item, index) => {
        const showDivider = item.divider !== false && index < items.length - 1
        const isOpen = openItems.includes(item.id)
        const expanded = allowMultiple ? isOpen : isOpen
        return (
          <MaterialAccordion
            key={item.id}
            expanded={expanded}
            onChange={(_event, nextExpanded) => onItemToggle(item.id, nextExpanded)}
            disabled={item.disabled}
            data-divider={showDivider}
            className="material-accordion-item"
          >
            <AccordionSummary expandIcon={ExpandIcon}>
              {item.title}
            </AccordionSummary>
            <AccordionDetails>{item.content}</AccordionDetails>
          </MaterialAccordion>
        )
      })}
    </div>
  )
}

