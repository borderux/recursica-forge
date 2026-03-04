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

  const chapters = ['The Forge Entrance', 'The Crystalline Abyss', 'The Thornroot Maze', 'The Dragon\'s Lair', 'The Northern Keep']
  const iconNames = ['fire', 'diamond', 'tree', 'shield', 'crown']

  const items = chapters.map((chapter, index) => {
    const itemId = `item-${index + 1}`
    const iconName = iconNames[index % iconNames.length]
    const IconComponent = iconNameToReactComponent(iconName)
    return {
      id: itemId,
      title: chapter,
      content: 'Replace slot with content (component instance)',
      divider: index < chapters.length - 1, // Add divider between items except the last one
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

