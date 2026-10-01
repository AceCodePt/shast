import type { BaseComponentStructure } from "@/engine/types.ts";
import type {
  BaseKeyframesConfig,
  KeyframeName,
} from "@/css/keyframes-config/types.ts";
import type { JoinUnion } from "@/types.ts";
import type { CSSWideKeyword } from "@/css/wide-keyword.ts";
import { isCSSWideKeyword } from "@/css/wide-keyword.ts";

/**
 * The two animation longhands that name a keyframe.
 *
 * `animation-name` is a single name; `animation` is the shorthand, a
 * whitespace-separated list of longhand values (`,` separates animations). Both
 * must reference a keyframe registered in `cssKeyframesConfig`. The two walls
 * below are deliberately kept in one file so they cannot drift.
 *
 * The shorthand is scanned for a token naming a registered keyframe rather than
 * parsed exhaustively: a real parse would have to know every longhand's grammar,
 * which embeds spaces and commas (`cubic-bezier(0.1, 0.2, 0.3, 0.4)`) that a
 * token scan cannot round-trip.
 */

export const ANIMATION_NAME_PROPERTY = "animation-name";
export const ANIMATION_SHORTHAND_PROPERTY = "animation";

export type KeyframeNames<C extends BaseKeyframesConfig> = KeyframeName<C>;

// ---------------------------------------------------------------------------
// Type wall.
//
// `animation-name` narrows to the registered names (`none` and CSS-wide
// keywords stay legal). The shorthand cannot be expressed as a union of valid
// strings, so it validates the author's own value, exactly as the *Config
// builders validate their inputs: valid passes through unchanged, invalid
// resolves to a diagnostic literal. A widened `string` is not analyzable and
// defers to the base `<string>` DSL (fail open, as with widened class strings).
// ---------------------------------------------------------------------------

/** Whitespace-separated tokens of a shorthand value, as a union. */
export type AnimationTokens<S extends string> =
  S extends `${infer Head} ${infer Tail}`
    ? Head | AnimationTokens<Tail>
    : S;

/** A shorthand separates animations with `,`, which sticks to the token. */
type StripComma<S extends string> = S extends `${infer Head},` ? Head : S;

type IsNameToken<T extends string, Names extends string> = StripComma<T> extends
  | Names
  | "none"
  ? true
  : false;

/** True when any token of the shorthand names a registered keyframe or `none`. */
export type AnyNameToken<Tokens extends string, Names extends string> =
  true extends { [T in Tokens]: IsNameToken<T, Names> }[Tokens] ? true : false;

/**
 * Passes a valid shorthand through; resolves an invalid one to its diagnostic.
 */
export type AnimationShorthandValue<V, Names extends string> = string extends V
  ? V
  : V extends string
    ? V extends CSSWideKeyword
      ? V
      : true extends AnyNameToken<AnimationTokens<V>, Names>
        ? V
        : `Invalid animation shorthand '${V}': must reference a registered keyframe (${JoinUnion<Names>})`
    : V;

// ---------------------------------------------------------------------------
// Runtime wall.
// ---------------------------------------------------------------------------

/**
 * Whether `value` references a registered keyframe. An empty keyframes registry
 * imposes no constraint. A non-string value is left to the DSL parse.
 */
export function referencesRegisteredKeyframe(
  property: string,
  value: unknown,
  keyframes: BaseKeyframesConfig,
): boolean {
  if (typeof value !== "string") return true;
  if (isCSSWideKeyword(value)) return true;
  const names = Object.keys(keyframes);
  if (names.length === 0) return true;

  if (property === ANIMATION_NAME_PROPERTY) {
    return value === "none" || names.includes(value);
  }
  if (property === ANIMATION_SHORTHAND_PROPERTY) {
    // Mirror the type wall's token scan: any whitespace/comma-delimited token
    // that names a registered keyframe (or `none`) satisfies the shorthand.
    return value
      .split(/[\s,]+/u)
      .filter((token) => token !== "")
      .some((token) => token === "none" || names.includes(token));
  }
  return true;
}

export function animationReferenceError(
  property: string,
  value: unknown,
  keyframes: BaseKeyframesConfig,
): string {
  return `CSS Error: '${property}' value '${String(value)}' does not reference a registered keyframe. Registered keyframes are: ${Object.keys(keyframes).join(", ")}`;
}

// ---------------------------------------------------------------------------
// Rendering.
// ---------------------------------------------------------------------------

function collectFromBlock(
  block: Record<string, unknown>,
  names: readonly string[],
  add: (name: string) => void,
): void {
  for (const [key, value] of Object.entries(block)) {
    if (
      key === ANIMATION_NAME_PROPERTY &&
      typeof value === "string" &&
      value !== "none" &&
      names.includes(value)
    ) {
      add(value);
      continue;
    }
    if (
      key === ANIMATION_SHORTHAND_PROPERTY &&
      typeof value === "string" &&
      !isCSSWideKeyword(value)
    ) {
      for (const token of value.split(/[\s,]+/u)) {
        if (token !== "" && token !== "none" && names.includes(token)) {
          add(token);
        }
      }
      continue;
    }
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      collectFromBlock(value as Record<string, unknown>, names, add);
    }
  }
}

/**
 * Every registered keyframe referenced by `node`'s `css` tree, first-seen order,
 * deduped. Declarations can sit at any nesting depth, but a keyframe name is
 * global, so its rule is emitted once per render regardless of how many nodes
 * use it.
 */
export function referencedKeyframes(
  node: BaseComponentStructure,
  keyframes: BaseKeyframesConfig,
): string[] {
  const names = Object.keys(keyframes);
  if (names.length === 0) return [];
  const referenced: string[] = [];
  const seen = new Set<string>();
  const add = (name: string): void => {
    if (seen.has(name)) return;
    seen.add(name);
    referenced.push(name);
  };

  const visit = (current: BaseComponentStructure): void => {
    const css = current.css;
    if (css !== null && typeof css === "object") {
      collectFromBlock(css as Record<string, unknown>, names, add);
    }
    const innerHTML =
      "innerHTML" in current && current["innerHTML"]
        ? current["innerHTML"]
        : undefined;
    if (
      innerHTML !== null &&
      typeof innerHTML === "object" &&
      !Array.isArray(innerHTML)
    ) {
      for (const child of Object.values(innerHTML as Record<string, unknown>)) {
        const list = Array.isArray(child) ? child : [child];
        for (const entry of list) {
          if (entry !== null && typeof entry === "object") {
            visit(entry as BaseComponentStructure);
          }
        }
      }
    }
  };
  visit(node);
  return referenced;
}

/** Prints one registered keyframe as a global `@keyframes` at-rule. */
export function printKeyframesRule(
  name: string,
  frames: Record<string, Record<string, unknown>>,
): string {
  const lines = [`@keyframes ${name} {`];
  for (const [selector, properties] of Object.entries(frames)) {
    lines.push(`  ${selector} {`);
    for (const [property, value] of Object.entries(properties)) {
      lines.push(`    ${property}: ${String(value)};`);
    }
    lines.push(`  }`);
  }
  lines.push(`}`);
  return lines.join("\n");
}

/**
 * The global `@keyframes` rules for every keyframe `node` references, in
 * reference order and printed once each. Names are global, so these rules are
 * not `data-cid-`-scoped; they sit alongside the component's scoped css.
 */
export function renderReferencedKeyframes(
  node: BaseComponentStructure,
  keyframes: BaseKeyframesConfig,
): string {
  return referencedKeyframes(node, keyframes)
    .map((name) => printKeyframesRule(name, keyframes[name]!))
    .join("\n\n");
}
