/**
 * Mantine Accordion Adapter
 *
 * @recursica/mantine-adapter's Accordion is a COMPOSITION api — it renders `Accordion.Item`
 * children, each composing its own `Control`/`Panel`, rather than taking Forge's data-driven
 * `items` array. This wrapper is the one place that bridges the two.
 *
 * `className`/`style` aren't forwarded: the adapter styles itself purely from tokens and
 * ignores both unless the caller opts in with `overStyled: true` — which the `mantine`
 * escape hatch can still do (`mantine={{ overStyled: true, style: {...} }}`).
 */

import {
  Accordion as MantineAccordion,
  AccordionItem as MantineAccordionItem,
  AccordionControl,
  AccordionPanel,
} from '@recursica/mantine-adapter'
import type { AccordionAdapterProps } from '../../common/Accordion'
import type { AssertWired } from '../../common/wiringCheck'

export default function Accordion({
  items,
  allowMultiple,
  openItems,
  onOpenItemsChange,
  mantine,
}: AccordionAdapterProps) {
  return (
    <MantineAccordion
      multiple={allowMultiple}
      value={allowMultiple ? openItems : (openItems[0] ?? null)}
      onChange={(value) =>
        onOpenItemsChange(value == null ? [] : Array.isArray(value) ? value : [value])
      }
      {...mantine}
    >
      {items.map((item) => {
        const ItemIcon = item.icon
        return (
          <MantineAccordionItem key={item.id} value={item.id} divider={item.divider} disabled={item.disabled}>
            <AccordionControl leftIcon={ItemIcon ? <ItemIcon /> : undefined}>
              {item.title}
            </AccordionControl>
            <AccordionPanel>{item.content}</AccordionPanel>
          </MantineAccordionItem>
        )
      })}
    </MantineAccordion>
  )
}

// `items`/`allowMultiple`/`openItems`/`onOpenItemsChange` are all consumed above to build the
// composed children and the reshaped `multiple`/`value`/`onChange`, not forwarded raw.
// `onItemToggle` is a real, accepted-but-unread gap: Mantine's own `onChange` already returns
// the whole open-items array, so nothing here needs the per-item callback — harmless for this
// adapter specifically, but would matter for a future one that only fires per-item events.
// `layer`/`elevation` never arrive (stripped by FORGE_ONLY_PROPS before this wrapper runs).
// `className`/`style` aren't forwarded — see the header comment.
type _Wiring = AssertWired<
  AccordionAdapterProps,
  typeof MantineAccordion,
  | 'items'
  | 'allowMultiple'
  | 'openItems'
  | 'onOpenItemsChange'
  | 'onItemToggle'
  | 'layer'
  | 'elevation'
  | 'className'
  | 'style'
  | 'mantine'
  | 'material'
  | 'carbon'
>
const _wiringCheck: _Wiring = true
