import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        pricing: resolve(__dirname, "pricing/index.html"),
        privacy: resolve(__dirname, "privacy/index.html"),
        register: resolve(__dirname, "register/index.html"),
        registerConfirm: resolve(__dirname, "register/confirm/index.html"),
        support: resolve(__dirname, "support/index.html"),
        terms: resolve(__dirname, "terms/index.html"),
      },
    },
  },
});
