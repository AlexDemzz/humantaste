import { launch } from "@cloudflare/playwright";
import type { Browser, Page, Response } from "@cloudflare/playwright";
import { env } from "cloudflare:workers";

import { COLLECT } from "./collect";
import {
  isConsentManagerHost,
  REMOVE_CONSENT_BANNERS,
} from "./consent-banners";
import { withinDeadline } from "./deadline";
import { errorMessage } from "./errors";
import { CSS_LIMIT, MAX_STYLESHEETS } from "./fetch-page";
import type { Stylesheet } from "./fetch-page";
import { resolvesPublic } from "./net-guard";
import type { RenderedFacts, RenderedFont } from "./types";

const NAV_TIMEOUT_MS = 15_000;
const SETTLE_MS = 1200;
/** Slow trackers and chat widgets can hold the load event forever; the page is usually painted long before. */
const LOAD_GRACE_MS = 8000;
export const VIEWPORT = { width: 1440, height: 900 };
const FONT_SAMPLE_SELECTOR = "h1, h2, h3, h4, p, li, a, button, label, span";
const FONT_SAMPLE_LIMIT = 160;
const FONT_SAMPLE_BUDGET_MS = 8000;
const RENDER_BUDGET_MS = 55_000;

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

/**
 * Asks Chrome which font files actually painted the text, so next/font aliases and fallbacks resolve to real names.
 * A page busy animating answers each query slowly, so the sample ends when its budget does.
 */
export const collectFonts = async (
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
    const deadline = Date.now() + FONT_SAMPLE_BUDGET_MS;
    for (const nodeId of nodeIds.slice(0, FONT_SAMPLE_LIMIT)) {
      if (Date.now() >= deadline) {
        break;
      }
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
  /** Null when the navigation produced no response for the main document. */
  documentStatus: number | null;
  finalUrl: string;
  facts: RenderedFacts;
  html: string;
  /** What the browser loaded, for when the site refused to serve the stylesheets to us directly. */
  stylesheets: Stylesheet[];
  screenshot: Buffer;
}

/** No browser could be had: the scan must not be stored, or the site would keep a static-only score. */
export class BrowserUnavailableError extends Error {
  override name = "BrowserUnavailableError";
}

const launchBrowser = async (): Promise<Browser> => {
  try {
    return await launch(env.BROWSER);
  } catch (error) {
    console.error(
      JSON.stringify({
        message: "browser launch failed",
        error: errorMessage(error, String(error)),
      })
    );
    throw new BrowserUnavailableError(
      "Scoring is busy right now. Try again in a minute.",
      { cause: error }
    );
  }
};

const readStylesheet = async (
  response: Response
): Promise<Stylesheet | null> => {
  try {
    const text = await response.text();
    return { href: response.url(), text: text.slice(0, CSS_LIMIT) };
  } catch {
    return null;
  }
};

/**
 * A page animating on its main thread can take minutes to answer the reads that follow, so its scripts stop once it has
 * painted. The CDP session stays attached because the override ends with it.
 */
const freezeScripts = async (page: Page): Promise<void> => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setScriptExecutionDisabled", { value: true });
};

const readPage = async (
  browser: Browser,
  url: string
): Promise<RenderOutput> => {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    colorScheme: "light",
    deviceScaleFactor: 1,
    serviceWorkers: "block",
  });
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
    if (
      isConsentManagerHost(target.hostname) &&
      !route.request().isNavigationRequest()
    ) {
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
  const stylesheets: Promise<Stylesheet | null>[] = [];
  page.on("response", (response) => {
    if (
      response.request().resourceType() !== "stylesheet" ||
      stylesheets.length >= MAX_STYLESHEETS
    ) {
      return;
    }
    stylesheets.push(readStylesheet(response));
  });
  const mainDocument = await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: NAV_TIMEOUT_MS,
  });
  await settle(page, "load", LOAD_GRACE_MS);
  await settle(page, "networkidle", 4000);
  await page.waitForTimeout(SETTLE_MS);
  await freezeScripts(page);
  await page.evaluate(REMOVE_CONSENT_BANNERS);
  await page.evaluate("document.fonts.ready");

  const collected = (await page.evaluate(COLLECT)) as Omit<
    RenderedFacts,
    "fonts" | "headingFonts"
  >;
  const fonts = await collectFonts(page, FONT_SAMPLE_SELECTOR);
  const headingFonts = await collectFonts(page, "h1, h2");
  const screenshot = await page.screenshot({ type: "jpeg", quality: 70 });
  const html = await page.content();
  const loaded = await Promise.all(stylesheets);
  return {
    documentStatus: mainDocument?.status() ?? null,
    finalUrl: page.url(),
    facts: { ...collected, fonts, headingFonts },
    html,
    stylesheets: loaded.filter((sheet): sheet is Stylesheet => sheet !== null),
    screenshot,
  };
};

export const renderPage = async (url: string): Promise<RenderOutput> => {
  const browser = await launchBrowser();
  try {
    return await withinDeadline(
      readPage(browser, url),
      RENDER_BUDGET_MS,
      "the page took too long to read"
    );
  } finally {
    await browser.close();
  }
};
