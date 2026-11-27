import process from "node:process";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

export default defineConfig(({ command }) => {
  const config = {
    root: fileURLToPath(new URL(".", import.meta.url)),
    envDir: fileURLToPath(new URL("../..", import.meta.url)),
  };
  if (command === "build") return config;

  const target = process.env.WATCHQUEST_API_PROXY_TARGET?.trim();
  if (!target) return config;

  const proxy = { "^/api/catalogue(?:[/?]|$)": { target } };
  return { ...config, server: { proxy }, preview: { proxy } };
});
