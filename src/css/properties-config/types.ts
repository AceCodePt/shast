import type {
  DSLInfer,
  DSLValidate,
  SupportedKeywordsConfig,
} from "tsyntax";
import type { BaseCSSSyntaxConfig } from "@/css/syntax-config/types.ts";

export interface BaseCSSPropertiesConfig {
  [attribute: string]: {
    syntax: string;
    inherits: boolean;
    "initial-value": string;
  };
}

export type ValidateCSSPropertiesConfig<
  Keywords extends SupportedKeywordsConfig,
  S extends BaseCSSSyntaxConfig,
  P extends BaseCSSPropertiesConfig,
> = keyof P extends string
  ? {
      [K in keyof P]: K extends string
        ? K extends `--${string}`
          ? {
              syntax: DSLValidate<Keywords & S, P[K]["syntax"]>;
              inherits: boolean;
              "initial-value": DSLInfer<Keywords & S, P[K]["syntax"]>;
            }
          : P[K] &
              `You must have the property start with -- instead like --${K}`
        : P[K];
    }
  : P;
