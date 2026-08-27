---
wait_human_start: false
wait_human_merge: true
dependencies: []
---

# Task: CSS Queries Config: derive unit vocabulary from the CSS syntax config via the DSL

## Metadata

- **Complexity:** Medium
- **Priority:** Medium
- **Status:** Ready for Handoff

## Context

The css-queries-config vocabulary currently hardcodes length/resolution units as `LENGTH_UNITS = uniqueArray([...])` / `RESOLUTION_UNITS = uniqueArray([...])` in src/css/queries-config/types.ts, duplicating what the css syntax config already declares in its `<length>` / `<resolution>` DSL strings. The user wants a single source of truth: cssQueriesConfig should take the CSS syntax config as a function parameter (mirroring cssAttributeConfig(keywords, syntaxConfig, config) and cssPropertiesConfig(keywords, syntaxConfig, config)) and derive the unit vocabulary from it using the DSL — tsyntax parseValueAgainstDSL at runtime and InferCSSSyntax/DSLInfer at the type level — not by regex-parsing the DSL strings. Key constraints from the discussion: (a) do NOT use the full syntax config as the module-level source; the config is passed per call; (b) <resolution> may not exist in every config — when absent, resolution queries must simply be invalid (type error + runtime error), i.e. disregarded; (c) do NOT reintroduce the giant-union DSL grammar that commit 0402c99 removed for ~20x perf. This refactor is the follow-up to archive/css-queries-config/task.md.

## Requirements

- [ ] cssQueriesConfig signature becomes cssQueriesConfig<const S extends BaseCSSSyntaxConfig, const T extends readonly string[]>(syntaxConfig: S, queries: ValidateQueries<T, QueryVocabularyFor<S>>): T — the CSS syntax config is the first argument, mirroring cssAttributeConfig/cssPropertiesConfig
- [ ] Runtime value validation reuses the DSL: isLength/isResolution/isNumber call tsyntax parseValueAgainstDSL against syntaxConfig["<length>"] / syntaxConfig["<resolution>"] / syntaxConfig["<number>"] (wrapped in a matchesDSL try/catch helper); no regex is written to extract units from the DSL strings
- [ ] <length> is required: a config without <length> makes length features fail with a clear error; <resolution> is optional: a config without <resolution> means resolution queries are invalid (type-level error and runtime throw)
- [ ] Type-level vocabulary derives from the config: QueryVocabularyFor<S> fills lengthUnits/resolutionUnits via InferCSSSyntax<SupportedKeywords, S, "<length>"> / "<resolution>"> (a `${number}${units}` template-literal pattern, or never when the token is absent); all other QueryVocabulary fields come from the existing module consts
- [ ] QueryVocabulary interface fields lengthUnits/resolutionUnits change from readonly string[] to string; IsUnitValue becomes `Value extends Units ? true : false`; the structural validation types (MediaFeatureValueOk, RangeComparison, etc.) otherwise stay as-is
- [ ] Remove LENGTH_UNITS, RESOLUTION_UNITS and the QUERY_VOCABULARY constant from src/css/queries-config/types.ts; keep the other vocabulary consts (OPERATORS, RANGE_OPS, MEDIA_TYPES, feature lists, etc.)
- [ ] Add a <resolution> token to the common syntax config (src/css/syntax-config/variations/common.ts) matching full's DSL `${number}${'dpi' | 'dpcm' | 'dppx' | 'x'}` (or the trimmed set agreed with the user)
- [ ] Queries variations pair with their matching syntax variation like attribute-config does: minimal.ts→minimalCSSSyntax (no <resolution>, so no resolution queries), common.ts→commonCSSSyntax (keeps @media (resolution >= 2dppx), count stays 13), full.ts→fullCSSSyntax
- [ ] Tests updated: every cssQueriesConfig call passes a syntax config; typeof QUERY_VOCABULARY type helpers become QueryVocabularyFor<typeof COMMON_SYNTAX>; no test relies on the removed consts
- [ ] New DSL-derivation tests: (1) type-level — "768px" extends QueryVocabularyFor<typeof COMMON_SYNTAX>["lengthUnits"], "1cqw" does not, "2dppx" extends the common resolutionUnits; (2) absent-resolution — "2dppx" does not extend QueryVocabularyFor<typeof MINIMAL_SYNTAX>["resolutionUnits"] and cssQueriesConfig(minimalSyntax, ["@media (resolution >= 2dppx)"]) is a type error and runtime throw; (3) runtime — @media (width < 1cqw) passes with full syntax and throws with common
- [ ] All existing Type Validation / Type Inference / Runtime Validation / Edge Cases / Variations tests keep passing (adjusted only for the new signature)

## Verification

pnpm check (tsc --noEmit) and pnpm test pass. Probe: cssQueriesConfig(commonCSSSyntax, [\"@media (width < 768px)\", \"@media (resolution >= 2dppx)\"]) builds and infers the literal tuple; cssQueriesConfig(commonCSSSyntax, [\"@media (width < 1cqw)\"]) throws at runtime and is a type-level error; cssQueriesConfig(minimalCSSSyntax, [\"@media (resolution >= 2dppx)\"]) throws at runtime and is a type-level error; cssQueriesConfig(fullCSSSyntax, [\"@media (width < 1cqw)\"]) passes. No file in src/css/queries-config contains a regex that extracts unit names from a DSL string.

## Prohibited Patterns

- Do NOT parse the DSL strings with regexes at runtime to extract unit lists; the DSL itself (parseValueAgainstDSL / InferCSSSyntax) must answer the validation
- Do NOT import a specific syntax config variation (full/common/minimal) as the module-level source inside src/css/queries-config; the config is a function parameter
- Do NOT keep LENGTH_UNITS / RESOLUTION_UNITS / QUERY_VOCABULARY hardcoded unit arrays
- Do NOT reintroduce the giant-union DSL grammar that commit 0402c99 removed (~20x slower queries types); validation stays structural
- Do NOT change the cssQueriesConfig return contract: it still returns the passed query array as-is with the exact literal-tuple inferred type
