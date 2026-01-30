import { useCallback, useState } from 'react'
import { Accordion } from '../../components/adapters/Accordion'
import { iconNameToReactComponent } from './iconUtils'

interface AccordionPreviewProps {
  selectedVariants: Record<string, string>
  selectedLayer: string
  componentElevation?: string
}

export default function AccordionPreview({
  selectedLayer,
}: AccordionPreviewProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(() => new Set([]))
  const allowMultiple = true

  const handleToggle = useCallback((id: string, open: boolean) => {
    setOpenItems(prev => {
      const next = new Set(prev)
      if (open) {
        if (!allowMultiple) next.clear()
        next.add(id)
      } else {
        next.delete(id)
      }
      return next
    })
  }, [allowMultiple])

  const fruits = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry']
  const iconNames = ['circle', 'square', 'diamond', 'circle', 'square']
  
  const items = fruits.map((fruit, index) => {
    const itemId = `item-${index + 1}`
    const iconName = iconNames[index % iconNames.length]
    const IconComponent = iconNameToReactComponent(iconName)
    return {
      id: itemId,
      title: fruit,
      content: 'Replace slot with content (component instance)',
      divider: index < fruits.length - 1, // Add divider between items except the last one
      open: openItems.has(itemId),
      icon: index % 2 === 0 ? IconComponent : undefined, // Add icon to alternating items (even indices)
    }
  })
  
  return (
    <div style={{ width: '100%', maxWidth: 520 }}>
      <Accordion
        items={items}
        layer={selectedLayer as any}
        allowMultiple={allowMultiple}
        onToggle={handleToggle}
      />
    </div>
  )
}

