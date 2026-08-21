/**
 * Mantine Tree Adapter
 *
 * Not actually a 1:1 pass-through, despite how it looked before this file had a body.
 *
 * Renamed 1:1 (same shape, different name — previously documented in
 * adapterPropContract.ts's PROP_CONTRACT['Tree'], moved here now that this wrapper does its
 * own translation):
 *   - `onSelect` -> `onSelectedChange`. Without this rename the handler lands on the `<ul>` as
 *     an unknown prop: a node highlights on click and nothing else happens.
 *   - `selected` -> `initialSelectedValues`. Forge drives selection as controlled state (e.g.
 *     the component from the URL); upstream only offers an uncontrolled initial value. Mapping
 *     keeps the node highlighted on mount, but selection will not re-sync if the route changes
 *     by some other means.
 *
 * `data` is `RecursicaTreeNode[]` (required) upstream but optional (`any[]`) in Forge's type;
 * defaulted to `[]` here so the real, required prop always gets a real array.
 *
 * `children` is dropped and never rendered: the real Tree's own type explicitly omits
 * `children` even from its native `<ul>` element merge (`Omit<ComponentPropsWithoutRef<'ul'>,
 * "children">`) — Tree is purely `data`-driven, so there is no slot for arbitrary child nodes
 * at all, not even a theoretical one.
 *
 * `variant` has no real prop — dropped.
 *
 * `className`/`style` are on the adapter's blocked-styling-keys list (the real Tree type is
 * `RecursicaOverStyled`-wrapped) and are ignored unless the caller opts in with
 * `overStyled: true` — which the `mantine` escape hatch can still do
 * (`mantine={{ overStyled: true, style: {...} }}`). Not forwarded here.
 *
 * `forceHover` is Forge-internal (see FORGE_ONLY_PROPS in adapterPropContract.ts) and is
 * already handled centrally — left alone, not touched by this wrapper.
 */

import { Tree as MantineTree } from '@recursica/mantine-adapter'
import type { TreeProps } from '../../common/Tree'
import type { AssertWired } from '../../common/wiringCheck'

export default function Tree({ data, selected, onSelect, mantine }: TreeProps) {
    return (
        <MantineTree
            data={data ?? []}
            initialSelectedValues={selected}
            onSelectedChange={onSelect}
            {...mantine}
        />
    )
}

// Compile-time only — fails the build the moment TreeProps declares a prop with no real,
// type-compatible home on the real Tree — directly, or via the renames below.
//
// `data` is excluded: Forge declares it optional, the real prop requires it — the literal
// `data={data ?? []}` above already guarantees a real array at the call site, but the
// optionality mismatch would otherwise show up as a false positive here. `children` is
// excluded: genuinely dropped (see header comment), not rendered at all. `variant` has no
// real destination. `className`/`style` are dropped (see header comment). `forceHover` is
// Forge-internal, handled centrally, not this wrapper's concern.
type _Wiring = AssertWired<
    TreeProps,
    typeof MantineTree,
    'layer' | 'elevation' | 'mantine' | 'material' | 'carbon' | 'data' | 'children' | 'variant' | 'className' | 'style' | 'forceHover',
    { selected: 'initialSelectedValues'; onSelect: 'onSelectedChange' }
>
const _wiringCheck: _Wiring = true
