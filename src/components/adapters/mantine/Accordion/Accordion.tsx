/**
 * Mantine Accordion Implementation
 */

import { Accordion as MantineAccordion } from '@mantine/core'
import type { AccordionProps as AdapterAccordionProps } from '../../Accordion'
import { buildComponentCssVarPath, getComponentLevelCssVar } from '../../../utils/cssVarNames'
import { getBrandTypographyCssVar } from '../../../utils/brandCssVars'
import './Accordion.css'

export default function Accordion({
  items,
  layer = 'layer-0',
  allowMultiple = false,
  openItems,
  onOpenItemsChange,
  onItemToggle: _onItemToggle,
  onToggle: _onToggle,
  className,
  style,
  mantine,
  ...props
}: AdapterAccordionProps & {
  openItems: string[]
  onOpenItemsChange: (openItems: string[]) => void
  onItemToggle: (id: string, open: boolean) => void
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

  const value = allowMultiple ? openItems : openItems[0] || null

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
      {...mantine}
      {...props}
    >
      {items.map((item, index) => {
        const showDivider = item.divider !== false && index < items.length - 1
        const isOpen = openItems.includes(item.id)
        return (
          <MantineAccordion.Item
            key={item.id}
            value={item.id}
            data-divider={showDivider}
            data-open={isOpen}
            {...(item.disabled ? { 'data-disabled': true } : {})}
          >
            <MantineAccordion.Control>{item.title}</MantineAccordion.Control>
            <MantineAccordion.Panel>{item.content}</MantineAccordion.Panel>
          </MantineAccordion.Item>
        )
      })}
    </MantineAccordion>
  )
}

