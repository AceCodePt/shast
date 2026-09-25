import { parseValueAgainstDSL, type SupportedKeywordsConfig } from "tsyntax";

// Shared gate machinery for both walls and both layers (CSS and HTML).
//
// A "gate" is a complex attribute (`display`, `type`, ...): the value the
// author writes unlocks further keys on the node itself (`self`) and on its
// direct children (`children`). The type-level counterparts live next to each
// other in `engine/types.ts` (`GateTable` / `GateLookup` / `GateOverlaps`).

export const isGateDefinition = (def: unknown): def is Record<string, any> =>
  def !== null && typeof def === "object" && !Array.isArray(def);

// A value key of a complex definition is a *pattern* when it is written as a
// DSL string: a `<token>` or a backtick template such as `` `todo-${number}` ``.
// Any other key is a literal.
export const isPatternKey = (key: string): boolean =>
  (key.startsWith("<") && key.endsWith(">")) ||
  (key.startsWith("`") && key.endsWith("`"));

// Resolve the value a gate was written with to the key that actually matched.
// Literal first: only on a miss are pattern keys tried, each by parsing the
// written value against it. A value matching two keys is an error; a value
// matching none reports tsyntax's prose about the value.
export function resolveGateValue(
  keywords: SupportedKeywordsConfig,
  gate: string,
  gateDefinition: Record<string, any>,
  writtenValue: unknown,
  prefix: string,
): string {
  if (typeof writtenValue !== "string") {
    throw new Error(
      `${prefix} Error: Invalid value type for '${gate}'. Expected a string`,
    );
  }
  if (Object.prototype.hasOwnProperty.call(gateDefinition, writtenValue)) {
    return writtenValue;
  }
  const matches: string[] = [];
  for (const valueKey of Object.keys(gateDefinition)) {
    if (!isPatternKey(valueKey)) continue;
    try {
      parseValueAgainstDSL(keywords, valueKey, writtenValue);
      matches.push(valueKey);
    } catch {}
  }
  if (matches.length > 1) {
    throw new Error(
      `${prefix} Error: Invalid value '${writtenValue}' for '${gate}': matches more than one pattern key (${matches.join(", ")})`,
    );
  }
  if (matches.length === 1) {
    return matches[0]!;
  }
  throw new Error(
    `${prefix} Error: Invalid value '${writtenValue}' for '${gate}'. Expected one of: ${Object.keys(gateDefinition).join(", ")}`,
  );
}

// The gate keys of a definition bag: every value that is a complex object.
export const gateNames = (definitions: Record<string, any>): string[] =>
  Object.keys(definitions).filter((key) =>
    isGateDefinition(definitions[key]),
  );

// The values of `gate` that unlock `key` in `slot`.
export function valuesUnlocking(
  definitions: Record<string, any>,
  gate: string,
  key: string,
  slot: "self" | "children",
): string[] {
  const gateDefinition = definitions[gate];
  if (!isGateDefinition(gateDefinition)) return [];
  const values: string[] = [];
  for (const valueKey of Object.keys(gateDefinition)) {
    const bag = gateDefinition[valueKey]?.[slot];
    if (isGateDefinition(bag) && key in bag) {
      values.push(valueKey);
    }
  }
  return values;
}

// One clause per gate that can unlock `key`, matching the type-level
// `UnlockedBy`: `display: flex | inline-flex` (self) or
// `display: flex | inline-flex on the parent` (children).
export function unlockedByClauses(
  definitions: Record<string, any>,
  key: string,
): string[] {
  const clauses: string[] = [];
  for (const gate of gateNames(definitions)) {
    const selfValues = valuesUnlocking(definitions, gate, key, "self");
    if (selfValues.length > 0) {
      clauses.push(`${gate}: ${selfValues.join(" | ")}`);
    }
    const childrenValues = valuesUnlocking(definitions, gate, key, "children");
    if (childrenValues.length > 0) {
      clauses.push(`${gate}: ${childrenValues.join(" | ")} on the parent`);
    }
  }
  return clauses;
}

// `'gap' requires display: flex | grid | inline-flex | inline-grid`, or `null`
// when no gate can unlock `key` (i.e. it is truly unknown).
export function lockedMessageFor(
  definitions: Record<string, any>,
  key: string,
): string | null {
  const clauses = unlockedByClauses(definitions, key);
  return clauses.length > 0
    ? `'${key}' requires ${clauses.join(", or ")}`
    : null;
}

// The DSL for `key` under the resolved gate values in `gates` for `slot`, if a
// written gate value unlocks it.
export function slotDSL(
  definitions: Record<string, any>,
  gates: Record<string, string>,
  key: string,
  slot: "self" | "children",
): string | undefined {
  for (const gate of Object.keys(gates)) {
    const matchedValue = gates[gate];
    if (matchedValue === undefined) continue;
    const bag = definitions[gate]?.[matchedValue]?.[slot];
    if (isGateDefinition(bag) && key in bag) {
      return bag[key];
    }
  }
  return undefined;
}
