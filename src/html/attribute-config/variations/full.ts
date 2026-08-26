import { SUPPORTED_KEYWORDS } from "tsyntax";
import { htmlAttributeConfig } from "@/html/attribute-config/index.ts";

export default htmlAttributeConfig(SUPPORTED_KEYWORDS, {
  // ─── Core / Identity ───────────────────────────────────────────────
  id: "string | undefined",
  class: "string | undefined",
  style: "string | undefined",
  title: "string | undefined",
  slot: "string | undefined",
  part: "string | undefined",
  is: "string | undefined",

  // ─── Internationalisation ───────────────────────────────────────────
  lang: "string | undefined",
  dir: "'ltr' | 'rtl' | 'auto' | undefined",
  translate: "'yes' | 'no' | undefined",

  // ─── Visibility & Interaction ───────────────────────────────────────
  hidden: "boolean | 'until-found' | undefined",
  tabindex: "number | undefined",
  accesskey: "string | undefined",
  inert: "boolean | undefined",

  // ─── Editing & Input ───────────────────────────────────────────────
  autocapitalize:
    "'off' | 'none' | 'on' | 'sentences' | 'words' | 'characters' | undefined",
  contenteditable: "'plaintext-only' | boolean | undefined",
  draggable: "boolean | undefined",
  spellcheck: "boolean | undefined",
  autocorrect: "'on' | 'off' | undefined",
  enterkeyhint:
    "'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send' | undefined",
  inputmode:
    "'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search' | undefined",
  virtualkeyboardpolicy: "'auto' | 'manual' | undefined",
  writingsuggestions: "'true' | 'false' | undefined",

  // ─── Accessibility (role) ───────────────────────────────────────────
  role: "string | undefined",

  // ─── Accessibility (aria-*) ────────────────────────────────────────
  "aria-label": "string | undefined",
  "aria-labelledby": "string | undefined",
  "aria-describedby": "string | undefined",
  "aria-hidden": "boolean | 'true' | 'false' | undefined",
  "aria-expanded": "boolean | 'true' | 'false' | undefined",
  "aria-disabled": "boolean | 'true' | 'false' | undefined",
  "aria-checked": "boolean | 'true' | 'false' | 'mixed' | undefined",
  "aria-selected": "boolean | 'true' | 'false' | undefined",
  "aria-pressed": "boolean | 'true' | 'false' | 'mixed' | undefined",
  "aria-current":
    "boolean | 'page' | 'step' | 'location' | 'date' | 'time' | 'true' | 'false' | undefined",
  "aria-live": "'off' | 'polite' | 'assertive' | undefined",
  "aria-atomic": "boolean | 'true' | 'false' | undefined",
  "aria-relevant":
    "'additions' | 'removals' | 'text' | 'all' | 'additions text' | undefined",
  "aria-controls": "string | undefined",
  "aria-owns": "string | undefined",
  "aria-flowto": "string | undefined",
  "aria-haspopup":
    "boolean | 'false' | 'true' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog' | undefined",
  "aria-level": "number | undefined",
  "aria-valuemin": "number | undefined",
  "aria-valuemax": "number | undefined",
  "aria-valuenow": "number | undefined",
  "aria-valuetext": "string | undefined",
  "aria-orientation": "'horizontal' | 'vertical' | 'undefined' | undefined",
  "aria-sort": "'none' | 'ascending' | 'descending' | 'other' | undefined",
  "aria-multiline": "boolean | 'true' | 'false' | undefined",
  "aria-multiselectable": "boolean | 'true' | 'false' | undefined",
  "aria-readonly": "boolean | 'true' | 'false' | undefined",
  "aria-required": "boolean | 'true' | 'false' | undefined",
  "aria-invalid":
    "boolean | 'false' | 'true' | 'grammar' | 'spelling' | undefined",
  "aria-errormessage": "string | undefined",
  "aria-activedescendant": "string | undefined",
  "aria-setsize": "number | undefined",
  "aria-posinset": "number | undefined",
  "aria-colcount": "number | undefined",
  "aria-colindex": "number | undefined",
  "aria-colspan": "number | undefined",
  "aria-rowcount": "number | undefined",
  "aria-rowindex": "number | undefined",
  "aria-rowspan": "number | undefined",
  "aria-details": "string | undefined",
  "aria-keyshortcuts": "string | undefined",
  "aria-roledescription": "string | undefined",
  "aria-placeholder": "string | undefined",
  "aria-busy": "boolean | 'true' | 'false' | undefined",
  "aria-grabbed": "boolean | 'true' | 'false' | undefined",
  "aria-dropeffect":
    "'none' | 'copy' | 'execute' | 'link' | 'move' | 'popup' | undefined",
  "aria-modal": "boolean | 'true' | 'false' | undefined",

  // ─── Microdata / Metadata ───────────────────────────────────────────
  itemscope: "boolean | undefined",
  itemtype: "string | undefined",
  itemprop: "string | undefined",
  itemid: "string | undefined",
  itemref: "string | undefined",

  // ─── Popover & Anchor (modern) ──────────────────────────────────────
  popover: "'auto' | 'manual' | 'hint' | undefined",
  popovertarget: "string | undefined",
  popovertargetaction: "'show' | 'hide' | 'toggle' | undefined",
  anchor: "string | undefined",

  // ─── Miscellaneous ──────────────────────────────────────────────────
  nonce: "string | undefined",
  exportparts: "string | undefined",
  "data-*": "string | undefined",
});
