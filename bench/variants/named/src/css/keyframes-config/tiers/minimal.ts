import { cssKeyframesConfig } from "@/css/keyframes-config/index.ts";
import minimalCSSAttributes from "@/css/attribute-config/tiers/minimal.ts";
import minimalCSSSyntax from "@/css/syntax-config/tiers/minimal.ts";

export default cssKeyframesConfig(minimalCSSSyntax, minimalCSSAttributes, {
  blink: {
    from: { visibility: "visible" },
    to: { visibility: "hidden" },
  },
  grow: {
    from: { "font-size": "0px" },
    to: { "font-size": "1rem" },
  },
});