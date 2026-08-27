---
wait_human_start: false
wait_human_merge: true
dependencies: []
---

# Task: CSS Keyframes: keyframes config builder

## Metadata

- **Complexity:** Medium
- **Priority:** Medium
- **Status:** Ready for Handoff

## Context

shast registers CSS custom properties and CSS-wide keywords but cannot express @keyframes: there is no way to register a keyframe animation, validate its frames, or reference it from the animation property. This slice is the config: a cssKeyframesConfig builder registering keyframes, mirroring the other *Config builders. Rendering and the animation-property reference are the next slice (css-keyframes-integration).

## Requirements

- [ ] cssKeyframesConfig builder registers named @keyframes (name validation: legal CSS identifier, no spaces)
- [ ] Each keyframe has a selector: from, to, or a percentage (0%, 50%, 100%)
- [ ] Each frame's properties validate against the CSS syntax config (same value validation as css blocks)
- [ ] Duplicate frame selectors in one animation rejected
- [ ] Unknown keyframe name in the animation property is a type-level error (resolution happens here or is clearly handed to the integration slice)
- [ ] Type inference: the registered names become a literal union for the animation property
- [ ] Type Validation, Type Inference, Runtime Validation, Test

## Verification

Tests: cssKeyframesConfig({ fade: { from: {...}, to: {...} }, pulse: { \"0%\": {...}, \"100%\": {...} } }) validates; illegal names, non-percentage selectors, invalid frame property values, and duplicate selectors throw at runtime and are type-level errors; the inferred name union is exact. pnpm check passes.

## Prohibited Patterns

- Do NOT wire the animation property or renderer yet — that is css-keyframes-integration
- Do NOT invent a keyframe DSL outside the existing value-validating machinery; frame property values validate against the CSS syntax config like any css block
