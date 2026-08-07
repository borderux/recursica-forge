# Adapter capability gaps

Companion to [ADAPTER_GAP_REPORT.md](./ADAPTER_GAP_REPORT.md). That report is generated and
compares **CSS variable names** — it catches tokens the adapter reads but Forge no longer
emits, and vice versa. It cannot see missing *props*, missing *components*, or places where
both sides use the same word for different behaviour.

This document records those, found by driving Forge against
`@recursica/mantine-adapter@0.36.1` / `@recursica/adapter-common@0.13.0`. Every item is
something the **adapter** should gain. Forge deliberately does not paper over them: where a
capability is missing, the affected UI renders degraded so the gap stays visible.

Both packages are byte-identical to the published tarballs — verified by diffing
`node_modules/@recursica/*` against a fresh `npm pack` of the pinned versions.

---

## 1. Upstream bugs (visible breakage, cheapest to fix)

### 1.1 Modal title typography reads camelCase variable names

`Modal.module.css` reads:

```css
--recursica_ui-kit_components_modal_properties_header-style_fontFamily
--recursica_ui-kit_components_modal_properties_header-style_fontSize
```

Everything else in the token pipeline is kebab-case (`font-family`, `font-size`), so these
never resolve and the modal title falls back to the browser default. Measured live: the
"Pick a color" title renders at **16px / weight 400**, unstyled.

Same defect appears in `Card` (`header-style` / `content-style`), which is where the 48
unresolved `ui-kit` variables in the generated report are concentrated. Fixing the casing
resolves both.

**Fix:** kebab-case these names in the adapter CSS.

### 1.2 Modal elevation consumes a token reference as a raw CSS value

```css
/* Modal.module.css */
box-shadow: var(--recursica_ui-kit_components_modal_properties_elevation);
```

That variable holds `elevation-3` — a token *reference*, not a shadow. `box-shadow: elevation-3`
is invalid, so **no elevation paints at all** (measured: `box-shadow: none`). Forge resolves
these references in JS before use (`getElevationBoxShadow` / `parseElevationValue`).

**Fix:** either resolve elevation references adapter-side, or have the token pipeline emit a
usable shadow value for `*_properties_elevation`.

### 1.3 Tree reports selection from an effect keyed on the callback

```tsx
// Tree.tsx
useEffect(() => {
  onSelectedChange?.(tree.selectedState)
}, [tree.selectedState, onSelectedChange])
```

Because `onSelectedChange` is a dependency, this fires on mount and again on every change of
the callback's *identity* — not only when the user picks a node. A consumer that navigates in
that callback gets an infinite loop: navigate → re-render → new callback → fire → navigate.
Measured in Forge's sidebar before guarding: **250 navigations on load, 150 per click**,
until Chrome cut it off with "Throttling navigation to prevent the browser from hanging."

**Fix:** fire only on user-driven selection change, or hold the callback in a ref.

---

## 2. Missing capabilities

### 2.1 Modal: no anchored positioning, no dragging

The adapter's Modal is a centred Mantine Modal. Forge's colour, palette and opacity pickers
are *anchored* overlays: they open beside the control being edited and can be dragged aside to
see the effect underneath. `PaletteSwatchPicker` passes `position={{x, y}}` and
`draggable`; both are dropped.

Driven through the adapter's Modal, every picker opened centre-screen and could not be moved
(measured: trigger at `x 1077, y 687`, picker at `x 518, y 50`), with no elevation and an
unstyled title.

**Fix:** an anchored/popover placement mode and optional drag on Modal — or a dedicated
anchored-overlay component.

**Shimmed in Forge, by decision** — this one was too disruptive to leave broken, so
`PaletteSwatchPicker` now renders in Forge's own `FloatingPalette` (anchored, draggable,
portalled) rather than the adapter's Modal, which is what `ColorTokenPicker` already did. Both
pickers therefore share one overlay. **The adapter gap is unchanged**: revert both to the
adapter's Modal once it can anchor to a trigger and drag. Search for `adapter gap 2.1` to find
the shim.

### 2.2 Layer: no way to scope variables without painting a surface

`Layer`'s root paints `background-color`, `border-*`, `box-shadow` and `padding` from
`--recursica_brand_layer_N_*`. `contentsOnly` suppresses the box but **also drops
`data-recursica-layer`**, which is the attribute the cascade needs — so there is no way to say
"resolve this subtree's tokens for layer N" without also drawing a layer surface.

Forge needs exactly that for every control that lives on a non-zero layer. Using `Layer` for
it drew a bordered, padded box around each toolbar control and left empty painted boxes where
a wrapped component rendered nothing.

**Fix:** keep `data-recursica-layer` in `contentsOnly` mode, or add a scope-only prop.

### 2.3 No picker-trigger field; `readOnly` is an execution barrier

A colour row needs a control that *looks* like a field but *acts* like a button: swatch, the
resolved token name, opens a picker on click, never typed into. Building it from `TextField`
with `readOnly` + `leadingIcon` + `onClick` cannot work, because `WithReadOnlyWrapper` swaps
the entire input for a `ReadOnlyField` text renderer — the swatch, the chevron and the click
handler all live on the active-input branch that never renders.

`readOnly` upstream means "display mode"; the caller here means "not typeable, still
interactive". No prop mapping bridges that.

**Fix:** a picker-trigger/select-like field, or a non-typeable-but-interactive input mode.
(Forge has a local `ColorTriggerControl` in the interim, at the user's direction.)

### 2.4 Panel: no width control

`RecursicaPanelProps` omits `size`, `styles`, `classNames` and `style` from Mantine's Drawer
props, so panel width is token-only. A caller that needs a specific width — Forge's type-style
panel asks for 400px — cannot express it without the `overStyled` escape hatch.

### 2.5 TextField: no per-instance min/max width

`controlMinWidth` / `controlMaxWidth` are omitted from the props and hardcoded to
`var(--text-field-control-min-width)`. A field that must shrink below the token — Forge's
colour scale passes `minWidth={0}` to fit a dense grid — has no way to say so.

### 2.6 SegmentedControl: items cannot carry an icon or tooltip

The item shape is `{ label: ReactNode, value, disabled }`. An icon can be passed *as* the
label, but there is no `tooltip`, so an icon-only segment has no accessible name. Forge's
light/dark toggle is exactly this case.

Minor robustness note: the root can be flex-shrunk below its contents' intrinsic width, and
the segments then overflow their own box rather than the control holding its size.

### 2.7 TransferList has no API

`RecursicaTransferListProps` is empty — it exposes no Recursica-specific API at all, so all 13
props Forge drives the two panes with are unmatched. The widest single-component gap.

---

## 3. Prop-level drops

Every Forge prop with no upstream counterpart is listed, with reasoning, in
[`src/components/hooks/adapterPropContract.ts`](../src/components/hooks/adapterPropContract.ts)
and logged once per session in dev as:

```
[adapter] <Modal> prop "showFooter" has no equivalent in @recursica/mantine-adapter and was dropped.
```

Entries marked `GAP` in that file are adapter gaps. Entries that are renames or reshapes are
**not** gaps — the capability exists upstream under a different name or shape (e.g. Dropdown's
popover z-index lives under Mantine's `comboboxProps`).

## 4. API-shape differences that are not gaps

`Accordion`, `Table`, `Menu` and `Panel`'s footer are composition APIs upstream
(`Accordion.Item`, `Panel.Footer`, …) where Forge's dispatchers took an `items` array or a
`footer` prop. Forge composes the real sub-components instead. Noted only so the difference
isn't rediscovered as a bug.

One caveat for consumers: sub-components attached as statics (`Panel.Footer`) do not survive a
`React.lazy` wrapper, so they must be imported directly from the package rather than read off
the lazily-loaded parent.
