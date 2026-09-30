// Wrap a tsyntax DSL-miss error with the shast context the parser cannot know:
// the offending key (property or attribute), the element's tag, and where the
// element sits in the component tree. tsyntax reports only the value's type and
// the DSL it failed (`Value of type "string" does not match DSL "<color>"`),
// which names neither the property nor the node, so the diagnostic work happens
// here, at the layer that knows the tree.
//
// The tsyntax prose is preserved verbatim - only the prefix is added. Only
// value-path DSL errors flow through here; shast-authored errors (selectors,
// gates, locked properties, unknown keys) are thrown directly and keep their
// wording.
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
