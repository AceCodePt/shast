import type { BaseComponentStructure } from "@/engine/types.ts";

/**
 * Node identity and child ordering, shared by every pass.
 *
 * A path is the `>`-joined chain of `innerHTML` keys from the root, which is
 * also how a `"> name"` selector key addresses a node — so a provenance label
 * and a node path are read in the same alphabet. When one key holds an array,
 * entries are suffixed `name[i]`: without it two siblings would share a path
 * and the format's promise that a path identifies one node would be false.
 */

export const ROOT_PATH = "root";

export type FlowItem =
  | { readonly kind: "text"; readonly text: string }
  | {
      readonly kind: "element";
      /** The `innerHTML` key, i.e. what `"> name"` matches. */
      readonly name: string;
      /** The path segment: `name`, or `name[i]` for an array of >1 entry. */
      readonly segment: string;
      readonly node: BaseComponentStructure;
    };

/**
 * Flattens `innerHTML` into ordered flow items.
 *
 * `Object.entries` is insertion-ordered for string keys and the HTML renderer
 * emits children in that order, so this sequence is DOM order — which is what
 * lets the conformance harness walk the AST and the DOM in parallel.
 */
export function flowItems(node: BaseComponentStructure): FlowItem[] {
  const inner = node["innerHTML"];
  if (inner === undefined || inner === null) return [];
  if (typeof inner === "string") return [{ kind: "text", text: inner }];
  if (typeof inner !== "object" || Array.isArray(inner)) return [];

  const items: FlowItem[] = [];
  for (const [name, child] of Object.entries(inner)) {
    const list = Array.isArray(child) ? child : [child];
    const elements = list.filter(
      (entry) => entry !== null && typeof entry === "object",
    );
    let index = 0;
    for (const entry of list) {
      if (typeof entry === "string") {
        items.push({ kind: "text", text: entry });
      } else if (entry !== null && typeof entry === "object") {
        items.push({
          kind: "element",
          name,
          segment: elements.length > 1 ? `${name}[${index}]` : name,
          node: entry as BaseComponentStructure,
        });
        index += 1;
      }
    }
  }
  return items;
}

export function childPath(parentPath: string, segment: string): string {
  return `${parentPath}>${segment}`;
}

/** The path of the ancestor `steps` levels above `path`. */
export function ancestorPath(path: string, steps: number): string {
  if (steps <= 0) return path;
  const segments = path.split(">");
  return segments.slice(0, Math.max(1, segments.length - steps)).join(">");
}

export type TreeNode = {
  readonly path: string;
  readonly node: BaseComponentStructure;
  readonly tag: string;
  /** Text this node owns directly, joined; `null` when it owns none. */
  readonly text: string | null;
};

/** Depth-first walk in DOM order, assigning each node its path. */
export function walkTree(root: BaseComponentStructure): TreeNode[] {
  const out: TreeNode[] = [];
  const visit = (node: BaseComponentStructure, path: string): void => {
    const items = flowItems(node);
    const text = items
      .filter((item): item is Extract<FlowItem, { kind: "text" }> =>
        item.kind === "text",
      )
      .map((item) => item.text)
      .join("");
    out.push({
      path,
      node,
      tag: typeof node["tag"] === "string" ? node["tag"] : "div",
      text: text === "" ? null : text,
    });
    for (const item of items) {
      if (item.kind === "element") visit(item.node, childPath(path, item.segment));
    }
  };
  visit(root, ROOT_PATH);
  return out;
}
