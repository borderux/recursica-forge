/**
 * Compile-time-only prop-wiring check.
 *
 * Nothing in this file runs. Its only job is to make `tsc` fail — naming the exact offending
 * prop in the error message — the moment a component's Forge prop vocabulary and the real
 * `@recursica/mantine-adapter` component it dispatches to drift apart.
 *
 * WHY THIS EXISTS: a one-line pass-through wrapper (`export { X as default } from
 * '@recursica/mantine-adapter'`) never writes any code that reconciles Forge's prop names
 * against the real component's — so there's nothing for TypeScript to check. And even a
 * wrapper that DOES call the real component ends up spreading a pre-built props object
 * (`<Real {...props} />`) rather than writing literal attributes — and TypeScript's "you
 * passed a prop that doesn't exist" check only fires on fresh object literals, not on a
 * spread of an already-typed variable. Both patterns let a prop silently do nothing forever.
 * `AssertWired` closes both gaps without changing how props are actually passed at runtime.
 *
 * USAGE — at the bottom of a mantine/{X}/{X}.tsx wrapper file:
 *
 *   type _Wiring = AssertWired<XProps, typeof RealX,
 *     'layer' | 'elevation' | 'mantine' | 'material' | 'carbon',        // Forge-internal / documented drops
 *     { helpText: 'assistiveText'; errorText: 'error' }                  // declared renames
 *   >
 *   const _wiringCheck: _Wiring = true
 *
 * - A prop passed straight through UNCHANGED (same name, no translation in code): list
 *   nothing extra, let the check compare it directly against the real prop of the same name.
 * - A prop your wrapper explicitly translates as a literal JSX attribute (renamed, reshaped,
 *   or adapted — e.g. wrapping a native `onChange(event)` into Forge's `onChange(checked:
 *   boolean)`): put it in `Ignore`. The literal attribute where you do that translation is
 *   already type-checked on its own; re-checking the untranslated shape here would be a
 *   false positive, not a safety net.
 * - A prop handled by the *central* rename table (`adapterPropContract.ts`'s `PROP_CONTRACT`/
 *   `FIELD_CONTRACT`, for components with no wrapper-level translation code): declare it in
 *   the `Rename` map instead of `Ignore`, so this check verifies the rename target is a real,
 *   type-compatible field — the central table itself has no such check today, which is how
 *   `TransferList`'s `searchable` regression went unnoticed after upstream added a real
 *   `searchable` prop the table still nulls.
 * - A prop genuinely dropped (documented adapter gap, e.g. no upstream sizing hook) or
 *   Forge-internal (`layer`, `elevation`, the `mantine`/`material`/`carbon` escape hatches):
 *   add it to `Ignore` with a comment explaining why, matching the existing pattern in
 *   `adapterPropContract.ts`.
 */

import type { ComponentType } from 'react'

type RealPropsOf<C> = C extends ComponentType<infer P> ? P : never

/** Forge prop name -> real prop name, for props a wrapper (or the central contract table)
 *  renames rather than passing through unchanged. */
type RenameMap<ForgeProps> = Partial<Record<keyof ForgeProps, string>>

type CheckKey<ForgeProps, RealProps, K extends keyof ForgeProps, R extends RenameMap<ForgeProps>> =
  K extends keyof R
    ? R[K] extends keyof RealProps
      ? [ForgeProps[K]] extends [RealProps[R[K]]] ? never : K // renamed to a real field, but the type doesn't match
      : K // renamed to a name the real component doesn't actually have
    : K extends keyof RealProps
      ? [ForgeProps[K]] extends [RealProps[K]] ? never : K // same name, but the type doesn't match
      : K // no real field under this name at all

type UnwiredKeys<ForgeProps, RealProps, R extends RenameMap<ForgeProps>> = {
  [K in keyof ForgeProps]-?: CheckKey<ForgeProps, RealProps, K, R>
}[keyof ForgeProps]

/**
 * Resolves to `true` if every prop in `ForgeProps` (other than those in `Ignore`) has a real,
 * type-compatible home on `RealComponent` — directly, or via `Rename`. Otherwise resolves to
 * the union of offending prop names, which fails the `const _wiringCheck: _Wiring = true`
 * assignment with those names spelled out in the compiler error.
 */
export type AssertWired<
  ForgeProps,
  RealComponent,
  Ignore extends string = never,
  Rename extends RenameMap<ForgeProps> = {},
> = Exclude<UnwiredKeys<ForgeProps, RealPropsOf<RealComponent>, Rename>, Ignore> extends never
  ? true
  : Exclude<UnwiredKeys<ForgeProps, RealPropsOf<RealComponent>, Rename>, Ignore>
