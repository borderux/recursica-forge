/**
 * Accordion Component Adapter
 *
 * Unified Accordion component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense, useMemo, useRef, useState, useEffect } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'

export type AccordionItem = {
  id: string
  title: React.ReactNode
  content: React.ReactNode
  icon?: React.ComponentType<{ className?: string; size?: number }> | null
  open?: boolean
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

  const [internalOpenItems, setInternalOpenItems] = useState<string[]>(controlledOpenItems)

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
          const showDivider = item.divider !== false && index < items.length - 1
          const ItemIcon = item.icon
          const titleWithIcon = ItemIcon ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ItemIcon size={16} />
              </div>
              <span>{item.title}</span>
            </div>
          ) : item.title
          return (
            <div key={item.id} data-divider={showDivider}>
              <button
                type="button"
                onClick={() => handleItemToggle(item.id, !isOpen)}
                aria-expanded={isOpen}
                disabled={item.disabled}
              >
                {titleWithIcon}
              </button>
              {isOpen && <div>{item.content}</div>}
              {showDivider && <div />}
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

  return (
    <Suspense fallback={<span />}>
      <Component {...libraryProps} />
    </Suspense>
  )
}

