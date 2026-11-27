import process from "node:process";
import { fileURLToPath, URL } from "node:url";
import { createApiServer } from "./http.mjs";

const host = process.env.WATCHQUEST_API_HOST?.trim() || "127.0.0.1";
const port = Number(process.env.WATCHQUEST_API_PORT?.trim() || "3001");
// Use the existing repository ledger even when npm starts inside the workspace.
const budgetPath = fileURLToPath(new URL("../../.movieofthenight-usage.json", import.meta.url));
const server = createApiServer(process.env, budgetPath);

server.listen(port, host, () => {
  const address = server.address();
  process.stdout.write(`WatchQuest API listening on ${address.address}:${address.port}\n`);
});
