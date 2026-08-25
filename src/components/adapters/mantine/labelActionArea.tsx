/**
 * Shared Mantine label-edit-icon resolver
 *
 * Translates Forge's shared field-label vocabulary (`editIcon`/`editIconTitle`/
 * `onEditIconClick`, declared once on `common/Label.ts` and mixed into every field
 * component's own common type) into the real `@recursica/mantine-adapter`'s actual props for
 * this: `labelActionArea`/`labelWithEditIcon`/`onLabelEditClick` (all on `RecursicaLabelProps`,
 * which `RecursicaFormControlWrapperProps` extends — so every field component built on
 * `WithReadOnlyWrapper`/`FormControlWrapper` has this same slot, not just the standalone
 * `Label` component).
 *
 * Extracted here (2026-08) after the identical bug — dropping `editIcon`/`editIconTitle`
 * outright on the incorrect claim "no real slot" — was found independently duplicated across
 * six Mantine wrappers (`Label`, `TextField`, `Textarea`, `Dropdown`, `TimePicker`,
 * `ReadOnlyField`). Fix it once here; every wrapper below just calls this and forwards the
 * result.
 *
 * Two cases:
 *   - `editIcon === true` (the boolean shorthand — "just give me AN edit affordance, I don't
 *     care which"): maps onto the real adapter's OWN built-in mechanism, `labelWithEditIcon` +
 *     `onLabelEditClick` — its hardcoded pencil icon. Material/Carbon have no equivalent native
 *     mechanism and have to fake this by passing `true` as a Button `icon` instead.
 *   - `editIcon` as an actual ReactNode (e.g. the globe icon `useGlobalRefControl` builds for
 *     the "detach from global token" affordance used throughout the toolbar): routed into
 *     `labelActionArea`, wrapped in a clickable `Button`/`Tooltip` unless the node already
 *     handles its own click — matching Material/Carbon's existing `isButtonOrHasClick` check,
 *     so a caller-built "Reattach" button (see `core/css/globalRefInterceptor.ts`) renders
 *     as-is instead of being double-wrapped.
 */

import React from 'react'
import { Button } from '../Button'
import { Tooltip } from '../Tooltip'
import type { ComponentLayer } from '../../registry/types'

// Duplicated (not imported) from material/Label/Label.tsx and carbon/Label/Label.tsx: those two
// wrap a caller-supplied `editIcon` node into their own real Button/Tooltip components, so
// there's no single shared implementation to fold all three into, only a shared shape.
function isButtonOrHasClick(node: React.ReactNode): boolean {
    if (!React.isValidElement(node)) return false

    const props = node.props as any
    if (!props) return false

    if (props.onClick !== undefined) return true

    const type = node.type
    if (
        type === 'button' ||
        (typeof type === 'function' &&
            ((type as any).name === 'Button' ||
                (type as any).name === 'MantineButton' ||
                (type as any).displayName === 'Button' ||
                (type as any).displayName === 'MantineButton'))
    ) {
        return true
    }

    if (props.children) {
        if (Array.isArray(props.children)) {
            return props.children.some((child: any) => isButtonOrHasClick(child))
        }
        return isButtonOrHasClick(props.children)
    }

    return false
}

export interface ResolvedLabelActionArea {
    labelActionArea?: React.ReactNode
    labelWithEditIcon: boolean
    onLabelEditClick?: (e: React.MouseEvent) => void
}

/** Call once per wrapper and spread the three returned props onto the real Mantine component. */
export function resolveLabelActionArea(
    editIcon: React.ReactNode | boolean | undefined,
    editIconTitle: string | undefined,
    onEditIconClick: ((e: React.MouseEvent) => void) | undefined,
    layer: ComponentLayer | undefined,
): ResolvedLabelActionArea {
    const isBooleanEditIcon = editIcon === true
    const iconNode = isBooleanEditIcon ? undefined : (editIcon as React.ReactNode)

    const labelActionArea = iconNode ? (
        isButtonOrHasClick(iconNode) ? (
            iconNode
        ) : editIconTitle ? (
            <Tooltip label={editIconTitle} withinPortal zIndex={10000}>
                <Button variant="text" size="small" icon={iconNode} layer={layer} onClick={onEditIconClick} />
            </Tooltip>
        ) : (
            <Button variant="text" size="small" icon={iconNode} layer={layer} onClick={onEditIconClick} />
        )
    ) : undefined

    return {
        labelActionArea,
        labelWithEditIcon: isBooleanEditIcon,
        onLabelEditClick: isBooleanEditIcon ? onEditIconClick : undefined,
    }
}
