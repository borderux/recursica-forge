/**
 * Mantine Modal Adapter
 *
 * Not actually a 1:1 pass-through, despite how it looked before this file had a body.
 *
 * REAL BUG FIXED HERE: `zIndex` is on the adapter's blocked-styling-keys list (the real Modal
 * type is `RecursicaOverStyled`-wrapped), so it is silently stripped at runtime unless the
 * caller opts in with `overStyled: true` — which nothing ever did, since the old bare
 * pass-through never set it and had no way to. Every real call site in this app that sets a
 * custom `zIndex` (there are several — colour pickers, font modals, etc., all layering one
 * modal over another) was having it thrown away. This wrapper renders with `overStyled: true`
 * unconditionally to fix that for real; since we only ever forward `zIndex`/`className`/`style`
 * when the caller actually provided them, this has no effect when they're absent, and it does
 * not disable the component's own default token-driven styling (confirmed in the compiled
 * adapter: the default classNames are applied unconditionally, `overStyled` only gates whether
 * *caller-supplied* blocked keys are honored). `className`/`style` are wired through as a
 * bonus fix for the same reason — they were equally silently dropped before.
 *
 * Renamed 1:1 (same shape, different name): `isOpen` -> `opened`, `showCloseButton` ->
 * `withCloseButton`.
 *
 * `content` and `children` are Forge's two content slots; the real Modal only has one
 * (`children`), so both are rendered together into it.
 *
 * `padding` is `boolean` in Forge's type but the real prop wants a Mantine spacing token
 * (`MantineSpacing` — a size key, CSS value, or number). Reshaped: `false` maps to `0` (no
 * padding); `true`/`undefined` pass `undefined` through so the real default (`'md'`) applies.
 *
 * `showFooter`/`primaryActionLabel`/`onPrimaryAction`/`primaryActionDisabled`/
 * `secondaryActionLabel`/`onSecondaryAction`/`secondaryActionDisabled`/`showSecondaryButton`
 * (2026-08, corrected — previously ALL dropped on the claim "no upstream counterpart," which was
 * wrong: the real adapter's `Modal.Footer` is exactly this, a real exported sub-component
 * (`Modal.Footer` on the same `Modal` export) with its own documented convention — "aligns its
 * children to the right... primary action button MUST be the right-most element, with the
 * secondary action placed immediately to the left of it." The catch, and why this was missed:
 * it's not a prop on the top-level `<Modal>` — it only works if a `<Modal.Footer>` ELEMENT is
 * included among `<Modal>`'s own `children`. The real `ModalBody` internally scans its children
 * for one (matching on `child.type === ModalFooter`) and pulls it out of the scrolling area to
 * pin it at the bottom; without one present, nothing renders there, no matter what other props
 * are set — exactly the bug this fixes. Built here as a `<MantineModal.Footer>` containing
 * Forge's own `Button` adapter (`variant="text"` for secondary, `variant="solid"` for primary,
 * matching the static preview's established look), appended after `content`/`children` so
 * `ModalBody`'s own children-scan finds it regardless of where in the list it sits.
 *
 * `showHeader`/`scrollable` still have no real destination: `showHeader` because the real
 * Modal already conditionally renders its header on `title || withCloseButton` with no
 * independent toggle, and `scrollable` because the real `ModalBody` always scrolls its content
 * area — there's no non-scrolling mode to opt out of.
 *
 * `position`/`draggable`/`onPositionChange` — GAP: the adapter's Modal is a centred Mantine
 * Modal with no anchored positioning and no dragging, which Forge's colour/opacity pickers need
 * (they open beside the control they edit and can be dragged aside). Still an adapter gap (2.1
 * in docs/ADAPTER_CAPABILITY_GAPS.md); the pickers route around it via Forge's own
 * FloatingPalette instead of a Modal, so these props don't reach here in practice.
 *
 * `size`/`radius`/`shadow` removed from ModalProps entirely (2026-08) — see common/Modal.ts.
 */

import React from 'react'
import { Modal as MantineModal } from '@recursica/mantine-adapter'
import { Button } from '../../Button'
import type { ModalProps } from '../../common/Modal'
import type { AssertWired } from '../../common/wiringCheck'

export default React.forwardRef<any, ModalProps>(function Modal({
    children,
    content,
    isOpen,
    onClose,
    title,
    padding,
    layer,
    className,
    style,
    withOverlay,
    centered,
    trapFocus,
    zIndex,
    showCloseButton,
    showFooter,
    showSecondaryButton,
    primaryActionLabel,
    onPrimaryAction,
    primaryActionDisabled,
    secondaryActionLabel,
    onSecondaryAction,
    secondaryActionDisabled,
    mantine,
}, ref) {
    const hasFooterContent = showFooter !== false && (primaryActionLabel || secondaryActionLabel)
    const footer = hasFooterContent ? (
        <MantineModal.Footer>
            {showSecondaryButton !== false && secondaryActionLabel && (
                <Button
                    variant="text"
                    layer={layer}
                    onClick={onSecondaryAction}
                    disabled={secondaryActionDisabled}
                >
                    {secondaryActionLabel}
                </Button>
            )}
            {primaryActionLabel && (
                <Button
                    variant="solid"
                    layer={layer}
                    onClick={onPrimaryAction}
                    disabled={primaryActionDisabled}
                >
                    {primaryActionLabel}
                </Button>
            )}
        </MantineModal.Footer>
    ) : null

    return (
        <MantineModal
            overStyled
            opened={isOpen}
            onClose={onClose}
            title={title}
            withCloseButton={showCloseButton}
            padding={padding === false ? 0 : undefined}
            withOverlay={withOverlay}
            centered={centered}
            trapFocus={trapFocus}
            zIndex={zIndex}
            className={className}
            style={style}
            {...mantine}
            ref={ref}
        >
            {content}
            {children}
            {footer}
        </MantineModal>
    )
})

// Compile-time only — fails the build the moment ModalProps declares a prop with no real,
// type-compatible home on the real Modal — directly, or via the renames below.
//
// `content`/`children` are excluded: merged into the real single `children` slot above, so
// checking either name individually would be a false positive. `padding` is excluded: adapted
// above (boolean -> MantineSpacing), not passed through unchanged. `zIndex`/`className`/`style`
// are excluded: real, functioning props (see header comment) that only compile because this
// wrapper renders with `overStyled: true` — `RecursicaOverStyled`'s discriminated-union type
// means `keyof` on the real component's props can't see any blocked-styling key at all
// (present in one union branch, absent in the other), so this generic check would flag them as
// having "no real field under this name" even though the literal JSX attribute above already
// type-checks them correctly. `layer` is Forge-only bookkeeping (see FORGE_ONLY_PROPS), not
// used for CSS var lookups here — only forwarded into the footer's `Button`s.
// `showFooter`/`showSecondaryButton`/`primaryActionLabel`/`onPrimaryAction`/
// `primaryActionDisabled`/`secondaryActionLabel`/`onSecondaryAction`/`secondaryActionDisabled`
// are excluded: composed into the `<MantineModal.Footer>` element above (a real reshape, not a
// rename), so the literal JSX above is what actually gets checked.
//
// `showHeader`/`scrollable`/`position`/`draggable`/`onPositionChange` have no real destination
// at all (see header comment for why).
type _Wiring = AssertWired<
    ModalProps,
    typeof MantineModal,
    | 'layer' | 'elevation' | 'mantine' | 'material' | 'carbon'
    | 'content' | 'children' | 'padding' | 'zIndex' | 'className' | 'style'
    | 'showHeader' | 'showFooter' | 'scrollable' | 'showSecondaryButton'
    | 'primaryActionLabel' | 'onPrimaryAction' | 'primaryActionDisabled'
    | 'secondaryActionLabel' | 'onSecondaryAction' | 'secondaryActionDisabled'
    | 'position' | 'draggable' | 'onPositionChange',
    { isOpen: 'opened'; showCloseButton: 'withCloseButton' }
>
const _wiringCheck: _Wiring = true
