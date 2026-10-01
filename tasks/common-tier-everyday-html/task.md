---
wait_human_start: false
wait_human_merge: false
dependencies: []
---

# Task: Broaden the common HTML tier to everyday tags and phrasing content

## Metadata

- **Complexity:** Medium
- **Priority:** High
- **Status:** Ready for Handoff

## Context

The shipped common tier declares 31 tags (a article br button div footer form h1-h6 header img input label li main nav ol p section span table tbody td textarea th thead tr ul). Missing tags that everyday UI needs include strong, em, b, i, code, pre, blockquote, select, option, details, summary, dialog, hr, small and figure. So a dropdown (select/option) or bold text (strong/em/b/i) cannot be expressed in common. The gap is twofold: the tag must be registered, and every parent whose innerHTML is an explicit include list must list it. For example p currently allows only #text span a img input br label, so p > strong is rejected even after strong is registered, until p's include list is also edited. The full tier already models all of these tags; the fix is to add the reported set to common and widen the include lists of common's phrasing-content parents, without expanding common toward full breadth (README 'Own your registry' insists smaller registries are strictly better).

## Requirements

- [ ] src/html/tag-config/variations/common.ts: register strong, em, b, i, code, pre, blockquote, select, option, details, summary, dialog, hr, small and figure. Model display/attributes/innerHTML/cssPseudoClass/cssPseudoElement on full.ts, but keep common's tighter attribute surface where full is broad.
- [ ] select/option: select is inline-block with the form-control attributes it needs (name, disabled, required, multiple, size, form) and its innerHTML include must admit option (and optgroup if registered); option is a text-only leaf with value/selected/disabled/label.
- [ ] details includes summary (plus the rest of its flow content); summary is block; dialog is block; pre/blockquote/figure are block; hr is a void tag with innerHTML include []; small is inline.
- [ ] Widen the include lists so the added phrasing tags are reachable where phrasing content belongs: p, h1-h6, a, label, button, and the phrasing containers among the added tags (strong/em/b/i/code/small). Keep block-level tags (pre/blockquote/details/summary/dialog/hr/figure/select) out of p and h1-h6.
- [ ] tests/html/tag-config.test.ts (or a focused new test): type-level and runtime accept for each added tag; p > strong and p > em/b/i/code/small accepted after the change; an unregistered tag is still rejected; a block tag (e.g. p > div) is still rejected as a p child.
- [ ] End-to-end: a component with a select containing options, and a p containing strong, builds at both walls and renderComponent prints the markup.
- [ ] Docs: update README's tier description and docs/limitations.md if either enumerates the common tag set; preserve the 'smaller registries are strictly better' guidance.

## Verification

pnpm check (tsc --noEmit) and pnpm test are green with no unused @ts-expect-error directives (TS2578 is the tripwire). Probes on the shipped common tier: `<select><option>` and `<p><strong>` type-check and render; `<p><div>` remains rejected at both walls; all fifteen reported tags are registered; the original 31 tags still behave as before; a tag outside the registry is still a type error and a runtime throw.

## Prohibited Patterns

- Do not replace common with full or set broad innerHTML: { all: true } on phrasing parents to sidestep the include lists; the point is a curated list.
- Do not add tags beyond the reported missing set without justification; common stays a curated baseline, not the full web platform.
- Do not weaken the unknown-tag or unknown-child checks to make the new tags pass.
- Do not modify the full or minimal tiers, and do not change engine validation code.
