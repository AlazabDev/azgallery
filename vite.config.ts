import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const allowedHosts = ["photos.alazab.com"];

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    server: {
      allowedHosts,
    },
    preview: {
      allowedHosts,
    },
    optimizeDeps: {
      include: ["@tanstack/react-query", "@tanstack/query-core"],
    },
  },
});
