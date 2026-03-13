import { useMemo } from 'react'
import { TextField } from '../../components/adapters/TextField'
import { iconNameToReactComponent } from './iconUtils'
import { useThemeMode } from '../theme/ThemeModeContext'
import { getGlobalCssVar } from '../../components/utils/cssVarNames'

interface TextFieldPreviewProps {
  selectedVariants: Record<string, string> // e.g., { states: "default", layouts: "stacked" }
  selectedLayer: string // e.g., "layer-0"
  componentElevation?: string // Not used for TextField, but kept for consistency
}

export default function TextFieldPreview({
  selectedVariants,
  selectedLayer,
  componentElevation,
}: TextFieldPreviewProps) {
  const { mode } = useThemeMode()

  // Extract variants from selectedVariants
  const state = (selectedVariants.states || 'default') as 'default' | 'error' | 'disabled' | 'focus'

  // Get form vertical gutter CSS variable
  const formVerticalGutterVar = getGlobalCssVar('form', 'properties', 'vertical-item-gap', mode)

  // Get icon components for examples
  const SmileyIcon = iconNameToReactComponent('star')
  const HeartIcon = iconNameToReactComponent('warning')

  // Show both layouts
  const layoutsToShow: Array<'stacked' | 'side-by-side'> = ['stacked', 'side-by-side']

  const h2Style = {
    margin: 0,
    marginBottom: 16,
    textTransform: 'capitalize' as const,
    fontFamily: 'var(--recursica_brand_typography_h2-font-family)',
    fontSize: 'var(--recursica_brand_typography_h2-font-size)',
    fontWeight: 'var(--recursica_brand_typography_h2-font-weight)',
    letterSpacing: 'var(--recursica_brand_typography_h2-font-letter-spacing)',
    lineHeight: 'var(--recursica_brand_typography_h2-line-height)',
  } as React.CSSProperties

  const verticalGutter = 'var(--recursica_brand_dimensions_gutters_vertical)'

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: verticalGutter,
      width: '100%',
      alignItems: 'center'
    }}>
      {layoutsToShow.map((layoutVariant) => (
        <div key={layoutVariant} style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <h2 style={h2Style}>
            {layoutVariant === 'side-by-side' ? 'Side-by-side' : 'Stacked'}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: `var(${formVerticalGutterVar})`, width: '100%' }}>
            {/* Default state - show two examples: one with value, one with placeholder only */}
            {state === 'default' && (
              <>
                <TextField
                  label="Forge Name"
                  placeholder="Enter artifact name..."
                  defaultValue="Obsidian Gauntlets of the Northern Keep"
                  leadingIcon={SmileyIcon ? <SmileyIcon /> : <span>😊</span>}
                  state="default"
                  layout={layoutVariant}
                  layer={selectedLayer as any}
                />
                <TextField
                  label="Rune Inscription"
                  placeholder="Enter rune sequence..."
                  helpText="Use ancient dwarvish notation"
                  trailingIcon={SmileyIcon ? <SmileyIcon /> : <span>😊</span>}
                  state="default"
                  layout={layoutVariant}
                  layer={selectedLayer as any}
                />
              </>
            )}

            {/* Error state */}
            {state === 'error' && (
              <>
                <TextField
                  label="Forge Name"
                  placeholder="Enter artifact name..."
                  defaultValue="Obsidian Gauntlets"
                  errorText="Name already claimed by another forge master"
                  leadingIcon={HeartIcon ? <HeartIcon /> : <span>⚠</span>}
                  state="error"
                  layout={layoutVariant}
                  layer={selectedLayer as any}
                />
                <TextField
                  label="Rune Inscription"
                  placeholder="Enter rune sequence..."
                  errorText="Invalid rune sequence detected"
                  trailingIcon={HeartIcon ? <HeartIcon /> : <span>⚠</span>}
                  state="error"
                  layout={layoutVariant}
                  layer={selectedLayer as any}
                />
              </>
            )}

            {/* Disabled state */}
            {state === 'disabled' && (
              <TextField
                label="Forge Name"
                placeholder="Enter artifact name..."
                state="disabled"
                layout={layoutVariant}
                layer={selectedLayer as any}
              />
            )}

            {/* Focus state (shows default with focus styling via CSS) */}
            {state === 'focus' && (
              <TextField
                label="Forge Name"
                placeholder="Enter artifact name..."
                state="focus"
                layout={layoutVariant}
                layer={selectedLayer as any}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
