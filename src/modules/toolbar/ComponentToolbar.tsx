/**
 * Component Toolbar
 * 
 * A toolbar for editing component CSS variables with variant selection,
 * layer selection, and prop controls.
 */

import { useState, useMemo, useRef, useEffect } from 'react'
import { parseComponentStructure, toSentenceCase, ComponentProp } from './utils/componentToolbarUtils'
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
import uikitJson from '../../../recursica_ui-kit.json'

export interface ComponentToolbarProps {
  componentName: ComponentName
  selectedVariants?: Record<string, string> // e.g., { style: "solid", size: "default" }
  selectedLayer: string // e.g., "layer-0"
  onVariantChange: (prop: string, variant: string) => void
  onLayerChange: (layer: string) => void
}

export default function ComponentToolbar({
  componentName,
  selectedVariants = {},
  selectedLayer,
  onVariantChange,
  onLayerChange,
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

  // Filter variants to show (excluding interaction states)
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

  // Check if current variant combination supports interaction states
  const hasStates = useMemo(() => {
    if (!compJson) return false
    const activeStyle = selectedVariants.style
    if (activeStyle && compJson.variants?.styles?.[activeStyle]?.variants?.states) {
      return true
    }
    if (compJson.variants?.states) {
      return true
    }
    return false
  }, [compJson, selectedVariants.style])

  // Reset tab to base if component or state support changes
  useEffect(() => {
    setActiveStateTab('base')
  }, [componentName, hasStates])

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

    // Config keys sometimes drop/add the "-color" suffix (e.g. "text-color" → "text",
    // "input-background" → "input-background-color"), so try both leaf spellings.
    const nameCandidates = new Set<string>([leaf])
    if (leaf.endsWith('-color')) nameCandidates.add(leaf.replace(/-color$/, ''))
    else nameCandidates.add(`${leaf}-color`)

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
      if (selectedVariants.style && p.path.includes('styles') && !p.path.includes(selectedVariants.style)) return false
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
    if (!isGroupChild && TEXT_GROUP_NAMES.has(leaf)) return textMatch || otherMatch || colorMatch || matches[0]
    // Group children that aren't dimensions are almost always colors (e.g. Slider track/thumb);
    // if only a dimension exists (e.g. track-height), colorMatch is null and we fall to it.
    if (isGroupChild) return colorMatch || otherMatch || matches[0]
    return otherMatch || textMatch || colorMatch || matches[0]
  }

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

  // A child is state-varying (rendered under the Interaction States tabs) when the component
  // supports states and the child resolves to a color prop.
  const isStateVarying = (child: { key: string; isGroupChild: boolean }): boolean => {
    if (!hasStates) return false
    const base = resolveConfigProp(child.key, child.isGroupChild, 'base')
    return base?.category === 'colors' || base?.type === 'color'
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

  // Get static accordion groups (props that don't vary by interaction state)
  const staticAccordionItems = useMemo(() => {
    if (!toolbarConfig?.props) return []

    return Object.entries(toolbarConfig.props)
      .map(([groupKey, groupConfig]) => {
        const staticChildren = getEntryChildren(groupKey, groupConfig)
          .filter(child => !isStateVarying(child))
          .filter(child => resolveConfigProp(child.key, child.isGroupChild, 'base'))

        if (staticChildren.length === 0) return null

        const Icon = groupConfig.icon ? iconNameToReactComponent(groupConfig.icon) : null

        return {
          id: groupKey,
          title: groupConfig.label || toSentenceCase(groupKey),
          icon: Icon || undefined,
          content: (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {staticChildren.map(child => renderChild(child, 'base', selectedLayer))}
            </div>
          ),
        }
      })
      .filter(Boolean) as any[]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolbarConfig, selectedLayer, selectedVariants, componentName, hasStates, liveStructure.props])

  // Get state-varying (color) accordion groups for the active interaction state tab
  const stateAccordionItems = useMemo(() => {
    if (!toolbarConfig?.props || !hasStates) return []

    return Object.entries(toolbarConfig.props)
      .map(([groupKey, groupConfig]) => {
        const stateChildren = getEntryChildren(groupKey, groupConfig)
          .filter(child => isStateVarying(child))
          .filter(child => resolveConfigProp(child.key, child.isGroupChild, activeStateTab))

        if (stateChildren.length === 0) return null

        const Icon = groupConfig.icon ? iconNameToReactComponent(groupConfig.icon) : null

        return {
          id: `${groupKey}-state-${activeStateTab}`,
          title: groupConfig.label || toSentenceCase(groupKey),
          icon: Icon || undefined,
          content: (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {stateChildren.map(child => renderChild(child, activeStateTab, `${activeStateTab}-${selectedLayer}`))}
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

    // Find what states are defined in the component schema
    let availableStates: string[] = []
    if (compJson) {
      const activeStyle = selectedVariants.style
      const statesObj = (activeStyle && compJson.variants?.styles?.[activeStyle]?.variants?.states) || compJson.variants?.states
      if (statesObj) {
        availableStates = Object.keys(statesObj).map(s => s.toLowerCase())
      }
    }

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
  }, [compJson, selectedVariants.style])


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

  return (
    <div className="component-toolbar-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Layers Segmented Control */}
      <div style={{ padding: 'var(--recursica_brand_dimensions_general_md)', borderBottom: `1px solid var(${layerProperty(mode, 0, 'border-color')})` }}>
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

      {/* Variants Dropdowns */}
      {visibleVariants.length > 0 && (
        <div style={{ padding: 'var(--recursica_brand_dimensions_general_md)', borderBottom: `1px solid var(${layerProperty(mode, 0, 'border-color')})` }}>
          {visibleVariants.map((variant, index) => {
            const isBoolean = isBooleanVariant(variant.variants)
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

      {/* Accordion / Tab Scrollable Body */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* 1. Static/Base Properties Accordion (Top) */}
        {staticAccordionItems.length > 0 && (
          <div style={{ borderBottom: `1px solid var(${layerProperty(mode, 0, 'border-color')})` }}>
            <Accordion
              items={staticAccordionItems}
              allowMultiple={true}
              layer="layer-0"
            />
          </div>
        )}

        {/* 2. States Segmented Tabs Section (Bottom) */}
        {hasStates && (
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'var(--recursica_brand_dimensions_gutters_vertical)' }}>
            <div style={{
              borderBottom: `1px solid var(${layerProperty(mode, 0, 'border-color')})`,
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
