---
wait_human_start: false
wait_human_merge: false
dependencies: []
---

# Task: CSS legacy comma-separated color function forms

## Metadata

- **Complexity:** Medium
- **Priority:** Medium
- **Status:** Ready for Handoff

## Context

The <color> DSL in each tier is a closed union of concrete template-literal arms (src/css/syntax-config/variations/{minimal,common,full}.ts), so a function form is accepted only if an arm spells it. Only the modern space-separated forms are declared: minimal and common declare `rgb(${number} ${number} ${number})`; common and full also declare the space `hsl()`; full declares the legacy comma forms of `rgba()` and `hsla()` but not `rgb()` or `hsl()`. Consequently `rgb(255, 0, 0)` - valid CSS, and the form most design tokens and muscle memory use - is rejected at both walls in every tier, while `rgb(255 0 0)` passes. The fix is per-tier arms for the comma form of each function that tier already declares; the interior stays scalar so the type wall and the runtime wall keep sharing the same grammar. Do NOT introduce a free-interior `${string}` arm.

## Requirements

- [ ] src/css/syntax-config/variations/minimal.ts <color>: add `rgb(${number}, ${number}, ${number})`. Do not add functions minimal does not already declare (no hsl/rgba).
- [ ] src/css/syntax-config/variations/common.ts <color>: add the comma arms `rgb(${number}, ${number}, ${number})`, `rgba(${number}, ${number}, ${number}, ${number})`, `hsl(${number}, ${number}%, ${number}%)` and `hsla(${number}, ${number}%, ${number}%, ${number})`.
- [ ] src/css/syntax-config/variations/full.ts <color>: add the missing comma arms `rgb(${number}, ${number}, ${number})` and `hsl(${number}, ${number}%, ${number}%)`; the rgba/hsla comma arms already exist.
- [ ] Keep every existing space-separated arm unchanged; both forms must be accepted side by side.
- [ ] tests/css/syntax-config.test.ts: per-tier type-level accept for each added comma form, plus runtime accept through the config builder; assert a malformed value such as `rgb(255, 0)` is still a type error and a runtime throw; assert the space-separated forms still pass.
- [ ] End-to-end: a component with `color: 'rgb(255, 0, 0)'` builds at both walls and renderComponent prints the value verbatim.
- [ ] Docs: if any prose enumerates the accepted colour forms (README, docs/recipes.md, docs/css-var.md), update it to name the legacy comma forms.

## Verification

pnpm check (tsc --noEmit) and pnpm test are green with no unused @ts-expect-error directives (TS2578 is the tripwire). Probes: on the shipped common tier, `rgb(255, 0, 0)`, `rgba(255, 0, 0, 0.5)`, `hsl(0, 100%, 50%)` and `hsla(0, 100%, 50%, 0.5)` type-check on a <color> slot and render verbatim; `rgb(255, 0)` is rejected at both walls; minimal accepts `rgb(255, 0, 0)` and rejects `hsl(0, 100%, 50%)` (hsl is not in minimal); full accepts both added comma forms and still accepts `rgb(255 0 0)`.

## Prohibited Patterns

- Do not add a free-interior `rgb(${string})`-style arm; keep the scalar arms so the type and runtime walls cannot drift.
- Do not add a colour function to a tier that does not already declare it (e.g. no hsl in minimal, no oklch in minimal).
- Do not remove, narrow, or reorder existing space-separated arms.
- Do not edit tsyntax or the calc/var parsers; this is a config-only gap.
