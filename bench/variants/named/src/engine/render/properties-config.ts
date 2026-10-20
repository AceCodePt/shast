import type { BaseCSSPropertiesConfig } from "@/css/properties-config/types.ts";

export function renderCSSPropertiesConfig(
  config: BaseCSSPropertiesConfig,
): string {
  const entries = Object.entries(config);

  const parts: string[] = [];
  for (const [key, value] of entries) {
    let block = `@property ${key} {\n`;
    block += `  syntax: "${value.syntax}";\n`;
    block += `  inherits: ${value.inherits};\n`;
    block += `  initial-value: ${value["initial-value"]};\n`;
    block += `}`;
    parts.push(block);
  }

  return parts.join("\n\n");
}
