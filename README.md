# humantaste

Paste a URL, get a 0–100 score for how much of the page a person chose (0 = a pure AI template, 100 = every choice made on purpose), the patterns behind it with evidence and fixes, a prompt for your agent and a share card.

```sh
pnpm install
pnpm exec wrangler d1 migrations apply humantaste --local
pnpm dev                      # http://localhost:3217
pnpm deploy                   # build, then wrangler deploy
pnpm test
pnpm typecheck
pnpm check                    # Ultracite: oxlint (core, react, tanstack, shadcn) and oxfmt
pnpm fix
```

The interface is shadcn (`base-nova`, Base UI, Phosphor icons) on Tailwind v4. Read `DESIGN.md` before any UI change: it says what each token in `src/styles/globals.css` is for and how the pages are laid out.

TanStack Start on Vite, running on Cloudflare Workers through `@cloudflare/vite-plugin`, so `pnpm dev` runs in workerd too. Bindings live in `wrangler.jsonc`: D1 (`DB`) holds scans, R2 (`SHOTS`) holds screenshots, Browser Rendering (`BROWSER`) renders pages, and `SCAN_LIMITER` rate-limits fresh scans. In dev, D1 and R2 are local and the browser is remote, so a Cloudflare login is needed. After changing `wrangler.jsonc`, run `pnpm cf-typegen`.

`TYPESAFE_API_KEY` is optional: put it in `.dev.vars` for dev and set it with `wrangler secret put TYPESAFE_API_KEY` in production. Share pages emit absolute OG image URLs on `https://humantaste.xyz`; set `VITE_SITE_URL` to point them elsewhere.

## Routes

- `/scan/<host[/path]>`: the report. The URL is normalised (scheme, `www.` and trailing slash dropped) and redirects to its canonical form. Server-rendered from the stored scan; a missing scan streams in.
- `/og/<host>.png`: the 1200×630 share card, drawn from the stored scan (satori + resvg), so it can't be forged with query params. It never starts a scan: a page with no score gets a 404 and no `og:image`.
- `/shot/<host>.jpg`: what the renderer saw.
- `/api/report/<host>`: the report as JSON.

## How a scan works

1. `src/lib/fetch-page.ts` fetches the HTML and up to 12 stylesheets, with SSRF guards on every hop (`src/lib/net-guard.ts`).
2. `src/lib/render.ts` renders at 1440×900 in light mode in a Browser Rendering session; `src/lib/collect.ts` measures in the page (gradients, shadows, blur, pills, cards, emoji, fonts that painted via CDP).
3. `src/lib/signals.ts` turns measurements into 34 weighted tells, each with evidence and a fix, and credits deliberate choices (a webfont that isn't on Google Fonts).
4. `src/lib/judge.server.ts` asks Jev for one visual read of the screenshot only. It becomes a ×0.5–×1.5 weight on the tell points. It never adds a tell, so a page with none stays at 100. Without `TYPESAFE_API_KEY` the weight is ×1.
5. `score = 100 / (1 + (points / 30)²)`: flat near 100, steep once tells stack up.

Each site keeps its latest scan until someone presses "Score again", keyed by the normalised target. A scan from an older methodology version (`METHODOLOGY` in `signals.ts`) counts as missing. Bump it whenever a check or weight changes. If no browser can be had, the scan fails and nothing is stored. A degraded scan (the render broke after launch, the page's document was missing or answered 400 or above, or the Jev call threw) is shown to the visitor but never stored, so it can't replace a full score. When the direct fetch was refused too, the scan fails with that refusal. A new Jev read is skipped when the screenshot is byte for byte the previous one. Outside dev, new scans are limited to 3 per client per minute, 30 per client per day and 500 per day for the whole site (`src/lib/quota.server.ts`, UTC days); an IPv6 client counts as its /64. A scan that fails gets its quota back from both scopes; a degraded scan keeps its charge. Only one scan per site runs at a time, in dev too: each site has a `SiteScan` Durable Object (`src/lib/site-scan.server.ts`) that holds the running scan, so anyone who arrives during it waits for the same report at no cost, and it finishes even if the visitor who started it leaves. A Cloudflare firewall rule on the zone also blocks any IP above 100 requests per 10 seconds.
