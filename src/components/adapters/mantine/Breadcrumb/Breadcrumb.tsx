/**
 * Mantine Breadcrumb Adapter
 *
 * @recursica/mantine-adapter's Breadcrumb wraps Mantine's `Breadcrumbs`, which takes an array
 * of link/anchor elements as `children` — it has no `items` data prop at all. The old bare
 * pass-through handed Forge's `items` straight to a component that doesn't recognize that
 * attribute, so nothing ever rendered. This wrapper composes `items` into real `Link` elements,
 * the same way the material/carbon Breadcrumb implementations already do.
 *
 * `separator` is a real, matching field upstream, but it wants a `ReactNode` glyph, not Forge's
 * `'slash' | 'chevron' | 'arrow'` keyword — translated below into an icon (falling back to a
 * plain `/` character if the icon library ever comes up short).
 *
 * `showHomeIcon` has no upstream equivalent (`RecursicaBreadcrumbProps` is empty) — implemented
 * here as a real fix, prefixing a home icon onto the first breadcrumb item, mirroring how the
 * material/carbon wrappers already handle it.
 *
 * `className`/`style` aren't forwarded: the real Breadcrumb is gated by `RecursicaOverStyled`
 * (both are on `BlockedStylingKeys`) and ignores both unless the caller opts in with
 * `overStyled: true` — which the `mantine` escape hatch can still do
 * (`mantine={{ overStyled: true, style: {...} }}`).
 */

import { Breadcrumb as MantineBreadcrumb } from '@recursica/mantine-adapter'
import { Link } from '../../Link'
import { iconNameToReactComponent } from '../../../../modules/components/iconUtils'
import type { BreadcrumbProps } from '../../common/Breadcrumb'
import type { AssertWired } from '../../common/wiringCheck'

const SEPARATOR_ICON_NAMES = {
  slash: 'slash',
  chevron: 'chevron-right',
  arrow: 'arrow-right',
} as const satisfies Record<NonNullable<BreadcrumbProps['separator']>, string>

export default function Breadcrumb({
  items,
  separator = 'slash',
  showHomeIcon = false,
  layer = 'layer-0',
  mantine,
}: BreadcrumbProps) {
  const SeparatorIcon = iconNameToReactComponent(SEPARATOR_ICON_NAMES[separator])
  const separatorElement = SeparatorIcon ? <SeparatorIcon size={14} /> : <span>/</span>

  const HomeIcon = showHomeIcon ? iconNameToReactComponent('house') : null

  // Mirrors the dispatcher-level 5-item cap the old pass-through relied on the (never
  // reached) real component to apply.
  const limitedItems = items.slice(0, 5)

  return (
    <MantineBreadcrumb separator={separatorElement} {...mantine}>
      {limitedItems.map((item, index) => {
        const isLast = index === limitedItems.length - 1
        const isInteractive = !isLast && !!item.href
        return (
          <Link
            key={`${item.label}-${index}`}
            href={isInteractive ? item.href : undefined}
            layer={layer}
            underline={isInteractive ? 'hover' : 'none'}
            startIcon={index === 0 && HomeIcon ? <HomeIcon size={14} /> : undefined}
          >
            {item.label}
          </Link>
        )
      })}
    </MantineBreadcrumb>
  )
}

// `items`/`separator`/`showHomeIcon` are all consumed above to build the real `children` array
// and the translated separator glyph, not forwarded raw. `layer` only feeds the composed
// `Link` elements. `className`/`style` are dropped per the `RecursicaOverStyled` note above.
type _Wiring = AssertWired<
  BreadcrumbProps,
  typeof MantineBreadcrumb,
  | 'items'
  | 'separator'
  | 'showHomeIcon'
  | 'layer'
  | 'className'
  | 'style'
  | 'mantine'
  | 'material'
  | 'carbon'
>
const _wiringCheck: _Wiring = true
