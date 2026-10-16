import { createComponent } from "@tier";

export const c = createComponent({
  tag: "div",
  innerHTML: {
    content: { tag: "span", innerHTML: "" },
  },
});
