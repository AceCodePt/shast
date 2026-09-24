import { isOutOfFlow } from "./style.ts";
import { walk } from "./measured.ts";
import { paintOrder } from "./paint-order.ts";
import type { Box } from "./types.ts";

/**
 * The primary API. Measurement exists so these can be asserted; the resolved
 * document reports them to a reader.
 */

const EPSILON = 0.01;

function contentBox(box: Box): { width: number; height: number } {
  const padding = box.style.padding;
  const borderWidth = box.style["border-width"];
  return {
    width: Math.max(
      0,
      box.width -
        borderWidth.left -
        borderWidth.right -
        padding.left -
        padding.right,
    ),
    height: Math.max(
      0,
      box.height -
        borderWidth.top -
        borderWidth.bottom -
        padding.top -
        padding.bottom,
    ),
  };
}

/** Content exceeds the content box in either axis. */
export function overflows(box: Box): boolean {
  const content = contentBox(box);
  return (
    box.contentWidth > content.width + EPSILON ||
    box.contentHeight > content.height + EPSILON
  );
}

/** Collapsed to zero in either axis while still carrying content. */
export function zeroSize(box: Box): boolean {
  if (box.style.display === "none") return false;
  return box.width <= EPSILON || box.height <= EPSILON;
}

/**
 * Which viewport edge a box escapes past in a way scrolling cannot recover.
 *
 * This is the single classification behind both findings channels — `audit()`
 * here and `analyse()` in `resolved.ts`. It lives in one place because the two
 * had already drifted apart once: the document split `below-fold` out of
 * `offscreen` and this file did not follow, so the same tree produced two
 * different verdicts depending on which entry point you asked. A describer that
 * contradicts itself is the exact defect this package exists to catch.
 *
 * The bottom edge is deliberately absent. A page scrolls down, so a box below
 * the fold is reachable; that is `belowFold`, not a defect. The other three
 * edges are unreachable: content above the top or left of the left origin
 * cannot be scrolled to, and pages do not scroll horizontally.
 */
export type OffscreenReason = {
  edge: "top" | "left" | "right";
  /** How far past the edge, in CSS px. */
  px: number;
};

export function offscreenReasons(
  box: Box,
  viewport: { width: number; height: number },
): OffscreenReason[] {
  const reasons: OffscreenReason[] = [];
  if (box.y < -EPSILON) reasons.push({ edge: "top", px: -box.y });
  if (box.x < -EPSILON) reasons.push({ edge: "left", px: -box.x });
  if (box.x + box.width > viewport.width + EPSILON) {
    reasons.push({ edge: "right", px: box.x + box.width - viewport.width });
  }
  return reasons;
}

/**
 * The box starts at or past the bottom edge, so nothing of it is in the first
 * screenful. Reachable by scrolling, and therefore reported apart from
 * `offscreen`: on a long page the old combined predicate fired on almost every
 * node and said nothing.
 */
export function belowFold(
  box: Box,
  viewport: { width: number; height: number },
): boolean {
  return box.y >= viewport.height - EPSILON;
}

/** The box escapes the viewport somewhere scrolling cannot reach. */
export function offscreen(
  box: Box,
  viewport: { width: number; height: number },
): boolean {
  return offscreenReasons(box, viewport).length > 0;
}

/** Text is wider than the content box that owns it. */
export function truncated(box: Box): boolean {
  const content = contentBox(box);
  return box.runs.some(
    (run) => run.width > content.width + EPSILON,
  );
}

/** Geometric intersection of two border boxes. */
export function overlaps(a: Box, b: Box): boolean {
  return (
    a.x < b.x + b.width - EPSILON &&
    b.x < a.x + a.width - EPSILON &&
    a.y < b.y + b.height - EPSILON &&
    b.y < a.y + a.height - EPSILON
  );
}

/**
 * True when `b` overlaps `a` *and* paints after it, so `b` visually hides part
 * of `a`.
 *
 * This is the question a screenshot answers badly and the reason positioned
 * layout was worth building: "is this fixed header covering the first row"
 * stops being something to squint at.
 */
export function coveredBy(a: Box, b: Box, order: Box[]): boolean {
  if (a === b || !overlaps(a, b)) return false;
  const ia = order.indexOf(a);
  const ib = order.indexOf(b);
  return ia !== -1 && ib !== -1 && ib > ia;
}

/** Every box that paints over `target`, in paint order. */
export function coveringBoxes(target: Box, root: Box): Box[] {
  const order = paintOrder(root);
  const index = order.indexOf(target);
  if (index === -1) return [];
  return order
    .slice(index + 1)
    .filter((box) => box.style.display !== "none" && overlaps(target, box));
}

export type Finding = {
  path: string;
  tag: string;
  predicate:
    | "overflows"
    | "zeroSize"
    | "offscreen"
    | "below-fold"
    | "truncated"
    | "coveredBy";
  detail: string;
};

/** Runs every predicate over the tree and reports what fired. */
export function audit(
  root: Box,
  viewport: { width: number; height: number },
): Finding[] {
  const findings: Finding[] = [];
  const order = paintOrder(root);

  for (const box of walk(root)) {
    if (box.style.display === "none") continue;
    const content = contentBox(box);
    if (overflows(box)) {
      findings.push({
        path: box.path,
        tag: box.tag,
        predicate: "overflows",
        detail:
          `content ${box.contentWidth.toFixed(1)}x${box.contentHeight.toFixed(1)}px ` +
          `exceeds content box ${content.width.toFixed(1)}x${content.height.toFixed(1)}px`,
      });
    }
    if (zeroSize(box)) {
      findings.push({
        path: box.path,
        tag: box.tag,
        predicate: "zeroSize",
        detail: `${box.width.toFixed(1)}x${box.height.toFixed(1)}px`,
      });
    }
    const escapes = offscreenReasons(box, viewport);
    if (escapes.length > 0) {
      findings.push({
        path: box.path,
        tag: box.tag,
        predicate: "offscreen",
        detail:
          `${escapes.map((r) => `${r.px.toFixed(1)}px past the ${r.edge} edge`).join(", ")}; ` +
          `viewport is ${viewport.width}x${viewport.height}px`,
      });
    }
    if (belowFold(box, viewport)) {
      findings.push({
        path: box.path,
        tag: box.tag,
        predicate: "below-fold",
        detail: `starts at y=${box.y.toFixed(1)}px, below the ${viewport.height}px fold`,
      });
    }
    if (truncated(box)) {
      findings.push({
        path: box.path,
        tag: box.tag,
        predicate: "truncated",
        detail: `text wider than ${content.width.toFixed(1)}px content box`,
      });
    }

    // A box is only a "coverer" if it was *displaced* onto something: taken
    // out of flow, or relatively offset off its normal slot. A plain in-flow
    // box painting inside its parent's padding is nesting, not a defect - and
    // an ancestor/descendant pair always overlaps by construction.
    const coverers = order
      .slice(order.indexOf(box) + 1)
      .filter(
        (other) =>
          other.style.display !== "none" &&
          isDisplaced(other) &&
          !isAncestorOf(box, other) &&
          !isAncestorOf(other, box) &&
          overlaps(box, other),
      );
    for (const coverer of coverers) {
      findings.push({
        path: box.path,
        tag: box.tag,
        predicate: "coveredBy",
        detail:
          `${coverer.path} <${coverer.tag}> (position: ${coverer.style.position}` +
          `${coverer.style["z-index"] === null ? "" : `, z-index: ${coverer.style["z-index"]}`})` +
          " paints over it",
      });
    }
  }
  return findings;
}

function isAncestorOf(ancestor: Box, box: Box): boolean {
  return ancestor !== box && walk(ancestor).includes(box);
}

/** Out of flow, or relatively offset off its normal-flow slot. */
function isDisplaced(box: Box): boolean {
  if (isOutOfFlow(box.style)) return true;
  if (box.style.position !== "relative") return false;
  return (
    (box.style.top ?? 0) !== 0 ||
    (box.style.left ?? 0) !== 0 ||
    (box.style.right ?? 0) !== 0 ||
    (box.style.bottom ?? 0) !== 0
  );
}
