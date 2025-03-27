import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), crx({ manifest })],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        content: "src/content-script/main.tsx",
        "service-worker": "src/service-worker.ts",
        offscreen: "src/offscreen.ts",
      },
      output: {
        entryFileNames: (chunk) => {
          return chunk.name === "content" ? "content.js" : "[name].js";
        },
        chunkFileNames: "assets/[name].[hash].js",
        assetFileNames: "assets/[name].[ext]",
      },
    },
    sourcemap: true,
    minify: false,
  },
});
