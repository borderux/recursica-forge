/**
 * Mantine Slider Adapter
 *
 * Moves the whole former `PROP_CONTRACT['Slider']` entry (the largest in
 * adapterPropContract.ts) into explicit, type-checked code, plus fixes two new issues found
 * while verifying against the real type:
 *
 *   - `value`/`onChange` as a `[number, number]` RANGE tuple have no real destination: the
 *     real adapter only wraps Mantine's single-thumb `Slider` (confirmed — RecursicaSliderProps
 *     is built from `@mantine/core`'s `SliderProps`, not `RangeSliderProps`; its own `value`/
 *     `onChange` are plain `number`). A tuple `value` is passed through as `undefined` here
 *     (dropping the range case) rather than crashing; a single numeric value still works
 *     exactly as before. `onChange` itself doesn't need adapting the other direction — the
 *     real callback always hands back a plain `number`, which is one of the two members of
 *     Forge's declared `number | [number, number]` parameter type, so it's accepted as-is.
 *   - `onChangeCommitted` -> `onChangeEnd` (rename, confirmed).
 *   - `minIcon` -> `icon` (rename: adapter supports a single leading icon only).
 *   - `tooltipText` -> `tooltipLabel` (rename).
 *   - `errorText` -> `error` (rename, part of the shared field vocabulary this component no
 *     longer gets for free now that it's out of FIELD_COMPONENTS).
 *   - `maxIcon`, `valueLabel`, `showValueLabel`, `minLabel`, `maxLabel` all confirmed to have
 *     no real destination (unchanged from the original contract's documented rationale) —
 *     dropped.
 *   - `type` (`'continuous' | 'discrete'`) and `iconSize` are NEW findings: neither has any
 *     real equivalent (no discrete-step-marker concept, no icon-sizing hook) — dropped.
 *   - `state` has no real equivalent either — the real `disabled` prop is driven directly by
 *     Forge's own separate `disabled` prop instead (the Slider dispatcher already computes
 *     `disabled={disabled || state === 'disabled'}` before this component ever sees it).
 *   - `showMinMaxInput` has no real destination, and the Slider dispatcher
 *     (`adapters/Slider.tsx`) never forwards it to this component either — it's consumed
 *     entirely at the dispatcher level to derive `showInput`/`showValueLabel`.
 */

import { Slider as MantineSlider } from '@recursica/mantine-adapter'
import type { SliderProps } from '../../common/Slider'
import type { AssertWired } from '../../common/wiringCheck'

export default function Slider({
    value,
    onChange,
    onChangeCommitted,
    min,
    max,
    step,
    disabled,
    errorText,
    layout,
    label,
    showInput,
    showMinMaxLabels,
    tooltipText,
    minIcon,
    readOnly,
    mantine,
}: SliderProps) {
    return (
        <MantineSlider
            value={Array.isArray(value) ? undefined : value}
            onChange={onChange}
            onChangeEnd={onChangeCommitted}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            error={errorText}
            formLayout={layout === 'side-by-side' ? 'side-by-side' : 'stacked'}
            label={label}
            showInput={showInput}
            showMinMaxLabels={showMinMaxLabels}
            tooltipLabel={tooltipText}
            icon={minIcon}
            readOnly={readOnly}
            {...mantine}
        />
    )
}

// Compile-time only — fails the build the moment SliderProps declares a prop with no real,
// type-compatible home on the real Slider (directly, or via the renames below). `value` is
// excluded: the range-tuple case is explicitly adapted above (dropped to `undefined`), so
// checking its untranslated shape here would be a false positive. `layout` is excluded like
// DatePicker's: Forge types it as an open `string`, wider than the real `formLayout` union,
// and the ternary above is the real translation. `state`, `type`, `iconSize`, `maxIcon`,
// `valueLabel`, `showValueLabel`, `minLabel` and `maxLabel` are excluded with no rename and
// no adaptation: confirmed no real equivalent exists for any of them (see header).
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
    | 'state'
    | 'type'
    | 'iconSize'
    | 'maxIcon'
    | 'valueLabel'
    | 'showValueLabel'
    | 'minLabel'
    | 'maxLabel'
    | 'showMinMaxInput',
    { onChangeCommitted: 'onChangeEnd'; errorText: 'error'; tooltipText: 'tooltipLabel'; minIcon: 'icon' }
>
const _wiringCheck: _Wiring = true
