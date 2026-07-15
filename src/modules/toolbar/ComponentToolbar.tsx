/**
 * Component Toolbar
 * 
 * A toolbar for editing component CSS variables with variant selection,
 * layer selection, and prop controls.
 */

import { useState, useMemo, useRef, useEffect } from 'react'
import type { ReactNode, CSSProperties } from 'react'
import { parseComponentStructure, toSentenceCase, ComponentProp, VARIANT_PROP_TO_CATEGORY, pathMatchesVariant } from './utils/componentToolbarUtils'
import VariantDropdown from './menu/dropdown/VariantDropdown'
import VariantSwitch from './menu/dropdown/VariantSwitch'
import { SegmentedControl } from '../../components/adapters/SegmentedControl'
import type { SegmentedControlItem } from '../../components/adapters/SegmentedControl'
import { Tabs } from '../../components/adapters/Tabs'
import { Tooltip } from '../../components/adapters/Tooltip'
import { Accordion } from '../../components/adapters/Accordion'
import PropControlContent from './menu/floating-palette/PropControlContent'
import { iconNameToReactComponent } from '../components/iconUtils'
import { getPropIcon, getPropLabel, loadToolbarConfig } from './utils/loadToolbarConfig'
import { useThemeMode } from '../theme/ThemeModeContext'
import { useVars } from '../vars/VarsContext'
import { updateCssVar } from '../../core/css/updateCssVar'
import { Switch } from '../../components/adapters/Switch'
import { Button } from '../../components/adapters/Button'
import { useDebugMode } from '../preview/PreviewPage'
import type { ComponentName } from '../../components/registry/types'
import './ComponentToolbar.css'
import { layerProperty, layerText } from '../../core/css/cssVarBuilder'
import { getVarsStore } from '../../core/store/varsStore'
import {
  cloneVariantInUIKit,
  deleteCustomVariant,
  listCustomVariants,
  getExistingVariantNames,
  getExistingAxes,
  categoryKeyToAxis,
} from '../../core/uikit/createVariantInUIKit'
import { CreateVariantModal } from './modals/CreateVariantModal'
import { DeleteVariantModal } from './modals/DeleteVariantModal'
import { Modal } from '../../components/adapters/Modal'
import { RadioButtonGroup } from '../../components/adapters/RadioButtonGroup'
import { RadioButtonItem } from '../../components/adapters/RadioButtonItem'
import { normalizeToolbarKey } from './utils/toolbarPathResolver'
import { getTypographyStyle } from '../components/typographyStyles'
import uikitJson from '../../../recursica_ui-kit.json'

export interface ComponentToolbarProps {
  componentName: ComponentName
  selectedVariants?: Record<string, string> // e.g., { style: "solid", size: "default" }
  selectedLayer: string // e.g., "layer-0"
  onVariantChange: (prop: string, variant: string) => void
  onLayerChange: (layer: string) => void
  /** Notified whenever the active interaction-state tab changes, so the preview can mirror it. */
  onActiveStateChange?: (state: string) => void
}

export default function ComponentToolbar({
  componentName,
  selectedVariants = {},
  selectedLayer,
  onVariantChange,
  onLayerChange,
  onActiveStateChange,
}: ComponentToolbarProps) {
  const { mode } = useThemeMode()
  const { theme, uikit } = useVars()
  const { debugMode, setDebugMode } = useDebugMode()

  // Tab state for interaction states
  const [activeStateTab, setActiveStateTab] = useState<string>('base')

  // Custom variant modal state
  const [createVariantModalOpen, setCreateVariantModalOpen] = useState(false)
  const [deleteVariantModalOpen, setDeleteVariantModalOpen] = useState(false)
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
  const [resetTarget, setResetTarget] = useState<'imported' | 'original'>('imported')
  const [createVariantAxis, setCreateVariantAxis] = useState<string>('')
  const [createVariantExistingNames, setCreateVariantExistingNames] = useState<string[]>([])

  const componentKey = useMemo(() => {
    let key = componentName.toLowerCase().replace(/\s+/g, '-')
    if (key === 'checkbox-group-item') key = 'checkbox-item'
    if (key === 'radio-button-group-item') key = 'radio-button-item'
    if (key === 'switch-group-item') key = 'switch-item'
    if (key === 'switchitem') key = 'switch-item'
    if (key === 'hover-card-/-popover') key = 'hover-card-popover'
    return key
  }, [componentName])

  // Get live component data from store
  const compJson = useMemo(() => {
    const liveUikit = getVarsStore().getState().uikit as any
    const components = liveUikit?.['ui-kit']?.components ?? liveUikit?.components ?? {}
    return components[componentKey]
  }, [componentKey, uikit])

  // Use structure parse for variants only
  const liveStructure = useMemo(
    () => parseComponentStructure(componentName, getVarsStore().getState().uikit),
    [componentName, uikit, mode]
  )

  // Get toolbar config
  const toolbarConfig = useMemo(() => {
    return loadToolbarConfig(componentName)
  }, [componentName])

  // Filter variants to show (excluding the interaction-states axis, which is handled by the tabs)
  const visibleVariants = useMemo(() => {
    const filtered = liveStructure.variants.filter(
      variant => variant.variants.length >= 1 && variant.propName !== 'states'
    )

    if (toolbarConfig?.variants) {
      const configOrder = Object.keys(toolbarConfig.variants)
      const configVariants = filtered.filter(variant =>
        configOrder.includes(variant.propName.toLowerCase())
      )
      return configVariants.sort((a, b) => {
        const aIndex = configOrder.indexOf(a.propName.toLowerCase())
        const bIndex = configOrder.indexOf(b.propName.toLowerCase())
        return aIndex - bIndex
      })
    }
    return filtered
  }, [liveStructure.variants, toolbarConfig, componentName])

  // The interaction-state set in effect for the current selection: nested states under the active
  // value of ANY variant axis (e.g. styles.<style>.variants.states OR selections.<sel>.variants.states),
  // else the component's top-level variants.states.
  const activeStatesObj = useMemo(() => {
    if (!compJson) return null
    for (const v of liveStructure.variants) {
      if (v.propName === 'states') continue
      const cat = VARIANT_PROP_TO_CATEGORY[v.propName] || v.propName
      const activeVal = selectedVariants[v.propName] || v.variants[0]
      const nested = compJson.variants?.[cat]?.[activeVal]?.variants?.states
      if (nested) return nested
    }
    return compJson.variants?.states ?? null
  }, [compJson, selectedVariants, liveStructure.variants])

  const hasStates = !!activeStatesObj

  // Reset tab to base if component or state support changes
  useEffect(() => {
    setActiveStateTab('base')
  }, [componentName, hasStates])

  // Mirror the active interaction-state tab up to the parent so the live preview can reflect it.
  useEffect(() => {
    onActiveStateChange?.(activeStateTab)
  }, [activeStateTab, onActiveStateChange])

  // List custom variants for this component
  const customVariants = useMemo(() => {
    const liveUikit = getVarsStore().getState().uikit
    return listCustomVariants(liveUikit, componentKey)
  }, [componentKey, uikit])

  const hasNoVariantAxes = visibleVariants.length === 0

  const handleOpenCreateVariant = (axisName: string, existingNames: string[]) => {
    setCreateVariantAxis(axisName)
    setCreateVariantExistingNames(existingNames)
    setCreateVariantModalOpen(true)
  }

  const handleCreateVariant = (axisCategory: string, sourceVariantName: string, newVariantName: string) => {
    const store = getVarsStore()
    const updated = cloneVariantInUIKit(store.getState().uikit, componentKey, axisCategory, sourceVariantName, newVariantName)
    store.setUiKit(updated)
    const axisName = categoryKeyToAxis(axisCategory)
    onVariantChange(axisName, newVariantName.toLowerCase())
  }

  const handleDeleteVariant = (axisCategory: string, variantName: string) => {
    const store = getVarsStore()
    const liveUikit = store.getState().uikit
    const updated = deleteCustomVariant(liveUikit, componentKey, axisCategory, variantName)
    store.setUiKit(updated)
    const axisName = categoryKeyToAxis(axisCategory)
    if (selectedVariants[axisName] === variantName) {
      const remaining = getExistingVariantNames(updated, componentKey, axisCategory)
      if (remaining.length > 0) {
        onVariantChange(axisName, remaining[0])
      }
    }
  }

  const handleReset = (target: 'imported' | 'original') => {
    const store = getVarsStore()
    const sourceUikit = target === 'imported' ? store.getImportedUikit() : uikitJson
    const currentState = store.getState().uikit
    const updatedUikit = JSON.parse(JSON.stringify(currentState))
    const baseComponents = (sourceUikit as any)?.['ui-kit']?.components || (sourceUikit as any)?.components || {}
    const baseComponentData = baseComponents[componentKey]

    if (updatedUikit?.['ui-kit']?.components) {
      if (baseComponentData) {
        updatedUikit['ui-kit'].components[componentKey] = JSON.parse(JSON.stringify(baseComponentData))
      } else {
        delete updatedUikit['ui-kit'].components[componentKey]
      }
    } else if (updatedUikit?.components) {
      if (baseComponentData) {
        updatedUikit.components[componentKey] = JSON.parse(JSON.stringify(baseComponentData))
      } else {
        delete updatedUikit.components[componentKey]
      }
    }

    store.setUiKit(updatedUikit)
    window.dispatchEvent(new CustomEvent('cssVarsReset'))
  }

  // Layers data
  const layers = useMemo(() => {
    try {
      const t: any = theme
      const themeRoot: any = t?.brand ? t : { brand: t }
      const themes = themeRoot?.themes || themeRoot
      const layersData: any = themes?.[mode]?.layers || themes?.[mode]?.layer || {}
      const layerKeys = Object.keys(layersData).filter(key => /^layer-\d+$/.test(key)).sort((a, b) => {
        const aNum = parseInt(a.replace('layer-', ''), 10)
        const bNum = parseInt(b.replace('layer-', ''), 10)
        return aNum - bNum
      })
      return layerKeys.length > 0 ? layerKeys : ['layer-0', 'layer-1', 'layer-2', 'layer-3']
    } catch {
      return ['layer-0', 'layer-1', 'layer-2', 'layer-3']
    }
  }, [theme, mode])

  const layerItems: SegmentedControlItem[] = useMemo(() => {
    return layers.map((layer, index) => ({
      value: layer,
      label: index.toString(),
    }))
  }, [layers])

  const LayerIcon = iconNameToReactComponent('square-3-stack-3d')

  // Text-style element names — mirrors PropControlContent's list so we hand the control
  // a `text-group` prop (→ TextStyleToolbar) instead of mistaking it for a dimension.
  const TEXT_GROUP_NAMES = useMemo(() => new Set([
    'text', 'header-text', 'content-text', 'label-text', 'optional-text', 'supporting-text',
    'min-max-label', 'read-only-value', 'placeholder', 'active-text', 'inactive-text',
    'description-text', 'title-text', 'timestamp-text', 'selected-text', 'unselected-text',
    'step-number-text', 'input-text', 'text-style', 'sorted-text-style', 'unsorted-text-style', 'currency-style',
  ]), [])

  // A prop matches the current selection when, for every REAL variant axis whose category appears
  // in the prop's path (styles/sizes/layouts/orientation/…), the selected value for that axis is the
  // one present in the path. Synthetic selector keys (checked/selection/validation) aren't path
  // categories (VARIANT_PROP_TO_CATEGORY has no entry) so they're ignored; `states` is handled by
  // the active interaction-state tab, not here.
  const pathMatchesSelection = (path: string[]): boolean => {
    for (const [axis, value] of Object.entries(selectedVariants)) {
      if (axis === 'states' || !value) continue
      const cat = VARIANT_PROP_TO_CATEGORY[axis]
      if (!cat) continue
      if (path.includes(cat) && !pathMatchesVariant(path, axis, value)) return false
    }
    return true
  }

  // Resolve a toolbar-config key (e.g. "properties.track", "properties.colors.icon-color",
  // "min-max-label") to the REAL parsed component prop, so the control gets the correct
  // type + CSS variable. Fabricating a dummy prop (the previous approach) produced dead
  // variables and wrong control types; resolving against the live structure is what the
  // rest of the pipeline (reads, writes, mode-mirroring) is built around.
  const resolveConfigProp = (
    rawKey: string,
    isGroupChild: boolean,
    activeState: string
  ): ComponentProp | null => {
    const normalized = normalizeToolbarKey(rawKey)
    const leaf = (normalized.split('.').pop() || rawKey).toLowerCase()
    const keyImpliesColor = normalized.includes('.colors') || leaf.endsWith('-color')
    const isStateTab = !!activeState && activeState !== 'base'
    // A typography key (e.g. "text", "title-text") resolves ONLY to a text-STYLE group — never a
    // colour. Without this, the "-color" candidate below would let "text" match a "text-color" leaf
    // in each interaction state, falsely marking the typography control as state-varying.
    const isTextGroupKey = !isGroupChild && !keyImpliesColor && TEXT_GROUP_NAMES.has(leaf)

    // Config keys sometimes drop/add the "-color" suffix (e.g. "text-color" → "text",
    // "input-background" → "input-background-color"), so try both leaf spellings.
    const nameCandidates = new Set<string>([leaf])
    if (leaf.endsWith('-color')) nameCandidates.add(leaf.replace(/-color$/, ''))
    else if (!isTextGroupKey) nameCandidates.add(`${leaf}-color`)

    const matches = liveStructure.props.filter(p => {
      if (!nameCandidates.has(p.name.toLowerCase())) return false
      const inState = p.path.includes('states')
      if (isStateTab) {
        if (!inState || !p.path.includes(activeState)) return false
      } else if (inState) {
        return false
      }
      const layerSeg = p.path.find(s => /^layer-\d+$/.test(s))
      if (layerSeg && layerSeg !== selectedLayer) return false
      if (!pathMatchesSelection(p.path)) return false
      return true
    })
    if (matches.length === 0) return null

    const exact = (p: ComponentProp) => p.name.toLowerCase() === leaf
    const colorMatch = matches.find(p => (p.category === 'colors' || p.type === 'color') && exact(p))
      || matches.find(p => p.category === 'colors' || p.type === 'color')
    const textMatch = matches.find(p => p.type === 'text-group')
    const otherMatch = matches.find(p => p.type !== 'text-group' && p.category !== 'colors' && exact(p))
      || matches.find(p => p.type !== 'text-group' && p.category !== 'colors')

    if (keyImpliesColor) return colorMatch || matches[0]
    // Typography key: resolve only to a text-group (null if none in this state/selection) so it never
    // collapses onto a colour leaf and never appears as a spurious state-varying control.
    if (isTextGroupKey) return textMatch || null
    // Group children that aren't dimensions are almost always colors (e.g. Slider track/thumb);
    // if only a dimension exists (e.g. track-height), colorMatch is null and we fall to it.
    if (isGroupChild) return colorMatch || otherMatch || matches[0]
    return otherMatch || textMatch || colorMatch || matches[0]
  }

  // Every variant value currently in effect. Used to honour `showForVariants`.
  const selectionValues = useMemo(
    () => new Set<string>(Object.values(selectedVariants).filter(Boolean)),
    [selectedVariants]
  )

  // A config entry with `showForVariants` is only shown when one of those variant values is active.
  const passesShowFor = (cfg: any): boolean =>
    !cfg?.showForVariants || cfg.showForVariants.some((v: string) => selectionValues.has(v))

  // Expand a config entry into its child controls. Entries WITH a `group` yield one child
  // per group key; entries WITHOUT a group (previously dropped entirely) yield themselves.
  const getEntryChildren = (
    groupKey: string,
    groupConfig: any
  ): Array<{ key: string; isGroupChild: boolean }> => {
    const group = groupConfig.group as Record<string, any> | undefined
    if (group && Object.keys(group).length > 0) {
      return Object.keys(group).map(key => ({ key, isGroupChild: true }))
    }
    return [{ key: groupKey, isGroupChild: false }]
  }

  // A child belongs under the Interaction-State tabs when it's actually overridden by one of the
  // active states (any prop type — e.g. Tree's hover text style), or it's a color (colors default
  // to the state section). Root/variant props with no state override stay above the tabs.
  const isStateVarying = (child: { key: string; isGroupChild: boolean }): boolean => {
    if (!hasStates) return false
    const base = resolveConfigProp(child.key, child.isGroupChild, 'base')
    // Colors always route to the state tabs. A prop that only exists inside a state
    // (e.g. disabled-only `opacity`, base === null) is state-varying too.
    if (base && (base.category === 'colors' || base.type === 'color')) return true
    return activeStatesObj
      ? Object.keys(activeStatesObj).some(st => !!resolveConfigProp(child.key, child.isGroupChild, st))
      : false
  }

  const renderChild = (
    child: { key: string; isGroupChild: boolean },
    activeState: string,
    keySuffix: string
  ) => {
    const resolved = resolveConfigProp(child.key, child.isGroupChild, activeState)
    if (!resolved) return null
    return (
      <PropControlContent
        key={`${child.key}-${keySuffix}`}
        prop={resolved}
        componentName={componentName}
        selectedVariants={selectedVariants}
        selectedLayer={selectedLayer}
        customCssVars={[resolved.cssVar]}
      />
    )
  }

  // Static accordion groups (props that don't vary by interaction state), split into:
  //   - base: properties with no variant ancestor (rendered above the variant dropdowns)
  //   - variant: properties that live under a variant axis (rendered below the variant dropdowns)
  const staticAccordions = useMemo(() => {
    const base: any[] = []
    const variant: any[] = []
    if (!toolbarConfig?.props) return { base, variant }

    for (const [groupKey, groupConfig] of Object.entries(toolbarConfig.props)) {
      if (!passesShowFor(groupConfig)) continue

      const staticChildren = getEntryChildren(groupKey, groupConfig)
        .filter(child => passesShowFor(child.isGroupChild ? groupConfig.group?.[child.key] : groupConfig))
        .filter(child => !isStateVarying(child))
        .map(child => ({ child, resolved: resolveConfigProp(child.key, child.isGroupChild, 'base') }))
        .filter((x): x is { child: { key: string; isGroupChild: boolean }; resolved: ComponentProp } => !!x.resolved)

      if (staticChildren.length === 0) continue

      const Icon = groupConfig.icon ? iconNameToReactComponent(groupConfig.icon) : null

      const item = {
        id: groupKey,
        title: groupConfig.label || toSentenceCase(groupKey),
        icon: Icon || undefined,
        content: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {staticChildren.map(x => renderChild(x.child, 'base', selectedLayer))}
          </div>
        ),
      }

      // A group is "base" only when none of its props are variant-specific (no variant ancestor).
      const isBaseGroup = staticChildren.every(x => !x.resolved.isVariantSpecific)
      ;(isBaseGroup ? base : variant).push(item)
    }
    return { base, variant }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolbarConfig, selectedLayer, selectedVariants, componentName, hasStates, liveStructure.props])

  // State-driven accordion groups: props overridden by the active interaction-state tab.
  const stateAccordionItems = useMemo(() => {
    if (!toolbarConfig?.props) return []

    return Object.entries(toolbarConfig.props)
      .filter(([, groupConfig]) => passesShowFor(groupConfig))
      .map(([groupKey, groupConfig]) => {
        let controls: ReactNode[]

        if (hasStates) {
          const stateChildren = getEntryChildren(groupKey, groupConfig)
            .filter(child => passesShowFor(child.isGroupChild ? groupConfig.group?.[child.key] : groupConfig))
            .filter(child => isStateVarying(child))
            .filter(child => resolveConfigProp(child.key, child.isGroupChild, activeStateTab))
          controls = stateChildren.map(child => renderChild(child, activeStateTab, `${activeStateTab}-${selectedLayer}`))
        } else {
          controls = []
        }

        if (controls.length === 0) return null

        const Icon = groupConfig.icon ? iconNameToReactComponent(groupConfig.icon) : null

        return {
          id: `${groupKey}-state-${activeStateTab}`,
          title: groupConfig.label || toSentenceCase(groupKey),
          icon: Icon || undefined,
          content: (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {controls}
            </div>
          ),
          defaultOpen: false, // Collapsed by default
        }
      })
      .filter(Boolean) as any[]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolbarConfig, selectedLayer, selectedVariants, componentName, activeStateTab, hasStates, liveStructure.props])

  // State Tabs Segmented Control definition
  const stateTabItems = useMemo<Array<{ value: string; label: string; icon: string }>>(() => {
    const items: Array<{ value: string; label: string; icon: string }> = [{ value: 'base', label: 'Base', icon: 'cursor' }]

    // States for the current selection (nested under whichever variant axis is active).
    let availableStates: string[] = activeStatesObj ? Object.keys(activeStatesObj).map(s => s.toLowerCase()) : []

    // If no statesObj is found, default to standard interaction states
    if (availableStates.length === 0) {
      availableStates = ['hover', 'focus', 'disabled']
    }

    const orderedStates = [
      { key: 'hover', label: 'Hover', icon: 'hand-pointing' },
      { key: 'focus', label: 'Focus', icon: 'radio-button' },
      { key: 'active', label: 'Active', icon: 'cursor' },
      { key: 'error', label: 'Error', icon: 'warning' },
      { key: 'disabled', label: 'Disabled', icon: 'prohibit' }
    ]

    orderedStates.forEach(({ key, label, icon }) => {
      if (availableStates.includes(key)) {
        items.push({ value: key, label, icon })
      }
    })

    return items
  }, [activeStatesObj])


  // Detect whether this is a boolean-like variant selector
  const isBooleanVariant = (variants: string[]): boolean => {
    if (variants.length !== 2) return false
    const normalized = variants.map(v => v.toLowerCase())
    const booleanPairs = [
      ['true', 'false'],
      ['yes', 'no'],
      ['on', 'off'],
      ['enabled', 'disabled'],
      ['show', 'hide'],
      ['visible', 'hidden'],
      ['active', 'inactive'],
    ]
    return booleanPairs.some(([a, b]) => normalized.includes(a) && normalized.includes(b))
  }

  // Section heading (e.g. "Properties", "Variants") shown between toolbar regions.
  const sectionHeadingStyle: CSSProperties = {
    ...getTypographyStyle('h4'),
    padding: 'var(--recursica_brand_dimensions_general_md) var(--recursica_brand_dimensions_general_md) var(--recursica_brand_dimensions_general_sm)',
    color: `var(${layerText(mode, 0, 'color')})`,
  }
  const showVariantHeading = visibleVariants.length > 0 || hasStates

  return (
    <div className="component-toolbar-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Layers Segmented Control */}
      <div style={{ padding: 'var(--recursica_brand_dimensions_general_md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--recursica_brand_dimensions_general_sm)' }}>
            {LayerIcon && <LayerIcon style={{
              width: '16px',
              height: '16px',
              color: `var(${layerText(mode, 0, 'color')})`,
              opacity: `var(${layerText(mode, 0, 'low-emphasis')})`
            }} />}
            <span style={{
              fontFamily: 'var(--recursica_brand_typography_body-font-family)',
              fontSize: 'var(--recursica_brand_typography_body-font-size)',
              fontWeight: 'var(--recursica_brand_typography_body-font-weight)',
              color: `var(${layerText(mode, 0, 'color')})`
            }}>Layer</span>
          </div>
          <SegmentedControl
            items={layerItems}
            value={selectedLayer}
            onChange={onLayerChange}
            orientation="horizontal"
            fullWidth={false}
            layer="layer-0"
            componentNameForCssVars="SegmentedControl"
          />
        </div>
      </div>

      {/* Scrollable body: base props (no variant ancestor) → variant dropdowns → synthetic
          selectors → variant-specific static props → interaction-state tabs → state colors. */}
      <div style={{ flex: 1, overflowY: 'auto' }}>

      {/* Base (non-variant) properties — above the variant dropdowns.
          No container border: the Accordion component draws its own item dividers. */}
      {staticAccordions.base.length > 0 && (
        <>
          <h4 style={sectionHeadingStyle}>Properties</h4>
          <Accordion items={staticAccordions.base} allowMultiple={true} layer="layer-0" />
        </>
      )}

      {showVariantHeading && (
        <h4 style={sectionHeadingStyle}>Variants</h4>
      )}

      {/* Variants Dropdowns */}
      {visibleVariants.length > 0 && (
        <div style={{ padding: 'var(--recursica_brand_dimensions_general_md)', marginTop: 0 }}>
          {visibleVariants.map((variant, index) => {
            // The selection axis always renders as a dropdown, even when its two values
            // (e.g. active/inactive) would otherwise match the boolean-toggle heuristic.
            const isBoolean = variant.propName !== 'selection-states' && isBooleanVariant(variant.variants)
            return (
              <div
                key={variant.propName}
                style={{
                  marginBottom: index < visibleVariants.length - 1 ? 'var(--recursica_brand_dimensions_general_sm)' : 0,
                  paddingBottom: index < visibleVariants.length - 1 ? 'var(--recursica_brand_dimensions_general_sm)' : 0,
                }}
              >
                {isBoolean ? (
                  <VariantSwitch
                    componentName={componentName}
                    propName={variant.propName}
                    variants={variant.variants}
                    selected={selectedVariants[variant.propName] || variant.variants[0]}
                    onSelect={(variantName) => onVariantChange(variant.propName, variantName)}
                    className="full-width"
                  />
                ) : (
                  <VariantDropdown
                    componentName={componentName}
                    propName={variant.propName}
                    variants={variant.variants}
                    selected={selectedVariants[variant.propName] || variant.variants[0]}
                    onSelect={(variantName) => onVariantChange(variant.propName, variantName)}
                    onCreateVariant={() => handleOpenCreateVariant(variant.propName, variant.variants)}
                    className="full-width"
                  />
                )}
              </div>
            )
          })}
        </div>
      )}

        {/* Variant-specific static properties — below the variant dropdowns.
            No container border: the Accordion component draws its own item dividers. */}
        {staticAccordions.variant.length > 0 && (
          <Accordion
            items={staticAccordions.variant}
            allowMultiple={true}
            layer="layer-0"
          />
        )}

        {/* Interaction-state tabs section */}
        {hasStates && (
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'var(--recursica_brand_dimensions_gutters_vertical)' }}>
            <div style={{
              background: `var(${layerProperty(mode, 0, 'background-color')})`,
            }}>
              <Tabs
                value={activeStateTab}
                onChange={(v) => { if (v) setActiveStateTab(v) }}
                orientation="horizontal"
                layer="layer-1"
              >
                <Tabs.List className="state-tabs-list">
                  {stateTabItems.map((item) => {
                    const Icon = iconNameToReactComponent(item.icon)
                    const isSelected = activeStateTab === item.value
                    const iconEl = Icon ? <Icon size={16} /> : null
                    // Icon-only, with a hover tooltip naming the state — except the selected
                    // tab, which shows icon + label (no tooltip, since the label is visible).
                    // Tooltip wraps the ICON (inside leftSection) so the Tab stays a direct
                    // child of Tabs.List (Mantine relies on that).
                    return (
                      <Tabs.Tab
                        key={item.value}
                        value={item.value}
                        leftSection={
                          isSelected
                            ? iconEl
                            : <Tooltip label={item.label} position="top">{iconEl}</Tooltip>
                        }
                      >
                        {isSelected ? item.label : null}
                      </Tabs.Tab>
                    )
                  })}
                </Tabs.List>
              </Tabs>
            </div>

            {/* State Properties Accordion */}
            {stateAccordionItems.length > 0 && (
              <Accordion
                items={stateAccordionItems}
                allowMultiple={true}
                layer="layer-0"
              />
            )}
          </div>
        )}

        {/* Selector-driven role groups for components WITHOUT interaction states (e.g. Timeline
            bullet's active/inactive): rendered here since there's no tabs section to host them. */}
        {!hasStates && stateAccordionItems.length > 0 && (
          <Accordion
            items={stateAccordionItems}
            allowMultiple={true}
            layer="layer-0"
          />
        )}
      </div>

      {/* Reset + Delete Variant Buttons */}
      <div style={{ padding: 'var(--recursica_brand_dimensions_general_md)', borderTop: `1px solid var(${layerProperty(mode, 0, 'border-color')})`, display: 'flex', flexDirection: 'row', gap: 'var(--recursica_brand_dimensions_gutters_horizontal)' }}>
        <Button
          onClick={() => {
            if (getVarsStore().hasUserImportedFiles()) {
              setResetTarget('imported')
              setResetConfirmOpen(true)
            } else {
              handleReset('original')
            }
          }}
          variant="outline"
          size="small"
          layer="layer-0"
          style={{ flex: 1 }}
          icon={(() => {
            const UndoIcon = iconNameToReactComponent('arrow-uturn-left')
            return UndoIcon ? <UndoIcon style={{ width: 14, height: 14 }} /> : undefined
          })()}
        >
          Reset
        </Button>
        <Button
          onClick={() => setDeleteVariantModalOpen(true)}
          variant="outline"
          size="small"
          layer="layer-0"
          disabled={customVariants.length === 0}
          style={{ flex: 1 }}
          icon={(() => {
            const TrashIcon = iconNameToReactComponent('trash')
            return TrashIcon ? <TrashIcon style={{ width: 14, height: 14 }} /> : undefined
          })()}
        >
          Delete variant
        </Button>
      </div>

      {/* Switches Section */}
      <div style={{
        padding: 'var(--recursica_brand_dimensions_general_md)',
        borderTop: `1px solid var(${layerProperty(mode, 0, 'border-color')})`,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--recursica_brand_dimensions_general_sm)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--recursica_brand_dimensions_general_default)',
        }}>
          <Switch
            checked={debugMode}
            onChange={setDebugMode}
            layer="layer-0"
          />
          <label
            onClick={() => setDebugMode(!debugMode)}
            style={{
              color: `var(${layerText(mode, 0, 'color')})`,
              opacity: `var(${layerText(mode, 0, 'low-emphasis')})`,
              fontSize: 'var(--recursica_brand_typography_body-small-font-size)',
              cursor: 'pointer',
              flex: 1,
            }}>
            Debug mode
          </label>
        </div>
      </div>

      {/* Create Variant Modal */}
      <CreateVariantModal
        isOpen={createVariantModalOpen}
        onClose={() => setCreateVariantModalOpen(false)}
        onConfirm={handleCreateVariant}
        axisName={createVariantAxis}
        existingVariantNames={createVariantExistingNames}
        showAxisField={hasNoVariantAxes}
        existingAxisNames={getExistingAxes(getVarsStore().getState().uikit, componentKey)}
      />

      {/* Delete Variant Modal */}
      <DeleteVariantModal
        isOpen={deleteVariantModalOpen}
        onClose={() => setDeleteVariantModalOpen(false)}
        onConfirm={handleDeleteVariant}
        customVariants={customVariants}
      />

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        title={`Reset ${componentName}`}
        size="sm"
        layer="layer-1"
        primaryActionLabel="Reset"
        onPrimaryAction={() => {
          setResetConfirmOpen(false)
          handleReset(resetTarget)
        }}
        secondaryActionLabel="Cancel"
        onSecondaryAction={() => setResetConfirmOpen(false)}
        content={
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ margin: 0, fontSize: 'var(--recursica_brand_typography_body-font-size)' }}>
              Are you sure you want to reset your changes?
            </p>
            <RadioButtonGroup label="Version" required>
              <RadioButtonItem
                selected={resetTarget === 'imported'}
                onChange={() => setResetTarget('imported')}
                label="Reset to last imported version"
              />
              <RadioButtonItem
                selected={resetTarget === 'original'}
                onChange={() => setResetTarget('original')}
                label="Reset to Forge defaults"
              />
            </RadioButtonGroup>
          </div>
        }
      />
    </div>
  )
}
