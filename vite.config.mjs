import { defineConfig, loadEnv } from "vite";
import process from "node:process";
import { catalogueMiddleware } from "./server/catalogue.mjs";

export default defineConfig(({ mode }) => {
  const middleware = catalogueMiddleware({
    ...loadEnv(mode, process.cwd(), ["CATALOGUE_", "AVAILABILITY_"]),
    ...process.env,
  });
  return {
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
