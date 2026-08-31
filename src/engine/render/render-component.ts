import type { BaseComponentStructure } from "@/engine/types.ts";
import type { BaseHTMLTagConfig } from "@/html/tag-config/types.ts";

const INDENT_UNIT = "  ";

function stableStringify(value: unknown): string {
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

const PREFIX = "cid-";

function hashAttribute(node: BaseComponentStructure): string {
  // The scope is a property of the component's *style contract* — its `css`
  // block — not of instance data (attribute values, text, child data). The
  // rendered rules are a pure function of `css` (child selectors emit
  // `[cid-<name>]` by name, not by child hash), so two components with an
  // identical `css` block produce identical rules and must share one scope.
  // Per-instance differences (e.g. which classes are actually present) are
  // resolved by the real `class` attribute at match time, not by minting a
  // separate scope. Hashing the whole node would emit a duplicate block per
  // instance and per data variation.
  return `${PREFIX}${hashNode(node.css)}`;
}

function semanticAttribute(name: string): string {
  return `${PREFIX}${name}`;
}

function attributeSelector(attribute: string): string {
  return `[${attribute}]`;
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

/**
 * Merges innerHTML records from multiple components so that CSS traversal can
 * resolve `> childKey` selectors against any key present in any element.
 * Array values are **concatenated** (not overwritten) so deeper selectors
 * (e.g. `> inner2 > inner5`) continue to work across heterogeneous siblings.
 */
function mergeInnerHTML(
  components: BaseComponentStructure[],
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const comp of components) {
    const innerHTML = comp.innerHTML;
    if (!innerHTML || typeof innerHTML !== "object" || Array.isArray(innerHTML))
      continue;
    for (const [key, value] of Object.entries(innerHTML)) {
      if (Array.isArray(value)) {
        const existing = result[key];
        result[key] =
          existing && Array.isArray(existing)
            ? [...existing, ...value]
            : [...value];
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

function hasCSS(node: BaseComponentStructure): boolean {
  return node.css !== undefined && node.css !== null;
}

function renderAttributes(attributes: Record<string, unknown>): string {
  let html = "";
  for (const [key, value] of Object.entries(attributes)) {
    if (value === undefined || value === null || value === false) continue;
    if (value === true) {
      html += ` ${key}`;
      continue;
    }
    html += ` ${key}="${String(value)}"`;
  }
  return html;
}

function renderHTMLNode(
  tagConfig: BaseHTMLTagConfig,
  node: BaseComponentStructure,
  semanticName: string | undefined,
  targeted: ReadonlySet<BaseComponentStructure>,
): string {
  const tag = node.tag as string;

  const identifiers: string[] = [];
  if (semanticName !== undefined && targeted.has(node)) {
    identifiers.push(semanticAttribute(semanticName));
  }
  if (hasCSS(node)) {
    identifiers.push(hashAttribute(node));
  }

  const attributesHTML =
    identifiers.map((id) => ` ${id}`).join("") +
    renderAttributes(node.attributes ?? {});

  const tagDefinition = tagConfig[tag];
  const isVoidElement =
    tagDefinition !== undefined &&
    Array.isArray(tagDefinition.innerHTML) &&
    tagDefinition.innerHTML.length === 0;

  if (isVoidElement) {
    return `<${tag}${attributesHTML}>`;
  }

  const innerHTML =
    "innerHTML" in node && node["innerHTML"] ? node["innerHTML"] : undefined;
  let childrenHTML = "";

  if (typeof innerHTML === "string") {
    childrenHTML = innerHTML;
  } else if (isRecordInnerHTML(innerHTML)) {
    for (const [key, child] of Object.entries(innerHTML)) {
      if (typeof child === "string") {
        childrenHTML += child;
      } else if (Array.isArray(child)) {
        for (const item of child) {
          if (typeof item === "string") {
            childrenHTML += item;
          } else if (item !== null && typeof item === "object") {
            childrenHTML += renderHTMLNode(
              tagConfig,
              item as BaseComponentStructure,
              key,
              targeted,
            );
          }
        }
      } else if (child !== null && typeof child === "object") {
        childrenHTML += renderHTMLNode(
          tagConfig,
          child as BaseComponentStructure,
          key,
          targeted,
        );
      }
    }
  }

  return `<${tag}${attributesHTML}>${childrenHTML}</${tag}>`;
}

function resolveChild(
  node: BaseComponentStructure,
  childName: string,
): BaseComponentStructure | undefined {
  const innerHTML =
    "innerHTML" in node && node["innerHTML"] ? node["innerHTML"] : undefined;
  if (!isRecordInnerHTML(innerHTML)) return undefined;
  const child = innerHTML[childName];
  if (Array.isArray(child)) {
    const first = (child as unknown[]).find(
      (c): c is BaseComponentStructure =>
        c !== null && typeof c === "object" && !Array.isArray(c),
    );
    return first;
  }
  return child !== null && typeof child === "object" && !Array.isArray(child)
    ? (child as BaseComponentStructure)
    : undefined;
}

/**
 * Walks a css block exactly as {@link renderRule} does, recording every child
 * node reached through a `> childName` direct child selector. Pseudo blocks are
 * traversed without changing the node they resolve against.
 */
function markTargetedChildren(
  cssBlock: Record<string, unknown>,
  node: BaseComponentStructure,
  targeted: Set<BaseComponentStructure>,
): void {
  for (const [key, value] of Object.entries(cssBlock)) {
    if (value === null || typeof value !== "object") continue;
    const block = value as Record<string, unknown>;
    if (key.startsWith("> ")) {
      const childName = key.slice(2);
      const innerHTML =
        "innerHTML" in node && node["innerHTML"]
          ? node["innerHTML"]
          : undefined;
      if (isRecordInnerHTML(innerHTML)) {
        const rawChild = innerHTML[childName];
        if (Array.isArray(rawChild)) {
          for (const item of rawChild) {
            if (
              item !== null &&
              typeof item === "object" &&
              !Array.isArray(item)
            ) {
              targeted.add(item as BaseComponentStructure);
            }
          }
          const components = (rawChild as unknown[]).filter(
            (c): c is BaseComponentStructure =>
              c !== null && typeof c === "object" && !Array.isArray(c),
          );
          if (components.length > 0) {
            const mergedNode = {
              tag: components[0]!.tag,
              innerHTML: mergeInnerHTML(components),
            } as BaseComponentStructure;
            markTargetedChildren(block, mergedNode, targeted);
          }
          continue;
        }
      }
      const childNode = resolveChild(node, childName);
      if (childNode !== undefined) {
        targeted.add(childNode);
        markTargetedChildren(block, childNode, targeted);
      }
    } else if (key.startsWith(":")) {
      markTargetedChildren(block, node, targeted);
    } else if (key.startsWith("&.")) {
      markTargetedChildren(block, node, targeted);
    } else if (key.startsWith("@media ") || key.startsWith("@container ")) {
      markTargetedChildren(block, node, targeted);
    }
  }
}

/**
 * Collects the child nodes that are targeted by a direct child selector
 * anywhere in the tree. Only these children need a semantic `cid-<name>`
 * attribute; untargeted children are rendered without one.
 */
function collectTargetedChildren(
  node: BaseComponentStructure,
): Set<BaseComponentStructure> {
  const targeted = new Set<BaseComponentStructure>();

  const visit = (current: BaseComponentStructure): void => {
    if (hasCSS(current)) {
      markTargetedChildren(
        current.css as Record<string, unknown>,
        current,
        targeted,
      );
    }
    const innerHTML =
      "innerHTML" in current && current["innerHTML"]
        ? current["innerHTML"]
        : undefined;
    if (isRecordInnerHTML(innerHTML)) {
      for (const child of Object.values(innerHTML)) {
        if (Array.isArray(child)) {
          for (const item of child) {
            if (item !== null && typeof item === "object") {
              visit(item as BaseComponentStructure);
            }
          }
        } else if (child !== null && typeof child === "object") {
          visit(child as BaseComponentStructure);
        }
      }
    }
  };

  visit(node);
  return targeted;
}

function renderNestedBlock(
  cssBlock: Record<string, unknown>,
  node: BaseComponentStructure,
  selector: string,
  indent: number,
): string {
  const declarations: string[] = [];
  const nestedRules: string[] = [];

  for (const [key, value] of Object.entries(cssBlock)) {
    if (key.startsWith("> ")) {
      const childName = key.slice(2);
      const innerHTML =
        "innerHTML" in node && node["innerHTML"]
          ? node["innerHTML"]
          : undefined;
      let childNode: BaseComponentStructure | undefined;
      if (isRecordInnerHTML(innerHTML)) {
        const rawChild = innerHTML[childName];
        if (Array.isArray(rawChild)) {
          const components = (rawChild as unknown[]).filter(
            (c): c is BaseComponentStructure =>
              c !== null && typeof c === "object" && !Array.isArray(c),
          );
          if (components.length > 0) {
            childNode = {
              tag: components[0]!.tag,
              innerHTML: mergeInnerHTML(components),
            } as BaseComponentStructure;
          }
        }
      }
      if (childNode === undefined) {
        childNode = resolveChild(node, childName);
      }
      if (
        childNode !== undefined &&
        value !== null &&
        typeof value === "object"
      ) {
        const rule = renderRule(
          `& > ${attributeSelector(semanticAttribute(childName))}`,
          value as Record<string, unknown>,
          childNode,
          indent + 1,
        );
        if (rule !== null) nestedRules.push(rule);
      }
    } else if (key.startsWith(":")) {
      // Pseudo-class (`:hover`) or pseudo-element (`::before`).
      if (value !== null && typeof value === "object") {
        const rule = renderRule(
          `&${key}`,
          value as Record<string, unknown>,
          node,
          indent + 1,
        );
        if (rule !== null) nestedRules.push(rule);
      }
    } else if (key.startsWith("&.")) {
      // Class selector (`&.active`).
      if (value !== null && typeof value === "object") {
        const rule = renderRule(
          key,
          value as Record<string, unknown>,
          node,
          indent + 1,
        );
        if (rule !== null) nestedRules.push(rule);
      }
    } else if (key.startsWith("@media ") || key.startsWith("@container ")) {
      // A registered query key (`@media ...` / `@container ...`). It expands
      // to a scoped @-rule that continues the current selector: declarations
      // and nested rules inside the block apply to the same element scope.
      if (value !== null && typeof value === "object") {
        const rule = renderQueryRule(
          key,
          value as Record<string, unknown>,
          node,
          selector,
          indent + 1,
        );
        if (rule !== null) nestedRules.push(rule);
      }
    } else {
      declarations.push(`${key}: ${String(value)};`);
    }
  }

  const innerPad = INDENT_UNIT.repeat(indent + 1);
  return [
    ...declarations.map((declaration) => `${innerPad}${declaration}`),
    ...nestedRules,
  ].join("\n");
}

function renderRule(
  selector: string,
  cssBlock: Record<string, unknown>,
  node: BaseComponentStructure,
  indent: number,
): string | null {
  const body = renderNestedBlock(cssBlock, node, selector, indent);
  if (body === "") return null;
  const pad = INDENT_UNIT.repeat(indent);
  return `${pad}${selector} {\n${body}\n${pad}}`;
}

function renderQueryRule(
  query: string,
  cssBlock: Record<string, unknown>,
  node: BaseComponentStructure,
  selector: string,
  indent: number,
): string | null {
  const body = renderNestedBlock(cssBlock, node, selector, indent);
  if (body === "") return null;
  const pad = INDENT_UNIT.repeat(indent);
  return `${pad}${query} {\n${body}\n${pad}}`;
}

function collectCSS(node: BaseComponentStructure): string[] {
  const rules: string[] = [];

  if (hasCSS(node)) {
    const rule = renderRule(
      attributeSelector(hashAttribute(node)),
      node.css as Record<string, unknown>,
      node,
      0,
    );
    if (rule !== null) rules.push(rule);
  }

  const innerHTML =
    "innerHTML" in node && node["innerHTML"] ? node["innerHTML"] : undefined;
  if (isRecordInnerHTML(innerHTML)) {
    for (const child of Object.values(innerHTML)) {
      if (Array.isArray(child)) {
        for (const item of child) {
          if (item !== null && typeof item === "object") {
            rules.push(...collectCSS(item as BaseComponentStructure));
          }
        }
      } else if (child !== null && typeof child === "object") {
        rules.push(...collectCSS(child as BaseComponentStructure));
      }
    }
  }

  return rules;
}

export function renderComponent(
  tagConfig: BaseHTMLTagConfig,
  node: BaseComponentStructure,
): { html: string; css: string } {
  const targeted = collectTargetedChildren(node);
  // Identical `css` blocks hash to the same scope and render to the same rule
  // string; dedupe so a component styled once is emitted once, regardless of
  // how many instances (or data variations) appear in the tree.
  const rules = [...new Set(collectCSS(node))];
  return {
    html: renderHTMLNode(tagConfig, node, undefined, targeted),
    css: rules.join("\n\n"),
  };
}
