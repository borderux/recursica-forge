/**
 * Mantine Table Implementation
 */

import { Table as MantineTable } from '@mantine/core'
import type { TableProps as AdapterTableProps } from '../../Table'
import { getComponentLevelCssVar, buildComponentCssVarPath } from '../../../utils/cssVarNames'
import './Table.css'

export default function Table({
  children,
  layer = 'layer-0',
  className,
  style,
  mantine,
  ...props
}: AdapterTableProps) {
  const borderColorVar = buildComponentCssVarPath('Table', 'properties', 'colors', layer, 'border-color')
  const stripedColorVar = buildComponentCssVarPath('Table', 'properties', 'colors', layer, 'striped-color')
  const stripedOpacityVar = buildComponentCssVarPath('Table', 'properties', 'opacities', layer, 'striped-opacity')
  const highlightColorVar = buildComponentCssVarPath('Table', 'properties', 'colors', layer, 'highlight-on-hover-color')
  const highlightOpacityVar = buildComponentCssVarPath('Table', 'properties', 'opacities', layer, 'highlight-on-hover-opacity')
  const selectedColorVar = buildComponentCssVarPath('Table', 'properties', 'colors', layer, 'selected-color')
  const selectedOpacityVar = buildComponentCssVarPath('Table', 'properties', 'opacities', layer, 'selected-opacity')

  const paddingVar = getComponentLevelCssVar('Table', 'padding')
  const rowPaddingVar = getComponentLevelCssVar('Table', 'row-padding')
  const borderSizeVar = getComponentLevelCssVar('Table', 'border-size')
  const borderRadiusVar = getComponentLevelCssVar('Table', 'border-radius')
  const rowDividerSizeVar = getComponentLevelCssVar('Table', 'row-divider-size')
  const rowDividerColorVar = buildComponentCssVarPath('Table', 'properties', 'colors', layer, 'row-divider-color')
  const columnDividerSizeVar = getComponentLevelCssVar('Table', 'column-divider-size')
  const columnDividerColorVar = buildComponentCssVarPath('Table', 'properties', 'colors', layer, 'column-divider-color')

  return (
    <div
      className="recursica-table-outer-wrapper"
      style={{
        padding: `var(${paddingVar})`,
        ...style
      }}
    >
      <div
        className="recursica-table-inner-wrapper"
        style={{
          ['--table-border-color' as string]: `var(${borderColorVar})`,
          ['--table-border-size' as string]: `var(${borderSizeVar})`,
          ['--table-border-radius' as string]: `var(${borderRadiusVar})`,
        } as React.CSSProperties}
      >
        <MantineTable
          className={`recursica-table mantine-table ${className || ''}`}
          style={{
            ['--table-striped-color' as string]: `var(${stripedColorVar})`,
            ['--table-striped-opacity' as string]: `var(${stripedOpacityVar})`,
            ['--table-hover-color' as string]: `var(${highlightColorVar})`,
            ['--table-hover-opacity' as string]: `var(${highlightOpacityVar})`,
            ['--table-highlight-color' as string]: `var(${highlightColorVar})`,
            ['--table-selected-color' as string]: `var(${selectedColorVar})`,
            ['--table-selected-opacity' as string]: `var(${selectedOpacityVar})`,
            ['--table-row-padding' as string]: `var(${rowPaddingVar})`,
            ['--table-row-divider-size' as string]: `var(${rowDividerSizeVar})`,
            ['--table-row-divider-color' as string]: `var(${rowDividerColorVar})`,
            ['--table-column-divider-size' as string]: `var(${columnDividerSizeVar})`,
            ['--table-column-divider-color' as string]: `var(${columnDividerColorVar})`,
          } as React.CSSProperties}
          {...mantine}
          {...props}
        >
          {children}
        </MantineTable>
      </div>
    </div>
  )
}
