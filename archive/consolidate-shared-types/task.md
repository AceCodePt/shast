---
wait_human_start: false
wait_human_merge: false
dependencies: [css-keyframes-config]
---

# Task: Consolidate the type system onto a data-first CSS identifier module

## Metadata

- **Complexity:** Medium
- **Priority:** Medium
- **Status:** Ready for Handoff

## Context

shast's type system carries parallel hand-written type definitions across src/types.ts, src/engine/types.ts, src/css/queries-config/types.ts, and src/css/keyframes-config/types.ts. The CSS identifier character set is a hand-written union type (CSSIdentifierCharacter/CSSIdentifierDigit) declared in BOTH engine/types.ts and keyframes-config/types.ts; Trim is re-defined locally in queries-config/types.ts; the QueryVocabulary interface is a hand-written type that duplicates the QUERY_VOCABULARY data const; KeysMatching/FilterOut/ResolveComplexValue are copied between engine and keyframes. The direction must be data-first: a data const (a string of allowed characters, or a uniqueArray) is the single source of truth; the union types are DERIVED from that data (CharsOf string-split, or typeof of a const), and the same data feeds runtime parsing so the two walls cannot drift.

## Requirements

- [ ] New shared module src/css/ident.ts: data-first identifier vocabulary - ALLOWED_IDENTIFIER_CHARS / ALLOWED_IDENTIFIER_START string consts (or equivalent data), a CharsOf<S> type that splits a string into a union of its characters, derived CSSIdentifierCharacter/CSSIdentifierDigit unions that are EXACTLY CharsOf<...> of the data, and a shared ContainsIllegalCharacter<S, Allowed> validator
- [ ] engine/types.ts class-name validation (ValidateClassName, SplitSpace) imports the identifier machinery from @/css/ident.ts instead of re-declaring CSSIdentifierCharacter/CSSIdentifierDigit/ContainsIllegalClassNameCharacter
- [ ] keyframes-config/types.ts ValidateKeyframeName imports CSSIdentifierCharacter/CSSIdentifierDigit/ContainsIllegalCharacter from @/css/ident.ts instead of re-declaring them
- [ ] Runtime parsing consumes the same data: the engine CSS_CLASS_NAME check and the keyframes KEYFRAME_NAME check are built from the ident data (regex or Set constructed from the data strings), and preserve current runtime acceptance EXACTLY - including the non-ASCII \u00A0-\uFFFF allowance (this is a consolidation, not a tightening)
- [ ] Trim removed from queries-config/types.ts and imported from @/types.ts instead
- [ ] QueryVocabulary interface removed from queries-config/types.ts; export type QueryVocabulary = typeof QUERY_VOCABULARY; every V extends QueryVocabulary validator keeps type-checking (mediaTypes/operators unions tighten to their literals)
- [ ] KeysMatching/FilterOut/ResolveComplexValue consolidated into a single shared location (@/types.ts), imported by both engine/types.ts and keyframes-config/types.ts
- [ ] Keyframes selector aliases (from->0%, to->100%) become data (a const alias map) feeding both the type-level NormalizeSelector and the runtime normalizeSelector/duplicate detection
- [ ] Each consolidated type has exactly one definition across src/; no change to which queries, classes, or keyframes are accepted or rejected
- [ ] Type Validation, Type Inference, Runtime Validation, Test

## Verification

pnpm check and pnpm test pass. Grep shows exactly one definition each of Trim, CSSIdentifierCharacter, CSSIdentifierDigit, CharsOf, ContainsIllegalCharacter, KeysMatching, and ResolveComplexValue across src/. type QueryVocabulary === typeof QUERY_VOCABULARY. CSSIdentifierCharacter === CharsOf<typeof ALLOWED_IDENTIFIER_CHARS>. The full existing test suite (queries-config, engine, keyframes-config) passes with only import moves - no behavior changes to accepted/rejected values, including non-ASCII identifiers.

## Prohibited Patterns

- Do NOT hand-write the identifier character union type; it must derive from a data string via CharsOf (or a uniqueArray/typeof tuple)
- Do NOT change runtime identifier acceptance - the non-ASCII (\u00A0-\uFFFF) allowance must be preserved
- Do NOT copy shared type utilities between modules; each lives in exactly one shared location
- Do NOT change the queries-config vocabulary values or its return contract
