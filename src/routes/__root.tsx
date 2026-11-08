/// <reference types="vite/client" />
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";

import css from "@/styles/globals.css?url";

const DESCRIPTION =
  "Score how much of a website a person chose, from 0 for a pure AI template to 100 when every choice was made on purpose, with the evidence and the fixes.";

const Document = ({ children }: { children: ReactNode }) => (
  <html lang="en">
    <head>
      <HeadContent />
    </head>
    <body>
      <TooltipProvider>{children}</TooltipProvider>
      <Scripts />
    </body>
  </html>
);

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      {
        name: "theme-color",
        media: "(prefers-color-scheme: light)",
        content: "#ffffff",
      },
      {
        name: "theme-color",
        media: "(prefers-color-scheme: dark)",
        content: "#101010",
      },
      { title: "humantaste" },
      { name: "description", content: DESCRIPTION },
      { property: "og:site_name", content: "humantaste" },
    ],
    links: [
      { rel: "stylesheet", href: css },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
    ],
  }),
  component: () => (
    <Document>
      <Outlet />
    </Document>
  ),
});
