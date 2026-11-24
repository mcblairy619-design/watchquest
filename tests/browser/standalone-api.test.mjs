import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { fileURLToPath, URL } from "node:url";
import { chromium } from "playwright-core";
import { test } from "node:test";
import { build, preview } from "vite";
import { createApiServer } from "../../apps/api/http.mjs";

test("the built frontend reaches the standalone catalogue API through preview", { timeout: 15000 }, async (t) => {
  const outDir = await mkdtemp(join(tmpdir(), "watchquest-preview-"));
  let web;
  let browser;
  const api = createApiServer({});
  t.after(async () => {
    try {
      await browser?.close();
    } finally {
      try {
        await web?.close();
      } finally {
        try {
          if (api.listening) await new Promise((resolve) => api.close(resolve));
        } finally {
          await rm(outDir, { recursive: true, force: true });
        }
      }
    }
  });
  const catalogueRequests = [];
  api.on("request", (request) => catalogueRequests.push(request.url));
  api.listen(0, "127.0.0.1");
  await once(api, "listening");

  // Never enable provider access in the embedded fallback during this test.
  process.env.AVAILABILITY_FREE_PLAN = "no";
  process.env.CATALOGUE_USE = "disabled";
  process.env.WATCHQUEST_API_PROXY_TARGET = `http://127.0.0.1:${api.address().port}`;
  const configFile = fileURLToPath(new URL("../../apps/web/vite.config.mjs", import.meta.url));
  const config = { configFile, mode: "test", logLevel: "silent", build: { outDir } };
  await build(config);
  web = await preview({ ...config, preview: { host: "127.0.0.1", port: 0 } });
  const origin = `http://127.0.0.1:${web.httpServer.address().port}`;

  browser = await chromium.launch();
  const page = await browser.newPage();
  const [status] = await Promise.all([
    page.waitForResponse(`${origin}/api/catalogue/status`, { timeout: 5000 }),
    page.goto(origin),
  ]);
  assert.equal(status.status(), 200);
  assert.deepEqual(await status.json(), { enabled: false, tmdb: false });
  assert.ok(catalogueRequests.includes("/api/catalogue/status"), "status must reach the standalone API");
  await page.getByRole("heading", { name: "This Week’s Picks For You" }).waitFor();
  assert.equal(await page.title(), "WatchQuest");
});
