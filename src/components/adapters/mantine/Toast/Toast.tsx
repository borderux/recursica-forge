/**
 * Mantine Toast Adapter
 *
 * Not a 1:1 pass-through: the real component is Mantine's `Notification` (confirmed via
 * @recursica/mantine-adapter's `Omit<NotificationProps, "color" | "radius" | "variant" |
 * "loading"> & RecursicaToastProps`), which does have real, matching `icon`, `onClose` and
 * `children` slots, plus a Recursica-specific `variant` — those are wired below as literal
 * attributes rather than a spread.
 *
 * `action` is dropped: Notification has no slot for an action node (no button/footer area
 * beyond its own optional close button) — an adapter gap, not an oversight.
 */

import { Toast as MantineToast } from '@recursica/mantine-adapter'
import type { ToastProps } from '../../common/Toast'
import type { AssertWired } from '../../common/wiringCheck'

export default function Toast({
    children,
    variant,
    icon,
    onClose,
    mantine,
}: ToastProps) {
    return (
        <MantineToast
            variant={variant}
            icon={icon}
            onClose={onClose}
            {...mantine}
        >
            {children}
        </MantineToast>
    )
}

// Compile-time only — fails the build the moment ToastProps declares a prop with no real,
// type-compatible home on the real Toast. `action` is excluded with no rename: confirmed no
// real slot exists on Mantine's Notification for a caller-supplied action node.
type _Wiring = AssertWired<
    ToastProps,
    typeof MantineToast,
    'layer' | 'elevation' | 'mantine' | 'material' | 'carbon' | 'className' | 'style' | 'action'
>
const _wiringCheck: _Wiring = true
