# humantaste

Find out how human your website looks. Paste a URL and get a score out of 100: 0 is a pure AI template, 100 shows no sign of one.

Try it at [humantaste.xyz](https://humantaste.xyz).

Each report gives you:

- the score, on a card you can share
- the patterns behind the score, each with its evidence and a fix
- a prompt to hand your agent, written from what this scan found
- skills that give your agent better taste, [added by the community](#add-a-skill)

A default is not a crime: Inter is a great face and shadcn is a great start. The score only says how many choices were left to the generator.

## How the score works

1. **Fetch.** humantaste reads the page's HTML and up to 12 stylesheets, with SSRF guards on every hop.
2. **Render.** The page opens in headless Chrome at 1440×900 in light mode, and the scan measures what painted: gradients, shadows, blur, pills, cards, emoji and the fonts in use.
3. **Find the patterns.** Each pattern AI generators reach for has a weight in points and comes with its evidence and a fix. A pattern found takes its weight off, scaled by how strongly it shows. The three gradient patterns (purple washes, decorative gradients, halos) often read the same gradient, so together they take 16 points at most.
4. **Look at it.** Jev gets one look at the screenshot and gives back up to 10 points when the page looks hand-designed. It can never take points off or add a pattern.
5. **Score.** `score = 100 − the patterns' points + the points given back`, kept between 0 and 100. A webfont that isn't on Google Fonts gives 5 points back. Every number is in the report, so the sum can be redone by hand.

## Add a skill

The "Skills that give your agent taste" section on every report is a list anyone can add to. It lives in one file, [`src/lib/data/taste-skills.json`](src/lib/data/taste-skills.json), and a skill gets in through a pull request.

Skills are listed when they help an agent make better design, motion or writing choices. The repository has to be public on GitHub.

1. Fork the repository and run `pnpm install` (Node 22.18 or newer).
2. Add your skill anywhere in the file. Leave `stars` at `0`:

   ```json
   {
     "name": "Your skill, by you",
     "what": "One sentence on what it changes in your agent's work.",
     "href": "https://github.com/you/your-skill",
     "stars": 0
   }
   ```

3. Run `pnpm skills:stars` to fetch the real counts from GitHub. If GitHub rate-limits you, set `GITHUB_TOKEN` and run it again.
4. Run `pnpm test`, which checks that each entry has a name and a sentence, links to GitHub and appears once.
5. Open the pull request.

The section shows five skills per page, most GitHub stars first, with ties in name order. The order in the file doesn't matter. Star counts are refreshed from GitHub on every deploy, so a count typed by hand won't last. `href` can point to a folder inside a larger repository, but the stars shown are those of the whole repository.

## Run it locally

```sh
pnpm install
pnpm exec wrangler d1 migrations apply humantaste --local
pnpm dev                      # http://localhost:3217
```

In dev, D1 and R2 are local and the browser is remote, so you need a Cloudflare login. `TYPESAFE_API_KEY` is optional: without it, Jev gives no points back, so scores run up to 10 points lower than in production. Put it in `.dev.vars`.

| Command | What it does |
| --- | --- |
| `pnpm test` | Runs the tests |
| `pnpm typecheck` | Checks types |
| `pnpm check` | Ultracite: oxlint (core, react, tanstack, shadcn) and oxfmt |
| `pnpm fix` | Applies the fixes Ultracite can make |
| `pnpm skills:stars` | Refreshes the skills' GitHub stars |
| `pnpm cf-typegen` | Regenerates the bindings' types after a `wrangler.jsonc` edit |
| `pnpm deploy` | Refreshes the stars, builds, then runs `wrangler deploy` |

In production, set the key with `wrangler secret put TYPESAFE_API_KEY`. Share pages emit absolute image URLs on `https://humantaste.xyz`; set `VITE_SITE_URL` to point them elsewhere.

## Stack

TanStack Start on Vite, running on Cloudflare Workers through `@cloudflare/vite-plugin`, so `pnpm dev` runs in workerd too. The interface is shadcn (`base-nova`, Base UI, Phosphor icons) on Tailwind v4. Read [`DESIGN.md`](DESIGN.md) before any UI change: it says what each token in `src/styles/globals.css` is for and how the pages are laid out.

| Binding        | Service           | Holds or does             |
| -------------- | ----------------- | ------------------------- |
| `DB`           | D1                | Scans                     |
| `SHOTS`        | R2                | Screenshots               |
| `BROWSER`      | Browser Rendering | Renders pages             |
| `SITE_SCAN`    | Durable Objects   | One running scan per site |
| `SCAN_LIMITER` | Rate limiting     | Limits fresh scans        |

The scan's code, in order:

- `src/lib/fetch-page.ts` and `src/lib/net-guard.ts`: the fetch and its SSRF guards
- `src/lib/render.ts` and `src/lib/collect.ts`: the render and what it measures
- `src/lib/signals.ts`: the patterns, their weights and fixes
- `src/lib/judge.server.ts`: Jev's look at the screenshot
- `src/lib/score.ts`: the score and the card tiers

## Routes

- `/scan/<host[/path]>`: the report. The URL is normalised (scheme, `www.` and trailing slash dropped) and redirects to its canonical form. It is server-rendered from the stored scan; a missing scan runs in the browser's request. `?page=2` turns the skills list.
- `/og/<host>.png`: the 1200×630 share card, drawn from the stored scan (satori + resvg), so it can't be forged with query params. It never starts a scan: a page with no score gets a 404 and no `og:image`.
- `/shot/<host>.jpg`: what the renderer saw.
- `/api/report/<host>`: the report as JSON.

## What a scan keeps

- **Storage.** Each site keeps its latest scan, keyed by the normalised target, until someone presses "Score again".
- **Methodology.** A scan from an older version (`METHODOLOGY` in `signals.ts`) counts as missing. Bump it whenever a check or weight changes.
- **Failed scans.** If no browser can be had, the scan fails and nothing is stored. When the direct fetch was refused too, the scan fails with that refusal.
- **Degraded scans.** If the render broke after launch, the page's document was missing or answered 400 or above, or the Jev call threw, the scan is never stored, so it can't replace a full score. Without a render there is no score to show: the visitor is told the site couldn't be opened. When only the Jev call failed, the visitor sees the scan with no points given back.
- **Jev.** A new read is skipped when the screenshot is byte for byte the previous one.
- **One at a time.** Each site has a `SiteScan` Durable Object (`src/lib/site-scan.server.ts`), in dev too. Anyone who arrives during a scan waits for the same report at no cost, and the scan finishes even if the visitor who started it leaves.
- **Limits.** Outside dev, new scans are limited to 3 per client per minute, 30 per client per day and 3000 per day for the whole site (`src/lib/quota.server.ts`, UTC days). An IPv6 client counts as its /64. A failed scan gets its quota back from both scopes; a degraded scan keeps its charge. A Cloudflare firewall rule on the zone also blocks any IP above 100 requests per 10 seconds.

## License

[MIT](LICENSE)
