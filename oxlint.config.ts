import { defineConfig } from "oxlint";
import core from "ultracite/oxlint/core";
import react from "ultracite/oxlint/react";
import shadcn from "ultracite/oxlint/shadcn";
import tanstack from "ultracite/oxlint/tanstack";

export default defineConfig({
  extends: [core, react, tanstack, shadcn],
  ignorePatterns: [...(core.ignorePatterns ?? []), "src/routeTree.gen.ts"],
  jsPlugins: shadcn.jsPlugins,
  overrides: [
    {
      // Satori draws the share card from inline styles alone, in the card's own hex palette.
      files: ["src/lib/og.server.tsx"],
      rules: {
        "shadcn/no-inline-styles": "off",
        "shadcn/no-raw-colors": "off",
      },
    },
    {
      // The holo card is bespoke CSS (holo-card.css): its classes live there, and the score,
      // the host's size and the QR mask reach it as custom properties.
      files: ["src/components/holo-card/**"],
      rules: {
        "shadcn/no-inline-styles": "off",
        "shadcn/no-unknown-classes": ["error", { allow: ["holo", "holo-*"] }],
      },
    },
    {
      // The mark is the card in miniature: its fills are the card's ink, not theme tokens.
      files: ["src/components/logo.tsx"],
      rules: { "shadcn/no-raw-colors": "off" },
    },
    {
      files: ["src/components/ui/**"],
      // Stock shadcn source: keep it diffable against the registry.
      rules: {
        "eslint/func-style": "off",
        "react/function-component-definition": "off",
        "import/consistent-type-specifier-style": "off",
        "shadcn/no-arbitrary-values": "off",
        "shadcn/no-restyle": "off",
        "shadcn/require-static-classes": "off",
      },
    },
  ],
});
