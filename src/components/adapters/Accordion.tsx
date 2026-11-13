/**
 * Accordion Component Adapter
 *
 * Thin dispatcher: renders the local adapter's Accordion, or forwards props to the real
 * adapter's via useComponent.
 *
 * The one real conversion here is open/close state: Forge's per-item `open`/`defaultOpen`
 * flags and per-item `onToggle(id, open)` callback are turned into the `openItems` array and
 * `onOpenItemsChange` callback that mantine/Accordion/Accordion.tsx reads.
 */

import { Suspense, useEffect, useState } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { AccordionProps } from './common/Accordion'
import { isLocalAdapter } from '../registry/activeAdapter'
import { Accordion as LocalAccordion } from './local/dispatch/Accordion'

// Re-exported so existing `import type { AccordionItem } from '.../adapters/Accordion'`
// call sites keep working — the types now live in common/Accordion.ts.
export type { AccordionItem, AccordionProps } from './common/Accordion'

function SharedAccordion({ items, allowMultiple = false, onToggle, ...rest }: AccordionProps) {
  const Component = useComponent('Accordion')

  const isControlled = items.some(item => item.open !== undefined)
  const [internalOpenItems, setInternalOpenItems] = useState<string[]>(() =>
    items.filter(item => item.defaultOpen || item.open).map(item => item.id)
  )

  useEffect(() => {
    // Drop any open items that no longer exist
    if (!isControlled) {
      setInternalOpenItems(prev => prev.filter(id => items.some(item => item.id === id)))
    }
  }, [items, isControlled])

  const openItems = isControlled
    ? items.filter(item => item.open).map(item => item.id)
    : internalOpenItems

  const handleOpenItemsChange = (nextOpenItems: string[]) => {
    const unique = Array.from(new Set(nextOpenItems)).filter(id => items.some(item => item.id === id))
    const next = allowMultiple ? unique : unique.slice(0, 1)
    if (!isControlled) setInternalOpenItems(next)
    if (onToggle) {
      for (const id of new Set([...openItems, ...next])) {
        const isOpen = next.includes(id)
        if (openItems.includes(id) !== isOpen) onToggle(id, isOpen)
      }
    }
  }

  return (
    <Suspense fallback={<span />}>
      <Component
        {...rest}
        items={items}
        allowMultiple={allowMultiple}
        openItems={openItems}
        onOpenItemsChange={handleOpenItemsChange}
      />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const Accordion = (isLocalAdapter ? LocalAccordion : SharedAccordion) as typeof SharedAccordion
