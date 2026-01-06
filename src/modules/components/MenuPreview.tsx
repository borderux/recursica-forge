import { useState, useEffect } from 'react'
import { Menu } from '../../components/adapters/Menu'
import { MenuItem } from '../../components/adapters/MenuItem'
import { iconNameToReactComponent } from './iconUtils'

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
  
  const ChevronRightIcon = iconNameToReactComponent('arrow-right')
  const FileIcon = iconNameToReactComponent('document-text')
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 16,
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
          trailingIcon={ChevronRightIcon ? <ChevronRightIcon /> : undefined}
          selected={false}
          disabled={false}
          divider="bottom"
        >
          Menu item
        </MenuItem>
        <MenuItem
          variant="selected"
          layer={selectedLayer as any}
          leadingIcon={FileIcon ? <FileIcon /> : undefined}
          leadingIconType="icon"
          supportingText="Supporting value"
          selected={true}
          disabled={false}
          divider="bottom"
        >
          Menu item
        </MenuItem>
        <MenuItem
          variant="disabled"
          layer={selectedLayer as any}
          leadingIconType="none"
          trailingIcon={ChevronRightIcon ? <ChevronRightIcon /> : undefined}
          selected={false}
          disabled={true}
          divider="bottom"
        >
          Menu item
        </MenuItem>
      </Menu>
    </div>
  )
}

