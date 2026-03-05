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
              title: 'The Forge Entrance',
              content: 'The quick onyx goblin jumps over the lazy dwarf, executing a superb and swift maneuver with extraordinary zeal. Sparks fly from the ancient anvil as Zog lands, his obsidian gauntlets ringing against the forge floor. The air is thick with the scent of molten iron and goblin grease.',
              open: openItems.has('item-1'),
              divider: true,
              icon: CircleIcon,
            },
            {
              id: 'item-2',
              title: 'The quick onyx goblin jumps over the lazy dwarf, muttering about a treasure map he found tucked inside an old boot at the bottom of the river, while clutching a handful of stolen trinkets that sparkle like tiny stars in the moonlight of the crystalline abyss far below the obsidian mountains',
              content: '"Down, then," Zog muttered, tightening the straps of his obsidian gauntlets. He had not come this far—past the sleeping wyrm, through the Thornroot Maze, and over the lazy dwarf—to turn back now. The lantern\'s glow pulsed like a heartbeat, casting shifting patterns on the crystal walls.',
              open: openItems.has('item-2'),
              divider: false,
              icon: undefined,
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
