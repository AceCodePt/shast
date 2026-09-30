import type { BaseComponentStructure } from "@/engine/types.ts";
import type { BaseHTMLTagConfig } from "@/html/tag-config/types.ts";
import { renderComponent } from "@/engine/render/render-component.ts";

/**
 * The reset stylesheet the browser measurement assumes.
 *
 * It is written once here and injected into every page the format measures.
 * `box-sizing: border-box` is what makes the reported border box match the
 * `@` line, and the zeroed margins/padding make the root component's border
 * box start at exactly (0, 0).
 */
export const RESET_CSS = `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  border-width: 0;
  border-style: solid;
}

html {
  font-size: 16px;
  line-height: 1.2;
  font-family: monospace;
}`;

/**
 * Wraps a component's rendered html+css in a document the browser can measure.
 *
 * `html`/`body` are neutralised so the root component's border box starts at
 * exactly (0, 0) and the viewport is the containing block - the same
 * assumption the format's coordinates make.
 */
export function htmlDocument(
  tagConfig: BaseHTMLTagConfig,
  node: BaseComponentStructure,
): { document: string; html: string; css: string } {
  const { html, css } = renderComponent(tagConfig, node);
  const document = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
${RESET_CSS}
html, body { width: 100%; height: 100%; overflow: visible; }
body > * { display: block; }
</style>
<style>
${css}
</style>
</head>
<body>${html}</body>
</html>`;
  return { document, html, css };
}
