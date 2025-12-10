import { useMemo } from 'react'
import { Button } from '../../components/adapters/Button'
import { contrastRatio } from '../theme/contrastUtil'
import { readCssVar, readCssVarResolved } from '../../core/css/readCssVar'
import { useThemeMode } from '../theme/ThemeModeContext'
import { useVars } from '../vars/VarsContext'
import { buildTokenIndex } from '../../core/resolvers/tokens'
import { resolveCssVarToHex } from '../../core/compliance/layerColorStepping'
import { getComponentCssVar } from '../../components/utils/cssVarNames'
import './ButtonPreview.css'

interface ButtonPreviewProps {
  selectedVariants: Record<string, string> // e.g., { color: "solid", size: "default" }
  selectedLayer: string // e.g., "layer-0"
  selectedAltLayer: string | null // e.g., "high-contrast" or null
}

export default function ButtonPreview({
  selectedVariants,
  selectedLayer,
  selectedAltLayer,
}: ButtonPreviewProps) {
  const { mode } = useThemeMode()
  const { tokens } = useVars()

  const colorVariant = selectedVariants.color || 'solid'
  const sizeVariant = selectedVariants.size || 'default'

  // Determine the actual layer to use
  const actualLayer = useMemo(() => {
    if (selectedAltLayer) {
      return `layer-alternative-${selectedAltLayer}` as any
    }
    return selectedLayer as any
  }, [selectedAltLayer, selectedLayer])

  // Get background color for contrast checking
  const bgColor = useMemo(() => {
    if (selectedAltLayer) {
      const surfaceVar = `--recursica-brand-${mode}-layer-layer-alternative-${selectedAltLayer}-property-surface`
      const surfaceValue = readCssVar(surfaceVar)
      if (surfaceValue) {
        const tokenIndex = buildTokenIndex(tokens || {})
        return resolveCssVarToHex(surfaceValue, tokenIndex)
      }
    } else {
      const surfaceVar = `--recursica-brand-${mode}-layer-layer-${selectedLayer.replace('layer-', '')}-property-surface`
      const surfaceValue = readCssVar(surfaceVar)
      if (surfaceValue) {
        const tokenIndex = buildTokenIndex(tokens || {})
        return resolveCssVarToHex(surfaceValue, tokenIndex)
      }
    }
    return null
  }, [selectedAltLayer, selectedLayer, mode, tokens])

  // Check contrast for the selected variant
  const contrastWarning = useMemo(() => {
    if (!selectedAltLayer || !bgColor) return null

    // Get button text color for the selected variant
    const textVar = getComponentCssVar('Button', 'color', `${colorVariant}-text`, selectedLayer)
    const textValue = readCssVar(textVar)
    
    if (!textValue) return null

    const tokenIndex = buildTokenIndex(tokens || {})
    const textHex = resolveCssVarToHex(textValue, tokenIndex)

    if (!textHex) return null

    const ratio = contrastRatio(bgColor, textHex)
    const AA_THRESHOLD = 4.5

    if (ratio < AA_THRESHOLD) {
      return {
        variant: colorVariant,
        ratio: ratio.toFixed(2),
        passes: false,
      }
    }

    return null
  }, [selectedAltLayer, bgColor, colorVariant, selectedLayer, tokens])

  // Icon for buttons
  const iconElement = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"></path>
      <path d="M12 5l7 7-7 7"></path>
    </svg>
  )

  return (
    <div className="button-preview">
      {contrastWarning && (
        <div className="button-preview-warning">
          ⚠️ WCAG AA contrast warning: {contrastWarning.ratio}:1 (requires 4.5:1)
          <br />
          Using {colorVariant} variant on {selectedAltLayer} background is not recommended.
        </div>
      )}
      <div className="button-preview-row">
        {/* Button with text */}
        <Button
          variant={colorVariant as any}
          size={sizeVariant as any}
          layer={actualLayer}
        >
          Button
        </Button>
        
        {/* Button with icon on left */}
        <Button
          variant={colorVariant as any}
          size={sizeVariant as any}
          layer={actualLayer}
          icon={iconElement}
        >
          Button
        </Button>
        
        {/* Icon-only button */}
        <Button
          variant={colorVariant as any}
          size={sizeVariant as any}
          layer={actualLayer}
          icon={iconElement}
        />
        
        {/* Button with icon on right - we'll need to handle this differently */}
        <Button
          variant={colorVariant as any}
          size={sizeVariant as any}
          layer={actualLayer}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--recursica-brand-dimensions-spacer-sm)' }}>
            Button
            {iconElement}
          </span>
        </Button>
        
        {/* Disabled button */}
        <Button
          variant={colorVariant as any}
          size={sizeVariant as any}
          layer={actualLayer}
          disabled
        >
          Button
        </Button>
      </div>
    </div>
  )
}
