import process from "node:process";
import { createApiServer } from "./http.mjs";

const host = process.env.WATCHQUEST_API_HOST?.trim() || "127.0.0.1";
const port = Number(process.env.WATCHQUEST_API_PORT?.trim() || "3001");
const server = createApiServer(process.env);

server.listen(port, host, () => {
  const address = server.address();
  process.stdout.write(`WatchQuest API listening on ${address.address}:${address.port}\n`);
});
