/**
 * AssistiveElement Component Adapter
 *
 * Unified AssistiveElement component that renders the appropriate library implementation
 * based on the current UI kit selection.
 * Used for help text and error text in forms.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { AssistiveElementProps } from './common/AssistiveElement'
import { isLocalAdapter } from '../registry/activeAdapter'
import { AssistiveElement as LocalAssistiveElement } from './local/dispatch/AssistiveElement'

// Re-exported so existing `import type { AssistiveElementProps } from '.../adapters/AssistiveElement'`
// call sites keep working — the types now live in common/AssistiveElement.ts.
export type { AssistiveElementProps } from './common/AssistiveElement'

function SharedAssistiveElement({
  text,
  variant = 'help',
  icon,
  layer = 'layer-0',
  className,
  style,
  mantine,
  material,
  carbon,
}: AssistiveElementProps) {
  const Component = useComponent('AssistiveElement')

  return (
    <Suspense fallback={<span />}>
      <Component
        text={text}
        variant={variant}
        icon={icon}
        layer={layer}
        className={className}
        style={style}
        mantine={mantine}
        material={material}
        carbon={carbon}
      />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const AssistiveElement = (isLocalAdapter ? LocalAssistiveElement : SharedAssistiveElement) as typeof SharedAssistiveElement
