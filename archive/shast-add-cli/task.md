---
wait_human_start: false
wait_human_merge: false
dependencies: []
---

# Task: shast add — vendor the engine, config variations, and tsyntax into a consumer tree

## Metadata

- **Complexity:** Medium
- **Priority:** High
- **Status:** Ready for Handoff

## Context

shast is consumed today as the package @ace-code/shast (main: src/index.ts, raw TS, no build), and it imports tsyntax via a local link: in 35 files. The README's "Own your registry" section already states the shadcn philosophy - you don't install a black box, you own the code - but the mechanism only covers registry config, not the engine. This slice adds a repo-local CLI, `pnpm shast add <dest>`, that copies the engine, all three config variations, and the local tsyntax source into the consumer's tree, rewriting every import so the result is self-contained: no @ace-code/shast dependency, no tsyntax dependency, no @/ tsconfig alias. The consumer then owns and forks that source. No upstream sync, diff, or update path is in scope.

## Requirements

- [ ] `pnpm shast add [dest]` runs via a "shast" script in package.json (`npx tsx scripts/cli.ts`), dispatching an `add` subcommand; `dest` defaults to `src/shast`
- [ ] Copies all of src/ needed by the engine: engine/**, css/**, html/**, types.ts, env.d.ts - excluding the demo/package entry src/index.ts
- [ ] Copies every config variation - minimal, common, full - for all eight families (html attributes, html tags, css attributes, css syntax, css properties, css pseudo-classes, css queries, css keyframes)
- [ ] Vendors the local tsyntax (src/index.ts, src/types.ts) into <dest>/tsyntax/
- [ ] Rewrites every @/... import to a relative path computed from the copied file's mirrored location
- [ ] Rewrites every bare "tsyntax" specifier to the vendored tsyntax/index.ts
- [ ] Generates a clean <dest>/index.ts that wires engine({ ... }) and imports the selected variation (not the demo src/index.ts)
- [ ] --config minimal|common|full selects which variation the generated entry imports (default common); all variations are copied regardless
- [ ] --force required to overwrite existing destination files; without it, refuse and report the collisions
- [ ] Vendored output contains zero @/ imports and zero bare tsyntax imports
- [ ] The CLI script and its tests are type-clean under `pnpm check`
- [ ] Tests cover: full copy set, import rewriting (@/ and tsyntax), generated entry per variant, and no-clobber-without-force

## Verification

`pnpm shast add /tmp/shast-vendor` exits 0 and writes engine/, css/, html/, tsyntax/, and index.ts under /tmp/shast-vendor. `grep -rE 'from "@/|from "tsyntax"' /tmp/shast-vendor` yields no matches. A scratch tsconfig plus a smoke file importing /tmp/shast-vendor/index.ts passes `tsc --noEmit` and `renderComponent` returns non-empty html and css. Running `pnpm shast add` twice without --force fails and reports the existing files; with --force it succeeds. `pnpm check` and the test suite pass.

## Prohibited Patterns

- Do NOT copy docs, tests, evals/, or the demo src/index.ts into the vendored tree
- Do NOT build an update/diff/sync path - the user explicitly ruled out upstream sync
- Do NOT require the consumer to add a @/ tsconfig path alias; relative rewriting is the contract
- Do NOT leave a runtime dependency on @ace-code/shast or on the linked tsyntax package in the vendored output
- Do NOT publish a package or add a bin entry - keep it a repo-local script, per the chosen distribution model
