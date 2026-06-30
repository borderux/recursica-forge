import { useState, useEffect } from 'react'
import { SegmentedControl } from '../../components/adapters/SegmentedControl'
import { iconNameToReactComponent } from './iconUtils'
import { clsx } from 'clsx'

interface SegmentedControlItemPreviewProps {
  selectedVariants: Record<string, string>
  selectedLayer: string
  componentElevation?: string
}

export default function SegmentedControlItemPreview({
  selectedVariants,
  selectedLayer,
  componentElevation,
}: SegmentedControlItemPreviewProps) {
  const [updateKey, setUpdateKey] = useState(0)

  // Listen for CSS variable updates to force re-render
  // CRITICAL: Skip UIKit vars - they're silent and don't need component re-renders
  useEffect(() => {
    const handleCssVarUpdate = (e?: Event) => {
      // Filter out UIKit vars from events
      if (e && 'detail' in e) {
        const detail = (e as CustomEvent).detail
        const updatedVars = detail?.cssVars || []
        // If all vars are UIKit vars, skip re-render
        const nonUIKitVars = updatedVars.filter((v: string) =>
          !v.startsWith('--recursica_ui-kit_components_') &&
          !v.startsWith('--recursica_ui-kit_globals_')
        )
        if (updatedVars.length > 0 && nonUIKitVars.length === 0) {
          return // All vars are UIKit vars - skip re-render
        }
      }
      setUpdateKey(prev => prev + 1)
    }

    window.addEventListener('cssVarsUpdated', handleCssVarUpdate)
    window.addEventListener('cssVarsReset', handleCssVarUpdate)

    // CRITICAL: Removed MutationObserver - it was causing flickering
    // UIKit vars are silent and don't dispatch cssVarsUpdated events
    // Non-UIKit vars will dispatch cssVarsUpdated events (already filtered in handleCssVarUpdate)
    // cssVarsReset events are bulk updates that should trigger re-renders
    // The component's own MutationObserver already handles style changes for non-UIKit vars

    return () => {
      window.removeEventListener('cssVarsUpdated', handleCssVarUpdate)
      window.removeEventListener('cssVarsReset', handleCssVarUpdate)
    }
  }, [])

  // Get icons
  const Icon1 = iconNameToReactComponent('fire')
  const Icon2 = iconNameToReactComponent('diamond')

  // State for selected values
  const [selectedValue1, setSelectedValue1] = useState<string>('option1')
  const [selectedValue2, setSelectedValue2] = useState<string>('option2')
  const [selectedValue3, setSelectedValue3] = useState<string>('option1')

  // Create items with icons and labels
  const itemsWithIconsAndLabels = [
    {
      value: 'option1',
      label: 'Forge',
      icon: Icon1 ? <Icon1 size={16} /> : undefined,
      tooltip: 'Forge',
    },
    {
      value: 'option2',
      label: 'Mines',
      icon: Icon2 ? <Icon2 size={16} /> : undefined,
      tooltip: 'Mines',
    },
  ]

  // Create items with labels only
  const itemsWithLabelsOnly = [
    {
      value: 'option1',
      label: 'Forge',
      tooltip: 'Forge',
    },
    {
      value: 'option2',
      label: 'Mines',
      tooltip: 'Mines',
    },
  ]

  // Create items with icons only
  const itemsWithIconsOnly = [
    {
      value: 'option1',
      label: 'Forge',
      icon: Icon1 ? <Icon1 size={16} /> : undefined,
      tooltip: 'Forge',
    },
    {
      value: 'option2',
      label: 'Mines',
      icon: Icon2 ? <Icon2 size={16} /> : undefined,
      tooltip: 'Mines',
    },
  ]

  const selectedVariantNames = Object.keys(selectedVariants)

  const dataAttributes = selectedVariantNames
    .filter(v => !v.startsWith('__'))
    .reduce((acc, v) => {
      acc[`data-variant-${v}`] = selectedVariants[v]
      return acc
    }, {} as Record<string, string>)

  const activeState = (selectedVariants.states || selectedVariants.__hasStateControl === 'true') ? (selectedVariants.states || selectedVariants.__activeState || 'default') : null
  return (
    <div 
      className={clsx(
        'recursica-component-segmented-control-item',
        selectedVariantNames.map(v => `recursica-variant-${v}-${selectedVariants[v]}`)
      )}
      {...dataAttributes}
      style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}
    >
      
      <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
        <SegmentedControl
          key={`preview-${updateKey}`}
          items={itemsWithIconsAndLabels}
          value={selectedValue1}
          onChange={setSelectedValue1}
          orientation="horizontal"
          fullWidth={false}
          layer={selectedLayer as any}
          elevation={componentElevation}
          content={(selectedVariants.content as any) || 'icon-label'}
          componentNameForCssVars="SegmentedControlItem"
        />
      </div>
    </div>
  )
}
