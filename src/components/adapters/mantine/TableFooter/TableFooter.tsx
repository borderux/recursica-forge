/**
 * Mantine TableFooter Implementation
 */

import { Table as MantineTable } from '@mantine/core'
import type { TableFooterProps as AdapterTableFooterProps } from '../../TableFooter'
import { getComponentLevelCssVar, buildComponentCssVarPath, getComponentTextCssVar } from '../../../utils/cssVarNames'
import './TableFooter.css'

export default function TableFooter({
  children,
  layer = 'layer-0',
  className,
  style,
  disabled = false,
  variant,
  mantine,
  ...props
}: AdapterTableFooterProps) {
  const paddingHVar = getComponentLevelCssVar('TableFooter', 'padding-horizontal')
  const paddingVVar = getComponentLevelCssVar('TableFooter', 'padding-vertical')
  const verticalMarginVar = getComponentLevelCssVar('TableFooter', 'vertical-margin')
  const horizontalDividerSizeVar = getComponentLevelCssVar('TableFooter', 'horizontal-divider-size')
  const verticalDividerSizeVar = getComponentLevelCssVar('TableFooter', 'vertical-divider-size')

  const isCurrency = variant === 'currency'
  const textComponent = isCurrency ? 'TableCell' : 'TableFooter'
  const textStyleKey = isCurrency ? 'currency-style' : 'text-style'

  const textFamilyVar = getComponentTextCssVar(textComponent, textStyleKey, 'font-family')
  const textSizeVar = getComponentTextCssVar(textComponent, textStyleKey, 'font-size')
  const textWeightVar = getComponentTextCssVar(textComponent, textStyleKey, 'font-weight')
  const textStyleVar = getComponentTextCssVar(textComponent, textStyleKey, 'font-style')
  const textLetterSpacingVar = getComponentTextCssVar(textComponent, textStyleKey, 'letter-spacing')
  const textLineHeightVar = getComponentTextCssVar(textComponent, textStyleKey, 'line-height')
  const textCaseVar = getComponentTextCssVar(textComponent, textStyleKey, 'text-transform')
  const textDecorationVar = getComponentTextCssVar(textComponent, textStyleKey, 'text-decoration')

  const textColorVar = buildComponentCssVarPath('TableFooter', 'properties', 'colors', layer, 'text-color-enabled')
  const cellColorVar = buildComponentCssVarPath('TableFooter', 'properties', 'colors', layer, 'cell-color-enabled')
  const horizontalDividerColorVar = buildComponentCssVarPath('TableFooter', 'properties', 'colors', layer, 'horizontal-divider-color')
  const verticalDividerColorVar = buildComponentCssVarPath('TableFooter', 'properties', 'colors', layer, 'vertical-divider-color')

  return (
    <MantineTable.Td
      className={`recursica-table-footer mantine-table-footer ${disabled ? 'disabled' : ''} ${className || ''}`}
      style={{
        ['--table-footer-padding-h' as string]: `var(${paddingHVar})`,
        ['--table-footer-padding-v' as string]: `var(${paddingVVar})`,
        ['--table-footer-vertical-margin' as string]: `var(${verticalMarginVar})`,
        ['--table-footer-horizontal-divider-size' as string]: `var(${horizontalDividerSizeVar})`,
        ['--table-footer-horizontal-divider-color' as string]: `var(${horizontalDividerColorVar})`,
        ['--table-footer-vertical-divider-size' as string]: `var(${verticalDividerSizeVar})`,
        ['--table-footer-vertical-divider-color' as string]: `var(${verticalDividerColorVar})`,
        ['--table-footer-bg' as string]: `var(${cellColorVar})`,
        ['--table-footer-color' as string]: `var(${textColorVar})`,
        ['--table-footer-font-family' as string]: `var(${textFamilyVar})`,
        ['--table-footer-font-size' as string]: `var(${textSizeVar})`,
        ['--table-footer-font-weight' as string]: `var(${textWeightVar})`,
        ['--table-footer-font-style' as string]: `var(${textStyleVar})`,
        ['--table-footer-letter-spacing' as string]: `var(${textLetterSpacingVar})`,
        ['--table-footer-line-height' as string]: `var(${textLineHeightVar})`,
        ['--table-footer-text-case' as string]: `var(${textCaseVar})`,
        ['--table-footer-text-decoration' as string]: `var(${textDecorationVar})`,
        ...style
      } as React.CSSProperties}
      {...mantine}
      {...props}
    >
      <div className="recursica-table-footer-content">
        {children}
      </div>
    </MantineTable.Td>
  )
}
