import { createServer } from "node:http";
import { catalogueMiddleware } from "./catalogue.mjs";

function sendError(response, status, error) {
  response.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify({ error }));
}

export function createApiServer(env) {
  const catalogue = catalogueMiddleware(env);
  return createServer((request, response) => {
    catalogue(request, response, () => sendError(response, 404, "Not found."))
      .catch((error) => {
        if (response.headersSent) {
          response.destroy();
        } else if (error.code === "ERR_INVALID_URL") {
          sendError(response, 400, "Invalid request URL.");
        } else {
          sendError(response, 500, "Internal server error.");
        }
      });
  });
}
