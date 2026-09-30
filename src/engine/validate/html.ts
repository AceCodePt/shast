import { parseValueAgainstDSL } from "tsyntax";
import {
  htmlSlotDSL,
  isGateDefinition,
  lockedMessageFor,
  resolveGateValue,
} from "@/engine/gate-resolution.ts";
import type { BaseComponentStructure } from "@/engine/types.ts";
import { classesOf, validateCssBlock } from "./css.ts";
import type { AllowedTagSet, ValidationContext } from "./context.ts";
import { valueError } from "./value-error.ts";

// JavaScript reorders object keys that look like array indices (canonical
// non-negative integer strings such as "0", "1", "42") to the front in
// ascending numeric order, so an integer-like child name would silently
// reorder the rendered children. Such a name is also a selector handle
// (`> name`) and an identifier, and a bare integer is not a usable one, so it
// is outside the intended API shape and rejected at construction. The array
// form is the supported way to repeat a child. `2 ** 32 - 1` is the exclusive
// upper bound of an array index, matching the engine's own key ordering.
const isArrayIndexKey = (key: string): boolean =>
  /^(?:0|[1-9]\d*)$/.test(key) && Number(key) < 2 ** 32 - 1;

// Narrow the tags a parent permits to those the child itself still permits.
// `null` (no restriction) yields the child's own list; otherwise it is the
// intersection, so a `#text` tag list composes with an ancestor's closed world.
const intersectAllowed = (
  inheritedAllowed: AllowedTagSet,
  list: readonly string[],
): Set<string> => {
  if (inheritedAllowed === null) {
    return new Set(list);
  }
  return new Set(list.filter((entry) => inheritedAllowed.has(entry)));
};

// Validate one node and its subtree: its tag, attributes (including gate
// resolution and required-attribute checks), its `css` block via the CSS layer,
// and every child against the `innerHTML` the registry declares for the tag.
// `path` is the node's position in the component tree (`root > item > text`),
// built from the innerHTML key each node was reached by; it travels with the
// recursion so a value error can name where it happened.
export function validateHtmlNode(
  context: ValidationContext,
  node: unknown,
  inheritedAllowed: AllowedTagSet,
  path: string,
): void {
  if (node === null || typeof node !== "object" || Array.isArray(node)) {
    throw new Error(
      "Validation Error: Provided node is not a valid component object",
    );
  }

  const record = node as BaseComponentStructure;
  const { keywords, globalAttributes, tagConfig } = context;

  const tag = record.tag;
  if (typeof tag !== "string") {
    throw new Error(
      "Validation Error: Component node is missing a valid string 'tag' property",
    );
  }

  const tagDefinition = tagConfig[tag];
  if (tagDefinition === undefined) {
    throw new Error(
      `Structural Error: '<${tag}>' is not a recognized configuration tag in your registry`,
    );
  }

  const attributes = record.attributes;
  const tagAttributes = tagDefinition.attributes ?? {};
  const allAttributeDefs = {
    ...globalAttributes,
    ...tagAttributes,
  };
  const providedAttributes = attributes ?? {};

  // Resolve every gate written on this element first. Its value unlocks
  // further attributes on the same element. A gate written as `undefined` is
  // treated as omitted, so it contributes its declared default (`undefined`
  // arm) exactly as the type wall's `DependentHTMLProps` does.
  const ownGates: Record<string, string> = {};
  for (const [attributeKey, value] of Object.entries(providedAttributes)) {
    const def = allAttributeDefs[attributeKey];
    if (isGateDefinition(def)) {
      if (value === undefined) continue;
      ownGates[attributeKey] = resolveGateValue(
        keywords,
        attributeKey,
        def,
        value,
        "Attribute",
      );
    }
  }

  for (const [attributeKey, value] of Object.entries(providedAttributes)) {
    const def = allAttributeDefs[attributeKey];
    if (typeof def === "string") {
      try {
        parseValueAgainstDSL(keywords, def, value);
      } catch (error) {
        throw valueError("Attribute Error", attributeKey, tag, path, error);
      }
      continue;
    }
    if (isGateDefinition(def)) {
      continue; // resolved and validated in the pre-pass
    }
    const unlockedDsl = htmlSlotDSL(allAttributeDefs, ownGates, attributeKey);
    if (unlockedDsl !== undefined) {
      try {
        parseValueAgainstDSL(keywords, unlockedDsl, value);
      } catch (error) {
        throw valueError("Attribute Error", attributeKey, tag, path, error);
      }
      continue;
    }
    if (def !== undefined) {
      throw new Error(
        `Attribute Error: Property '${attributeKey}' is not a valid attribute for <${tag}> or the Global configuration registry`,
      );
    }
    const locked = lockedMessageFor(allAttributeDefs, attributeKey, [undefined]);
    if (locked !== null) {
      throw new Error(`Attribute Error: ${locked}`);
    }
    throw new Error(
      `Attribute Error: Property '${attributeKey}' is not a valid attribute for <${tag}> or the Global configuration registry`,
    );
  }

  for (const [attrKey, def] of Object.entries(allAttributeDefs)) {
    const isOptional =
      typeof def === "string"
        ? def.split("|").some((part) => part.trim() === "undefined")
        : isGateDefinition(def)
          ? "undefined" in def
          : false;
    if (!isOptional && !(attrKey in providedAttributes)) {
      throw new Error(
        `Attribute Error: Required attribute '${attrKey}' is missing on <${tag}>`,
      );
    }
  }

  const innerHTML =
    "innerHTML" in record && record["innerHTML"]
      ? record["innerHTML"]
      : undefined;

  const css = record.css;
  if (css !== undefined && css !== null) {
    validateCssBlock(context, css as Record<string, unknown>, {
      innerHTML,
      classes: classesOf(record),
      nodeTag: tag,
      path,
    });
  }

  const innerHTMLConfig = tagDefinition.innerHTML;
  const isVoidElement =
    Array.isArray(innerHTMLConfig) && innerHTMLConfig.length === 0;

  if (isVoidElement) {
    if (innerHTML !== undefined) {
      throw new Error(
        `Validation Error: Tag '<${tag}>' is configured as a void element and must not contain any innerHTML or children`,
      );
    }
    return;
  }

  if (innerHTML === undefined) {
    return;
  }

  const isWildcard = innerHTMLConfig === "*";
  const ownList = Array.isArray(innerHTMLConfig) ? innerHTMLConfig : [];
  const declaresText = ownList.includes("#text");
  const allowsText = isWildcard || declaresText;

  let childAllowed: AllowedTagSet;
  let forwardAllowed: AllowedTagSet;
  if (isWildcard) {
    childAllowed = inheritedAllowed;
    forwardAllowed = inheritedAllowed;
  } else if (declaresText) {
    const intersected = intersectAllowed(inheritedAllowed, ownList);
    childAllowed = intersected;
    forwardAllowed = intersected;
  } else {
    childAllowed = new Set(ownList);
    forwardAllowed = inheritedAllowed;
  }

  if (typeof innerHTML === "string") {
    if (!allowsText) {
      throw new Error(
        `Validation Error: Tag '<${tag}>' innerHTML cannot contain a string without the #text`,
      );
    }
    return;
  }

  const processChild = (child: unknown, childPath: string): void => {
    if (typeof child === "string") {
      if (!allowsText) {
        throw new Error(
          `Validation Error: Tag '<${tag}>' innerHTML cannot contain a string without the #text`,
        );
      }
      return;
    }
    if (Array.isArray(child)) {
      for (const item of child) {
        processChild(item, childPath);
      }
      return;
    }
    const childTag =
      child !== null && typeof child === "object"
        ? (child as BaseComponentStructure).tag
        : undefined;
    if (
      childAllowed !== null &&
      typeof childTag === "string" &&
      !childAllowed.has(childTag)
    ) {
      throw new Error(
        `Structural Error: '<${childTag}>' is not a permitted child of <${tag}>`,
      );
    }
    validateHtmlNode(context, child, forwardAllowed, childPath);
  };

  for (const [childKey, child] of Object.entries(innerHTML)) {
    if (isArrayIndexKey(childKey)) {
      throw new Error(
        `Validation Error: Child name '${childKey}' on <${tag}> is not allowed: child names must be valid identifiers, not integer-like keys`,
      );
    }
    processChild(child, `${path} > ${childKey}`);
  }
}
