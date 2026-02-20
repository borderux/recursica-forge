import React from 'react'
import { Button } from '../../components/adapters/Button'
import { Switch } from '../../components/adapters/Switch'
import { Avatar } from '../../components/adapters/Avatar'
import { Toast } from '../../components/adapters/Toast'
import { Label } from '../../components/adapters/Label'
import { AssistiveElement } from '../../components/adapters/AssistiveElement'
import { TextField } from '../../components/adapters/TextField'
import { NumberInput } from '../../components/adapters/NumberInput'
import { Breadcrumb } from '../../components/adapters/Breadcrumb'
import { Slider } from '../../components/adapters/Slider'
import { Accordion } from '../../components/adapters/Accordion'
import { CheckboxItem } from '../../components/adapters/CheckboxItem'
import { CheckboxGroup } from '../../components/adapters/CheckboxGroup'
import { Dropdown } from '../../components/adapters/Dropdown'
import { Tooltip } from '../../components/adapters/Tooltip'
import { FileInput } from '../../components/adapters/FileInput'
import { FileUpload } from '../../components/adapters/FileUpload'
import { getComponentCssVar, getComponentTextCssVar } from '../../components/utils/cssVarNames'
import { getLayerElevationBoxShadow } from '../../components/utils/brandCssVars'
import { readCssVar } from '../../core/css/readCssVar'
import type { ComponentLayer } from '../../components/registry/types'

type LayerOption = 'layer-0' | 'layer-1' | 'layer-2' | 'layer-3'

export type Section = {
  name: string
  url: string
  render?: (selectedLayers: Set<LayerOption>) => JSX.Element
}

// Sort layers numerically by layer number
export function sortLayers(layers: LayerOption[]): LayerOption[] {
  return [...layers].sort((a, b) => {
    const aMatch = /^layer-(\d+)$/.exec(a)
    const bMatch = /^layer-(\d+)$/.exec(b)
    const aNum = aMatch ? parseInt(aMatch[1], 10) : Infinity
    const bNum = bMatch ? parseInt(bMatch[1], 10) : Infinity
    return aNum - bNum
  })
}

export function getComponentSections(mode: 'light' | 'dark'): Section[] {
  // Define SwitchExamples inside getComponentSections to have access to mode
  function SwitchExamples({ layer, colorVariant = 'default', sizeVariant = 'default' }: { layer: string; colorVariant?: string; sizeVariant?: string }) {
    const [checked1, setChecked1] = React.useState(true)
    const [checked2, setChecked2] = React.useState(false)
    const [checked3, setChecked3] = React.useState(false)

    // Get the label-switch-gap CSS var - it's at the component level, not under size/variant
    // Use getComponentCssVar with any category since it will detect component-level properties
    const labelSwitchGapVar = React.useMemo(() => {
      return getComponentCssVar('Switch', 'size', 'label-switch-gap', undefined)
    }, [])

    // Get label text styling CSS variables using getComponentTextCssVar (for text style toolbar)
    const labelTextFontFamilyVar = React.useMemo(() => getComponentTextCssVar('Switch', 'label-text', 'font-family'), [])
    const labelTextFontSizeVar = React.useMemo(() => getComponentTextCssVar('Switch', 'label-text', 'font-size'), [])
    const labelTextFontWeightVar = React.useMemo(() => getComponentTextCssVar('Switch', 'label-text', 'font-weight'), [])
    const labelTextLetterSpacingVar = React.useMemo(() => getComponentTextCssVar('Switch', 'label-text', 'letter-spacing'), [])
    const labelTextLineHeightVar = React.useMemo(() => getComponentTextCssVar('Switch', 'label-text', 'line-height'), [])
    const labelTextTextDecorationVar = React.useMemo(() => getComponentTextCssVar('Switch', 'label-text', 'text-decoration'), [])
    const labelTextTextTransformVar = React.useMemo(() => getComponentTextCssVar('Switch', 'label-text', 'text-transform'), [])
    const labelTextFontStyleVar = React.useMemo(() => getComponentTextCssVar('Switch', 'label-text', 'font-style'), [])

    // State to force re-render when text CSS variables change
    const [textVarsUpdate, setTextVarsUpdate] = React.useState(0)

    // Listen for CSS variable updates from the toolbar
    React.useEffect(() => {
      const textCssVars = [
        labelTextFontFamilyVar, labelTextFontSizeVar, labelTextFontWeightVar, labelTextLetterSpacingVar,
        labelTextLineHeightVar, labelTextTextDecorationVar, labelTextTextTransformVar, labelTextFontStyleVar
      ]

      const handleCssVarUpdate = (e: Event) => {
        const detail = (e as CustomEvent).detail
        const updatedVars = detail?.cssVars || []
        // Update if any text CSS var was updated, or if no specific vars were mentioned (global update)
        const shouldUpdate = updatedVars.length === 0 || updatedVars.some((cssVar: string) => textCssVars.includes(cssVar))
        if (shouldUpdate) {
          // Force re-render by updating state
          setTextVarsUpdate(prev => prev + 1)
        }
      }

      window.addEventListener('cssVarsUpdated', handleCssVarUpdate)

      // Also watch for direct style changes using MutationObserver
      const observer = new MutationObserver(() => {
        // Force re-render for text vars
        setTextVarsUpdate(prev => prev + 1)
      })
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['style'],
      })

      return () => {
        window.removeEventListener('cssVarsUpdated', handleCssVarUpdate)
        observer.disconnect()
      }
    }, [
      labelTextFontFamilyVar, labelTextFontSizeVar, labelTextFontWeightVar, labelTextLetterSpacingVar,
      labelTextLineHeightVar, labelTextTextDecorationVar, labelTextTextTransformVar, labelTextFontStyleVar
    ])

    // Build layer text color CSS variables
    const layerTextColorVars = React.useMemo(() => {
      const layerBase = `--recursica-brand-themes-${mode}-layers-${layer}-properties`

      return {
        textColor: `${layerBase.replace('-properties', '-elements')}-text-color`,
        highEmphasis: `${layerBase.replace('-properties', '-elements')}-text-high-emphasis`,
        lowEmphasis: `${layerBase.replace('-properties', '-elements')}-text-low-emphasis`,
      }
    }, [layer, mode])

    return (
      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: `var(${labelSwitchGapVar}, 8px)` }}>
          <Switch checked={checked1} onChange={setChecked1} layer={layer as ComponentLayer} colorVariant={colorVariant} sizeVariant={sizeVariant} />
          <span style={{
            fontFamily: labelTextFontFamilyVar ? `var(${labelTextFontFamilyVar})` : undefined,
            fontSize: labelTextFontSizeVar ? `var(${labelTextFontSizeVar})` : undefined,
            fontWeight: labelTextFontWeightVar ? `var(${labelTextFontWeightVar})` : undefined,
            letterSpacing: labelTextLetterSpacingVar ? `var(${labelTextLetterSpacingVar})` : undefined,
            lineHeight: labelTextLineHeightVar ? `var(${labelTextLineHeightVar})` : undefined,
            textDecoration: labelTextTextDecorationVar ? (readCssVar(labelTextTextDecorationVar) || 'none') : 'none',
            textTransform: labelTextTextTransformVar ? (readCssVar(labelTextTextTransformVar) || 'none') : 'none',
            fontStyle: labelTextFontStyleVar ? (readCssVar(labelTextFontStyleVar) || 'normal') : 'normal',
            color: `var(${layerTextColorVars.textColor})`,
            opacity: `var(${layerTextColorVars.highEmphasis})`,
          } as React.CSSProperties}>On</span>
        </label>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: `var(${labelSwitchGapVar}, 8px)` }}>
          <Switch checked={checked2} onChange={setChecked2} layer={layer as ComponentLayer} colorVariant={colorVariant} sizeVariant={sizeVariant} />
          <span style={{
            fontFamily: labelTextFontFamilyVar ? `var(${labelTextFontFamilyVar})` : undefined,
            fontSize: labelTextFontSizeVar ? `var(${labelTextFontSizeVar})` : undefined,
            fontWeight: labelTextFontWeightVar ? `var(${labelTextFontWeightVar})` : undefined,
            letterSpacing: labelTextLetterSpacingVar ? `var(${labelTextLetterSpacingVar})` : undefined,
            lineHeight: labelTextLineHeightVar ? `var(${labelTextLineHeightVar})` : undefined,
            textDecoration: labelTextTextDecorationVar ? (readCssVar(labelTextTextDecorationVar) || 'none') : 'none',
            textTransform: labelTextTextTransformVar ? (readCssVar(labelTextTextTransformVar) || 'none') : 'none',
            fontStyle: labelTextFontStyleVar ? (readCssVar(labelTextFontStyleVar) || 'normal') : 'normal',
            color: `var(${layerTextColorVars.textColor})`,
            opacity: `var(${layerTextColorVars.highEmphasis})`,
          } as React.CSSProperties}>Off</span>
        </label>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: `var(${labelSwitchGapVar}, 8px)` }}>
          <Switch checked={checked3} onChange={setChecked3} disabled layer={layer as ComponentLayer} colorVariant={colorVariant} sizeVariant={sizeVariant} />
          <span style={{
            fontFamily: labelTextFontFamilyVar ? `var(${labelTextFontFamilyVar})` : undefined,
            fontSize: labelTextFontSizeVar ? `var(${labelTextFontSizeVar})` : undefined,
            fontWeight: labelTextFontWeightVar ? `var(${labelTextFontWeightVar})` : undefined,
            letterSpacing: labelTextLetterSpacingVar ? `var(${labelTextLetterSpacingVar})` : undefined,
            lineHeight: labelTextLineHeightVar ? `var(${labelTextLineHeightVar})` : undefined,
            textDecoration: labelTextTextDecorationVar ? (readCssVar(labelTextTextDecorationVar) || 'none') : 'none',
            textTransform: labelTextTextTransformVar ? (readCssVar(labelTextTextTransformVar) || 'none') : 'none',
            fontStyle: labelTextFontStyleVar ? (readCssVar(labelTextFontStyleVar) || 'normal') : 'normal',
            color: `var(${layerTextColorVars.textColor})`,
            opacity: `var(${layerTextColorVars.lowEmphasis})`,
          } as React.CSSProperties}>Disabled</span>
        </label>
      </div>
    )
  }

  function CheckboxItemExamples({ layer }: { layer: string }) {
    const [checked1, setChecked1] = React.useState(false)
    const [checked2, setChecked2] = React.useState(true)
    const [checked3, setChecked3] = React.useState(false)
    const [checked4, setChecked4] = React.useState(false)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <CheckboxItem
          label="Checkbox item"
          checked={checked1}
          onChange={setChecked1}
          layer={layer as any}
        />
        <CheckboxItem
          label="Checked item"
          checked={checked2}
          onChange={setChecked2}
          layer={layer as any}
        />
        <CheckboxItem
          label="Disabled item"
          checked={checked3}
          onChange={setChecked3}
          disabled
          layer={layer as any}
        />
        <CheckboxItem
          label="Indeterminate item"
          checked={checked4}
          onChange={setChecked4}
          indeterminate
          layer={layer as any}
        />
      </div>
    )
  }

  function CheckboxGroupExample({ layer }: { layer: string }) {
    const [values, setValues] = React.useState({
      opt1: false,
      opt2: false,
      opt3: false
    })

    return (
      <div style={{ width: '100%', maxWidth: 400 }}>
        <CheckboxGroup
          label="Checkbox group"
          layer={layer as any}
          orientation="vertical"
        >
          <CheckboxItem
            label="Option 1"
            checked={values.opt1}
            onChange={(c) => setValues(p => ({ ...p, opt1: c }))}
            layer={layer as any}
          />
          <CheckboxItem
            label="Option 2"
            checked={values.opt2}
            onChange={(c) => setValues(p => ({ ...p, opt2: c }))}
            layer={layer as any}
          />
          <CheckboxItem
            label="Option 3"
            checked={values.opt3}
            onChange={(c) => setValues(p => ({ ...p, opt3: c }))}
            layer={layer as any}
          />
        </CheckboxGroup>
      </div>
    )
  }

  const base = 'https://www.recursica.com/docs/components'
  return [
    {
      name: 'Accordion',
      url: `${base}/accordion`,
      render: (selectedLayers: Set<LayerOption>) => {
        const layer = Array.from(selectedLayers)[0] || 'layer-0'
        const items = [
          { id: 'item-1', title: 'Accordion', content: 'Replace slot with content (component instance)', open: false, divider: true },
          { id: 'item-2', title: 'The quick brown fox jumps over the lazy dog, and as the fox gracefully landed on the other side, the lazy dog slowly opened one eye, yawned, and decided that perhaps today was the day to finally get up and chase after that clever fox who had been teasing him for so long', content: 'Replace slot with content (component instance)', open: false, divider: false },
        ]
        return (
          <div style={{ width: '100%', maxWidth: 520 }}>
            <Accordion items={items} layer={layer as any} allowMultiple />
          </div>
        )
      },
    },
    {
      name: 'Accordion item',
      url: `${base}/accordion-item`,
      render: (selectedLayers: Set<LayerOption>) => {
        const layer = Array.from(selectedLayers)[0] || 'layer-0'
        const { Accordion } = require('../../components/adapters/Accordion')

        return (
          <div style={{ width: '100%', maxWidth: 520 }}>
            <Accordion
              items={[
                {
                  id: 'item-1',
                  title: 'Accordion item',
                  content: 'This demonstrates AccordionItem properties. The header uses AccordionItem colors, padding, icon-size, and icon-gap. The content uses AccordionItem content-background, content-text, and content-padding.',
                  open: true,
                  divider: false
                },
              ]}
              layer={layer as any}
              allowMultiple={false}
            />
          </div>
        )
      },
    },
    {
      name: 'Assistive element',
      url: `${base}/assistive-element`,
      render: (selectedLayers: Set<LayerOption>) => {
        const layer = Array.from(selectedLayers)[0] || 'layer-0'
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
            <AssistiveElement
              variant="help"
              text="Help message"
              layer={layer as any}
            />
          </div>
        )
      },
    },
    {
      name: 'Text field',
      url: `${base}/text-field`,
      render: (selectedLayers: Set<LayerOption>) => {
        const layer = Array.from(selectedLayers)[0] || 'layer-0'
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
            <TextField
              label="Stacked"
              placeholder="Placeholder text"
              state="default"
              layout="stacked"
              layer={layer as any}
            />
            <TextField
              label="Side-by-side"
              placeholder="Placeholder text"
              state="default"
              layout="side-by-side"
              layer={layer as any}
            />
          </div>
        )
      },
    },
    {
      name: 'Avatar',
      url: `${base}/avatar`,
      render: (selectedLayers: Set<LayerOption>) => {
        const layer = Array.from(selectedLayers)[0] || 'layer-0'
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <Avatar
              colorVariant="text-ghost"
              sizeVariant="default"
              layer={layer as any}
              shape="circle"
              fallback="AB"
            />
          </div>
        )
      },
    },
    {
      name: 'Badge',
      url: `${base}/badge`,
      render: (_selectedLayers: Set<LayerOption>) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ background: `var(--recursica-brand-themes-${mode}-palettes-core-interactive-default-tone)`, color: `var(--recursica-brand-themes-${mode}-palettes-core-white)`, borderRadius: 999, padding: '2px 8px', fontSize: 12 }}>New</span>
          <span style={{ background: `var(--recursica-brand-themes-${mode}-palettes-core-warning)`, color: `var(--recursica-brand-themes-${mode}-palettes-core-white)`, borderRadius: 999, padding: '2px 8px', fontSize: 12 }}>Warn</span>
          <span style={{ background: `var(--recursica-brand-themes-${mode}-palettes-core-success)`, color: `var(--recursica-brand-themes-${mode}-palettes-core-white)`, borderRadius: 999, padding: '2px 8px', fontSize: 12 }}>Success</span>
        </div>
      ),
    },
    {
      name: 'Breadcrumb',
      url: `${base}/breadcrumb`,
      render: (selectedLayers: Set<LayerOption>) => {
        const layer = Array.from(selectedLayers)[0] || 'layer-0'
        return (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Breadcrumb
              items={[
                { label: 'Home', href: '#' },
                { label: 'Category', href: '#' },
                { label: 'Current Page' },
              ]}
              separator="slash"
              showHomeIcon={true}
              layer={layer as any}
            />
          </div>
        )
      },
    },
    {
      name: 'Button',
      url: `${base}/button`,
      render: (selectedLayers: Set<LayerOption>) => {
        const variants: Array<'solid' | 'outline' | 'text'> = ['solid', 'outline', 'text']
        const sizes: Array<'default' | 'small'> = ['default', 'small']
        const layers: LayerOption[] = sortLayers(Array.from(selectedLayers))

        return (
          <div style={{ display: 'grid', gap: 16 }}>
            {layers.map((layer) => {
              // Build CSS variable names for this layer's text color with high emphasis
              const layerBase = `--recursica-brand-${mode}-layers-${layer}-properties`
              const textColorVar = `${layerBase.replace('-properties', '-elements')}-text-color`
              const highEmphasisVar = `${layerBase.replace('-properties', '-elements')}-text-high-emphasis`

              return (
                <div key={layer} style={{ display: 'grid', gap: 12 }}>
                  <div style={{ display: 'grid', gap: 12 }}>
                    {variants.map((variant) => (
                      <div key={variant} style={{ display: 'grid', gap: 8 }}>
                        <h5 style={{
                          margin: 0,
                          fontFamily: 'var(--recursica-brand-typography-h5-font-family)',
                          fontSize: 'var(--recursica-brand-typography-h5-font-size)',
                          fontWeight: 'var(--recursica-brand-typography-h5-font-weight)',
                          letterSpacing: 'var(--recursica-brand-typography-h5-font-letter-spacing)',
                          lineHeight: 'var(--recursica-brand-typography-h5-line-height)',
                          color: `var(${textColorVar})`,
                          opacity: `var(${highEmphasisVar})`,
                          textTransform: 'capitalize'
                        }}>{variant}</h5>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                          {sizes.map((size) => (
                            <Button
                              key={`${variant}-${size}`}
                              variant={variant}
                              size={size}
                              layer={layer}
                            >
                              {variant} {size}
                            </Button>
                          ))}
                          {sizes.map((size) => (
                            <Button
                              key={`${variant}-${size}-icon`}
                              variant={variant}
                              size={size}
                              layer={layer}
                              icon={
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M5 12h14"></path>
                                  <path d="M12 5l7 7-7 7"></path>
                                </svg>
                              }
                            >
                              {variant} {size}
                            </Button>
                          ))}
                          <Button
                            variant={variant}
                            layer={layer}
                            disabled
                          >
                            {variant} disabled
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )
      },
    },
    {
      name: 'Date picker',
      url: `${base}/date-picker`,
      render: (_selectedLayers: Set<LayerOption>) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="date" />
          <input type="date" disabled />
        </div>
      ),
    },
    {
      name: 'Dropdown',
      url: `${base}/dropdown`,
      render: (selectedLayers: Set<LayerOption>) => {
        const layer = Array.from(selectedLayers)[0] || 'layer-0'
        const items = [
          { value: 'option1', label: 'Option 1' },
          { value: 'option2', label: 'Option 2' },
          { value: 'option3', label: 'Option 3' },
        ]
        return (
          <div style={{ width: '100%', maxWidth: 320 }}>
            <Dropdown
              label="Label"
              items={items}
              layer={layer as any}
              placeholder="Select option..."
            />
          </div>
        )
      },
    },
    {
      name: 'File input',
      url: `${base}/file-input`,
      render: (selectedLayers: Set<LayerOption>) => {
        const layer = Array.from(selectedLayers)[0] || 'layer-0'
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
            <FileInput
              label="Stacked"
              placeholder="Select file..."
              layer={layer as any}
              layout="stacked"
            />
            <FileInput
              label="Side-by-side"
              placeholder="Select file..."
              layer={layer as any}
              layout="side-by-side"
            />
            <FileInput
              label="Multiple (Chips)"
              placeholder="Select files..."
              multiple
              value={[new File([''], 'resume.pdf'), new File([''], 'cover-letter.docx')]}
              layer={layer as any}
              layout="stacked"
            />
          </div>
        )
      },
    },
    {
      name: 'File upload',
      url: `${base}/file-upload`,
      render: (selectedLayers: Set<LayerOption>) => {
        const layer = Array.from(selectedLayers)[0] || 'layer-0'
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
            <FileUpload
              label="Stacked"
              files={[]}
              layer={layer as any}
              layout="stacked"
            />
            <FileUpload
              label="Side-by-side"
              files={[]}
              layer={layer as any}
              layout="side-by-side"
            />
          </div>
        )
      },
    },
    {
      name: 'Hover card',
      url: `${base}/hover-card`,
      render: (_selectedLayers: Set<LayerOption>) => (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <span title="Extra information appears on hover" style={{ textDecoration: 'underline', cursor: 'help' }}>Hover me</span>
        </div>
      ),
    },
    {
      name: 'Label',
      url: `${base}/label`,
      render: (selectedLayers: Set<LayerOption>) => {
        const layer = Array.from(selectedLayers)[0] || 'layer-0'
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Label variant="default" layout="stacked" align="left" layer={layer as any} htmlFor="label-example-1">
              Label
            </Label>
            <Label variant="required" layout="stacked" align="left" layer={layer as any} htmlFor="label-example-2">
              Label
            </Label>
            <Label variant="optional" layout="stacked" align="left" layer={layer as any} htmlFor="label-example-3">
              Label
            </Label>
          </div>
        )
      },
    },
    {
      name: 'Link',
      url: `${base}/link`,
      render: (_selectedLayers: Set<LayerOption>) => (
        <div style={{ display: 'flex', gap: 12 }}>
          <a href="#">Default link</a>
          <a href="#" style={{ opacity: `var(--recursica-brand-themes-${mode}-state-disabled, 0.5)` }} aria-disabled>Disabled link</a>
        </div>
      ),
    },
    {
      name: 'Loader',
      url: `${base}/loader`,
      render: (_selectedLayers: Set<LayerOption>) => (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 16, height: 16, border: `2px solid var(--recursica-brand-themes-${mode}-layers-layer-1-properties-border-color)`, borderTopColor: `var(--recursica-brand-themes-${mode}-palettes-core-interactive-default-tone)`, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <style>
            {`@keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }`}
          </style>
          <span>Loading…</span>
        </div>
      ),
    },
    {
      name: 'Menu',
      url: `${base}/menu`,
      render: (_selectedLayers: Set<LayerOption>) => (
        <ul style={{ listStyle: 'none', padding: 8, margin: 0, width: 200, border: `1px solid var(--recursica-brand-themes-${mode}-layers-layer-1-properties-border-color)`, borderRadius: 8 }}>
          <li style={{ padding: 8 }}>Profile</li>
          <li style={{ padding: 8 }}>Settings</li>
          <li style={{ padding: 8, opacity: `var(--recursica-brand-themes-${mode}-state-disabled, 0.5)` }}>Disabled</li>
        </ul>
      ),
    },
    {
      name: 'Menu',
      url: `${base}/menu`,
      render: (selectedLayers: Set<LayerOption>) => {
        const layer = Array.from(selectedLayers)[0] || 'layer-0'
        const { Menu } = require('../../components/adapters/Menu')
        const { MenuItem } = require('../../components/adapters/MenuItem')
        const { iconNameToReactComponent } = require('../components/iconUtils')
        const ChevronRightIcon = iconNameToReactComponent('arrow-right')
        const FileIcon = iconNameToReactComponent('document-text')

        return (
          <Menu layer={layer as any}>
            <MenuItem
              variant="default"
              layer={layer as any}
              leadingIconType="none"
              trailingIcon={ChevronRightIcon ? <ChevronRightIcon /> : undefined}
              divider="bottom"
            >
              Menu item
            </MenuItem>
            <MenuItem
              variant="selected"
              layer={layer as any}
              leadingIcon={FileIcon ? <FileIcon /> : undefined}
              leadingIconType="icon"
              supportingText="Supporting value"
              selected={true}
              divider="bottom"
            >
              Menu item
            </MenuItem>
            <MenuItem
              variant="disabled"
              layer={layer as any}
              disabled={true}
              divider="bottom"
            >
              Menu item
            </MenuItem>
          </Menu>
        )
      },
    },
    {
      name: 'Menu item',
      url: `${base}/menu-item`,
      render: (selectedLayers: Set<LayerOption>) => {
        const layer = Array.from(selectedLayers)[0] || 'layer-0'
        const { MenuItem } = require('../../components/adapters/MenuItem')
        const { iconNameToReactComponent } = require('../components/iconUtils')
        const ChevronRightIcon = iconNameToReactComponent('arrow-right')

        return (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            width: '100%',
            maxWidth: '464px',
            padding: '8px',
            background: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
          }}>
            <MenuItem
              variant="default"
              layer={layer as any}
              leadingIconType="none"
              trailingIcon={ChevronRightIcon ? <ChevronRightIcon /> : undefined}
              divider="bottom"
            >
              Menu item
            </MenuItem>
            <MenuItem
              variant="selected"
              layer={layer as any}
              leadingIconType="icon"
              supportingText="Supporting value"
              selected={true}
              divider="bottom"
            >
              Menu item
            </MenuItem>
            <MenuItem
              variant="disabled"
              layer={layer as any}
              disabled={true}
              divider="bottom"
            >
              Menu item
            </MenuItem>
          </div>
        )
      },
    },
    {
      name: 'Modal',
      url: `${base}/modal`,
      render: (_selectedLayers: Set<LayerOption>) => {
        const layer1Elevation = getLayerElevationBoxShadow(mode, 'layer-1')
        return (
          <div style={{
            border: `1px solid var(--recursica-brand-themes-${mode}-layers-layer-1-properties-border-color)`,
            padding: 12,
            borderRadius: 8,
            background: `var(--recursica-brand-themes-${mode}-layers-layer-0-properties-surface)`,
            boxShadow: layer1Elevation || undefined
          }}>
            <strong>Modal</strong>
            <div style={{ fontSize: 12, opacity: 0.75 }}>Header, body, actions</div>
          </div>
        )
      },
    },
    {
      name: 'Card',
      url: `${base}/card`,
      render: (_selectedLayers: Set<LayerOption>) => {
        const layer1Elevation = getLayerElevationBoxShadow(mode, 'layer-1')
        const layer2Elevation = getLayerElevationBoxShadow(mode, 'layer-2')
        return (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{
              width: 240,
              border: `1px solid var(--recursica-brand-themes-${mode}-layers-layer-1-properties-border-color)`,
              borderRadius: 8,
              padding: 12,
              boxShadow: layer1Elevation || undefined
            }}>
              <strong>Card Title</strong>
              <p style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>This card uses layer-1 elevation.</p>
              <a href="#" style={{ fontSize: 12 }}>Learn more</a>
            </div>
            <div style={{
              width: 240,
              border: `1px solid var(--recursica-brand-themes-${mode}-layers-layer-1-properties-border-color)`,
              borderRadius: 8,
              padding: 12,
              boxShadow: layer2Elevation || undefined
            }}>
              <strong>Higher Elevation</strong>
              <p style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>This card uses layer-2 elevation.</p>
            </div>
          </div>
        )
      },
    },
    {
      name: 'Checkbox',
      url: `${base}/checkbox`,
      render: (_selectedLayers: Set<LayerOption>) => (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <label><input type="checkbox" defaultChecked /> Checked</label>
          <label><input type="checkbox" /> Unchecked</label>
          <label><input type="checkbox" disabled /> Disabled</label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" ref={(el) => { if (el) el.indeterminate = true }} /> Indeterminate
          </label>
        </div>
      ),
    },
    {
      name: 'Checkbox item',
      url: `${base}/checkbox-group-item`,
      render: (selectedLayers: Set<LayerOption>) => {
        const layer = Array.from(selectedLayers)[0] || 'layer-0'
        return <CheckboxItemExamples layer={layer} />
      },
    },
    {
      name: 'Checkbox',
      url: `${base}/checkbox-group`,
      render: (selectedLayers: Set<LayerOption>) => {
        const layer = Array.from(selectedLayers)[0] || 'layer-0'
        return <CheckboxGroupExample layer={layer} />
      },
    },
    {
      name: 'Chip',
      url: `${base}/chip`,
      render: (_selectedLayers: Set<LayerOption>) => (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ border: `1px solid var(--recursica-brand-themes-${mode}-layers-layer-1-properties-border-color)`, borderRadius: 999, padding: '2px 10px' }}>Default Chip</span>
          <span style={{ border: `1px solid var(--recursica-brand-themes-${mode}-layers-layer-1-properties-border-color)`, borderRadius: 999, padding: '2px 10px', cursor: 'pointer' }}>Clickable</span>
          <span style={{ border: `1px solid var(--recursica-brand-themes-${mode}-layers-layer-1-properties-border-color)`, borderRadius: 999, padding: '2px 10px' }}>Deletable ✕</span>
          <span style={{ background: `var(--recursica-brand-themes-${mode}-palettes-core-interactive-default-tone)`, color: `var(--recursica-brand-themes-${mode}-palettes-core-white)`, borderRadius: 999, padding: '2px 10px' }}>Primary</span>
          <span style={{ border: `1px solid var(--recursica-brand-themes-${mode}-palettes-core-interactive-default-tone)`, color: `var(--recursica-brand-themes-${mode}-palettes-core-interactive-default-tone)`, borderRadius: 999, padding: '2px 10px' }}>Secondary Outlined</span>
        </div>
      ),
    },
    {
      name: 'Divider',
      url: `${base}`,
      render: (_selectedLayers: Set<LayerOption>) => (
        <div>
          <div style={{ padding: 8 }}>Text above divider.</div>
          <hr />
          <div style={{ padding: 8 }}>Text below divider.</div>
        </div>
      ),
    },
    {
      name: 'List',
      url: `${base}`,
      render: (_selectedLayers: Set<LayerOption>) => (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, width: 300 }}>
          <li style={{ padding: 10, border: '1px solid var(--layers-layer-1-properties-border-color)', borderRadius: 8, marginBottom: 6 }}>
            <div>List item 1</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>Secondary text</div>
          </li>
          <li style={{ padding: 10, border: '1px solid var(--layers-layer-1-properties-border-color)', borderRadius: 8, marginBottom: 6 }}>
            <div>List item 2</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>Secondary text</div>
          </li>
          <li style={{ padding: 10, border: '1px solid var(--layers-layer-1-properties-border-color)', borderRadius: 8, opacity: `var(--recursica-brand-themes-${mode}-state-disabled, 0.5)` }}>
            Disabled item
          </li >
        </ul >
      ),
    },
    {
      name: 'Number input',
      url: `${base}/number-input`,
      render: (selectedLayers: Set<LayerOption>) => {
        const layer = Array.from(selectedLayers)[0] || 'layer-0'
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
            <NumberInput
              label="Label"
              placeholder="Enter a number"
              helpText="Help message"
              state="default"
              layout="stacked"
              layer={layer as any}
              min={0}
              max={100}
              step={1}
            />
          </div>
        )
      },
    },
    {
      name: 'Pagination',
      url: `${base}/pagination`,
      render: (_selectedLayers: Set<LayerOption>) => (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button>{'<'}</button>
          {[1, 2, 3, 4, 5].map((p) => (
            <button key={p} style={{ padding: '4px 8px', borderRadius: 6, background: p === 2 ? `var(--recursica-brand-themes-${mode}-palettes-core-interactive-default-tone)` : undefined, color: p === 2 ? `var(--recursica-brand-themes-${mode}-palettes-core-white)` : undefined }}>{p}</button>
          ))}
          <button>{'>'}</button>
        </div>
      ),
    },
    {
      name: 'Panel',
      url: `${base}/panel`,
      render: (_selectedLayers: Set<LayerOption>) => (
        <div style={{ display: 'flex', height: 80, border: `1px solid var(--recursica-brand-themes-${mode}-layers-layer-1-properties-border-color)`, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ flex: 1, background: `var(--recursica-brand-themes-${mode}-layers-layer-0-properties-surface)`, padding: 8, fontSize: 10, opacity: 0.5 }}>Main</div>
          <div style={{ width: 80, borderLeft: `1px solid var(--recursica-brand-themes-${mode}-layers-layer-1-properties-border-color)`, background: `var(--recursica-brand-themes-${mode}-layers-layer-1-properties-surface)`, padding: 6, fontSize: 10 }}>
            <strong style={{ fontSize: 9 }}>Panel</strong>
            <div style={{ marginTop: 4, opacity: 0.6, fontSize: 8 }}>Content</div>
          </div>
        </div>
      ),
    },
    {
      name: 'Popover',
      url: `${base}/popover`,
      render: (_selectedLayers: Set<LayerOption>) => (
        <div title="Popover content" style={{ display: 'inline-block', border: '1px solid var(--layers-layer-1-properties-border-color)', padding: '6px 10px', borderRadius: 6, cursor: 'help' }}>Hover for popover</div>
      ),
    },
    {
      name: 'Radio',
      url: `${base}/radio`,
      render: (_selectedLayers: Set<LayerOption>) => (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <label><input type="radio" name="r1" defaultChecked /> First</label>
          <label><input type="radio" name="r1" /> Second</label>
          <label style={{ opacity: `var(--recursica-brand-themes-${mode}-state-disabled, 0.5)` }}><input type="radio" name="r1" disabled /> Disabled</label>
        </div>
      ),
    },
    {
      name: 'Read only field',
      url: `${base}/read-only-field`,
      render: (_selectedLayers: Set<LayerOption>) => (
        <div style={{ display: 'grid', gap: 8, width: 320 }}>
          <input value="Read-only value" readOnly style={{ padding: 8, borderRadius: 6, border: '1px solid var(--layers-layer-1-properties-border-color)' }} />
        </div>
      ),
    },
    {
      name: 'Search',
      url: `${base}/search`,
      render: (_selectedLayers: Set<LayerOption>) => (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input placeholder="Search…" style={{ padding: 8, borderRadius: 6, border: '1px solid var(--layers-layer-1-properties-border-color)' }} />
          <button>Go</button>
        </div>
      ),
    },
    {
      name: 'Segmented control',
      url: `${base}/segmented-control`,
      render: (_selectedLayers: Set<LayerOption>) => (
        <div style={{ display: 'inline-flex', border: '1px solid var(--layers-layer-1-properties-border-color)', borderRadius: 999, overflow: 'hidden' }}>
          <button style={{ padding: '6px 10px', background: `var(--recursica-brand-themes-${mode}-palettes-core-interactive-default-tone)`, color: `var(--recursica-brand-themes-${mode}-palettes-core-white)`, border: 0 }}>First</button>
          <button style={{ padding: '6px 10px', border: 0 }}>Second</button>
          <button style={{ padding: '6px 10px', border: 0 }}>Third</button>
        </div>
      ),
    },
    {
      name: 'Segmented control item',
      url: `${base}/segmented-control-item`,
      render: (selectedLayers: Set<LayerOption>) => {
        const layer = Array.from(selectedLayers)[0] || 'layer-0'
        const { SegmentedControl } = require('../../components/adapters/SegmentedControl')
        const { iconNameToReactComponent } = require('../components/iconUtils')
        const HouseIcon = iconNameToReactComponent('house')
        const SlidersIcon = iconNameToReactComponent('sliders-horizontal')
        const UserIcon = iconNameToReactComponent('user')

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', alignItems: 'center' }}>
            <SegmentedControl
              items={[
                { value: 'first', label: 'First', icon: HouseIcon ? <HouseIcon size={16} /> : undefined },
                { value: 'second', label: 'Second', icon: SlidersIcon ? <SlidersIcon size={16} /> : undefined },
                { value: 'third', label: 'Third', icon: UserIcon ? <UserIcon size={16} /> : undefined },
              ]}
              value="first"
              onChange={() => { }}
              orientation="horizontal"
              fullWidth={false}
              layer={layer as any}
            />
          </div>
        )
      },
    },
    {
      name: 'Slider',
      url: `${base}/slider`,
      render: (selectedLayers: Set<LayerOption>) => {
        const layer = selectedLayers.size > 0
          ? Array.from(selectedLayers)[0] as string
          : 'layer-0'

        return (
          <Slider
            value={25}
            onChange={() => { }}
            min={0}
            max={100}
            layer={layer as any}
            layout="stacked"
            showInput={false}
            showValueLabel={true}
            valueLabel={(val) => `${val}`}
          />
        )
      },
    },
    {
      name: 'Stepper',
      url: `${base}/stepper`,
      render: (_selectedLayers: Set<LayerOption>) => (
        <ol style={{ display: 'flex', gap: 12, listStyle: 'none', padding: 0 }}>
          {['One', 'Two', 'Three'].map((s, i) => (
            <li key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 24, height: 24, borderRadius: '50%', background: i === 1 ? `var(--recursica-brand-themes-${mode}-palettes-core-interactive-default-tone)` : `var(--recursica-brand-themes-${mode}-palettes-neutral-300-tone)`, color: `var(--recursica-brand-themes-${mode}-palettes-core-white)`, display: 'grid', placeItems: 'center', fontSize: 12 }}>{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      ),
    },
    {
      name: 'Switch',
      url: `${base}/switch`,
      render: (selectedLayers: Set<LayerOption>) => {
        // Extract layer from selectedLayers Set (use first one, or default to layer-0)
        const layer = selectedLayers.size > 0
          ? Array.from(selectedLayers)[0] as string
          : 'layer-0'

        // Use default variants - the toolbar will update the CSS vars for the selected variant
        return <SwitchExamples layer={layer} colorVariant="default" sizeVariant="default" />
      },
    },
    {
      name: 'Tabs',
      url: `${base}/tabs`,
    },
    {
      name: 'Text field',
      url: `${base}/text-field`,
      render: (_selectedLayers: Set<LayerOption>) => (
        <div style={{ display: 'grid', gap: 8, width: 320 }}>
          <input placeholder="Default" style={{ padding: 8, borderRadius: 6, border: '1px solid var(--layers-layer-1-properties-border-color)' }} />
          <input placeholder="Disabled" disabled style={{ padding: 8, borderRadius: 6, border: '1px solid var(--layers-layer-1-properties-border-color)' }} />
          <textarea placeholder="Text area" rows={3} style={{ padding: 8, borderRadius: 6, border: '1px solid var(--layers-layer-1-properties-border-color)' }} />
        </div>
      ),
    },
    {
      name: 'Time picker',
      url: `${base}/time-picker`,
      render: (_selectedLayers: Set<LayerOption>) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="time" />
          <input type="time" disabled />
        </div>
      ),
    },
    {
      name: 'Timeline',
      url: `${base}/timeline`,
      render: (_selectedLayers: Set<LayerOption>) => (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {[['08:00', 'Start'], ['10:30', 'Checkpoint'], ['13:00', 'Finish']].map(([t, l], i) => (
            <li key={t} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: i === 2 ? 'var(--layer-palettes-core-success)' : 'var(--layer-palettes-core-interactive-default-tone)' }} />
              <span style={{ width: 60, opacity: 0.7 }}>{t}</span>
              <span>{l}</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      name: 'Toast',
      url: `${base}/toast`,
      render: (selectedLayers: Set<LayerOption>) => {
        const layers = sortLayers(Array.from(selectedLayers))
        const layer = layers[0] || 'layer-0'

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 600 }}>
            <Toast variant="default" layer={layer as any}>
              Default toast message
            </Toast>
            <Toast variant="success" layer={layer as any} icon={<span>✓</span>} onClose={() => { }}>
              Success toast message
            </Toast>
            <Toast variant="error" layer={layer as any} icon={<span>✕</span>} onClose={() => { }}>
              Error toast message
            </Toast>
          </div>
        )
      },
    },
    {
      name: 'Tooltip',
      url: `${base}/tooltip`,
      render: (selectedLayers: Set<LayerOption>) => {
        const layer = sortLayers(Array.from(selectedLayers))[0] || 'layer-0'
        return (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 150,
            padding: '100px 60px',
            width: '100%',
            maxWidth: 600,
            justifyItems: 'center'
          }}>
            <Tooltip label="A default goblin, centered and above." position="top" alignment="middle" layer={layer as any} opened={true}>
              <button style={{ padding: '8px 16px' }}>Default</button>
            </Tooltip>

            <Tooltip label="A curious goblin peeks from the shadows, eyes gleaming with mischief." position="top" alignment="start" layer={layer as any} opened={true}>
              <button style={{ padding: '8px 16px' }}>Top Start</button>
            </Tooltip>

            <Tooltip label="Be wary of the goblin's traps." position="left" alignment="start" layer={layer as any} opened={true}>
              <button style={{ padding: '8px 16px' }}>Left Top</button>
            </Tooltip>

            <Tooltip label="Goblins love shiny trinkets." position="right" alignment="end" layer={layer as any} opened={true}>
              <button style={{ padding: '8px 16px' }}>Right Bottom</button>
            </Tooltip>


            <Tooltip label="Sneaky goblin nearby." position="bottom" alignment="end" layer={layer as any} opened={true}>
              <button style={{ padding: '8px 16px' }}>Bottom End</button>
            </Tooltip>

          </div>
        )
      },
    },
    {
      name: 'Transfer list',
      url: `${base}/transfer-list`,
      render: (_selectedLayers: Set<LayerOption>) => (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center' }}>
          <ul style={{ border: '1px solid var(--layers-layer-1-properties-border-color)', borderRadius: 6, padding: 8, margin: 0, listStyle: 'none' }}>
            <li>Alpha</li>
            <li>Bravo</li>
            <li>Charlie</li>
          </ul>
          <div style={{ display: 'grid', gap: 6 }}>
            <button>{'>'}</button>
            <button>{'<'}</button>
          </div>
          <ul style={{ border: '1px solid var(--layers-layer-1-properties-border-color)', borderRadius: 6, padding: 8, margin: 0, listStyle: 'none' }}>
            <li>Delta</li>
            <li>Echo</li>
          </ul>
        </div>
      ),
    },
  ]
    .sort((a, b) => a.name.localeCompare(b.name))
}
