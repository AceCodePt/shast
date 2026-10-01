---
wait_human_start: true
wait_human_merge: false
dependencies: []
---

# Task: Relative colour syntax via free-interior function arms

## Metadata

- **Complexity:** Medium
- **Priority:** Medium
- **Status:** Ready for Handoff

## Context

Relative colour syntax (e.g. rgb(from var(--base) r g b / 50%)) is not expressible in the current <color> DSL, which is a union of concrete template-literal arms (src/css/syntax-config/variations/{minimal,common,full}.ts). Its interior has structure - a source colour, channel keywords, arithmetic - which tsyntax deliberately cannot express: the DSL is capped at scalars with no brackets/braces, and that cap is documented as permanent. The same family already ships: gradient arms are written as `linear-gradient(${string})`, a function wrapper with a free interior, accepted by both walls and checked only by the runtime structural scan (assertNoStructuralBreakout) plus var() resolution (validateVars at runtime, VarConstraint at the type level). archive/invert-calc-var-constraints names relative colour syntax as the reason the calc/var token test must be token-based, so this was anticipated. DECISION OPEN: whether the interior is validated at the runtime wall only (option A: free-interior arms, matching gradients, no tsyntax change) or whether the tsyntax cap moves (option B: bracketed/structural DSL, contradicting tsyntax's documented scalar-only design and needing its own benchmark). This task waits for the author to settle that decision before implementation; the requirements below assume option A and must be revised if the decision differs.

## Requirements

- [ ] First settle the interior-validation policy with the author (option A free-interior arms vs option B moving the tsyntax cap). Do not implement until the decision is recorded in this task's context; the remaining requirements assume option A.
- [ ] Add `fn(from ${string})` arms to <color> in src/css/syntax-config/variations/{minimal,common,full}.ts, one per colour function each tier already declares (minimal: rgb; common: rgb, hsl, oklch, color; full: every declared colour function). Do not add functions a tier does not already declare.
- [ ] No change to tsyntax, src/css/calc.ts, src/css/var.ts or src/engine/validate/css.ts: a free interior already crosses assertNoStructuralBreakout and validateVars at runtime, and VarConstraint already resolves a var() inside a colour value at the type level.
- [ ] tests/css/syntax-config.test.ts: type-level accept of rgb(from var(--base) r g b / 50%) and per-tier coverage that each added arm matches its function.
- [ ] tests/css/var.test.ts: rgb(from var(--nope) r g b / 50%) is rejected at both walls (unregistered custom property); with --base registered it is accepted.
- [ ] End-to-end: a component with color: 'rgb(from var(--base) r g b / 50%)' builds at both walls and renderComponent prints the value verbatim.
- [ ] Structural: a value such as 'rgb(from } .evil { color: red) r g b)' is rejected by the runtime structural scan.
- [ ] Docs: README recipes/limitations and docs/css-var.md note that relative colour is expressible via free-interior arms with the same runtime-only interior caveat as gradients.

## Verification

Decision recorded in the task context before implementation. pnpm check and pnpm test green with no unused @ts-expect-error directives. Probes: rgb(from var(--base) r g b / 50%) type-checks on a <color> slot and renders verbatim; rgb(from var(--nope) r g b / 50%) is a type-level error and a runtime throw; a structural break-out in the interior throws; each tier's added arms match only their own function name.

## Prohibited Patterns

- Do not modify tsyntax or move the scalar-only cap; that is option B and needs its own decision, benchmark and task.
- Do not add a runtime-only interior grammar that the type wall does not share; it would make the walls drift.
- Do not remove or tighten the existing gradient free-interior arms; relative colour is the same family.
- Do not add colour functions to a tier that does not already declare them; keep tier vocabulary tight.
- Do not quote wall-clock times.
