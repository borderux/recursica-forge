/**
 * Sidebar Component
 * 
 * Left sidebar navigation for the Tokens page. Includes navigation items,
 * footer links, and copyright notice.
 */

import { useLocation, useNavigate } from 'react-router-dom'
import { useThemeMode } from '../theme/ThemeModeContext'
import { Button } from '../../components/adapters/Button'
import { iconNameToReactComponent } from '../components/iconUtils'

type SidebarNavItem = 'color' | 'font' | 'opacity' | 'size'

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { mode } = useThemeMode()
  
  // Determine current sub-route for navigation highlighting
  const getCurrentNavItem = (): SidebarNavItem => {
    if (location.pathname.includes('/tokens')) {
      // Check URL pathname to determine which section
      if (location.pathname === '/tokens/font') return 'font'
      if (location.pathname === '/tokens/opacity') return 'opacity'
      return 'color' // default (including /tokens)
    }
    return 'color'
  }
  
  const currentNavItem = getCurrentNavItem()
  
  const layer0Base = `--recursica-brand-themes-${mode}-layer-layer-0-property`
  const interactiveColor = `--recursica-brand-themes-${mode}-palettes-core-interactive`
  
  const handleNavClick = (item: SidebarNavItem) => {
    // Navigate using path-based routes
    if (item === 'color') {
      navigate('/tokens')
    } else if (item === 'opacity') {
      navigate('/tokens/opacity')
    } else if (item === 'size') {
      navigate('/tokens/opacity') // Both opacity and size use the same route
    } else {
      navigate('/tokens/font')
    }
  }
  
  const navItems: Array<{ key: SidebarNavItem; label: string }> = [
    { key: 'color', label: 'Color' },
    { key: 'font', label: 'Font' },
    { key: 'opacity', label: 'Opacity & Size' },
  ]
  
  return (
    <aside
      style={{
        width: '252px',
        alignSelf: 'stretch',
        backgroundColor: `var(${layer0Base}-surface)`,
        borderRightWidth: `var(${layer0Base}-border-thickness, 1px)`,
        borderRightStyle: 'solid',
        borderRightColor: `var(${layer0Base}-border-color)`,
        display: 'flex',
        flexDirection: 'column',
        // 48px left and right margins - using spacer-xl which should be 48px (tokens.size.3x)
        paddingLeft: 'var(--recursica-brand-dimensions-general-xl)',
        paddingRight: 'var(--recursica-brand-dimensions-general-xl)',
        paddingTop: 'var(--recursica-brand-dimensions-general-xl)',
        paddingBottom: 'var(--recursica-brand-dimensions-general-xl)',
        flexShrink: 0,
        position: 'relative',
      }}
    >
      {/* Tokens Heading */}
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
        Tokens
      </h2>
      
      {/* Navigation Items */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--recursica-brand-dimensions-general-sm)', flex: 1, minHeight: 0, overflow: 'auto' }}>
        {navItems.map((item) => {
          const isActive = currentNavItem === item.key
          
          return (
            <button
              key={item.key}
              onClick={() => handleNavClick(item.key)}
              style={{
                textAlign: 'left',
                padding: 'var(--recursica-brand-dimensions-general-default) var(--recursica-brand-dimensions-general-md)',
                borderRadius: 'var(--recursica-brand-dimensions-border-radius-default)',
                border: 'none',
                background: 'transparent',
                color: `var(${layer0Base}-element-text-color)`,
                opacity: isActive 
                  ? `var(${layer0Base}-element-text-high-emphasis)` 
                  : `var(${layer0Base}-element-text-low-emphasis)`,
                cursor: 'pointer',
                transition: 'opacity 0.2s',
                position: 'relative',
                fontSize: 'var(--recursica-brand-typography-button-font-size)',
                fontWeight: isActive ? 600 : 'var(--recursica-brand-typography-button-font-weight)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.opacity = `var(${layer0Base}-element-text-high-emphasis)`
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.opacity = `var(${layer0Base}-element-text-low-emphasis)`
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

