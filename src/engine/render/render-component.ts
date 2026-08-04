import type { BaseComponentStructure } from "@/engine/types.ts";
import type { BaseHTMLTagConfig } from "@/html/tag-config/types.ts";
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
    identifiers.push(scopeAttribute(node));
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
): { html: string; css: string } {
  const { targeted, blocks } = collectRules(node);
  return {
    html: renderHTMLNode(tagConfig, node, undefined, targeted),
    css: printStylesheet(blocks),
  };
}
