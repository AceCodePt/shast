---
wait_human_start: false
wait_human_merge: false
dependencies: []
---

# Task: Relocate resolved-format/ under tests/

## Metadata

- **Complexity:** Medium
- **Priority:** Low
- **Status:** Ready for Handoff

## Context

`resolved-format/` sits at the repo root but is dev-only: it is excluded from `tsconfig.json` and from `package.json#files`, and it is consumed only by `tests/resolved-format/*.test.ts` (which launch Chromium) plus the eval write-ups under `docs/`.

Moving it under `tests/` puts the resolver implementation beside its tests, removes a top-level directory that reads as clutter, and lets the tsconfig exclude list shrink. `evals/` carries no source `.ts` (only the gitignored `out/`), so it is not the right parent.

## Requirements

- [ ] Move every file from `resolved-format/` into `tests/resolved-format/` (merging with the existing test files there), preserving file names. Use `git mv` so history follows.
- [ ] Rewrite imports in `tests/resolved-format/*.test.ts` from `../../resolved-format/<name>.ts` to `./<name>.ts` (and any other relative references), keeping `@/...` imports unchanged.
- [ ] Update `tsconfig.json` `exclude`: drop the root `"resolved-format"` entry, keep `"tests/resolved-format"` and `"evals"`.
- [ ] Update path references in the docs that name the resolver's location: `docs/resolved-format-eval.md`, `docs/resolved-format-eval-recheck.md`, and `docs/html-conditional-attributes-handoff.md` (grep for `resolved-format/`). Use `tests/resolved-format/...` for the moved implementation files.
- [ ] Leave the root `shast-resolved-format.md` design doc where it is (out of scope); leave `tests/cli/vendor.test.ts`'s no-leakage assertion as-is (it checks the vendored destination, not the repo root).
- [ ] Do not change any resolver behavior or test assertions.

## Verification

`resolved-format/` no longer exists at the repo root; `tests/resolved-format/` contains the implementation (`cascade.ts`, `resolved.ts`, `measured.ts`, etc.) beside the existing `*.test.ts`. No import still points at `../../resolved-format/`, and `tsconfig.json` no longer excludes a root `resolved-format`. `pnpm check` passes and the full test suite passes (the browser-backed resolved-format tests require playwright, as before).

## Prohibited Patterns

- Do NOT change resolver logic, output, or test assertions.
- Do NOT move `evals/` or the root `shast-resolved-format.md`.
- Do NOT leave a compatibility shim or re-export at the old `resolved-format/` path.
- Do NOT add new dependencies.
- Do NOT weaken or skip the resolved-format tests.
