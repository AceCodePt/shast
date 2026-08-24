---
wait_human_start: true
wait_human_merge: false
dependencies: [css-queries-integration]
---

# Task: CSS Class Selectors: &.className inside @media blocks

## Metadata

- **Complexity:** Medium
- **Priority:** Medium
- **Status:** Ready for Handoff

## Context

&.className blocks currently validate and render inside pseudo-class and pseudo-element nesting, but not inside @media/@container query blocks. Once css-queries-integration lands, the same nesting support must extend to query blocks so class-targeted styles work responsively.

## Requirements

- [ ] &.className inside a @media query block: type validation
- [ ] &.className inside a @media query block: runtime validation (conformance with the type wall)
- [ ] &.className inside a @media query block: rendering with cid scoping preserved
- [ ] Unknown class in a query-scoped &.selector is still a type-level error
- [ ] Type Validation, Type Inference, Runtime Validation, Test

## Verification

Tests: a component declaring class: \"foo bar\" with css { \"@media (width < 768px)\": { \"&.foo\": {...} } } validates and renders as a scoped @media rule with the &.foo selector under the element's cid scope; referencing a class the element does not declare inside a query block is a type-level and runtime error. pnpm check passes.

## Prohibited Patterns

- Do NOT special-case query blocks with a second implementation; the class-selector validation should compose with the query-block path exactly as it composes with pseudo-class/pseudo-element blocks
