import { useState, useEffect } from 'react'
import { Menu } from '../../components/adapters/Menu'
import { MenuItem } from '../../components/adapters/MenuItem'

interface MenuPreviewProps {
  selectedVariants: Record<string, string>
  selectedLayer: string
  componentElevation?: string
}

export default function MenuPreview({
  selectedVariants,
  selectedLayer,
  componentElevation,
}: MenuPreviewProps) {
  const [updateKey, setUpdateKey] = useState(0)
  
  // Listen for CSS variable updates to force re-render
  useEffect(() => {
    const handleCssVarUpdate = () => {
      setUpdateKey(prev => prev + 1)
    }
    
    window.addEventListener('cssVarsUpdated', handleCssVarUpdate)
    window.addEventListener('cssVarsReset', handleCssVarUpdate)
    
    // Also listen for style changes on documentElement
    const observer = new MutationObserver(handleCssVarUpdate)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    })
    
    return () => {
      window.removeEventListener('cssVarsUpdated', handleCssVarUpdate)
      window.removeEventListener('cssVarsReset', handleCssVarUpdate)
      observer.disconnect()
    }
  }, [])
  
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center',
      width: '100%',
      padding: '16px',
    }}>
      <Menu
        key={`menu-${updateKey}`}
        layer={selectedLayer as any}
        elevation={componentElevation}
      >
        <MenuItem
          variant="default"
          layer={selectedLayer as any}
          leadingIconType="none"
          selected={false}
          disabled={false}
          divider="bottom"
        >
          Menu item 1
        </MenuItem>
        <MenuItem
          variant="default"
          layer={selectedLayer as any}
          leadingIconType="none"
          selected={false}
          disabled={false}
          divider="bottom"
        >
          Menu item 2
        </MenuItem>
        <MenuItem
          variant="default"
          layer={selectedLayer as any}
          leadingIconType="none"
          selected={false}
          disabled={false}
          divider="bottom"
        >
          Menu item 3
        </MenuItem>
        <MenuItem
          variant="default"
          layer={selectedLayer as any}
          leadingIconType="none"
          selected={false}
          disabled={false}
          divider="bottom"
        >
          Menu item 4
        </MenuItem>
        <MenuItem
          variant="default"
          layer={selectedLayer as any}
          leadingIconType="none"
          selected={false}
          disabled={false}
          divider="bottom"
        >
          Menu item 5
        </MenuItem>
        <MenuItem
          variant="default"
          layer={selectedLayer as any}
          leadingIconType="none"
          selected={false}
          disabled={false}
          divider="none"
        >
          Menu item 6
        </MenuItem>
      </Menu>
    </div>
  )
}

