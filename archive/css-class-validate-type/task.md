---
wait_human_start: true
wait_human_merge: false
dependencies: []
---

# Task: CSS Class Selectors: type-level class-name validation

## Metadata

- **Complexity:** Low
- **Priority:** Low
- **Status:** Ready for Handoff

## Context

SplitSpace (src/engine/types.ts:154) splits a class attribute into a class-name union and &.\${K} selector keys are derived from it, but there is no validation that each name is a legal CSS class identifier, so garbage like class="1bad" or class="a b!c" passes the type wall today. This closes that hole. Explicitly low priority per the maintainer.

## Requirements

- [ ] A ValidateClassName type that rejects an invalid CSS class identifier at compile time (must not start with a digit, must not contain illegal identifier characters)
- [ ] Applied to the class attribute values via SplitSpace
- [ ] Applied to the &.${K} selector keys in ValidateComponentCSSStructure
- [ ] Valid identifiers still pass; the existing class-selector behavior is unchanged
- [ ] Type Validation, Type Inference, Test

## Verification

A type-level probe test: class: \"1bad\" or class containing an illegal character is a tsc error where the component is created; class: \"foo bar\" and &.foo / &.bar selectors continue to typecheck and render as before. pnpm check passes.

## Prohibited Patterns

- Do NOT validate class names at runtime only; the gap is specifically the type wall
- Do NOT change what characters SplitSpace splits on
