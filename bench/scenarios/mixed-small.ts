import { createComponent } from "@tier";

export const c = createComponent({
  tag: "div",
  attributes: {
    class: "card",
  },
  css: {
    display: "block",
    color: "#ff0000",
    "&.card": {
      "margin": "8px",
    },
    ":hover": {
      display: "inline",
      "line-height": "2",
    },
    "> list": {
      "font-size": "18px",
    },
  },
  innerHTML: {
    list: {
      tag: "ul",
      innerHTML: {
        item: { tag: "li", innerHTML: "" },
      },
    },
  },
});
