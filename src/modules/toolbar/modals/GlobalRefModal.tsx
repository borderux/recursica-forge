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

export interface GlobalRefModalProps {
  isOpen: boolean
  onClose: () => void
  conflict: GlobalRefConflict | null
}

export function GlobalRefModal({ isOpen, onClose, conflict }: GlobalRefModalProps) {
  const [rememberChoice, setRememberChoice] = useState(false)
  const [hasChanged, setHasChanged] = useState(false)
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

  const handleReset = () => {
    if (initialGlobalDtcgValue === null || !conflict.globalCssVarName) return
    
    let restoreValue = initialGlobalDtcgValue
    if (typeof restoreValue === 'string' && restoreValue.startsWith('{') && restoreValue.endsWith('}')) {
      restoreValue = `var(--recursica_${restoreValue.slice(1, -1).replace(/\./g, '_')})`
    } else if (typeof restoreValue === 'object' && restoreValue !== null && 'value' in restoreValue) {
      restoreValue = `${restoreValue.value}${restoreValue.unit || ''}`
    }
    
    updateCssVar(conflict.globalCssVarName, restoreValue)
    setHasChanged(false)
  }

  const handleReattach = () => {
    resolveGlobalRefConflict('cancel', conflict, false)
    setRememberChoice(false)
    setHasChanged(false)
    onClose()
  }

  const handleClose = () => {
    if (isDetached) {
      onClose()
      return
    }

    if (hasChanged) {
      const latestValue = document.documentElement.style.getPropertyValue(conflict.globalCssVarName).trim()
      const conflictWithLatest = { ...conflict, newValue: latestValue }
      resolveGlobalRefConflict('update-global', conflictWithLatest, false)
    } else {
      resolveGlobalRefConflict('cancel', conflict, false)
    }
    
    setRememberChoice(false)
    setHasChanged(false)
    onClose()
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
    
    if (lowerVar.includes('color')) {
      return (
        <PaletteColorControl
          targetCssVar={conflict.globalCssVarName}
          label={conflict.globalRefLabel}
        />
      )
    }
    
    if (lowerVar.includes('radius')) {
      return (
        <BrandBorderRadiusSlider
          targetCssVar={conflict.globalCssVarName}
          label={conflict.globalRefLabel}
        />
      )
    }

    if (lowerVar.includes('dimension') || lowerVar.includes('size') || lowerVar.includes('padding') || lowerVar.includes('margin') || lowerVar.includes('gap')) {
      const isPixelValue = 
        (typeof initialGlobalDtcgValue === 'string' && initialGlobalDtcgValue.endsWith('px')) ||
        (typeof initialGlobalDtcgValue === 'object' && initialGlobalDtcgValue !== null && initialGlobalDtcgValue.unit === 'px')

      if (isPixelValue || lowerVar.includes('border-size')) {
        return (
          <PixelValueSliderInline
            targetCssVar={conflict.globalCssVarName}
            label={conflict.globalRefLabel}
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
          label={conflict.globalRefLabel}
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
            <strong>{conflict.globalRefLabel}</strong>.
          </p>
          <p style={bodyStyle}>
            Would you like to reattach it so that it inherits changes from the global theme variable again?
          </p>
        </div>
      </Modal>
    )
  }

  return (
    <Panel
      isOpen={isOpen}
      onClose={handleClose}
      title="Global variable"
      position="right"
      overlay={true}
      width="400px"
      layer="layer-1"
      footer={
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px', width: '100%' }}>
          <Button variant="outline" onClick={handleOverride}>
            Detach and override
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <p style={bodyStyle}>
          This property value is referencing a global variable. Making changes will affect all components that use this same global variable.
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
  )
}


