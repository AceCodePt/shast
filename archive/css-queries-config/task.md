---
wait_human_start: false
wait_human_merge: true
dependencies: []
---

# Task: CSS Queries Config: media/container query vocabulary

## Metadata

- **Complexity:** High
- **Priority:** High
- **Status:** Ready for Handoff

## Context

shast validates CSS against typed configs (cssSyntaxConfig, htmlAttributeConfig, cssPseudoClassConfig ...). Today a component CSS block can express properties, pseudo-classes, pseudo-elements, child selectors and class selectors, but no @media / @container context. The first slice of query support is the vocabulary: a cssQueriesConfig builder that registers the project's legal media/style queries as a plain array of DSL strings. Design decision from the planning discussion: the array IS the vocabulary (as const literal union), component CSS keys must be exact registered strings, there is no name->string alias indirection. The renderer expansion and engine binding (exact-string keys usable in component css blocks, scoped @media/@container output) are a separate, later slice (css-queries-integration).

## Requirements

- [ ] cssQueriesConfig([...]) accepts an array of query strings and runtime-validates each entry against the media/container DSL at config time
- [ ] Media Query DSL: width/height comparison operators (>, <, >=, <=) with units, e.g. (width < 768px), (768px <= width < 1024px)
- [ ] Media Query DSL: prefers-color-scheme (light / dark), prefers-reduced-motion (reduce / no-preference), orientation (portrait / landscape), resolution / device-pixel-ratio queries
- [ ] Media Query DSL: compound conditions with `and` and `,` (or), `not` / `only` keywords, media types (all, screen, print)
- [ ] Container Query DSL: width/height comparison operators with units
- [ ] Container Query DSL: named container scoping (@container sidebar (min-width: 600px)) and style queries (@container style(--theme: dark))
- [ ] Container Query DSL: compound conditions with `and` / `,`
- [ ] Type inference: entries passed as const infer to a literal union of exactly those strings (usable later as CSS-block keys)
- [ ] Variations: Minimal (common width breakpoints, prefers-reduced-motion), Common (width/height, prefers-color-scheme, orientation, resolution, basic container), Full (all features, style queries, complex compounds)
- [ ] Edge cases: empty array [] accepted; entry must start with @media or @container; invalid query string raises a runtime error at config time
- [ ] Type Validation, Type Inference, Runtime Validation, Parse, and tests for each of the above

## Verification

A probe test file in tests/ validates: cssQueriesConfig([legal media and container strings] as const) returns the array and its inferred type is exactly the literal union; each illegal entry (unknown media feature, missing @ prefix, unclosed paren, bad operator) throws at runtime and is a type-level error; Minimal/Common/Full variation files build without error. pnpm check (tsc --noEmit) and the node test suite pass with the new tests included.

## Prohibited Patterns

- Do NOT add alias indirection (@phone -> @media ...); the array of query strings IS the vocabulary
- Do NOT extend the DSL parser grammar with query syntax; the builder owns parsing/validation internally
- Do NOT wire query keys into component css blocks or the renderer — that is the css-queries-integration slice
- Do NOT hand-roll validation; reuse the existing config-builder pattern (runtime validation + type inference + preserved reference) used by cssSyntaxConfig
