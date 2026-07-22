/**
 * StatesPage
 *
 * Theme page for the two GLOBAL interactive states — Hover and Focus.
 *
 * These states are brand-level (not per component) and are applied uniformly to
 * every interactive element by src/styles/interactive-states.css:
 *   - Hover: a color + opacity overlay (defaults: high-contrast tone @ mist).
 *   - Focus: a "glow" ring — color, border-size (ring thickness), margin (gap
 *     between the element and the ring), and blur (soft glow radius).
 *
 * Edits are written to the current theme mode's brand vars (instant feedback via
 * the :root specific var, which the generic theme-scoped alias resolves to) and
 * persisted to recursica_brand.json via updateBrandValue.
 */

import { useEffect, useState } from 'react'
import { useThemeMode } from './ThemeModeContext'
import { state as stateVar, genericLayerProperty, genericLayerText } from '../../core/css/cssVarBuilder'
import { updateBrandValue } from '../../core/css/updateBrandValue'
import { readCssVar, readCssVarResolved } from '../../core/css/readCssVar'
import { getTypographyStyle } from '../components/typographyStyles'
import { iconNameToReactComponent } from '../components/iconUtils'
import PaletteColorControl from '../forms/PaletteColorControl'
import NumericSlider from '../forms/NumericSlider'
import OpacitySlider from '../toolbar/utils/OpacitySlider'
import { Button } from '../../components/adapters/Button'
import { Chip } from '../../components/adapters/Chip'
import { Link } from '../../components/adapters/Link'
import { CheckboxItem } from '../../components/adapters/CheckboxItem'
import { RadioButtonItem } from '../../components/adapters/RadioButtonItem'
import { SwitchItem } from '../../components/adapters/SwitchItem'
import { SegmentedControl } from '../../components/adapters/SegmentedControl'
import { Slider } from '../../components/adapters/Slider'
import { Label } from '../../components/adapters/Label'
import { Tabs } from '../../components/adapters/Tabs'
import { Pagination } from '../../components/adapters/Pagination'
import { Stepper } from '../../components/adapters/Stepper'
import { Menu } from '../../components/adapters/Menu'
import { MenuItem } from '../../components/adapters/MenuItem'
import { Accordion } from '../../components/adapters/Accordion'
import { Tree } from '../../components/adapters/Tree'
import { Breadcrumb } from '../../components/adapters/Breadcrumb'
import { Panel } from '../../components/adapters/Panel'
import { TextField } from '../../components/adapters/TextField'
import { Textarea } from '../../components/adapters/Textarea'
import { NumberInput } from '../../components/adapters/NumberInput'
import { DatePicker } from '../../components/adapters/DatePicker'
import { TimePicker } from '../../components/adapters/TimePicker'
import { Dropdown } from '../../components/adapters/Dropdown'
import { Autocomplete } from '../../components/adapters/Autocomplete'
import { FileInput } from '../../components/adapters/FileInput'
import { FileUpload } from '../../components/adapters/FileUpload'
import { TransferList } from '../../components/adapters/TransferList'

/** One labeled group in the preview: a heading with the component name + its example(s). */
function Group({ title, row, fill, level = 4, children }: { title: string; row?: boolean; fill?: boolean; level?: 3 | 4; children: React.ReactNode }) {
  const Heading = (level === 3 ? 'h3' : 'h4') as 'h3' | 'h4'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--recursica_brand_dimensions_gutters_vertical, 12px)' }}>
      <Heading
        style={{
          ...getTypographyStyle(level === 3 ? 'h3' : 'h4'),
          color: `var(${genericLayerText(0, 'color')})`,
          opacity: `var(${genericLayerText(0, 'high-emphasis')})`,
        }}
      >
        {title}
      </Heading>
      <div
        style={{
          display: 'flex',
          flexDirection: row ? 'row' : 'column',
          flexWrap: 'wrap',
          gap: `var(--recursica_brand_dimensions_gutters_${row ? 'horizontal' : 'vertical'}, 12px)`,
          // `fill` stretches children to the full container width (slider, accordion);
          // otherwise inline controls keep their natural width, left-aligned.
          alignItems: row ? 'center' : fill ? 'stretch' : 'flex-start',
        }}
      >
        {children}
      </div>
    </div>
  )
}

/** Alphabetized list of preview components (also drives the visibility panel). */
const PREVIEW_COMPONENTS = [
  'Accordion', 'Breadcrumb', 'Button', 'Chip', 'Form inputs', 'Link',
  'Menu', 'Pagination', 'Slider', 'Stepper', 'Tabs', 'Tree',
] as const
type PreviewComponent = (typeof PREVIEW_COMPONENTS)[number]

/** Interactive components, rendered in a two-column grid, filtered by `visible`. */
function TestComponents({ visible }: { visible: Record<string, boolean> }) {
  const [checked, setChecked] = useState(false)
  const [selected, setSelected] = useState(false)
  const [on, setOn] = useState(false)
  const [slider, setSlider] = useState<number>(40)
  const [menuSelected, setMenuSelected] = useState<number>(0)
  const [chips, setChips] = useState<Record<string, boolean>>({ 'Option A': true })
  const [treeSelected, setTreeSelected] = useState<string[]>(['second'])
  const [segValue, setSegValue] = useState<string>('list')

  const groups: Record<PreviewComponent, React.ReactNode> = {
    Button: (
      <Group title="Button" row>
        <Button variant="solid">Solid</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="text">Text</Button>
      </Group>
    ),
    Chip: (
      <Group title="Chip" row>
        {['Option A', 'Option B'].map((c) => (
          <Chip
            key={c}
            className="recursica-interactive"
            variant={chips[c] ? 'selected' : 'unselected'}
            onClick={() => setChips((s) => ({ ...s, [c]: !s[c] }))}
          >
            {c}
          </Chip>
        ))}
      </Group>
    ),
    Link: (
      <Group title="Link">
        {/* No `recursica-interactive` marker: links must NOT take the hover overlay —
            only the link-hover text treatment (Link.css) + focus glow (a[href]). */}
        <Link href="#">Link text</Link>
      </Group>
    ),
    Slider: (
      <Group title="Slider" fill>
        <Slider value={slider} onChange={(v) => setSlider(typeof v === 'number' ? v : v[0])} min={0} max={100} />
      </Group>
    ),
    Tabs: (
      <Group title="Tabs" fill>
        {(['default', 'pills', 'outline'] as const).map((v) => (
          <Tabs key={v} defaultValue="one" variant={v}>
            <Tabs.List>
              <Tabs.Tab value="one">First</Tabs.Tab>
              <Tabs.Tab value="two">Second</Tabs.Tab>
            </Tabs.List>
          </Tabs>
        ))}
      </Group>
    ),
    Menu: (
      <Group title="Menu">
        <Menu style={{ overflow: 'visible' }}>
          {['Profile', 'Settings', 'Sign out'].map((item, i) => (
            <MenuItem
              key={item}
              className="recursica-interactive"
              selected={menuSelected === i}
              variant={menuSelected === i ? 'selected' : 'default'}
              onClick={() => setMenuSelected(i)}
            >
              {item}
            </MenuItem>
          ))}
        </Menu>
      </Group>
    ),
    Accordion: (
      <Group title="Accordion" fill>
        <Accordion items={[{ id: 'a', title: 'Section A', content: 'Content A' }]} />
      </Group>
    ),
    Tree: (
      <Group title="Tree" fill>
        <Tree
          data={[
            { value: 'root', label: 'Root', children: [{ value: 'child', label: 'Child' }] },
            { value: 'second', label: 'Second node' },
          ]}
          selected={treeSelected}
          onSelect={setTreeSelected}
        />
      </Group>
    ),
    Pagination: (
      <Group title="Pagination">
        <Pagination total={10} defaultValue={1} />
      </Group>
    ),
    Stepper: (
      <Group title="Stepper">
        <Stepper active={1} steps={[{ label: 'Start' }, { label: 'Details' }, { label: 'Done' }]} />
      </Group>
    ),
    Breadcrumb: (
      <Group title="Breadcrumb">
        <Breadcrumb items={[{ label: 'Home', href: '#' }, { label: 'Section', href: '#' }, { label: 'Current' }]} />
      </Group>
    ),
    'Form inputs': (
      <Group title="Form inputs" fill>
        <CheckboxItem checked={checked} onChange={setChecked} label="Checkbox item" />
        <RadioButtonItem selected={selected} onChange={setSelected} label="Radio item" value="a" />
        <SwitchItem checked={on} onChange={setOn} label="Switch item" />
        <SegmentedControl
          value={segValue}
          onChange={setSegValue}
          items={[{ value: 'list', label: 'List' }, { value: 'grid', label: 'Grid' }]}
        />
        <TextField label="Text field" placeholder="Focus / hover me" minWidth={220} />
        <Textarea label="Textarea" placeholder="Type here" />
        <NumberInput label="Number input" placeholder="0" />
        <DatePicker label="Date picker" />
        <TimePicker label="Time picker" />
        <Dropdown label="Dropdown" items={[{ value: 'us', label: 'USA' }, { value: 'ca', label: 'Canada' }]} />
        <Autocomplete label="Autocomplete" items={[{ value: 'apple', label: 'Apple' }, { value: 'banana', label: 'Banana' }]} />
        <FileInput label="File input" />
        <FileUpload label="File upload" />
        <TransferList
          defaultData={[
            [{ value: '1', label: 'Item 1' }, { value: '2', label: 'Item 2' }],
            [{ value: '3', label: 'Item 3' }],
          ]}
        />
      </Group>
    ),
  }

  const shown = PREVIEW_COMPONENTS.filter((k) => visible[k])
  return (
    <div
      style={{
        display: 'grid',
        // Two columns, wrapping to the next row; each group occupies one cell.
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: 'var(--recursica_brand_dimensions_general_lg, 24px)',
        alignItems: 'start',
      }}
    >
      {shown.length === 0 ? (
        <div style={{ opacity: 0.6, fontSize: 13 }}>No components selected — open the Components panel to add some.</div>
      ) : (
        shown.map((k) => <div key={k}>{groups[k]}</div>)
      )}
    </div>
  )
}

export default function StatesPage() {
  const { mode } = useThemeMode()

  // Mode-specific brand vars (the ones held on :root; generic aliases resolve to them).
  // stateVar() already includes the `--recursica_` prefix.
  const hoverColorVar = stateVar(mode, 'hover', 'color')
  const hoverOpacityVar = stateVar(mode, 'hover', 'opacity')
  const focusColorVar = stateVar(mode, 'focus', 'color')
  const focusBorderSizeVar = stateVar(mode, 'focus', 'border-size')
  const focusMarginVar = stateVar(mode, 'focus', 'margin')
  const focusBlurVar = stateVar(mode, 'focus', 'blur')
  // Link-only hover text treatment (applies to <Link> only, never the overlay/focus).
  const linkDecorationVar = stateVar(mode, 'link', 'decoration')
  const linkStyleVar = stateVar(mode, 'link', 'style')
  const linkWeightVar = stateVar(mode, 'link', 'weight')

  // Preview visibility (default: only Button) + the right-side Components panel.
  const [visible, setVisible] = useState<Record<string, boolean>>({ Button: true })
  const [panelOpen, setPanelOpen] = useState(false)

  const [borderSize, setBorderSize] = useState<number>(1)
  const [margin, setMargin] = useState<number>(2)
  const [blur, setBlur] = useState<number>(4)
  const [linkDecoration, setLinkDecoration] = useState<string>('underline')
  const [linkStyle, setLinkStyle] = useState<string>('normal')
  const [linkWeight, setLinkWeight] = useState<number>(400)
  // Bumped on reset/undo to remount the color + opacity controls so they re-read
  // the reverted values from the DOM.
  const [resyncKey, setResyncKey] = useState(0)

  // Sync all controls from the DOM: on mode change, and on reset/undo (cssVarsReset).
  useEffect(() => {
    const read = (v: string, fallback: number) => {
      const n = parseFloat(readCssVarResolved(v) || '')
      return Number.isFinite(n) ? n : fallback
    }
    const sync = () => {
      setBorderSize(read(focusBorderSizeVar, 1))
      setMargin(read(focusMarginVar, 2))
      setBlur(read(focusBlurVar, 4))
      setLinkDecoration((readCssVar(linkDecorationVar) || 'underline').trim())
      setLinkStyle((readCssVar(linkStyleVar) || 'normal').trim())
      setLinkWeight(read(linkWeightVar, 400))
    }
    sync()
    // Re-read + remount controls on any revert:
    //  - cssVarsReset  → undo / redo / component reset
    //  - themeReset    → header "Reset all" (resetAll)
    const onReset = () => { sync(); setResyncKey((k) => k + 1) }
    window.addEventListener('cssVarsReset', onReset)
    window.addEventListener('themeReset', onReset)
    return () => {
      window.removeEventListener('cssVarsReset', onReset)
      window.removeEventListener('themeReset', onReset)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  // Persist a color control's current DOM value into brand JSON.
  const persistColor = (cssVar: string) => {
    const v = readCssVar(cssVar)
    if (v) updateBrandValue(cssVar, v)
  }

  // Set a px-valued focus var: instant feedback on :root + persist to JSON.
  const setFocusPx = (cssVar: string, n: number) => {
    const val = `${n}px`
    document.documentElement.style.setProperty(cssVar, val)
    updateBrandValue(cssVar, val)
  }

  // Set a literal string/number state var (link hover treatment): DOM feedback + persist.
  const setStateLiteral = (cssVar: string, val: string) => {
    document.documentElement.style.setProperty(cssVar, val)
    updateBrandValue(cssVar, val)
  }

  // Icon-based options (matches the text-style toolbar's Style/Decoration controls).
  const linkDecorationOptions = (() => {
    const None = iconNameToReactComponent('radix-text-none')
    const Underline = iconNameToReactComponent('radix-underline')
    const Strike = iconNameToReactComponent('radix-strikethrough')
    return [
      { value: 'none', label: 'None', icon: None ? <None size={16} /> : null, tooltip: 'None' },
      { value: 'underline', label: 'Underline', icon: Underline ? <Underline size={16} /> : null, tooltip: 'Underline' },
      { value: 'line-through', label: 'Line through', icon: Strike ? <Strike size={16} /> : null, tooltip: 'Line through' },
    ]
  })()
  const linkStyleOptions = (() => {
    const Roman = iconNameToReactComponent('radix-font-roman')
    const Italic = iconNameToReactComponent('radix-font-italic')
    return [
      { value: 'normal', label: 'Normal', icon: Roman ? <Roman size={16} /> : null, tooltip: 'Normal' },
      { value: 'italic', label: 'Italic', icon: Italic ? <Italic size={16} /> : null, tooltip: 'Italic' },
    ]
  })()
  // Named font weights for the discrete Link-weight slider (like the type-style panel).
  const linkWeightOptions = [
    { value: 100, label: 'Thin' },
    { value: 200, label: 'Extra light' },
    { value: 300, label: 'Light' },
    { value: 400, label: 'Regular' },
    { value: 500, label: 'Medium' },
    { value: 600, label: 'Semibold' },
    { value: 700, label: 'Bold' },
    { value: 800, label: 'Extra bold' },
    { value: 900, label: 'Black' },
  ]
  const linkWeightIndex = Math.max(0, linkWeightOptions.findIndex((o) => o.value === linkWeight))

  const h2Style: React.CSSProperties = {
    ...getTypographyStyle('h2'),
    color: `var(${genericLayerText(0, 'color')})`,
    opacity: `var(${genericLayerText(0, 'high-emphasis')})`,
  }
  const h3Style: React.CSSProperties = {
    ...getTypographyStyle('h3'),
    color: `var(${genericLayerText(0, 'color')})`,
    opacity: `var(${genericLayerText(0, 'high-emphasis')})`,
  }
  // Container styling mirrors Theme › Dimensions.
  const cardStyle: React.CSSProperties = {
    background: `var(${genericLayerProperty(0, 'surface')})`,
    border: `1px solid var(${genericLayerProperty(0, 'border-color')})`,
    borderRadius: 'var(--recursica_brand_dimensions_border-radii_xl)',
    padding: 'var(--recursica_brand_dimensions_general_xl)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--recursica_brand_dimensions_gutters_vertical, 20px)',
  }

  return (
    <div
      className="antialiased container-padding"
      data-recursica-layer="0"
      style={{
        // Match Theme › Dimensions: transparent (parent provides the full-width
        // surface), capped and centered. Explicit max-width so it holds even when
        // the shared .container-padding rule isn't loaded on this route.
        color: `var(${genericLayerText(0, 'color')})`,
        maxWidth: '1400px',
        margin: '0 auto',
        padding: 'var(--recursica_brand_dimensions_general_xl)',
      }}
    >
      {/* Header */}
      <h1
        style={{
          ...getTypographyStyle('h1'),
          margin: 0,
          color: `var(${genericLayerText(0, 'color')})`,
          opacity: `var(${genericLayerText(0, 'high-emphasis')})`,
        }}
      >
        States
      </h1>

      {/* ── Hover + Focus side by side (equal height: both stretch to the taller) ── */}
      <div
        style={{
          marginTop: 'var(--recursica_brand_dimensions_gutters_vertical)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'var(--recursica_brand_dimensions_general_lg)',
          alignItems: 'stretch',
        }}
      >
          {/* Hover */}
          <section data-recursica-layer="0" style={cardStyle}>
            <h2 style={h2Style}>Hover</h2>

            <PaletteColorControl
              key={`hover-color-${mode}-${resyncKey}`}
              label="Overlay color"
              targetCssVar={hoverColorVar}
              currentValueCssVar={hoverColorVar}
              onSelect={() => persistColor(hoverColorVar)}
            />

            <OpacitySlider
              key={`hover-opacity-${mode}-${resyncKey}`}
              label="Opacity"
              targetCssVar={hoverOpacityVar}
              layer="layer-0"
            />

            {/* Link-only hover text treatment — applies to <Link> only, never the
                overlay/color and never focus. Weight first, then decoration + style. */}
            <Slider
              key={`link-weight-${mode}-${resyncKey}`}
              value={linkWeightIndex}
              onChange={(v) => {
                const opt = linkWeightOptions[Math.round(typeof v === 'number' ? v : v[0])]
                if (opt) { setLinkWeight(opt.value); setStateLiteral(linkWeightVar, String(opt.value)) }
              }}
              min={0}
              max={linkWeightOptions.length - 1}
              step={1}
              type="discrete"
              layer="layer-0"
              layout="stacked"
              showInput={false}
              showValueLabel={true}
              showMinMaxLabels={false}
              valueLabel={(val) => linkWeightOptions[Math.round(val)]?.label || ''}
              label={<Label layer="layer-0" layout="stacked">Link weight</Label>}
            />

            <div>
              <Label layer="layer-0" layout="stacked">Link decoration</Label>
              <SegmentedControl
                key={`link-decoration-${mode}-${resyncKey}`}
                value={linkDecoration}
                onChange={(v) => { setLinkDecoration(v); setStateLiteral(linkDecorationVar, v) }}
                items={linkDecorationOptions}
                showLabel={false}
                layer="layer-0"
              />
            </div>

            <div>
              <Label layer="layer-0" layout="stacked">Link style</Label>
              <SegmentedControl
                key={`link-style-${mode}-${resyncKey}`}
                value={linkStyle}
                onChange={(v) => { setLinkStyle(v); setStateLiteral(linkStyleVar, v) }}
                items={linkStyleOptions}
                showLabel={false}
                layer="layer-0"
              />
            </div>
          </section>

          {/* Focus */}
          <section data-recursica-layer="0" style={cardStyle}>
            <h2 style={h2Style}>Focus</h2>

            <PaletteColorControl
              key={`focus-color-${mode}-${resyncKey}`}
              label="Glow color"
              targetCssVar={focusColorVar}
              currentValueCssVar={focusColorVar}
              onSelect={() => persistColor(focusColorVar)}
            />

            <NumericSlider
              key={`focus-border-${mode}-${resyncKey}`}
              label="Border size"
              value={borderSize}
              onChange={(n) => { setBorderSize(n); setFocusPx(focusBorderSizeVar, n) }}
              min={1}
              max={20}
              step={1}
              unit="px"
            />

            <NumericSlider
              key={`focus-margin-${mode}-${resyncKey}`}
              label="Margin"
              value={margin}
              onChange={(n) => { setMargin(n); setFocusPx(focusMarginVar, n) }}
              min={0}
              max={20}
              step={1}
              unit="px"
            />

            <NumericSlider
              key={`focus-blur-${mode}-${resyncKey}`}
              label="Blur"
              value={blur}
              onChange={(n) => { setBlur(n); setFocusPx(focusBlurVar, n) }}
              min={0}
              max={30}
              step={1}
              unit="px"
            />
          </section>
      </div>

      {/* ── Full-width shared preview (max-centered by the page container) ── */}
      <section
        data-recursica-layer="0"
        style={{ ...cardStyle, marginTop: 'var(--recursica_brand_dimensions_general_lg)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--recursica_brand_dimensions_gutters_horizontal, 12px)' }}>
          <h3 style={{ ...h3Style, margin: 0 }}>Hover to preview / Tab to focus</h3>
          <Button variant="outline" onClick={() => setPanelOpen((o) => !o)}>
            Change preview components
          </Button>
        </div>
        <TestComponents visible={visible} />
      </section>

      {/* ── Components panel (right-side drawer, themed Panel component) ── */}
      {panelOpen && (
        <div
          onClick={() => setPanelOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
        />
      )}
      <Panel
        overlay
        position="right"
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        title="Components"
        width="320px"
        layer="layer-0"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--recursica_brand_dimensions_gutters_vertical, 12px)' }}>
          {PREVIEW_COMPONENTS.map((k) => (
            <CheckboxItem
              key={k}
              checked={!!visible[k]}
              onChange={(c) => setVisible((v) => ({ ...v, [k]: c }))}
              label={k}
            />
          ))}
        </div>
      </Panel>
    </div>
  )
}
