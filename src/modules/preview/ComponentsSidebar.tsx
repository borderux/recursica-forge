/**
 * ComponentsSidebar Component
 * 
 * Left sidebar navigation for the Components page. Includes navigation items
 * for each component and a switch to toggle unmapped components.
 */

import { useLocation, useNavigate } from 'react-router-dom'
import { useThemeMode } from '../theme/ThemeModeContext'
import { Switch } from '../../components/adapters/Switch'
import { useMemo, useEffect } from 'react'
import uikitJson from '../../vars/UIKit.json'
import { componentNameToSlug, slugToComponentName } from './componentUrlUtils'

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
      // Convert "button" -> "Button", "text-field" -> "Text field", etc.
      return name
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    }))
  }, [])

  // All component sections (same as PreviewPage)
  const allComponents = useMemo(() => {
    const base = 'https://www.recursica.com/docs/components'
    const components = [
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
      { name: 'Link', url: `${base}/link` },
      { name: 'Loader', url: `${base}/loader` },
      { name: 'Menu', url: `${base}/menu` },
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
    
    return components.filter(comp => {
      if (comp.isMapped) return true
      return showUnmapped
    })
  }, [mappedComponents, showUnmapped])

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
    return allComponents.filter(c => !c.isMapped).length
  }, [allComponents])

  // Redirect to first component if on /components without a component name
  useEffect(() => {
    if (location.pathname === '/components' && allComponents.length > 0) {
      const firstComponent = allComponents[0]
      const slug = componentNameToSlug(firstComponent.name)
      navigate(`/components/${slug}`, { replace: true })
    }
  }, [location.pathname, allComponents, navigate])

  const layer1Base = `--recursica-brand-themes-${mode}-layer-layer-1-property`
  const interactiveColor = `--recursica-brand-${mode}-palettes-core-interactive`
  
  const handleNavClick = (componentName: string) => {
    const slug = componentNameToSlug(componentName)
    navigate(`/components/${slug}`)
  }
  
  return (
    <aside
      style={{
        width: '252px',
        height: '100%',
        backgroundColor: `var(${layer1Base}-surface)`,
        borderRightWidth: `var(${layer1Base}-border-thickness, 1px)`,
        borderRightStyle: 'solid',
        borderRightColor: `var(${layer1Base}-border-color)`,
        display: 'flex',
        flexDirection: 'column',
        paddingLeft: 'var(--recursica-brand-dimensions-spacer-xl)',
        paddingRight: 'var(--recursica-brand-dimensions-spacer-xl)',
        paddingTop: 'var(--recursica-brand-dimensions-spacer-xl)',
        paddingBottom: 'var(--recursica-brand-dimensions-spacer-xl)',
        flexShrink: 0,
      }}
    >
      {/* Components Heading */}
      <h2
        style={{
          margin: 0,
          marginBottom: 'var(--recursica-brand-dimensions-spacer-lg)',
          fontSize: 'var(--recursica-brand-typography-body-font-size)',
          fontWeight: 600,
          color: `var(${layer1Base}-element-text-color)`,
          opacity: `var(${layer1Base}-element-text-high-emphasis)`,
        }}
      >
        Components
      </h2>
      
      {/* Navigation Items */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--recursica-brand-dimensions-spacer-sm)', flex: 1 }}>
        {allComponents.map((component) => {
          const isActive = currentComponent === component.name
          
          return (
            <button
              key={component.name}
              onClick={() => handleNavClick(component.name)}
              style={{
                textAlign: 'left',
                padding: 'var(--recursica-brand-dimensions-spacer-default) var(--recursica-brand-dimensions-spacer-md)',
                borderRadius: 'var(--recursica-brand-dimensions-border-radius-default)',
                border: 'none',
                background: 'transparent',
                color: `var(${layer1Base}-element-text-color)`,
                opacity: isActive 
                  ? `var(${layer1Base}-element-text-high-emphasis)` 
                  : `var(${layer1Base}-element-text-low-emphasis)`,
                cursor: 'pointer',
                transition: 'opacity 0.2s',
                position: 'relative',
                fontSize: 'var(--recursica-brand-typography-button-font-size)',
                fontWeight: isActive ? 600 : 'var(--recursica-brand-typography-button-font-weight)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.opacity = `var(${layer1Base}-element-text-high-emphasis)`
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.opacity = `var(${layer1Base}-element-text-low-emphasis)`
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
                    backgroundColor: '#ef4444', // Red indicator bar
                    borderRadius: '0 2px 2px 0',
                  }}
                />
              )}
              {component.name}
            </button>
          )
        })}
      </nav>
      
      {/* Show Unmapped Components Switch and Debug Mode */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--recursica-brand-dimensions-spacer-sm)',
          marginTop: 'auto',
          paddingTop: 'var(--recursica-brand-dimensions-spacer-lg)',
          borderTopWidth: `var(${layer1Base}-border-thickness, 1px)`,
          borderTopStyle: 'solid',
          borderTopColor: `var(${layer1Base}-border-color)`,
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--recursica-brand-dimensions-spacer-default)',
        }}>
          <Switch
            checked={showUnmapped}
            onChange={onShowUnmappedChange}
            layer="layer-0"
          />
          <label 
            onClick={() => onShowUnmappedChange(!showUnmapped)}
            style={{
              color: `var(${layer1Base}-element-text-color)`,
              opacity: `var(${layer1Base}-element-text-low-emphasis)`,
              fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
              cursor: 'pointer',
              flex: 1,
            }}>
            Show unmapped ({unmappedCount})
          </label>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--recursica-brand-dimensions-spacer-default)',
        }}>
          <Switch
            checked={debugMode}
            onChange={onDebugModeChange}
            layer="layer-0"
          />
          <label 
            onClick={() => onDebugModeChange(!debugMode)}
            style={{
              color: `var(${layer1Base}-element-text-color)`,
              opacity: `var(${layer1Base}-element-text-low-emphasis)`,
              fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
              cursor: 'pointer',
              flex: 1,
            }}>
            Debug mode
          </label>
        </div>
      </div>
    </aside>
  )
}
