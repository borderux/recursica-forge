/**
 * Mantine TableHeader Implementation
 */

import { Table as MantineTable } from '@mantine/core'
import type { TableHeaderProps as AdapterTableHeaderProps } from '../../TableHeader'
import { getComponentLevelCssVar, buildComponentCssVarPath, getComponentTextCssVar } from '../../../utils/cssVarNames'
import { iconNameToReactComponent } from '../../../../modules/components/iconUtils'
import './TableHeader.css'

export default function TableHeader({
  children,
  layer = 'layer-0',
  className,
  style,
  disabled = false,
  sorted = null,
  mantine,
  ...props
}: AdapterTableHeaderProps) {
  const isSorted = sorted === 'asc' || sorted === 'desc'
  const textStyleGroupName = isSorted ? 'sorted-text-style' : 'unsorted-text-style'

  const paddingHVar = getComponentLevelCssVar('TableHeader', 'padding-horizontal')
  const paddingVVar = getComponentLevelCssVar('TableHeader', 'padding-vertical')
  const labelSortGapVar = getComponentLevelCssVar('TableHeader', 'label-sort-gap')
  const iconSizeVar = getComponentLevelCssVar('TableHeader', 'icon-size')
  const dividerSizeVar = getComponentLevelCssVar('TableHeader', 'divider-size')

  const textFamilyVar = getComponentTextCssVar('TableHeader', textStyleGroupName, 'font-family')
  const textSizeVar = getComponentTextCssVar('TableHeader', textStyleGroupName, 'font-size')
  const textWeightVar = getComponentTextCssVar('TableHeader', textStyleGroupName, 'font-weight')
  const textStyleVar = getComponentTextCssVar('TableHeader', textStyleGroupName, 'font-style')
  const textLetterSpacingVar = getComponentTextCssVar('TableHeader', textStyleGroupName, 'letter-spacing')
  const textLineHeightVar = getComponentTextCssVar('TableHeader', textStyleGroupName, 'line-height')
  const textCaseVar = getComponentTextCssVar('TableHeader', textStyleGroupName, 'text-transform')
  const textDecorationVar = getComponentTextCssVar('TableHeader', textStyleGroupName, 'text-decoration')

  // Colors
  let textColorVar = ''
  let cellColorVar = ''
  let dividerColorVar = buildComponentCssVarPath('TableHeader', 'properties', 'colors', layer, 'divider-color')

  if (disabled) {
    textColorVar = buildComponentCssVarPath('TableHeader', 'properties', 'colors', layer, 'text-color-disabled')
    cellColorVar = buildComponentCssVarPath('TableHeader', 'properties', 'colors', layer, 'cell-color-disabled')
  } else if (isSorted) {
    textColorVar = buildComponentCssVarPath('TableHeader', 'properties', 'colors', layer, 'sorted-text-color')
    cellColorVar = buildComponentCssVarPath('TableHeader', 'properties', 'colors', layer, 'sorted-cell-color')
  } else {
    textColorVar = buildComponentCssVarPath('TableHeader', 'properties', 'colors', layer, 'unsorted-text-color')
    cellColorVar = buildComponentCssVarPath('TableHeader', 'properties', 'colors', layer, 'unsorted-cell-color')
  }

  const ChevronUp = iconNameToReactComponent('chevron-up')
  const ChevronDown = iconNameToReactComponent('chevron-down')

  return (
    <MantineTable.Th
      className={`recursica-table-header mantine-table-header ${disabled ? 'disabled' : ''} ${isSorted ? 'sorted' : 'unsorted'} ${className || ''}`}
      style={{
        ['--table-header-padding-h' as string]: `var(${paddingHVar})`,
        ['--table-header-padding-v' as string]: `var(${paddingVVar})`,
        ['--table-header-label-sort-gap' as string]: `var(${labelSortGapVar})`,
        ['--table-header-icon-size' as string]: `var(${iconSizeVar})`,
        ['--table-header-divider-size' as string]: `var(${dividerSizeVar})`,
        ['--table-header-divider-color' as string]: `var(${dividerColorVar})`,
        ['--table-header-bg' as string]: `var(${cellColorVar})`,
        ['--table-header-color' as string]: `var(${textColorVar})`,
        ['--table-header-font-family' as string]: `var(${textFamilyVar})`,
        ['--table-header-font-size' as string]: `var(${textSizeVar})`,
        ['--table-header-font-weight' as string]: `var(${textWeightVar})`,
        ['--table-header-font-style' as string]: `var(${textStyleVar})`,
        ['--table-header-letter-spacing' as string]: `var(${textLetterSpacingVar})`,
        ['--table-header-line-height' as string]: `var(${textLineHeightVar})`,
        ['--table-header-text-case' as string]: `var(${textCaseVar})`,
        ['--table-header-text-decoration' as string]: `var(${textDecorationVar})`,
        ...style
      } as React.CSSProperties}
      {...mantine}
      {...props}
    >
      <div className="recursica-table-header-content">
        <span className="recursica-table-header-label">{children}</span>
        {sorted === 'asc' && ChevronUp && (
          <ChevronUp className="recursica-table-header-sort-icon" />
        )}
        {sorted === 'desc' && ChevronDown && (
          <ChevronDown className="recursica-table-header-sort-icon" />
        )}
      </div>
    </MantineTable.Th>
  )
}
