import { useMemo, useState, useEffect } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { useThemeMode } from '../theme/ThemeModeContext'
import { useVars } from '../vars/VarsContext'
import { getComponentSections } from './componentSections'
import { ComponentToolbar } from '../toolbar'
import ButtonPreview from '../components/ButtonPreview'
import AvatarPreview from '../components/AvatarPreview'
import ToastPreview from '../components/ToastPreview'
import BadgePreview from '../components/BadgePreview'
import ChipPreview from '../components/ChipPreview'
import LabelPreview from '../components/LabelPreview'
import BreadcrumbPreview from '../components/BreadcrumbPreview'
import MenuItemPreview from '../components/MenuItemPreview'
import MenuPreview from '../components/MenuPreview'
import SliderPreview from '../components/SliderPreview'
import { slugToComponentName } from './componentUrlUtils'
import { iconNameToReactComponent } from '../components/iconUtils'
import { useDebugMode } from './PreviewPage'
import ComponentDebugTable from './ComponentDebugTable'
import { parseComponentStructure } from '../toolbar/utils/componentToolbarUtils'
import { extractBraceContent, parseTokenReference } from '../../core/utils/tokenReferenceParser'

export default function ComponentDetailPage() {
  const { componentName: componentSlug } = useParams<{ componentName: string }>()
  const location = useLocation()
  const { mode } = useThemeMode()
  const { theme } = useVars()
  const { debugMode } = useDebugMode()

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

  // Get component structure to determine initial variants
  const componentStructure = useMemo(() => {
    if (!componentName) return null
    return parseComponentStructure(componentName)
  }, [componentName])

  // Initialize variants to first option for each variant prop
  const getInitialVariants = useMemo(() => {
    const initial: Record<string, string> = {}
    if (componentStructure) {
      componentStructure.variants.forEach(variant => {
        if (variant.variants.length > 0) {
          initial[variant.propName] = variant.variants[0]
        }
      })
    }
    return initial
  }, [componentStructure])

  // Toolbar state - alternative layers removed
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(getInitialVariants)
  const [selectedLayer, setSelectedLayer] = useState<string>('layer-0')
  const [componentElevation, setComponentElevation] = useState<string | undefined>(undefined)
  const [openPropControl, setOpenPropControl] = useState<Set<string>>(new Set())

  // Reset variants to first option when component changes
  useEffect(() => {
    setSelectedVariants(getInitialVariants)
    setOpenPropControl(new Set())
  }, [componentName, location.pathname, getInitialVariants])

  // Get layer label for display
  const layerLabel = useMemo(() => {
    return selectedLayer.replace('layer-', 'Layer ').replace(/\b\w/g, l => l.toUpperCase())
  }, [selectedLayer])

  // Get size variant label
  const sizeLabel = useMemo(() => {
    const size = selectedVariants.size || 'default'
    return size.charAt(0).toUpperCase() + size.slice(1)
  }, [selectedVariants.size])

  // Build caption text with variant and layer info
  // Only show variants that are actually selectable (have more than one option)
  const captionText = useMemo(() => {
    const parts: string[] = []
    
    if (componentStructure) {
      // Only show variants that have more than one option (are selectable)
      componentStructure.variants.forEach(variant => {
        if (variant.variants.length > 1) {
          const variantValue = selectedVariants[variant.propName] || variant.variants[0]
          
          // Format variant label based on prop name and value
          let variantLabel: string
          if (variant.propName === 'layout' && variantValue === 'side-by-side') {
            variantLabel = 'Side By Side'
          } else {
            // Capitalize first letter
            variantLabel = variantValue.charAt(0).toUpperCase() + variantValue.slice(1)
          }
          
          parts.push(variantLabel)
        }
      })
    }
    
    // Add layer (e.g., "Layer 0")
    const layerNum = selectedLayer.replace('layer-', '')
    parts.push(`Layer ${layerNum}`)
    
    return parts.join(' / ')
  }, [selectedVariants, selectedLayer, componentStructure])

  const layer0Base = `--recursica-brand-themes-${mode}-layer-layer-0-property`
  const layer1Base = `--recursica-brand-themes-${mode}-layer-layer-1-property`

  // Get the layer number for building CSS variable paths
  const layerNum = selectedLayer.replace('layer-', '')
  const baseLayerBase = `--recursica-brand-themes-${mode}-layer-layer-${layerNum}-property`

  // Get elevation level from layer property (if it exists)
  // Elevation is stored as a reference like {brand.themes.light.elevations.elevation-1}
  // We need to extract the elevation number and build the box-shadow CSS
  const elevationBoxShadow = useMemo(() => {
    if (!component) return undefined
    let elevationLevel: string | null = null
    
    try {
      const root: any = (theme as any)?.brand ? (theme as any).brand : theme
      const themes = root?.themes || root
      
      // Check base layer elevation
      // Layer 0 typically doesn't have elevation, layers 1-3 do
      if (layerNum === '0') {
        return undefined
      }
      
      elevationLevel = layerNum
      const layerSpec: any = themes?.[mode]?.layers?.[`layer-${layerNum}`] || themes?.[mode]?.layer?.[`layer-${layerNum}`] || root?.[mode]?.layers?.[`layer-${layerNum}`] || root?.[mode]?.layer?.[`layer-${layerNum}`] || {}
      const v: any = layerSpec?.properties?.elevation?.$value
      if (typeof v === 'string') {
        // Use centralized parser to extract elevation name
        const braceContent = extractBraceContent(v)
        if (braceContent !== null) {
          const parsed = parseTokenReference(v, { currentMode: mode, theme })
          if (parsed && parsed.type === 'brand') {
            const pathStr = parsed.path.join('.')
            const m = /elevations?\.(elevation-(\d+))$/i.exec(pathStr)
            if (m) elevationLevel = m[2]
          }
        }
      }
    } catch {}
    
    // If no elevation found, return undefined
    if (elevationLevel === null) {
      return undefined
    }
    
    // Build elevation box-shadow from elevation CSS variables
    // Format: x-axis y-axis blur spread shadow-color
    return `var(--recursica-brand-themes-${mode}-elevations-elevation-${elevationLevel}-x-axis, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-${elevationLevel}-y-axis, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-${elevationLevel}-blur, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-${elevationLevel}-spread, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-${elevationLevel}-shadow-color, rgba(0, 0, 0, 0))`
  }, [mode, layerNum, theme, component])

  if (!component) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: debugMode ? 'auto' : '100%',
        minHeight: debugMode ? undefined : 0,
      }} />
    )
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: debugMode ? 'auto' : '100%',
      minHeight: debugMode ? undefined : 0,
    }}>
      {/* Header Section */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: 'var(--recursica-brand-dimensions-general-xl)',
        borderBottom: `1px solid var(${layer1Base}-border-color)`,
        flexShrink: 0,
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
            gap: 'var(--recursica-brand-dimensions-general-sm)',
            padding: 'var(--recursica-brand-dimensions-general-sm) var(--recursica-brand-dimensions-general-md)',
            borderRadius: '999px',
            border: `1px solid var(--recursica-brand-themes-${mode}-palettes-core-interactive)`,
            color: `var(--recursica-brand-themes-${mode}-palettes-core-interactive)`,
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
          {(() => {
            const FileTextIcon = iconNameToReactComponent('document-text')
            return FileTextIcon ? <FileTextIcon style={{ width: 16, height: 16 }} /> : null
          })()}
          Read docs
        </a>
      </div>

      {/* Main Content Container - Split Layout */}
      <div style={{
        display: 'flex',
        flex: debugMode ? undefined : 1,
        minHeight: debugMode ? undefined : 0,
        width: '100%',
      }}>
        {/* Preview Area - Left Side */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: 'var(--recursica-brand-dimensions-general-xl)',
          minWidth: 0,
          minHeight: debugMode ? undefined : 0,
        }}>
          {/* Preview Section */}
          <div style={{ 
            flex: debugMode ? undefined : 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--recursica-brand-dimensions-general-md)',
            background: `var(${baseLayerBase}-surface)`,
            padding: `var(${baseLayerBase}-padding)`,
            border: layerNum !== '0' 
              ? `var(${baseLayerBase}-border-thickness, 1px) solid var(${baseLayerBase}-border-color)`
              : 'none',
            borderRadius: layerNum !== '0'
              ? `var(${baseLayerBase}-border-radius)`
              : undefined,
            boxShadow: elevationBoxShadow,
            position: 'relative',
            minHeight: debugMode ? '400px' : 0,
          }}>
            {/* Component Preview */}
            <div style={{ flex: debugMode ? undefined : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              {component.name === 'Button' ? (
                <ButtonPreview
                  selectedVariants={selectedVariants}
                  selectedLayer={selectedLayer}
                  componentElevation={componentElevation}
                />
              ) : component.name === 'Avatar' ? (
                <AvatarPreview
                  selectedVariants={selectedVariants}
                  selectedLayer={selectedLayer}
                  componentElevation={componentElevation}
                />
              ) : component.name === 'Toast' ? (
                <ToastPreview
                  selectedVariants={selectedVariants}
                  selectedLayer={selectedLayer}
                  selectedAltLayer={null}
                />
              ) : component.name === 'Badge' ? (
                <BadgePreview
                  selectedVariants={selectedVariants}
                  selectedLayer={selectedLayer}
                  componentElevation={componentElevation}
                />
              ) : component.name === 'Chip' ? (
                <ChipPreview
                  selectedVariants={selectedVariants}
                  selectedLayer={selectedLayer}
                  selectedAltLayer={null}
                  componentElevation={componentElevation}
                />
              ) : component.name === 'Label' ? (
                <LabelPreview
                  selectedVariants={selectedVariants}
                  selectedLayer={selectedLayer}
                  componentElevation={componentElevation}
                />
              ) : component.name === 'Menu' ? (
                <MenuPreview
                  selectedVariants={selectedVariants}
                  selectedLayer={selectedLayer}
                  componentElevation={componentElevation}
                />
              ) : component.name === 'Menu item' ? (
                <MenuItemPreview
                  selectedVariants={selectedVariants}
                  selectedLayer={selectedLayer}
                  componentElevation={componentElevation}
                />
              ) : component.name === 'Breadcrumb' ? (
                <BreadcrumbPreview
                  selectedVariants={selectedVariants}
                  selectedLayer={selectedLayer}
                  componentElevation={componentElevation}
                />
              ) : component.name === 'Slider' ? (
                <SliderPreview
                  selectedVariants={selectedVariants}
                  selectedLayer={selectedLayer}
                  componentElevation={componentElevation}
                />
              ) : (
                <div style={{
                  minHeight: 200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {component.render(new Set([selectedLayer as any]))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Toolbar Panel - Right Side */}
        <div style={{
          width: '320px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          borderLeft: `1px solid var(${layer0Base}-border-color)`,
          minHeight: debugMode ? undefined : 0,
        }}>
          <ComponentToolbar
            componentName={component.name}
            selectedVariants={selectedVariants}
            selectedLayer={selectedLayer}
            onVariantChange={(prop, variant) => {
              setSelectedVariants(prev => ({ ...prev, [prop]: variant }))
            }}
            onLayerChange={setSelectedLayer}
          />
        </div>
      </div>

      {/* Debug Table - Show when debug mode is enabled, below preview and toolbar */}
      {debugMode && component && openPropControl && (
        <div style={{
          padding: 'var(--recursica-brand-dimensions-general-xl)',
          borderTop: `1px solid var(${layer1Base}-border-color)`,
        }}>
          <ComponentDebugTable 
            componentName={component.name}
            openPropControl={openPropControl.size > 0 ? Array.from(openPropControl)[0] : null}
            selectedVariants={selectedVariants}
            selectedLayer={selectedLayer}
          />
        </div>
      )}
    </div>
  )
}
