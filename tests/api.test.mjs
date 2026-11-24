import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import process from "node:process";
import { createInterface } from "node:readline";
import { test } from "node:test";
import { fileURLToPath, URL } from "node:url";
import { createApiServer } from "../server/http.mjs";

async function startApi(t) {
  const server = createApiServer({}); // No provider credentials, regardless of local settings.
  t.after(() => server.close());
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  return `http://127.0.0.1:${server.address().port}`;
}

test("standalone API exposes catalogue status without Vite or provider credentials", async (t) => {
  const origin = await startApi(t);
  const response = await globalThis.fetch(`${origin}/api/catalogue/status`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /^application\/json\b/);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { enabled: false, tmdb: false });
});

test("standalone API keeps the configured catalogue's read-only method contract", async (t) => {
  const origin = await startApi(t);
  const response = await globalThis.fetch(`${origin}/api/catalogue/status`, { method: "POST" });
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "GET");
  assert.equal(typeof (await response.json()).error, "string");
});

test("standalone API preserves the disabled-catalogue error code", async (t) => {
  const origin = await startApi(t);
  const response = await globalThis.fetch(`${origin}/api/catalogue/services?country=gb`);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, "catalogue_disabled");
});

test("standalone API returns JSON 404 instead of serving the frontend", async (t) => {
  const origin = await startApi(t);
  const response = await globalThis.fetch(`${origin}/`);
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: "Not found." });
});

test("a blank API host keeps the CLI listener on loopback", { timeout: 5000 }, async (t) => {
  const entry = fileURLToPath(new URL("../server/start.mjs", import.meta.url));
  const child = spawn(process.execPath, [entry], {
    env: { WATCHQUEST_API_HOST: "", WATCHQUEST_API_PORT: "0" },
    stdio: ["ignore", "pipe", "inherit"],
  });
  const closed = once(child, "close");
  t.after(async () => {
    if (child.exitCode === null) child.kill();
    await closed;
  });
  const output = createInterface({ input: child.stdout });
  for await (const line of output) {
    assert.match(line, /^WatchQuest API listening on 127\.0\.0\.1:\d+$/);
    return;
  }
  assert.fail("API exited before announcing its listener");
});
