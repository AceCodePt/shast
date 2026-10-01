---
wait_human_start: false
wait_human_merge: false
dependencies: [css-syntax-config-array-only]
---

# Task: CSS attribute-config: array-only arms

## Metadata

- **Complexity:** High
- **Priority:** High
- **Status:** Ready for Handoff

## Context

Second step of the array-only arms optimisation, after css-syntax-config-array-only. Convert the CSS attribute config to readonly string[] only (no string branch) at every level, including the self/children bags inside a gate, and switch engine/types.ts's flat-key filter to select array values.
IMPORTANT starting state: shast main is currently string-only. There is no `string | readonly string[]` union to strip - this is the array-only introduction. engine/types.ts currently has five `KeysMatching<CSSAttributesConfig, string>` (lines ~1122, ~1176, ~1236, ~1357, ~1415), not a union.
The design names some helper types that may not exist in main (InferCSSAttributeValue, CSSAttributeArms, ValidateCSSAttributeValue). Where a named type is missing, CREATE it as the array-arm surface rather than leaving a dangling reference.

## Requirements

- [ ] src/css/attribute-config/types.ts: remove the string branch from every type - BaseCSSAttributeSimpleConfig, BaseCSSAttributesComplexConfig, ValidateCSSAttributesSimpleConfig, ValidateCSSAttributesConfig, InferCSSAttributesSimpleConfig, InferCSSAttributesConfig - values are readonly string[] only, including inside a gate's self/children bag. Introduce the array-arm validation helpers (arm validation via DSLValidateArm); create any named helper that does not yet exist.
- [ ] src/engine/types.ts: change all five `KeysMatching<CSSAttributesConfig, string>` (lines ~1122, ~1176, ~1236, ~1357, ~1415) to `KeysMatching<CSSAttributesConfig, readonly string[]>`.
- [ ] src/engine/types.ts: this surfaces TS2344 at exactly four places because TS does not narrow CSSAttributesConfig[K] through the KeysMatching filter - InferPropBag's Bag constraint, CalcSlotAtomsForKey, VarContextType, and the inline mapped type inside ValidateComponentCSSStructure. Fix each by adding `& readonly string[]` to that specific CSSAttributesConfig[K] usage, and nowhere else.
- [ ] src/css/attribute-config/index.ts: cssAttributeConfig drops the string branch at every level - flat values, gate pattern-key checks, and each gate's self/children inner values - validating every arm, and normalises all of them to joined strings before returning.
- [ ] src/css/attribute-config/variations/minimal.ts, common.ts, full.ts: convert every bare string to a one-element array, including nested inline single-line bags like `self: { "z-index": "<integer>" }`; a regex that only matches end-of-line leaves will miss these, so it must also match before a closing brace.
- [ ] Update tests that build CSS attribute configs to the array shape.

## Verification

pnpm check and pnpm test are green with no unused @ts-expect-error directives (TS2578 is the tripwire). Probes: a flat value ["<integer>","<length>"] validates each arm; an empty array is a type error and a runtime throw; a gate's self/children arrays validate and return joined strings; the five KeysMatching sites use readonly string[].

## Prohibited Patterns

- Do not reintroduce a string branch at any level.
- Do not add `& readonly string[]` outside the four named sites.
- Do not miss nested inline self bags written on one line.
- Do not let arrays escape cssAttributeConfig; join before returning.
- Do not quote wall-clock times.
