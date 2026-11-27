import { URL } from "node:url";
import { createCatalogue, ProviderError } from "./catalogue.mjs";

export function catalogueMiddleware(env, fetcher, budgetPath) {
  const run = createCatalogue(env, fetcher, budgetPath);
  return async (req, res, next) => {
    const url = new URL(req.url, "http://localhost");
    if (
      url.pathname !== "/api/catalogue" &&
      !url.pathname.startsWith("/api/catalogue/")
    )
      return next();
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    try {
      if (req.method !== "GET") {
        res.setHeader("Allow", "GET");
        throw new ProviderError(405);
      }
      res.end(JSON.stringify(await run(url)));
    } catch (error) {
      res.statusCode = [400, 404, 405, 429, 503, 504].includes(error.status)
        ? error.status
        : 502;
      if (error.retryAfter)
        res.setHeader("Retry-After", String(error.retryAfter));
      res.end(
        JSON.stringify({
          code: error instanceof ProviderError ? error.code : undefined,
          error:
            res.statusCode === 429
              ? "The data provider is busy. Try again later."
              : "Catalogue information could not be loaded.",
        }),
      );
    }
  };
}
