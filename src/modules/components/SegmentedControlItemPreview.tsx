import { useState, useEffect } from 'react'
import { SegmentedControl } from '../../components/adapters/SegmentedControl'
import { iconNameToReactComponent } from './iconUtils'

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
  // Extract fill-width variant from selectedVariants
  const fillWidthVariant = (selectedVariants['fill-width'] || 'false') as 'true' | 'false'
  const fillWidth = fillWidthVariant === 'true'
  
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/d16cd3f3-655c-4e29-8162-ad6e504c679e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SegmentedControlItemPreview.tsx:18',message:'fillWidth values',data:{fillWidthVariant,fillWidth,selectedVariants:JSON.stringify(selectedVariants)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  }, [fillWidthVariant, fillWidth, selectedVariants]);
  // #endregion agent log
  
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
        const nonUIKitVars = updatedVars.filter(v => 
          !v.startsWith('--recursica-ui-kit-components-') && 
          !v.startsWith('--recursica-ui-kit-globals-')
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
  const Icon1 = iconNameToReactComponent('house')
  const Icon2 = iconNameToReactComponent('sliders-horizontal')
  const Icon3 = iconNameToReactComponent('user')
  
  // State for selected values
  const [selectedValue1, setSelectedValue1] = useState<string>('option1')
  const [selectedValue2, setSelectedValue2] = useState<string>('option2')
  const [selectedValue3, setSelectedValue3] = useState<string>('option1')
  
  // Create items with icons and labels
  const itemsWithIconsAndLabels = [
    {
      value: 'option1',
      label: 'First',
      icon: Icon1 ? <Icon1 size={16} /> : undefined,
      tooltip: 'First',
    },
    {
      value: 'option2',
      label: 'Second',
      icon: Icon2 ? <Icon2 size={16} /> : undefined,
      tooltip: 'Second',
    },
    {
      value: 'option3',
      label: 'Third',
      icon: Icon3 ? <Icon3 size={16} /> : undefined,
      tooltip: 'Third',
    },
  ]
  
  // Create items with labels only
  const itemsWithLabelsOnly = [
    {
      value: 'option1',
      label: 'First',
      tooltip: 'First',
    },
    {
      value: 'option2',
      label: 'Second',
      tooltip: 'Second',
    },
    {
      value: 'option3',
      label: 'Third',
      tooltip: 'Third',
    },
  ]
  
  // Create items with icons only
  const itemsWithIconsOnly = [
    {
      value: 'option1',
      label: 'First',
      icon: Icon1 ? <Icon1 size={16} /> : undefined,
      tooltip: 'First',
    },
    {
      value: 'option2',
      label: 'Second',
      icon: Icon2 ? <Icon2 size={16} /> : undefined,
      tooltip: 'Second',
    },
    {
      value: 'option3',
      label: 'Third',
      icon: Icon3 ? <Icon3 size={16} /> : undefined,
      tooltip: 'Third',
    },
  ]
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>
      {/* Icons and Labels - showing selected item styling */}
      <div style={{ width: '100%' }}>
        <SegmentedControl
          key={`icons-labels-${updateKey}`}
          items={itemsWithIconsAndLabels}
          value={selectedValue1}
          onChange={setSelectedValue1}
          orientation="horizontal"
          fullWidth={fillWidth}
          layer={selectedLayer as any}
          elevation={componentElevation}
          componentNameForCssVars="SegmentedControlItem"
        />
      </div>
      
      {/* Labels Only - showing selected item styling */}
      <div style={{ width: '100%' }}>
        <SegmentedControl
          key={`labels-only-${updateKey}`}
          items={itemsWithLabelsOnly}
          value={selectedValue2}
          onChange={setSelectedValue2}
          orientation="horizontal"
          fullWidth={fillWidth}
          layer={selectedLayer as any}
          elevation={componentElevation}
          componentNameForCssVars="SegmentedControlItem"
        />
      </div>
      
      {/* Icons Only - showing selected item styling */}
      <div style={{ width: '100%' }}>
        <SegmentedControl
          key={`icons-only-${updateKey}`}
          items={itemsWithIconsOnly}
          value={selectedValue3}
          onChange={setSelectedValue3}
          orientation="horizontal"
          fullWidth={fillWidth}
          layer={selectedLayer as any}
          elevation={componentElevation}
          showLabel={false}
          componentNameForCssVars="SegmentedControlItem"
        />
      </div>
    </div>
  )
}
