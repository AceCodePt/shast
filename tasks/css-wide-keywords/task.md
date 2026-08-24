---
wait_human_start: true
wait_human_merge: false
dependencies: []
---

# Task: CSS Wide Keywords: global values valid on every property

## Metadata

- **Complexity:** Medium
- **Priority:** Medium
- **Status:** Ready for Handoff

## Context

The five CSS-wide keywords (inherit, initial, unset, revert, revert-layer) are valid on every property per CSS, but today they are only accepted where a config author manually added them (color tokens include 'inherit'; a <css-wide-keyword> token exists in the full syntax variation but nothing references it). Design framing agreed with the maintainer: global CSS values are the CSS analog of global HTML attributes — one fixed set valid on every property, coexisting with property-specific syntax. Implemented at the one seam all property values flow through, not by editing every syntax token.

## Requirements

- [ ] inherit, initial, unset, revert, revert-layer valid as a value for ANY property (type level + runtime)
- [ ] Implemented at the value-validation seam: inferred property value type becomes DSLInfer<...> | CSSWideKeyword; runtime accepts the keywords before property-specific matching
- [ ] Existing property-specific syntax still validates unchanged (keywords don't mask bad values)
- [ ] Tests cover a representative spread of properties (colors, lengths, custom properties, shorthands)
- [ ] Type Validation, Type Inference, Runtime Validation, Test

## Verification

Tests: every sampled property accepts all five keywords in both walls (e.g. width: \"inherit\", color: \"revert\"); an invalid property value still fails; the type wall accepts the keyword union on a property whose DSL would otherwise reject it. pnpm check passes.

## Prohibited Patterns

- Do NOT union the keywords into every syntax token in the configs (that is the registry-of-globals anti-pattern we rejected)
- Do NOT make this user-facing config; the five CSS-wide keywords are a fixed, engine-level global set like global HTML attributes
