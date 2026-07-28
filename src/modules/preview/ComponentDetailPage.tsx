import { useMemo, useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { useThemeMode } from '../theme/ThemeModeContext'
import { useVars } from '../vars/VarsContext'
import { getComponentSections } from './componentSections'
import { ComponentToolbar } from '../toolbar'
const ButtonPreview = lazy(() => import('../components/ButtonPreview'))
const AccordionPreview = lazy(() => import('../components/AccordionPreview'))
const AccordionItemPreview = lazy(() => import('../components/AccordionItemPreview'))
const CheckboxItemPreview = lazy(() => import('../components/CheckboxItemPreview'))
const CheckboxGroupPreview = lazy(() => import('../components/CheckboxGroupPreview'))
const RadioButtonItemPreview = lazy(() => import('../components/RadioButtonItemPreview'))
const AvatarPreview = lazy(() => import('../components/AvatarPreview'))
const ToastPreview = lazy(() => import('../components/ToastPreview'))
const BadgePreview = lazy(() => import('../components/BadgePreview'))
const ChipPreview = lazy(() => import('../components/ChipPreview'))
const LabelPreview = lazy(() => import('../components/LabelPreview'))
const LinkPreview = lazy(() => import('../components/LinkPreview'))
const BreadcrumbPreview = lazy(() => import('../components/BreadcrumbPreview'))
const MenuItemPreview = lazy(() => import('../components/MenuItemPreview'))
const MenuPreview = lazy(() => import('../components/MenuPreview'))
const SliderPreview = lazy(() => import('../components/SliderPreview'))
const SegmentedControlPreview = lazy(() => import('../components/SegmentedControlPreview'))
const SegmentedControlItemPreview = lazy(() => import('../components/SegmentedControlItemPreview'))
const TabsPreview = lazy(() => import('../components/TabsPreview'))
const TabsItemPreview = lazy(() => import('../components/TabsItemPreview'))
const AssistiveElementPreview = lazy(() => import('../components/AssistiveElementPreview'))
const TextFieldPreview = lazy(() => import('../components/TextFieldPreview'))
const TextareaPreview = lazy(() => import('../components/TextareaPreview'))
const NumberInputPreview = lazy(() => import('../components/NumberInputPreview'))
const ModalPreview = lazy(() => import('../components/ModalPreview'))
const DropdownPreview = lazy(() => import('../components/DropdownPreview'))
const AutocompletePreview = lazy(() => import('../components/AutocompletePreview'))
const ReadOnlyFieldPreview = lazy(() => import('../components/ReadOnlyFieldPreview'))
const FileInputPreview = lazy(() => import('../components/FileInputPreview'))
const FileUploadPreview = lazy(() => import('../components/FileUploadPreview'))
const PanelPreview = lazy(() => import('../components/PanelPreview'))
const HoverCardPopoverPreview = lazy(() => import('../components/HoverCardPopoverPreview'))
const CardPreview = lazy(() => import('../components/CardPreview'))
const PaginationPreview = lazy(() => import('../components/PaginationPreview'))
const TimePickerPreview = lazy(() => import('../components/TimePickerPreview'))
const DatePickerPreview = lazy(() => import('../components/DatePickerPreview'))
const LoaderPreview = lazy(() => import('../components/LoaderPreview'))
const StepperPreview = lazy(() => import('../components/StepperPreview'))
const TimelinePreview = lazy(() => import('../components/TimelinePreview'))
const TimelineBulletPreview = lazy(() => import('../components/TimelineBulletPreview'))
const TransferListPreview = lazy(() => import('../components/TransferListPreview'))
const TablePreview = lazy(() => import('../components/TablePreview'))
import { slugToComponentName } from './componentUrlUtils'
import { iconNameToReactComponent } from '../components/iconUtils'
import { getTypographyStyle } from '../components/typographyStyles'
import { Button } from '../../components/adapters/Button'
import { useDebugMode } from './PreviewPage'
import ComponentDebugTable from './ComponentDebugTable'
import { parseComponentStructure, isDisplayToggleVariant } from '../toolbar/utils/componentToolbarUtils'
import VariantSwitch from '../toolbar/menu/dropdown/VariantSwitch'
import { extractBraceContent, parseTokenReference } from '../../core/utils/tokenReferenceParser'
import type { ComponentName } from '../../components/registry/types'
import { layerProperty, layerText } from '../../core/css/cssVarBuilder'

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
        // The interaction-state axis is driven by the toolbar's state tabs (which default to
        // "base"), not seeded here — seeding it would surface a stale state (e.g. error) in
        // previews that read selectedVariants.states while the Base tab is active.
        if (variant.propName === 'states') return
        if (variant.variants.length > 0) {
          initial[variant.propName] = variant.variants[0]
        }
      })
    }
    return initial
  }, [componentStructure])

  // Bridges the toolbar's active interaction-state tab to `selectedVariants.states`, which is what
  // the state-aware previews (date picker, text field, …) read. "base" maps to "default" (no state
  // override). Stable identity so the toolbar's notify effect doesn't refire every render.
  const handleActiveStateChange = useCallback((state: string) => {
    setActiveState(state)
    // Component control-states (error/disabled) are forced into the preview. Hover & focus are now
    // global states (Theme › States) applied on real interaction, so they never appear as tabs here.
    const forced = (state === 'error' || state === 'disabled' || state === 'visited') ? state : 'default'
    setSelectedVariants(prev => ({ ...prev, states: forced }))
  }, [])

  // Toolbar state - alternative layers removed
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(getInitialVariants)
  const [selectedLayer, setSelectedLayer] = useState<string>('layer-0')
  const [activeState, setActiveState] = useState<string>('base')
  const [componentElevation, setComponentElevation] = useState<string | undefined>(undefined)
  const [openPropControl, setOpenPropControl] = useState<Set<string>>(new Set())

  // Reset variants to first option when component changes, then apply URL query overrides
  useEffect(() => {
    const initial = { ...getInitialVariants }
    let layer = 'layer-0'

    // Apply query param overrides for deep linking (e.g., ?layer=layer-2&states=error&style=solid)
    const params = new URLSearchParams(location.search)
    const layerParam = params.get('layer')
    if (layerParam && /^layer-\d+$/.test(layerParam)) {
      layer = layerParam
    }

    // Apply variant overrides from query params
    if (componentStructure) {
      for (const variant of componentStructure.variants) {
        const paramValue = params.get(variant.propName)
        if (paramValue && variant.variants.includes(paramValue)) {
          initial[variant.propName] = paramValue
        }
      }
    }

    setSelectedVariants(initial)
    setSelectedLayer(layer)
    setOpenPropControl(new Set())
  }, [componentName, location.pathname, location.search, getInitialVariants, componentStructure])

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

  // Heading shown above the preview: every selected variant value plus the active interaction
  // state, joined by a middot (e.g. "Stacked · Base"). The interaction state is only appended
  // when the component actually has states beyond "base" (disabled/error) — for base-only
  // components, a trailing "· Base" is noise, so it's omitted (leaving just the variant, or the
  // component name when there are no variants either).
  const variantHeading = useMemo(() => {
    const parts: string[] = []
    if (componentStructure) {
      componentStructure.variants.forEach(variant => {
        if (variant.propName === 'states') return // interaction state is appended separately
        if (isDisplayToggleVariant(variant.propName)) return // shown as a switch in the header, not the title
        if (variant.variants.length > 1) {
          const value = selectedVariants[variant.propName] || variant.variants[0]
          parts.push(
            variant.propName === 'layout' && value === 'side-by-side'
              ? 'Side By Side'
              : value.charAt(0).toUpperCase() + value.slice(1)
          )
        }
      })
    }
    const statesVariant = componentStructure?.variants.find(v => v.propName === 'states')
    const hasNonBaseStates = !!statesVariant && statesVariant.variants.some(s => s !== 'base')
    if (hasNonBaseStates) {
      parts.push(activeState.charAt(0).toUpperCase() + activeState.slice(1))
    }
    // When there are no variant/state parts (e.g. a component with no variants), show the active
    // interaction state ("Base") rather than repeating the component name — the name is already the
    // h1 above the preview.
    return parts.length > 0
      ? parts.join(' · ')
      : (activeState.charAt(0).toUpperCase() + activeState.slice(1))
  }, [selectedVariants, componentStructure, activeState, component])

  // Display-toggle variants (e.g. fill-width) render as switches in the preview header, aligned to
  // the right of the title — they control how the demo lays out, not a design-token variant.
  const displayToggleVariants = useMemo(
    () => (componentStructure?.variants || []).filter(
      v => isDisplayToggleVariant(v.propName) && v.variants.length > 1
    ),
    [componentStructure]
  )

  // The preview only *forces* error/disabled (states the user can't trigger by interacting). For
  // hover/focus the user must actually hover/focus the preview, so we leave the preview at 'base'
  // while the toolbar tab still edits that state's props.
  const previewState = (activeState === 'error' || activeState === 'disabled') ? activeState : 'base'

  // Get the layer number for building CSS variable paths
  const layerNum = selectedLayer.replace('layer-', '')

  // Get elevation level from layer property (if it exists)
  // Elevation is stored as a reference like {brand.themes.light.elevations.elevation-1}
  // We need to extract the elevation number and build the box-shadow CSS
  const elevationBoxShadow = useMemo(() => {
    if (!component) return undefined
    let elevationLevel: string | null = null

    try {
      const root: any = (theme as any)?.brand ? (theme as any).brand : theme
      const themes = root?.themes || root

      // Read the actual elevation reference for ALL layers (including layer 0)
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
        // Also check for direct elevation name format (e.g., "elevation-2")
        if (elevationLevel === null && /^elevation-\d+$/.test(v.trim())) {
          const match = v.trim().match(/elevation-(\d+)/)
          if (match) elevationLevel = match[1]
        }
      }

      // Fallback to layer number if no elevation reference found
      if (elevationLevel === null) {
        elevationLevel = layerNum
      }
    } catch { }

    // If no elevation found, return undefined
    if (elevationLevel === null) {
      return undefined
    }

    // elevation-0 means no shadow
    if (elevationLevel === '0') {
      return undefined
    }

    // Build elevation box-shadow from elevation CSS variables
    // Uses underscore-delimited format: elevation-{N}_{prop}
    return `var(--recursica_brand_elevations_elevation-${elevationLevel}_x-axis, 0px) var(--recursica_brand_elevations_elevation-${elevationLevel}_y-axis, 0px) var(--recursica_brand_elevations_elevation-${elevationLevel}_blur, 0px) var(--recursica_brand_elevations_elevation-${elevationLevel}_spread, 0px) var(--recursica_brand_elevations_elevation-${elevationLevel}_shadow-color, rgba(0, 0, 0, 0))`
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
      padding: 'var(--recursica_brand_dimensions_general_xl)',
    }}>
      {/* Header Section */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--recursica_brand_dimensions_general_lg)',
        flexShrink: 0,
      }}>
        <h1 style={{
          margin: 0,
          fontFamily: 'var(--recursica_brand_typography_h1-font-family)',
          fontSize: 'var(--recursica_brand_typography_h1-font-size)',
          fontWeight: 'var(--recursica_brand_typography_h1-font-weight)',
          letterSpacing: 'var(--recursica_brand_typography_h1-font-letter-spacing)',
          lineHeight: 'var(--recursica_brand_typography_h1-line-height)',
          color: `var(${layerText(mode, 0, 'color')})`,
        }}>
          {component.name}
        </h1>
        <Button
          variant="outline"
          size="small"
          onClick={() => window.open(component.url, '_blank')}
          icon={(() => {
            const FileTextIcon = iconNameToReactComponent('document-text')
            return FileTextIcon ? <FileTextIcon style={{ width: 16, height: 16 }} /> : null
          })()}
        >
          Read docs
        </Button>
      </div>

      {/* Main Content Container - Wrapped in styled container like tokens sections */}
      <div style={{
        background: `var(${layerProperty(mode, 0, 'surface')})`,
        border: `1px solid var(${layerProperty(mode, 1, 'border-color')})`,
        borderRadius: 'var(--recursica_brand_dimensions_border-radii_xl)',
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
          minWidth: 0,
          // No padding here: the layer surface below already pads the component with the
          // layer's own padding token. Only the heading gets an inset (below) so it isn't
          // flush to the card — this avoids double-padding the preview.
          padding: 0,
          position: 'sticky',
          top: 0,
          alignSelf: component.name.toLowerCase().includes('table') ? 'stretch' : 'flex-start',
          height: component.name.toLowerCase().includes('table') ? '100%' : undefined,
          // Table previews are full-bleed, so clip them to the card's rounded left corners.
          // Other previews stay visible so their popovers/tooltips aren't cut off.
          overflow: component.name.toLowerCase().includes('table') ? 'hidden' : 'visible',
          borderTopLeftRadius: 'var(--recursica_brand_dimensions_border-radii_xl)',
          borderBottomLeftRadius: 'var(--recursica_brand_dimensions_border-radii_xl)',
        }}>
          {/* Variant + layer heading above the preview. Display-toggle switches (e.g. fill container
              width) sit to the right of the title, aligned to the right edge of the preview area.
              Hidden for table components — their previews are full-bleed and the heading is noise. */}
          {!component.name.toLowerCase().includes('table') && (
          <div style={{ padding: 'var(--recursica_brand_dimensions_general_xl) var(--recursica_brand_dimensions_general_xl) 0', marginBottom: 'var(--recursica_brand_dimensions_general_md)', flexShrink: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--recursica_brand_dimensions_general_lg)' }}>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ ...getTypographyStyle('h2'), color: `var(${layerText(mode, 0, 'color')})` }}>
                {variantHeading}
              </h2>
              <h3 style={{ ...getTypographyStyle('h3'), color: `var(${layerText(mode, 0, 'color')})`, opacity: `var(${layerText(mode, 0, 'low-emphasis')})` }}>
                {`Layer ${layerNum}`}
              </h3>
            </div>
            {displayToggleVariants.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--recursica_brand_dimensions_general_sm)', flexShrink: 0, minWidth: '200px' }}>
                {displayToggleVariants.map(variant => (
                  <VariantSwitch
                    key={variant.propName}
                    componentName={component.name}
                    propName={variant.propName}
                    variants={variant.variants}
                    selected={selectedVariants[variant.propName] || variant.variants[0]}
                    onSelect={(variantName) => setSelectedVariants(prev => ({ ...prev, [variant.propName]: variantName }))}
                  />
                ))}
              </div>
            )}
          </div>
          )}

          {/* Preview Section */}
          <div style={{
            flex: debugMode ? undefined : 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            justifyContent: 'space-between',
            gap: 'var(--recursica_brand_dimensions_general_md)',
            background: `var(${layerProperty(mode, layerNum, 'surface')})`,
            padding: component.name.toLowerCase().includes('table') ? 0 : `var(${layerProperty(mode, layerNum, 'padding')})`,
            border: layerNum !== '0'
              ? `var(${layerProperty(mode, layerNum, 'border-size')}, 1px) solid var(${layerProperty(mode, layerNum, 'border-color')})`
              : 'none',
            borderRadius: layerNum !== '0'
              ? `var(${layerProperty(mode, layerNum, 'border-radius')})`
              : undefined,
            boxShadow: elevationBoxShadow,
            position: 'relative',
            minHeight: debugMode ? '400px' : 0,
          }}>
            {/* Component Preview — pinned to the top-left of the preview surface */}
            <div style={{ flex: debugMode ? undefined : 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', width: '100%', minWidth: 0 }}>
              <Suspense fallback={<div />}>
                {component.name === 'Button' ? (
                  <ButtonPreview
                    selectedVariants={selectedVariants}
                    selectedLayer={selectedLayer}
                    componentElevation={componentElevation}
                  />
                ) : component.name === 'Accordion' ? (
                  <AccordionPreview
                    selectedVariants={selectedVariants}
                    selectedLayer={selectedLayer}
                    componentElevation={componentElevation}
                  />
                ) : component.name === 'Accordion item' ? (
                  <AccordionItemPreview
                    selectedVariants={selectedVariants}
                    selectedLayer={selectedLayer}
                    componentElevation={componentElevation}
                  />
                ) : component.name === 'Checkbox group item' ? (
                  <CheckboxItemPreview
                    selectedVariants={selectedVariants}
                    selectedLayer={selectedLayer}
                    activeState={previewState}
                    componentElevation={componentElevation}
                  />
                ) : component.name === 'Checkbox group' ? (
                  <CheckboxGroupPreview
                    selectedVariants={selectedVariants}
                    selectedLayer={selectedLayer}
                    componentElevation={componentElevation}
                  />
                ) : component.name === 'Radio button group item' ? (
                  <RadioButtonItemPreview
                    selectedVariants={selectedVariants}
                    selectedLayer={selectedLayer}
                    activeState={previewState}
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
                    activeState={previewState}
                    componentElevation={componentElevation}
                  />
                ) : component.name === 'Label' ? (
                  <LabelPreview
                    selectedVariants={selectedVariants}
                    selectedLayer={selectedLayer}
                    componentElevation={componentElevation}
                  />
                ) : component.name === 'Link' ? (
                  <LinkPreview
                    selectedVariants={selectedVariants}
                    selectedLayer={selectedLayer}
                    componentElevation={componentElevation}
                  />
                ) : component.name === 'Assistive element' ? (
                  <AssistiveElementPreview
                    selectedVariants={selectedVariants}
                    selectedLayer={selectedLayer}
                    componentElevation={componentElevation}
                  />
                ) : component.name === 'Text field' ? (
                  <TextFieldPreview
                    selectedVariants={selectedVariants}
                    selectedLayer={selectedLayer}
                    componentElevation={componentElevation}
                  />
                ) : component.name === 'Date picker' ? (
                  <DatePickerPreview
                    selectedVariants={selectedVariants}
                    selectedLayer={selectedLayer}
                    componentElevation={componentElevation}
                  />
                ) : component.name === 'Textarea' ? (
                  <TextareaPreview
                    selectedVariants={selectedVariants}
                    selectedLayer={selectedLayer}
                    componentElevation={componentElevation}
                  />
                ) : component.name === 'Number input' ? (
                  <NumberInputPreview
                    selectedVariants={selectedVariants}
                    selectedLayer={selectedLayer}
                    componentElevation={componentElevation}
                  />
                ) : component.name === 'Dropdown' ? (
                  <DropdownPreview
                    selectedVariants={selectedVariants}
                    selectedLayer={selectedLayer}
                    componentElevation={componentElevation}
                  />
                ) : component.name === 'Autocomplete' ? (
                  <AutocompletePreview
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
                ) : component.name === 'Segmented control' ? (
                  <div style={{ width: '100%', minWidth: 0, alignSelf: 'stretch', flex: '1 1 0%' }}>
                    <SegmentedControlPreview
                      selectedVariants={selectedVariants}
                      selectedLayer={selectedLayer}
                      componentElevation={componentElevation}
                    />
                  </div>
                ) : component.name === 'Segmented control item' ? (
                  <div style={{ width: '100%', minWidth: 0, alignSelf: 'stretch', flex: '1 1 0%' }}>
                    <SegmentedControlItemPreview
                      selectedVariants={selectedVariants}
                      selectedLayer={selectedLayer}
                      componentElevation={componentElevation}
                    />
                  </div>
                ) : component.name === 'Tabs' ? (
                  <TabsPreview
                    selectedVariants={selectedVariants}
                    selectedLayer={selectedLayer}
                    componentElevation={componentElevation}
                  />
                ) : component.name === 'Tabs item' ? (
                  <TabsItemPreview
                    selectedVariants={selectedVariants}
                    selectedLayer={selectedLayer}
                    componentElevation={componentElevation}
                  />
                ) : component.name === 'Modal' ? (
                  <ModalPreview
                    selectedVariants={selectedVariants}
                    selectedLayer={selectedLayer}
                    componentElevation={componentElevation}
                  />
                ) : component.name === 'Read only field' ? (
                  <ReadOnlyFieldPreview
                    selectedVariants={selectedVariants}
                    selectedLayer={selectedLayer}
                    componentElevation={componentElevation}
                  />
                ) : component.name === 'File input' ? (
                  <FileInputPreview
                    selectedVariants={selectedVariants}
                    selectedLayer={selectedLayer}
                    componentElevation={componentElevation}
                  />
                ) : component.name === 'File upload' ? (
                  <FileUploadPreview
                    selectedVariants={selectedVariants}
                    selectedLayer={selectedLayer}
                    componentElevation={componentElevation}
                  />
                ) : component.name === 'Panel' ? (
                  <PanelPreview
                    selectedVariants={selectedVariants}
                    selectedLayer={selectedLayer}
                    componentElevation={componentElevation}
                  />
                ) : component.name === 'Hover card / Popover' ? (
                  <HoverCardPopoverPreview
                    selectedVariants={selectedVariants}
                    selectedLayer={selectedLayer}
                    componentElevation={componentElevation}
                  />
                ) : component.name === 'Card' ? (
                  <CardPreview
                    selectedVariants={selectedVariants}
                    selectedLayer={selectedLayer}
                  />
                ) : component.name === 'Pagination' ? (
                  <PaginationPreview
                    selectedVariants={selectedVariants}
                    selectedLayer={selectedLayer}
                    componentElevation={componentElevation}
                  />
                ) : component.name === 'Time picker' ? (
                  <TimePickerPreview
                    selectedVariants={selectedVariants}
                    selectedLayer={selectedLayer}
                    componentElevation={componentElevation}
                  />
                ) : component.name === 'Loader' ? (
                  <LoaderPreview
                    selectedVariants={selectedVariants}
                    selectedLayer={selectedLayer}
                    componentElevation={componentElevation}
                  />
                ) : component.name === 'Stepper' ? (
                  <StepperPreview
                    selectedVariants={selectedVariants}
                    selectedLayer={selectedLayer}
                    componentElevation={componentElevation}
                  />
                ) : component.name === 'Timeline' ? (
                  <TimelinePreview
                    selectedVariants={selectedVariants}
                    selectedLayer={selectedLayer}
                    componentElevation={componentElevation}
                  />
                ) : component.name === 'Timeline bullet' ? (
                  <TimelineBulletPreview
                    selectedVariants={selectedVariants}
                    selectedLayer={selectedLayer}
                    componentElevation={componentElevation}
                  />
                ) : component.name === 'Transfer list' ? (
                  <TransferListPreview
                    selectedVariants={selectedVariants}
                    selectedLayer={selectedLayer}
                    componentElevation={componentElevation}
                  />
                ) : component.name === 'Table' ? (
                  <TablePreview
                    selectedVariants={selectedVariants}
                    selectedLayer={selectedLayer}
                    componentElevation={componentElevation}
                    showHeader={true}
                    showFooter={true}
                  />
                ) : component.name === 'Table cell' ? (
                  <TablePreview
                    selectedVariants={selectedVariants}
                    selectedLayer={selectedLayer}
                    componentElevation={componentElevation}
                    singleRowMode={true}
                    hideSearch={true}
                    showHeader={false}
                    showFooter={false}
                  />
                ) : component.name === 'Table header' ? (
                  <TablePreview
                    selectedVariants={selectedVariants}
                    selectedLayer={selectedLayer}
                    componentElevation={componentElevation}
                    singleRowMode={true}
                    hideSearch={true}
                    showHeader={true}
                    showFooter={false}
                  />
                ) : component.name === 'Table footer' ? (
                  <TablePreview
                    selectedVariants={selectedVariants}
                    selectedLayer={selectedLayer}
                    componentElevation={componentElevation}
                    singleRowMode={true}
                    hideSearch={true}
                    showHeader={false}
                    showFooter={true}
                  />
                ) : component.name === 'Tree' ? (
                  <div style={{
                    width: '100%',
                    minHeight: 200,
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                  }}>
                    {component.render?.(new Set([selectedLayer as any]), previewState) || <div>No preview available</div>}
                  </div>
                ) : (
                  <div style={{
                    minHeight: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {component.render?.(new Set([selectedLayer as any]), previewState, selectedVariants) || <div>No preview available</div>}
                  </div>
                )}
              </Suspense>
            </div>
          </div>
        </div>

        {/* Toolbar Panel - Right Side */}
        <div style={{
          width: '416px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          borderLeft: `1px solid var(${layerProperty(mode, 1, 'border-color')})`,
          minHeight: debugMode ? undefined : 0,
          height: debugMode ? undefined : '100%',
          borderTopRightRadius: 'var(--recursica_brand_dimensions_border-radii_xl)',
          borderBottomRightRadius: 'var(--recursica_brand_dimensions_border-radii_xl)',
          overflow: 'hidden',
        }}>
          <ComponentToolbar
            componentName={componentName as ComponentName}
            selectedVariants={selectedVariants}
            selectedLayer={selectedLayer}
            onVariantChange={(prop, variant) => {
              setSelectedVariants(prev => ({ ...prev, [prop]: variant }))
            }}
            onLayerChange={setSelectedLayer}
            onActiveStateChange={handleActiveStateChange}
          />
        </div>
      </div>

      {/* Debug Table - Show when debug mode is enabled, below preview and toolbar */}
      {debugMode && component && openPropControl && (
        <div style={{
          padding: 'var(--recursica_brand_dimensions_general_xl)',
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
