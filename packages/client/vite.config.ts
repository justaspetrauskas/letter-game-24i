import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const SERVER_TARGET = "http://localhost:4000";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/socket.io": { target: SERVER_TARGET, ws: true },
      "/api": { target: SERVER_TARGET },
      "/health": { target: SERVER_TARGET },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
