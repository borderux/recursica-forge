/**
 * ColorTriggerControl — a Forge-local form control. NOT from the adapter.
 *
 * Why this exists
 * ---------------
 * A colour prop row needs a control that *looks* like a text field but *behaves* like a
 * button: it shows a swatch plus the resolved token name, and clicking it opens a picker. It
 * is never typed into.
 *
 * This was previously built out of the adapter's TextField with `readOnly` + `leadingIcon` +
 * `onClick`. That does not survive the real adapter, and it is a semantic mismatch rather
 * than a naming one: upstream `readOnly` is an execution barrier that swaps the whole input
 * for a ReadOnlyField text renderer (see WithReadOnlyWrapper). The swatch, the chevron and
 * the click target all live on the active-input path that never renders — which is why the
 * row collapsed to plain text. No prop mapping can bridge that, because upstream `readOnly`
 * means "display mode" while Forge meant "not typeable, still interactive".
 *
 * @recursica/mantine-adapter has no colour-picker or picker-trigger component today, and no
 * "not typeable but still interactive" field mode. Recorded as gap 2.3 in
 * docs/ADAPTER_CAPABILITY_GAPS.md. If one is added, this should be deleted in favour of it. Until then it is deliberately local, and
 * styled entirely from the same design tokens the adapter's own fields read, so it stays
 * visually consistent with real components and responds to token edits like they do.
 */

import type { KeyboardEvent, MouseEvent, ReactNode } from 'react'
import './ColorTriggerControl.css'

export interface ColorTriggerControlProps {
  /** Field label rendered above the control. */
  label?: ReactNode
  /** Resolved value shown in the control, e.g. "Palette 1 / primary". */
  value: ReactNode
  /** Leading element — the colour swatch. */
  swatch?: ReactNode
  /** Trailing element, typically a chevron. */
  trailing?: ReactNode
  /** Opens the picker. Not called while disabled. */
  onActivate?: (event: MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>) => void
  disabled?: boolean
  /** Optional action beside the label (Forge's global-reference affordance). */
  labelAction?: ReactNode
  className?: string
  style?: React.CSSProperties
  /** Accessible name when `label` is absent or non-textual. */
  ariaLabel?: string
}

export function ColorTriggerControl({
  label,
  value,
  swatch,
  trailing,
  onActivate,
  disabled = false,
  labelAction,
  className,
  style,
  ariaLabel,
}: ColorTriggerControlProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // Behave like a button: Enter and Space activate. Space is prevented so the panel
    // underneath does not scroll.
    if (event.key === 'Enter' || event.key === ' ') {
      if (disabled) return
      event.preventDefault()
      onActivate?.(event)
    }
  }

  return (
    <div className={`color-trigger-control ${className ?? ''}`.trim()} style={style}>
      {(label || labelAction) && (
        <div className="color-trigger-control__label-row">
          {label && <span className="color-trigger-control__label">{label}</span>}
          {labelAction}
        </div>
      )}

      <div
        // A div with an explicit button role rather than a <button>: the swatch and the
        // trailing chevron are arbitrary nodes, and nesting interactive content inside a
        // button is invalid.
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        aria-label={ariaLabel}
        data-disabled={disabled || undefined}
        className="color-trigger-control__field"
        onClick={disabled ? undefined : onActivate}
        onKeyDown={handleKeyDown}
      >
        {swatch && <span className="color-trigger-control__swatch">{swatch}</span>}
        <span className="color-trigger-control__value">{value}</span>
        {trailing && <span className="color-trigger-control__trailing">{trailing}</span>}
      </div>
    </div>
  )
}

export default ColorTriggerControl
