import { Menu } from '../../components/adapters/Menu'
import { MenuItem } from '../../components/adapters/MenuItem'

interface MenuPreviewProps {
  selectedVariants: Record<string, string>
  selectedLayer: string
  componentElevation?: string
}

export default function MenuPreview({
  selectedVariants,
  selectedLayer,
  componentElevation,
}: MenuPreviewProps) {
  // No outer cssVarsUpdated listener/force-remount needed here — Menu, and every shell's
  // MenuItem (Material/Carbon listen internally, Mantine reacts via native CSS), already
  // pick up toolbar edits on their own. See the Menu bug thread for how this was confirmed.
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      width: '100%',
    }}>
      <Menu
        layer={selectedLayer as any}
        elevation={componentElevation}
      >
        <MenuItem
          variant="default"
          layer={selectedLayer as any}
          leadingIconType="none"
          selected={false}
          disabled={false}
          divider="bottom"
        >
          Temper Steel
        </MenuItem>
        <MenuItem
          variant="default"
          layer={selectedLayer as any}
          leadingIconType="none"
          selected={false}
          disabled={false}
          divider="bottom"
        >
          Forge New Blade
        </MenuItem>
        <MenuItem
          variant="default"
          layer={selectedLayer as any}
          leadingIconType="none"
          selected={false}
          disabled={false}
          divider="bottom"
        >
          Inspect Rune Stones
        </MenuItem>
        <MenuItem
          variant="default"
          layer={selectedLayer as any}
          leadingIconType="none"
          selected={false}
          disabled={false}
          divider="bottom"
        >
          Smelt Ore
        </MenuItem>
        <MenuItem
          variant="default"
          layer={selectedLayer as any}
          leadingIconType="none"
          selected={false}
          disabled={false}
          divider="bottom"
        >
          Enchant Weapon
        </MenuItem>
        <MenuItem
          variant="default"
          layer={selectedLayer as any}
          leadingIconType="none"
          selected={false}
          disabled={false}
          divider="none"
        >
          Sharpen Edges
        </MenuItem>
      </Menu>
    </div>
  )
}

