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
import { useCompliance } from '../../core/compliance/ComplianceContext'
import { Badge } from '../../components/adapters/Badge'
import { genericLayerProperty } from '../../core/css/cssVarBuilder'

type ThemeNavItem = 'core-properties' | 'type' | 'palettes' | 'elevations' | 'layers' | 'dimensions' | 'compliance'

export function ThemeSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { mode } = useThemeMode()
  const { issueCount } = useCompliance()

  // Determine current sub-route for navigation highlighting
  const getCurrentNavItem = (): ThemeNavItem => {
    if (location.pathname.includes('/theme/core-properties')) return 'core-properties'
    if (location.pathname.includes('/theme/type')) return 'type'
    if (location.pathname.includes('/theme/palettes')) return 'palettes'
    if (location.pathname.includes('/theme/elevations')) return 'elevations'
    if (location.pathname.includes('/theme/layers')) return 'layers'
    if (location.pathname.includes('/theme/dimensions')) return 'dimensions'
    if (location.pathname.includes('/theme/compliance')) return 'compliance'
    return 'core-properties' // default
  }

  const currentNavItem = getCurrentNavItem()

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
    { key: 'compliance', label: 'Compliance' },
  ]

  return (
    <aside
      style={{
        width: '252px',
        alignSelf: 'stretch',
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
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {item.label}
                  {item.key === 'compliance' && issueCount > 0 && (
                    <Badge variant="alert" size="small">
                      {issueCount}
                    </Badge>
                  )}
                </span>
              </MantineTabs.Tab>
            ))}
          </MantineTabs.List>
        </Tabs>
      </nav>

      <SidebarFooter />
    </aside>
  )
}
