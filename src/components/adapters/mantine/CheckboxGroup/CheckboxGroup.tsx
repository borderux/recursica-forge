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
 * `orientation` (2026-08, upstream resolution — see `docs/MANTINE_ADAPTER_UPSTREAM_REQUESTS.md`
 * #3): used to reshape onto a `row?: boolean` field that was confirmed dead (declared but
 * never read by the real implementation, just silently spread onto a Mantine primitive with
 * no `row` prop of its own). Rather than wiring it up, the field was removed from the real
 * type entirely — so `orientation` now has no real destination at all and is dropped.
 * `padding`/`itemGap` — no real equivalent anywhere on RecursicaCheckboxGroupProps. Dropped.
 */

import React from 'react'
import { CheckboxGroup as MantineCheckboxGroup } from '@recursica/mantine-adapter'
import type { CheckboxGroupProps } from '../../common/CheckboxGroup'
import type { AssertWired } from '../../common/wiringCheck'

export default React.forwardRef<any, CheckboxGroupProps>(function CheckboxGroup({
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
}, ref) {
    return (
        <MantineCheckboxGroup
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
            ref={ref}
        >
            {children}
        </MantineCheckboxGroup>
    )
})

// Compile-time only — fails the build the moment CheckboxGroupProps declares a prop with no
// real, type-compatible home on the real CheckboxGroup (directly, or via the renames below).
// `children` is excluded because the real CheckboxGroup requires it non-optional while Forge
// declares it optional — passed through as JSX children above rather than a literal
// attribute. `layout` is excluded: Forge deliberately types it as an open `string`, wider than
// the real `formLayout` union — the ternary above is the actual translation.
// `orientation`/`padding`/`itemGap` are genuine adapter gaps — see file header.
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
