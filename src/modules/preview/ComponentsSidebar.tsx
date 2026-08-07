/**
 * ComponentsSidebar Component
 * 
 * Left sidebar navigation for the Components page. Includes navigation items
 * for each component and a switch to toggle unmapped components.
 */

import { useLocation, useNavigate } from 'react-router-dom'
import { useThemeMode } from '../theme/ThemeModeContext'
import { useMemo, useEffect, useState, useCallback } from 'react'
import uikitJson from '../../../recursica_ui-kit.json'
import { componentNameToSlug, slugToComponentName } from './componentUrlUtils'
import { getBrandStateCssVar } from '../../components/utils/brandCssVars'
import { iconNameToReactComponent } from '../components/iconUtils'
import { SidebarFooter } from '../app/SidebarFooter'
import { genericLayerProperty, genericLayerText, paletteCore } from '../../core/css/cssVarBuilder'
import { Tree } from '../../components/adapters/Tree'

type ComponentItem = {
  name: string
  url: string
  isMapped: boolean
}

type TreeNode = {
  name: string
  url: string
  isMapped: boolean
  children?: TreeNode[]
  /** Synthetic grouping node (not a real component; not navigable). */
  isGroup?: boolean
}

/**
 * Visual-only grouping: these top-level component families are nested under a
 * synthetic "Form inputs" node in the nav tree — mirroring the "Form inputs"
 * group in the Theme › States preview. This does NOT change any JSON; it only
 * reshapes the sidebar tree. Each family keeps its own item sub-nodes.
 */
const FORM_INPUTS_GROUP = 'Form inputs'
const FORM_INPUT_PARENTS = new Set<string>([
  'Autocomplete',
  'Checkbox group',
  'Date picker',
  'Dropdown',
  'File input',
  'File upload',
  'Number input',
  'Radio button group',
  'Read only field',
  'Segmented control',
  'Slider',
  'Switch group',
  'Text field',
  'Textarea',
  'Time picker',
  'Transfer list',
])

export function ComponentsSidebar({
  debugMode,
  onDebugModeChange,
}: {
  debugMode: boolean
  onDebugModeChange: (show: boolean) => void
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const { mode } = useThemeMode()

  // Get list of mapped components from recursica_ui-kit.json
  const mappedComponents = useMemo(() => {
    const components = (uikitJson as any)?.['ui-kit']?.components || {}
    return new Set(Object.keys(components).map(name => {
      // Special alias: map checkbox-item to "Checkbox group item" so it nests active under Checkbox group
      if (name === 'checkbox-item') {
        return 'Checkbox group item'
      }
      // Special alias: map radio-button-item to "Radio button group item" so it nests active under Radio button group
      if (name === 'radio-button-item') {
        return 'Radio button group item'
      }
      // Special alias: map switch-item to "Switch group item" so it nests active under Switch group
      if (name === 'switch-item') {
        return 'Switch group item'
      }
      // Special alias: map hover-card-popover to display name with slash
      if (name === 'hover-card-popover') {
        return 'Hover card / Popover'
      }

      // Convert "button" -> "Button", "text-field" -> "Text field", "menu-item" -> "Menu item", etc.
      const words = name.split('-')
      return words
        .map((word, index) =>
          index === 0
            ? word.charAt(0).toUpperCase() + word.slice(1) // First word: capitalize first letter
            : word.toLowerCase() // Subsequent words: lowercase
        )
        .join(' ')
    }))
  }, [])

  // Base component list (all components, unfiltered)
  const baseComponents = useMemo(() => {
    const base = 'https://www.recursica.com/docs/components'
    return [
      { name: 'Accordion', url: `${base}/accordion` },
      { name: 'Accordion item', url: `${base}/accordion-item` },
      { name: 'Accordion header', url: `${base}/accordion-header` },
      { name: 'Accordion content', url: `${base}/accordion-content` },
      { name: 'Assistive element', url: `${base}/assistive-element` },
      { name: 'Avatar', url: `${base}/avatar` },
      { name: 'Badge', url: `${base}/badge` },
      { name: 'Breadcrumb', url: `${base}/breadcrumb` },
      { name: 'Button', url: `${base}/button` },
      { name: 'Card', url: `${base}/card` },
      // { name: 'Checkbox', url: `${base}/checkbox` },
      { name: 'Checkbox group', url: `${base}/checkbox-group` },
      { name: 'Checkbox group item', url: `${base}/checkbox-group-item` },
      { name: 'Chip', url: `${base}/chip` },
      { name: 'Date picker', url: `${base}/date-picker` },
      { name: 'Dropdown', url: `${base}/dropdown` },
      { name: 'File input', url: `${base}/file-input` },
      { name: 'File upload', url: `${base}/file-upload` },
      { name: 'Hover card / Popover', url: `${base}/hover-card` },
      { name: 'Label', url: `${base}/label` },
      { name: 'Link', url: `${base}/link` },
      { name: 'Loader', url: `${base}/loader` },
      { name: 'Menu', url: `${base}/menu` },
      { name: 'Menu item', url: `${base}/menu-item` },
      { name: 'Modal', url: `${base}/modal` },
      { name: 'Number input', url: `${base}/number-input` },
      { name: 'Pagination', url: `${base}/pagination` },
      { name: 'Panel', url: `${base}/panel` },

      // { name: 'Radio button', url: `${base}/radio-button` },
      { name: 'Radio button group', url: `${base}/radio-button-group` },
      { name: 'Radio button group item', url: `${base}/radio-button-group-item` },
      { name: 'Read only field', url: `${base}/read-only-field` },
      { name: 'Autocomplete', url: `${base}/autocomplete` },
      { name: 'Segmented control', url: `${base}/segmented-control` },
      { name: 'Segmented control item', url: `${base}/segmented-control-item` },
      { name: 'Slider', url: `${base}/slider` },
      { name: 'Stepper', url: `${base}/stepper` },
      { name: 'Switch group', url: `${base}/switch-group` },
      { name: 'Switch group item', url: `${base}/switch-group-item` },
      { name: 'Table', url: `${base}/table` },
      { name: 'Table cell', url: `${base}/table-cell` },
      { name: 'Table header', url: `${base}/table-header` },
      { name: 'Table footer', url: `${base}/table-footer` },
      { name: 'Tabs', url: `${base}/tabs` },
      { name: 'Tabs item', url: `${base}/tabs-item` },
      { name: 'Text field', url: `${base}/text-field` },
      { name: 'Textarea', url: `${base}/textarea` },
      { name: 'Time picker', url: `${base}/time-picker` },
      { name: 'Timeline', url: `${base}/timeline` },
      { name: 'Timeline bullet', url: `${base}/timeline-bullet` },
      { name: 'Toast', url: `${base}/toast` },
      { name: 'Tooltip', url: `${base}/tooltip` },
      { name: 'Transfer list', url: `${base}/transfer-list` },
      { name: 'Tree', url: `${base}/tree` },
    ]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(comp => ({
        ...comp,
        isMapped: mappedComponents.has(comp.name)
      }))
  }, [mappedComponents])

  // All components (no filtering)
  const allComponents = baseComponents

  // Build tree structure: group items ending with " item" under their parent
  const componentTree = useMemo(() => {
    const tree: TreeNode[] = []
    const itemMap = new Map<string, ComponentItem[]>()
    const parentMap = new Map<string, TreeNode>()

    // First pass: separate parents and child items
    allComponents.forEach(comp => {
      const isItem = comp.name.endsWith(' item') || comp.name.endsWith(' bullet') || comp.name.endsWith(' cell') || comp.name.endsWith(' header') || comp.name.endsWith(' footer') || comp.name.endsWith(' content')
      // Derive parent name by stripping the suffix
      let parentName = comp.name
      if (comp.name.endsWith(' item')) {
        parentName = comp.name.replace(/ item$/, '')
      } else if (comp.name.endsWith(' bullet')) {
        parentName = comp.name.replace(/ bullet$/, '')
      } else if (comp.name.endsWith(' cell')) {
        parentName = comp.name.replace(/ cell$/, '')
      } else if (comp.name.endsWith(' header')) {
        parentName = comp.name.replace(/ header$/, '')
      } else if (comp.name.endsWith(' footer')) {
        parentName = comp.name.replace(/ footer$/, '')
      } else if (comp.name.endsWith(' content')) {
        parentName = comp.name.replace(/ content$/, '')
      }

      if (isItem) {
        // Store item for second pass
        if (!itemMap.has(parentName)) {
          itemMap.set(parentName, [])
        }
        itemMap.get(parentName)!.push(comp)
      } else {
        // Create parent node
        const node: TreeNode = {
          name: comp.name,
          url: comp.url,
          isMapped: comp.isMapped,
        }
        tree.push(node)
        parentMap.set(comp.name, node)
      }
    })

    // Second pass: attach items to their parents
    // If parent exists in tree, attach item to it
    // If parent doesn't exist but item should be shown, create parent node from baseComponents
    itemMap.forEach((items, parentName) => {
      const parentNode = parentMap.get(parentName)
      if (parentNode) {
        // Parent exists, attach items
        if (!parentNode.children) {
          parentNode.children = []
        }
        parentNode.children.push(...(items as TreeNode[]))
      } else {
        // Parent doesn't exist in filtered list, but item should be shown
        // Find parent in baseComponents to get its URL and create parent node
        const parentBase = baseComponents.find(c => c.name === parentName)
        if (parentBase) {
          // Create parent node (will be shown even if unmapped, since it has a child)
          const newNode: TreeNode = {
            name: parentName,
            url: parentBase.url,
            isMapped: parentBase.isMapped,
            children: items as TreeNode[],
          }
          tree.push(newNode)
          parentMap.set(parentName, newNode)
        }
      }
    })

    // Nest the form-input families under a synthetic "Form inputs" group node
    // (visual only). Each family keeps its own item children (a third level).
    const inputNodes = tree.filter(n => FORM_INPUT_PARENTS.has(n.name))
    let roots = tree
    if (inputNodes.length > 0) {
      const rest = tree.filter(n => !FORM_INPUT_PARENTS.has(n.name))
      inputNodes.sort((a, b) => a.name.localeCompare(b.name))
      rest.push({
        name: FORM_INPUTS_GROUP,
        url: '',
        isMapped: true,
        isGroup: true,
        children: inputNodes,
      })
      roots = rest
    }

    // Sort tree alphabetically by name
    roots.sort((a, b) => a.name.localeCompare(b.name))

    return roots
  }, [allComponents, baseComponents])

  // Get current component from URL (convert slug to component name)
  const getCurrentComponent = (): string | null => {
    const match = location.pathname.match(/^\/components\/(.+)$/)
    if (match) {
      const slug = decodeURIComponent(match[1])
      return slugToComponentName(slug)
    }
    return null
  }

  const currentComponent = getCurrentComponent()

  const parentNodeName = useMemo(() => {
    if (!currentComponent) return ''
    const parentNode = componentTree.find(node =>
      node.children?.some(child => child.name === currentComponent)
    )
    return parentNode ? parentNode.name : ''
  }, [currentComponent, componentTree])

  const treeData = useMemo(() => {
    // Recursively map to Tree data. Child labels are shortened when they start
    // with their DIRECT parent's name (e.g. "Checkbox group item" → "Item").
    const toTreeData = (node: TreeNode, parentName?: string): any => {
      const label = (() => {
        if (parentName) {
          const p = parentName.toLowerCase()
          const c = node.name.toLowerCase()
          if (c.startsWith(p + ' ')) {
            const suffix = node.name.substring(parentName.length + 1)
            return suffix.charAt(0).toUpperCase() + suffix.slice(1)
          }
        }
        return node.name
      })()
      return {
        value: node.name,
        label,
        children: node.children?.map(child => toTreeData(child, node.name)),
      }
    }
    return componentTree.map(node => toTreeData(node))
  }, [componentTree])

  const handleNavClick = useCallback(
    (componentName: string) => {
      const target = `/components/${componentNameToSlug(componentName)}`
      // Only navigate on an actual change. @recursica/mantine-adapter's Tree reports its
      // selection from an effect keyed on [tree.selectedState, onSelectedChange], so it fires
      // on mount and again whenever this callback's identity changes — not only when the user
      // picks a node. Navigating unconditionally therefore re-rendered the sidebar, which
      // re-ran the effect, which navigated again: a loop Chrome eventually cut off with
      // "Throttling navigation to prevent the browser from hanging".
      if (location.pathname === target) return
      navigate(target)
    },
    [location.pathname, navigate]
  )

  // Stable identity matters here, not just for render cost: the adapter's Tree effect lists
  // this callback as a dependency, so a new function every render is itself a trigger.
  const handleSelect = useCallback(
    (selectedKeys: string[]) => {
      if (selectedKeys.length > 0 && selectedKeys[0] !== FORM_INPUTS_GROUP) {
        // The "Form inputs" node is a synthetic group — clicking it expands/collapses
        // (handled by the Tree) but never navigates.
        handleNavClick(selectedKeys[0])
      }
    },
    [handleNavClick]
  )

  return (
    <aside
      style={{
        width: '252px',
        height: debugMode ? 'calc(100vh - var(--header-height, 72px))' : '100%',
        position: 'sticky',
        top: 0,
        alignSelf: 'flex-start',
        backgroundColor: `var(${genericLayerProperty(0, 'surface')})`,
        borderRightWidth: `var(${genericLayerProperty(0, 'border-size')}, 1px)`,
        borderRightStyle: 'solid',
        borderRightColor: `var(${genericLayerProperty(0, 'border-color')})`,
        display: 'flex',
        flexDirection: 'column',
        paddingLeft: 'var(--recursica_brand_dimensions_general_xl)',
        paddingRight: 'var(--recursica_brand_dimensions_general_xl)',
        paddingTop: 'var(--recursica_brand_dimensions_general_xl)',
        paddingBottom: 'var(--recursica_brand_dimensions_general_xl)',
        flexShrink: 0,
      }}
    >
      <nav style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        overflow: 'auto',
        marginTop: '60px',
        marginBottom: '60px',
      }}>
        <Tree
          data={treeData}
          selected={currentComponent ? [currentComponent] : []}
          onSelect={handleSelect}
          layer="layer-0"
          style={{ width: '100%' }}
        />
      </nav>

      <SidebarFooter />
    </aside>
  )
}
