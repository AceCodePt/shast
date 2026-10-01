---
wait_human_start: false
wait_human_merge: false
dependencies: []
---

# Task: CSS syntax-config: array-only arms

## Metadata

- **Complexity:** Medium
- **Priority:** High
- **Status:** Ready for Handoff

## Context

Array-only arms optimisation: represent a DSL token as an array of single arms (readonly string[]) and validate each arm with tsyntax's DSLValidateArm (added in tsyntax 1.1.0), instead of one '|'-joined string validated by DSLValidate's union splitting. Measured to remove ~33% of type instantiations across the configs.
IMPORTANT starting state: shast main is currently string-only. BaseCSSSyntaxConfig is { [attribute: string]: string }, ValidateCSSSyntaxConfig calls DSLValidate directly, and there is NO ValidateArms type and NO `V extends string ? DSLValidate : V extends readonly string[] ? ValidateArms : never` dispatch. This task INTRODUCES the array-only path; DSLValidate is currently live and becomes dead once this lands. Do not hunt for a union branch to delete.
The whole point is the type-level win, so the runtime value must be joined back to a string before it leaves cssSyntaxConfig; only the authoring/validation surface uses arrays.

## Requirements

- [ ] src/css/syntax-config/types.ts: BaseCSSSyntaxConfig's index signature becomes `readonly string[]` only (currently `string`).
- [ ] src/css/syntax-config/types.ts: introduce an arm-wise validation type built on tsyntax's DSLValidateArm (the design calls it `ValidateArms`) and make ValidateCSSSyntaxConfig dispatch directly through it. There is no existing dispatch to remove; DSLValidate is live today and its import becomes dead - drop it once unused.
- [ ] src/css/syntax-config/types.ts: keep InferCSSSyntaxConfig and InferCSSSyntax correct for array values (infer over the arms) so downstream inference is unchanged.
- [ ] src/css/syntax-config/index.ts: cssSyntaxConfig must reject empty arrays, validate every arm, then join each token's array into one string with .join(" | ") before returning. detectCircularReferences and everything downstream must never see an array.
- [ ] src/css/syntax-config/variations/minimal.ts, common.ts, full.ts: convert every bare string value to a one-element array, including single-word values like "string" and template-literal single arms like "`calc(${string})`" - those have no pipe to signal the conversion and are easy to miss. Every value, no exceptions.
- [ ] Update tests that build syntax configs (tests/css/syntax-config.test.ts and any per-tier length assertions) to the array shape.

## Verification

pnpm check and pnpm test are green. Probes: a token whose value is [] is a type error and throws at runtime; a multi-arm token validates each arm independently; the value returned by cssSyntaxConfig contains strings, not arrays, so mergedKeywords and downstream still type-check; grep of the three variation files shows zero bare-string values.

## Prohibited Patterns

- Do not leave any bare-string value in the three variation files.
- Do not let arrays escape cssSyntaxConfig; join before returning.
- Do not modify tsyntax; DSLValidateArm already ships in 1.1.0.
- Do not convert only the piped values; single-arm template literals and single-word tokens convert too.
- Do not quote wall-clock times.
