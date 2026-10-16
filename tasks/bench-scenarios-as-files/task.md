---
wait_human_start: false
wait_human_merge: false
dependencies: [bench-harness-variant-tier]
---

# Task: bench: committed tier-agnostic scenario files (small + big)

## Metadata

- **Complexity:** Medium
- **Priority:** Medium
- **Status:** Ready for Handoff

## Context

With the harness rewritten (bench-harness-variant-tier), scenarios are committed fixed files under bench/scenarios/ imported via the "@tier" alias. This task adds the corpus. Every scenario must compile on every tier (minimal/common/full) so it isolates cost rather than vocabulary: no @media, no animation/keyframes, and only properties the minimal tier declares. Scenarios come in small and big to span the cost range.

## Requirements

- [ ] Add bench/scenarios/simple-small.ts (a single `div > span`, no css) and simple-big.ts (a wide flat tree of many children).
- [ ] Add bench/scenarios/complex-small.ts (nested children + several css properties + one `> child` selector) and complex-big.ts (deeper tree with more properties).
- [ ] Add bench/scenarios/mixed-small.ts (a `:hover` block + one class state + one nested selector) and mixed-big.ts (more of each).
- [ ] Add bench/scenarios/classes-small.ts (`class` attribute plus `&.class` selectors) and classes-big.ts (a template-literal class expression plus `&.a.b:hover` selectors).
- [ ] Every file: `import { createComponent } from "@tier";` and `export const c = createComponent({ ... })`. No other imports.
- [ ] Every file must type-check with 0 errors against minimal, common, and full.

## Verification

pnpm exec tsx bench/harness.ts --variants src --repeats 1 runs every scenario; in bench/out/results.json each has ok:true on minimal, common and full (none appears in nearWallProblems), and instantiations increase from each *-small to its *-big.
pnpm test stays green.

## Prohibited Patterns

- Do not use tier-specific vocabulary (@media, animation, keyframes) or properties the minimal tier does not declare.
- Do not import anything but @tier.
- Do not introduce per-tier scenario variants or branch on the tier.
