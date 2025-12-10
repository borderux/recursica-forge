import { useMemo, useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useThemeMode } from '../theme/ThemeModeContext'
import { useVars } from '../vars/VarsContext'
import { getComponentSections } from './componentSections'
import ComponentToolbar from '../components/ComponentToolbar'
import ButtonPreview from '../components/ButtonPreview'
import { componentNameToSlug, slugToComponentName } from './componentUrlUtils'
import { DocumentTextIcon } from '@heroicons/react/24/outline'

export default function ComponentDetailPage() {
  const { componentName: componentSlug } = useParams<{ componentName: string }>()
  const { mode } = useThemeMode()
  const { theme } = useVars()

  // Convert slug to component name
  const componentName = useMemo(() => {
    if (!componentSlug) return null
    return slugToComponentName(decodeURIComponent(componentSlug))
  }, [componentSlug])

  // Get component sections
  const sections = useMemo(() => getComponentSections(mode), [mode])
  
  // Find the component by name
  const component = useMemo(() => {
    if (!componentName) return null
    return sections.find(s => s.name === componentName)
  }, [componentName, sections])

  // Toolbar state
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({
    color: 'solid',
    size: 'default',
  })
  const [selectedLayer, setSelectedLayer] = useState<string>('layer-0')
  const [selectedAltLayer, setSelectedAltLayer] = useState<string | null>(null)

  // Get layer label for display
  const layerLabel = useMemo(() => {
    if (selectedAltLayer) {
      return selectedAltLayer
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    }
    return selectedLayer.replace('layer-', 'Layer ').replace(/\b\w/g, l => l.toUpperCase())
  }, [selectedLayer, selectedAltLayer])

  // Get size variant label
  const sizeLabel = useMemo(() => {
    const size = selectedVariants.size || 'default'
    return size.charAt(0).toUpperCase() + size.slice(1)
  }, [selectedVariants.size])

  // Build caption text with variant and layer info
  const captionText = useMemo(() => {
    const parts: string[] = []
    
    // Add color variant (e.g., "Solid")
    const colorVariant = selectedVariants.color || 'solid'
    const colorVariantLabel = colorVariant.charAt(0).toUpperCase() + colorVariant.slice(1)
    parts.push(colorVariantLabel)
    
    // Add size variant (e.g., "Default")
    const sizeVariant = selectedVariants.size || 'default'
    const sizeVariantLabel = sizeVariant.charAt(0).toUpperCase() + sizeVariant.slice(1)
    parts.push(sizeVariantLabel)
    
    // Add layer (e.g., "Layer 0")
    const layerNum = selectedLayer.replace('layer-', '')
    parts.push(`Layer ${layerNum}`)
    
    // Add alt layer if present
    if (selectedAltLayer) {
      const altLayerLabel = selectedAltLayer
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      parts.push(altLayerLabel)
    }
    
    return parts.join(' / ')
  }, [selectedVariants, selectedLayer, selectedAltLayer])

  if (!component) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: `var(--recursica-brand-${mode}-layer-layer-0-element-text-low-emphasis)` }}>
        Component not found
      </div>
    )
  }

  const layer0Base = `--recursica-brand-${mode}-layer-layer-0-property`
  const layer1Base = `--recursica-brand-${mode}-layer-layer-1-property`

  // Get the layer number for building CSS variable paths
  const layerNum = selectedLayer.replace('layer-', '')
  const baseLayerBase = `--recursica-brand-${mode}-layer-layer-${layerNum}-property`
  const altLayerBase = selectedAltLayer
    ? `--recursica-brand-${mode}-layer-layer-alternative-${selectedAltLayer}-property`
    : null

  // Get elevation level from layer property (if it exists)
  // Elevation is stored as a reference like {brand.themes.light.elevations.elevation-1}
  // We need to extract the elevation number and build the box-shadow CSS
  // For alt layers, use base layer elevation (alt layers typically only override surface/colors)
  const elevationBoxShadow = useMemo(() => {
    // Layer 0 typically doesn't have elevation, layers 1-3 do
    if (layerNum === '0') {
      return undefined
    }
    
    // Try to read the elevation value from the base layer property in the theme
    let elevationLevel = layerNum
    try {
      const root: any = (theme as any)?.brand ? (theme as any).brand : theme
      const themes = root?.themes || root
      const layerSpec: any = themes?.[mode]?.layers?.[`layer-${layerNum}`] || themes?.[mode]?.layer?.[`layer-${layerNum}`] || root?.[mode]?.layers?.[`layer-${layerNum}`] || root?.[mode]?.layer?.[`layer-${layerNum}`] || {}
      const v: any = layerSpec?.property?.elevation?.$value
      if (typeof v === 'string') {
        // Match both old format (brand.light.elevations.elevation-X) and new format (brand.themes.light.elevations.elevation-X)
        const m = v.match(/elevations\.(elevation-(\d+))/i)
        if (m) elevationLevel = m[2]
      }
    } catch {}
    
    // Build elevation box-shadow from elevation CSS variables
    // Format: x-axis y-axis blur spread shadow-color
    // Use base layer elevation even for alt layers (alt layers don't typically override elevation)
    return `var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-x-axis, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-y-axis, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-blur, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-spread, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-shadow-color, rgba(0, 0, 0, 0))`
  }, [mode, layerNum, theme])

  return (
    <div style={{ padding: 'var(--recursica-brand-dimensions-spacer-xl)' }}>
      {/* Header Section */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 'var(--recursica-brand-dimensions-spacer-lg)',
      }}>
        <h1 style={{ 
          margin: 0,
          fontFamily: 'var(--recursica-brand-typography-h1-font-family)',
          fontSize: 'var(--recursica-brand-typography-h1-font-size)',
          fontWeight: 'var(--recursica-brand-typography-h1-font-weight)',
          letterSpacing: 'var(--recursica-brand-typography-h1-font-letter-spacing)',
          lineHeight: 'var(--recursica-brand-typography-h1-line-height)',
          color: `var(${layer0Base}-element-text-color)`,
        }}>
          {component.name}
        </h1>
        <a
          href={component.url}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--recursica-brand-dimensions-spacer-sm)',
            padding: 'var(--recursica-brand-dimensions-spacer-sm) var(--recursica-brand-dimensions-spacer-md)',
            borderRadius: '999px',
            border: `1px solid var(--recursica-brand-${mode}-palettes-core-interactive)`,
            color: `var(--recursica-brand-${mode}-palettes-core-interactive)`,
            textDecoration: 'none',
            fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.8'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1'
          }}
        >
          <DocumentTextIcon style={{ width: 16, height: 16 }} />
          Read docs
        </a>
      </div>

      {/* Main Content Container */}
      <div style={{
        border: `1px solid var(${layer1Base}-border-color)`,
        minHeight: '500px',
        padding: 'var(--recursica-brand-dimensions-spacer-lg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--recursica-brand-dimensions-spacer-lg)',
      }}>
        {/* Toolbar - Always at top, max-width hugs content */}
        <div style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
        }}>
          <div style={{
            maxWidth: 'fit-content',
          }}>
            <ComponentToolbar
              componentName={component.name}
              selectedVariants={selectedVariants}
              selectedLayer={selectedLayer}
              selectedAltLayer={selectedAltLayer}
              onVariantChange={(prop, variant) => {
                setSelectedVariants(prev => ({ ...prev, [prop]: variant }))
              }}
              onLayerChange={setSelectedLayer}
              onAltLayerChange={setSelectedAltLayer}
            />
          </div>
        </div>

        {/* Preview Section - Centered both vertically and horizontally */}
        {/* Apply all layer CSS variables: surface, border-color, border-thickness, border-radius, padding, elevation */}
        {/* When alt layer is selected, only override properties defined for alt layer, fallback to base layer */}
        <div style={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--recursica-brand-dimensions-spacer-md)',
          // Apply layer properties with fallback to base layer when alt layer is selected
          background: altLayerBase 
            ? `var(${altLayerBase}-surface, var(${baseLayerBase}-surface))`
            : `var(${baseLayerBase}-surface)`,
          padding: altLayerBase
            ? `var(${altLayerBase}-padding, var(${baseLayerBase}-padding))`
            : `var(${baseLayerBase}-padding)`,
          border: layerNum !== '0' 
            ? (altLayerBase
                ? `var(${altLayerBase}-border-thickness, var(${baseLayerBase}-border-thickness, 1px)) solid var(${altLayerBase}-border-color, var(${baseLayerBase}-border-color))`
                : `var(${baseLayerBase}-border-thickness, 1px) solid var(${baseLayerBase}-border-color)`)
            : 'none',
          borderRadius: layerNum !== '0'
            ? (altLayerBase
                ? `var(${altLayerBase}-border-radius, var(${baseLayerBase}-border-radius))`
                : `var(${baseLayerBase}-border-radius)`)
            : undefined,
          boxShadow: elevationBoxShadow,
          width: '100%',
          position: 'relative',
        }}>
          {/* Component Preview */}
          {component.name === 'Button' ? (
            <ButtonPreview
              selectedVariants={selectedVariants}
              selectedLayer={selectedLayer}
              selectedAltLayer={selectedAltLayer}
            />
          ) : (
            <div style={{
              minHeight: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {component.render(new Set([selectedAltLayer ? `layer-alternative-${selectedAltLayer}` as any : selectedLayer as any]))}
            </div>
          )}
        </div>

        {/* Caption - Bottom center showing variant and layer info */}
        <div style={{
          textAlign: 'center',
          fontFamily: 'var(--recursica-brand-typography-caption-font-family)',
          fontSize: 'var(--recursica-brand-typography-caption-font-size)',
          fontWeight: 'var(--recursica-brand-typography-caption-font-weight)',
          letterSpacing: 'var(--recursica-brand-typography-caption-font-letter-spacing)',
          lineHeight: 'var(--recursica-brand-typography-caption-line-height)',
          color: `var(${layer0Base}-element-text-low-emphasis)`,
        }}>
          {captionText}
        </div>
      </div>
    </div>
  )
}
