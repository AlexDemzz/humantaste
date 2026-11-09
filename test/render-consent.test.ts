import { runInNewContext } from "node:vm";

import { launch } from "@cloudflare/playwright";
import { beforeEach, expect, it, vi } from "vitest";

import { COLLECT } from "@/lib/collect";
import { resolvesPublic } from "@/lib/net-guard";
import { renderPage } from "@/lib/render";

vi.mock("cloudflare:workers", () => ({ env: {} }));
vi.mock("@cloudflare/playwright", () => ({ launch: vi.fn() }));
vi.mock("@/lib/net-guard", () => ({ resolvesPublic: vi.fn() }));

const FREEZE_SCRIPTS = "Emulation.setScriptExecutionDisabled";
const MEASURED = "measured";
const ELEMENTS_ON_THE_PAGE = [
  "#onetrust-consent-sdk",
  "#cc-main",
  "#cookie-notice",
];

type RouteHandler = (route: unknown) => Promise<void>;

const removalOf = (selector: string): string => `removed ${selector}`;

const renderWithFakeBrowser = async () => {
  const steps: string[] = [];
  let handleRoute: RouteHandler | undefined;
  const document = {
    fonts: {},
    querySelectorAll: (selectors: string) =>
      ELEMENTS_ON_THE_PAGE.filter((element) =>
        selectors.split(",").includes(element)
      ).map((element) => ({
        remove: () => steps.push(removalOf(element)),
      })),
  };
  const newCDPSession = () =>
    Promise.resolve({
      detach: () => Promise.resolve(),
      send: (method: string) => {
        steps.push(method);
        return Promise.resolve({ fonts: [], nodeIds: [], root: { nodeId: 1 } });
      },
    });
  const page = {
    content: () => Promise.resolve("<html></html>"),
    context: () => ({ newCDPSession }),
    evaluate: (script: string) => {
      if (script === COLLECT) {
        steps.push(MEASURED);
      } else {
        runInNewContext(script, { document });
      }
      return Promise.resolve({});
    },
    goto: () => Promise.resolve(null),
    on: () => {},
    route: (_pattern: string, handler: RouteHandler) => {
      handleRoute = handler;
      return Promise.resolve();
    },
    screenshot: () => Promise.resolve(Buffer.from("shot")),
    url: () => "https://example.com/",
    waitForLoadState: () => Promise.resolve(),
    waitForTimeout: () => Promise.resolve(),
  };
  vi.mocked(launch).mockResolvedValue({
    close: () => Promise.resolve(),
    newContext: () => Promise.resolve({ newPage: () => Promise.resolve(page) }),
  } as never);

  await renderPage("https://example.com/");

  const request = async (url: string, isNavigation = false) => {
    const route = {
      abort: vi.fn(() => Promise.resolve()),
      continue: vi.fn(() => Promise.resolve()),
      request: () => ({
        isNavigationRequest: () => isNavigation,
        url: () => url,
      }),
    };
    await handleRoute?.(route);
    return route;
  };
  return { request, steps };
};

beforeEach(() => {
  vi.mocked(resolvesPublic).mockReset();
  vi.mocked(resolvesPublic).mockResolvedValue(true);
});

it("never loads a consent manager's script", async () => {
  const { request } = await renderWithFakeBrowser();
  const route = await request("https://cdn.cookielaw.org/consent.js");
  expect(route.abort).toHaveBeenCalledWith("blockedbyclient");
  expect(route.continue).not.toHaveBeenCalled();
});

it("loads the site's own scripts", async () => {
  const { request } = await renderWithFakeBrowser();
  const route = await request("https://example.com/app.js");
  expect(route.continue).toHaveBeenCalledOnce();
  expect(route.abort).not.toHaveBeenCalled();
});

it("can still score a page served from a consent manager's host", async () => {
  const { request } = await renderWithFakeBrowser();
  const route = await request("https://app.termly.io/", true);
  expect(route.continue).toHaveBeenCalledOnce();
  expect(route.abort).not.toHaveBeenCalled();
});

it("removes a banner once scripts are frozen and before the page is measured", async () => {
  const { steps } = await renderWithFakeBrowser();
  expect(steps.slice(0, 3)).toEqual([
    FREEZE_SCRIPTS,
    removalOf("#onetrust-consent-sdk"),
    MEASURED,
  ]);
});

it.each(["#cc-main", "#cookie-notice"])(
  "keeps a site's own %s, an id too common to mean a banner",
  async (element) => {
    const { steps } = await renderWithFakeBrowser();
    expect(steps).not.toContain(removalOf(element));
  }
);
