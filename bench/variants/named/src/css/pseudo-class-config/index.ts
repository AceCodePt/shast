import type { BaseCSSPseudoClassConfig } from "./types.ts";

export const cssPseudoClassConfig = <const A extends BaseCSSPseudoClassConfig>(
  config: A,
) => {
  for (const pseudoClass of config) {
    if (!pseudoClass.startsWith(":")) {
      throw new Error("Pseudo Class must start with :");
    }
  }
  return config as A;
};
