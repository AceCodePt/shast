import { cssQueriesConfig } from "@/css/queries-config/index.ts";

export default cssQueriesConfig([
  "@media (width < 768px)",
  "@media (width >= 768px) and (width < 1024px)",
  "@media (width >= 1024px)",
  "@media (height < 600px)",
  "@media (height >= 600px)",
  "@media (prefers-color-scheme: light)",
  "@media (prefers-color-scheme: dark)",
  "@media (orientation: landscape)",
  "@media (orientation: portrait)",
  "@media (resolution >= 2dppx)",
  "@media (768px <= width < 1024px)",
  "@container (width > 400px)",
  "@container (min-width: 600px)",
]);
