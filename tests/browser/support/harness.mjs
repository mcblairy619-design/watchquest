import { mkdtemp, rm } from "node:fs/promises";
import { once } from "node:events";
import { createServer as createHttpServer } from "node:http";
import { after, before, test } from "node:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { chromium } from "playwright-core";
import { createServer } from "vite";

let url = process.env.WATCHQUEST_TEST_URL;
let server;
let httpServer;
let browser;
let cacheDir;

before(async () => {
  if (!url) {
    // Never use real provider credentials in the test server.
    process.env.AVAILABILITY_FREE_PLAN = "no";
    process.env.CATALOGUE_USE = "disabled";
    cacheDir = await mkdtemp(join(tmpdir(), "watchquest-browser-"));
    // Let the OS allocate a free port instead of Vite's default port.
    httpServer = createHttpServer();
    httpServer.listen(0, "127.0.0.1");
    await once(httpServer, "listening");
    url = `http://127.0.0.1:${httpServer.address().port}/`;
    server = await createServer({
      mode: "test",
      cacheDir,
      server: {
        middlewareMode: true,
        hmr: { server: httpServer },
        watch: null,
      },
    });
    httpServer.on("request", server.middlewares);
  }
  browser = await chromium.launch();
});

after(async () => {
  try {
    await browser?.close();
  } finally {
    try {
      await server?.close();
    } finally {
      if (httpServer?.listening) {
        const closed = once(httpServer, "close");
        httpServer.close();
        await closed;
      }
      if (cacheDir) await rm(cacheDir, { recursive: true, force: true });
    }
  }
});

export function browserTest(name, run) {
  test(name, async (t) => {
    const newPage = async (options) => {
      const context = await browser.newContext(options);
      t.after(() => context.close());
      return context.newPage();
    };
    await run({ newPage, url });
  });
}
