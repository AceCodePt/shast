---
wait_human_start: false
wait_human_merge: false
dependencies: []
---

# Task: State the emitted-CSS browser baseline (CSS Nesting) in the README

## Metadata

- **Complexity:** Low
- **Priority:** Medium
- **Status:** Ready for Handoff

## Context

printBlock (src/engine/render/collect-rules.ts:475) emits nested CSS using `&` (e.g. `& > [cid-x]`, `&:hover`, `&.featured`, and nested `@media`). The README shows this output at lines 246-284 but never states the browser baseline it requires. A browser without CSS Nesting parses none of the nested rules and silently renders the page unstyled - exactly the silent, browser-only failure shast exists to prevent. The fix is documentation: state the baseline the output assumes.

## Requirements

- [ ] Add a prominent section to README.md stating the required browser baseline for emitted CSS: CSS Nesting (`&`), with concrete minimum versions (Chrome/Edge 112+, Safari 16.5+, Firefox 117+).
- [ ] Note any other emitted features the output relies on that a reader must check (e.g. `@property`, `@container`); verify what the renderer actually emits before naming them, and do not claim `:has` or others unless they are emitted.
- [ ] State the consequence for older runtimes/WebViews: the nested stylesheet is dropped with no error.
- [ ] Explain why nesting is used (structural-coupling provenance) and point to where it is produced (collect-rules.ts printBlock).
- [ ] pnpm check passes.

## Verification

README.md contains an explicit browser-baseline section naming CSS Nesting and the minimum browser versions, and explains that older runtimes silently drop the nested stylesheet. A reader can determine which browsers run the emitted CSS. pnpm check passes.

## Prohibited Patterns

- Do NOT change the emitted CSS format or add a flatten/fallback compile step.
- Do NOT claim support for browsers lacking the named features.
- Do NOT invent browser versions or features the renderer does not use.
