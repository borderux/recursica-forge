import { useMemo } from 'react'
import { Tree as MantineTree, useTree } from '@mantine/core'
import type { TreeProps as AdapterTreeProps } from '../../Tree'
import { buildComponentCssVarPath, getComponentLevelCssVar, getComponentTextCssVar } from '../../../utils/cssVarNames'
import { iconNameToReactComponent } from '../../../../modules/components/iconUtils'
import { Button } from '../../Button'
import './Tree.css'

export default function Tree({
  data = [],
  selected = [],
  onSelect,
  layer = 'layer-0',
  className,
  style,
  mantine,
  ...props
}: AdapterTreeProps) {
  const indentVar = getComponentLevelCssVar('Tree', 'indent')
  const itemGapVar = getComponentLevelCssVar('Tree', 'item-gap')
  const buttonNodeGapVar = getComponentLevelCssVar('Tree', 'button-node-gap')
  const maxWidthVar = getComponentLevelCssVar('Tree', 'max-width')
  const verticalPaddingVar = getComponentLevelCssVar('Tree', 'vertical-padding')

  // Helper to find all parent values of selected nodes
  const initialExpandedState = useMemo(() => {
    const state: Record<string, boolean> = {}
    if (!selected || selected.length === 0) return state

    function traverse(nodes: any[], parentValue?: string) {
      for (const node of nodes) {
        if (selected.includes(node.value) && parentValue) {
          state[parentValue] = true
        }
        if (node.children) {
          traverse(node.children, node.value)
          // If any child is expanded, parent must be expanded too
          if (node.children.some((c: any) => state[c.value])) {
            state[node.value] = true
          }
        }
      }
    }
    traverse(data)
    return state
  }, [data, selected])

  const treeController = useTree({
    initialExpandedState
  })

  const selectedKey = selected.join(',')
  const horizontalPaddingVar = getComponentLevelCssVar('Tree', 'horizontal-padding')
  
  const selectedBgVar = buildComponentCssVarPath('Tree', 'properties', 'colors', layer, 'selected-background')
  const selectedTextVar = buildComponentCssVarPath('Tree', 'properties', 'colors', layer, 'selected-text')
  const selectedBorderColorVar = buildComponentCssVarPath('Tree', 'properties', 'colors', layer, 'selected-border-color')
  const unselectedTextVar = buildComponentCssVarPath('Tree', 'properties', 'colors', layer, 'unselected-text')
  const hoverBgVar = buildComponentCssVarPath('Tree', 'properties', 'colors', layer, 'hover-background')
  const hoverTextVar = buildComponentCssVarPath('Tree', 'properties', 'colors', layer, 'hover-text')
  const hoverBorderColorVar = buildComponentCssVarPath('Tree', 'properties', 'colors', layer, 'hover-border-color')

  const borderSizeVar = getComponentLevelCssVar('Tree', 'border-size')
  const borderRadiusVar = getComponentLevelCssVar('Tree', 'border-radius')

  // Selected Text style variables
  const selectedTextFontFamilyVar = getComponentTextCssVar('Tree', 'selected-text', 'font-family')
  const selectedTextFontSizeVar = getComponentTextCssVar('Tree', 'selected-text', 'font-size')
  const selectedTextFontWeightVar = getComponentTextCssVar('Tree', 'selected-text', 'font-weight')
  const selectedTextLetterSpacingVar = getComponentTextCssVar('Tree', 'selected-text', 'letter-spacing')
  const selectedTextLineHeightVar = getComponentTextCssVar('Tree', 'selected-text', 'line-height')
  const selectedTextTextDecorationVar = getComponentTextCssVar('Tree', 'selected-text', 'text-decoration')
  const selectedTextTextTransformVar = getComponentTextCssVar('Tree', 'selected-text', 'text-transform')
  const selectedTextFontStyleVar = getComponentTextCssVar('Tree', 'selected-text', 'font-style')

  // Unselected Text style variables
  const unselectedTextFontFamilyVar = getComponentTextCssVar('Tree', 'unselected-text', 'font-family')
  const unselectedTextFontSizeVar = getComponentTextCssVar('Tree', 'unselected-text', 'font-size')
  const unselectedTextFontWeightVar = getComponentTextCssVar('Tree', 'unselected-text', 'font-weight')
  const unselectedTextLetterSpacingVar = getComponentTextCssVar('Tree', 'unselected-text', 'letter-spacing')
  const unselectedTextLineHeightVar = getComponentTextCssVar('Tree', 'unselected-text', 'line-height')
  const unselectedTextTextDecorationVar = getComponentTextCssVar('Tree', 'unselected-text', 'text-decoration')
  const unselectedTextTextTransformVar = getComponentTextCssVar('Tree', 'unselected-text', 'text-transform')
  const unselectedTextFontStyleVar = getComponentTextCssVar('Tree', 'unselected-text', 'font-style')

  return (
    <div 
      className={`recursica-tree mantine-tree ${className || ''}`}
      style={{
        ['--tree-indent' as string]: `var(${indentVar}, 16px)`,
        ['--tree-item-gap' as string]: `var(${itemGapVar}, 4px)`,
        ['--tree-button-node-gap' as string]: `var(${buttonNodeGapVar}, 8px)`,
        ['--tree-max-width' as string]: `var(${maxWidthVar}, 100%)`,
        ['--tree-vertical-padding' as string]: `var(${verticalPaddingVar}, 6px)`,
        ['--tree-horizontal-padding' as string]: `var(${horizontalPaddingVar}, 12px)`,
        ['--tree-selected-bg' as string]: `var(${selectedBgVar})`,
        ['--tree-selected-text' as string]: `var(${selectedTextVar})`,
        ['--tree-selected-border-color' as string]: `var(${selectedBorderColorVar}, transparent)`,
        ['--tree-border-radius' as string]: `var(${borderRadiusVar}, 4px)`,
        ['--tree-unselected-text' as string]: `var(${unselectedTextVar})`,
        ['--tree-hover-bg' as string]: `var(${hoverBgVar})`,
        ['--tree-hover-text' as string]: `var(${hoverTextVar})`,
        ['--tree-hover-border-color' as string]: `var(${hoverBorderColorVar}, transparent)`,
        ['--tree-border-size' as string]: `var(${borderSizeVar}, 0px)`,

        ['--tree-selected-font-family' as string]: `var(${selectedTextFontFamilyVar})`,
        ['--tree-selected-font-size' as string]: `var(${selectedTextFontSizeVar})`,
        ['--tree-selected-font-weight' as string]: `var(${selectedTextFontWeightVar})`,
        ['--tree-selected-letter-spacing' as string]: `var(${selectedTextLetterSpacingVar})`,
        ['--tree-selected-line-height' as string]: `var(${selectedTextLineHeightVar})`,
        ['--tree-selected-text-decoration' as string]: `var(${selectedTextTextDecorationVar})`,
        ['--tree-selected-text-transform' as string]: `var(${selectedTextTextTransformVar})`,
        ['--tree-selected-font-style' as string]: `var(${selectedTextFontStyleVar})`,

        ['--tree-unselected-font-family' as string]: `var(${unselectedTextFontFamilyVar})`,
        ['--tree-unselected-font-size' as string]: `var(${unselectedTextFontSizeVar})`,
        ['--tree-unselected-font-weight' as string]: `var(${unselectedTextFontWeightVar})`,
        ['--tree-unselected-letter-spacing' as string]: `var(${unselectedTextLetterSpacingVar})`,
        ['--tree-unselected-line-height' as string]: `var(${unselectedTextLineHeightVar})`,
        ['--tree-unselected-text-decoration' as string]: `var(${unselectedTextTextDecorationVar})`,
        ['--tree-unselected-text-transform' as string]: `var(${unselectedTextTextTransformVar})`,
        ['--tree-unselected-font-style' as string]: `var(${unselectedTextFontStyleVar})`,
        ...style
      } as React.CSSProperties}
    >
      <MantineTree
        key={selectedKey}
        tree={treeController}
        data={data}
        levelOffset="var(--tree-indent)"
        {...mantine}
        renderNode={({ node, expanded, hasChildren, elementProps, level }) => {
          const isSelected = selected.includes(node.value)
          const ChevronRightIcon = iconNameToReactComponent('chevron-right')
          const ChevronDownIcon = iconNameToReactComponent('chevron-down')

          const { paddingLeft, paddingInlineStart, ...otherStyles } = (elementProps.style as any) || {}

          return (
            <div
              {...elementProps}
              tabIndex={0}
              style={{
                ...otherStyles,
                '--tree-node-level': level
              } as React.CSSProperties}
              onClick={(e) => {
                if (!expanded) {
                  elementProps.onClick?.(e)
                }
                if (onSelect) {
                  onSelect([node.value])
                }
              }}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault()
                  e.stopPropagation()
                  if (!expanded) {
                    elementProps.onClick?.(e as any)
                  }
                  if (onSelect) {
                    onSelect([node.value])
                  }
                }
              }}
              className={`recursica-tree-node ${isSelected ? 'selected' : ''}`}
            >
              <div 
                className={`recursica-tree-chevron`}
                style={{ visibility: hasChildren ? 'visible' : 'hidden' }}
              >
                {hasChildren && (
                  <Button
                    variant="text"
                    size="small"
                    tabIndex={-1}
                    icon={expanded ? (
                      ChevronDownIcon ? <ChevronDownIcon /> : '▼'
                    ) : (
                      ChevronRightIcon ? <ChevronRightIcon /> : '▶'
                    )}
                    style={{
                      padding: 0,
                      minWidth: 0,
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: 'inherit'
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      elementProps.onClick?.(e)
                    }}
                  />
                )}
              </div>
              <span className="recursica-tree-label">{node.label}</span>
              {isSelected && <div className="recursica-tree-active-bar" />}
            </div>
          )
        }}
      />
    </div>
  )
}
