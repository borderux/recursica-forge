import { useState, useEffect } from 'react'
import { MenuItem } from '../../components/adapters/MenuItem'
import { iconNameToReactComponent } from './iconUtils'

interface MenuItemPreviewProps {
  selectedVariants: Record<string, string> // e.g., { style: "default" }
  selectedLayer: string // e.g., "layer-0"
  componentElevation?: string // Not used for MenuItem, but kept for consistency
}

export default function MenuItemPreview({
  selectedVariants,
  selectedLayer,
}: MenuItemPreviewProps) {
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
      gap: 4,
      width: '100%',
      padding: '16px',
      background: '#ffffff',
      border: '1px solid #e0e0e0',
      borderRadius: '4px',
      minHeight: '200px',
    }}>
      {/* First item: Default state */}
      <MenuItem
        key={`default-${updateKey}`}
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
      
      {/* Second item: Selected state - with leading icon, supporting text, no trailing icon */}
      <MenuItem
        key={`selected-${updateKey}`}
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
      
      {/* Third item: Disabled state */}
      <MenuItem
        key={`disabled-${updateKey}`}
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
    </div>
  )
}

