import { chromium } from "playwright-core";
import type { Browser, Page } from "playwright-core";

import { COLLECT } from "./collect";
import { resolvesPublic } from "./net-guard";
import type { RenderedFacts, RenderedFont } from "./types";

const CHROME_PATH =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const NAV_TIMEOUT_MS = 15_000;
const SETTLE_MS = 1200;
/** Slow trackers and chat widgets can hold the load event forever; the page is usually painted long before. */
const LOAD_GRACE_MS = 8000;
export const VIEWPORT = { width: 1440, height: 900 };
const FONT_SAMPLE_SELECTOR = "h1, h2, h3, h4, p, li, a, button, label, span";
const FONT_SAMPLE_LIMIT = 160;

let browserPromise: Promise<Browser> | null = null;

const launchBrowser = async (): Promise<Browser> => {
  try {
    return await chromium.launch({
      executablePath: CHROME_PATH,
      headless: true,
    });
  } catch (error) {
    browserPromise = null;
    throw error;
  }
};

const getBrowser = (): Promise<Browser> => {
  if (!browserPromise) {
    browserPromise = launchBrowser();
  }
  return browserPromise;
};

export const closeBrowser = async (): Promise<void> => {
  const pending = browserPromise;
  browserPromise = null;
  if (pending) {
    const browser = await pending;
    await browser.close();
  }
};

const settle = async (
  page: Page,
  state: "load" | "networkidle",
  timeout: number
): Promise<void> => {
  try {
    await page.waitForLoadState(state, { timeout });
  } catch {
    // Never settling is fine: read the page as it stands.
  }
};

/** Asks Chrome which font files actually painted the text, so next/font aliases and fallbacks resolve to real names. */
const collectFonts = async (
  page: Page,
  selector: string
): Promise<RenderedFont[]> => {
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send("DOM.enable");
    await cdp.send("CSS.enable");
    const { root } = await cdp.send("DOM.getDocument", { depth: 0 });
    const { nodeIds } = await cdp.send("DOM.querySelectorAll", {
      nodeId: root.nodeId,
      selector,
    });
    const totals = new Map<string, RenderedFont>();
    for (const nodeId of nodeIds.slice(0, FONT_SAMPLE_LIMIT)) {
      try {
        // oxlint-disable-next-line no-await-in-loop -- one CDP query at a time keeps up to 160 node lookups from flooding the session
        const { fonts } = await cdp.send("CSS.getPlatformFontsForNode", {
          nodeId,
        });
        for (const font of fonts) {
          const entry = totals.get(font.familyName) ?? {
            family: font.familyName,
            glyphs: 0,
            webfont: font.isCustomFont,
          };
          entry.glyphs += font.glyphCount;
          totals.set(font.familyName, entry);
        }
      } catch {
        // Nodes can detach while hydration runs; skip them.
      }
    }
    return [...totals.values()].toSorted((a, b) => b.glyphs - a.glyphs);
  } finally {
    await cdp.detach();
  }
};

export interface RenderOutput {
  facts: RenderedFacts;
  html: string;
  screenshot: Buffer;
}

export const renderPage = async (url: string): Promise<RenderOutput> => {
  const browser = await getBrowser();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    colorScheme: "light",
    deviceScaleFactor: 1,
    serviceWorkers: "block",
  });
  try {
    const page = await context.newPage();
    const hostCache = new Map<string, Promise<boolean>>();
    await page.route("**/*", async (route) => {
      const target = new URL(route.request().url());
      if (target.protocol === "data:" || target.protocol === "blob:") {
        await route.continue();
        return;
      }
      if (target.protocol !== "http:" && target.protocol !== "https:") {
        await route.abort("blockedbyclient");
        return;
      }
      let ok = hostCache.get(target.hostname);
      if (!ok) {
        ok = resolvesPublic(target.hostname);
        hostCache.set(target.hostname, ok);
      }
      const allowed = await ok;
      await (allowed ? route.continue() : route.abort("blockedbyclient"));
    });
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: NAV_TIMEOUT_MS,
    });
    await settle(page, "load", LOAD_GRACE_MS);
    await settle(page, "networkidle", 4000);
    await page.waitForTimeout(SETTLE_MS);
    await page.evaluate("document.fonts.ready");

    const collected = (await page.evaluate(COLLECT)) as Omit<
      RenderedFacts,
      "fonts" | "headingFonts"
    >;
    const fonts = await collectFonts(page, FONT_SAMPLE_SELECTOR);
    const headingFonts = await collectFonts(page, "h1, h2");
    const screenshot = await page.screenshot({ type: "jpeg", quality: 70 });
    const html = await page.content();
    return { facts: { ...collected, fonts, headingFonts }, html, screenshot };
  } finally {
    await context.close();
  }
};
