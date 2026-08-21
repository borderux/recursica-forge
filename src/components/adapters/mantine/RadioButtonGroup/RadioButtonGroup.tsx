/**
 * Mantine RadioButtonGroup Adapter
 *
 * Was a bare pass-through re-export with no wrapper-level translation and, until now, no
 * central PROP_CONTRACT entry either — so `helpText`, `errorText`, `optional`, `layout`, and
 * `labelAlign` silently did nothing under Mantine despite the identical names working on
 * sibling field components. Wired up here for real, verified against
 * `RecursicaRadioGroupProps`/`RecursicaFormControlWrapperProps`/`RecursicaLabelProps`:
 *
 *   - helpText -> assistiveText (RecursicaFormControlWrapperProps.assistiveText)
 *   - errorText -> error (mantine core's own InputWrapperProps.error, ReactNode)
 *   - optional -> labelOptionalText (RecursicaLabelProps.labelOptionalText: boolean | ReactNode)
 *   - layout -> formLayout (RecursicaFormControlWrapperProps.formLayout)
 *   - labelAlign -> labelAlignment (RecursicaLabelProps.labelAlignment)
 *   - labelSize matches by name already (RecursicaLabelProps.labelSize)
 *
 * `orientation` — no real equivalent: RecursicaRadioGroupProps_2 (the adapter's own
 * RadioGroup-specific additions, beyond what Mantine's own RadioGroupProps already covers)
 * declares only value/defaultValue/onChange — no `row` and nothing orientation-like, unlike
 * CheckboxGroup/SwitchGroup. Dropped.
 * `padding`/`itemGap` — no real equivalent anywhere on RecursicaRadioGroupProps. Dropped.
 */

import { RadioGroup as MantineRadioGroup } from '@recursica/mantine-adapter'
import type { RadioButtonGroupProps } from '../../common/RadioButtonGroup'
import type { AssertWired } from '../../common/wiringCheck'

export default function RadioButtonGroup({
    children,
    label,
    description,
    helpText,
    errorText,
    required,
    optional,
    layout,
    labelAlign,
    labelSize,
    mantine,
}: RadioButtonGroupProps) {
    return (
        <MantineRadioGroup
            label={label}
            description={description}
            assistiveText={helpText}
            error={errorText}
            required={required}
            labelOptionalText={optional}
            formLayout={layout === 'side-by-side' ? 'side-by-side' : 'stacked'}
            labelAlignment={labelAlign}
            labelSize={labelSize}
            {...mantine}
        >
            {children}
        </MantineRadioGroup>
    )
}

// Compile-time only — fails the build the moment RadioButtonGroupProps declares a prop with
// no real, type-compatible home on the real RadioGroup (directly, or via the renames below).
// `children` is excluded because the real RadioGroup requires it non-optional while Forge
// declares it optional — passed through as JSX children above rather than a literal
// attribute, so there's nothing for the same-name comparison to check meaningfully.
// `layout` is excluded: Forge deliberately types it as an open `string` (to accept custom
// layout variant names elsewhere in the app), wider than the real `formLayout` union — the
// ternary above is the actual translation, and it's what gets type-checked.
// `orientation`/`padding`/`itemGap` are genuine adapter gaps — see file header.
type _Wiring = AssertWired<
    RadioButtonGroupProps,
    typeof MantineRadioGroup,
    | 'layer'
    | 'mantine'
    | 'material'
    | 'carbon'
    | 'className'
    | 'style'
    | 'children'
    | 'layout'
    | 'orientation'
    | 'padding'
    | 'itemGap',
    {
        helpText: 'assistiveText'
        errorText: 'error'
        optional: 'labelOptionalText'
        labelAlign: 'labelAlignment'
    }
>
const _wiringCheck: _Wiring = true
