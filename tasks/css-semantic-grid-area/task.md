---
wait_human_start: true
wait_human_merge: true
dependencies: []
---

# Task: CSS Semantic Rules: grid-area vs parent grid-template-areas

## Metadata

- **Complexity:** Medium
- **Priority:** Medium
- **Status:** Ready for Handoff

## Context

grid-area places a grid item into a named area defined by the parent's grid-template-areas, but no wall checks that the name exists. The DSL is NOT extended (grid-template-areas stays a plain string; grid-area stays its own syntax). The cross-reference lives in the structural validator, which already threads parent context (like > childName keys vs innerHTML). Type level splits the parent's literal grid-template-areas into an area-name union via SplitSpace/Trim and checks the child's grid-area membership; runtime parses the parent string and checks. Approach confirmed with the maintainer; feasibility of the type-level derivation is the risk, so this task holds at merge for review.

## Requirements

- [ ] A node whose css uses grid-area: <name> must have a parent whose grid-template-areas defines that name (type level + runtime)
- [ ] Type level: split the parent's literal grid-template-areas (handling whitespace, newlines, and . empty cells) into an area-name union and check the child's grid-area against it
- [ ] Runtime: parse the parent's grid-template-areas string and check membership; throw a clear error on a missing name
- [ ] Unknown area name is a type-level error and a runtime error
- [ ] Valid: parent grid-template-areas: "a a\nb b" with a child grid-area: "a"
- [ ] Invalid: parent grid-template-areas: "a a\nb b" with a child grid-area: "c"
- [ ] Type Validation, Type Inference, Runtime Validation, Test

## Verification

A conformance test: probe file rows where a child grid-area name is missing from the parent's grid-template-areas literal fail tsc; the matching name passes; runtime asserts the same accept/reject with a clear error message; . empty cells and multi-line areas handled. pnpm check passes.

## Prohibited Patterns

- Do NOT add expressibility to the DSL language; grid-template-areas remains a plain string value
- Do NOT validate grid-area against the parent at runtime only; the type wall must derive the name union from the parent's literal too (both walls or an explicit, documented decision)
- Do NOT handle . empty cells / multi-line strings inconsistently between the two walls
