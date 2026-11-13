/**
 * Timeline Component Adapter
 *
 * Thin dispatcher: renders the local adapter's Timeline, or forwards props to the real
 * adapter via useComponent('Timeline'). Display-only component for showing events in
 * chronological order.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { TimelineProps } from './common/Timeline'
import { isLocalAdapter } from '../registry/activeAdapter'
import { Timeline as LocalTimeline } from './local/dispatch/Timeline'

// Re-exported so existing `import type { TimelineItemData } from '.../adapters/Timeline'`
// call sites keep working — the types now live in common/Timeline.ts.
export type { TimelineItemData, TimelineProps } from './common/Timeline'

function SharedTimeline({ active = 1, ...props }: TimelineProps) {
  const Component = useComponent('Timeline')
  return (
    <Suspense fallback={<span />}>
      <Component active={active} {...props} />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const Timeline = (isLocalAdapter ? LocalTimeline : SharedTimeline) as typeof SharedTimeline
