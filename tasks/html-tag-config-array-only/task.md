---
wait_human_start: false
wait_human_merge: false
dependencies: [html-attribute-config-array-only]
---

# Task: HTML tag-config: array-only arms

## Metadata

- **Complexity:** High
- **Priority:** High
- **Status:** Ready for Handoff

## Context

Final step of the array-only arms optimisation. Most types inherit from html-attribute-config-array-only because ValidateHTMLTagConfig routes each tag's attributes through ValidateHTMLAttributesConfig.
src/html/tag-config/index.ts has the same raw-return bug as task html-attribute-config-array-only: it returns `config as T` without normalising each tag's attributes bag. Fix by importing normalizeHTMLAttributesConfig from the attribute-config module and calling it per-tag.
src/html/tag-config/variations/full.ts is the 3,399-line file, the largest in the whole conversion.
Watch for `display: "block"` / `display: "grid"` / `display: "flex"` values in the tag-config files - those are CSS display keywords read against the CSS attribute-config's `display` key, not HTML attribute DSL values, and must NOT be converted to arrays.

## Requirements

- [ ] Types mostly inherit from task html-attribute-config-array-only via ValidateHTMLTagConfig -> ValidateHTMLAttributesConfig; only touch src/html/tag-config/types.ts if a string branch remains there.
- [ ] src/html/tag-config/index.ts: htmlTagConfig returns `config as T` without normalising each tag's attributes bag. Import normalizeHTMLAttributesConfig from the attribute-config module and call it per-tag on config[tag].attributes before returning.
- [ ] src/html/tag-config/variations/minimal.ts, common.ts, full.ts: convert every bare-string HTML attribute value to a one-element array.
- [ ] Do NOT convert `display: "block"` / `display: "grid"` / `display: "flex"` style values in the tag-config files - those are CSS display keywords, not HTML attribute DSL values. Also leave innerHTML.include and cssPseudoClass / cssPseudoElement alone (they are already arrays of tag/class names, not DSL arms).
- [ ] Update tests that build HTML tag configs to the array shape.

## Verification

pnpm check and pnpm test are green. Probes: htmlTagConfig returns each tag with joined-string attribute values; required-attribute detection works per tag; display values remain bare strings; an unjoined array would have broken id-required detection and now does not.

## Prohibited Patterns

- Do not convert display values to arrays.
- Do not convert innerHTML.include or cssPseudoClass / cssPseudoElement entries (already arrays of names, not DSL arms).
- Do not return arrays from htmlTagConfig.
- Do not quote wall-clock times.
