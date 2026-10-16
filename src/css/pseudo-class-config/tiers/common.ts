import { cssPseudoClassConfig } from "@/css/pseudo-class-config/index.ts";

export default cssPseudoClassConfig([
  // ── Interaction ─────────────────────────────────────────────────────
  ":hover",
  ":active",
  ":focus",
  ":focus-visible",
  ":focus-within",

  // ── Target ──────────────────────────────────────────────────────────
  ":target",

  // ── Structural ──────────────────────────────────────────────────────
  // ":root",
  // ":empty",
  // ":first-child",
  // ":last-child",
  // ":only-child",
  // ":nth-child()",
  // ":nth-last-child()",
  // ":first-of-type",
  // ":last-of-type",
  // ":only-of-type",
  // ":nth-of-type()",
  // ":nth-last-of-type()",

  // ── Matching / Negation ─────────────────────────────────────────────
  // ":not()",
  // ":is()",
  // ":where()",
  // ":has()",

  // ── Editing ─────────────────────────────────────────────────────────
  // ":read-only",
  // ":read-write",

  // ── Linguistic ──────────────────────────────────────────────────────
  // ":dir()",
  // ":lang()",

  // ── Scope ───────────────────────────────────────────────────────────
  // ":scope",
  // ":defined",
]);
