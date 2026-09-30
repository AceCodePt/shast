---
wait_human_start: false
wait_human_merge: false
dependencies: [document-integer-child-keys]
---

# Task: Document why .orchestration/ and archive/ are tracked

## Metadata

- **Complexity:** Low
- **Priority:** Low
- **Status:** Ready for Handoff

## Context

`.orchestration/` and `archive/` are deliberately kept in version control. They are the project's development record: how it was built, what was tried, what was discarded.

`.orchestration/README.md` already says the orchestration directory is deliberately inside the worktree and tracked, but nothing at the top level explains why `archive/` (the spec and outcome of every completed or abandoned task) is tracked rather than treated as clutter. Saying so explicitly turns a hygiene objection into an intentional design statement.

## Requirements

- [ ] Add a short README section (e.g. `## Repository history`, near `## Status`) explaining that `.orchestration/` and `archive/` are deliberately version-controlled: they record how the project was built and what was tried and discarded, and are not leftover clutter.
- [ ] Keep it brief (a short paragraph or two); do not inventory individual archived tasks.
- [ ] Do not move or delete anything.

## Verification

README has a section stating that `.orchestration/` and `archive/` are intentional, tracked development records. No files moved. pnpm check and the full test suite pass.

## Prohibited Patterns

- Do NOT move, delete, or .gitignore anything under `.orchestration/` or `archive/`.
- Do NOT rewrite the existing .orchestration/README.md.
- Do NOT turn this into a per-task inventory.
