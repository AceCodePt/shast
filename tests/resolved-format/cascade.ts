import type { BaseComponentStructure } from "@/engine/types.ts";
import {
  classesOf,
  collectRules,
  compareCascade,
  holderOf,
  type EmittedRule,
  type Match,
  type Specificity,
} from "@/engine/render/collect-rules.ts";
import { ancestorPath, walkTree, type TreeNode } from "./tree.ts";

/**
 * Per-node resolved style with provenance.
 *
 * Every declaration that reaches a node is attributed to the node that declared
 * it, and same-property collisions record the loser as well as the winner. The
 * cascade is computed over the rules `renderComponent` actually emits — see
 * `src/engine/render/collect-rules.ts` — not over a second reading of the `css`
 * blocks, because a resolver that disagreed with the emitter would describe a
 * page that does not exist.
 */

/** One declaration that reached a node, winning or losing. */
export type Contribution = {
  readonly value: string;
  /**
   * `"own"`, or the declaring ancestor's path plus the selector key chain that
   * matched — e.g. `root>body "> panel"`. Enough to jump to the source.
   *
   * Read by machines. Human-facing output uses {@link declaredBy} and
   * {@link viaKey} instead, because this single string reads as one selector and
   * gets folded into one path: asked which node declared
   * `root "> body > panel"`, most readers answer `root>body>panel`.
   */
  readonly from: string;
  /** Path of the node whose `css` block holds this declaration. */
  readonly declaredBy: string;
  /** The `"> a > b"` key inside that block, or `null` when it is a plain one. */
  readonly viaKey: string | null;
  /** `> name` steps between the declaring node and this one. 0 for own. */
  readonly distance: number;
  readonly specificity: Specificity;
  readonly selector: string;
};

export type ResolvedProperty = {
  readonly value: string;
  readonly from: string;
  readonly declaredBy: string;
  readonly viaKey: string | null;
  /** Losing declarations in descending precedence. Absent when uncontested. */
  readonly shadows?: readonly Contribution[];
};

export type ResolvedStyle = Readonly<Record<string, ResolvedProperty>>;

export type ResolvedNode = {
  readonly path: string;
  readonly node: BaseComponentStructure;
  readonly tag: string;
  readonly text: string | null;
  /** What applies at rest. Complete: nothing else is needed to know the style. */
  readonly style: ResolvedStyle;
  /**
   * Keyed by the state's selector suffix (`:hover`, `.active`, `::before`, or a
   * chain like `.active:hover`). Each entry holds only the properties that
   * state *changes* relative to `style` — the delta is the interesting part,
   * and repeating the base would make the two indistinguishable.
   */
  readonly states: Readonly<Record<string, ResolvedStyle>>;
  /**
   * States that declare something and change nothing.
   *
   * An ancestor's `"> a > b"` block emits three attribute selectors, (0,3,0),
   * and a node's own `:hover` emits two, (0,2,0) — so an ancestor can outrank a
   * state and hovering does nothing at all. Leaving that out would make a dead
   * `:hover` invisible: the state simply would not appear, which reads as "this
   * node has no hover behaviour" rather than "this node's hover behaviour is
   * being overruled". The second is a bug; the first is a design.
   */
  readonly deadStates: Readonly<Record<string, readonly Suppressed[]>>;
};

export type Suppressed = {
  readonly property: string;
  /** What the state tried to set. */
  readonly value: string;
  /** What applies instead, and where it comes from. */
  readonly beatenBy: ResolvedProperty;
};

export type Cascade = {
  readonly nodes: readonly ResolvedNode[];
  readonly byPath: ReadonlyMap<string, ResolvedNode>;
  /**
   * Winning values only, ready for `resolveStyle`. Empty for a path with no
   * declarations, so callers never branch on presence.
   */
  declarationsAt(path: string): Record<string, string>;
};

const EMPTY: Record<string, string> = Object.freeze({});

function childNames(rule: EmittedRule): string[] {
  return rule.segments
    .filter((segment) => segment.kind === "child")
    .map((segment) => (segment.kind === "child" ? segment.name : ""));
}

/** `&.active` is written with its `&`; a state key is shown without it. */
function normalizeStateKey(key: string): string {
  return key.startsWith("&") ? key.slice(1) : key;
}

/**
 * The state keys that are *not* already satisfied.
 *
 * A `&.active` block is only conditional when the element does not already
 * carry that class. When it does — `attributes: { class: "active" }` — the rule
 * applies at rest and belongs in the resting style; filing it under a state
 * would understate what the page looks like and, worse, make the resting style
 * incomplete, which the format promises it never is.
 */
function pendingStates(rule: EmittedRule, match: Match): string[] {
  const out: string[] = [];
  rule.segments.forEach((segment, index) => {
    if (segment.kind !== "state") return;
    if (segment.state === "class") {
      const holder = holderOf(rule, match, index);
      const name = normalizeStateKey(segment.key).slice(1);
      if (holder !== undefined && classesOf(holder).has(name)) return;
    }
    out.push(normalizeStateKey(segment.key));
  });
  return out;
}

/** A rule paired with the one resolution of it that reached a given node. */
type Applied = { rule: EmittedRule; match: Match; pending: string[] };

type Provenance = {
  from: string;
  declaredBy: string;
  viaKey: string | null;
  distance: number;
};

/**
 * Where a rule's declarations were written: which node's `css` block, and which
 * key inside it.
 *
 * The key is the full nesting path as the author typed it, state keys included.
 * Without them, a node that declares `padding` at the top of its block and
 * again under `&.big` produces two contributions labelled identically — and one
 * of them is shadowed, so a reader cannot tell which line to go and delete.
 */
function provenance(rule: EmittedRule, targetPath: string): Provenance {
  const names = childNames(rule);
  const keys = rule.segments
    .filter((segment) => segment.kind !== "scope")
    .map((segment) =>
      segment.kind === "child" ? `> ${segment.name}` : segment.key,
    );
  const declaredBy = ancestorPath(targetPath, names.length);
  if (keys.length === 0) {
    return { from: "own", declaredBy, viaKey: null, distance: 0 };
  }
  const viaKey = keys.join(" ");
  return {
    from: names.length === 0 ? `own "${viaKey}"` : `${declaredBy} "${viaKey}"`,
    declaredBy,
    viaKey,
    distance: names.length,
  };
}

/**
 * Resolves one property set from rules already ordered weakest-first.
 *
 * The winner is the last contribution; the rest are recorded as `shadows` in
 * descending precedence, so a declaration that never survives is visible
 * rather than merely absent.
 */
function cascadeOf(
  ordered: readonly Applied[],
  targetPath: string,
): ResolvedStyle {
  const contributions = new Map<string, Contribution[]>();
  for (const { rule } of ordered) {
    const where = provenance(rule, targetPath);
    for (const [property, value] of rule.declarations) {
      const list = contributions.get(property) ?? [];
      list.push({
        value,
        ...where,
        specificity: rule.specificity,
        selector: rule.selector,
      });
      contributions.set(property, list);
    }
  }

  const style: Record<string, ResolvedProperty> = {};
  for (const [property, list] of contributions) {
    const winner = list[list.length - 1]!;
    const losers = list.slice(0, -1).reverse();
    const resolved = {
      value: winner.value,
      from: winner.from,
      declaredBy: winner.declaredBy,
      viaKey: winner.viaKey,
    };
    style[property] =
      losers.length === 0 ? resolved : { ...resolved, shadows: losers };
  }
  return style;
}

/**
 * A state's rules apply only when every one of its pending keys is active. So
 * the style in state `C` is the cascade over resting rules plus every rule whose
 * pending keys are all in `C` — which is what makes `.active:hover` build on
 * both `.active` and `:hover` rather than replacing them.
 */
function isActiveIn(applied: Applied, active: ReadonlySet<string>): boolean {
  return applied.pending.every((key) => active.has(key));
}

function diff(base: ResolvedStyle, inState: ResolvedStyle): ResolvedStyle {
  const out: Record<string, ResolvedProperty> = {};
  for (const [property, resolved] of Object.entries(inState)) {
    const before = base[property];
    if (before !== undefined && before.value === resolved.value) continue;
    out[property] = resolved;
  }
  return out;
}

/**
 * Declarations a state made that the state's own cascade threw away.
 *
 * Checked against the state's *own* rules rather than the delta, because a
 * property can be absent from the delta for two opposite reasons: the state
 * never mentioned it, or the state mentioned it and lost.
 */
function suppressed(
  own: readonly Applied[],
  signature: string,
  inState: ResolvedStyle,
): Suppressed[] {
  const out: Suppressed[] = [];
  for (const applied of own) {
    if (applied.pending.join("") !== signature) continue;
    for (const [property, value] of applied.rule.declarations) {
      const winner = inState[property];
      if (winner === undefined || winner.value === value) continue;
      out.push({ property, value, beatenBy: winner });
    }
  }
  return out;
}

export function resolveCascade(root: BaseComponentStructure): Cascade {
  const { rules } = collectRules(root);

  const byTarget = new Map<BaseComponentStructure, Applied[]>();
  for (const rule of rules) {
    for (const match of rule.matches) {
      const list = byTarget.get(match.target) ?? [];
      list.push({ rule, match, pending: pendingStates(rule, match) });
      byTarget.set(match.target, list);
    }
  }

  const resolve = (tree: TreeNode): ResolvedNode => {
    const own = (byTarget.get(tree.node) ?? [])
      .slice()
      .sort((a, b) => compareCascade(a.rule, b.rule));
    const style = cascadeOf(
      own.filter((applied) => applied.pending.length === 0),
      tree.path,
    );

    const signatures = new Map<string, string[]>();
    for (const applied of own) {
      if (applied.pending.length === 0) continue;
      signatures.set(applied.pending.join(""), applied.pending);
    }

    const states: Record<string, ResolvedStyle> = {};
    const deadStates: Record<string, readonly Suppressed[]> = {};
    for (const [signature, keys] of signatures) {
      const active = new Set(keys);
      const inState = cascadeOf(
        own.filter((applied) => isActiveIn(applied, active)),
        tree.path,
      );
      const delta = diff(style, inState);
      if (Object.keys(delta).length > 0) states[signature] = delta;
      const lost = suppressed(own, signature, inState);
      if (lost.length > 0) deadStates[signature] = lost;
    }

    return {
      path: tree.path,
      node: tree.node,
      tag: tree.tag,
      text: tree.text,
      style,
      states,
      deadStates,
    };
  };

  const nodes = walkTree(root).map(resolve);
  const byPath = new Map(nodes.map((node) => [node.path, node]));
  const declarationCache = new Map<string, Record<string, string>>();

  return {
    nodes,
    byPath,
    declarationsAt(path: string): Record<string, string> {
      const cached = declarationCache.get(path);
      if (cached !== undefined) return cached;
      const resolved = byPath.get(path);
      if (resolved === undefined) return EMPTY;
      const out: Record<string, string> = {};
      for (const [property, value] of Object.entries(resolved.style)) {
        out[property] = value.value;
      }
      declarationCache.set(path, out);
      return out;
    },
  };
}
