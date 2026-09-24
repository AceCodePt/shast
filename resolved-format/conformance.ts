import { chromium, type Browser } from "playwright";
import type { BaseHTMLTagConfig } from "@/html/tag-config/types.ts";
import type { BaseComponentStructure } from "@/engine/types.ts";
import { htmlDocument } from "./html-document.ts";

/**
 * The browser bridge used by the conformance harness.
 *
 * Every claim the format makes about the browser — state deltas on hover,
 * whether a node's text is actually legible — is checked by asking the browser.
 * The pixel geometry itself is now produced *by* the browser (`measured.ts`),
 * so the two comparators that used to live here (`measureInBrowser`,
 * `compareFixture`) have nothing left to compare against.
 */

export async function withBrowser<T>(
  fn: (browser: Browser) => Promise<T>,
): Promise<T> {
  const browser = await chromium.launch();
  try {
    return await fn(browser);
  } finally {
    await browser.close();
  }
}

/**
 * Stamps `data-probe="<index>"` on every element in tree order.
 *
 * The index is the element's position in the same depth-first walk the AST uses,
 * so a node's path can be turned into a selector without the renderer emitting
 * anything for the benefit of tests.
 */
export const TAG_PROBES = `(() => {
  let index = 0;
  const visit = (el) => {
    el.setAttribute("data-probe", String(index));
    index += 1;
    for (const child of el.children) visit(child);
  };
  visit(document.body.firstElementChild);
  return index;
})()`;

export type HoverProbe = {
  index: number;
  path: string;
  /** Property names to read, and what the format predicts on hover. */
  properties: readonly { property: string; onHover: string | "unchanged" }[];
};

export type HoverResult = {
  path: string;
  property: string;
  predicted: string;
  atRest: string;
  onHover: string;
};

/**
 * Reads a property before and during a real hover.
 *
 * The format claims some `:hover` blocks do nothing at all, because an
 * ancestor's `"> a > b"` selector emits three attribute selectors and outranks
 * the state's two. That is a claim about the browser's cascade, and the only way
 * to be sure of it is to hover the element and look.
 */
export async function measureHover(
  browser: Browser,
  tagConfig: BaseHTMLTagConfig,
  node: BaseComponentStructure,
  viewport: { width: number; height: number },
  probes: readonly HoverProbe[],
): Promise<HoverResult[]> {
  const { document } = htmlDocument(tagConfig, node);
  const page = await browser.newPage({ viewport });
  try {
    await page.setContent(document, { waitUntil: "load" });
    await page.evaluate(TAG_PROBES);
    const out: HoverResult[] = [];
    for (const probe of probes) {
      const selector = `[data-probe="${probe.index}"]`;
      const names = probe.properties.map((entry) => entry.property);
      const read = (): Promise<Record<string, string>> =>
        page.evaluate(
          (input: { selector: string; names: string[] }) => {
            const element = window.document.querySelector(input.selector);
            const style = getComputedStyle(element!);
            const result: Record<string, string> = {};
            for (const property of input.names) {
              result[property] = style.getPropertyValue(property);
            }
            return result;
          },
          { selector, names },
        );

      // The pointer starts at 0,0, which is inside any box anchored at the
      // origin — so "at rest" has to be established by moving *off* the
      // element first, at a point derived from its own rect. Reading before
      // moving reports the hover state as the resting state and every dead-state
      // check silently inverts.
      const away = await page.evaluate(
        (input: { selector: string; width: number; height: number }) => {
          const element = window.document.querySelector(input.selector);
          const rect = element!.getBoundingClientRect();
          const candidates: [number, number][] = [
            [rect.right + 2, rect.top + 2],
            [rect.left + 2, rect.bottom + 2],
            [rect.right + 2, rect.bottom + 2],
          ];
          const found = candidates.find(
            ([x, y]) =>
              x >= 0 &&
              y >= 0 &&
              x < input.width &&
              y < input.height &&
              !(
                x >= rect.left &&
                x <= rect.right &&
                y >= rect.top &&
                y <= rect.bottom
              ),
          );
          return found ?? null;
        },
        { selector, width: viewport.width, height: viewport.height },
      );
      if (away === null) {
        throw new Error(
          `measureHover: no point in the viewport lies outside ${probe.path}, ` +
            `so its resting style cannot be read`,
        );
      }
      await page.mouse.move(away[0], away[1]);
      const atRest = await read();
      await page.hover(selector);
      const onHover = await read();
      await page.mouse.move(away[0], away[1]);

      for (const entry of probe.properties) {
        out.push({
          path: probe.path,
          property: entry.property,
          predicted: entry.onHover,
          atRest: atRest[entry.property] ?? "",
          onHover: onHover[entry.property] ?? "",
        });
      }
    }
    return out;
  } finally {
    await page.close();
  }
}

export type VisibilityResult = {
  path: string;
  /** The format's claim: no pixel of this node's own text can be read. */
  claimHidden: boolean;
  /** The browser's answer: hiding the glyphs changed nothing on screen. */
  actuallyHidden: boolean;
};

/**
 * Asks the browser whether a node's text is visible at all, by painting the page
 * twice — once normally, once with that node's glyphs turned transparent — and
 * comparing the two images byte for byte.
 *
 * This is the only oracle that answers the question the format claims to answer.
 * `elementFromPoint` hit-tests geometry and reports a transparent overlay as the
 * topmost element, which is exactly the false positive the format must avoid;
 * and `getComputedStyle` knows nothing about what covers what. Pixels do.
 *
 * Rendering is deterministic for identical input, so byte equality is a sound
 * test rather than a tolerance to tune. Only leaf elements are probed: `color`
 * inherits, so making a container's text transparent would also blank its
 * descendants' text and the diff would no longer be about one node.
 */
export async function measureTextVisibility(
  browser: Browser,
  tagConfig: BaseHTMLTagConfig,
  node: BaseComponentStructure,
  viewport: { width: number; height: number },
  /** Indices in tree order to probe, with the path to report for each. */
  probes: readonly { index: number; path: string; claimHidden: boolean }[],
): Promise<VisibilityResult[]> {
  const { document } = htmlDocument(tagConfig, node);
  const page = await browser.newPage({ viewport });
  try {
    await page.setContent(document, { waitUntil: "load" });
    const count = (await page.evaluate(TAG_PROBES)) as number;
    const before = await page.screenshot();

    const out: VisibilityResult[] = [];
    for (const probe of probes) {
      if (probe.index >= count) continue;
      const handle = await page.addStyleTag({
        content: `[data-probe="${probe.index}"] { color: transparent !important; }`,
      });
      const after = await page.screenshot();
      await handle.evaluate((element) => {
        (element as unknown as Element).remove();
      });
      out.push({
        path: probe.path,
        claimHidden: probe.claimHidden,
        actuallyHidden: before.equals(after),
      });
    }
    return out;
  } finally {
    await page.close();
  }
}
