import { useMemo } from 'react'
import { Button } from '../../components/adapters/Button'
import { contrastRatio } from '../theme/contrastUtil'
import { readCssVar, readCssVarResolved } from '../../core/css/readCssVar'
import { useThemeMode } from '../theme/ThemeModeContext'
import { useVars } from '../vars/VarsContext'
import { buildTokenIndex } from '../../core/resolvers/tokens'
import { resolveCssVarToHex } from '../../core/compliance/layerColorStepping'
import { getComponentCssVar } from '../../components/utils/cssVarNames'
import type { ComponentLayer } from '../../components/registry/types'
import './ButtonPreview.css'

interface ButtonPreviewProps {
  selectedVariants: Record<string, string> // e.g., { color: "solid", size: "default" }
  selectedLayer: string // e.g., "layer-0"
  componentElevation?: string // e.g., "elevation-0", "elevation-1", etc.
}

export default function ButtonPreview({
  selectedVariants,
  selectedLayer,
  componentElevation,
}: ButtonPreviewProps) {
  const { mode } = useThemeMode()
  const { tokens } = useVars()

  // Use 'style' instead of 'color' to match the new toolbar structure
  const styleVariant = selectedVariants.style || 'solid'
  const sizeVariant = selectedVariants.size || 'default'

  // Use the selected layer
  const actualLayer = selectedLayer as any

  // Get background color for contrast checking
  // For solid buttons, use the button's background color
  // For other variants (outline, text), use the layer surface color
  const bgColor = useMemo(() => {
    if (styleVariant === 'solid') {
      // For solid buttons, use the button's background color
      const buttonBgVar = getComponentCssVar('Button', 'colors', `${styleVariant}-background`, selectedLayer as ComponentLayer)
      const buttonBgValue = readCssVar(buttonBgVar)
      if (buttonBgValue) {
        const tokenIndex = buildTokenIndex(tokens || {})
        return resolveCssVarToHex(buttonBgValue, tokenIndex)
      }
    }
    
    // For non-solid buttons, use the layer surface color
    const surfaceVar = `--recursica-brand-themes-${mode}-layer-layer-${selectedLayer.replace('layer-', '')}-property-surface`
    const surfaceValue = readCssVar(surfaceVar)
    if (surfaceValue) {
      const tokenIndex = buildTokenIndex(tokens || {})
      return resolveCssVarToHex(surfaceValue, tokenIndex)
    }
    return null
  }, [selectedLayer, mode, tokens, styleVariant])

  // Check contrast for the selected variant
  const contrastWarning = useMemo(() => {
    if (!bgColor) return null

    // Get button text color for the selected variant
    const textVar = getComponentCssVar('Button', 'colors', `${styleVariant}-text`, selectedLayer as ComponentLayer)
    const textValue = readCssVar(textVar)
    
    if (!textValue) return null

    const tokenIndex = buildTokenIndex(tokens || {})
    const textHex = resolveCssVarToHex(textValue, tokenIndex)

    if (!textHex) return null

    const ratio = contrastRatio(bgColor, textHex)
    const AA_THRESHOLD = 4.5

    if (ratio < AA_THRESHOLD) {
      return {
        variant: styleVariant,
        ratio: ratio.toFixed(2),
        passes: false,
      }
    }

    return null
  }, [bgColor, styleVariant, selectedLayer, tokens])

  // Get icon size and gap CSS variables for proper sizing
  const sizePrefix = sizeVariant === 'small' ? 'small' : 'default'
  const iconSizeVar = getComponentCssVar('Button', 'size', `${sizePrefix}-icon`, undefined)
  const iconGapVar = getComponentCssVar('Button', 'size', `${sizePrefix}-icon-text-gap`, undefined)
  

  // Icon SVG element
  const iconSvg = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"></path>
      <path d="M12 5l7 7-7 7"></path>
    </svg>
  )

  // Icon element with proper container for left-side icons (used by Button component)
  const iconElement = iconSvg

  // Icon element with proper container for right-side icons
  const rightIconElement = (
    <span style={{
      display: 'inline-flex',
      width: `var(${iconSizeVar})`,
      height: `var(${iconSizeVar})`,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      marginLeft: `var(${iconGapVar})`,
    }}>
      <span style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {iconSvg}
      </span>
    </span>
  )

  return (
    <div className="button-preview">
      {contrastWarning && (
        <div className="button-preview-warning">
          ⚠️ WCAG AA contrast warning: {contrastWarning.ratio}:1 (requires 4.5:1)
          <br />
          Using {styleVariant} variant on {selectedLayer} background may not meet contrast requirements.
        </div>
      )}
      <div className="button-preview-row">
        {/* Button with text */}
        <Button
          variant={styleVariant as any}
          size={sizeVariant as any}
          layer={actualLayer}
          elevation={componentElevation}
        >
          Button
        </Button>
        
        {/* Button with icon on left */}
        <Button
          variant={styleVariant as any}
          size={sizeVariant as any}
          layer={actualLayer}
          elevation={componentElevation}
          icon={iconElement}
        >
          Button
        </Button>
        
        {/* Icon-only button */}
        <Button
          variant={styleVariant as any}
          size={sizeVariant as any}
          layer={actualLayer}
          elevation={componentElevation}
          icon={iconElement}
        />
        
        {/* Button with icon on right */}
        <Button
          variant={styleVariant as any}
          size={sizeVariant as any}
          layer={actualLayer}
          elevation={componentElevation}
          material={{
            endIcon: iconSvg
          }}
        >
          Button
        </Button>
        
        {/* Disabled button */}
        <Button
          variant={styleVariant as any}
          size={sizeVariant as any}
          layer={actualLayer}
          elevation={componentElevation}
          disabled
        >
          Button
        </Button>
      </div>
    </div>
  )
}
