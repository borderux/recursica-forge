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
  const descriptions = [
    'The quick onyx goblin jumps over the lazy dwarf, executing a superb and swift maneuver with extraordinary zeal. Sparks fly from the ancient anvil as Zog lands, his obsidian gauntlets ringing against the forge floor.',
    'A vast chasm where the walls shimmer with veins of raw amethyst and moonstone. The air hums with an ancient resonance, as if the mountain itself is breathing. Far below, the fabled Lantern of Ereth pulses like a heartbeat.',
    'Twisted roots weave through corridors of living stone, each path a riddle left by the old druids. Zog\'s keen eyes trace the bioluminescent moss patterns—an ancient map for those who know how to read the earth\'s whispers.',
    '"Down, then," Zog muttered, tightening the straps of his obsidian gauntlets. He had not come this far—past the sleeping wyrm, through the thornroot, and over the lazy dwarf—to turn back now.',
    'Observers noted that the dwarf, while lazy, seemed impressed by the sheer audacity of the maneuver. The onyx scales of the goblin glistened in the emerald glow, creating a spectacle immortalized in the tapestries of the Northern Keep.',
  ]

  const items = chapters.map((chapter, index) => {
    const itemId = `item-${index + 1}`
    const iconName = iconNames[index % iconNames.length]
    const IconComponent = iconNameToReactComponent(iconName)
    return {
      id: itemId,
      title: chapter,
      content: descriptions[index],
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

