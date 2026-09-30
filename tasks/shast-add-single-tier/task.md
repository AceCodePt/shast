---
wait_human_start: false
wait_human_merge: false
dependencies: []
---

# Task: shast add: vendor exactly one config tier and drop the vendored barrel

## Metadata

- **Complexity:** Medium
- **Priority:** High
- **Status:** Ready for Handoff

## Context

scripts/cli.ts copies css and html wholesale via COPY_DIRS, so minimal.ts, common.ts and full.ts all land in the consumer tree for all seven variation families, and COPY_FILES copies src/index.ts verbatim as the vendored entry. That file is a barrel re-exporting all three tiers of all seven families, so importing anything from it pulls every tier into the program, including the 3,401-line full.ts tag table, whether or not the consumer references it. Measured at dfda56f on a consumer file using the common tier and no components: through the barrel 133,564 types / 1,058,429 instantiations / 56 source files; importing the same tier directly 82,962 types / 518,264 instantiations / 41 source files. The barrel costs about 540,000 instantiations and 50,000 types, more than doubling the fixed cost, for tiers the consumer never names. At 50 components the gap keeps its shape: 150,586 types / 1,317,753 instantiations through the barrel vs 101,274 / 782,161 direct. The closed-world half matters more: a consumer who deliberately picked minimal has fullHTMLTags and fullCSSAttributes in their own tree exported from their own entry, and the AI-agent audience Shast targets will find them. A tier choice not enforced by what exists on disk is a convention. Decisions taken with the author: (1) --tier defaults to common, values minimal|common|full; (2) src/index.ts stays in the repo and is removed from vendoring - the vendored tree has no barrel; (3) backwards compatibility is explicitly not required, so add may delete stale shast-owned files outright; (4) verification is one cheap on-disk file-list test in tests/cli/vendor.test.ts, with no tsc or type-check harness. All three tiers stay in the Shast repo, where the library's own surface and tests exercise them; add is the repo-versus-consumer boundary. Note that variation files cross-import only within the same tier (e.g. html/tag-config/variations/common.ts imports css/attribute-config/variations/common.ts), so filtering to one tier per family is internally consistent under the existing @/ rewriting. src/types.ts is a real dependency of engine/ and css/ and must stay in COPY_FILES.

## Requirements

- [ ] In scripts/cli.ts add `type Tier = "minimal" | "common" | "full"`, `AddOptions.tier?: Tier`, and a default of "common" when the option is omitted. Parse `--tier <value>` in parseAddArgs and reject an unknown value with exit code 2 and nothing written.
- [ ] In scripts/cli.ts change COPY_FILES to ["types.ts"] only; src/index.ts is no longer vendored and no barrel of any kind is written.
- [ ] In scripts/cli.ts make planVendor copy exactly one variation file per family: while walking COPY_DIRS, skip any file matching `variations/(minimal|common|full).ts` whose basename is not the chosen tier. Keep every index.ts and types.ts and the chosen `<tier>.ts`. Filter by the known tier names so a differently-named variation file is never silently dropped.
- [ ] In scripts/cli.ts make add remove stale shast-owned paths from an existing destination: the two non-chosen `variations/<tier>.ts` in every variation directory the source walk visits, plus root index.ts. Removal runs after the collision check, add `removed: string[]` to AddResult, and main reports the removal count. No byte-comparison guard: backwards compatibility is explicitly not required.
- [ ] Keep src/index.ts in the repo and keep examples/basic.ts and every repo test exercising all three tiers via @/ imports; do not delete or thin the repo's own surface.
- [ ] tests/cli/vendor.test.ts: loop over the three tiers asserting the chosen `<tier>.ts` exists for all VARIATION_DIRS while the other two are absent; add a no-flag default-common case; add a stale-tree prune case (add full, then add common --force) asserting every full.ts and root index.ts are gone, common.ts is present, and result.removed names them.
- [ ] tests/cli/vendor.test.ts: update or remove every test that assumes a vendored index.ts (the copy-set test, the vendored-entry test, the entry assertions in the import-rewriting test, the --force test, the ESM-accept test, the collision test, and the replaced/differing test); move the dynamic-import fixture's import into a copied file such as src/engine/render/escape.ts; add a `--tier bogus` rejection test.
- [ ] README.md: rewrite the Install command and both import snippets to direct imports (engine/index.ts, each family's index.ts, the chosen family variation path, tsyntax/index.ts); document that --tier defaults to common and that only the chosen tier is vendored; relabel the performance figures as a single-tier common vendored tree.
- [ ] pnpm check and pnpm test pass.

## Verification

pnpm check and pnpm test pass. In an ESM scratch project, `pnpm shast add /tmp/t --tier minimal` writes only minimal.ts under each of the seven variations directories and writes no root index.ts; `pnpm shast add /tmp/t --tier full --force` then removes every minimal.ts and writes full.ts, reporting the removals; `pnpm shast add /tmp/t --tier bogus` exits 2 and writes nothing; `pnpm shast add /tmp/u` with no flag vendors common only. The new tests in tests/cli/vendor.test.ts assert the on-disk file list after vendoring without invoking tsc.

## Prohibited Patterns

- Do not write any vendored barrel or generated entry point, including a smaller one that re-exports only the chosen tier.
- Do not delete src/index.ts from the repo or stop examples/basic.ts and the repo tests from exercising all three tiers.
- Do not add a tsc or type-check harness, or re-measure instantiations/types, in this task.
- Do not add a manifest, hash file, or version stamp to the consumer tree.
- Do not change the contents of the seven families' variation files or the existing @/ and tsyntax import rewriting.
- Do not prune by byte-comparing stale files against source, and do not refuse to remove stale non-chosen tier files; backwards compatibility is not required.
- Do not add a compatibility shim for the old ./src/shast/index.ts import path.
