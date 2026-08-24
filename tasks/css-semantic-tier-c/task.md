---
wait_human_start: true
wait_human_merge: false
dependencies: []
---

# Task: CSS Semantic Rules Tier C: ancestor-chain threading

## Metadata

- **Complexity:** High
- **Priority:** Medium
- **Status:** Ready for Handoff

## Context

Tier A rules (same-node) and Tier B rules (one-level parent->child) of the CSS semantic rules exist. Tier C needs boolean context threaded up the tree like innerHTML inheritance: whether an ancestor is positioned, scroll-clipping, has a definite height, or is transformed. Each rule reads inherited flags to validate a node's props, then updates the flags for its descendants. Both walls must agree.

## Requirements

- [ ] Thread a boolean context record (positioned, scrollClip, definiteHeight, transformed) through the component tree at the type level, exactly like the innerHTML allowed-tag set is threaded
- [ ] Mirror the same context record in validateComponentNode at runtime
- [ ] Rule position:absolute needs a positioned ancestor — valid: div{position:relative} > div{position:absolute}; invalid: a root div{position:absolute} with no positioned ancestor (type + runtime)
- [ ] Rule position:sticky needs a threshold and no scroll-clipping ancestor — valid: div{overflow:auto} > div{position:sticky;top:0}; invalid: div{overflow:hidden} > div{position:sticky;top:0}, and sticky with no top/right/bottom/left threshold
- [ ] Rule position:fixed containing block changed by an ancestor transform/filter/will-change — valid: div > div{position:fixed} with no transformed ancestor; invalid: div{transform:translateX(10px)} > div{position:fixed}
- [ ] Rule overflow clipping an absolutely-positioned descendant — valid: div{overflow:visible} > div{position:absolute}; invalid: div{overflow:hidden} > div{position:absolute} (ancestor between the absolute element and its positioned ancestor clips it)
- [ ] Rule height:100% needs a definite-height ancestor chain — valid: div{height:200px} > div{height:100%}; invalid: div > div{height:100%} (auto ancestor)
- [ ] Each rule's invalid structure is rejected by BOTH walls and the valid structure accepted by BOTH walls (conformance-tested)
- [ ] Type Validation, Type Inference, Runtime Validation, Test

## Verification

A conformance test suite mirroring the innerHTML-inheritance pattern: for each of the five rules, a table of valid/invalid component structures; assert both the type wall (probe file fails tsc on the invalid rows) and the runtime wall (assert.throws) reject the invalid and accept the valid. pnpm check passes.

## Prohibited Patterns

- Do NOT implement ancestor threading as a flat global check; it must be threaded node-by-node down the tree (same shape as innerHTML inheritance) so both walls agree on nested composition
- Do NOT let the type wall and runtime diverge; conformance-test each rule like the innerHTML inheritance suite
- Do NOT attempt union-carrying (Tier D) or rule-of-thumb layout heuristics here
