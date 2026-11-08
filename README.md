# humantaste

Paste a URL, get a 0–100 score for how much of the page a person chose (0 = a pure AI template, 100 = every choice made on purpose), the patterns behind it with evidence and fixes, a prompt for your agent and a share card.

```sh
pnpm install
TYPESAFE_API_KEY=… pnpm dev   # http://localhost:3217, the key is optional
pnpm test
pnpm typecheck
pnpm check                    # Ultracite: oxlint (core, react, tanstack, shadcn) and oxfmt
pnpm fix
```

The interface is shadcn (`base-nova`, Base UI, Phosphor icons) on Tailwind v4. Read `DESIGN.md` before any UI change: it says what each token in `src/styles/globals.css` is for and how the pages are laid out.

TanStack Start on Vite and Nitro. Rendering uses the local Chrome at `/Applications/Google Chrome.app` (override with `CHROME_PATH`). Share pages emit absolute OG image URLs on `https://humantaste.xyz`; set `VITE_SITE_URL` to point them elsewhere.

## Routes

- `/scan/<host[/path]>`: the report. The URL is normalised (scheme, `www.` and trailing slash dropped) and redirects to its canonical form. Server-rendered from the stored scan; a missing scan streams in.
- `/og/<host>.png`: the 1200×630 share card, drawn from the stored scan (satori + resvg), so it can't be forged with query params.
- `/shot/<host>.jpg`: what the renderer saw.
- `/api/report/<host>`: the report as JSON.

## How a scan works

1. `src/lib/fetch-page.ts` fetches the HTML and up to 12 stylesheets, with SSRF guards on every hop (`src/lib/net-guard.ts`).
2. `src/lib/render.ts` renders at 1440×900 in light mode; `src/lib/collect.ts` measures in the page (gradients, shadows, blur, pills, cards, emoji, fonts that painted via CDP).
3. `src/lib/signals.ts` turns measurements into 34 weighted tells, each with evidence and a fix, and credits deliberate choices (a webfont that isn't on Google Fonts).
4. `src/lib/judge.server.ts` asks Jev for one visual read of the screenshot only. It becomes a ×0.5–×1.5 weight on the tell points. It never adds a tell, so a page with none stays at 100. Without `TYPESAFE_API_KEY` the weight is ×1.
5. `score = 100 / (1 + (points / 30)²)`: flat near 100, steep once tells stack up.

Scans are stored for 24 h in `.cache/scans` (`SCAN_CACHE_DIR`), keyed by the normalised target and the methodology version (`METHODOLOGY` in `signals.ts`). Bump it whenever a check or weight changes. At most 2 renders run at once; fresh scans are limited to 8 per IP per 10 minutes outside dev.
