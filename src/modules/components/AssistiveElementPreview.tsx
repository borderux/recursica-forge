import { useMemo } from 'react'
import { AssistiveElement } from '../../components/adapters/AssistiveElement'
import { iconNameToReactComponent } from './iconUtils'

interface AssistiveElementPreviewProps {
  selectedVariants: Record<string, string> // e.g., { types: "help" }
  selectedLayer: string // e.g., "layer-0"
  componentElevation?: string // Not used for AssistiveElement, but kept for consistency
}

export default function AssistiveElementPreview({
  selectedVariants,
  selectedLayer,
  componentElevation,
}: AssistiveElementPreviewProps) {
  // Extract variant from selectedVariants
  const variant = (selectedVariants.types || 'help') as 'help' | 'error'

  // Get icon components - using available icons from the icon library
  // Info icon for help, warning icon for error
  const HelpIcon = iconNameToReactComponent('info')
  const ErrorIcon = iconNameToReactComponent('warning')

  // Show only the selected variant
  const Icon = variant === 'help' ? HelpIcon : ErrorIcon
  // Don't set size prop - let the container control icon size via CSS variable
  const iconElement = Icon ? <Icon /> : (variant === 'help' ? <span>ℹ</span> : <span>⚠</span>)

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--recursica_brand_dimensions_gutters_vertical)',
      width: '300px',
      alignItems: 'flex-start'
    }}>
      <AssistiveElement
        variant={variant}
        text={`${variant === 'help' ? 'Use moonstone lacquer for enchanting' : 'Rune inscription failed'}`}
        icon={iconElement}
        layer={selectedLayer as any}
      />
      <AssistiveElement
        variant={variant}
        text={`${variant === 'help' ? 'Apply three coats of lacquer before inscribing. Each coat must dry under starlight for one full cycle.' : 'The obsidian shard was impure. Check your ore source and try again with a fresh ingot.'}`}
        icon={iconElement}
        layer={selectedLayer as any}
      />
      <AssistiveElement
        variant={variant}
        text={`${variant === 'help' ? 'Enchantments take effect after cooling' : 'Missing required forge component'}`}
        layer={selectedLayer as any}
      />
    </div>
  )
}
