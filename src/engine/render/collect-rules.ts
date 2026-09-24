import type { BaseComponentStructure } from "@/engine/types.ts";

/**
 * The structured form of what `renderComponent` emits as CSS text.
 *
 * `render-component.ts` prints its stylesheet from these rules and nothing
 * else, so any consumer that needs to know *which declaration wins on which
 * node* — the resolver in `resolved-format/cascade.ts` — reads the same objects
 * the emitter printed from. A resolver that walked `css` blocks on its own
 * would be a second implementation of selector emission, free to drift, and a
 * resolver that disagrees with the emitter describes a page that does not
 * exist.
 */

const PREFIX = "cid-";

/** `[id, class/attribute/pseudo-class, type/pseudo-element]`, as in CSS. */
export type Specificity = readonly [number, number, number];

export type StateKind = "pseudo-class" | "pseudo-element" | "class";

/**
 * One step of an emitted selector. A rule's selector is its segments joined;
 * the segment list is also what tells the resolver how far above a target the
 * declaring node sits (`child` segments) and whether the rule applies in a
 * state rather than at rest (`state` segments).
 */
export type SelectorSegment =
  /** `[cid-<hash-of-css>]` — the declaring node's own scope. Always first. */
  | { readonly kind: "scope"; readonly attribute: string }
  /** `& > [cid-<name>]` from a `"> name"` key. */
  | { readonly kind: "child"; readonly name: string }
  /** `&:hover`, `&::before`, `&.active`. */
  | { readonly kind: "state"; readonly key: string; readonly state: StateKind };

/**
 * One way a rule's selector resolves through the tree.
 *
 * A rule can match more than once — a `"> name"` key addresses every entry of
 * an array child, since they all carry the same `cid-<name>`. `chain` records
 * the node each `child` step landed on, starting at the origin, which is what
 * lets a caller ask "does the element the `.active` in this selector sits on
 * actually have that class" rather than guessing.
 */
export type Match = {
  readonly chain: readonly BaseComponentStructure[];
  readonly target: BaseComponentStructure;
};

export type EmittedRule = {
  /** The node whose `css` block contains these declarations. */
  readonly origin: BaseComponentStructure;
  readonly segments: readonly SelectorSegment[];
  /** The selector a browser sees, with nesting flattened. */
  readonly selector: string;
  readonly specificity: Specificity;
  readonly matches: readonly Match[];
  /** Property/value pairs in source order, exactly as printed. */
  readonly declarations: readonly (readonly [string, string])[];
  /**
   * Position in the emitted stylesheet, as `[block, indexWithinBlock]`.
   * Compared lexicographically to break specificity ties, which is what
   * "later in source order wins" means once nesting is flattened.
   */
  readonly order: readonly [number, number];
};

export type CollectedRules = {
  readonly rules: readonly EmittedRule[];
  /**
   * Children reached through a `"> name"` key anywhere in the tree. Only these
   * need a semantic `cid-<name>` attribute in the HTML.
   */
  readonly targeted: ReadonlySet<BaseComponentStructure>;
  /** Deduped top-level blocks, in emission order, ready to print. */
  readonly blocks: readonly Frame[];
};

/** A rule and its nested rules, before pruning and printing. */
export type Frame = {
  selector: string;
  segments: SelectorSegment[];
  matches: Match[];
  origin: BaseComponentStructure;
  declarations: [string, string][];
  children: Frame[];
};

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value) ?? "null";
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

function hashNode(node: unknown): string {
  const input = stableStringify(node);
  // FNV-1a (32-bit)
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

/**
 * The scope attribute for a node.
 *
 * The scope is a property of the component's *style contract* — its `css`
 * block — not of instance data (attribute values, text, child data). The
 * rendered rules are a pure function of `css` (child selectors emit
 * `[cid-<name>]` by name, not by child hash), so two components with an
 * identical `css` block produce identical rules and must share one scope.
 */
export function scopeAttribute(node: BaseComponentStructure): string {
  return `${PREFIX}${hashNode(node.css)}`;
}

export function semanticAttribute(name: string): string {
  return `${PREFIX}${name}`;
}

export function hasCSS(node: BaseComponentStructure): boolean {
  return node.css !== undefined && node.css !== null;
}

function isRecordInnerHTML(
  innerHTML: unknown,
): innerHTML is Record<string, unknown> {
  return (
    innerHTML !== null &&
    typeof innerHTML === "object" &&
    !Array.isArray(innerHTML)
  );
}

function isComponent(value: unknown): value is BaseComponentStructure {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Component children of `node` under the `innerHTML` key `name`, in order. */
export function childrenNamed(
  node: BaseComponentStructure,
  name: string,
): BaseComponentStructure[] {
  const innerHTML =
    "innerHTML" in node && node["innerHTML"] ? node["innerHTML"] : undefined;
  if (!isRecordInnerHTML(innerHTML)) return [];
  const child = innerHTML[name];
  if (Array.isArray(child)) return child.filter(isComponent);
  return isComponent(child) ? [child] : [];
}

function stateKind(key: string): StateKind {
  if (key.startsWith("::")) return "pseudo-element";
  if (key.startsWith(":")) return "pseudo-class";
  return "class";
}

function segmentText(segment: SelectorSegment, first: boolean): string {
  switch (segment.kind) {
    case "scope":
      return `[${segment.attribute}]`;
    case "child":
      return `& > [${semanticAttribute(segment.name)}]`;
    case "state":
      // A class key is written `&.active` in the block, so it is already
      // `&`-prefixed; pseudo keys are not.
      return first || segment.key.startsWith("&")
        ? segment.key
        : `&${segment.key}`;
  }
}

/** The selector text as it appears in the nested output, one level deep. */
function localSelector(segment: SelectorSegment): string {
  return segmentText(segment, false);
}

/**
 * Flattens a segment list into the selector a browser resolves. `&` inside a
 * nested rule stands for the parent selector, so `[a] { & > [b] { &:hover {} }
 * }` is `[a] > [b]:hover`.
 */
export function flattenSelector(segments: readonly SelectorSegment[]): string {
  let selector = "";
  for (const segment of segments) {
    const text = segmentText(segment, selector === "");
    selector = selector === "" ? text : text.replace("&", selector);
  }
  return selector;
}

export function specificityOf(
  segments: readonly SelectorSegment[],
): Specificity {
  let b = 0;
  let c = 0;
  for (const segment of segments) {
    switch (segment.kind) {
      case "scope":
      case "child":
        // An attribute selector.
        b += 1;
        break;
      case "state":
        if (segment.state === "pseudo-element") c += 1;
        else b += 1;
        break;
    }
  }
  return [0, b, c];
}

/** Lexicographic comparison. Negative when `a` is less specific than `b`. */
export function compareSpecificity(a: Specificity, b: Specificity): number {
  return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
}

/**
 * The cascade, over emitted rules: more specific wins, and on a tie the rule
 * printed later wins. Verified against Chromium in
 * `tests/resolved-format/cascade-conformance.test.ts`.
 */
export function compareCascade(a: EmittedRule, b: EmittedRule): number {
  return (
    compareSpecificity(a.specificity, b.specificity) ||
    a.order[0] - b.order[0] ||
    a.order[1] - b.order[1]
  );
}

function buildFrame(
  block: Record<string, unknown>,
  segments: SelectorSegment[],
  matches: Match[],
  origin: BaseComponentStructure,
  targeted: Set<BaseComponentStructure>,
): Frame {
  const frame: Frame = {
    selector:
      segments.length === 1
        ? segmentText(segments[0]!, true)
        : localSelector(segments[segments.length - 1]!),
    segments,
    matches,
    origin,
    declarations: [],
    children: [],
  };

  for (const [key, value] of Object.entries(block)) {
    if (key.startsWith("> ")) {
      if (!isComponent(value)) continue;
      const name = key.slice(2);
      const next: Match[] = [];
      for (const match of matches) {
        for (const child of childrenNamed(match.target, name)) {
          next.push({ chain: [...match.chain, child], target: child });
        }
      }
      // A `"> name"` key marks its children as needing a `cid-<name>`
      // attribute even when the block turns out to be empty and is pruned
      // from the stylesheet: the attribute is part of the HTML contract.
      for (const match of next) targeted.add(match.target);
      if (next.length === 0) continue;
      frame.children.push(
        buildFrame(
          value as Record<string, unknown>,
          [...segments, { kind: "child", name }],
          next,
          origin,
          targeted,
        ),
      );
    } else if (key.startsWith(":") || key.startsWith("&.")) {
      if (!isComponent(value)) continue;
      frame.children.push(
        buildFrame(
          value as Record<string, unknown>,
          [...segments, { kind: "state", key, state: stateKind(key) }],
          matches,
          origin,
          targeted,
        ),
      );
    } else {
      frame.declarations.push([key, String(value)]);
    }
  }

  return frame;
}

/**
 * The node a segment's own compound applies to: `[cid-a].on > [cid-b]` puts
 * `.on` on `a`, not on `b`. `chain` advances by one for each `child` segment,
 * so the index of the node a segment sits on is the number of `child` segments
 * up to and including it.
 */
export function holderOf(
  rule: EmittedRule,
  match: Match,
  segmentIndex: number,
): BaseComponentStructure | undefined {
  let depth = 0;
  for (let i = 0; i <= segmentIndex; i += 1) {
    if (rule.segments[i]!.kind === "child") depth += 1;
  }
  return match.chain[depth];
}

/** Static classes on a node, from its rendered `class` attribute. */
export function classesOf(node: BaseComponentStructure): Set<string> {
  const attributes = node.attributes;
  if (attributes === null || typeof attributes !== "object") return new Set();
  const value = (attributes as Record<string, unknown>)["class"];
  if (typeof value !== "string") return new Set();
  return new Set(value.split(/\s+/u).filter((name) => name !== ""));
}

/** Drops rules that would print an empty body, bottom-up. */
function prune(frame: Frame): Frame | null {
  const children = frame.children
    .map(prune)
    .filter((child): child is Frame => child !== null);
  if (frame.declarations.length === 0 && children.length === 0) return null;
  return { ...frame, children };
}

/** Pre-order walk, which is the textual order of the printed stylesheet. */
function flatten(frame: Frame, out: Frame[]): void {
  out.push(frame);
  for (const child of frame.children) flatten(child, out);
}

/**
 * Walks the tree once and returns every rule the stylesheet will contain,
 * paired with the AST nodes it matches.
 */
export function collectRules(root: BaseComponentStructure): CollectedRules {
  const targeted = new Set<BaseComponentStructure>();
  const perNode: { node: BaseComponentStructure; frame: Frame }[] = [];

  const visit = (node: BaseComponentStructure): void => {
    if (hasCSS(node)) {
      const frame = buildFrame(
        node.css as Record<string, unknown>,
        [{ kind: "scope", attribute: scopeAttribute(node) }],
        [{ chain: [node], target: node }],
        node,
        targeted,
      );
      const pruned = prune(frame);
      if (pruned !== null) perNode.push({ node, frame: pruned });
    }
    const innerHTML =
      "innerHTML" in node && node["innerHTML"] ? node["innerHTML"] : undefined;
    if (isRecordInnerHTML(innerHTML)) {
      for (const child of Object.values(innerHTML)) {
        const list = Array.isArray(child) ? child : [child];
        for (const entry of list) if (isComponent(entry)) visit(entry);
      }
    }
  };
  visit(root);

  // Identical `css` blocks hash to the same scope and print identically, so
  // the stylesheet carries one block per scope. Every node sharing that scope
  // still gets its own rules — same selector, same source position, different
  // targets — because provenance has to name the node that declared it.
  const blockIndexByScope = new Map<string, number>();
  const blocks: Frame[] = [];
  for (const { frame } of perNode) {
    const scope = frame.selector;
    if (blockIndexByScope.has(scope)) continue;
    blockIndexByScope.set(scope, blocks.length);
    blocks.push(frame);
  }

  const rules: EmittedRule[] = [];
  for (const { frame } of perNode) {
    const blockIndex = blockIndexByScope.get(frame.selector)!;
    const flat: Frame[] = [];
    flatten(frame, flat);
    flat.forEach((rule, index) => {
      if (rule.declarations.length === 0) return;
      rules.push({
        origin: rule.origin,
        segments: rule.segments,
        selector: flattenSelector(rule.segments),
        specificity: specificityOf(rule.segments),
        matches: rule.matches,
        declarations: rule.declarations,
        order: [blockIndex, index],
      });
    });
  }

  return { rules, targeted, blocks };
}

const INDENT_UNIT = "  ";

/** Prints one top-level block as nested CSS. */
export function printBlock(frame: Frame, indent = 0): string {
  const pad = INDENT_UNIT.repeat(indent);
  const innerPad = INDENT_UNIT.repeat(indent + 1);
  const body = [
    ...frame.declarations.map(([key, value]) => `${innerPad}${key}: ${value};`),
    ...frame.children.map((child) => printBlock(child, indent + 1)),
  ].join("\n");
  return `${pad}${frame.selector} {\n${body}\n${pad}}`;
}

export function printStylesheet(blocks: readonly Frame[]): string {
  return blocks.map((block) => printBlock(block)).join("\n\n");
}
