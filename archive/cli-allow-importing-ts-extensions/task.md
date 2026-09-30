---
wait_human_start: false
wait_human_merge: false
dependencies: []
---

# Task: Teach shast add to reconcile allowImportingTsExtensions

## Metadata

- **Complexity:** High
- **Priority:** Medium
- **Status:** Ready for Handoff

## Context

The vendored tree is raw TypeScript source whose imports carry `.ts` extensions, so it only typechecks when the consumer's tsconfig sets `allowImportingTsExtensions: true`, which TypeScript permits only together with `noEmit: true` or `emitDeclarationOnly: true`. Today nothing in the CLI checks this, so a consumer meets it as a tsc wall. Because `shast add` already writes into the consumer's project, it is the right place to detect, explain, and (with consent) fix the config.

It must never edit without consent, needs a `--yes` path for CI, must stay silent when the config is already correct, and must treat a project that genuinely emits JavaScript (no `noEmit`/`emitDeclarationOnly`) as an incompatibility to report rather than flipping its emit settings.

## Requirements

- [ ] Add a `--yes` option to `shast add` (USAGE and `parseAddArgs`) that consents to the tsconfig edit for CI; without it, prompt interactively before writing.
- [ ] After a successful vendoring, locate the nearest `tsconfig.json` at or above the destination (same upward walk as `nearestPackageJson`) and inspect it, resolving relative `extends` chains where possible. Use a tolerant JSONC read (comments and trailing commas) without adding a runtime dependency.
- [ ] Already correct: if the resolved config sets `allowImportingTsExtensions: true`, print nothing about it.
- [ ] Fixable: if the config sets `noEmit: true` or `emitDeclarationOnly: true` but not `allowImportingTsExtensions`, state what must change and why (vendored TypeScript source with `.ts`-extension imports, no emit step), then ask for consent. With consent (interactive yes or `--yes`), add `"allowImportingTsExtensions": true` to `compilerOptions`, editing the file textually so comments and formatting survive; without consent, print the manual change and write nothing.
- [ ] Incompatible: if the resolved config would emit JavaScript (neither `noEmit: true` nor `emitDeclarationOnly: true`), do not change its emit settings; report that the vendored source requires `noEmit`/`emitDeclarationOnly` and that turning emit off is the consumer's decision.
- [ ] No tsconfig found: print the required compiler options; do not create a file.
- [ ] Never write the tsconfig without consent (interactive yes or `--yes`); in a non-interactive run without `--yes`, print the change and do not edit.
- [ ] Report through `main`'s exit code: 0 when the config is already correct or the change was applied; 1 when the project is left needing a change that was not applied (declined, incompatible, or non-interactive without `--yes`). Keep `add()` non-interactive and unchanged in its CommonJS/refusal contract; put prompting and editing in the CLI layer.
- [ ] Add tests in tests/cli/vendor.test.ts: correct config stays silent; a `noEmit: true` config is offered and, with `--yes`, gains `allowImportingTsExtensions` with comments preserved; an emit config is reported and not edited; no-tsconfig prints the options and writes nothing; without `--yes` and non-interactive, nothing is edited; `main`'s exit codes match the above.
- [ ] Update the README Install section to say `shast add` reconciles the compiler option, with the `--yes` CI note.

## Verification

In a scratch ESM project with `tsconfig.json` `{ "compilerOptions": { "noEmit": true } }`, `main(['add', dest, '--yes'])` returns 0 and the tsconfig gains `allowImportingTsExtensions: true` with its comments intact; a second run prints nothing and returns 0. With `noEmit` false or absent, the CLI reports the incompatibility, leaves the file byte-identical, and returns 1. With no tsconfig, it prints the required options, writes no file, and returns 0. Without `--yes` and with stdin not a TTY, nothing is edited and the return is 1. `pnpm check` and the full test suite pass.

## Prohibited Patterns

- Do NOT edit a tsconfig without consent (interactive yes or `--yes`).
- Do NOT set or flip `noEmit`/`emitDeclarationOnly`/`outDir`; those are the consumer's build decisions.
- Do NOT add a runtime dependency (no TypeScript, no jsonc package) to parse or edit the config.
- Do NOT create a tsconfig where none exists.
- Do NOT make `add()` interactive or change its existing CommonJS/`ExistingDestination` refusal behavior.
- Do NOT reformat the tsconfig or strip its comments.
- Do NOT change the vendored tree's `.ts`-extension imports; the config is what adapts.
