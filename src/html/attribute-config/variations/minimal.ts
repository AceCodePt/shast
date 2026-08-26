import { SUPPORTED_KEYWORDS } from "tsyntax";
import { htmlAttributeConfig } from "@/html/attribute-config/index.ts";

export default htmlAttributeConfig(SUPPORTED_KEYWORDS, {
  id: "string | undefined",
  class: "string | undefined",
  style: "string | undefined",
  tabindex: "number | undefined",
  role: "string | undefined",
});
