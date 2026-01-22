/**
 * ComponentsSidebar Component
 * 
 * Left sidebar navigation for the Components page. Includes navigation items
 * for each component and a switch to toggle unmapped components.
 */

import { useLocation, useNavigate } from 'react-router-dom'
import { useThemeMode } from '../theme/ThemeModeContext'
import { useMemo, useEffect } from 'react'
import uikitJson from '../../vars/UIKit.json'
import { componentNameToSlug, slugToComponentName } from './componentUrlUtils'
import { getBrandStateCssVar } from '../../components/utils/brandCssVars'
import { Button } from '../../components/adapters/Button'
import { iconNameToReactComponent } from '../components/iconUtils'

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
  const unmappedCount = useMemo(() => {
    return baseComponents.filter(c => !c.isMapped).length
  }, [baseComponents])
  
  const totalCount = baseComponents.length

  // Redirect to first component if on /components without a component name
  useEffect(() => {
    if (location.pathname === '/components' && allComponents.length > 0) {
      const firstComponent = allComponents[0]
      const slug = componentNameToSlug(firstComponent.name)
      navigate(`/components/${slug}`, { replace: true })
    }
  }, [location.pathname, allComponents, navigate])

  const layer0Base = `--recursica-brand-themes-${mode}-layer-layer-0-property`
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
      {/* Components Heading */}
      <h2
        style={{
          margin: 0,
          marginBottom: 'var(--recursica-brand-dimensions-general-lg)',
          fontSize: 'var(--recursica-brand-typography-body-font-size)',
          fontWeight: 600,
          color: `var(${layer0Base}-element-text-color)`,
          opacity: `var(${layer0Base}-element-text-high-emphasis)`,
        }}
      >
        Components
      </h2>
      
      {/* Navigation Items */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--recursica-brand-dimensions-general-sm)', flex: 1 }}>
        {allComponents.map((component) => {
          const isActive = currentComponent === component.name
          const isUnmapped = !component.isMapped
          const disabledOpacity = getBrandStateCssVar(mode, 'disabled')
          
          return (
            <button
              key={component.name}
              onClick={() => handleNavClick(component.name)}
              style={{
                textAlign: 'left',
                padding: 'var(--recursica-brand-dimensions-general-default) var(--recursica-brand-dimensions-general-md)',
                borderRadius: 'var(--recursica-brand-dimensions-border-radius-default)',
                border: 'none',
                background: 'transparent',
                color: `var(${layer0Base}-element-text-color)`,
                opacity: isActive 
                  ? `var(${layer0Base}-element-text-high-emphasis)` 
                  : isUnmapped
                    ? `var(${disabledOpacity})`
                    : `var(${layer0Base}-element-text-low-emphasis)`,
                cursor: 'pointer',
                transition: 'opacity 0.2s',
                position: 'relative',
                fontSize: 'var(--recursica-brand-typography-button-font-size)',
                fontWeight: isActive ? 600 : 'var(--recursica-brand-typography-button-font-weight)',
              }}
              onMouseEnter={(e) => {
                if (!isActive && !isUnmapped) {
                  e.currentTarget.style.opacity = `var(${layer0Base}-element-text-high-emphasis)`
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.opacity = isUnmapped
                    ? `var(${disabledOpacity})`
                    : `var(${layer0Base}-element-text-low-emphasis)`
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
              {component.name}
            </button>
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
          fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
          color: `var(${layer0Base}-element-text-color)`,
          opacity: `var(${layer0Base}-element-text-low-emphasis)`,
        }}
      >
        © 2025 Border LLC. All rights reserved.
      </div>
    </aside>
  )
}
