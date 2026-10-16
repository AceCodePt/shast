import { createComponent } from "@tier";

export const c = createComponent({
  tag: "div",
  attributes: {
    class: "card featured",
  },
  css: {
    display: "block",
    "&.card": {
      "margin": "8px",
    },
    "&.featured": {
      "margin": "16px",
    },
  },
  innerHTML: {
    child: { tag: "span", innerHTML: "" },
  },
});
