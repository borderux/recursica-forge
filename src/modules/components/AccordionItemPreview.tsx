import { useState, useEffect, useCallback } from 'react'
import { Accordion } from '../../components/adapters/Accordion'
import { iconNameToReactComponent } from './iconUtils'

interface AccordionItemPreviewProps {
  selectedVariants: Record<string, string>
  selectedLayer: string
  componentElevation?: string
}

export default function AccordionItemPreview({
  selectedLayer,
}: AccordionItemPreviewProps) {
  const [updateKey, setUpdateKey] = useState(0)
  const [openItems, setOpenItems] = useState<Set<string>>(() => new Set(['item-1']))

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

  const handleToggle = useCallback((id: string, open: boolean) => {
    setOpenItems(prev => {
      const next = new Set(prev)
      if (open) {
        next.add(id)
      } else {
        next.delete(id)
      }
      return next
    })
  }, [])

  const CircleIcon = iconNameToReactComponent('circle')

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center',
      width: '100%',
      padding: '16px',
    }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        <Accordion
          key={`accordion-item-${updateKey}`}
          items={[
            { 
              id: 'item-1', 
              title: 'Accordion item', 
              content: 'This demonstrates AccordionItem properties. The header uses AccordionItem colors, padding, icon-size, and icon-gap. The content uses AccordionItem content-background, content-text, and content-padding.', 
              open: openItems.has('item-1'), 
              divider: true,
              icon: CircleIcon, // Add icon to first item (even index)
            },
            { 
              id: 'item-2', 
              title: 'The quick brown fox jumps over the lazy dog, and as the fox gracefully landed on the other side, the lazy dog slowly opened one eye, yawned, and decided that perhaps today was the day to finally get up and chase after that clever fox who had been teasing him for so long', 
              content: 'This demonstrates AccordionItem properties with a long header title that should truncate with an ellipsis.', 
              open: openItems.has('item-2'), 
              divider: false,
              icon: undefined, // No icon for second item (odd index)
            },
          ]}
          layer={selectedLayer as any}
          allowMultiple={false}
          onToggle={handleToggle}
        />
      </div>
    </div>
  )
}
