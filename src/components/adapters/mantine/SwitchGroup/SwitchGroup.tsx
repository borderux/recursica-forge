/**
 * Mantine SwitchGroup Adapter
 *
 * Not previously implemented for Mantine at all — no folder existed here and it was not
 * registered in registry/mantine.ts, even though the real adapter does export a genuine
 * SwitchGroup (confirmed: `RecursicaSwitchGroupProps`/`RecursicaSwitchGroupProps_2` in
 * node_modules/@recursica/mantine-adapter/dist/index.d.ts). Shares the same field vocabulary
 * as CheckboxGroup/RadioButtonGroup, verified the same way against
 * `RecursicaSwitchGroupProps`/`RecursicaFormControlWrapperProps`/`RecursicaLabelProps`:
 *
 *   - helpText -> assistiveText (RecursicaFormControlWrapperProps.assistiveText)
 *   - errorText -> error (mantine core's own InputWrapperProps.error, ReactNode)
 *   - optional -> labelOptionalText (RecursicaLabelProps.labelOptionalText: boolean | ReactNode)
 *   - layout -> formLayout (RecursicaFormControlWrapperProps.formLayout)
 *   - labelAlign -> labelAlignment (RecursicaLabelProps.labelAlignment)
 *   - labelSize matches by name already (RecursicaLabelProps.labelSize)
 *
 * `orientation` — unlike RadioButtonGroup, RecursicaSwitchGroupProps_2 declares only
 * value/defaultValue/onChange, no `row` and nothing orientation-like (unlike
 * CheckboxGroup, which does have `row`). Dropped.
 * `padding`/`itemGap` — no real equivalent anywhere on RecursicaSwitchGroupProps. Dropped.
 */

import { SwitchGroup as MantineSwitchGroup } from '@recursica/mantine-adapter'
import type { SwitchGroupProps } from '../../common/SwitchGroup'
import type { AssertWired } from '../../common/wiringCheck'

export default function SwitchGroup({
    children,
    label,
    helpText,
    errorText,
    required,
    optional,
    layout,
    labelAlign,
    labelSize,
    mantine,
}: SwitchGroupProps) {
    return (
        <MantineSwitchGroup
            label={label}
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
        </MantineSwitchGroup>
    )
}

// Compile-time only — fails the build the moment SwitchGroupProps declares a prop with no
// real, type-compatible home on the real SwitchGroup (directly, or via the renames below).
// `children` is excluded because the real SwitchGroup requires it non-optional while Forge
// declares it optional — passed through as JSX children above rather than a literal
// attribute. `layout` is excluded: Forge deliberately types it as an open `string`, wider
// than the real `formLayout` union — the ternary above is the actual translation.
// `orientation`/`padding`/`itemGap` are genuine adapter gaps — see file header.
type _Wiring = AssertWired<
    SwitchGroupProps,
    typeof MantineSwitchGroup,
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
