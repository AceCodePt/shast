---
wait_human_start: false
wait_human_merge: false
dependencies: [rewriter-code-vs-text]
---

# Task: Rewrite dynamic import() specifiers and guard against unhandled specifier forms

## Metadata

- **Complexity:** Medium
- **Priority:** Medium
- **Status:** Ready for Handoff

## Context

The import regex expects import followed directly by a quote, so await import("@/engine/render/escape") keeps its @/ specifier and the vendored tree ships an unresolvable one. No dynamic imports exist in today's src/, so this is latent. The existing test (tests/cli/vendor.test.ts:130) only greps /from\s+"@\//, so it shares the blind spot and would stay green while the dynamic import ships. A guard must anchor on what the rewriter rewrites rather than on 'is this a module specifier': TypeScript parses a dynamic-import argument as a module specifier, so the loose form of the guard would wrongly pass.

## Requirements

- [ ] Extend rewriteImports to rewrite the specifier of dynamic import("...") (and import("...", { with: ... }) if present) with the same mapping as static imports.
- [ ] Strengthen or replace the 'no vendored file keeps a @/ or bare tsyntax specifier' test (tests/cli/vendor.test.ts:130) so it catches unhandled forms: after vendoring, no string literal in any vendored .ts still contains @/ or equals tsyntax (this fails on a dynamic import with the current rewriter).
- [ ] Add a guard that every byte rewriteImports changes lies inside a specifier position (static import/export ... from or dynamic import()), so a prose or string rewrite fails loudly. The test may use the typescript devDependency parser; no runtime dependency.
- [ ] Test: a source containing await import("@/engine/render/escape") vendors to the relative path with no surviving @/ string; the guard fails on a comment or string matching the rewriter pattern.

## Verification

A fixture with await import("@/engine/render/escape") yields a relative specifier and no @/ string survives vendoring; the guard fails when a comment or string matches the rewriter pattern; pnpm check and the full test suite pass.

## Prohibited Patterns

- Do NOT add a runtime dependency.
- Do NOT weaken the guard back to a from-only grep - that is the blind spot.
- Do NOT rewrite non-module strings.
