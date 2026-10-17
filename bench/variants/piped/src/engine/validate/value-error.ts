// Wrap a tsyntax DSL-miss error with the shast context the parser cannot know:
// the offending key, the element's tag, and where the element sits in the tree.
// tsyntax reports only the value's type and the DSL it failed, naming neither
// the property nor the node.
//
// The tsyntax prose is preserved verbatim - only the prefix is added. Only
// value-path DSL errors flow through here; shast-authored errors (selectors,
// gates, locked properties, unknown keys) are thrown directly.
export const valueError = (
  prefix: "CSS Error" | "Attribute Error",
  key: string,
  tag: string | undefined,
  path: string,
  error: unknown,
): Error => {
  const prose = error instanceof Error ? error.message : String(error);
  const onTag = tag === undefined ? "" : ` on <${tag}>`;
  return new Error(`${prefix}: ${key}${onTag} at ${path}: ${prose}`);
};
