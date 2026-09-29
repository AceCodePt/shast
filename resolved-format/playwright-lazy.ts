import type { Browser } from "playwright";

/**
 * Lazily-loaded `playwright` entry point.
 *
 * The browser-gated conformance suites are gated behind `CONFORMANCE=1`, but a
 * top-level `import { chromium } from "playwright"` still resolved (and failed)
 * at module load, so `pnpm test` could not even discover them without the 115MB
 * browser dependency installed. This shim defers the import until a browser is
 * actually launched — which only happens inside that gate.
 */
export const chromium = {
  async launch(): Promise<Browser> {
    const { chromium: real } = await import("playwright");
    return real.launch();
  },
};
