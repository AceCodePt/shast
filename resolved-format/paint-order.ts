import { createsStackingContext, isPositioned } from "./style.ts";
import type { Box } from "./types.ts";

/**
 * Orders boxes back-to-front, following CSS 2.1 Appendix E for the subset the
 * format reasons about (no floats, no inline-level content, no
 * opacity/transform).
 *
 * Within a stacking context:
 *   1. the element establishing the context
 *   2. descendant stacking contexts with negative z-index, most negative first
 *   3. in-flow, non-positioned descendants
 *   4. positioned descendants with `z-index: auto` or `0`, in tree order
 *   5. descendant stacking contexts with positive z-index, ascending
 *
 * A flat sort by z-index would be wrong: z-index is scoped to the parent
 * stacking context, so a child with `z-index: 999` inside a context with
 * `z-index: 1` still paints below a sibling context with `z-index: 2`.
 */
export function paintOrder(root: Box): Box[] {
  const out: Box[] = [];
  paintStackingContext(root, out);
  return out;
}

function paintStackingContext(root: Box, out: Box[]): void {
  out.push(root);

  const negative: Box[] = [];
  const inFlow: Box[] = [];
  const positionedAuto: Box[] = [];
  const positive: Box[] = [];

  collect(root, { negative, inFlow, positionedAuto, positive });

  const byZ = (a: Box, b: Box): number =>
    (a.style["z-index"] ?? 0) - (b.style["z-index"] ?? 0);

  for (const box of [...negative].sort(byZ)) paintStackingContext(box, out);
  for (const box of inFlow) out.push(box);
  for (const box of positionedAuto) paintSubtree(box, out);
  for (const box of [...positive].sort(byZ)) paintStackingContext(box, out);
}

type Buckets = {
  negative: Box[];
  inFlow: Box[];
  positionedAuto: Box[];
  positive: Box[];
};

/** Walks descendants, stopping at any box that starts its own context. */
function collect(box: Box, buckets: Buckets): void {
  for (const child of box.children) {
    if (child.style.display === "none") continue;

    if (createsStackingContext(child.style)) {
      const z = child.style["z-index"] ?? 0;
      if (z < 0) buckets.negative.push(child);
      else buckets.positive.push(child);
      continue; // its descendants belong to its own context
    }

    if (isPositioned(child.style)) {
      buckets.positionedAuto.push(child);
      continue; // painted as a unit, with its subtree
    }

    buckets.inFlow.push(child);
    collect(child, buckets);
  }
}

/**
 * A positioned box with `z-index: auto` does not start a stacking context, but
 * it and its in-flow descendants are still painted together as a unit at
 * step 4.
 */
function paintSubtree(box: Box, out: Box[]): void {
  out.push(box);
  const buckets: Buckets = {
    negative: [],
    inFlow: [],
    positionedAuto: [],
    positive: [],
  };
  collect(box, buckets);

  const byZ = (a: Box, b: Box): number =>
    (a.style["z-index"] ?? 0) - (b.style["z-index"] ?? 0);

  for (const child of [...buckets.negative].sort(byZ))
    paintStackingContext(child, out);
  for (const child of buckets.inFlow) out.push(child);
  for (const child of buckets.positionedAuto) paintSubtree(child, out);
  for (const child of [...buckets.positive].sort(byZ))
    paintStackingContext(child, out);
}
