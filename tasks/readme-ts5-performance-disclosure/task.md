---
wait_human_start: false
wait_human_merge: false
dependencies: []
---

# Task: Disclose that the README performance figures are TypeScript 7-only (TS 5 is ~2x slower)

## Metadata

- **Complexity:** Low
- **Priority:** Medium
- **Status:** Ready for Handoff

## Context

README.md:67-68 says shast "Requires TypeScript 5.0 or newer (developed and benchmarked on 7.0.2)", and README.md:374-379 "Performance (indicative)" quotes a fixed ~1.17M instantiations / ~1.1s and ~15K / ~25ms per component without saying those figures are measured only on TypeScript 7.0.2. docs/performance.md and docs/structural-coupling.md do say "Measured ... on TypeScript 7.0.2", but the README - the front door - does not. TypeScript 5.x is what the overwhelming majority of projects run today, and the Install section promises shast works there. Measured by the reporter with 50 identical realistic components: TS 7.0.2 (native) 1.1s baseline, +1.6s for 50 (~33ms each), matching the README; TS 5.9.3 4.8s baseline, +3.5s for 50 (~70ms each), 8.3s total check time. So on TS 5 the fixed cost is ~4x and the per-component cost ~2x, and editor latency is noticeable. A reader on TS 5 who trusts the README will be surprised. The fix is disclosure, not a performance change: state which compiler the numbers come from and give the TS 5 reality alongside them. Do not remove the TS 7 figures; they are correct for TS 7 and are the development target.

## Requirements

- [ ] README.md 'Performance (indicative)' (lines 374-379): state plainly that the quoted figures are measured on TypeScript 7.0.2, and that TypeScript 5.x is substantially slower; include the measured TS 5.9.3 numbers (4.8s fixed baseline, ~70ms per realistic component, 8.3s total for 50) so a reader on TS 5 can set expectations. Keep the existing TS 7 figures.
- [ ] README.md Install parenthetical (lines 67-68) must stay consistent: either cross-reference the performance section or make explicit that the quoted performance is TS 7. Do not change the supported minimum (TypeScript 5.0+).
- [ ] docs/performance.md: carry the same TS-version disclosure and TS 5 comparison, and label the TS 7 numbers as the development target. Keep the instantiation-count framing: note that instantiations are the machine-stable measure and the TS 5 figures are wall-clock from one machine.
- [ ] docs/structural-coupling.md performance envelope (line 134 already says 'on TypeScript 7.0.2'): add a one-line caveat that TS 5 is materially slower, pointing to docs/performance.md, so the three performance surfaces do not drift.
- [ ] Do not present the TS 5 numbers as exact or machine-stable; they are indicative wall-clock on one machine.
- [ ] pnpm check passes (docs-only; no code change).

## Verification

README.md states that the performance figures are measured on TypeScript 7.0.2 and gives the TS 5.9.3 reality (higher fixed cost and per-component cost, noticeable editor latency), while still naming TypeScript 5.0+ as supported. docs/performance.md and docs/structural-coupling.md carry the same TS-version caveat and do not contradict the README. pnpm check passes. No source or registry files changed.

## Prohibited Patterns

- Do not change the supported TypeScript minimum; TS 5.0+ remains supported.
- Do not remove or edit the existing TypeScript 7 numbers; they are correct for TS 7.
- Do not present the TS 5 wall-clock figures as machine-stable or exact.
- Do not add a benchmark harness, script, or dependency to the repo; the harness is deliberately out of tree.
- Do not change any src/ or registry behavior to chase TS 5 performance; this task is disclosure only.
- Do not claim TS 5 is unsupported or recommend dropping it.
