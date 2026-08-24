import type { ValidateQueries } from "./types.ts";
import { validateQueryString } from "./validate.ts";

export function cssQueriesConfig<const T extends readonly string[]>(
  queries: ValidateQueries<T>,
): T {
  for (const query of queries) {
    validateQueryString(query);
  }
  return queries as T;
}