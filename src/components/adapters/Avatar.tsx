/**
 * Avatar Component Adapter
 *
 * Thin dispatcher: renders the local adapter's Avatar, or forwards props to the real
 * adapter's via useComponent.
 *
 * Forge defaults applied here because the real adapter has no equivalent: `colorVariant`
 * defaults to 'text-ghost' (the real Avatar defaults to solid), icon variants without a
 * `fallback` get the "user" icon, and the 'image' variant without a `src` gets the
 * placeholder image.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import { iconNameToReactComponent } from '../../modules/components/iconUtils'
import type { AvatarProps } from './common/Avatar'
import { isLocalAdapter } from '../registry/activeAdapter'
import { Avatar as LocalAvatar } from './local/dispatch/Avatar'

// Re-exported so existing `import type { AvatarProps } from '.../adapters/Avatar'`
// call sites keep working — the types now live in common/Avatar.ts.
export type { AvatarProps } from './common/Avatar'

function defaultFallback(colorVariant: AvatarProps['colorVariant']) {
  const UserIcon = colorVariant?.startsWith('icon') ? iconNameToReactComponent('user') : null
  return UserIcon ? <UserIcon style={{ width: '100%', height: '100%' }} /> : undefined
}

function SharedAvatar({ colorVariant = 'text-ghost', src, fallback, ...rest }: AvatarProps) {
  const Component = useComponent('Avatar')
  return (
    <Suspense fallback={<span />}>
      <Component
        {...rest}
        colorVariant={colorVariant}
        src={src || (colorVariant === 'image' ? '/avatar-placeholder.png' : src)}
        fallback={fallback !== undefined ? fallback : defaultFallback(colorVariant)}
      />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const Avatar = (isLocalAdapter ? LocalAvatar : SharedAvatar) as typeof SharedAvatar
