---
wait_human_start: false
wait_human_merge: false
dependencies: []
---

# Task: Reject CSS values that never return to the top level

## Metadata

- **Complexity:** Medium
- **Priority:** High
- **Status:** Ready for Handoff

## Context

assertNoStructuralBreakout in src/engine/validate/css.ts is the runtime wall that stops a string-typed CSS value from carrying ';', '{', '}' or '/*' out of its declaration. <string> and <custom-ident> match anything, and the renderer prints values verbatim, so this scanner is the only thing between an author-supplied string and the stylesheet.

The scanner tracks quote state (with backslash escapes), parenthesis depth, and treats url( as a single token. All of that logic is correct, but those states are never checked when the loop ends: a value that opens a string, a paren, or a url token and never closes it leaves the scanner in a state where the structural check is unreachable for the entire remainder, so everything after the opener ships unexamined.

Confirmed against the shipped validator: five payloads are accepted and rendered verbatim into the stylesheet (each carrying '; } .evil { color: red }' after the opener). This is the same class as the original P0 #1, in the code written to fix it.

Two findings from analysis that shape the fix:
1. The '(' handler has an off-by-one: it reads value[i+1] as the opening quote and sets quote/urlQuoted, but does not advance i, so the loop reprocesses that opening quote in the urlQuoted branch and treats it as the closing quote. The real closing quote is then seen as an opener, so a VALID quoted url (url("...;...")) ends with quote set and depth 1. Adding the end-state guard without fixing this would reject the existing valid test at tests/engine/css-value-structure.test.ts:237 and the 'quoted url containing a semicolon' acceptance case.
2. The 'rebalanced paren' payload (; } .evil { color: red }) ends at depth 0, so an end-state-only guard does not catch it. It must be caught by rejecting a '{' or '}' seen inside a function body (depth > 0, outside a string or url token). A rule doing only this passes the full 723-test suite.

## Requirements

- [ ] In src/engine/validate/css.ts assertNoStructuralBreakout: in the '(' handler, after setting quote = body and urlQuoted = true, advance i past the opening quote (i += 1) so the opening quote is not mistaken for the closing one. Do not change the url( lookbehind (isUrlTokenAt's i - 3) or the whitespace-skipping behaviour it disagrees with.
- [ ] In the same function, add an in-loop rule: when depth > 0 and the current char is '{' or '}', and it is not inside a quoted string, a urlQuoted body, or a urlRaw body, throw an Error naming the property and stating the brace is inside a function.
- [ ] After the scan loop, add an end-state guard that throws when the scanner did not return to top level: quote state still set (covers a bare string and the quoted-url state), or urlRaw still set, or depth above zero. The message must name the property and say what was left open (string / quoted url() / url() / function or parenthesised block), worded distinctly from the existing "contains a top-level '...'" message so existing test regexes stay unambiguous.
- [ ] Extend the doc comment above assertNoStructuralBreakout to state that the scanner must end at top level, and why (an unclosed opener makes every later delimiter unexamined).
- [ ] In tests/engine/css-value-structure.test.ts add a new describe block. Assert these six payloads throw from createComponent before any render: '"; } .evil { color: red }'; "'; } .evil { color: red }"; '(; } .evil { color: red }'; '(; } .evil { color: red })'; 'url(")"; } .evil { color: red }'; "url(')'; } .evil { color: red }". Assert each with a regex matching the branch it actually hits (quote variants hit the end-state string message; payloads containing a brace inside a function hit the in-loop brace message).
- [ ] In the same describe block add passing cases that must stay accepted: an unquoted data: URL carrying a semicolon; a raw url with an escaped paren; a calc() expression; a quoted string containing a brace; a quoted url containing a semicolon; content set to a lone quoted brace.
- [ ] Do not reject ';', '{' or '}' inside quoted strings or inside url() bodies (that would break data URLs, content and grid-template-areas). Do not auto-close or sanitize the value: reject it. Do not move the check into the renderer; the wall stays at validation time.

## Verification

Run: pnpm test (tsc --noEmit && node --import=tsx/esm --test). All tests pass, including the pre-existing 'runtime structural guard for string CSS values' suite and the quoted data-URL acceptance test at tests/engine/css-value-structure.test.ts:237.
Confirm the new throwing tests fail on the unpatched scanner and pass after the fix.
Sanity-check end to end: createComponent({ tag: 'div', innerHTML: 'x', css: { 'box-shadow': 'none; } body { display: none }' } }) still throws the existing top-level ';' message.

## Prohibited Patterns

- Do not reject ';', '{' or '}' inside quoted strings or url() bodies.
Do not auto-close, escape, or sanitize the value; reject it.
Do not move the structural check into the renderer.
Do not change the isUrlTokenAt lookbehind (i - 3) or its whitespace handling.
Do not rely on an end-state-only guard to catch the rebalanced-paren payload; it ends at depth 0.
