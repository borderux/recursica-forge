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
  mantine,
  ...props
}: AdapterTableFooterProps) {
  const paddingHVar = getComponentLevelCssVar('TableFooter', 'padding-horizontal')
  const paddingVVar = getComponentLevelCssVar('TableFooter', 'padding-vertical')
  const dividerSizeVar = getComponentLevelCssVar('TableFooter', 'divider-size')

  const textFamilyVar = getComponentTextCssVar('TableFooter', 'text-style', 'font-family')
  const textSizeVar = getComponentTextCssVar('TableFooter', 'text-style', 'font-size')
  const textWeightVar = getComponentTextCssVar('TableFooter', 'text-style', 'font-weight')
  const textStyleVar = getComponentTextCssVar('TableFooter', 'text-style', 'font-style')
  const textLetterSpacingVar = getComponentTextCssVar('TableFooter', 'text-style', 'letter-spacing')
  const textLineHeightVar = getComponentTextCssVar('TableFooter', 'text-style', 'line-height')
  const textCaseVar = getComponentTextCssVar('TableFooter', 'text-style', 'text-transform')
  const textDecorationVar = getComponentTextCssVar('TableFooter', 'text-style', 'text-decoration')

  const textColorVar = buildComponentCssVarPath('TableFooter', 'properties', 'colors', layer, 'text-color-enabled')
  const cellColorVar = buildComponentCssVarPath('TableFooter', 'properties', 'colors', layer, 'cell-color-enabled')
  const dividerColorVar = buildComponentCssVarPath('TableFooter', 'properties', 'colors', layer, 'divider-color')

  return (
    <MantineTable.Td
      className={`recursica-table-footer mantine-table-footer ${disabled ? 'disabled' : ''} ${className || ''}`}
      style={{
        ['--table-footer-padding-h' as string]: `var(${paddingHVar})`,
        ['--table-footer-padding-v' as string]: `var(${paddingVVar})`,
        ['--table-footer-divider-size' as string]: `var(${dividerSizeVar})`,
        ['--table-footer-divider-color' as string]: `var(${dividerColorVar})`,
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
      {children}
    </MantineTable.Td>
  )
}
