import type { ComputedStyle } from "./types.ts";

/**
 * Pure style predicates, shared by the paint-order, occlusion and predicate
 * channels.
 *
 * These used to live inside the layout engine, which owned the only
 * `ComputedStyle` that existed. Geometry now comes from Chromium, so the style
 * object is the browser's computed style and these are the only places the
 * format's paint semantics are encoded.
 */

export function isOutOfFlow(style: ComputedStyle): boolean {
  return style.position === "absolute" || style.position === "fixed";
}

export function isPositioned(style: ComputedStyle): boolean {
  return style.position !== "static";
}

/**
 * A box establishes a stacking context when it is positioned and has a
 * non-auto `z-index`.
 *
 * The registry already encodes which declarations create one: `z-index` is
 * unlocked at exactly the sites in `src/css/attribute-config` that do
 * (`position` != static, `opacity`, `transform`, filters, `isolation`). Of
 * those, only `position` is modelled here, so the check reduces to this.
 */
export function createsStackingContext(style: ComputedStyle): boolean {
  return isPositioned(style) && style["z-index"] !== null;
}

export function applyTextTransform(
  text: string,
  transform: ComputedStyle["text-transform"],
): string {
  switch (transform) {
    case "uppercase":
      return text.toUpperCase();
    case "lowercase":
      return text.toLowerCase();
    case "capitalize":
      return text.replace(/(^|\s)(\S)/gu, (_, sep: string, ch: string) => {
        return sep + ch.toUpperCase();
      });
    default:
      return text;
  }
}

/**
 * `transparent` in its serialised form.
 *
 * `getComputedStyle().backgroundColor` is `rgba(0, 0, 0, 0)` for any
 * transparent background, and occlusion is decided by whether a coverer paints
 * a background at all — so the two spellings of "no background" both resolve
 * to `null`.
 */
export function normaliseBackground(value: string | null): string | null {
  if (value === null) return null;
  const flat = value.trim().toLowerCase();
  if (flat === "transparent" || flat === "rgba(0, 0, 0, 0)") return null;
  return value;
}
