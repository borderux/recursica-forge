/**
 * Sidebar Component
 * 
 * Left sidebar navigation for the Tokens page. Includes navigation items,
 * footer links, and copyright notice.
 */

import { useLocation, useNavigate } from 'react-router-dom'
import { Tabs as MantineTabs } from '@mantine/core'
import { useThemeMode } from '../theme/ThemeModeContext'
import { Button } from '../../components/adapters/Button'
import { Tabs } from '../../components/adapters/Tabs'
import { iconNameToReactComponent } from '../components/iconUtils'
import packageJson from '../../../package.json'

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
  
  const handleNavClick = (value: string | null) => {
    const item = (value || 'color') as SidebarNavItem
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
      {/* Navigation Items */}
      <nav style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <Tabs
          value={currentNavItem}
          variant="default"
          orientation="vertical"
          layer="layer-0"
          onChange={handleNavClick}
          style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        >
          <MantineTabs.List style={{ flexDirection: 'column', flex: 1 }}>
            {navItems.map((item) => (
              <MantineTabs.Tab key={item.key} value={item.key}>
                {item.label}
              </MantineTabs.Tab>
            ))}
          </MantineTabs.List>
        </Tabs>
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
        © 2025 Border LLC. All rights reserved. Ver: {packageJson.version}
      </div>
    </aside>
  )
}

