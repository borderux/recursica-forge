/**
 * Slider Component Adapter
 *
 * Unified Slider component that renders the appropriate library implementation
 * based on the current UI kit selection.
 *
 * Deliberately thin: label/value-label/tooltip rendering used to be independently
 * reimplemented here AND inside the Material and Carbon per-kit wrappers (three separate
 * copies of the same "format the value for display" logic, one of which was a no-op dead
 * duplicate and another of which double-rendered the value on screen). That's now the sole
 * responsibility of each per-kit wrapper, matching how every other field component works —
 * Mantine delegates it entirely to the real adapter's own layout; Material/Carbon own their
 * own layout, same as TextField/NumberInput/etc. This dispatcher only translates Forge's own
 * `showMinMaxInput` convenience into `showInput`/`showValueLabel`, and forwards everything
 * else untouched.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import { buildComponentCssVarPath } from '../utils/cssVarNames'
import type { SliderProps } from './common/Slider'

// Re-exported so existing `import type { SliderProps } from '.../adapters/Slider'`
// call sites keep working — the types now live in common/Slider.ts.
export type { SliderProps } from './common/Slider'

export function Slider({
  value,
  onChange,
  onChangeCommitted,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  state = 'default',
  errorText,
  type = 'continuous',
  layout = 'stacked',
  layer = 'layer-0',
  label,
  showInput,
  showMinMaxInput = false,
  showValueLabel = false,
  valueLabel,
  minLabel,
  maxLabel,
  showMinMaxLabels,
  minIcon,
  maxIcon,
  iconSize,
  readOnly = false,
  className,
  style,
  mantine,
  material,
  carbon,
}: SliderProps) {
  // Use showMinMaxInput as a master toggle if showInput/showValueLabel aren't explicitly provided
  const finalShowInput = showInput ?? showMinMaxInput
  const finalShowValueLabel = showValueLabel || (showMinMaxInput && !finalShowInput)
  const finalShowMinMaxLabels = showMinMaxLabels ?? true

  const Component = useComponent('Slider')
  const topBottomMarginVar = buildComponentCssVarPath('Slider', 'variants', 'layouts', layout, 'properties', 'top-bottom-margin')

  return (
    <div
      style={{
        marginTop: `var(${topBottomMarginVar})`,
        marginBottom: `var(${topBottomMarginVar})`,
        flexGrow: 1,
        minWidth: 0,
        ...style,
      }}
    >
      <Suspense fallback={<span />}>
        <Component
          value={value}
          onChange={onChange}
          onChangeCommitted={onChangeCommitted}
          min={min}
          max={max}
          step={step}
          disabled={disabled || state === 'disabled'}
          state={state}
          errorText={errorText}
          type={type}
          layout={layout}
          layer={layer}
          label={label}
          showInput={finalShowInput}
          showValueLabel={finalShowValueLabel}
          valueLabel={valueLabel}
          minLabel={minLabel}
          maxLabel={maxLabel}
          showMinMaxLabels={finalShowMinMaxLabels}
          minIcon={minIcon}
          maxIcon={maxIcon}
          iconSize={iconSize}
          readOnly={readOnly}
          className={className}
          mantine={mantine}
          material={material}
          carbon={carbon}
        />
      </Suspense>
    </div>
  )
}
