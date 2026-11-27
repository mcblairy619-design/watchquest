import { defineConfig, loadEnv } from "vite";
import { resolve } from "node:path";
import process from "node:process";
import { catalogueMiddleware } from "./apps/api/catalogue-http.mjs";
import webConfig from "./apps/web/vite.config.mjs";

// Keep the original one-command local workflow at the repository root.
export default defineConfig((configEnv) => {
  const config = webConfig(configEnv);
  if (configEnv.command === "build" || config.server?.proxy) return config;

  const middleware = catalogueMiddleware(
    {
      ...loadEnv(configEnv.mode, config.envDir, ["CATALOGUE_", "AVAILABILITY_"]),
      ...process.env,
    },
    undefined,
    resolve(config.envDir, ".movieofthenight-usage.json"),
  );
  return {
    ...config,
    plugins: [
      {
        name: "stream-guide-catalogue",
        configureServer(server) {
          server.middlewares.use(middleware);
        },
        configurePreviewServer(server) {
          server.middlewares.use(middleware);
        },
      },
    ],
  };
});
