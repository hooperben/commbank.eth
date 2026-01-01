import path from "path";
import tailwindcss from "@tailwindcss/vite";

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), nodePolyfills()],
  optimizeDeps: {
    exclude: ["@aztec/bb.js", "@noir-lang/noir_js"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      pino: "pino/browser.js",
    },
    dedupe: ["react", "react-dom"],
  },
  // handy for ngrok
  // server: {
  //   allowedHosts: ["*],
  // },
});
