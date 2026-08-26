import { cssQueriesConfig } from "@/css/queries-config/index.ts";

export default cssQueriesConfig([
  "@media (width < 480px)",
  "@media (width < 768px)",
  "@media (width >= 768px)",
  "@media (width < 1024px)",
  "@media (width >= 1024px)",
  "@media (prefers-reduced-motion: reduce)",
]);
