import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import arraybuffer from "vite-plugin-arraybuffer";

/** Packages that load native code or WASM next to their own files: they run from node_modules, never through the bundler. */
const SERVER_NATIVE = [
  "@cf-wasm/og",
  "@cf-wasm/resvg",
  "@cf-wasm/satori",
  "playwright-core",
];

export default defineConfig({
  resolve: { tsconfigPaths: true },
  ssr: { external: SERVER_NATIVE, optimizeDeps: { exclude: SERVER_NATIVE } },
  optimizeDeps: { exclude: SERVER_NATIVE },
  plugins: [
    tailwindcss(),
    tanstackStart(),
    nitro(),
    viteReact(),
    arraybuffer(),
  ],
});
