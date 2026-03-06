/**
 * ThemeSidebar Component
 * 
 * Left sidebar navigation for the Theme page. Includes navigation items,
 * footer links, and copyright notice.
 */

import { useLocation, useNavigate } from 'react-router-dom'
import { Tabs as MantineTabs } from '@mantine/core'
import { useThemeMode } from '../theme/ThemeModeContext'
import { Tabs } from '../../components/adapters/Tabs'
import { SidebarFooter } from './SidebarFooter'

type ThemeNavItem = 'core-properties' | 'type' | 'palettes' | 'elevations' | 'layers' | 'dimensions'

export function ThemeSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { mode } = useThemeMode()

  // Determine current sub-route for navigation highlighting
  const getCurrentNavItem = (): ThemeNavItem => {
    if (location.pathname.includes('/theme/core-properties')) return 'core-properties'
    if (location.pathname.includes('/theme/type')) return 'type'
    if (location.pathname.includes('/theme/palettes')) return 'palettes'
    if (location.pathname.includes('/theme/elevations')) return 'elevations'
    if (location.pathname.includes('/theme/layers')) return 'layers'
    if (location.pathname.includes('/theme/dimensions')) return 'dimensions'
    return 'core-properties' // default
  }

  const currentNavItem = getCurrentNavItem()

  const layer0Base = `--recursica-brand-themes-${mode}-layers-layer-0-properties`

  const handleNavClick = (value: string | null) => {
    const item = (value || 'core-properties') as ThemeNavItem
    navigate(`/theme/${item}`)
  }

  const navItems: Array<{ key: ThemeNavItem; label: string }> = [
    { key: 'core-properties', label: 'Core Properties' },
    { key: 'type', label: 'Type' },
    { key: 'palettes', label: 'Palettes' },
    { key: 'elevations', label: 'Elevations' },
    { key: 'layers', label: 'Layers' },
    { key: 'dimensions', label: 'Dimensions' },
  ]

  return (
    <aside
      style={{
        width: '252px',
        alignSelf: 'stretch',
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

      <SidebarFooter />
    </aside>
  )
}
