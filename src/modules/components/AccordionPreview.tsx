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
  const [openItems, setOpenItems] = useState<Set<string>>(() => new Set(['item-3', 'item-4']))
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

  const items = [
    { id: 'item-1', title: 'Accordion', content: 'Replace slot with content (component instance)', divider: true },
    { id: 'item-2', title: 'Accordion', content: 'Replace slot with content (component instance)', divider: true },
    { id: 'item-3', title: 'Accordion', content: 'Replace slot with content (component instance)', divider: true },
    { id: 'item-4', title: 'Accordion', content: 'Replace slot with content (component instance)', divider: true },
    { id: 'item-5', title: 'Accordion', content: 'Replace slot with content (component instance)', divider: false },
  ].map(item => ({
    ...item,
    open: openItems.has(item.id),
  }))

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

