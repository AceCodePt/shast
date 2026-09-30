import type { SupportedKeywordsConfig } from "tsyntax";
import type { BaseHTMLAttributesConfig } from "@/html/attribute-config/types.ts";
import type { BaseHTMLTagConfig } from "@/html/tag-config/types.ts";
import type { BaseKeyframesConfig } from "@/css/keyframes-config/types.ts";
import type { BaseComponentStructure } from "@/engine/types.ts";

// The set of tags permitted in a position: `null` means "no inherited
// restriction" (the root, or a wildcard `innerHTML`), a set is the closed
// world the parent's `innerHTML` narrowed to.
export type AllowedTagSet = Set<string> | null;

// The `innerHTML` slot of a node as the validator sees it: a nested map of
// children (`> child` targets), a text string, or absent.
export type InnerHTML = BaseComponentStructure["innerHTML"] | undefined;

// The registry snapshot every validation walk shares. It is built once per
// `engine()` and never changes across the recursion, so it travels as one
// value instead of a dozen positional parameters. The HTML layer reads
// `keywords` (attribute DSLs); the CSS layer reads `mergedKeywords` (CSS
// syntax tokens layered with the component's supported keywords) and the CSS
// registries. `gate-resolution.ts` is the machinery both layers share, which
// is what keeps the two walls agreeing.
export interface ValidationContext {
  readonly keywords: SupportedKeywordsConfig;
  readonly mergedKeywords: Record<string, string>;
  readonly globalAttributes: BaseHTMLAttributesConfig;
  readonly tagConfig: BaseHTMLTagConfig;
  readonly cssAttributesConfig: Record<string, any>;
  readonly cssPropertiesConfig: Record<string, any>;
  readonly registeredQueries: ReadonlySet<string>;
  readonly registeredPseudoClasses: ReadonlySet<string>;
  readonly cssKeyframesConfig: BaseKeyframesConfig;
}
