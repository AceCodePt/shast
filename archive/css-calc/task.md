---
wait_human_start: true
wait_human_merge: false
dependencies: []
---

# Task: CSS Calc: calc() expression support

## Metadata

- **Complexity:** High
- **Priority:** High
- **Status:** Ready for Handoff

## Context

Component CSS values can currently be primitives, literals, template literals and registered syntax tokens, but a value like width: "calc(100% - 40px)" is just an opaque string that no wall validates. calc() is the first arithmetic CSS function shast needs. TypeScript CAN track calc structurally (recursive template-literal parsing with a depth-threaded counter) at a real compute cost; the spec mandates benchmarking and an explicit, documented fallback if the type wall explodes. var() references inside calc are accepted opaquely in this slice; full var() typing is the next slice (css-var).

## Requirements

- [ ] calc() parsed, validated, and rendered as a CSS value (rendered verbatim into the css output string)
- [ ] Type wall: recursive template-literal parsing of the calc grammar (CalcOperand (op CalcOperand)*) with a depth-threaded counter; operand = calc(...) | var(...) | <number><unit?> | <percentage>
- [ ] Type wall compute cost benchmarked (typecheck time before/after); if cost explodes, a documented, explicit fallback to shallow calc(${string}) acceptance with a note, never a silent downgrade
- [ ] Runtime wall: full parser with paren-depth tracking; balanced parens enforced; unclosed parentheses rejected
- [ ] Runtime wall: allowed operators + - * / ; / requires a number right operand; mixed units legal per CSS (e.g. calc(100% - 20px), calc(50vw + 2rem))
- [ ] Nested calc: calc(calc(...)) treated as parens per modern CSS
- [ ] calc with CSS variables: calc(var(--spacing) * 2) accepted (var opaque here)
- [ ] calc in CSS context: inline css: { width: 'calc(100% - 40px)' } validated against the CSS syntax config
- [ ] A syntax token defined as calc(...) in the CSS attribute config resolves/validates
- [ ] Edge cases: malformed calc rejected, unclosed parens, unsupported operators, empty calc(), leading/trailing operators
- [ ] Type Validation, Type Inference, Runtime Validation, Parse, Test for each of the above

## Verification

Tests exercise: valid calc values pass type + runtime validation and render verbatim (assert output contains the exact calc string); each edge case (malformed, unclosed paren, empty, bad operator, division-by-string) is rejected by both walls; calc nested in calc and with var() operands accepted; calc inside a css block validated; a calc() syntax token in cssAttributeConfig resolves. tsc cost benchmark recorded (before/after) in the commit message or docs. pnpm check passes.

## Prohibited Patterns

- Do NOT silently downgrade the type wall to shallow acceptance without benchmarking and a documented note; measure tsc cost first (repo has cmp:perf, bench:ac, diag:*)
- Do NOT hand-roll runtime parsing with regex soup; a small tokenizer/parser tracking paren depth is required for balanced-paren validation
- Do NOT implement full var() type resolution here; var(--x) is accepted opaquely in calc operands
- Do NOT allow division by a non-number right operand, or leave unit-mixing rules unspecified
