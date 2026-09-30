---
wait_human_start: false
wait_human_merge: false
dependencies: []
---

# Task: shast add --force: report which existing files differ instead of overwriting silently

## Metadata

- **Complexity:** Low
- **Priority:** Medium
- **Status:** Ready for Handoff

## Context

`shast add --force` overwrites every pre-existing destination file with no diff, no backup, and no indication of which files differed from what is being written (scripts/cli.ts: only ExistingDestinationError, raised without --force, enumerates collisions; the force path just writeFileSync's over them). The files most likely to be customised are the shipped config variations - e.g. src/html/tag-config/variations/common.ts, a hand-edited registry literal where the shadcn-style tweak is 'add a tag' or 'widen an attribute type'. --force replaces those wholesale, and the failure is silent AND semantic: the consumer's tag or attribute stops validating with nothing connecting cause to effect. The vendored index.ts is a pure barrel (assemble-your-own-registry, wiring lives in examples/basic.ts) and is NOT where customisation happens, so it is not the file that motivates this. A full manifest (version + file hashes recorded at vendor time, vendored into the consumer tree) is deliberately deferred: it buys attribution and a cross-update baseline, but it is speculative until a consumer has customised a tree and wants to refresh. This task is the cheap, non-speculative rung chosen instead: reuse the refusal path's existing collision enumeration and annotate it with which pre-existing files differ from the incoming bytes. Honesty caveat to document in the output/comment: with no stored baseline, 'differs from incoming' is exact on the first update (only one add generation exists, so any divergence is local - an edit or a consumer-added file), but on later updates it over-reports, flagging files where only upstream changed as if locally modified. That degradation is exactly why the eventual fork is manifest vs report-on-write, not manifest vs nothing.

## Requirements

- [ ] Under --force, enumerate the pre-existing destination files about to be replaced, content-compare each against the incoming bytes, and report which differ (e.g. a bounded list of replaced-and-differing paths) so an overwrite is never silent.
- [ ] Reuse the existing destination enumeration that ExistingDestinationError already uses; no new subcommand, flag, or prompt.
- [ ] Print the report on a successful (exit 0) --force run, and print nothing extra on a clean first-time add where nothing pre-existed.
- [ ] Keep the list bounded like MAX_LISTED_FILES (show the first N differing paths, summarise the remainder).
- [ ] Do not imply attribution: the output must not claim to distinguish 'you edited this' from 'upstream changed this'.
- [ ] Tests: --force over a tree with one edited variation file names that file as differing; --force over an identical tree reports zero differing; the no-force refusal behaviour and message are unchanged.
- [ ] The CLI script and its tests are type-clean under `pnpm check` and the full suite passes.

## Verification

`pnpm shast add /tmp/shast-vendor` exits 0; edit one vendored variation file (add a tag to html/tag-config/variations/common.ts), then `pnpm shast add /tmp/shast-vendor --force` exits 0 and names that file as replaced-and-differing; a further `--force` over the now-identical tree reports zero differing; `pnpm shast add /tmp/shast-vendor` without --force still lists collisions and exits non-zero; `pnpm check` and the test suite pass.

## Prohibited Patterns

- Do NOT build a manifest, hash file, version stamp, or any persistent state in the consumer tree - that is the deferred option and is a separate decision.
- Do NOT add a new subcommand, flag, or interactive prompt; this annotates output that already exists.
- Do NOT back up, restore, or refuse to overwrite under --force; --force still overwrites, it just stops being silent.
- Do NOT change the no-force refusal semantics or its message.
