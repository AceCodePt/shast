---
wait_human_start: false
wait_human_merge: false
dependencies: []
---

# Task: Validate attribute names at render time even when skipValidation is set

## Metadata

- **Complexity:** Low
- **Priority:** High
- **Status:** Ready for Handoff

## Context

renderAttributes (src/engine/render/render-component.ts:30-47) interpolates the attribute key straight into markup (` ${key}` for boolean attributes and ` ${key}="..."` otherwise) with no escaping of the name.

With `engine(config, { skipValidation: true })` (src/engine/index.ts:129-131) createComponent is a pass-through, so an attribute key such as 'x onload="alert(1)"' survives to the renderer and emits `<div x onload="alert(1)"="y">`. This is output safety, not input validation, so the flag must not disable it: the whole point of the second wall is to be the last line before bytes leave the process.

All attribute names declared in the registry match /^[a-zA-Z][\w-]*$/ and generated cid-* identifiers already satisfy it, so an unconditional check changes nothing for validated components.

## Requirements

- [ ] In renderAttributes (src/engine/render/render-component.ts:30-47), always validate each attribute key against /^[a-zA-Z][\w-]*$/ regardless of the skipValidation option, and throw a clear error naming the invalid key when it fails.
- [ ] The check must be unconditional output safety: it runs on every render, not only when skipValidation is set.
- [ ] Valid attribute names render byte-identically to today, including boolean (true) attributes and array-valued attributes; value escaping is unchanged.
- [ ] Generated identifiers (cid-<hash>, cid-<name>) are not passed through this check or already satisfy it; no change to them.
- [ ] Add a test that a component with skipValidation: true and an injected attribute name throws at render, and that valid data-*/aria-* style names still render.
- [ ] pnpm check and the full test suite pass.

## Verification

With `engine(config, { skipValidation: true })`, rendering { tag: "div", innerHTML: "x", attributes: { 'x onload="alert(1)"': "y" } } throws instead of emitting `<div x onload="alert(1)"="y">`. A valid { 'data-x': "y", title: "z" } still renders `<div data-x="y" title="z">`. With validation on, behaviour is unchanged. pnpm check and the full test suite pass.

## Prohibited Patterns

- Do NOT escape or rewrite an invalid attribute name; throw instead.
- Do NOT gate the check on skipValidation; it must run unconditionally as output safety.
- Do NOT reject names the registry already declares (all match /^[a-zA-Z][\w-]*$/).
- Do NOT weaken or move the existing attribute-value escaping.
- Do NOT change the validation-on path or its error messages.
