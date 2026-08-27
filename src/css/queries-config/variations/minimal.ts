import { cssQueriesConfig } from "@/css/queries-config/index.ts";
import minimalCSSSyntax from "@/css/syntax-config/variations/minimal.ts";

export default cssQueriesConfig(minimalCSSSyntax, [
  "@media (width < 480px)",
  "@media (width < 768px)",
  "@media (width >= 768px)",
  "@media (width < 1024px)",
  "@media (width >= 1024px)",
  "@media (prefers-reduced-motion: reduce)",
]);
