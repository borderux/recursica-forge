import { useCallback, useState } from 'react'
import { Accordion } from '../../components/adapters/Accordion'

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
  
  return (
    <div style={{ width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {fruits.map((fruit, index) => {
        const itemId = `item-${index + 1}`
        const items = [
          {
            id: itemId,
            title: fruit,
            content: 'Replace slot with content (component instance)',
            divider: false,
            open: openItems.has(itemId),
          }
        ]
        
        return (
          <Accordion
            key={fruit}
            items={items}
            layer={selectedLayer as any}
            allowMultiple={allowMultiple}
            onToggle={handleToggle}
          />
        )
      })}
    </div>
  )
}

