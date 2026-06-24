/**
 * Mantine TableCell Implementation
 */

import { Table as MantineTable } from '@mantine/core'
import type { TableCellProps as AdapterTableCellProps } from '../../TableCell'
import { getComponentLevelCssVar, buildComponentCssVarPath, getComponentTextCssVar } from '../../../utils/cssVarNames'
import './TableCell.css'

export default function TableCell({
  children,
  isHeader,
  layer = 'layer-0',
  className,
  style,
  disabled = false,
  variant,
  mantine,
  ...props
}: AdapterTableCellProps) {
  const paddingHVar = getComponentLevelCssVar('TableCell', 'padding-horizontal')
  const paddingVVar = getComponentLevelCssVar('TableCell', 'padding-vertical')
  const maxWidthVar = getComponentLevelCssVar('TableCell', 'max-width')

  const isCurrency = variant === 'currency'
  const textStyleKey = isCurrency ? 'currency-style' : 'text-style'

  const textFamilyVar = getComponentTextCssVar('TableCell', textStyleKey, 'font-family')
  const textSizeVar = getComponentTextCssVar('TableCell', textStyleKey, 'font-size')
  const textWeightVar = getComponentTextCssVar('TableCell', textStyleKey, 'font-weight')
  const textStyleVar = getComponentTextCssVar('TableCell', textStyleKey, 'font-style')
  const textLetterSpacingVar = getComponentTextCssVar('TableCell', textStyleKey, 'letter-spacing')
  const textLineHeightVar = getComponentTextCssVar('TableCell', textStyleKey, 'line-height')
  const textCaseVar = getComponentTextCssVar('TableCell', textStyleKey, 'text-transform')
  const textDecorationVar = getComponentTextCssVar('TableCell', textStyleKey, 'text-decoration')
  const textAlignVar = getComponentTextCssVar('TableCell', textStyleKey, 'text-align')

  const textColorVar = buildComponentCssVarPath('TableCell', 'properties', 'colors', layer, disabled ? 'text-color-disabled' : 'text-color-enabled')
  const cellColorVar = buildComponentCssVarPath('TableCell', 'properties', 'colors', layer, disabled ? 'cell-color-disabled' : 'cell-color-enabled')

  const Component = isHeader ? MantineTable.Th : MantineTable.Td

  return (
    <Component
      className={`recursica-table-cell mantine-table-cell ${disabled ? 'disabled' : ''} ${className || ''}`}
      style={{
        ['--table-cell-padding-h' as string]: `var(${paddingHVar})`,
        ['--table-cell-padding-v' as string]: `var(${paddingVVar})`,
        ['--table-cell-max-width' as string]: `var(${maxWidthVar})`,
        ['--table-cell-bg' as string]: `var(${cellColorVar})`,
        ['--table-cell-color' as string]: `var(${textColorVar})`,
        ['--table-cell-font-family' as string]: `var(${textFamilyVar})`,
        ['--table-cell-font-size' as string]: `var(${textSizeVar})`,
        ['--table-cell-font-weight' as string]: `var(${textWeightVar})`,
        ['--table-cell-font-style' as string]: `var(${textStyleVar})`,
        ['--table-cell-letter-spacing' as string]: `var(${textLetterSpacingVar})`,
        ['--table-cell-line-height' as string]: `var(${textLineHeightVar})`,
        ['--table-cell-text-case' as string]: `var(${textCaseVar})`,
        ['--table-cell-text-decoration' as string]: `var(${textDecorationVar})`,
        ['--table-cell-text-align' as string]: `var(${textAlignVar})`,
        ...style
      } as React.CSSProperties}
      {...mantine}
      {...props}
    >
      {children}
    </Component>
  )
}
