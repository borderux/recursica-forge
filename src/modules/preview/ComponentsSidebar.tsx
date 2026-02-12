/**
 * ComponentsSidebar Component
 * 
 * Left sidebar navigation for the Components page. Includes navigation items
 * for each component and a switch to toggle unmapped components.
 */

import { useLocation, useNavigate } from 'react-router-dom'
import { useThemeMode } from '../theme/ThemeModeContext'
import { useMemo, useEffect, useState } from 'react'
import uikitJson from '../../vars/UIKit.json'
import { componentNameToSlug, slugToComponentName } from './componentUrlUtils'
import { getBrandStateCssVar } from '../../components/utils/brandCssVars'
import { Button } from '../../components/adapters/Button'
import { iconNameToReactComponent } from '../components/iconUtils'
import packageJson from '../../../package.json'

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
  showUnmapped,
  onShowUnmappedChange,
  debugMode,
  onDebugModeChange,
}: {
  showUnmapped: boolean
  onShowUnmappedChange: (show: boolean) => void
  debugMode: boolean
  onDebugModeChange: (show: boolean) => void
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const { mode } = useThemeMode()

  // Get list of mapped components from UIKit.json
  const mappedComponents = useMemo(() => {
    const components = (uikitJson as any)?.['ui-kit']?.components || {}
    return new Set(Object.keys(components).map(name => {
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
      { name: 'Checkbox', url: `${base}/checkbox` },
      { name: 'Chip', url: `${base}/chip` },
      { name: 'Date picker', url: `${base}/date-picker` },
      { name: 'Dropdown', url: `${base}/dropdown` },
      { name: 'File input', url: `${base}/file-input` },
      { name: 'File upload', url: `${base}/file-upload` },
      { name: 'Hover card', url: `${base}/hover-card` },
      { name: 'Label', url: `${base}/label` },
      { name: 'Link', url: `${base}/link` },
      { name: 'Loader', url: `${base}/loader` },
      { name: 'Menu', url: `${base}/menu` },
      { name: 'Menu item', url: `${base}/menu-item` },
      { name: 'Modal', url: `${base}/modal` },
      { name: 'Number input', url: `${base}/number-input` },
      { name: 'Pagination', url: `${base}/pagination` },
      { name: 'Panel', url: `${base}/panel` },
      { name: 'Popover', url: `${base}/popover` },
      { name: 'Radio', url: `${base}/radio` },
      { name: 'Read-only field', url: `${base}/read-only-field` },
      { name: 'Search', url: `${base}/search` },
      { name: 'Segmented control', url: `${base}/segmented-control` },
      { name: 'Segmented control item', url: `${base}/segmented-control-item` },
      { name: 'Slider', url: `${base}/slider` },
      { name: 'Stepper', url: `${base}/stepper` },
      { name: 'Switch', url: `${base}/switch` },
      { name: 'Tabs', url: `${base}/tabs` },
      { name: 'Text field', url: `${base}/text-field` },
      { name: 'Time picker', url: `${base}/time-picker` },
      { name: 'Timeline', url: `${base}/timeline` },
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

  // All component sections (filtered based on showUnmapped)
  const allComponents = useMemo(() => {
    return baseComponents.filter(comp => {
      if (comp.isMapped) return true
      return showUnmapped
    })
  }, [baseComponents, showUnmapped])

  // Build tree structure: group items ending with " item" under their parent
  const componentTree = useMemo(() => {
    const tree: TreeNode[] = []
    const itemMap = new Map<string, ComponentItem>()
    const parentMap = new Map<string, TreeNode>()

    // First pass: separate parents and items
    allComponents.forEach(comp => {
      const isItem = comp.name.endsWith(' item')
      const parentName = isItem ? comp.name.replace(' item', '') : comp.name

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
  const unmappedCount = useMemo(() => {
    return baseComponents.filter(c => !c.isMapped).length
  }, [baseComponents])

  const totalCount = baseComponents.length

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
        borderRightWidth: `var(${layer0Base}-border-thickness, 1px)`,
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
                        Item
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer Links - Fixed at bottom */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--recursica-brand-dimensions-general-sm)',
          marginTop: 'auto',
          paddingTop: 'var(--recursica-brand-dimensions-general-lg)',
          flexShrink: 0,
        }}
      >
        <Button
          variant="text"
          size="small"
          layer="layer-0"
          onClick={() => window.open('https://www.recursica.com', '_blank', 'noopener,noreferrer')}
          icon={(() => {
            const Icon = iconNameToReactComponent('arrow-top-right-on-square')
            return Icon ? <Icon style={{ width: 'var(--recursica-brand-dimensions-icons-default)', height: 'var(--recursica-brand-dimensions-icons-default)' }} /> : null
          })()}
          style={{ justifyContent: 'flex-start', width: '100%' }}
        >
          Visit Recursica.com
        </Button>
        <Button
          variant="text"
          size="small"
          layer="layer-0"
          onClick={() => window.open('https://www.recursica.com/docs/foundations/colors', '_blank', 'noopener,noreferrer')}
          icon={(() => {
            const Icon = iconNameToReactComponent('document-text')
            return Icon ? <Icon style={{ width: 'var(--recursica-brand-dimensions-icons-default)', height: 'var(--recursica-brand-dimensions-icons-default)' }} /> : null
          })()}
          style={{ justifyContent: 'flex-start', width: '100%' }}
        >
          Read documentation
        </Button>
        <Button
          variant="text"
          size="small"
          layer="layer-0"
          onClick={() => window.open('https://join.slack.com/t/recursica/shared_invite/zt-3emx80y9u-DfG5WO~SApkTJjVCiYk0WQ', '_blank', 'noopener,noreferrer')}
          icon={(() => {
            const Icon = iconNameToReactComponent('info')
            return Icon ? <Icon style={{ width: 'var(--recursica-brand-dimensions-icons-default)', height: 'var(--recursica-brand-dimensions-icons-default)' }} /> : null
          })()}
          style={{ justifyContent: 'flex-start', width: '100%' }}
        >
          Help
        </Button>
      </div>

      {/* Copyright */}
      <div
        style={{
          marginTop: 'var(--recursica-brand-dimensions-general-md)',
          fontFamily: 'var(--recursica-brand-typography-body-small-font-family)',
          fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
          fontWeight: 'var(--recursica-brand-typography-body-small-font-weight)',
          letterSpacing: 'var(--recursica-brand-typography-body-small-font-letter-spacing)',
          lineHeight: 'var(--recursica-brand-typography-body-small-line-height)',
          color: `var(${layer0Base.replace('-properties', '-elements')}-text-color)`,
          opacity: `var(${layer0Base.replace('-properties', '-elements')}-text-low-emphasis)`,
        }}
      >
        © {new Date().getFullYear()} Border LLC. All rights reserved. Ver: {packageJson.version}
      </div>
    </aside>
  )
}
