/**
 * Accordion Component Adapter
 *
 * Unified Accordion component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense, useMemo, useRef, useState, useEffect } from 'react'
// Aliased: Forge exports its own `AccordionItem` *type* below, and an unaliased import would
// shadow it confusingly.
import {
  AccordionItem as AdapterAccordionItem,
  AccordionControl,
  AccordionPanel,
} from '@recursica/mantine-adapter'
import { useComponent } from '../hooks/useComponent'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'

export type AccordionItem = {
  id: string
  title: React.ReactNode
  content: React.ReactNode
  icon?: React.ComponentType<{ className?: string; size?: number; style?: React.CSSProperties }> | null
  open?: boolean
  defaultOpen?: boolean
  divider?: boolean
  disabled?: boolean
}

export type AccordionProps = {
  items: AccordionItem[]
  layer?: ComponentLayer
  allowMultiple?: boolean
  elevation?: string
  onToggle?: (id: string, open: boolean) => void
  className?: string
  style?: React.CSSProperties
} & LibrarySpecificProps

type AccordionLibraryProps = {
  items: AccordionItem[]
  layer?: ComponentLayer
  allowMultiple: boolean
  elevation?: string
  openItems: string[]
  onOpenItemsChange: (openItems: string[]) => void
  onItemToggle: (id: string, open: boolean) => void
  className?: string
  style?: React.CSSProperties
} & LibrarySpecificProps

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

  if (!Component) {
    return (
      <div className={className} style={style}>
        {items.map((item, index) => {
          const isOpen = openItems.includes(item.id)
          const ItemIcon = item.icon
          const titleWithIcon = ItemIcon ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ItemIcon style={{ width: '100%', height: '100%', display: 'block' }} />
              </div>
              <span>{item.title}</span>
            </div>
          ) : item.title
          return (
            <div key={item.id}>
              <button
                type="button"
                onClick={() => handleItemToggle(item.id, !isOpen)}
                aria-expanded={isOpen}
                disabled={item.disabled}
              >
                {titleWithIcon}
              </button>
              {isOpen && <div>{item.content}</div>}
            </div>
          )
        })}
      </div>
    )
  }

  const libraryProps: AccordionLibraryProps = {
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

  // @recursica/mantine-adapter's Accordion is a COMPOSITION api — it renders children and
  // has no `items` prop. Passing `items` produced an Accordion with no children at all,
  // which is why every toolbar prop control silently disappeared.
  //
  // Control and Panel are composed explicitly rather than via AccordionItem's `title`
  // shortcut: `title` intersects with the DOM title attribute there, so it only accepts a
  // string, while Forge item titles are ReactNode. Open/close state still flows through the
  // props computed above (openItems / allowMultiple become value / multiple via the contract).
  const { items: _items, ...containerProps } = libraryProps

  return (
    <Suspense fallback={<span />}>
      <Component {...containerProps}>
        {items.map((item) => {
          const ItemIcon = item.icon
          return (
            <AdapterAccordionItem key={item.id} value={item.id} divider={item.divider}>
              <AccordionControl leftIcon={ItemIcon ? <ItemIcon /> : undefined}>
                {item.title}
              </AccordionControl>
              <AccordionPanel>{item.content}</AccordionPanel>
            </AdapterAccordionItem>
          )
        })}
      </Component>
    </Suspense>
  )
}

