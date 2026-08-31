---
wait_human_start: true
wait_human_merge: false
dependencies: [css-queries-config]
---

# Task: CSS Queries Integration: query keys in component CSS + rendering

## Metadata

- **Complexity:** High
- **Priority:** High
- **Status:** Ready for Handoff

## Context

css-queries-config registers the project's legal @media/@container query strings as the vocabulary, but nothing uses them: a component css block cannot yet key on a registered query, and the renderer cannot expand one into a scoped @media/@container rule. This slice wires the vocabulary into createComponent's CSS-block validation (type + runtime) and renderComponent (scoped output, cid preserved).

## Requirements

- [ ] A registered query string (e.g. "@media (width < 768px)") is a valid key at the top level of a component css block (type + runtime)
- [ ] Query keys inside pseudo-class blocks (e.g. ":hover": { "@media ...": {...} })
- [ ] Query keys inside pseudo-element blocks
- [ ] Properties, pseudo-classes, and child selectors can appear inside a query block
- [ ] Nested query aliases (query inside query)
- [ ] Unknown query string (not in the registered array) is a type-level error and a runtime error
- [ ] Runtime validation of query blocks mirrors the type level (conformance-tested like innerHTML inheritance)
- [ ] Rendering: a query key expands to a scoped @media / @container rule in the CSS output, classified by its @ prefix
- [ ] Multiple query keys render in order
- [ ] CID scoping preserved inside expanded query blocks
- [ ] Edge cases: empty query block (no properties) is accepted; invalid query string rejected at config time not here
- [ ] Type Validation, Type Inference, Runtime Validation, Test for each of the above

## Verification

Tests: a component with a registered query key at top level, inside a pseudo-class, and inside a pseudo-element validates in both walls; properties/pseudo-classes/child selectors inside a query block work; an unregistered query string (e.g. \"@phone\") is rejected at the type level and runtime; renderComponent output contains the expanded scoped rule with the cid scope preserved; multiple query blocks render in order. pnpm check passes.

## Prohibited Patterns

- Do NOT introduce alias names; keys are the exact registered query strings
- Do NOT add query support to pseudo-class/element nesting in a way that bypasses the registered-vocabulary type check
- Do NOT let the renderer emit un-scoped @media/@container rules; cid scoping must be preserved inside expanded blocks
