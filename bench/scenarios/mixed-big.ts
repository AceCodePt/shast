import { createComponent } from "@tier";

export const c = createComponent({
  tag: "div",
  attributes: {
    class: "card featured",
  },
  css: {
    display: "block",
    color: "#ff0000",
    ":hover": {
      display: "inline",
      "line-height": "2",
    },
    "&.card": {
      "margin": "8px",
    },
    "&.featured": {
      "margin": "16px",
    },
    "> list": {
      "font-size": "18px",
    },
    "> item": {
      "color": "#00ff00",
    },
  },
  innerHTML: {
    list: {
      tag: "ul",
      innerHTML: {
        item: { tag: "li", innerHTML: "" },
      },
    },
    item: { tag: "li", innerHTML: "" },
  },
});
