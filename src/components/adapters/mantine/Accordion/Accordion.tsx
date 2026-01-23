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
  const headerBgVar = buildComponentCssVarPath('Accordion', 'properties', 'colors', layer, 'background')
  const headerHoverVar = buildComponentCssVarPath('Accordion', 'properties', 'colors', layer, 'background-hover')
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
        ['--accordion-header-bg' as string]: `var(${headerBgVar})`,
        ['--accordion-header-hover' as string]: `var(${headerHoverVar})`,
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
            disabled={item.disabled}
          >
            <MantineAccordion.Control>{item.title}</MantineAccordion.Control>
            <MantineAccordion.Panel>{item.content}</MantineAccordion.Panel>
          </MantineAccordion.Item>
        )
      })}
    </MantineAccordion>
  )
}

