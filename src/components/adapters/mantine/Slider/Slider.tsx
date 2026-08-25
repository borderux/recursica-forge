/**
 * Mantine Slider Adapter
 *
 * Moves the whole former `PROP_CONTRACT['Slider']` entry (the largest in
 * adapterPropContract.ts) into explicit, type-checked code, plus fixes several issues found
 * while verifying against the real type:
 *
 *   - `value`/`onChange` as a `[number, number]` RANGE tuple have no real destination: the
 *     real adapter only wraps Mantine's single-thumb `Slider` (confirmed — RecursicaSliderProps
 *     is built from `@mantine/core`'s `SliderProps`, not `RangeSliderProps`; its own `value`/
 *     `onChange` are plain `number`). An upstream ask for range support was declined (2026-08,
 *     permanent — see `docs/MANTINE_ADAPTER_UPSTREAM_REQUESTS.md` #10): this kit will never
 *     support a range value, not just "doesn't yet." A tuple `value` is passed through as
 *     `undefined` here (dropping the range case) rather than crashing; a single numeric value
 *     still works exactly as before. `onChange` itself doesn't need adapting the other
 *     direction — the real callback always hands back a plain `number`, which is one of the
 *     two members of Forge's declared `number | [number, number]` parameter type, so it's
 *     accepted as-is.
 *   - `onChangeCommitted` -> `onChangeEnd` (rename, confirmed).
 *   - `minIcon` -> `icon` (rename: adapter supports a single leading icon only).
 *   - `errorText` -> `error` (2026-08, corrected: gated on `state === 'error'`, not a straight
 *     rename). The real component has no separate "state" concept at all — passing `error`
 *     unconditionally shows the error message/styling whenever it's truthy, full stop, unlike
 *     Material/Carbon's wrappers, which already only show their own error UI when `errorText &&
 *     state === 'error'`. Matched that same guard here so a caller who passes `errorText`
 *     alongside some other `state` (e.g. a demo that hardcodes error copy for every example)
 *     can't accidentally force every Mantine slider into a permanent error appearance
 *     regardless of the selected state — exactly what happened before this fix.
 *   - `valueLabel` -> `tooltipLabel` (2026-08, corrected): raw `@mantine/core`'s own Slider
 *     has this exact "format the value for display" concept natively (`label?: ReactNode |
 *     ((value: number) => ReactNode)`), and the real adapter already exposes it renamed as
 *     `tooltipLabel`. `valueLabel` used to be treated as a separate, Forge-only concept with
 *     "no real destination" — it wasn't a different concept, it was the same one, just
 *     wired to nothing.
 *   - `showValueLabel` -> intentionally NOT wired to `labelAlwaysOn` (2026-08, revised after
 *     upstream changed the `.currentValue` span's behavior — see next bullet). Raw Mantine's
 *     native `labelAlwaysOn` controls whether the floating drag tooltip stays permanently
 *     visible above the thumb instead of only showing during drag/hover. Wiring it to
 *     `showValueLabel` (as this wrapper briefly did) produced an exact visible duplicate: the
 *     same formatted text as both the floating pill AND the static `.currentValue` text below,
 *     simultaneously. Left at Mantine's own default (`false`) instead — see below.
 *   - The real adapter's own `Slider` unconditionally renders a `.currentValue` span next to
 *     the track whenever `showInput` is false, independent of any prop here. Until 2026-08 it
 *     always showed the raw number, ignoring any formatter (a documented, unfixable-from-Forge
 *     quirk — see `docs/MANTINE_ADAPTER_UPSTREAM_REQUESTS.md` #9). Upstream has since changed
 *     it to reuse `tooltipLabel`'s formatter when one is a function, so it now shows the same
 *     *formatted* value instead of the raw number — which also means the formatted value is
 *     effectively ALWAYS visible on Mantine whenever `showInput` is false, regardless of
 *     `showValueLabel`. A follow-up ask for a suppress prop was declined (2026-08, permanent):
 *     `showValueLabel: false`'s "hover-only" semantics can never be fully honored on this kit —
 *     not a temporary gap, and not something this wrapper can work around further.
 *   - `minLabel`/`maxLabel` (2026-08, upstreamed — see upstream-requests doc #11): raw
 *     `ReactNode` overrides for the track-end labels, defaulting to the numeric `min`/`max`
 *     exactly like Forge's own props already documented wanting.
 *   - `maxIcon` -> `trailingIcon` (2026-08, upstreamed — see upstream-requests doc #11): a
 *     second, trailing icon slot alongside the existing leading `icon`.
 *   - `type: 'discrete'` -> `marks` (2026-08, corrected): raw `@mantine/core`'s own Slider has
 *     a native step-tick-marks concept, and the real adapter doesn't block or omit it — it just
 *     isn't a boolean shorthand like Material's MUI `marks={type === 'discrete'}`. Raw Mantine
 *     needs an explicit `{value, label?}[]` array, so it's computed here: one unlabeled tick
 *     per `step` from `min` to `max`. Capped at `MAX_DISCRETE_MARKS` so a caller who leaves
 *     `type="discrete"` on a wide, finely-stepped range doesn't flood the track with hundreds
 *     of ticks; `type: 'continuous'` (or omitted) passes `marks={undefined}`, matching Mantine's
 *     own default of no marks. `iconSize` has no real equivalent (no icon-sizing hook) —
 *     dropped.
 *   - `state` has no real prop of its own to land on, but IS still read here (unlike a fully
 *     dropped prop) purely to gate `errorText` above — see that bullet. The `disabled` case is
 *     handled differently: the dispatcher already computes `disabled={disabled || state ===
 *     'disabled'}` before this component ever sees it, so no local `state` check is needed for
 *     that one.
 *   - `showMinMaxInput` has no real destination, and the Slider dispatcher
 *     (`adapters/Slider.tsx`) never forwards it to this component either — it's consumed
 *     entirely at the dispatcher level to derive `showInput`/`showValueLabel`.
 */

import React from 'react'
import { Slider as MantineSlider } from '@recursica/mantine-adapter'
import type { SliderProps } from '../../common/Slider'
import type { AssertWired } from '../../common/wiringCheck'

// Upper bound on generated step-tick marks — see the `type: 'discrete'` bullet above. Chosen
// generously above every current in-app usage (the largest is ~15 token positions) while still
// guarding against a pathological wide-range/fine-step slider silently flooding the track.
const MAX_DISCRETE_MARKS = 50

export default React.forwardRef<any, SliderProps>(function Slider({
    value,
    onChange,
    onChangeCommitted,
    min,
    max,
    step,
    disabled,
    state,
    errorText,
    layout,
    label,
    showInput,
    showMinMaxLabels,
    type,
    valueLabel,
    minLabel,
    maxLabel,
    minIcon,
    maxIcon,
    readOnly,
    mantine,
}, ref) {
    const resolvedMin = min ?? 0
    const resolvedMax = max ?? 100
    const resolvedStep = step ?? 1

    const marks = React.useMemo(() => {
        if (type !== 'discrete' || resolvedStep <= 0) return undefined
        const count = Math.round((resolvedMax - resolvedMin) / resolvedStep)
        if (!Number.isFinite(count) || count <= 0 || count > MAX_DISCRETE_MARKS) return undefined
        return Array.from({ length: count + 1 }, (_, i) => ({ value: resolvedMin + i * resolvedStep }))
    }, [type, resolvedMin, resolvedMax, resolvedStep])

    return (
        <MantineSlider
            value={Array.isArray(value) ? undefined : value}
            onChange={onChange}
            onChangeEnd={onChangeCommitted}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            error={state === 'error' ? errorText : undefined}
            formLayout={layout === 'side-by-side' ? 'side-by-side' : 'stacked'}
            label={label}
            showInput={showInput}
            showMinMaxLabels={showMinMaxLabels}
            marks={marks}
            tooltipLabel={valueLabel}
            minLabel={minLabel}
            maxLabel={maxLabel}
            icon={minIcon}
            trailingIcon={maxIcon}
            readOnly={readOnly}
            {...mantine}
            ref={ref}
        />
    )
})

// Compile-time only — fails the build the moment SliderProps declares a prop with no real,
// type-compatible home on the real Slider (directly, or via the renames below). `value` is
// excluded: the range-tuple case is explicitly adapted above (dropped to `undefined`), so
// checking its untranslated shape here would be a false positive. `layout` is excluded like
// DatePicker's: Forge types it as an open `string`, wider than the real `formLayout` union,
// and the ternary above is the real translation. `errorText` is excluded: it's gated on
// `state === 'error'` above (a real translation, not a straight rename — see header), so the
// literal `error={...}` attribute is what actually gets checked; re-checking its untranslated
// shape here would be a false positive. `state` is excluded: it has no real prop of its own,
// only read locally to gate `errorText` above. `type` is excluded: it's computed into `marks`
// above (a reshape, not a rename — see header), so the literal `marks={...}` attribute is what
// actually gets checked. `iconSize` is excluded with no rename and no adaptation: no real
// equivalent exists (no icon-sizing hook). `showValueLabel` is excluded deliberately: it now
// has no destination on this kit at all (see header) rather than being unwired by omission —
// checking its untranslated shape here would be a false positive on a prop this wrapper
// intentionally doesn't forward. `minLabel`/`maxLabel` match the real prop names directly, so
// need no entry in either list.
type _Wiring = AssertWired<
    SliderProps,
    typeof MantineSlider,
    | 'layer'
    | 'mantine'
    | 'material'
    | 'carbon'
    | 'className'
    | 'style'
    | 'value'
    | 'layout'
    | 'errorText'
    | 'state'
    | 'type'
    | 'iconSize'
    | 'showValueLabel'
    | 'showMinMaxInput',
    { onChangeCommitted: 'onChangeEnd'; valueLabel: 'tooltipLabel'; minIcon: 'icon'; maxIcon: 'trailingIcon' }
>
const _wiringCheck: _Wiring = true
