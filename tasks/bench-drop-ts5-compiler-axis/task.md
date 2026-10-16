---
wait_human_start: false
wait_human_merge: false
dependencies: [bench-harness-variant-tier]
---

# Task: chore: drop the typescript-5 devDependency

## Metadata

- **Complexity:** Low
- **Priority:** Medium
- **Status:** Ready for Handoff

## Context

The harness no longer measures two compilers; the single compiler is the repo's "typescript". The typescript-5 alias (npm:typescript@5.9.3) is now unused and must be removed.

## Requirements

- [ ] Remove the typescript-5 entry from devDependencies in package.json.
- [ ] Run pnpm install and commit the updated pnpm-lock.yaml.
- [ ] Confirm no source, test or doc references typescript-5, ts5, or COMPILER_PACKAGES remain.

## Verification

grep -rn for "typescript-5", "COMPILER_PACKAGES", and a bare "ts5" (excluding node_modules, .git, archive) returns nothing.
pnpm install --frozen-lockfile succeeds; a bench run still works with the single compiler.

## Prohibited Patterns

- Do not delete the typescript devDependency or change any other dependency.
- Do not leave pnpm-lock.yaml out of sync with package.json.
