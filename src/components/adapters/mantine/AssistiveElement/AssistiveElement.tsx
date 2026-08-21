/**
 * Mantine AssistiveElement Adapter
 *
 * Not actually a 1:1 pass-through, despite how it looked before this file had a body: the
 * real component takes its message as `children` (JSX content), not a `text` string prop,
 * and its variant prop is named `assistiveVariant`, not `variant` — confirmed against
 * @recursica/mantine-adapter's own RecursicaAssistiveElementProps.
 *
 * `icon` is dropped: the real component has no slot for a caller-supplied icon node, only a
 * boolean `assistiveWithIcon` toggle that shows its own fixed variant-specific icon. There is
 * no real way to inject a custom icon, so a caller-supplied `icon` node is silently unused —
 * documented here rather than forwarded to nowhere.
 */

import { AssistiveElement as MantineAssistiveElement } from '@recursica/mantine-adapter'
import type { AssistiveElementProps } from '../../common/AssistiveElement'
import type { AssertWired } from '../../common/wiringCheck'

export default function AssistiveElement({
    text,
    variant,
    id,
    mantine,
}: AssistiveElementProps) {
    return (
        <MantineAssistiveElement
            id={id}
            assistiveVariant={variant}
            {...mantine}
        >
            {text}
        </MantineAssistiveElement>
    )
}

// Compile-time only — fails the build the moment AssistiveElementProps declares a prop with
// no real, type-compatible home on the real AssistiveElement. `text` and `variant` are
// excluded: both are explicitly translated above (`text` -> `children`, `variant` ->
// `assistiveVariant`), so checking their untranslated shape here would be a false positive.
// `icon` is excluded with no rename: confirmed no real slot for a caller-supplied icon node
// exists (only the boolean `assistiveWithIcon` toggle for the component's own fixed icon).
type _Wiring = AssertWired<
    AssistiveElementProps,
    typeof MantineAssistiveElement,
    'layer' | 'mantine' | 'material' | 'carbon' | 'className' | 'style' | 'text' | 'variant' | 'icon'
>
const _wiringCheck: _Wiring = true
