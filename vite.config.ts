import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/tanstack/vite";

const allowedHosts = ["photos.alazab.com"];

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    plugins: [mcpPlugin()],
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
