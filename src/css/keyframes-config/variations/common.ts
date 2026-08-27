import { cssKeyframesConfig } from "@/css/keyframes-config/index.ts";
import commonCSSAttributes from "@/css/attribute-config/variations/common.ts";
import commonCSSSyntax from "@/css/syntax-config/variations/common.ts";

export default cssKeyframesConfig(commonCSSSyntax, commonCSSAttributes, {
  fade: {
    from: { opacity: "0" },
    to: { opacity: "1" },
  },
  pulse: {
    "0%": { opacity: "0.5" },
    "100%": { opacity: "1" },
  },
  slide: {
    from: { transform: "translateX(0px)" },
    to: { transform: "translateX(100px)" },
  },
});