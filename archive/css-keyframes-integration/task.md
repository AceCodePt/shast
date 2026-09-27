---
wait_human_start: true
wait_human_merge: false
dependencies: [css-keyframes-config]
---

# Task: CSS Keyframes: animation property + rendering

## Metadata

- **Complexity:** Medium
- **Priority:** Medium
- **Status:** Ready for Handoff

## Context

css-keyframes-config registers named keyframes; this slice connects them to the component model: the animation property (animation-name and the animation shorthand) must reference only registered keyframes, and renderComponent must emit global scoped @keyframes rules alongside the component's scoped css. Design question to resolve here: whether emitted @keyframes are emitted once globally (shared by cid scope) and how the animation shorthand is parsed to find the name.

## Requirements

- [ ] animation-name: "fade" and the animation shorthand referencing a registered keyframe validate (type + runtime)
- [ ] Unknown keyframe name is rejected by both walls
- [ ] renderComponent emits the @keyframes rule once (global, keyframe names are global) and the component's animation references it
- [ ] Instances sharing the same keyframes emit them once
- [ ] Type Validation, Type Inference, Runtime Validation, Test

## Verification

Tests: a component with animation-name/animation shorthand referencing a registered keyframe validates in both walls; an unknown name is rejected; renderComponent output contains the @keyframes rule exactly once and the component css references it. pnpm check passes.

## Prohibited Patterns

- Do NOT emit per-instance duplicated @keyframes for identical animations; dedupe like the scoped css block sharing
- Do NOT let an unknown animation name reach the renderer; it must be a type-level and runtime error
