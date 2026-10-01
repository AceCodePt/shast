---
wait_human_start: false
wait_human_merge: false
dependencies: [css-attribute-config-array-only]
---

# Task: HTML attribute-config: array-only arms

## Metadata

- **Complexity:** Medium
- **Priority:** High
- **Status:** Ready for Handoff

## Context

Third step of the array-only arms optimisation. Types conversion mirrors css-attribute-config-array-only. The critical extra here is runtime normalisation: the engine's optional-attribute detection reads a joined string.
src/engine/validate/html.ts (~line 124) does `typeof def === "string" ? def.split("|").some(part => part.trim() === "undefined") : ...` to decide if an attribute is optional. An unjoined array silently returns false, which breaks required-attribute detection - this exact bug made `id` look required on every tag.
After the types change, ValidationContext.globalAttributes is typed BaseHTMLAttributesConfig (arrays only) but its runtime value is genuinely a string, so the declared and runtime types intentionally diverge there.

## Requirements

- [ ] src/html/attribute-config/types.ts: mirror task css-attribute-config-array-only - strip the string branch from BaseHTMLAttributeSimpleConfig, BaseHTMLAttributeComplexValue, BaseHTMLAttributesConfig and the Validate/Infer types; values are readonly string[] only. Create any named array-arm helper that does not yet exist.
- [ ] src/html/attribute-config/index.ts: htmlAttributeConfig currently returns `config as A` with arrays left raw. Normalise arrays to joined strings before returning, and export the normaliser as `normalizeHTMLAttributesConfig` (reuse it inside htmlAttributeConfig). This is required for the html.ts optional-attribute check above.
- [ ] src/html/attribute-config/index.ts: validateHTMLAttributes must validate each arm (DSLValidateArm semantics) rather than a single bare string.
- [ ] src/engine/validate/context.ts: ValidationContext.globalAttributes is typed BaseHTMLAttributesConfig, which after the types change only allows readonly string[]; the runtime value post-normalisation is a string, so change this field's type to an explicit runtime-shape type: Record<string, string | Record<string, Record<string, string>>>.
- [ ] src/engine/index.ts: at the ValidationContext construction, the assignment `globalAttributes: config.htmlAttributesConfig` needs an explicit `as unknown as ValidationContext["globalAttributes"]` cast at that exact line, since the declared and runtime types now intentionally diverge.
- [ ] src/html/attribute-config/variations/minimal.ts, common.ts, full.ts: convert every bare string to a one-element array, with the same care as task css-attribute-config-array-only for nested inline values.
- [ ] Update tests that build HTML attribute configs to the array shape.

## Verification

pnpm check and pnpm test are green. Probes: normalizeHTMLAttributesConfig returns joined strings for every array; a required attribute whose arms contain no "undefined" still throws when missing, and an optional one (an "undefined" arm) does not - `id` is no longer required on every tag; globalAttributes at runtime is strings; the cast type-checks under pnpm check.

## Prohibited Patterns

- Do not leave arrays in the object returned by htmlAttributeConfig.
- Do not change the runtime optional-attribute detection in html.ts to understand arrays; normalise at the config boundary instead.
- Do not type globalAttributes as BaseHTMLAttributesConfig after normalisation.
- Do not quote wall-clock times.
