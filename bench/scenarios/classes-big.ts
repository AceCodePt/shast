import { createComponent } from "@tier";

const state = Math.random() < 0.5 ? "active" : "idle";

export const c = createComponent({
  tag: "div",
  attributes: {
    class: `${state} a b`,
  },
  css: {
    display: "block",
    "&.a": {
      "margin": "8px",
    },
    "&.b": {
      "margin": "16px",
    },
    ":hover": {
      "line-height": "2",
    },
  },
  innerHTML: {
    child: { tag: "span", innerHTML: "" },
  },
});
