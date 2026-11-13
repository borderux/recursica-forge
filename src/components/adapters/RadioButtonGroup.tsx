/**
 * RadioButtonGroup Component Adapter
 *
 * Groups multiple RadioButtonItems together. Label, assistive text and layout are composed by
 * each library's own wrapper.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { RadioButtonGroupProps } from './common/RadioButtonGroup'
import { isLocalAdapter } from '../registry/activeAdapter'
import { RadioButtonGroup as LocalRadioButtonGroup } from './local/dispatch/RadioButtonGroup'

// Re-exported so existing `import type { RadioButtonGroupProps } from '.../adapters/RadioButtonGroup'`
// call sites keep working — the types now live in common/RadioButtonGroup.ts.
export type { RadioButtonGroupProps } from './common/RadioButtonGroup'

function SharedRadioButtonGroup(props: RadioButtonGroupProps) {
  const Component = useComponent('RadioButtonGroup')

  return (
    <Suspense fallback={null}>
      <Component {...props} />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const RadioButtonGroup = (isLocalAdapter ? LocalRadioButtonGroup : SharedRadioButtonGroup) as typeof SharedRadioButtonGroup
