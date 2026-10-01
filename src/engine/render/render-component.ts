import type { BaseComponentStructure } from "@/engine/types.ts";
import type { BaseHTMLAttributesConfig } from "@/html/attribute-config/types.ts";
import type { BaseHTMLTagConfig } from "@/html/tag-config/types.ts";
import type { BaseKeyframesConfig } from "@/css/keyframes-config/types.ts";
import { renderReferencedKeyframes } from "@/engine/animation.ts";
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
import { escapeAttributeValue, escapeText } from "./escape.ts";

function isRecordInnerHTML(
  innerHTML: unknown,
): innerHTML is Record<string, unknown> {
  return (
    innerHTML !== null &&
    typeof innerHTML === "object" &&
    !Array.isArray(innerHTML)
  );
}

// An attribute name is pasted into markup unescaped (` ${key}`), so it must be
// a name and not a fragment of markup. Every name the registry declares
// satisfies this; it rejects only a name that reached the renderer some other
// way (a widened `as any` value, generated data). It is output safety, not
// input validation, and runs on every render.
const ATTRIBUTE_NAME_PATTERN = /^[a-zA-Z][\w-]*$/;

function renderAttributes(attributes: Record<string, unknown>): string {
  let html = "";
  for (const [key, value] of Object.entries(attributes)) {
    if (!ATTRIBUTE_NAME_PATTERN.test(key)) {
      throw new Error(
        `Attribute Error: '${key}' is not a valid attribute name; attribute names must match /^[a-zA-Z][\\w-]*$/`,
      );
    }
    if (value === undefined || value === null || value === false) continue;
    if (value === true) {
      html += ` ${key}`;
      continue;
    }
    // Attribute values are scalars at the DSL layer (`class` and `rel` are
    // `string | undefined`; no registry entry declares an array), so there is
    // no array case. `String` is the fallback for a widened value that reaches
    // here some other way (`as any`, generated or out-of-compiler data).
    html += ` ${key}="${escapeAttributeValue(String(value))}"`;
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
      // createComponent already validated this gate value, so a miss can only come from a widened/unvalidated value passed straight to renderComponent; skip it intentionally (no unlocked attributes are filled).
      continue;
    }
    const bag = def[matched];
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
    "include" in tagDefinition.innerHTML &&
    tagDefinition.innerHTML.include !== undefined &&
    tagDefinition.innerHTML.include.length === 0;

  if (isVoidElement) {
    return `<${tag}${attributesHTML}>`;
  }

  const innerHTML =
    "innerHTML" in node && node["innerHTML"] ? node["innerHTML"] : undefined;
  let childrenHTML = "";

  // Every string below is a text node and is encoded; only nested components
  // emit markup. See `escapeText` for why there is no raw escape hatch.
  if (typeof innerHTML === "string") {
    childrenHTML = escapeText(innerHTML);
  } else if (isRecordInnerHTML(innerHTML)) {
    for (const [key, child] of Object.entries(innerHTML)) {
      if (typeof child === "string") {
        childrenHTML += escapeText(child);
      } else if (Array.isArray(child)) {
        for (const item of child) {
          if (typeof item === "string") {
            childrenHTML += escapeText(item);
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
 * resolver reads, so a description of the resolved page cannot drift from the
 * page.
 */
export function renderComponent(
  tagConfig: BaseHTMLTagConfig,
  node: BaseComponentStructure,
  globalAttributes: BaseHTMLAttributesConfig = {},
  keywords: SupportedKeywordsConfig = {},
  keyframes: BaseKeyframesConfig = {},
): { html: string; css: string } {
  const { targeted, blocks } = collectRules(node);
  // Keyframe names are global, so the referenced `@keyframes` rules are
  // emitted once each, independent of the cid-scoped blocks. They follow the
  // scoped stylesheet; a render that references none is byte-identical to
  // before.
  const scoped = printStylesheet(blocks);
  const referenced = renderReferencedKeyframes(node, keyframes);
  return {
    html: renderHTMLNode(
      tagConfig,
      node,
      undefined,
      targeted,
      globalAttributes,
      keywords,
    ),
    css: [scoped, referenced].filter((part) => part !== "").join("\n\n"),
  };
}
