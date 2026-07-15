import { useMemo } from 'react'
import { Tree as MantineTree, useTree } from '@mantine/core'
import type { TreeProps as AdapterTreeProps } from '../../Tree'
import { buildComponentCssVarPath, getComponentLevelCssVar } from '../../../utils/cssVarNames'
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
  forceHover = false,
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
  
  const borderSizeVar = getComponentLevelCssVar('Tree', 'border-size')
  const borderRadiusVar = getComponentLevelCssVar('Tree', 'border-radius')

  // Colors + text style now live under variants.selections.<sel>[.variants.states.hover].properties…
  const baseColorVar = (sel: string, prop: string) =>
    buildComponentCssVarPath('Tree', 'variants', 'selection-states', sel, 'properties', 'colors', layer, prop)
  const hoverColorVar = (sel: string, prop: string) =>
    buildComponentCssVarPath('Tree', 'variants', 'selection-states', sel, 'variants', 'states', 'hover', 'properties', 'colors', layer, prop)
  const textStyleVar = (sel: string, prop: string) =>
    buildComponentCssVarPath('Tree', 'variants', 'selection-states', sel, 'properties', 'text', prop)

  const TEXT_PROPS = ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'line-height', 'text-decoration', 'text-transform', 'font-style']

  const treeVars: Record<string, string> = {
    '--tree-indent': `var(${indentVar}, 16px)`,
    '--tree-item-gap': `var(${itemGapVar}, 4px)`,
    '--tree-button-node-gap': `var(${buttonNodeGapVar}, 8px)`,
    '--tree-max-width': `var(${maxWidthVar}, 100%)`,
    '--tree-vertical-padding': `var(${verticalPaddingVar}, 6px)`,
    '--tree-horizontal-padding': `var(${horizontalPaddingVar}, 12px)`,
    '--tree-border-size': `var(${borderSizeVar}, 0px)`,
    '--tree-border-radius': `var(${borderRadiusVar}, 4px)`,
    // selected / unselected base + hover colors
    '--tree-selected-bg': `var(${baseColorVar('selected', 'background-color')}, transparent)`,
    '--tree-selected-border-color': `var(${baseColorVar('selected', 'border-color')}, transparent)`,
    '--tree-selected-text': `var(${baseColorVar('selected', 'text-color')})`,
    '--tree-unselected-bg': `var(${baseColorVar('unselected', 'background-color')}, transparent)`,
    '--tree-unselected-border-color': `var(${baseColorVar('unselected', 'border-color')}, transparent)`,
    '--tree-unselected-text': `var(${baseColorVar('unselected', 'text-color')})`,
    '--tree-selected-hover-bg': `var(${hoverColorVar('selected', 'background-color')})`,
    '--tree-selected-hover-border-color': `var(${hoverColorVar('selected', 'border-color')}, transparent)`,
    '--tree-selected-hover-text': `var(${hoverColorVar('selected', 'text-color')})`,
    '--tree-unselected-hover-bg': `var(${hoverColorVar('unselected', 'background-color')})`,
    '--tree-unselected-hover-border-color': `var(${hoverColorVar('unselected', 'border-color')}, transparent)`,
    '--tree-unselected-hover-text': `var(${hoverColorVar('unselected', 'text-color')})`,
  }
  for (const p of TEXT_PROPS) {
    treeVars[`--tree-selected-${p}`] = `var(${textStyleVar('selected', p)})`
    treeVars[`--tree-unselected-${p}`] = `var(${textStyleVar('unselected', p)})`
  }

  return (
    <div 
      className={`recursica-tree mantine-tree ${forceHover ? 'force-hover' : ''} ${className || ''}`}
      style={{ ...treeVars, ...style } as React.CSSProperties}
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
