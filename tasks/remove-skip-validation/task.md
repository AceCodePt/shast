---
wait_human_start: false
wait_human_merge: false
dependencies: []
---

# Task: Remove the skipValidation engine option entirely

## Metadata

- **Complexity:** Medium
- **Priority:** High
- **Status:** Ready for Handoff

## Context

The engine's second argument, `engine(config, { skipValidation: true })` (src/engine/index.ts:94,129-131), makes `createComponent` a pass-through: it skips `validateComponentNode` and returns the structure unchecked. It was added to save validation time, but validation runs once at construction, not per render, so the saving was never measured and is likely noise.

The cost is not the branch, it is the contract: the flag makes the closed-world guarantee conditional, because a consumer can switch the runtime wall off. That is what kept the CSS-value break-out gap alive (see archive/css-string-injection), and any widened attribute name or value that survives the type wall then reaches the renderer. No consumers depend on the flag yet, so this is a straight breaking deletion rather than a deprecation cycle; a staged removal would only preserve the hole for longer. After removal, `createComponent` always validates, and the thesis is unconditional.

## Requirements

- [ ] Remove the `options?: { skipValidation?: boolean }` parameter from `engine()` in src/engine/index.ts and delete the `if (!options?.skipValidation)` guard so `validateComponentNode` runs on every `createComponent`.
- [ ] Update the comments in src/engine/render/render-component.ts (around lines 35 and 56) that cite `skipValidation` as a way a widened value reaches the renderer; reword them to the remaining paths (`as any`, generated or out-of-compiler data) without naming the removed flag.
- [ ] Remove the README section that documents the flag (README.md:107-119, 'If you trust your pipeline ...').
- [ ] Update every test that passes `{ skipValidation: true }` so it still tests its original intent without the flag: tests/engine/render.test.ts (the production-mode block, ~113-190), tests/engine/implicit-display.test.ts:58, tests/css/grid-area.test.ts:45, tests/css/wide-keywords.test.ts:54. Where a test used the flag to build an unvalidated value, build that value directly and pass it to `renderComponent` (or cast with `as any`); do not reintroduce a bypass. Delete the now-meaningless 'skips validation' tests or convert them to assert that the invalid data is rejected.
- [ ] Update the comment at tests/render/render-component.test.ts:90 that cites `skipValidation`.
- [ ] The render-time attribute-name safety check in `renderAttributes` stays; its test must still pass with a directly-rendered widened component.
- [ ] Sweep current-API docs for `skipValidation` (docs/html-conditional-attributes-handoff.md:69-71) and remove or mark them historical. Do not edit archived task specs under archive/.

## Verification

`engine` no longer accepts a second argument (a `{ skipValidation: true }` call is a tsc error). `createComponent` always calls `validateComponentNode`: a component that would previously pass through now throws the same structured error. No `skipValidation` references remain in src/ or tests/ (archived task docs and the annotated handoff record excepted). `pnpm check` and the full test suite pass.

## Prohibited Patterns

- Do NOT keep the flag as a deprecated no-op; delete it.
- Do NOT add a replacement bypass or environment toggle.
- Do NOT weaken any runtime validation to make a removed-flag test pass; build the widened value directly instead.
- Do NOT change the runtime wall's messages or the render-time attribute-name check.
- Do NOT edit archived task specs under archive/.
