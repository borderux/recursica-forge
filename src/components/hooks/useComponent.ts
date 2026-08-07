/**
 * useComponent Hook
 *
 * Returns the appropriate component implementation based on the current UI kit.
 */

import React, { useMemo } from 'react'
import { Layer } from '@recursica/mantine-adapter'
import { AdapterErrorBoundary } from './AdapterErrorBoundary'
import { applyPropContract } from './adapterPropContract'
import { useUiKit } from '../../modules/uikit/UiKitContext'
import { getComponent } from '../registry'
import type { ComponentName } from '../registry/types'

/**
 * React-owned fields that identify what kind of component something is. Copying any of
 * these from the wrapped component onto our wrapper would change how React renders the
 * wrapper itself. See the copy loop at the bottom of useComponent.
 */
const REACT_INTERNAL_KEYS = new Set([
  '$$typeof',
  '_payload',
  '_init',
  '_result',
  '_status',
  'render',
  'compare',
  'type',
  'displayName',
])

/**
 * Translates Forge's `layer="layer-N"` string into the numeric layer
 * @recursica/mantine-adapter's `<Layer>` expects. Returns null for layer-0 and for
 * anything unparseable.
 *
 * layer-0 returns null on purpose: core/bootstrap.ts puts data-recursica-layer="0"
 * on <html>, so layer-0 variables already resolve ambiently. Skipping the wrapper in
 * that (very common) case avoids injecting a stray block-level div into preview and
 * chrome layouts. Layers 1–3 genuinely need the element to carry the attribute.
 */
function toWrapperLayer(layer: unknown): 1 | 2 | 3 | null {
  const match = typeof layer === 'string' ? /^layer-([0-9]+)$/.exec(layer) : null
  const n = match ? Number(match[1]) : typeof layer === 'number' ? layer : NaN
  return n === 1 || n === 2 || n === 3 ? n : null
}

export function useComponent<T = any>(componentName: ComponentName): React.ComponentType<T> | null {
  const { kit } = useUiKit()

  return useMemo(() => {
    const Component = getComponent(kit, componentName)
    if (!Component) return null

    // Return a wrapper that strips out other library props before passing to the adapter
    // This allows inner adapters to omit `mantine`, `material`, `carbon` from their destructuring
    //
    // forwardRef is required: the real adapter's components are forwardRef/polymorphic and
    // callers do pass refs through the dispatchers. A plain function component would drop
    // them and warn ("Function components cannot be given refs").
    const Wrapper = React.forwardRef<unknown, any>((props, ref) => {
      const { mantine, material, carbon, ...rest } = props

      // Mantine is now the real published adapter (@recursica/mantine-adapter), whose prop
      // vocabulary differs from Forge's old local implementations. applyPropContract()
      // renames what has an equivalent and drops what does not — see adapterPropContract.ts.
      //
      // Dropping matters: the adapter does not filter unknown props, so anything it doesn't
      // recognise reaches the DOM and React warns about it. `layer` is handled here rather
      // than in the table because it becomes a wrapper element, not a prop.
      //
      // `style` and `className` are deliberately NOT stripped. The adapter runs its own
      // filterStylingProps() and ignores them unless overStyled is set — letting its real
      // policy apply is the point of using the real adapter.
      if (kit === 'mantine') {
        const mantineRest = applyPropContract(componentName, rest)
        const element = React.createElement(Component as any, { ...mantineRest, ref })
        const wrapperLayer = toWrapperLayer(rest.layer)
        const layered = wrapperLayer
          ? React.createElement(Layer, { layer: wrapperLayer }, element)
          : element

        // Contain render-time throws so one prop-contract mismatch can't blank the route.
        return React.createElement(
          AdapterErrorBoundary,
          { componentName },
          layered
        )
      }

      const activeProps: any = {}
      if (kit === 'material' && material !== undefined) activeProps.material = material
      if (kit === 'carbon' && carbon !== undefined) activeProps.carbon = carbon

      return React.createElement(Component as any, { ...rest, ...activeProps, ref })
    })
    Wrapper.displayName = `AdapterWrapper(${componentName})`

    // Copy over any static properties (like Tabs.List, Tabs.Tab, Tabs.Panel).
    //
    // React's own internal fields must NOT be copied. getComponent() returns a
    // React.lazy object whose own enumerable keys include `$$typeof`, `_payload` and
    // `_init`; assigning those onto Wrapper makes React classify Wrapper as a lazy
    // component and render the underlying component directly, silently skipping this
    // wrapper's body — which would defeat the prop translation, ref forwarding and
    // error boundary above.
    for (const key of Object.keys(Component)) {
      if (REACT_INTERNAL_KEYS.has(key)) continue
      ;(Wrapper as any)[key] = (Component as any)[key]
    }

    return Wrapper as unknown as React.ComponentType<T>
  }, [kit, componentName])
}
