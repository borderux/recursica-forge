/**
 * ThemePage
 *
 * Unified Theme page that contains Palettes, Type, and Layers as vertical tabs.
 */
import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { useThemeMode } from './ThemeModeContext'
import { useUiKit } from '../uikit/UiKitContext'

export default function ThemePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { mode } = useThemeMode()
  const { kit } = useUiKit()
  
  // Determine current tab from URL
  const getCurrentTab = () => {
    if (location.pathname.includes('/theme/type')) return 'type'
    if (location.pathname.includes('/theme/layers')) return 'layers'
    if (location.pathname.includes('/theme/dimensions')) return 'dimensions'
    return 'palettes' // default
  }
  
  const [currentTab, setCurrentTab] = useState(getCurrentTab())
  
  // Update tab when location changes
  useEffect(() => {
    setCurrentTab(getCurrentTab())
  }, [location.pathname])
  
  const handleTabChange = (value: string | null) => {
    if (!value) return
    const tab = value as 'palettes' | 'type' | 'layers' | 'dimensions'
    setCurrentTab(tab)
    navigate(`/theme/${tab}`)
  }
  
  // Simple vertical tab navigation using buttons styled with tokens
  return (
    <div style={{ padding: 'var(--recursica-brand-dimensions-spacer-lg)' }}>
      <div style={{ display: 'flex', gap: 'var(--recursica-brand-dimensions-spacer-lg)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 180, gap: 'var(--recursica-brand-dimensions-spacer-sm)' }}>
          <button
            onClick={() => handleTabChange('palettes')}
            style={{
              padding: 'var(--recursica-brand-dimensions-spacer-default) var(--recursica-brand-dimensions-spacer-lg)',
              textAlign: 'left',
              background: currentTab === 'palettes' ? 'var(--recursica-brand-light-palettes-core-interactive, #3b82f6)' : 'transparent',
              color: currentTab === 'palettes' ? '#fff' : 'inherit',
              border: 'none',
              borderRadius: 'var(--recursica-brand-dimensions-border-radius-sm)',
              cursor: 'pointer',
              fontSize: 'var(--recursica-brand-dimensions-sm)',
            }}
          >
            Palettes
          </button>
          <button
            onClick={() => handleTabChange('type')}
            style={{
              padding: 'var(--recursica-brand-dimensions-spacer-default) var(--recursica-brand-dimensions-spacer-lg)',
              textAlign: 'left',
              background: currentTab === 'type' ? 'var(--recursica-brand-light-palettes-core-interactive, #3b82f6)' : 'transparent',
              color: currentTab === 'type' ? '#fff' : 'inherit',
              border: 'none',
              borderRadius: 'var(--recursica-brand-dimensions-border-radius-sm)',
              cursor: 'pointer',
              fontSize: 'var(--recursica-brand-dimensions-sm)',
            }}
          >
            Type
          </button>
          <button
            onClick={() => handleTabChange('layers')}
            style={{
              padding: 'var(--recursica-brand-dimensions-spacer-default) var(--recursica-brand-dimensions-spacer-lg)',
              textAlign: 'left',
              background: currentTab === 'layers' ? 'var(--recursica-brand-light-palettes-core-interactive, #3b82f6)' : 'transparent',
              color: currentTab === 'layers' ? '#fff' : 'inherit',
              border: 'none',
              borderRadius: 'var(--recursica-brand-dimensions-border-radius-sm)',
              cursor: 'pointer',
              fontSize: 'var(--recursica-brand-dimensions-sm)',
            }}
          >
            Layers
          </button>
          <button
            onClick={() => handleTabChange('dimensions')}
            style={{
              padding: 'var(--recursica-brand-dimensions-spacer-default) var(--recursica-brand-dimensions-spacer-lg)',
              textAlign: 'left',
              background: currentTab === 'dimensions' ? 'var(--recursica-brand-light-palettes-core-interactive, #3b82f6)' : 'transparent',
              color: currentTab === 'dimensions' ? '#fff' : 'inherit',
              border: 'none',
              borderRadius: 'var(--recursica-brand-dimensions-border-radius-sm)',
              cursor: 'pointer',
              fontSize: 'var(--recursica-brand-dimensions-sm)',
            }}
          >
            Dimensions
          </button>
        </div>
        <div style={{ flex: 1 }}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
