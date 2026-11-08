import { fileURLToPath } from "node:url";

import arraybuffer from "vite-plugin-arraybuffer";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [arraybuffer()],
  resolve: { alias: { "@": fileURLToPath(new URL("src", import.meta.url)) } },
  test: { include: ["test/**/*.test.ts", "test/**/*.test.tsx"] },
});
