import type { BaseComponentStructure } from "@/engine/types.ts";
import type { BaseHTMLAttributesConfig } from "@/html/attribute-config/types.ts";
import type { BaseHTMLTagConfig } from "@/html/tag-config/types.ts";
import {
  isGateDefinition,
  resolveGateValue,
} from "@/engine/gate-resolution.ts";
import type { SupportedKeywordsConfig } from "tsyntax";
import {
  collectRules,
  hasCSS,
  printStylesheet,
  scopeAttribute,
  semanticAttribute,
} from "./collect-rules.ts";

function isRecordInnerHTML(
  innerHTML: unknown,
): innerHTML is Record<string, unknown> {
  return (
    innerHTML !== null &&
    typeof innerHTML === "object" &&
    !Array.isArray(innerHTML)
  );
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

// A DSL whose declared type is exactly one literal. `"'todo'"`, `"42"`, and
// `"true"` qualify; a union (`"'a' | 'b'"`) or a primitive (`"string"`) does not.
function singleLiteral(dsl: string): { found: boolean; value?: unknown } {
  const trimmed = dsl.trim();
  if (trimmed.includes("|")) return { found: false };
  const quoted =
    /^'([^']*)'$/.exec(trimmed) ?? /^"([^"]*)"$/.exec(trimmed);
  if (quoted) return { found: true, value: quoted[1] };
  if (trimmed === "true") return { found: true, value: true };
  if (trimmed === "false") return { found: true, value: false };
  if (trimmed !== "" && !Number.isNaN(+trimmed)) {
    return { found: true, value: +trimmed };
  }
  return { found: false };
}

// Fill in a single-literal `self` unlock the author did not write. The gate
// value was already validated when the component was created; writing it is
// allowed, and writing a different value is an error at both walls.
function withFilledAttributes(
  tagConfig: BaseHTMLTagConfig,
  globalAttributes: BaseHTMLAttributesConfig,
  tag: string,
  attributes: Record<string, unknown>,
  keywords: SupportedKeywordsConfig,
): Record<string, unknown> {
  const definitions: Record<string, any> = {
    ...globalAttributes,
    ...(tagConfig[tag]?.attributes ?? {}),
  };
  let result: Record<string, unknown> | undefined;
  for (const [key, value] of Object.entries(attributes)) {
    const def = definitions[key];
    if (!isGateDefinition(def) || typeof value !== "string") continue;
    let matched: string;
    try {
      matched = resolveGateValue(keywords, key, def, value, "Attribute");
    } catch {
      continue;
    }
    const bag = def[matched]?.self;
    if (!isGateDefinition(bag)) continue;
    for (const unlocked of Object.keys(bag)) {
      if (unlocked in attributes) continue;
      const dsl = bag[unlocked];
      if (typeof dsl !== "string") continue;
      const literal = singleLiteral(dsl);
      if (!literal.found) continue;
      result ??= { ...attributes };
      result[unlocked] = literal.value;
    }
  }
  return result ?? attributes;
}

function renderHTMLNode(
  tagConfig: BaseHTMLTagConfig,
  node: BaseComponentStructure,
  semanticName: string | undefined,
  targeted: ReadonlySet<BaseComponentStructure>,
  globalAttributes: BaseHTMLAttributesConfig,
  keywords: SupportedKeywordsConfig,
): string {
  const tag = node.tag as string;

  const identifiers: string[] = [];
  if (semanticName !== undefined && targeted.has(node)) {
    identifiers.push(semanticAttribute(semanticName));
  }
  if (hasCSS(node)) {
    identifiers.push(scopeAttribute(node));
  }

  const attributesHTML =
    identifiers.map((id) => ` ${id}`).join("") +
    renderAttributes(
      withFilledAttributes(
        tagConfig,
        globalAttributes,
        tag,
        node.attributes ?? {},
        keywords,
      ),
    );

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
              globalAttributes,
              keywords,
            );
          }
        }
      } else if (child !== null && typeof child === "object") {
        childrenHTML += renderHTMLNode(
          tagConfig,
          child as BaseComponentStructure,
          key,
          targeted,
          globalAttributes,
          keywords,
        );
      }
    }
  }

  return `<${tag}${attributesHTML}>${childrenHTML}</${tag}>`;
}

/**
 * Renders a component to structurally coupled HTML and CSS.
 *
 * The stylesheet is printed from {@link collectRules}, which is also what the
 * resolver reads. There is exactly one implementation of "which selector does
 * this `css` key emit", so a description of the resolved page cannot drift
 * from the page.
 */
export function renderComponent(
  tagConfig: BaseHTMLTagConfig,
  node: BaseComponentStructure,
  globalAttributes: BaseHTMLAttributesConfig = {},
  keywords: SupportedKeywordsConfig = {},
): { html: string; css: string } {
  const { targeted, blocks } = collectRules(node);
  return {
    html: renderHTMLNode(
      tagConfig,
      node,
      undefined,
      targeted,
      globalAttributes,
      keywords,
    ),
    css: printStylesheet(blocks),
  };
}
