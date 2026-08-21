/**
 * Mantine CheckboxGroup Adapter
 *
 * Was a bare pass-through re-export with no wrapper-level translation and, until now, no
 * central PROP_CONTRACT entry either — so `helpText`, `errorText`, `optional`, `layout`, and
 * `labelAlign` silently did nothing under Mantine despite the identical names working on
 * sibling field components. Wired up here for real, verified against
 * `RecursicaCheckboxGroupProps`/`RecursicaFormControlWrapperProps`/`RecursicaLabelProps`:
 *
 *   - helpText -> assistiveText (RecursicaFormControlWrapperProps.assistiveText)
 *   - errorText -> error (mantine core's own InputWrapperProps.error, ReactNode)
 *   - optional -> labelOptionalText (RecursicaLabelProps.labelOptionalText: boolean | ReactNode)
 *   - layout -> formLayout (RecursicaFormControlWrapperProps.formLayout)
 *   - labelAlign -> labelAlignment (RecursicaLabelProps.labelAlignment)
 *   - labelSize matches by name already (RecursicaLabelProps.labelSize)
 *
 * `orientation` — unlike RadioButtonGroup, the real adapter DOES have an equivalent here:
 * RecursicaCheckboxGroupProps_2 declares `row?: boolean`. Reshaped rather than renamed
 * (Forge's union doesn't match a boolean 1:1).
 * `padding`/`itemGap` — no real equivalent anywhere on RecursicaCheckboxGroupProps. Dropped.
 */

import { CheckboxGroup as MantineCheckboxGroup } from '@recursica/mantine-adapter'
import type { CheckboxGroupProps } from '../../common/CheckboxGroup'
import type { AssertWired } from '../../common/wiringCheck'

export default function CheckboxGroup({
    children,
    label,
    description,
    helpText,
    errorText,
    required,
    optional,
    orientation,
    layout,
    labelAlign,
    labelSize,
    mantine,
}: CheckboxGroupProps) {
    return (
        <MantineCheckboxGroup
            label={label}
            description={description}
            assistiveText={helpText}
            error={errorText}
            required={required}
            labelOptionalText={optional}
            row={orientation === 'horizontal'}
            formLayout={layout === 'side-by-side' ? 'side-by-side' : 'stacked'}
            labelAlignment={labelAlign}
            labelSize={labelSize}
            {...mantine}
        >
            {children}
        </MantineCheckboxGroup>
    )
}

// Compile-time only — fails the build the moment CheckboxGroupProps declares a prop with no
// real, type-compatible home on the real CheckboxGroup (directly, or via the renames below).
// `children` is excluded because the real CheckboxGroup requires it non-optional while Forge
// declares it optional — passed through as JSX children above rather than a literal
// attribute. `orientation` is excluded: it's reshaped into `row` above (a boolean, not a
// rename), so checking its untranslated shape here would be a false positive. `layout` is
// excluded: Forge deliberately types it as an open `string`, wider than the real
// `formLayout` union — the ternary above is the actual translation.
// `padding`/`itemGap` are genuine adapter gaps — see file header.
type _Wiring = AssertWired<
    CheckboxGroupProps,
    typeof MantineCheckboxGroup,
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
