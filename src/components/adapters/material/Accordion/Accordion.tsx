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
}: AdapterAccordionProps & {
  openItems: string[]
  onItemToggle: (id: string, open: boolean) => void
}) {
  const headerBgVar = buildComponentCssVarPath('Accordion', 'properties', 'colors', layer, 'background')
  const headerTextVar = buildComponentCssVarPath('Accordion', 'properties', 'colors', layer, 'text')
  const iconColorVar = buildComponentCssVarPath('Accordion', 'properties', 'colors', layer, 'icon')
  const dividerColorVar = buildComponentCssVarPath('Accordion', 'properties', 'colors', layer, 'divider')
  const contentBgVar = buildComponentCssVarPath('Accordion', 'properties', 'colors', layer, 'content-background')
  const contentTextVar = buildComponentCssVarPath('Accordion', 'properties', 'colors', layer, 'content-text')

  const itemPaddingVar = getComponentLevelCssVar('Accordion', 'item-padding')
  const contentPaddingVar = getComponentLevelCssVar('Accordion', 'content-padding')
  const iconSizeVar = getComponentLevelCssVar('Accordion', 'icon-size')
  const iconGapVar = getComponentLevelCssVar('Accordion', 'icon-gap')
  const borderRadiusVar = getComponentLevelCssVar('Accordion', 'border-radius')

  const fontFamilyVar = getBrandTypographyCssVar('body', 'font-family')
  const fontSizeVar = getBrandTypographyCssVar('body', 'font-size')
  const fontWeightVar = getBrandTypographyCssVar('body', 'font-weight')
  const letterSpacingVar = getBrandTypographyCssVar('body', 'font-letter-spacing')
  const lineHeightVar = getBrandTypographyCssVar('body', 'line-height')

  return (
    <div
      className={`recursica-accordion material-accordion ${className || ''}`}
      style={{
        ['--accordion-header-bg' as string]: `var(${headerBgVar})`,
        ['--accordion-header-text' as string]: `var(${headerTextVar})`,
        ['--accordion-icon-color' as string]: `var(${iconColorVar})`,
        ['--accordion-divider-color' as string]: `var(${dividerColorVar})`,
        ['--accordion-content-bg' as string]: `var(${contentBgVar})`,
        ['--accordion-content-text' as string]: `var(${contentTextVar})`,
        ['--accordion-item-padding' as string]: `var(${itemPaddingVar})`,
        ['--accordion-content-padding' as string]: `var(${contentPaddingVar})`,
        ['--accordion-icon-size' as string]: `var(${iconSizeVar})`,
        ['--accordion-icon-gap' as string]: `var(${iconGapVar})`,
        ['--accordion-border-radius' as string]: `var(${borderRadiusVar})`,
        ['--accordion-font-family' as string]: `var(${fontFamilyVar})`,
        ['--accordion-font-size' as string]: `var(${fontSizeVar})`,
        ['--accordion-font-weight' as string]: `var(${fontWeightVar})`,
        ['--accordion-letter-spacing' as string]: `var(${letterSpacingVar})`,
        ['--accordion-line-height' as string]: `var(${lineHeightVar})`,
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

