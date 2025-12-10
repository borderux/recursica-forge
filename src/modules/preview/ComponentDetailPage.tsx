import { useMemo, useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useThemeMode } from '../theme/ThemeModeContext'
import { getComponentSections } from './componentSections'
import ComponentToolbar from '../components/ComponentToolbar'
import ButtonPreview from '../components/ButtonPreview'
import { componentNameToSlug, slugToComponentName } from './componentUrlUtils'
import { DocumentTextIcon } from '@heroicons/react/24/outline'

export default function ComponentDetailPage() {
  const { componentName: componentSlug } = useParams<{ componentName: string }>()
  const { mode } = useThemeMode()

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

  if (!component) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: `var(--recursica-brand-${mode}-layer-layer-0-element-text-low-emphasis)` }}>
        Component not found
      </div>
    )
  }

  const layer0Base = `--recursica-brand-${mode}-layer-layer-0-property`
  const layer1Base = `--recursica-brand-${mode}-layer-layer-1-property`

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

      {/* Main Content Card */}
      <div style={{
        background: `var(${layer0Base}-surface)`,
        border: `1px solid var(${layer1Base}-border-color)`,
        borderRadius: 'var(--recursica-brand-dimensions-border-radius-default)',
        padding: 'var(--recursica-brand-dimensions-spacer-lg)',
        display: 'grid',
        gap: 'var(--recursica-brand-dimensions-spacer-lg)',
      }}>
        {/* Toolbar */}
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

        {/* Preview Section */}
        <div style={{ 
          display: 'grid', 
          gap: 'var(--recursica-brand-dimensions-spacer-md)',
          padding: 'var(--recursica-brand-dimensions-spacer-lg)',
          background: selectedAltLayer 
            ? `var(--recursica-brand-${mode}-layer-layer-alternative-${selectedAltLayer}-property-surface)`
            : `var(--recursica-brand-${mode}-layer-${selectedLayer}-property-surface)`,
          borderRadius: 'var(--recursica-brand-dimensions-border-radius-default)',
        }}>
          {/* Preview Labels */}
          <div style={{
            display: 'flex',
            gap: 'var(--recursica-brand-dimensions-spacer-lg)',
            alignItems: 'center',
            fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
            color: selectedAltLayer
              ? `var(--recursica-brand-${mode}-layer-layer-alternative-${selectedAltLayer}-property-element-text-color)`
              : `var(--recursica-brand-${mode}-layer-${selectedLayer}-property-element-text-color)`,
            opacity: selectedAltLayer
              ? `var(--recursica-brand-${mode}-layer-layer-alternative-${selectedAltLayer}-property-element-text-low-emphasis)`
              : `var(--recursica-brand-${mode}-layer-${selectedLayer}-property-element-text-low-emphasis)`,
          }}>
            <span>{layerLabel} - {selectedAltLayer ? 'Alternative' : 'Standard'}</span>
            <span>Size - {sizeLabel}</span>
          </div>

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
      </div>
    </div>
  )
}
