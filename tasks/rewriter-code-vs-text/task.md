---
wait_human_start: false
wait_human_merge: false
dependencies: []
---

# Task: Make rewriteImports ignore comments and string literals

## Metadata

- **Complexity:** Medium
- **Priority:** High
- **Status:** Ready for Handoff

## Context

rewriteImports (scripts/cli.ts:227-242) rewrites @/ and bare tsyntax specifiers with two global regexes over raw text (/(\bfrom\s*)(["'])([^"']+)\2/g and the import twin). Neither can tell code from text, so prose matching the shape is silently rewritten during vendoring. Reproduced against the real function: a line comment containing 'from "@/engine/old.ts"' becomes 'from "../engine/old.ts"', and the same pattern inside a string literal is rewritten too. No vendored file contains such prose today, so the defect is latent, but nothing would catch it when one does. The existing rewriting tests (tests/cli/vendor.test.ts:129) only assert that real specifiers are mirrored; they do not exercise code-vs-text.

## Requirements

- [ ] Replace the two regex replaces in rewriteImports with a scan that rewrites specifiers only in code position: skip // line comments, /* */ block comments, and single/double/backtick string literals (honoring backslash escapes), so text inside them is never touched.
- [ ] Preserve current semantics exactly: @/x maps to the mirrored relative path (append .ts when the specifier is extensionless); bare tsyntax maps to relative tsyntax/index.ts; every other specifier (relative or external) is left untouched. Multi-line import { ... } from "..." and export ... from "..." must still rewrite.
- [ ] Add no runtime dependency.
- [ ] Add tests in tests/cli/vendor.test.ts: a comment containing 'from "@/engine/types"' is byte-identical after rewriteImports; a string literal containing "from '@/engine/types'" and 'import "tsyntax"' is byte-identical; a real static import still rewrites; a multi-line named import still rewrites.

## Verification

rewriteImports returns the input unchanged for the comment and string-literal cases; the existing 'no vendored file keeps a @/ or tsyntax specifier' assertions still hold; pnpm check and the full test suite pass.

## Prohibited Patterns

- Do NOT add a runtime dependency (no parser in the shipped CLI).
- Do NOT change rewriteSpecifier's target mapping.
- Do NOT stop rewriting legitimate static import/export specifiers.
- Do NOT rewrite anything inside a comment or string literal, even when it looks like @/...
