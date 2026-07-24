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
  const CircleIcon = iconNameToReactComponent('circle')

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'flex-start',
      width: '100%',
    }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        <Accordion
          items={[
            {
              id: 'item-1',
              title: 'The Forge Entrance',
              content: 'The quick onyx goblin jumps over the lazy dwarf, executing a superb and swift maneuver with extraordinary zeal. Sparks fly from the ancient anvil as Zog lands, his obsidian gauntlets ringing against the forge floor. The air is thick with the scent of molten iron and goblin grease.',
              defaultOpen: true,
              divider: true,
              icon: CircleIcon,
            },
            {
              id: 'item-2',
              title: 'The quick onyx goblin jumps over the lazy dwarf, muttering about a treasure map he found tucked inside an old boot at the bottom of the river, while clutching a handful of stolen trinkets that sparkle like tiny stars in the moonlight of the crystalline abyss far below the obsidian mountains',
              content: '"Down, then," Zog muttered, tightening the straps of his obsidian gauntlets. He had not come this far—past the sleeping wyrm, through the Thornroot Maze, and over the lazy dwarf—to turn back now. The lantern\'s glow pulsed like a heartbeat, casting shifting patterns on the crystal walls.',
              defaultOpen: false,
              divider: false,
              icon: undefined,
            },
          ]}
          layer={selectedLayer as any}
          allowMultiple={false}
        />
      </div>
    </div>
  )
}
