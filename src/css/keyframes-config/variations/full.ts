import { cssKeyframesConfig } from "@/css/keyframes-config/index.ts";
import fullCSSAttributes from "@/css/attribute-config/variations/full.ts";
import fullCSSSyntax from "@/css/syntax-config/variations/full.ts";

export default cssKeyframesConfig(fullCSSSyntax, fullCSSAttributes, {
  bounce: {
    "0%": { transform: "translateY(0px)", opacity: "1" },
    "50%": { transform: "translateY(-10px)", opacity: "0.5" },
    "100%": { transform: "translateY(0px)", opacity: "1" },
  },
  spin: {
    from: { rotate: "0deg" },
    to: { rotate: "360deg" },
  },
});