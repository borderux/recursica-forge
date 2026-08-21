/**
 * Accordion Component Adapter
 *
 * Unified Accordion component that renders the appropriate library implementation
 * based on the current UI kit selection.
 *
 * Open/close state is normalized here (controlled vs. uncontrolled, single vs. multiple)
 * because every library needs the same answer to "what's open right now" — duplicating that
 * logic per library would just be three copies of the same bookkeeping. Everything
 * library-specific — translating that state, and `items`, into what Mantine/Material/Carbon
 * actually render — lives in each library's own wrapper under adapters/{mantine,material,carbon}/Accordion.
 */

import { Suspense, useMemo, useRef, useState, useEffect } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { AccordionAdapterProps, AccordionProps } from './common/Accordion'

// Re-exported so existing `import type { AccordionItem } from '.../adapters/Accordion'`
// call sites keep working — the types now live in common/Accordion.ts.
export type { AccordionItem, AccordionProps } from './common/Accordion'

export function Accordion({
  items,
  layer = 'layer-0',
  allowMultiple = false,
  elevation,
  onToggle,
  className,
  style,
  mantine,
  material,
  carbon,
}: AccordionProps) {
  const Component = useComponent('Accordion')

  const isControlled = useMemo(() => items.some(item => item.open !== undefined), [items])
  const controlledOpenItems = useMemo(
    () => items.filter(item => item.open).map(item => item.id),
    [items]
  )

  const [internalOpenItems, setInternalOpenItems] = useState<string[]>(() =>
    items.filter(item => item.defaultOpen || item.open).map(item => item.id)
  )

  useEffect(() => {
    if (!isControlled) {
      // Drop any open items that no longer exist
      setInternalOpenItems(prev => prev.filter(id => items.some(item => item.id === id)))
    }
  }, [items, isControlled])

  const openItems = isControlled ? controlledOpenItems : internalOpenItems
  const prevOpenItemsRef = useRef<string[]>(openItems)

  useEffect(() => {
    prevOpenItemsRef.current = openItems
  }, [openItems])

  const normalizeOpenItems = (nextOpenItems: string[]) => {
    const unique = Array.from(new Set(nextOpenItems)).filter(id =>
      items.some(item => item.id === id)
    )
    return allowMultiple ? unique : unique.slice(0, 1)
  }

  const applyOpenItems = (nextOpenItems: string[]) => {
    const normalized = normalizeOpenItems(nextOpenItems)
    const prev = prevOpenItemsRef.current

    if (!isControlled) {
      setInternalOpenItems(normalized)
    }

    if (onToggle) {
      const prevSet = new Set(prev)
      const nextSet = new Set(normalized)
      const allIds = new Set([...prevSet, ...nextSet])
      allIds.forEach(id => {
        const wasOpen = prevSet.has(id)
        const isOpen = nextSet.has(id)
        if (wasOpen !== isOpen) {
          onToggle(id, isOpen)
        }
      })
    }
  }

  const handleItemToggle = (id: string, open: boolean) => {
    if (open) {
      const next = allowMultiple ? [...openItems, id] : [id]
      applyOpenItems(next)
    } else {
      const next = openItems.filter(itemId => itemId !== id)
      applyOpenItems(next)
    }
  }

  const handleOpenItemsChange = (nextOpenItems: string[]) => {
    applyOpenItems(nextOpenItems)
  }

  const adapterProps: AccordionAdapterProps = {
    items,
    layer,
    allowMultiple,
    elevation,
    openItems,
    onOpenItemsChange: handleOpenItemsChange,
    onItemToggle: handleItemToggle,
    className,
    style,
    mantine,
    material,
    carbon,
  }

  return (
    <Suspense fallback={<span />}>
      <Component {...adapterProps} />
    </Suspense>
  )
}
