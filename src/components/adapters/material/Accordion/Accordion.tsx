/**
 * Material UI Accordion Implementation
 */

import {
  Accordion as MaterialAccordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import type { AccordionProps as AdapterAccordionProps } from '../../Accordion'
import { buildComponentCssVarPath, getComponentLevelCssVar } from '../../../utils/cssVarNames'
import { getBrandTypographyCssVar } from '../../../utils/brandCssVars'
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
  // Container properties (Accordion)
  const containerBgVar = buildComponentCssVarPath('Accordion', 'properties', 'colors', layer, 'background')
  const containerBorderVar = buildComponentCssVarPath('Accordion', 'properties', 'colors', layer, 'border')
  const containerBorderRadiusVar = getComponentLevelCssVar('Accordion', 'border-radius')
  const itemGapVar = getComponentLevelCssVar('Accordion', 'item-gap')

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
        ['--accordion-border-radius' as string]: `var(${containerBorderRadiusVar})`,
        ['--accordion-item-gap' as string]: `var(${itemGapVar})`,
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

