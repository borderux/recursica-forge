import React from 'react'
import { Button } from '../../components/adapters/Button'
import { Switch } from '../../components/adapters/Switch'
import { Avatar } from '../../components/adapters/Avatar'
import { Toast } from '../../components/adapters/Toast'
import { Label } from '../../components/adapters/Label'
import { AssistiveElement } from '../../components/adapters/AssistiveElement'
import { TextField } from '../../components/adapters/TextField'
import { TimePicker } from '../../components/adapters/TimePicker'
import { Textarea } from '../../components/adapters/Textarea'
import { NumberInput } from '../../components/adapters/NumberInput'
import { Breadcrumb } from '../../components/adapters/Breadcrumb'
import { Slider } from '../../components/adapters/Slider'
import { Accordion } from '../../components/adapters/Accordion'
import { CheckboxItem } from '../../components/adapters/CheckboxItem'
import { Loader } from '../../components/adapters/Loader'
import { CheckboxGroup } from '../../components/adapters/CheckboxGroup'
import { RadioButtonItem } from '../../components/adapters/RadioButtonItem'
import { RadioButtonGroup } from '../../components/adapters/RadioButtonGroup'
import { Dropdown } from '../../components/adapters/Dropdown'
import { Autocomplete } from '../../components/adapters/Autocomplete'
import { Tooltip } from '../../components/adapters/Tooltip'
import { Link } from '../../components/adapters/Link'
import { Menu } from '../../components/adapters/Menu'
import { MenuItem } from '../../components/adapters/MenuItem'
import { SegmentedControl } from '../../components/adapters/SegmentedControl'
import { iconNameToReactComponent } from '../components/iconUtils'
import { FileInput } from '../../components/adapters/FileInput'
import { FileUpload } from '../../components/adapters/FileUpload'
import { Pagination } from '../../components/adapters/Pagination'
import { TransferList } from '../../components/adapters/TransferList'
import { DatePicker } from '../../components/adapters/DatePicker'
import { Timeline } from '../../components/adapters/Timeline'
import { getComponentCssVar, getComponentTextCssVar } from '../../components/utils/cssVarNames'
import { getLayerElevationBoxShadow } from '../../components/utils/brandCssVars'
import { readCssVar } from '../../core/css/readCssVar'
import type { ComponentLayer } from '../../components/registry/types'
import { genericLayerProperty } from '../../core/css/cssVarBuilder'

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
      const layerBase = `--recursica_brand_layer_${layer}_properties`

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
    const [checked5, setChecked5] = React.useState(false)

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
        <CheckboxItem
          label="A curious goblin crept through the moonlit forest, clutching a handful of stolen trinkets that sparkled like tiny stars, all the while muttering about the great treasure map he'd found tucked inside an old boot at the bottom of the river"
          checked={checked5}
          onChange={setChecked5}
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

  function RadioButtonItemExamples({ layer }: { layer: string }) {
    const [selected, setSelected] = React.useState('option2')

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <RadioButtonItem
          label="Goblin war axe"
          value="option1"
          selected={selected === 'option1'}
          onChange={() => setSelected('option1')}
          layer={layer as any}
        />
        <RadioButtonItem
          label="Obsidian dagger"
          value="option2"
          selected={selected === 'option2'}
          onChange={() => setSelected('option2')}
          layer={layer as any}
        />
        <RadioButtonItem
          label="Forbidden blade"
          value="option3"
          selected={false}
          onChange={() => { }}
          disabled
          layer={layer as any}
        />
        <RadioButtonItem
          label="Deep in the enchanted caverns beneath the goblin king's throne, a rebellious young goblin discovered an ancient spell book bound in dragon leather, and upon reading the first incantation aloud, accidentally turned every torch in the kingdom bright pink"
          value="option4"
          selected={selected === 'option4'}
          onChange={() => setSelected('option4')}
          layer={layer as any}
        />
      </div>
    )
  }

  function RadioButtonGroupExample({ layer }: { layer: string }) {
    const [selected1, setSelected1] = React.useState('opt1')
    const [selected2, setSelected2] = React.useState('opt1')

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>
        <h2 style={{ margin: 0, fontFamily: 'var(--recursica_brand_typography_h2-font-family)', fontSize: 'var(--recursica_brand_typography_h2-font-size)', fontWeight: 'var(--recursica_brand_typography_h2-font-weight)', letterSpacing: 'var(--recursica_brand_typography_h2-font-letter-spacing)', lineHeight: 'var(--recursica_brand_typography_h2-line-height)' }}>Stacked</h2>
        <RadioButtonGroup
          label="Forge Weapon"
          layout="stacked"
          layer={layer as any}
          orientation="vertical"
        >
          <RadioButtonItem
            label="Obsidian Hammer"
            value="opt1"
            selected={selected1 === 'opt1'}
            onChange={() => setSelected1('opt1')}
            layer={layer as any}
          />
          <RadioButtonItem
            label="Runic Longsword"
            value="opt2"
            selected={selected1 === 'opt2'}
            onChange={() => setSelected1('opt2')}
            layer={layer as any}
          />
          <RadioButtonItem
            label="Crystal Spear"
            value="opt3"
            selected={selected1 === 'opt3'}
            onChange={() => setSelected1('opt3')}
            layer={layer as any}
          />
        </RadioButtonGroup>
        <h2 style={{ margin: 0, fontFamily: 'var(--recursica_brand_typography_h2-font-family)', fontSize: 'var(--recursica_brand_typography_h2-font-size)', fontWeight: 'var(--recursica_brand_typography_h2-font-weight)', letterSpacing: 'var(--recursica_brand_typography_h2-font-letter-spacing)', lineHeight: 'var(--recursica_brand_typography_h2-line-height)' }}>Side-by-side</h2>
        <RadioButtonGroup
          label="Forge Weapon"
          layout="side-by-side"
          layer={layer as any}
          orientation="vertical"
        >
          <RadioButtonItem
            label="Obsidian Hammer"
            value="opt1"
            selected={selected2 === 'opt1'}
            onChange={() => setSelected2('opt1')}
            layer={layer as any}
          />
          <RadioButtonItem
            label="Runic Longsword"
            value="opt2"
            selected={selected2 === 'opt2'}
            onChange={() => setSelected2('opt2')}
            layer={layer as any}
          />
          <RadioButtonItem
            label="Crystal Spear"
            value="opt3"
            selected={selected2 === 'opt3'}
            onChange={() => setSelected2('opt3')}
            layer={layer as any}
          />
        </RadioButtonGroup>
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
          <span style={{ background: `var(--recursica_brand_palettes_core_interactive_default_color_tone)`, color: `var(--recursica_brand_palettes_core_white)`, borderRadius: 999, padding: '2px 8px', fontSize: 12 }}>New</span>
          <span style={{ background: `var(--recursica_brand_palettes_core_warning)`, color: `var(--recursica_brand_palettes_core_white)`, borderRadius: 999, padding: '2px 8px', fontSize: 12 }}>Warn</span>
          <span style={{ background: `var(--recursica_brand_palettes_core_success)`, color: `var(--recursica_brand_palettes_core_white)`, borderRadius: 999, padding: '2px 8px', fontSize: 12 }}>Success</span>
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
              const layerBase = `--recursica_brand_${mode}-layers-${layer}-properties`
              const textColorVar = `${layerBase.replace('-properties', '-elements')}-text-color`
              const highEmphasisVar = `${layerBase.replace('-properties', '-elements')}-text-high-emphasis`

              return (
                <div key={layer} style={{ display: 'grid', gap: 12 }}>
                  <div style={{ display: 'grid', gap: 12 }}>
                    {variants.map((variant) => (
                      <div key={variant} style={{ display: 'grid', gap: 8 }}>
                        <h5 style={{
                          margin: 0,
                          fontFamily: 'var(--recursica_brand_typography_h5-font-family)',
                          fontSize: 'var(--recursica_brand_typography_h5-font-size)',
                          fontWeight: 'var(--recursica_brand_typography_h5-font-weight)',
                          letterSpacing: 'var(--recursica_brand_typography_h5-font-letter-spacing)',
                          lineHeight: 'var(--recursica_brand_typography_h5-line-height)',
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
      render: (selectedLayers: Set<LayerOption>) => {
        const layer = Array.from(selectedLayers)[0] || 'layer-0'
        return (
          <div style={{ width: '100%', maxWidth: 320 }}>
            <DatePicker
              label="Label"
              placeholder="MM / DD / YY"
              layout="stacked"
              layer={layer as any}
            />
          </div>
        )
      },
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
      name: 'Hover card / Popover',
      url: `${base}/hover-card`,
      render: (_selectedLayers: Set<LayerOption>) => {
        const layer1Elevation = getLayerElevationBoxShadow(mode, 'layer-1')
        return (
          <div style={{
            border: `1px solid var(${genericLayerProperty(1, 'border-color')})`,
            padding: 12,
            borderRadius: 8,
            background: `var(${genericLayerProperty(0, 'surface')})`,
            boxShadow: layer1Elevation || undefined
          }}>
            <strong>Hover card / Popover</strong>
            <div style={{ fontSize: 12, opacity: 0.75 }}>Content, beak, elevation</div>
          </div>
        )
      },
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
      render: (selectedLayers: Set<LayerOption>) => {
        const layer = Array.from(selectedLayers)[0] || 'layer-0'
        const ArrowUpRightIcon = iconNameToReactComponent('arrow-top-right-on-square')

        return (
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <Link href="#" layer={layer as any}>Link</Link>
            <Link href="#" layer={layer as any} startIcon={ArrowUpRightIcon ? <ArrowUpRightIcon /> : undefined}>Link</Link>
            <Link href="#" layer={layer as any} endIcon={ArrowUpRightIcon ? <ArrowUpRightIcon /> : undefined}>Link</Link>
          </div>
        )
      },
    },
    {
      name: 'Loader',
      url: `${base}/loader`,
      render: (_selectedLayers: Set<LayerOption>) => (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Loader size="default" />
        </div>
      ),
    },
    {
      name: 'Menu',
      url: `${base}/menu`,
      render: (_selectedLayers: Set<LayerOption>) => (
        <ul style={{ listStyle: 'none', padding: 8, margin: 0, width: 200, border: `1px solid var(${genericLayerProperty(1, 'border-color')})`, borderRadius: 8 }}>
          <li style={{ padding: 8 }}>Profile</li>
          <li style={{ padding: 8 }}>Settings</li>
          <li style={{ padding: 8, opacity: `var(--recursica_brand_states_disabled, 0.5)` }}>Disabled</li>
        </ul>
      ),
    },
    {
      name: 'Menu',
      url: `${base}/menu`,
      render: (selectedLayers: Set<LayerOption>) => {
        const layer = Array.from(selectedLayers)[0] || 'layer-0'
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
            border: `1px solid var(${genericLayerProperty(1, 'border-color')})`,
            padding: 12,
            borderRadius: 8,
            background: `var(${genericLayerProperty(0, 'surface')})`,
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
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
            <span>Card preview</span>
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
      name: 'Checkbox group item',
      url: `${base}/checkbox-group-item`,
      render: (selectedLayers: Set<LayerOption>) => {
        const layer = Array.from(selectedLayers)[0] || 'layer-0'
        return <CheckboxItemExamples layer={layer} />
      },
    },
    {
      name: 'Checkbox group',
      url: `${base}/checkbox-group`,
      render: (selectedLayers: Set<LayerOption>) => {
        const layer = Array.from(selectedLayers)[0] || 'layer-0'
        return <CheckboxGroupExample layer={layer} />
      },
    },
    {
      name: 'Radio button group item',
      url: `${base}/radio-button-group-item`,
      render: (selectedLayers: Set<LayerOption>) => {
        const layer = Array.from(selectedLayers)[0] || 'layer-0'
        return <RadioButtonItemExamples layer={layer} />
      },
    },
    {
      name: 'Radio button group',
      url: `${base}/radio-button-group`,
      render: (selectedLayers: Set<LayerOption>) => {
        const layer = Array.from(selectedLayers)[0] || 'layer-0'
        return <RadioButtonGroupExample layer={layer} />
      },
    },
    {
      name: 'Chip',
      url: `${base}/chip`,
      render: (_selectedLayers: Set<LayerOption>) => (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ border: `1px solid var(${genericLayerProperty(1, 'border-color')})`, borderRadius: 999, padding: '2px 10px' }}>Default Chip</span>
          <span style={{ border: `1px solid var(${genericLayerProperty(1, 'border-color')})`, borderRadius: 999, padding: '2px 10px', cursor: 'pointer' }}>Clickable</span>
          <span style={{ border: `1px solid var(${genericLayerProperty(1, 'border-color')})`, borderRadius: 999, padding: '2px 10px' }}>Deletable ✕</span>
          <span style={{ background: `var(--recursica_brand_palettes_core_interactive_default_color_tone)`, color: `var(--recursica_brand_palettes_core_white)`, borderRadius: 999, padding: '2px 10px' }}>Primary</span>
          <span style={{ border: `1px solid var(--recursica_brand_palettes_core_interactive_default_color_tone)`, color: `var(--recursica_brand_palettes_core_interactive_default_color_tone)`, borderRadius: 999, padding: '2px 10px' }}>Secondary Outlined</span>
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
          <li style={{ padding: 10, border: '1px solid var(--layers-layer-1-properties-border-color)', borderRadius: 8, opacity: `var(--recursica_brand_states_disabled, 0.5)` }}>
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
      render: (selectedLayers: Set<LayerOption>) => {
        const layer = Array.from(selectedLayers)[0] || 'layer-0'
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
            <Pagination
              total={8}
              defaultValue={3}
              withEdges={true}
              layer={layer as any}
            />
          </div>
        )
      },
    },
    {
      name: 'Panel',
      url: `${base}/panel`,
      render: (_selectedLayers: Set<LayerOption>) => (
        <div style={{ display: 'flex', height: 80, border: `1px solid var(${genericLayerProperty(1, 'border-color')})`, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ flex: 1, background: `var(${genericLayerProperty(0, 'surface')})`, padding: 8, fontSize: 10, opacity: 0.5 }}>Main</div>
          <div style={{ width: 80, borderLeft: `1px solid var(${genericLayerProperty(1, 'border-color')})`, background: `var(${genericLayerProperty(1, 'surface')})`, padding: 6, fontSize: 10 }}>
            <strong style={{ fontSize: 9 }}>Panel</strong>
            <div style={{ marginTop: 4, opacity: 0.6, fontSize: 8 }}>Content</div>
          </div>
        </div>
      ),
    },

    {
      name: 'Radio',
      url: `${base}/radio`,
      render: (_selectedLayers: Set<LayerOption>) => (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <label><input type="radio" name="r1" defaultChecked /> First</label>
          <label><input type="radio" name="r1" /> Second</label>
          <label style={{ opacity: `var(--recursica_brand_states_disabled, 0.5)` }}><input type="radio" name="r1" disabled /> Disabled</label>
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
      name: 'Autocomplete',
      url: `${base}/autocomplete`,
      render: (selectedLayers: Set<LayerOption>) => {
        const layer = Array.from(selectedLayers)[0] || 'layer-0'
        const items = [
          { value: 'forge-hammer', label: 'Forge Hammer' },
          { value: 'goblin-pickaxe', label: 'Goblin Pickaxe' },
          { value: 'enchanted-anvil', label: 'Enchanted Anvil' },
        ]
        return (
          <div style={{ width: '100%', maxWidth: 320 }}>
            <Autocomplete
              label="Forge Tool"
              items={items}
              layer={layer as any}
              placeholder="Search goblin forge tools..."
            />
          </div>
        )
      },
    },
    {
      name: 'Segmented control',
      url: `${base}/segmented-control`,
      render: (_selectedLayers: Set<LayerOption>) => (
        <div style={{ display: 'inline-flex', border: '1px solid var(--layers-layer-1-properties-border-color)', borderRadius: 999, overflow: 'hidden' }}>
          <button style={{ padding: '6px 10px', background: `var(--recursica_brand_palettes_core_interactive_default_color_tone)`, color: `var(--recursica_brand_palettes_core_white)`, border: 0 }}>First</button>
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
              <span style={{ width: 24, height: 24, borderRadius: '50%', background: i === 1 ? `var(--recursica_brand_palettes_core_interactive_default_color_tone)` : `var(--recursica_brand_palettes_neutral_300_color_tone)`, color: `var(--recursica_brand_palettes_core_white)`, display: 'grid', placeItems: 'center', fontSize: 12 }}>{i + 1}</span>
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
      name: 'Textarea',
      url: `${base}/textarea`,
      render: (selectedLayers: Set<LayerOption>) => {
        const layer = Array.from(selectedLayers)[0] || 'layer-0'
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
            <Textarea
              label="Label"
              placeholder="Enter text..."
              helpText="Help message"
              state="default"
              layout="stacked"
              layer={layer as any}
            />
          </div>
        )
      },
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
          <span>Timeline preview</span>
        </div>
      ),
    },
    {
      name: 'Timeline bullet',
      url: `${base}/timeline-bullet`,
      render: (selectedLayers: Set<LayerOption>) => {
        const layer = Array.from(selectedLayers)[0] || 'layer-0'
        return (
          <div style={{ display: 'flex', justifyContent: 'flex-start', minHeight: 200, padding: 16 }}>
            <Timeline
              active={0}
              align="left"
              layer={layer}
              items={[
                { title: 'Active' },
                { title: 'Inactive' },
              ]}
            />
          </div>
        )
      },
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
      render: (selectedLayers: Set<LayerOption>) => {
        const layer = Array.from(selectedLayers)[0] || 'layer-0'
        return (
          <div style={{ width: '100%', maxWidth: 600 }}>
            <TransferList
              sourceLabel="Available"
              targetLabel="Selected"
              defaultData={[
                [
                  { value: 'alpha', label: 'Alpha' },
                  { value: 'bravo', label: 'Bravo' },
                  { value: 'charlie', label: 'Charlie' },
                ],
                [
                  { value: 'delta', label: 'Delta' },
                  { value: 'echo', label: 'Echo' },
                ],
              ]}
              layer={layer as any}
              searchable={false}
            />
          </div>
        )
      },
    },
    {
      name: 'Time picker',
      url: `${base}/time-picker`,
      render: (selectedLayers: Set<LayerOption>) => {
        const layer = Array.from(selectedLayers)[0] || 'layer-0'
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
            <TimePicker
              label="Stacked"
              defaultValue="09:30"
              state="default"
              layout="stacked"
              layer={layer as any}
            />
            <TimePicker
              label="Side-by-side"
              defaultValue="14:00"
              state="default"
              layout="side-by-side"
              layer={layer as any}
            />
          </div>
        )
      },
    },
    {
      name: 'Stepper',
      url: `${base}/stepper`,
      render: (selectedLayers: Set<LayerOption>) => {
        const layer = Array.from(selectedLayers)[0] || 'layer-0'
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
            <span>Stepper preview</span>
          </div>
        )
      },
    },
  ]
    .sort((a, b) => a.name.localeCompare(b.name))
}
