import { createComponent } from "@tier";

export const c = createComponent({
  tag: "div",
  css: {
    display: "block",
    color: "#ff0000",
    "background-color": "#eee",
    "border-radius": "4px",
    "font-size": "20px",
    "font-weight": "bold",
    "line-height": "1.5",
    "text-transform": "uppercase",
    margin: "4px",
    padding: "4px",
    "> list": {
      "font-size": "24px",
    },
  },
  innerHTML: {
    list: {
      tag: "ul",
      innerHTML: {
        item: {
          tag: "li",
          innerHTML: {
            text: {
              tag: "p",
              innerHTML: {
                content: { tag: "span", innerHTML: "" },
              },
            },
          },
        },
      },
    },
  },
});
