import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";

/**
 * GitHub Pages serves `404.html` for unknown paths. Copying the SPA entry point
 * there lets deep links such as /voting-dapp/polls/12 load and route correctly.
 */
function spaFallback() {
  return {
    name: "spa-404-fallback",
    apply: "build",
    closeBundle() {
      const index = resolve(__dirname, "dist/index.html");
      if (existsSync(index)) copyFileSync(index, resolve(__dirname, "dist/404.html"));
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const base = env.VITE_BASE_PATH || "/voting-dapp/";

  return {
    base,
    plugins: [react(), spaFallback()],
    server: { port: 5173, open: false },
    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom", "react-router-dom"],
            ethers: ["ethers"],
          },
        },
      },
    },
  };
});
