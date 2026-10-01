---
wait_human_start: true
wait_human_merge: false
dependencies: []
---

# Task: CSS @supports as a registered at-rule

## Metadata

- **Complexity:** Medium
- **Priority:** Low
- **Status:** Ready for Handoff

## Context

@supports is the same category as @media/@container: a registered exact-string query key whose block targets the same element, so gate propagation, rendering and the type-level key union already work for any `@`-prefixed key. @media and @container are validated by cssQueriesConfig(syntax, queries) (src/css/queries-config/index.ts + types.ts) and keyed by exact registered string at both walls. @supports differs in that its condition is a property/value pair rather than a media feature, so it belongs in the same registered-query list and needs config entries plus test coverage rather than new machinery. The condition grammar is the open question; this task scopes it to S1: cssQueriesConfig validates the boolean shape only (balanced parens, and/or/not, each (prop: value) leaf non-empty, selector()/font-tech()/font-format() accepted as opaque leaves), and the engine re-reads each declaration leaf against the registry, mirroring the existing @container style(...) handling (assertStyleQueryValues in src/engine/validate/css.ts). Property membership for --custom supports cannot be checked at config-build time because cssPropertiesConfig is per-consumer, which is why the engine re-read is the right seam. Low priority.

## Requirements

- [ ] src/css/queries-config/types.ts: add a `@supports ` branch to ValidateQuery/ValidateQueries. Update the 'Query must start with @media or @container' diagnostic to name @supports.
- [ ] src/css/queries-config/index.ts: add validateSupportsQuery and a `@supports ` branch in validateQueryString. Validate boolean shape: balanced parentheses, and/or/not combinators, each leaf `(prop: value)` non-empty (prop and value both non-empty), and selector(...)/font-tech(...)/font-format(...) accepted as opaque leaves. Reject empty conditions and mixed and/or at the same level without parens.
- [ ] src/engine/validate/css.ts: re-read each registered `@supports` key's declaration leaves and check the property against cssAttributesConfig union cssPropertiesConfig; run assertNoStructuralBreakout on each value and on the whole header as the backstop, mirroring the @container style( branch. Add this to the same `@`-key path in validateCssBlock.
- [ ] src/css/queries-config/variations/common.ts and full.ts: add at least one `@supports (property: value)` entry (e.g. `@supports (display: grid)`); keep the minimal tier free of @supports. Keep the variation length assertions in tests/css/queries-config.test.ts in sync.
- [ ] No change to rendering or type-level key handling: @-prefixed keys already flow through collect-rules.ts buildFrame, the CSSQueriesConfig[number] key union in src/engine/types.ts, and gate propagation.
- [ ] tests/css/queries-config.test.ts: type-level accept/reject (accept @supports (display: grid); reject a malformed condition) and runtime accept/reject (accept; throw for a malformed condition and for an unknown property).
- [ ] tests/css/gate-propagation.test.ts: add coverage that display:flex declared once at component level unlocks gap/justify-content inside @supports (display: grid) without restating it, and that with no display:flex the same props are rejected there.
- [ ] Add a header-injection test mirroring tests/css/style-query-structure.test.ts: an @supports header carrying a structural break-out (e.g. `@supports (color: } .evil { color: red)`) is rejected by the engine structural scan.
- [ ] Add a render test that a registered @supports block prints the at-rule verbatim and nests its body.
- [ ] Docs: README.md 'At-rule context' section, the 'Registered @media/@container query key' row in the What-gets-validated table, and the browser-baseline section; docs/before-the-browser.md line 35 and the query prose.

## Verification

pnpm check (tsc --noEmit) and pnpm test are green with no unused @ts-expect-error directives (TS2578 is the tripwire). Probes: cssQueriesConfig(commonCSSSyntax, ['@supports (display: grid)']) builds and infers the literal tuple; cssQueriesConfig(commonCSSSyntax, ['@supports (disply: grid)']) throws at runtime and is a type-level error; an unregistered '@supports (color: red)' component key is a type error and a runtime throw; with display:'flex' at component level and not restated, gap is accepted inside '@supports (display: grid)' at both walls, and with no display:flex it is rejected; a structural break-out inside the @supports header throws.

## Prohibited Patterns

- Do not add new query machinery beyond the grammar and the style()-style engine re-read; @supports must ride the existing registered-query list, @-key handling, rendering and gate propagation.
- Do not special-case @supports in src/engine/render/collect-rules.ts; @-prefixed keys are already generic.
- Do not accept an unregistered @supports key: it must be a type error and a runtime throw, exactly like @media/@container.
- Do not validate custom-property (@supports (--x: ...)) membership at config-build time; cssPropertiesConfig is per-consumer and the engine re-read is the seam.
- Do not weaken the existing @media/@container grammar or their error messages while adding the @supports branch.
