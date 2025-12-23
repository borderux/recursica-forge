/**
 * ThemeSidebar Component
 * 
 * Left sidebar navigation for the Theme page. Includes navigation items,
 * footer links, and copyright notice.
 */

import { useLocation, useNavigate } from 'react-router-dom'
import { useThemeMode } from '../theme/ThemeModeContext'

type ThemeNavItem = 'palettes' | 'type' | 'layers' | 'dimensions'

export function ThemeSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { mode } = useThemeMode()
  
  // Determine current sub-route for navigation highlighting
  const getCurrentNavItem = (): ThemeNavItem => {
    if (location.pathname.includes('/theme/type')) return 'type'
    if (location.pathname.includes('/theme/layers')) return 'layers'
    if (location.pathname.includes('/theme/dimensions')) return 'dimensions'
    return 'palettes' // default
  }
  
  const currentNavItem = getCurrentNavItem()
  
  const layer1Base = `--recursica-brand-themes-${mode}-layer-layer-1-property`
  const interactiveColor = `--recursica-brand-themes-${mode}-palettes-core-interactive`
  
  const handleNavClick = (item: ThemeNavItem) => {
    navigate(`/theme/${item}`)
  }
  
  const navItems: Array<{ key: ThemeNavItem; label: string }> = [
    { key: 'palettes', label: 'Palettes' },
    { key: 'type', label: 'Type' },
    { key: 'layers', label: 'Layers' },
    { key: 'dimensions', label: 'Dimensions' },
  ]
  
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
      {/* Theme Heading */}
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
        Theme
      </h2>
      
      {/* Navigation Items */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--recursica-brand-dimensions-spacer-sm)', flex: 1 }}>
        {navItems.map((item) => {
          const isActive = currentNavItem === item.key
          
          return (
            <button
              key={item.key}
              onClick={() => handleNavClick(item.key)}
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
                    backgroundColor: `var(${interactiveColor})`,
                    borderRadius: '0 2px 2px 0',
                  }}
                />
              )}
              {item.label}
            </button>
          )
        })}
      </nav>
      
      {/* Footer Links */}
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
        <a
          href="https://www.recursica.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: `var(${interactiveColor})`,
            textDecoration: 'none',
            fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.8'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1'
          }}
        >
          Visit Recursica.com
        </a>
        <a
          href="https://www.recursica.com/docs/foundations/colors"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: `var(${interactiveColor})`,
            textDecoration: 'none',
            fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.8'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1'
          }}
        >
          Read documentation
        </a>
        <a
          href="https://join.slack.com/t/recursica/shared_invite/zt-3emx80y9u-DfG5WO~SApkTJjVCiYk0WQ"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: `var(${interactiveColor})`,
            textDecoration: 'none',
            fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.8'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1'
          }}
        >
          Help
        </a>
      </div>
      
      {/* Copyright */}
      <div
        style={{
          marginTop: 'var(--recursica-brand-dimensions-spacer-md)',
          fontSize: 'var(--recursica-brand-typography-caption-font-size)',
          color: `var(${layer1Base}-element-text-color)`,
          opacity: `var(${layer1Base}-element-text-low-emphasis)`,
        }}
      >
        © 2025 Border LLC. All rights reserved.
      </div>
    </aside>
  )
}
