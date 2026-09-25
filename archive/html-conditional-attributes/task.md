---
wait_human_start: false
wait_human_merge: false
dependencies: []
---

# Task: Conditional attributes on HTML nodes

## Metadata

- **Complexity:** High
- **Priority:** High
- **Status:** Ready for Handoff

## Context

shast's CSS layer already has conditional disclosure. In
`src/css/attribute-config/types.ts` a CSS attribute is either a plain tsyntax
string or a **complex value**: a map from each possible value to
`{ self, children }`, where `self` is what that value unlocks on the same
element and `children` what it unlocks on its children. `display: flex`
unlocks `gap`; `display: block` unlocks `width`, `height`, `text-align`.
Writing a property nothing unlocked is a `tsc` error naming what would unlock
it.

The HTML layer has none of this. `src/html/attribute-config/types.ts` is the
flat case only: `BaseHTMLAttributesConfig` is `attribute -> tsyntax string`.

### The motivating case is `input`

`checked` is only meaningful when `type` is `checkbox` or `radio`. `min`,
`max` and `step` belong to `range`, `number` and the date types. `accept` and
`multiple` belong to `file`. `maxlength` and `pattern` belong to the text
types. This is ordinary HTML validity and shast cannot express any of it today:
every `input` accepts every attribute, and `<input type="range" checked>`
typechecks.

This is exactly `display` unlocking `gap`. The mechanism the CSS layer has is
the mechanism HTML needs, and the claim this task implements is that **every
key on a shast node may be conditional, in exactly the same sense a CSS key
is.** There are not two kinds of attribute. Whether a key is conditional is
simply whether its config declares values for it — `display` is not special
in CSS; it merely has a complex value where `width` has a string.

`id` is one more key the mechanism covers. A config may declare, per id, what
that element carries, which is what the behaviour layer above will use — its
receivers are ids, not paths, and an id does not move when a node is
re-nested. But that is a consequence, not the design. Nothing in this task is
specific to `id` except the two points under "Patterned keys" below.

### Declared once, in config

For a value the config pins to a single literal, markup need not repeat it.
Where an unlocked `self` attribute's declared type is exactly one literal,
**shast fills it in at render if absent.** Writing it is allowed; writing a
different value is an error at both walls. Nothing wins silently. This costs
no reconciliation mechanism — the type system is already comparing a written
literal against a declared one. Fill-in does not apply to gates themselves
(there is nothing to choose) or to unlocks whose declared type is a union or
non-literal.

The earlier design — a multi-valued, space-separated attribute unlocking the
union of its values — was considered and **rejected**. CSS gates are strictly
single-valued: the runtime looks up `writtenValue in gateDef`
(`src/engine/index.ts` ~line 160) and nothing splits. Splitting would be new
machinery invented for one attribute. Whatever needs several things unlocked
declares them once against one key instead.

shast does not know what any vocabulary means. It arrives as user config
exactly as the CSS vocabulary does. **This task adds the mechanism, not any
vocabulary.**

### Patterned keys

Generated ids (`todo-42`, from a loop) cannot be literal keys. The existing
CSS gate resolver already has the answer in embryo: a gate key written as a
tsyntax token (`"<length>"`) is matched by parsing the written value against
it. This task generalises that:

- A gate key that is a tsyntax DSL string — a template literal such as
  `` "`todo-${string}`" `` or `` "`todo-${number}`" ``, or a `<token>` — is a
  **pattern key**. Any other key is a literal.
- Resolution is **literal first**. Only on a miss are pattern keys tried, each
  by parsing the written value against it. The fast path pays nothing.
- **Errors are reported against the value, never the key.** When
  `id="todo-x"` fails against `` `todo-${number}` ``, the message is tsyntax's
  prose about the written text. The key-position objection was always about
  where the error lands; this is the answer to it. No validation is ever
  reported against the object shape.
- **Two matching keys is an error**, at both walls. There is no reason to write
  overlapping patterns, so an overlap is a mistake and is said so. This
  tightens the existing resolver, which currently returns the first pattern to
  match; existing CSS configs have no overlapping keys, so nothing observable
  changes there. One resolver, shared by both layers.
- A consequence worth recording: a complex `id` is **strict** — only declared
  ids (literal or patterned) may be written. A catch-all `` `${string}` `` arm
  would collide with the overlap rule by design, and is not the way to opt
  out; leaving `id` as a flat `"string"` is. The shipped variations leave it
  flat, so no existing page changes.

An unadorned wildcard (`*`) was considered and rejected: it invites the
question "what does it accept" and cannot answer it, where `${string}` and
`${number}` say so and cost nothing extra.

### Errors: stock where TypeScript already knows, branded where it cannot

`src/engine/types.ts` ~line 400 records a measured decision: a branded
"unknown property" diagnostic was built and **removed** — 6-11% more
instantiations, 17-25% more check time, no accept/reject decision changed, and
a *worse* message than stock TS2353 (the registry dump it targeted came from
`noErrorTruncation`, not TS2353). `LockedMessage` was kept because
"'gap' requires display: flex | grid" is information TypeScript cannot derive.

The rule this task obeys: **if the reason can be stated, brand it; if the
reason is merely "that key is not there", let TypeScript speak.** The locked
case is branded. The unknown-attribute case stays stock. Type and runtime
wordings need not match textually.

### Settled decisions

- **Optionality** is declared by the config via an `undefined` arm, exactly as
  the flat case does. `MaybeAttributes` (`src/engine/types.ts:61`) must see it
  for the complex form. No category-wide default.
- **A non-literal id falls to `never`.** Permissive `string` would make every
  hallucinated receiver typecheck — the failure this stack exists to prevent.
  Literal ids are the author's responsibility at the boundary.
- **Duplicate ids inside a component merge**, deterministically, no throw. A
  component is a fragment.
- **Cross-document id uniqueness is not checked.** It would ship every existing
  id with every fragment request and still be only a runtime check.
- **tsyntax is untouched.** It already has everything this needs.

Expected gaps — predictions, not requirements; the handoff reports which
materialised:

- Threading unlocked attributes through `ValidateComponentInnerHTMLStructure`
  -> `ValidateComponentInnerHTMLItemStructure` -> `ValidateComponentStructure`
  alongside `AllowedTags`/`CurrentTag`, and through `processChild`/
  `forwardAllowed` at runtime, is the main instantiation risk. Derive the
  unlocked table once per registry, as the CSS gate tables are.
- Pattern-key resolution at the type level: template-literal matching is
  cheap in TypeScript, but the overlap check is a second pass.
- `children` unlocks crossing the tag-based `GetAllowedTags` logic.
- Render-time fill-in and `skipValidation: true`, which currently makes
  `createComponent` a pass-through.

## Requirements

- [ ] Any HTML attribute key may hold a complex value of the same
      `{ [value]: { self, children } }` shape as `BaseCSSAttributeComplexValue`;
      `ValidateHTMLAttributesConfig` and `InferHTMLAttributesConfig` handle both
      arms, mirroring the CSS versions. Gates are single-valued.
- [ ] Unlocked attributes are validated on the element (`self`) and its direct
      children (`children`) in `ValidateComponentStructure`. A locked attribute
      produces a **branded** message naming what unlocks it, in the manner of
      `LockedMessage`. An unknown attribute keeps its stock error.
- [ ] Gate keys may be tsyntax DSL strings (template literals or `<token>`).
      Resolution is literal first, then patterns; a value matching two keys is
      an error; a value matching none reports tsyntax's message about the
      **value**. One resolver serves CSS and HTML at both walls.
- [ ] Optionality is declared by an `undefined` arm; `MaybeAttributes` honours it.
- [ ] A `self` unlock whose declared type is a single literal is **filled in at
      render** if absent. Present and matching: accepted. Present and
      disagreeing: error at both walls.
- [ ] `ComponentIds<T>` (or a clearly named equivalent) collects every literal
      id written in a component with the values its resolved key declares. A
      non-literal id contributes `never`. Duplicates merge. Exported, and
      documented in `README.md` as the third structural binding after
      `> title` and `&.active`.
- [ ] `htmlAttributeConfig` (`src/html/attribute-config/index.ts`) currently
      calls `dslString` on every value unconditionally and throws on an object.
      It must branch and recurse into each value's `self`/`children`, including
      pattern keys. `ValidateHTMLAttributesConfig` feeds both `engine()` and
      `ValidateHTMLTagConfig`; all call sites stay type-consistent.
- [ ] Runtime backstop in `createComponent` rejects the same cases the types do;
      `skipValidation: true` bypasses it as everything else does.
- [ ] `variations/common.ts`, `full.ts`, `minimal.ts` unchanged in behaviour.
      Exercise the mechanism through a test-only config — an `input` whose
      `type` gates `checked`/`min`/`max`/`accept`, and an `id` with one literal
      and one patterned key — so no vocabulary is baked into `src/`.
- [ ] Tests pair `@ts-expect-error` with `assert.throws` per negative case and
      assert inference with `Equal`.
- [ ] `TASK.md` entries follow the existing **HTML Attributes** convention of
      four boxes (Type Validation, Type Inference, Runtime Validation, Test).
      `TASK.md:182-194` has no Parse box and none is warranted.

## Verification

- `pnpm check` and `pnpm test` pass with no new failures.
- Type probe: `<input type="checkbox" checked>` accepted; `<input type="range"
  checked>` rejected with a message naming `type: checkbox | radio`; `<input
  type="range" min="0">` accepted.
- `id="todo-42"` resolves against `` `todo-${number}` `` and gets its unlocks;
  `id="todo-x"` fails with a message about `todo-x`, not about the config;
  a fixture declaring both `` `todo-${string}` `` and `` `todo-${number}` ``
  fails at both walls on `todo-42`.
- An element omitting a single-literal unlock renders with it filled in; one
  writing it correctly renders identically; one writing it wrongly fails at
  both walls.
- `ComponentIds<typeof fixture>` resolves to exactly the written literal ids
  with their values; `never` for a component with none; a `string`-typed id
  contributes nothing.
- Handoff reports which predicted gaps materialised and the shape of the
  per-registry unlocked table.

## Prohibited Patterns

- Do NOT hardcode any implementation name, verb, event or id anywhere in
  `src/`. The mechanism is generic; the vocabulary is config.
- Do NOT add a dependency on `interactably`, or change anything in `tsyntax`.
- Do NOT split attribute values on whitespace, and do NOT touch `SplitSpace`,
  `ValidateClassName`, or how `&.${K}` derives from `class`.
- Do NOT brand the unknown-attribute error. That was measured and removed.
- Do NOT report a pattern-key failure against the key or the object shape.
- Do NOT resolve an overlap between pattern keys by declaration order or any
  other tiebreak. Overlap is an error.
- Do NOT add a catch-all pattern arm to any shipped `id` config.
- Do NOT let a disagreement between markup and config resolve silently.
- Do NOT invent a new config shape. Mirror `{ self, children }` exactly.
- Do NOT touch the phrase grammar, `on-*` right-hand sides, or receivers. That
  is the next layer and depends on this one.
