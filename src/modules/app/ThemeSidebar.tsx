/**
 * ThemeSidebar Component
 * 
 * Left sidebar navigation for the Theme page. Includes navigation items,
 * footer links, and copyright notice.
 */

import { useLocation, useNavigate } from 'react-router-dom'
import { Tabs as MantineTabs } from '@mantine/core'
import { useThemeMode } from '../theme/ThemeModeContext'
import { Button } from '../../components/adapters/Button'
import { Tabs } from '../../components/adapters/Tabs'
import { iconNameToReactComponent } from '../components/iconUtils'
import packageJson from '../../../package.json'

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
          color: `var(${layer0Base.replace('-properties', '-elements')}-text-color)`,
          opacity: `var(${layer0Base.replace('-properties', '-elements')}-text-low-emphasis)`,
        }}
      >
        © {new Date().getFullYear()} Border LLC. All rights reserved. Ver: {packageJson.version}
      </div>
    </aside>
  )
}
