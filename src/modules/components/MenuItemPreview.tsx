import { useState, useEffect } from 'react'
import { Menu } from '../../components/adapters/Menu'
import { MenuItem } from '../../components/adapters/MenuItem'
import { iconNameToReactComponent } from './iconUtils'

interface MenuItemPreviewProps {
  selectedVariants: Record<string, string> // e.g., { style: "default" }
  selectedLayer: string // e.g., "layer-0"
  componentElevation?: string // Not used for MenuItem, but kept for consistency
}

export default function MenuItemPreview({
  selectedVariants,
  selectedLayer,
  componentElevation,
}: MenuItemPreviewProps) {
  const [updateKey, setUpdateKey] = useState(0)

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

  const ChevronRightIcon = iconNameToReactComponent('arrow-right')
  const FileIcon = iconNameToReactComponent('document-text')
  const HammerIcon = iconNameToReactComponent('hammer')
  const SnowflakeIcon = iconNameToReactComponent('snowflake')

  // The selection-state currently chosen in the toolbar. Built-ins are unselected/selected;
  // any other value is a custom variant the user created and is now editing. For built-in states
  // we keep the rich demo; for a custom state every item renders that state so its edits show.
  const selectionState = selectedVariants['selection-states'] || 'unselected'
  const isBuiltInState = selectionState === 'unselected' || selectionState === 'selected'

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      width: '100%',
    }}>
      <Menu
        key={`menu-${updateKey}`}
        layer={selectedLayer as any}
        elevation={componentElevation}
      >
        {isBuiltInState ? (
          <>
            {/* First item: Default state */}
            <MenuItem
              key={`default-${updateKey}`}
              variant="default"
              layer={selectedLayer as any}
              leadingIcon={HammerIcon ? <HammerIcon /> : undefined}
              leadingIconType="icon"
              trailingIcon={ChevronRightIcon ? <ChevronRightIcon /> : undefined}
              supportingText="Crafting tool for weapons"
              selected={false}
              disabled={false}
              divider="bottom"
            >
              Forge Hammer
            </MenuItem>

            {/* Second item: Selected state - with leading icon, supporting text, no trailing icon */}
            <MenuItem
              key={`selected-${updateKey}`}
              variant="selected"
              layer={selectedLayer as any}
              leadingIcon={FileIcon ? <FileIcon /> : undefined}
              leadingIconType="icon"
              supportingText="Used for enchanting armor"
              selected={true}
              disabled={false}
              divider="bottom"
            >
              Runic Anvil
            </MenuItem>

            {/* Third item: Disabled + unselected */}
            <MenuItem
              key={`disabled-${updateKey}`}
              variant="disabled"
              layer={selectedLayer as any}
              leadingIcon={SnowflakeIcon ? <SnowflakeIcon /> : undefined}
              leadingIconType="icon"
              trailingIcon={ChevronRightIcon ? <ChevronRightIcon /> : undefined}
              supportingText="Out of stock"
              selected={false}
              disabled={true}
              divider="bottom"
            >
              Crystal Quencher
            </MenuItem>

            {/* Fourth item: Disabled + selected */}
            <MenuItem
              key={`selected-disabled-${updateKey}`}
              variant="selected"
              layer={selectedLayer as any}
              leadingIcon={FileIcon ? <FileIcon /> : undefined}
              leadingIconType="icon"
              supportingText="Locked while enchanting"
              selected={true}
              disabled={true}
              divider="none"
            >
              Frostforge Ledger
            </MenuItem>
          </>
        ) : (
          /* Custom selection-state: render an item using that state name so its prop edits reflect. */
          <MenuItem
            key={`custom-${selectionState}-${updateKey}`}
            layer={selectedLayer as any}
            selectionState={selectionState}
            leadingIcon={FileIcon ? <FileIcon /> : undefined}
            leadingIconType="icon"
            supportingText="Custom selection state"
            selected={true}
            disabled={false}
            divider="none"
          >
            Runic Anvil
          </MenuItem>
        )}
      </Menu>
    </div>
  )
}

