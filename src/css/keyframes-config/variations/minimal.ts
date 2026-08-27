import { cssKeyframesConfig } from "@/css/keyframes-config/index.ts";
import minimalCSSAttributes from "@/css/attribute-config/variations/minimal.ts";
import minimalCSSSyntax from "@/css/syntax-config/variations/minimal.ts";

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