import { createComponent } from "@tier";

export const c = createComponent({
  tag: "div",
  css: {
    display: "block",
    margin: "calc(1px + 2px) calc(3px + 4px)",
    padding: "calc(calc(1px + 2px) * 2)",
    "border-radius": "calc(4px + 2px)",
    "border-width": "calc(1px + 2px)",
    "font-size": "calc(1rem + 2px)",
    "line-height": "calc(1 + 0.5)",
    "transition-duration": "calc(100ms + 0.1s)",
  },
});
