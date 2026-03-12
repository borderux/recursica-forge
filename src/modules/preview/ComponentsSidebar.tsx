/**
 * ComponentsSidebar Component
 * 
 * Left sidebar navigation for the Components page. Includes navigation items
 * for each component and a switch to toggle unmapped components.
 */

import { useLocation, useNavigate } from 'react-router-dom'
import { useThemeMode } from '../theme/ThemeModeContext'
import { useMemo, useEffect, useState } from 'react'
import uikitJson from '../../../recursica_ui-kit.json'
import { componentNameToSlug, slugToComponentName } from './componentUrlUtils'
import { getBrandStateCssVar } from '../../components/utils/brandCssVars'
import { iconNameToReactComponent } from '../components/iconUtils'
import { SidebarFooter } from '../app/SidebarFooter'

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
}

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
      { name: 'Switch', url: `${base}/switch` },
      { name: 'Tabs', url: `${base}/tabs` },
      { name: 'Text field', url: `${base}/text-field` },
      { name: 'Textarea', url: `${base}/textarea` },
      { name: 'Time picker', url: `${base}/time-picker` },
      { name: 'Timeline', url: `${base}/timeline` },
      { name: 'Timeline bullet', url: `${base}/timeline-bullet` },
      { name: 'Toast', url: `${base}/toast` },
      { name: 'Tooltip', url: `${base}/tooltip` },
      { name: 'Transfer list', url: `${base}/transfer-list` },
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
    const itemMap = new Map<string, ComponentItem>()
    const parentMap = new Map<string, TreeNode>()

    // First pass: separate parents and child items
    allComponents.forEach(comp => {
      const isItem = comp.name.endsWith(' item') || comp.name.endsWith(' bullet')
      // Derive parent name by stripping the suffix
      let parentName = comp.name
      if (comp.name.endsWith(' item')) {
        parentName = comp.name.replace(/ item$/, '')
      } else if (comp.name.endsWith(' bullet')) {
        parentName = comp.name.replace(/ bullet$/, '')
      }

      if (isItem) {
        // Store item for second pass
        itemMap.set(parentName, comp)
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
    itemMap.forEach((item, parentName) => {
      const parentNode = parentMap.get(parentName)
      if (parentNode) {
        // Parent exists, attach item
        if (!parentNode.children) {
          parentNode.children = []
        }
        parentNode.children.push(item as TreeNode)
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
            children: [item as TreeNode],
          }
          tree.push(newNode)
          parentMap.set(parentName, newNode)
        }
      }
    })

    // Sort tree alphabetically by name
    tree.sort((a, b) => a.name.localeCompare(b.name))

    return tree
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

  // Track expanded nodes
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  // Auto-expand parent if child is active
  useEffect(() => {
    if (currentComponent) {
      const parentNode = componentTree.find(node =>
        node.children?.some(child => child.name === currentComponent)
      )
      if (parentNode) {
        setExpandedNodes(prev => new Set([...prev, parentNode.name]))
      }
    }
  }, [currentComponent, componentTree])


  // Redirect to first component if on /components without a component name
  useEffect(() => {
    if (location.pathname === '/components' && componentTree.length > 0) {
      const firstNode = componentTree[0]
      const slug = componentNameToSlug(firstNode.name)
      navigate(`/components/${slug}`, { replace: true })
    }
  }, [location.pathname, componentTree, navigate])

  const layer0Base = `--recursica-brand-themes-${mode}-layers-layer-0-properties`
  const interactiveColor = `--recursica-brand-themes-${mode}-palettes-core-interactive`

  const handleNavClick = (componentName: string) => {
    const slug = componentNameToSlug(componentName)
    navigate(`/components/${slug}`)
  }

  return (
    <aside
      style={{
        width: '252px',
        height: debugMode ? 'calc(100vh - var(--header-height, 72px))' : '100%',
        position: 'sticky',
        top: 0,
        alignSelf: 'flex-start',
        backgroundColor: `var(${layer0Base}-surface)`,
        borderRightWidth: `var(${layer0Base}-border-size, 1px)`,
        borderRightStyle: 'solid',
        borderRightColor: `var(${layer0Base}-border-color)`,
        display: 'flex',
        flexDirection: 'column',
        paddingLeft: 'var(--recursica-brand-dimensions-general-xl)',
        paddingRight: 'var(--recursica-brand-dimensions-general-xl)',
        paddingTop: 'var(--recursica-brand-dimensions-general-xl)',
        paddingBottom: 'var(--recursica-brand-dimensions-general-xl)',
        flexShrink: 0,
      }}
    >
      {/* Navigation Items */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--recursica-brand-dimensions-general-sm)', flex: 1, minHeight: 0, overflow: 'auto' }}>
        {componentTree.map((node) => {
          const hasChildren = node.children && node.children.length > 0
          const isExpanded = expandedNodes.has(node.name)
          const isActive = currentComponent === node.name
          const isUnmapped = !node.isMapped
          const disabledOpacity = getBrandStateCssVar(mode, 'disabled')

          const ChevronRightIcon = iconNameToReactComponent('chevron-right')
          const ChevronDownIcon = iconNameToReactComponent('chevron-down')

          const toggleExpand = (e: React.MouseEvent) => {
            e.stopPropagation()
            setExpandedNodes(prev => {
              const next = new Set(prev)
              if (isExpanded) {
                next.delete(node.name)
              } else {
                next.add(node.name)
              }
              return next
            })
          }

          return (
            <div key={node.name} style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Parent Node */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {hasChildren && (
                  <button
                    onClick={toggleExpand}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      padding: 'var(--recursica-brand-dimensions-general-default)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: `var(${layer0Base.replace('-properties', '-elements')}-text-color)`,
                      opacity: `var(${layer0Base.replace('-properties', '-elements')}-text-low-emphasis)`,
                    }}
                    aria-label={isExpanded ? 'Collapse' : 'Expand'}
                  >
                    {isExpanded && ChevronDownIcon ? (
                      <ChevronDownIcon style={{ width: '16px', height: '16px' }} />
                    ) : ChevronRightIcon ? (
                      <ChevronRightIcon style={{ width: '16px', height: '16px' }} />
                    ) : null}
                  </button>
                )}
                {!hasChildren && (
                  <div style={{ width: '32px' }} />
                )}
                <button
                  onClick={() => {
                    // Auto-expand if node has children
                    if (hasChildren && !isExpanded) {
                      setExpandedNodes(prev => new Set([...prev, node.name]))
                    }
                    handleNavClick(node.name)
                  }}
                  style={{
                    flex: 1,
                    textAlign: 'left',
                    padding: 'var(--recursica-brand-dimensions-general-default) var(--recursica-brand-dimensions-general-md)',
                    borderRadius: 'var(--recursica-brand-dimensions-border-radius-default)',
                    border: 'none',
                    background: 'transparent',
                    color: `var(${layer0Base.replace('-properties', '-elements')}-text-color)`,
                    opacity: isActive
                      ? `var(${layer0Base.replace('-properties', '-elements')}-text-high-emphasis)`
                      : isUnmapped
                        ? `var(${disabledOpacity})`
                        : `var(${layer0Base.replace('-properties', '-elements')}-text-low-emphasis)`,
                    cursor: 'pointer',
                    transition: 'opacity 0.2s',
                    position: 'relative',
                    fontFamily: 'var(--recursica-brand-typography-body-font-family)',
                    fontSize: 'var(--recursica-brand-typography-body-font-size)',
                    fontWeight: isActive ? 600 : 'var(--recursica-brand-typography-body-font-weight)',
                    letterSpacing: 'var(--recursica-brand-typography-body-font-letter-spacing)',
                    lineHeight: 'var(--recursica-brand-typography-body-line-height)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive && !isUnmapped) {
                      e.currentTarget.style.opacity = `var(${layer0Base.replace('-properties', '-elements')}-text-high-emphasis)`
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.opacity = isUnmapped
                        ? `var(${disabledOpacity})`
                        : `var(${layer0Base.replace('-properties', '-elements')}-text-low-emphasis)`
                    }
                  }}
                >
                  {/* Active indicator - red vertical bar */}
                  {isActive && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: '3px',
                        backgroundColor: `var(${interactiveColor})`,
                        borderRadius: '0 2px 2px 0',
                      }}
                    />
                  )}
                  {node.name}
                </button>
              </div>

              {/* Children Nodes */}
              {hasChildren && isExpanded && node.children && (
                <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: '48px' }}>
                  {node.children.map((child) => {
                    const isChildActive = currentComponent === child.name
                    const isChildUnmapped = !child.isMapped

                    return (
                      <button
                        key={child.name}
                        onClick={() => handleNavClick(child.name)}
                        style={{
                          textAlign: 'left',
                          padding: 'var(--recursica-brand-dimensions-general-default) var(--recursica-brand-dimensions-general-md)',
                          paddingLeft: 'var(--recursica-brand-dimensions-general-lg)',
                          borderRadius: 'var(--recursica-brand-dimensions-border-radius-default)',
                          border: 'none',
                          background: 'transparent',
                          color: `var(${layer0Base.replace('-properties', '-elements')}-text-color)`,
                          opacity: isChildActive
                            ? `var(${layer0Base.replace('-properties', '-elements')}-text-high-emphasis)`
                            : isChildUnmapped
                              ? `var(${disabledOpacity})`
                              : `var(${layer0Base.replace('-properties', '-elements')}-text-low-emphasis)`,
                          cursor: 'pointer',
                          transition: 'opacity 0.2s',
                          position: 'relative',
                          fontFamily: 'var(--recursica-brand-typography-body-font-family)',
                          fontSize: 'var(--recursica-brand-typography-body-font-size)',
                          fontWeight: isChildActive ? 600 : 'var(--recursica-brand-typography-body-font-weight)',
                          letterSpacing: 'var(--recursica-brand-typography-body-font-letter-spacing)',
                          lineHeight: 'var(--recursica-brand-typography-body-line-height)',
                        }}
                        onMouseEnter={(e) => {
                          if (!isChildActive && !isChildUnmapped) {
                            e.currentTarget.style.opacity = `var(${layer0Base.replace('-properties', '-elements')}-text-high-emphasis)`
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isChildActive) {
                            e.currentTarget.style.opacity = isChildUnmapped
                              ? `var(${disabledOpacity})`
                              : `var(${layer0Base.replace('-properties', '-elements')}-text-low-emphasis)`
                          }
                        }}
                      >
                        {/* Active indicator - red vertical bar */}
                        {isChildActive && (
                          <div
                            style={{
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              bottom: 0,
                              width: '3px',
                              backgroundColor: `var(${interactiveColor})`,
                              borderRadius: '0 2px 2px 0',
                            }}
                          />
                        )}
                        {/* Display the suffix after the parent name, capitalized */}
                        {(() => {
                          const parentName = node.name.toLowerCase()
                          const childName = child.name.toLowerCase()
                          if (childName.startsWith(parentName + ' ')) {
                            const suffix = child.name.substring(node.name.length + 1)
                            return suffix.charAt(0).toUpperCase() + suffix.slice(1)
                          }
                          return child.name
                        })()}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <SidebarFooter />
    </aside>
  )
}
