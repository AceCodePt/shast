# Handoff: HTML conditional attributes

## What shipped

Any HTML attribute key may hold a complex value of the same
`{ [value]: { self, children } }` shape as `BaseCSSAttributeComplexValue`.
The mechanism is generic and vocabulary-free: the test-only registry in
`tests/html/conditional-attributes.test.ts` supplies an `input` whose `type`
gates `checked` / `min` / `max` / `accept`, a `div` whose `mode` unlocks a child
attribute, and an `id` with one literal and one patterned key.

- `src/html/attribute-config/types.ts` - `BaseHTMLAttributeComplexValue`,
  `ValidateHTMLAttributesConfig` / `InferHTMLAttributesConfig` handling both
  arms. All-flat configs keep the historical merged-object inference; a complex
  value switches to the CSS-style union of per-value variants.
- `src/engine/gate-resolution.ts` - the one runtime resolver for CSS and HTML:
  literal-first, patterns parsed with `parseValueAgainstDSL`, two matching keys
  an error, no match a message about the value. Also hosts the shared
  `valuesUnlocking` / `lockedMessageFor` / `slotDSL` helpers.
- `src/engine/types.ts` - HTML attribute gates built on the shared `GateTable` /
  `GateLookup`; branded locked messages (`'checked' requires type: checkbox |
  radio`); `undefined`-arm optionality through `MaybeAttributes`; `ComponentIds`.
- `src/engine/index.ts` - runtime conformance: own-gate pre-pass, self unlocks,
  precomputed children bag, branded locked messages, required-attribute check.
- `src/engine/render/render-component.ts` - fills in a single-literal `self`
  unlock when omitted, using the same resolver.
- `README.md`, `TASK.md` - documented as the third structural binding.

## Predicted gaps - which materialised

1. **Threading unlocked attributes through the three validation types** -
   materialised, but not as predicted. The child cannot see the parent's tag
   config, so raw parent attributes were insufficient for `children` unlocks.
   Instead the parent precomputes a `ParentChildrenBag`
   (`HTMLChildrenUnlocks<...>`) from its merged config and written gates and
   threads that alongside `AllowedTags` / `CurrentTag`. The runtime mirrors this
   with a precomputed `childrenBag`, so `forwardAllowed` was not touched.
2. **Type-level pattern resolution and the overlap second pass** - materialised.
   `ResolveComplexValue` now maps `<token>` and backtick keys to their
   template-literal types. Overlap is detected by wrapping each resolved value
   in `GateEntry<V, Props>`: two matching patterns make the intersection's
   `__gateKey` reduce to `never`, which is the overlap signal. It costs no
   `UnionToTuple` and is a plain indexed-access + conditional.
3. **`children` unlocks crossing `GetAllowedTags`** - did not cross it.
   Tag-permission logic is untouched; children unlocks are a separate bag.
4. **Render-time fill-in and `skipValidation: true`** - materialised as
   expected. `renderComponent` now receives the global attribute config and the
   merged keywords (the engine binds them). `skipValidation` remains a full
   pass-through of `createComponent`; fill-in is render-only and still runs.

## Shape of the per-registry unlocked table

`GateTable<Keywords, SyntaxConfig, Config, Slot>` is parameterised only by the
registry, so it is instantiated once per program:

```ts
{
  [K in complex keys]: {
    [V in value keys as ResolveComplexValue<DSL, V>]:
      GateEntry<V, { [P in keyof Config[K][V][Slot]]?: DSLInfer<...> }>
  }
}
```

`GateEntry` is nominal: `{ __gateKey: V; __gateProps: Bag }`. A lookup
(`GateLookup`) is literal-first because TypeScript's own index lookup prefers a
literal key; `__gateProps` is unwrapped, and a `__gateKey` of `never` means two
patterns matched and unlocks nothing. Instantiations on top:

- `HTMLGateKeyBag` - each gate key writable with the union of its value types
  (`undefined` included for the `undefined` arm), passed through
  `MakeUndefinedOptional` for `?`. When the *written* value matches two pattern
  keys the key's type is replaced by a branded message naming the written
  value, never the key.
- `HTMLSelfUnlocks` / `ParentChildrenBag` - `DependentProps` intersected per
  written gate.
- `AllLockableKeys` / `LockedMessage` - the branded "requires" half.
- `ComponentIds<T, Keywords, Global, TagConfig>` - union of
  `{ [literalId]: declared self bag }`; widened `string` and no-id components
  resolve to `never`; duplicates merge. Called without a registry it falls back
  to the element's own attributes.

## Verification status

- `pnpm check`: no new errors. 17 pre-existing errors in `tests/resolved-format`
  (`evals/cases.ts` and `playwright` are absent from this worktree).
- `node --test tests/css tests/html tests/render tests/engine.test.ts`: 433 pass
  / 8 fail. The 8 are pre-existing rendering failures in
  `tests/css/queries-integration.test.ts` (verified by stashing `src/` and
  re-running); baseline was 425 pass / 8 fail, so +8 new tests, no new failures.
- `tests/html/conditional-attributes.test.ts`: 19/19, exercising every
  Verification bullet: `type="range" min` accepted, `type="range" checked`
  rejected naming `type: checkbox | radio`, patterned `id` resolution, overlap
  rejected at both walls, single-literal fill-in (omitted == written), a wrong
  literal rejected at both walls, and `ComponentIds` exactness.
