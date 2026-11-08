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
      // Stock shadcn item: ItemGroup is a div with role="list".
      files: ["src/components/ui/item.tsx"],
      rules: { "jsx-a11y/prefer-tag-over-role": "off" },
    },
    {
      // Stock shadcn input group: role="group" divs, and an addon click that
      // only focuses the input, which the keyboard already reaches by Tab.
      files: ["src/components/ui/input-group.tsx"],
      rules: {
        "jsx-a11y/click-events-have-key-events": "off",
        "jsx-a11y/no-noninteractive-element-interactions": "off",
        "jsx-a11y/prefer-tag-over-role": "off",
      },
    },
    {
      // Stock shadcn code block: the scrollable <pre> takes focus so the keyboard can scroll it,
      // line numbers start from an inline counter-reset, and the copy button chains its promise.
      files: ["src/components/ui/code-block.tsx"],
      rules: {
        "eslint/no-empty-function": "off",
        "eslint/no-use-before-define": "off",
        "eslint/require-unicode-regexp": "off",
        "jsx-a11y/no-noninteractive-tabindex": "off",
        "promise/prefer-await-to-then": "off",
        "shadcn/no-inline-styles": "off",
      },
    },
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
