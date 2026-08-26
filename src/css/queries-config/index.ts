import { parseValueAgainstDSL, SUPPORTED_KEYWORDS } from "@/dsl/index.ts";
import FULL_SYNTAX_CONFIG from "@/css/syntax-config/variations/full.ts";
import type { ValidateQueries } from "./types.ts";

const MEDIA_TYPES = new Set(["all", "screen", "print"]);

const MEDIA_LENGTH_FEATURES = new Set([
  "width",
  "min-width",
  "max-width",
  "height",
  "min-height",
  "max-height",
]);

const MEDIA_RESOLUTION_FEATURES = new Set([
  "resolution",
  "min-resolution",
  "max-resolution",
]);

const MEDIA_RATIO_FEATURES = new Set([
  "device-pixel-ratio",
  "min-device-pixel-ratio",
  "max-device-pixel-ratio",
]);

const CONTAINER_LENGTH_FEATURES = new Set([
  "width",
  "min-width",
  "max-width",
  "height",
  "min-height",
  "max-height",
]);

const OPERATORS = new Set(["<", "<=", ">", ">="]);

function fail(query: string, message: string): never {
  throw new Error(`${message} in query: "${query}"`);
}

function matchesDSL(dsl: string, value: string): boolean {
  try {
    parseValueAgainstDSL(SUPPORTED_KEYWORDS, dsl as never, value as never);
    return true;
  } catch {
    return false;
  }
}

function isLength(value: string): boolean {
  return matchesDSL(FULL_SYNTAX_CONFIG["<length>"], value);
}

function isResolution(value: string): boolean {
  return matchesDSL(FULL_SYNTAX_CONFIG["<resolution>"], value);
}

function isNumber(value: string): boolean {
  return matchesDSL(FULL_SYNTAX_CONFIG["<number>"], value);
}

function isMediaFeatureValue(feature: string, value: string): boolean {
  if (MEDIA_LENGTH_FEATURES.has(feature)) return isLength(value);
  if (MEDIA_RESOLUTION_FEATURES.has(feature)) return isResolution(value);
  if (MEDIA_RATIO_FEATURES.has(feature)) return isNumber(value);
  if (feature === "orientation") return value === "portrait" || value === "landscape";
  if (feature === "prefers-color-scheme") return value === "light" || value === "dark";
  if (feature === "prefers-reduced-motion") {
    return value === "reduce" || value === "no-preference";
  }
  return false;
}

function isContainerFeatureValue(feature: string, value: string): boolean {
  return CONTAINER_LENGTH_FEATURES.has(feature) && isLength(value);
}

function validateOperatorForm(
  inner: string,
  isFeatureValue: (feature: string, value: string) => boolean,
  query: string,
): void {
  const tokens = inner.split(/\s+/).filter((t) => t !== "");
  if (tokens.length === 3) {
    const [a, op, b] = tokens;
    if (op === undefined || !OPERATORS.has(op)) {
      fail(query, `Invalid comparison operator "${op ?? ""}"`);
    }
    if (isFeatureValue(a!, b!)) return;
    if (isFeatureValue(b!, a!)) return;
    fail(query, `Invalid comparison "${inner}"`);
  }
  if (tokens.length === 5) {
    const [v1, op1, feature, op2, v2] = tokens;
    if (
      op1 === undefined ||
      op2 === undefined ||
      !OPERATORS.has(op1) ||
      !OPERATORS.has(op2)
    ) {
      fail(query, `Invalid comparison operator in "${inner}"`);
    }
    if (!isFeatureValue(feature!, v1!) || !isFeatureValue(feature!, v2!)) {
      fail(query, `Invalid range comparison "${inner}"`);
    }
    return;
  }
  fail(query, `Invalid comparison "${inner}"`);
}

function validateMediaFeature(inner: string, query: string): void {
  inner = inner.trim();
  const colon = inner.indexOf(":");
  if (colon !== -1) {
    const feature = inner.slice(0, colon).trim();
    const value = inner.slice(colon + 1).trim();
    if (!isMediaFeatureValue(feature, value)) {
      fail(query, `Unknown or invalid media feature "${inner}"`);
    }
    return;
  }
  validateOperatorForm(inner, isMediaFeatureValue, query);
}

function validateStyleQuery(inner: string, query: string): void {
  const content = inner.slice("style(".length, -1);
  const colon = content.indexOf(":");
  if (colon === -1) {
    fail(query, `Style query must be "style(--<property>: <value>)"`);
  }
  const property = content.slice(0, colon).trim();
  const value = content.slice(colon + 1).trim();
  if (!property.startsWith("--") || value === "") {
    fail(query, `Style query must be "style(--<property>: <value>)"`);
  }
}

function validateContainerFeature(inner: string, query: string): void {
  inner = inner.trim();
  if (inner.startsWith("style(")) {
    if (!inner.endsWith(")")) {
      fail(query, `Unclosed parenthesis in style query "${inner}"`);
    }
    validateStyleQuery(inner, query);
    return;
  }
  const colon = inner.indexOf(":");
  if (colon !== -1) {
    const feature = inner.slice(0, colon).trim();
    const value = inner.slice(colon + 1).trim();
    if (!isContainerFeatureValue(feature, value)) {
      fail(query, `Unknown or invalid container feature "${inner}"`);
    }
    return;
  }
  validateOperatorForm(inner, isContainerFeatureValue, query);
}

function validateContainerName(name: string, query: string): void {
  if (
    name === "" ||
    /[()]/.test(name) ||
    /^\d/.test(name) ||
    !/^[-_a-zA-Z][-_a-zA-Z0-9]*$/.test(name)
  ) {
    fail(query, `Invalid container name "${name}"`);
  }
}

function splitAnd(s: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  let i = 0;
  while (i < s.length) {
    const c = s[i]!;
    if (c === "(") depth++;
    else if (c === ")") depth--;
    if (depth === 0 && s.startsWith(" and ", i)) {
      parts.push(current.trim());
      current = "";
      i += 5;
      continue;
    }
    current += c;
    i++;
  }
  parts.push(current.trim());
  return parts;
}

function validateFeatureList(
  conditions: string,
  kind: "media" | "container",
  query: string,
): void {
  const list = splitAnd(conditions);
  if (list.length === 0 || (list.length === 1 && list[0] === "")) {
    fail(query, "Empty condition list");
  }
  for (const condition of list) {
    const isStyleQuery =
      kind === "container" && condition.startsWith("style(");
    if (!condition.startsWith("(") && !isStyleQuery) {
      fail(query, `Invalid condition "${condition}"`);
    }
    if (!condition.endsWith(")")) {
      fail(query, `Unclosed parenthesis in condition "${condition}"`);
    }
    if (isStyleQuery) {
      validateContainerFeature(condition, query);
      continue;
    }
    const inner = condition.slice(1, -1);
    if (kind === "media") validateMediaFeature(inner, query);
    else validateContainerFeature(inner, query);
  }
}

function validateMediaTypeAnd(rest: string, query: string): void {
  const match = /^(all|screen|print) and (.+)$/.exec(rest);
  if (match === null) {
    fail(query, `Expected media type and conditions after "and"`);
  }
  const features = match[2]!.trim();
  if (features === "") {
    fail(query, "Missing conditions after media type");
  }
  validateFeatureList(features, "media", query);
}

function validateMediaQuery(queryPart: string, query: string): void {
  const q = queryPart.trim();
  if (q === "") {
    fail(query, "Empty media query");
  }
  if (q.startsWith("not ")) {
    const rest = q.slice(4).trim();
    if (rest === "") {
      fail(query, "Missing condition after 'not'");
    }
    if (rest.startsWith("(")) {
      validateFeatureList(rest, "media", query);
      return;
    }
    const type = /^(all|screen|print)(?: |$)/.exec(rest)?.[1];
    if (type !== undefined) {
      const after = rest.slice(type.length).trim();
      if (after === "") return;
      if (after.startsWith("and ")) {
        validateMediaTypeAnd(rest, query);
        return;
      }
      fail(query, `Invalid text after media type "${after}"`);
    }
    validateFeatureList(rest, "media", query);
    return;
  }
  if (q.startsWith("only ")) {
    const rest = q.slice(5).trim();
    if (rest === "") {
      fail(query, "Missing media type after 'only'");
    }
    const type = /^(all|screen|print)(?: |$)/.exec(rest)?.[1];
    if (type === undefined) {
      fail(query, "Expected media type after 'only'");
    }
    const after = rest.slice(type!.length).trim();
    if (after === "") {
      fail(query, "Expected 'and' after 'only <media type>'");
    }
    if (after.startsWith("and ")) {
      validateMediaTypeAnd(rest, query);
      return;
    }
    fail(query, `Expected 'and' after 'only ${type}'`);
  }
  const firstToken = /^[^\s]+/.exec(q)?.[0];
  if (firstToken !== undefined && MEDIA_TYPES.has(firstToken)) {
    if (q === firstToken) return;
    validateMediaTypeAnd(q, query);
    return;
  }
  validateFeatureList(q, "media", query);
}

function validateMediaQueryList(listPart: string, query: string): void {
  const list = listPart
    .split(",")
    .map((q) => q.trim())
    .filter((q) => q !== "");
  if (list.length === 0) {
    fail(query, "Empty media query list");
  }
  for (const item of list) {
    validateMediaQuery(item, query);
  }
}

function findTopLevelSpace(s: string): number {
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i]!;
    if (c === "(") depth++;
    else if (c === ")") depth--;
    else if (c === " " && depth === 0) return i;
  }
  return -1;
}

function validateContainerQuery(queryPart: string, query: string): void {
  const q = queryPart.trim();
  if (q === "") {
    fail(query, "Empty container query");
  }
  if (q.startsWith("(") || q.startsWith("style(")) {
    validateFeatureList(q, "container", query);
    return;
  }
  const space = findTopLevelSpace(q);
  if (space === -1) {
    validateContainerName(q, query);
    return;
  }
  const name = q.slice(0, space).trim();
  const rest = q.slice(space + 1).trim();
  validateContainerName(name, query);
  if (rest === "") {
    fail(query, "Missing conditions after container name");
  }
  validateFeatureList(rest, "container", query);
}

function validateQueryString(query: string): void {
  if (query.startsWith("@media ")) {
    const rest = query.slice("@media ".length);
    validateMediaQueryList(rest, query);
    return;
  }
  if (query.startsWith("@container ")) {
    const rest = query.slice("@container ".length);
    validateContainerQuery(rest, query);
    return;
  }
  fail(query, 'Query must start with "@media" or "@container"');
}

export function cssQueriesConfig<const T extends readonly string[]>(
  queries: ValidateQueries<T>,
): T {
  for (const query of queries) {
    validateQueryString(query);
  }
  return queries as T;
}