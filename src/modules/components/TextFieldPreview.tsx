import { useMemo } from 'react'
import { TextField } from '../../components/adapters/TextField'
import { iconNameToReactComponent } from './iconUtils'

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
  // Extract variants from selectedVariants
  const state = (selectedVariants.states || 'default') as 'default' | 'error' | 'disabled' | 'read-only' | 'focus'
  const layout = (selectedVariants.layouts || 'stacked') as 'stacked' | 'side-by-side'

  // Get icon components for examples
  const SmileyIcon = iconNameToReactComponent('star')
  const HeartIcon = iconNameToReactComponent('warning')

  // Show both layouts if no specific layout is selected, otherwise show selected layout
  const layoutsToShow: Array<'stacked' | 'side-by-side'> = selectedVariants.layouts 
    ? [layout] 
    : ['stacked', 'side-by-side']

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 'var(--recursica-brand-dimensions-gutters-vertical)', 
      width: '100%',
      alignItems: 'flex-start'
    }}>
      {layoutsToShow.map((layoutVariant) => (
        <div key={layoutVariant} style={{ width: '100%', maxWidth: '400px' }}>
          {/* Default state - show two examples: one with value, one with placeholder only */}
          {state === 'default' && (
            <>
              <div style={{ marginBottom: 'var(--recursica-brand-dimensions-gutters-vertical)' }}>
                <TextField
                  label="Label"
                  placeholder="Placeholder text"
                  defaultValue="Sample input value"
                  leadingIcon={SmileyIcon ? <SmileyIcon /> : <span>😊</span>}
                  state="default"
                  layout={layoutVariant}
                  layer={selectedLayer as any}
                />
              </div>
              <TextField
                label="Label"
                placeholder="Placeholder text"
                helpText="Help message"
                trailingIcon={SmileyIcon ? <SmileyIcon /> : <span>😊</span>}
                state="default"
                layout={layoutVariant}
                layer={selectedLayer as any}
              />
            </>
          )}
          
          {/* Error state */}
          {state === 'error' && (
            <TextField
              label="Label"
              placeholder=""
              errorText="Error message"
              leadingIcon={HeartIcon ? <HeartIcon /> : <span>❤</span>}
              state="error"
              layout={layoutVariant}
              layer={selectedLayer as any}
            />
          )}
          
          {/* Disabled state */}
          {state === 'disabled' && (
            <TextField
              label="Label"
              placeholder="Placeholder text"
              defaultValue=""
              state="disabled"
              layout={layoutVariant}
              layer={selectedLayer as any}
            />
          )}
          
          {/* Read-only state */}
          {state === 'read-only' && (
            <TextField
              label="Label"
              defaultValue="Value"
              state="read-only"
              layout={layoutVariant}
              layer={selectedLayer as any}
            />
          )}
          
          {/* Focus state (shows default with focus styling via CSS) */}
          {state === 'focus' && (
            <TextField
              label="Label"
              placeholder="Placeholder text"
              helpText="Help message"
              state="default"
              layout={layoutVariant}
              layer={selectedLayer as any}
            />
          )}
        </div>
      ))}
    </div>
  )
}
