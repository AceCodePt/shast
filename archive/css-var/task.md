---
wait_human_start: true
wait_human_merge: false
dependencies: [css-calc]
---

# Task: CSS Variable Usage: var() references from the property registry

## Metadata

- **Complexity:** High
- **Priority:** High
- **Status:** Ready for Handoff

## Context

CSS custom properties registered in cssPropertiesConfig exist, but values can't reference them: var(--name) is opaque text no wall validates. This slice makes var() a typed reference into the CSS Properties registry, with validated fallbacks and nesting. Depends on css-calc because var() appears inside calc() operands (calc(var(--spacing) * 2)) and calc() is a legal fallback. Full fallback/cycle semantics live here; calc itself is already handled.

## Requirements

- [ ] var(--name) resolves to the syntax type of the registered property in the CSS Properties config (type level + runtime)
- [ ] Unknown --name (not in the CSS Properties config) is rejected: type-level error and runtime error
- [ ] Property name without a -- prefix is rejected
- [ ] Fallback: var(--name, <fallback>) — fallback validated against the property's syntax type
- [ ] Fallback may be a literal value, another var(), or a calc(); fallback type-checked to match the expected context type (type wall resolves to bounded depth, runtime validates fully)
- [ ] Nesting: var() inside calc() — calc(var(--spacing) * 2)
- [ ] Multiple var() references in a single CSS value
- [ ] var() in CSS shorthand properties
- [ ] Runtime: circular var() reference detection
- [ ] Edge cases: var() without arguments (malformed), var() with extra args beyond fallback, missing fallback for an unknown property at runtime, var(--name, ) empty fallback
- [ ] Type Validation, Type Inference, Runtime Validation, Test for each of the above

## Verification

Tests: var(--registered) validates in both walls and resolves to the registered property's syntax type; var(--unknown) and var(bad) are rejected by both walls; fallback rules (literal/var/calc) validated; var in calc, multiple vars, and shorthand contexts work; a circular var chain throws at runtime with a clear message; malformed var() forms rejected. pnpm check passes.

## Prohibited Patterns

- Do NOT prevent nested var(); var(--a, var(--b)) and arbitrary fallback nesting are fully supported (only the type-wall recursion depth is parameterized, runtime has no bound)
- Do NOT try to detect circular var() references at the type level; the spec already says runtime detection
- Do NOT require --name to be in the CSS Properties config as a strict type wall for EVERY context — var() in a shorthand where the resolved type is context-dependent must still resolve to something checkable; keep type wall one-level resolution + runtime for the rest
