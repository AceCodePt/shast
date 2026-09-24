export { resolveCascade } from "./cascade.ts";
export type {
  Cascade,
  Contribution,
  ResolvedNode,
  ResolvedProperty,
  ResolvedStyle,
} from "./cascade.ts";
export { resolveDocument } from "./resolved.ts";
export type {
  Flag,
  NodeRecord,
  ResolvedDocument,
  ResolveOptions,
} from "./resolved.ts";
export { printResolved } from "./print-resolved.ts";
export type { PrintOptions } from "./print-resolved.ts";
export { occlusionOf, intersect, unionCoveredArea, runRect } from "./occlusion.ts";
export type { Occluder, Occlusion, LineCoverage } from "./occlusion.ts";
export {
  measureBoxes,
  measureBoxesOnPage,
  materializeBoxes,
  walk,
} from "./measured.ts";
export type { MeasuredBox } from "./measured.ts";
export { withBrowser, measureHover, measureTextVisibility } from "./conformance.ts";
export type {
  HoverProbe,
  HoverResult,
  VisibilityResult,
} from "./conformance.ts";
export { htmlDocument, RESET_CSS } from "./html-document.ts";
export { walkTree, flowItems, ROOT_PATH } from "./tree.ts";
export {
  audit,
  overflows,
  zeroSize,
  offscreen,
  offscreenReasons,
  belowFold,
  truncated,
} from "./predicates.ts";
export type { Finding, OffscreenReason } from "./predicates.ts";
export { paintOrder } from "./paint-order.ts";
export {
  createsStackingContext,
  isOutOfFlow,
  isPositioned,
  applyTextTransform,
} from "./style.ts";
export * from "./types.ts";
