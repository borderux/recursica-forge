/**
 * Mantine Stepper Adapter
 *
 * @recursica/mantine-adapter's Stepper is a COMPOSITION api: it renders `Stepper.Step` children,
 * each carrying its own label/description/icon, rather than accepting Forge's data-driven
 * `steps` array directly. This wrapper is the one place that bridges the two.
 *
 * `active`, `onStepClick`, `orientation` and `size` are all real, matching fields on the real
 * root (`RecursicaStepperProps.size` covers `'small' | 'large'` exactly; the rest come straight
 * from Mantine's own `StepperProps`), so they're passed through unchanged.
 *
 * Forge's root `children` prop is dropped: nothing in the app passes raw JSX children to
 * `Stepper` (every call site drives it through `steps`), and now that `steps` composes the real
 * `Stepper.Step` children, there's nothing left for a raw `children` override to usefully do.
 *
 * `className`/`style` aren't forwarded: the real Stepper is gated by `RecursicaOverStyled` and
 * ignores both unless the caller opts in with `overStyled: true` — which the `mantine` escape
 * hatch can still do (`mantine={{ overStyled: true, style: {...} }}`).
 */

import { Stepper as MantineStepper } from '@recursica/mantine-adapter'
import type { StepperProps } from '../../common/Stepper'
import type { AssertWired } from '../../common/wiringCheck'

export default function Stepper({
  active,
  onStepClick,
  orientation = 'horizontal',
  size = 'large',
  steps = [],
  mantine,
}: StepperProps) {
  return (
    <MantineStepper active={active} onStepClick={onStepClick} orientation={orientation} size={size} {...mantine}>
      {steps.map((step, index) => (
        <MantineStepper.Step
          key={index}
          label={step.label}
          description={step.description}
          icon={step.icon}
          loading={step.loading}
          allowStepSelect={step.allowStepSelect}
        />
      ))}
    </MantineStepper>
  )
}

// `steps` is composed into `Stepper.Step` children above, not forwarded raw. `children` is
// dropped per the comment above (no call site relies on it, and `steps` now drives composition).
// `className`/`style` are dropped per the `RecursicaOverStyled` note above.
type _Wiring = AssertWired<
  StepperProps,
  typeof MantineStepper,
  'steps' | 'children' | 'layer' | 'className' | 'style' | 'mantine' | 'material' | 'carbon'
>
const _wiringCheck: _Wiring = true
