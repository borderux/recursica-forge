/**
 * NoAdapterImplementation
 *
 * The universal fallback `useComponent()` renders when the active UI kit has no
 * registered implementation for a component. Deliberately dumb: a grey box saying so
 * beats a silently blank screen, and it's the same box everywhere instead of every
 * dispatcher hand-rolling its own "library not available" UI.
 */

export function NoAdapterImplementation({ componentName }: { componentName?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 40,
        padding: 8,
        background: '#e0e0e0',
        color: '#666',
        border: '1px dashed #999',
        borderRadius: 4,
        fontSize: 13,
        fontFamily: 'sans-serif',
        textAlign: 'center',
      }}
    >
      {componentName ? `${componentName}: ` : ''}Component not implemented
    </div>
  )
}
