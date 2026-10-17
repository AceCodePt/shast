// The five CSS-wide keywords.
//
// Per CSS these are valid as the value of *every* property. They are a fixed,
// engine-level set -- the CSS analog of global HTML attributes -- so they are
// deliberately NOT part of any registry. The value-validation seam unions this
// type onto each property's own inferred syntax, and the runtime accepts the
// keywords before property-specific matching, instead of every config author
// adding them to every syntax token (the registry-of-globals anti-pattern).
//
// https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Values_and_Units#css-wide_keywords
export type CSSWideKeyword =
  | "inherit"
  | "initial"
  | "unset"
  | "revert"
  | "revert-layer";

export const CSS_WIDE_KEYWORDS: readonly CSSWideKeyword[] = [
  "inherit",
  "initial",
  "unset",
  "revert",
  "revert-layer",
];

export function isCSSWideKeyword(value: unknown): value is CSSWideKeyword {
  return (
    typeof value === "string" &&
    (CSS_WIDE_KEYWORDS as readonly string[]).includes(value)
  );
}
