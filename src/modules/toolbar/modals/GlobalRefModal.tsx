/**
 * GlobalRefModal
 *
 * Shown when a user edits a component property that is backed by a
 * shared `{ui-kit.globals.*}` reference.  Asks whether to update the
 * global (affecting all components that share it) or override just
 * the current component.
 */

import { useState, useEffect } from 'react'
import { Panel } from '../../../components/adapters/Panel'
import { Modal } from '../../../components/adapters/Modal'
import { Button } from '../../../components/adapters/Button'
import { useThemeMode } from '../../theme/ThemeModeContext'
import type { GlobalRefConflict } from '../../../core/css/globalRefInterceptor'
import { resolveGlobalRefConflict } from '../../../core/css/globalRefInterceptor'
import { updateCssVar } from '../../../core/css/updateCssVar'
import PaletteColorControl from '../../forms/PaletteColorControl'
import BrandBorderRadiusSlider from '../utils/BrandBorderRadiusSlider'
import BrandDimensionSliderInline from '../utils/BrandDimensionSliderInline'
import PixelValueSliderInline from '../utils/PixelValueSliderInline'
import { useVars } from '../../vars/VarsContext'
import { iconNameToReactComponent } from '../../components/iconUtils'
import { Slider } from '../../../components/adapters/Slider'
import { Label } from '../../../components/adapters/Label'
import { readCssVar, readCssVarResolved } from '../../../core/css/readCssVar'
import { getVarsStore } from '../../../core/store/varsStore'

function BorderSizeSliderInline({ targetCssVar, label }: { targetCssVar: string; label: string }) {
  const [value, setValue] = useState(() => {
    const currentValue = readCssVar(targetCssVar)
    const resolvedValue = readCssVarResolved(targetCssVar)
    const valueStr = resolvedValue || currentValue || '0px'
    const match = valueStr.match(/^(-?\d+(?:\.\d+)?)px$/i)
    return match ? Math.max(0, Math.min(10, parseFloat(match[1]))) : 0
  })

  useEffect(() => {
    const handleUpdate = () => {
      const currentValue = readCssVar(targetCssVar)
      const resolvedValue = readCssVarResolved(targetCssVar)
      const valueStr = resolvedValue || currentValue || '0px'
      const match = valueStr.match(/^(-?\d+(?:\.\d+)?)px$/i)
      if (match) {
        setValue(Math.max(0, Math.min(10, parseFloat(match[1]))))
      }
    }
    window.addEventListener('cssVarsUpdated', handleUpdate)
    window.addEventListener('cssVarsReset', handleUpdate)
    return () => {
      window.removeEventListener('cssVarsUpdated', handleUpdate)
      window.removeEventListener('cssVarsReset', handleUpdate)
    }
  }, [targetCssVar])

  const handleChange = (val: number | [number, number]) => {
    const numValue = typeof val === 'number' ? val : val[0]
    const clampedValue = Math.max(0, Math.min(10, Math.round(numValue)))
    setValue(clampedValue)
    updateCssVar(targetCssVar, `${clampedValue}px`)
    window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
      detail: { cssVars: [targetCssVar] }
    }))
  }

  const handleChangeCommitted = (val: number | [number, number]) => {
    const numValue = typeof val === 'number' ? val : val[0]
    const clampedValue = Math.max(0, Math.min(10, Math.round(numValue)))
    setValue(clampedValue)
    updateCssVar(targetCssVar, `${clampedValue}px`)
    window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
      detail: { cssVars: [targetCssVar] }
    }))
  }

  return (
    <Slider
      value={value}
      onChange={handleChange}
      onChangeCommitted={handleChangeCommitted}
      min={0}
      max={10}
      step={1}
      layer="layer-1"
      layout="stacked"
      showInput={false}
      showValueLabel={true}
      valueLabel={(val) => `${Math.round(val)}px`}
      minLabel="0px"
      maxLabel="10px"
      showMinMaxLabels={false}
      label={
        <Label layer="layer-1" layout="stacked">
          {label}
        </Label>
      }
    />
  )
}


export interface GlobalRefModalProps {
  isOpen: boolean
  onClose: () => void
  conflict: GlobalRefConflict | null
}

export function GlobalRefModal({ isOpen, onClose, conflict }: GlobalRefModalProps) {
  const [rememberChoice, setRememberChoice] = useState(false)
  const [hasChanged, setHasChanged] = useState(false)
  const [showResetConfirmation, setShowResetConfirmation] = useState(false)
  const { mode } = useThemeMode()
  const { uikit } = useVars()
  const layerElements = `--recursica_brand_themes_${mode}_layers_layer-1_elements`

  // Store the initial value of the global variable from the UIKit JSON when the modal opens
  const [initialGlobalDtcgValue, setInitialGlobalDtcgValue] = useState<any>(null)
  
  useEffect(() => {
    if (!isOpen) {
      setInitialGlobalDtcgValue(null)
      return
    }

    if (isOpen && conflict?.globalRefPath && uikit && initialGlobalDtcgValue === null) {
      const path = conflict.globalRefPath.split('.')
      let node: any = uikit
      for (const seg of path) {
        if (node && typeof node === 'object') node = node[seg]
        else {
          node = undefined
          break
        }
      }
      if (node && typeof node === 'object' && node.$value !== undefined) {
        setInitialGlobalDtcgValue(node.$value)
      }
    }
  }, [isOpen, conflict?.globalRefPath, uikit, initialGlobalDtcgValue])

  useEffect(() => {
    if (!conflict?.globalCssVarName) return
    const handleCssVarUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (!detail?.cssVars || detail.cssVars.includes(conflict.globalCssVarName)) {
        setHasChanged(true)
      }
    }
    window.addEventListener('cssVarsUpdated', handleCssVarUpdate)
    return () => {
      window.removeEventListener('cssVarsUpdated', handleCssVarUpdate)
    }
  }, [conflict?.globalCssVarName])

  if (!conflict) return null

  const isDetached = !!conflict.isDetached

  const handleOverride = () => {
    let resolvedValue = ''
    if (conflict.originalDtcgRef && uikit) {
      const globalPath = conflict.originalDtcgRef.slice(1, -1).split('.')
      let node: any = uikit
      for (const seg of globalPath) {
        if (node && typeof node === 'object') {
          node = node[seg]
        } else {
          node = undefined
          break
        }
      }
      if (node && typeof node === 'object') {
        let rawVal = node.$value ?? ''
        if (rawVal && typeof rawVal === 'object') {
          resolvedValue = `${(rawVal as any).value}${(rawVal as any).unit || ''}`
        } else {
          resolvedValue = rawVal
        }
      }
    }

    if (!resolvedValue) {
      resolvedValue = conflict.newValue || (conflict.globalCssVarName ? document.documentElement.style.getPropertyValue(conflict.globalCssVarName).trim() || `var(${conflict.globalCssVarName})` : '')
    }
    
    const conflictWithResolved = { ...conflict, newValue: resolvedValue }
    
    resolveGlobalRefConflict('override', conflictWithResolved, rememberChoice)
    setRememberChoice(false)
    setHasChanged(false)
    onClose()
  }

  const getValueFromUikit = (uikitJson: any, pathStr: string) => {
    if (!uikitJson || !pathStr) return null
    const path = pathStr.split('.')
    let node: any = uikitJson
    for (const seg of path) {
      if (node && typeof node === 'object') {
        node = node[seg]
      } else {
        node = undefined
        break
      }
    }
    if (node && typeof node === 'object' && node.$value !== undefined) {
      return node.$value
    }
    return node
  }

  const performReset = (rawDtcgValue: any) => {
    if (!conflict.globalCssVarName) return
    
    let restoreValue = rawDtcgValue
    if (typeof restoreValue === 'string' && restoreValue.startsWith('{') && restoreValue.endsWith('}')) {
      restoreValue = `var(--recursica_${restoreValue.slice(1, -1).replace(/\./g, '_')})`
    } else if (typeof restoreValue === 'object' && restoreValue !== null && 'value' in restoreValue) {
      restoreValue = `${restoreValue.value}${restoreValue.unit || ''}`
    }
    
    updateCssVar(conflict.globalCssVarName, restoreValue)
    setHasChanged(false)
    window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
      detail: { cssVars: [conflict.globalCssVarName] }
    }))
  }

  const handleResetToDefault = () => {
    const store = getVarsStore()
    const pristine = store.getPristineUikit()
    const val = getValueFromUikit(pristine, conflict.globalRefPath || '')
    if (val !== null && val !== undefined) {
      performReset(val)
    }
    setShowResetConfirmation(false)
  }

  const handleResetToImported = () => {
    const store = getVarsStore()
    const imported = store.getImportedUikit()
    const val = getValueFromUikit(imported, conflict.globalRefPath || '')
    if (val !== null && val !== undefined) {
      performReset(val)
    }
    setShowResetConfirmation(false)
  }

  const handleReset = () => {
    const store = getVarsStore()
    const hasImported = store.hasUserImportedFiles()
    
    if (hasImported) {
      setShowResetConfirmation(true)
    } else {
      // Revert directly to pristine/default JSON value
      const pristine = store.getPristineUikit()
      const val = getValueFromUikit(pristine, conflict.globalRefPath || '')
      if (val !== null && val !== undefined) {
        performReset(val)
      }
    }
  }

  const handleReattach = () => {
    resolveGlobalRefConflict('cancel', conflict, false)
    setRememberChoice(false)
    setHasChanged(false)
    onClose()
  }

  const handleClose = () => {
    // 1. Immediately close the modal in UI to start transition
    onClose()

    // 2. Defer heavy recomputation so closing is smooth and instant
    setTimeout(() => {
      if (isDetached) return

      if (hasChanged) {
        const latestValue = document.documentElement.style.getPropertyValue(conflict.globalCssVarName).trim()
        const conflictWithLatest = { ...conflict, newValue: latestValue }
        resolveGlobalRefConflict('update-global', conflictWithLatest, false)
      } else {
        // Only resolve/cancel if the DOM value was actually modified by a toolbar preview
        const root = document.documentElement
        const baseVar = conflict.cssVarName.replace(/^--recursica_ui-kit_(?:themes_(?:light|dark)_)?/, '')
        const nonThemedVar = `--recursica_ui-kit_${baseVar}`
        const currentDomValue = root.style.getPropertyValue(nonThemedVar).trim()
        
        if (currentDomValue && currentDomValue !== conflict.previousValue) {
          resolveGlobalRefConflict('cancel', conflict, false)
        }
      }
      
      setRememberChoice(false)
      setHasChanged(false)
    }, 50)
  }

  const bodyStyle: React.CSSProperties = {
    margin: 0,
    fontSize: 'var(--recursica_brand_typography_body-font-size)',
    fontWeight: 'var(--recursica_brand_typography_body-font-weight)',
    fontFamily: 'var(--recursica_brand_typography_body-font-family)',
    letterSpacing: 'var(--recursica_brand_typography_body-font-letter-spacing)',
    lineHeight: 'var(--recursica_brand_typography_body-line-height)',
    color: `var(${layerElements}_text-color)`,
    opacity: `var(${layerElements}_text-high-emphasis)`,
  }

  const renderInlineControl = () => {
    if (!conflict.globalCssVarName) return null
    const lowerVar = conflict.globalCssVarName.toLowerCase()
    
    const getSimpleLabel = () => {
      if (lowerVar.includes('border-size') || lowerVar.includes('border-width')) return 'Size'
      if (lowerVar.includes('radius')) return 'Radius'
      if (lowerVar.includes('color')) return 'Color'
      if (conflict.globalRefLabel) {
        const parts = conflict.globalRefLabel.split(' / ')
        return parts[parts.length - 1]
      }
      return 'Value'
    }

    const simpleLabel = getSimpleLabel()
    
    if (lowerVar.includes('color')) {
      return (
        <PaletteColorControl
          targetCssVar={conflict.globalCssVarName}
          label={simpleLabel}
        />
      )
    }
    
    if (lowerVar.includes('radius')) {
      return (
        <BrandBorderRadiusSlider
          targetCssVar={conflict.globalCssVarName}
          label={simpleLabel}
        />
      )
    }

    if (lowerVar.includes('border-size') || lowerVar.includes('border-width')) {
      return (
        <BorderSizeSliderInline
          targetCssVar={conflict.globalCssVarName}
          label={simpleLabel}
        />
      )
    }

    if (lowerVar.includes('dimension') || lowerVar.includes('size') || lowerVar.includes('padding') || lowerVar.includes('margin') || lowerVar.includes('gap')) {
      const isPixelValue = 
        (typeof initialGlobalDtcgValue === 'string' && initialGlobalDtcgValue.endsWith('px')) ||
        (typeof initialGlobalDtcgValue === 'object' && initialGlobalDtcgValue !== null && initialGlobalDtcgValue.unit === 'px')

      if (isPixelValue) {
        return (
          <PixelValueSliderInline
            targetCssVar={conflict.globalCssVarName}
            label={simpleLabel}
            minPixelValue={0}
            maxPixelValue={40}
          />
        )
      }

      const dimensionCategory = lowerVar.includes('icon') ? 'icons' : 
                                lowerVar.includes('text') || lowerVar.includes('font') ? 'text-size' : 'general'
      return (
        <BrandDimensionSliderInline
          targetCssVar={conflict.globalCssVarName}
          label={simpleLabel}
          dimensionCategory={dimensionCategory as any}
        />
      )
    }

    return (
      <p style={bodyStyle}>
        Inline editing is not available for this type of global token. Please modify it from the Theme Settings.
      </p>
    )
  }

  if (isDetached) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Override active"
        layer="layer-1"
        showFooter={true}
        primaryActionLabel="Reattach to global variable"
        onPrimaryAction={handleReattach}
        showSecondaryButton={true}
        secondaryActionLabel="Cancel"
        onSecondaryAction={handleClose}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={bodyStyle}>
            This property is currently overridden and detached from the global variable{' '}
            <strong style={{ fontFamily: 'inherit', fontWeight: 600 }}>{conflict.globalRefLabel}</strong>.
          </p>
          <p style={bodyStyle}>
            Would you like to reattach it so that it inherits changes from the global theme variable again?
          </p>
        </div>
      </Modal>
    )
  }

  return (
    <>
      <Panel
        isOpen={isOpen}
        onClose={handleClose}
        title="Global variable"
        position="right"
        overlay={true}
        width="400px"
        layer="layer-1"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="outline" onClick={handleOverride}>
              Detach and override value
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <p style={bodyStyle}>
            This property value is referencing a global variable. Making changes will affect all components that use the same global variable <strong style={{ fontFamily: 'inherit', fontWeight: 600 }}>{conflict.globalRefLabel}</strong>.
          </p>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <div style={{ width: '100%' }}>
              {renderInlineControl()}
            </div>
            
            <Button
              variant="outline"
              size="small"
              layer="layer-1"
              onClick={handleReset}
              icon={(() => {
                const UndoIcon = iconNameToReactComponent('arrow-uturn-left')
                return UndoIcon ? <UndoIcon style={{ width: 14, height: 14 }} /> : undefined
              })()}
            >
              Reset
            </Button>
          </div>
        </div>
      </Panel>

      <Modal
        isOpen={showResetConfirmation}
        onClose={() => setShowResetConfirmation(false)}
        title="Reset global variable"
        layer="layer-2"
        showFooter={false}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <p style={bodyStyle}>
            Would you like to revert the global variable <strong style={{ fontFamily: 'inherit', fontWeight: 600 }}>{conflict.globalRefLabel}</strong> to the original default JSON value or the last imported JSON value?
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button variant="outline" onClick={() => setShowResetConfirmation(false)}>
              Cancel
            </Button>
            <Button variant="outline" onClick={handleResetToImported}>
              Revert to Imported
            </Button>
            <Button variant="solid" onClick={handleResetToDefault}>
              Revert to Default
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}


