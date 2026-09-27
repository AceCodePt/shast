# Handoff: HTML conditional attributes

## What shipped

Any HTML attribute key may hold a complex value of the shape
`{ [value]: UnlockedAttributes }`. HTML attributes only unlock further attributes
on the **same element**: a parent's attribute is not a fact a child inherits, so
unlike `BaseCSSAttributeComplexValue` there is no `children` slot - and no `self`
slot either, because a slot named `self` would imply a `children` counterpart.
The value maps straight to the bag of attributes it unlocks. The mechanism is
generic and vocabulary-free in `src/`; the shipped `input` variations are the
first real vocabulary to use it.

- `src/html/attribute-config/types.ts` - `BaseHTMLAttributeComplexValue`,
  `ValidateHTMLAttributesConfig` / `InferHTMLAttributesConfig` handling both
  arms. All-flat configs keep the historical merged-object inference; a complex
  value switches to the CSS-style union of per-value variants.
- `src/engine/gate-resolution.ts` - the one runtime resolver for CSS and HTML:
  literal-first, patterns parsed with `parseValueAgainstDSL`, two matching keys
  an error, no match a message about the value. Also hosts the shared
  `valuesUnlocking` / `lockedMessageFor` / `slotDSL` helpers.
- `src/engine/types.ts` - HTML attribute gates (`HTMLGateTable` / `GateLookup`);
  branded locked messages (`'checked' requires type: checkbox | radio`);
  `undefined`-arm optionality through `MaybeAttributes`; `ComponentIds`.
- `src/engine/index.ts` - runtime conformance: own-gate pre-pass, unlocked
  attributes, branded locked messages, required-attribute check.
- `src/engine/render/render-component.ts` - fills in a single-literal unlock
  when omitted, using the same resolver.
- `src/html/tag-config/variations/{common,full,minimal}.ts` - the shipped
  vocabulary now uses gates:
  - `input[type]` - `checked` for checkbox/radio, `min`/`max`/`step` for the
    numeric/date-like types, `maxlength`/`minlength`/`pattern`/`size` for the
    text-like types, `accept`/`capture`/`multiple` for file, `multiple` for
    email, the form-override group for submit-like types, and
    `src`/`alt`/`height`/`width` for image.
  - `button[type]` (full) - the form-override group
    (`formaction`/`formenctype`/`formmethod`/`formnovalidate`/`formtarget`) is
    unlocked by `submit` (and by omitting `type`, whose default is submit).
  - `form[method]` (common, full) - `enctype` is unlocked by `post`; `target`
    and `novalidate` by `get`/`post`; `dialog` unlocks none.
  - `track[kind]` (full) - `srclang` by `subtitles`; `label`/`default` by every
    kind except `metadata`.
- `README.md`, `TASK.md` - documented as the third structural binding.

An **omitted gate** (or one explicitly written as `undefined`) contributes its
`undefined` arm's bag. This is what makes `type`/`kind` optional while still
unlocking the attributes their default value implies: a `button` without `type`
is a submit button, a `track` without `kind` is a subtitles track. The type wall
does it in `DependentHTMLProps`; the runtime does it in `htmlSlotDSL`, which
treats a written `undefined` as absent.

## Predicted gaps - which materialised

1. **Threading unlocked attributes through the three validation types** - did
   not materialise in the final shape. Because HTML unlocks stay on the same
   element, the only extra context a node needs is its own written attributes;
   no parent config or `ParentChildrenBag` is threaded through
   `ValidateComponentInnerHTMLStructure` / `ItemStructure` at all.
2. **Type-level pattern resolution and the overlap second pass** - materialised.
   `ResolveComplexValue` maps `<token>` and backtick keys to their
   template-literal types. Overlap is detected by wrapping each resolved value
   in `GateEntry<V, Props>`: two matching patterns make the intersection's
   `__gateKey` reduce to `never`, which is the overlap signal. It costs no
   `UnionToTuple` and is a plain indexed-access + conditional.
3. **`children` unlocks crossing `GetAllowedTags`** - no longer applicable;
   the HTML shape never had a `children` slot.
4. **Render-time fill-in and `skipValidation: true`** - materialised as
   expected. `renderComponent` receives the global attribute config and the
   merged keywords (the engine binds them). `skipValidation` remains a full
   pass-through of `createComponent`; fill-in is render-only and still runs.

## Shape of the per-registry unlocked table

`HTMLGateTable<Keywords, Config>` is parameterised only by the registry, so it
is instantiated once per program:

```ts
{
  [K in complex keys]: {
    [V in value keys as ResolveComplexValue<DSL, V>]:
      GateEntry<V, { [P in keyof Config[K][V]]?: DSLInfer<...> }>
  }
}
```

`GateEntry` is nominal: `{ __gateKey: V; __gateProps: Bag }`. A lookup
(`GateLookup`) is literal-first because TypeScript's own index lookup prefers a
literal key; `__gateProps` is unwrapped, and a `__gateKey` of `never` means two
patterns matched and unlocks nothing. The CSS `GateTable` keeps its `Slot`
parameter; the shared row helpers (`GateEntry`, `GateKeyOf`, `GatePropsOf`,
`GateLookup`, `GateOverlaps`) are config-agnostic. Instantiations on top:

- `HTMLGateKeyBag` - each gate key writable with the union of its value types
  (`undefined` included for the `undefined` arm), passed through
  `MakeUndefinedOptional` for `?`. When the *written* value matches two pattern
  keys the key's type is replaced by a branded message naming the written
  value, never the key.
- `DependentHTMLProps` - the unlocked bags of the written gates, intersected.
- `HTMLAllLockableKeys` / `HTMLLockedMessage` - the branded "requires" half.
- `ComponentIds<T, Keywords, Global, TagConfig>` - union of
  `{ [literalId]: declared unlocked bag }`; widened `string` and no-id
  components resolve to `never`; duplicates merge. Called without a registry it
  falls back to the element's own attributes.

## Verification status

- `pnpm check`: passes (exit 0). The browser-backed eval harness
  (`resolved-format/`, `tests/resolved-format/`, `evals/`) needs `playwright`
  and a generated `evals/cases.ts` that are not part of this package's
  dependencies; it was already failing on `main` and is excluded from the
  library typecheck in `tsconfig.json`.
- `node --test tests/css tests/html tests/render tests/engine.test.ts`: 449 pass
  / 8 fail. The 8 are pre-existing rendering failures in
  `tests/css/queries-integration.test.ts`, unrelated to this work.
- `tests/html/conditional-attributes.test.ts`: 17/17 mechanism tests
  (test-only registry).
- `tests/html/input-conditional.test.ts`: 9/9 against the shipped `common`
  registry - `checked`/`min`/`max`/`step`/`maxlength` unlocked by the right
  `type`, and the branded locked message for the wrong one.
- `tests/html/tag-conditional.test.ts`: 9/9 against the shipped `common`/`full`
  registries - `form[method]`, `button[type]` (including the omitted-`type`
  default) and `track[kind]`, at both walls.
