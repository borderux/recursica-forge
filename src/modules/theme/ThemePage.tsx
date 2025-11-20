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
    return 'palettes' // default
  }
  
  const [currentTab, setCurrentTab] = useState(getCurrentTab())
  
  // Update tab when location changes
  useEffect(() => {
    setCurrentTab(getCurrentTab())
  }, [location.pathname])
  
  const handleTabChange = (value: string | null) => {
    if (!value) return
    const tab = value as 'palettes' | 'type' | 'layers'
    setCurrentTab(tab)
    navigate(`/theme/${tab}`)
  }
  
  // Simple vertical tab navigation using buttons styled with tokens
  return (
    <div style={{ padding: 'var(--recursica-tokens-size-2x)' }}>
      <div style={{ display: 'flex', gap: 'var(--recursica-tokens-size-2x)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 180, gap: 'var(--recursica-tokens-size-0-5x)' }}>
          <button
            onClick={() => handleTabChange('palettes')}
            style={{
              padding: 'var(--recursica-tokens-size-default) var(--recursica-tokens-size-2x)',
              textAlign: 'left',
              background: currentTab === 'palettes' ? 'var(--recursica-brand-light-palettes-core-interactive, #3b82f6)' : 'transparent',
              color: currentTab === 'palettes' ? '#fff' : 'inherit',
              border: 'none',
              borderRadius: 'var(--recursica-tokens-size-0-5x)',
              cursor: 'pointer',
              fontSize: 'var(--recursica-tokens-size-sm)',
            }}
          >
            Palettes
          </button>
          <button
            onClick={() => handleTabChange('type')}
            style={{
              padding: 'var(--recursica-tokens-size-default) var(--recursica-tokens-size-2x)',
              textAlign: 'left',
              background: currentTab === 'type' ? 'var(--recursica-brand-light-palettes-core-interactive, #3b82f6)' : 'transparent',
              color: currentTab === 'type' ? '#fff' : 'inherit',
              border: 'none',
              borderRadius: 'var(--recursica-tokens-size-0-5x)',
              cursor: 'pointer',
              fontSize: 'var(--recursica-tokens-size-sm)',
            }}
          >
            Type
          </button>
          <button
            onClick={() => handleTabChange('layers')}
            style={{
              padding: 'var(--recursica-tokens-size-default) var(--recursica-tokens-size-2x)',
              textAlign: 'left',
              background: currentTab === 'layers' ? 'var(--recursica-brand-light-palettes-core-interactive, #3b82f6)' : 'transparent',
              color: currentTab === 'layers' ? '#fff' : 'inherit',
              border: 'none',
              borderRadius: 'var(--recursica-tokens-size-0-5x)',
              cursor: 'pointer',
              fontSize: 'var(--recursica-tokens-size-sm)',
            }}
          >
            Layers
          </button>
        </div>
        <div style={{ flex: 1 }}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
