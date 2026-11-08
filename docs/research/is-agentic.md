# Is Agentic (is-agentic.com): product, scoring logic, architecture

Research date: 2026-11-07. Purpose: reference architecture for **Slop Score** (scan a URL, score how AI-template-looking it is, 0 = worst, 100 = best, `https://host/scan/example.com`, TanStack Start).

## TL;DR

- **Is Agentic** = https://is-agentic.com, launched about 2026-08-20 by **Vercel** on top of **Ora** (era labs, ora.ai). Ora runs about 130 checks. Vercel built the UI, storage, regrouping and score formula.
- **The web app's source is not public.** `github.com/vercel-labs/is-agentic` returns 404 to an unauthenticated GitHub request, and `gh repo view` can't resolve it either. The npm CLI (`is-agentic@1.0.1`) points at it with `directory: "cli"`, so the repo is private or not yet published. **However, the whole scoring function ships in the client JS bundle**, and every report page embeds the raw Ora result in its RSC payload. I recovered the exact formula from the bundle and checked it against 4 real reports. Every reconstruction matched.
- Score = **Essential pool (80) + Recommended pool (20) + Bonus (≤ 5, additive)**, capped at 100. Every check in a pool weighs the same. Partial checks get proportional credit. N/A checks are dropped from the denominator.
- URL scheme `/scan/<host[/path][?query]>`. The page is SSR'd from the stored latest report. A client component opens an SSE stream (`/api/scan/stream?target=…`) to run or refresh the scan live. Reports older than 6 h trigger a background refresh. A "Rescan" button forces a fresh scan.
- Deterministic checks produce the number. LLMs are used for (a) the relevance pass that marks checks N/A, (b) the site-type classifier, (c) the one-line summary, and (d) an "observed agent journey" (Claude Haiku via the Claude Agent SDK). **The journey is explicitly kept out of the score.**

---

## 1. What it is, who made it, popularity

| Item | Value |
| --- | --- |
| URL | https://is-agentic.com (report pages: `https://is-agentic.com/scan/vercel.com`) |
| Makers | Vercel (UI, storage, score grouping) + Ora / era labs (scanner, per-check scoring). About page: "Is Agentic is built by Vercel on Ora's agent-readiness scoring. Ora runs the technical audit and scores each check; Vercel operates the interface, public report pages, historical storage, and the maturity- and applicability-aware grouping that produces the score shown here." |
| Launch | Ora blog post "We partnered with Vercel to launch is-agentic.com", dated 2026-08-20 (https://ora.ai/blog/is-agentic-with-vercel). MarkTechPost covered it 2026-08-23. |
| Stack (observed) | **Next.js App Router** (Turbopack chunks under `/_next/static/immutable/chunks/`, RSC payload `self.__next_f`, `x-vercel-cache` headers), Tailwind, Geist fonts plus a pixel font for the wordmark, Vercel hosting. Report OG image at `/scan/<target>/opengraph-image` (Next `opengraph-image` route convention). |
| Repo | `vercel-labs/is-agentic` (404 to an unauthenticated request, probably private). Contains `cli/` and `skills/is-agentic/`. |
| Public surfaces | Web UI; npm CLI `npx is-agentic <domain> [--json]` (maintainer `quuu`, created 2026-08-19); read-only JSON API `GET /api/v1/report?url=`; OpenAPI at `/openapi.json`; MCP server (Streamable HTTP) at `/mcp` with 3 read-only tools; an agent skill (`npx skills add vercel-labs/is-agentic`, mirrored in `vercel/vercel-plugin/skills/is-agentic/upstream/SKILL.md`); `llms.txt`; Markdown negotiation (`Accept: text/markdown`) on every content page and report. |
| Pricing | Free. No accounts. |
| Popularity signals | Featured in Raycast Store (`raycast/extensions/extensions/is-agentic`), a third-party Go CLI (`mvanhorn/printing-press-library`, "Two agent-readiness scanners in one terminal"), domainstack.io's external-tools list, and many repos' `AGENTS.md`/`CLAUDE.md` files telling agents to check `https://is-agentic.com/scan/<their-domain>`. The sitemap lists only about 40 curated report URLs. Ora says it scans "16,000+ domains". No public scan count for is-agentic.com. |

### Other projects with similar names (not covered in depth)

- **isitagentready.com** (Cloudflare): a separate 0–100 agent-readiness scanner. The other main player. The printing-press CLI wraps both.
- **ora.ai ranker** (`https://ora.ai/<domain>`): Ora's own grade and score (A–F, importance-weighted). It is the engine under Is Agentic. vercel.com scores 91/A there vs 96 on Is Agentic.
- `@isagentready/cli` (npm, 47 checkpoints), `swarmclawai/agentready`, `erold90/AgentReady`, `huggingface/is-it-agentic-enough`, `emerilansel-jpg/is-agentic`: small repos with the same idea.

---

## 2. Routing, scan triggering, caching, re-runs

### URL scheme

- Home: `/` has a form `<form action="/scan" method="post">` with one `name="url"` text input (`inputMode="url"`, `placeholder="vercel.com"`, `autoComplete="url"`). It works without JS.
- `POST /scan` returns **303** to `/scan/<normalized>`. Observed normalization: scheme stripped, host lowercased, `www.` **kept**, query string **kept and percent-encoded** as part of the path: `url=https://WWW.Vercel.com/?utm=1` → `303 /scan/www.vercel.com%3Futm%3D1`.
- `GET /scan/https://vercel.com/` returns 308 (collapses the scheme). `/scan/VERCEL.com` and `/scan/www.vercel.com` both serve 200, and `<link rel="canonical">` points to the normalized host.
- Path targets are separate reports: `/scan/upstash.com/docs/redis/overall/getstarted` and `/scan/workos.com/docs` are in the sitemap. Skill gotcha: "Targets are exact: `example.com/docs` and `example.com` are separate reports, and a URL with a query string is its own report."
- The client derives the display target from the pathname (bundle module `RouteTargetLabel`):

```js
var p = location.pathname;
var r = p.indexOf("/scan/") === 0 ? p.slice(6) : "";
try {
  r = decodeURIComponent(r);
} catch (e) {}
r = r.replace(/^https?:\/\//i, "").replace(/\/$/, "");
```

### Scan lifecycle (reconstructed from bundle + CLI source)

1. **SSR of `/scan/<target>`** renders the **latest stored completed report** in the initial HTML. Score, every check, evidence and the journey are present without JS. The full raw Ora result object is embedded in the RSC payload.
2. If no report exists, the page mounts `<LiveScan target=…>`. It opens an **EventSource** at `GET /api/scan/stream?target=<url>[&force=1]`. SSE event types (shared by the CLI and the web client):
   - `scan_init` `{checkRoster:[{id,…}], layerMaxScores:{…}}` sets the progress total.
   - `check_start` `{checkId, checkName, layerId, layerName}` drives the progress label "Scanning x · <check name>".
   - `check_complete` `{checkId, checkName, layerId, layerName, status, score, maxScore}` appends to a live list of completed checks.
   - `scan_complete` `{result, servedFromCache?}` carries the full result. The preview score is computed client-side with `buildPreviewReport`.
   - `relevance_assessed` `{naCheckIds:[…], reasons:{id:reason}, score?, grade?}` comes **after** the deterministic results. An LLM relevance pass flips checks to `na` (reason defaults to "Not applicable for this product").
   - `summary_ready` `{agenticSummary}` carries a one-sentence LLM summary.
   - `scan_archived` `{id, result}` means the report is persisted. The client then calls `router.refresh()` to swap to the SSR'd stored version. Without that, it polls `router.refresh()` every 2.5 s up to 24 times.
   - `error` `{error}` shows "This site could not be scored" with a "Try again" button.
3. **Freshness**: the `StaleScanRefresh` component fires a background refresh when the stored report is ≥ 6 h old (`216e5` ms). The page keeps showing the old score while it refreshes:

```js
function isStale(scannedAt, now = Date.now()) {
  const t = Date.parse(scannedAt);
  return !Number.isFinite(t) || now - t >= 216e5;
} // 6 h
isStale(scannedAt) &&
  fetch("/api/scan/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target }),
    keepalive: true,
  });
```

4. **Rescan button** (in the report's "Snapshot <date> · Rescan" line) mounts a headless `<LiveScan force headless refreshOnArchive>` (adds `force=1`). The visible report stays until `scan_archived`, then the page refreshes.
5. **Read API never scans**: `GET /api/v1/report?url=` returns the stored report or `404 report_not_found` (RFC 9457 problem+json with `code` + `resolution`). The **CLI** falls back to the SSE stream when the report is missing, then polls the API up to 5 times with 250 ms × n backoff (`cli/bin/is-agentic.js`, `startMissingScan` / `readReportAfterScan`).
6. **Rate limits**: the public API allows 120 req / IP / 60 s, using IETF `RateLimit-Policy: "public-report";q=120;w=60` + `RateLimit` headers and `Retry-After` on 429. `robots.txt` disallows `/api/scan/`, `/api/history/`, `/api/analytics/` (an unlisted history API exists).
7. HTTP caching: report HTML `cache-control: public, max-age=0, must-revalidate` (`x-vercel-cache: STALE` observed, so ISR/data-cache style). API `private, max-age=0`. HTML and Markdown representations are split with `Vary: Accept`.
8. **Observed agent journey**: `POST /api/journey/<host>?target=` starts or fetches a run, `EventSource /api/journey/stream/<runId>` with `trajectory` and `result` events. It is stored with the report.

---

## 3. The checks

### Layers and volume

The raw Ora result for vercel.com (`contractVersion: "1.38.0"`, `durationMs: 8599`) has **4 layers, 132 checks**:

| Ora layer id  | Name      | # checks | Ora layer score (vercel) |
| ------------- | --------- | -------- | ------------------------ |
| discovery     | Discovery | 16       | 21/21                    |
| accessibility | Access    | 42       | 62/64                    |
| usability     | Usability | 68       | 73/89                    |
| payments      | Payments  | 6        | 0/0                      |

Raw check shape (from the RSC payload):

```json
{"id":"ard-catalog","name":"ARD discovery","tier":"required","score":1,"maxScore":1,
 "status":"pass",            // pass | warning | fail | na | pending
 "details":"ARD catalog valid at /.well-known/ai-catalog.json (spec 1.0) - 6/6 entries …",
 "specUrl":"https://agenticresourcediscovery.org/","maturity":"verified",  // verified | emerging
 "recommendation":"Also serve your catalog at /.well-known/ard.json …",
 "estScoreGain":0, "bonus":true?, "mcpUrl":"…"?, "mcpKind":"product"?, "naReason":"…"?}
```

Top-level result fields: `url, name, grade (A+..F), score, domain, layers, urlKind (domain|mcp|mcp-app), category ("Infrastructure"), finalUrl, siteType, siteTypes{selected, selectionSource:"classifier"|declared, declaration, inferredType, inferenceConfidence, variants{content|business|app|store:{score, layers, states{checkId: req|gated|bonus|emerging}, gatedOut}}}, topFixes[{id,name,layerId,estScoreGain,recommendation}], ctaMessage, gradeColor, agenticSummary, analysisStatus, pendingChecks, scannedAt`.

### How Is Agentic re-buckets Ora's checks

All of this is in bundle module `57555` (`buildPreviewReport`, `isCriticalAccessCheck`, `isExcludedRubricCheck`). Hard-coded sets:

- **Essential (`required`) IDs, 25.** Not all apply to every site: MCP/auth ones only count when that surface is active. `agent-crawler-reachability, agent-friendly-404, ax-accessible-names, ax-document-structure, ax-form-labeling, ax-native-controls, bot-detection, content-no-js, docs-auth-gate, json-error-responses, markdown-negotiation-vary, mcp-auth-mechanism, mcp-error-handling, mcp-oauth-metadata, mcp-pkce-s256, mcp-resource-listing, mcp-server-identity, mcp-transport-modern, mcp-view-csp, mcp-view-domain, oauth-protected-resource, oauth-support, openapi-spec, redirect-hygiene, scoped-permissions`
- **Emerging IDs, 44.** These always become bonus, never required: `llms-txt-*`, `markdown-negotiation`, `webmcp`, `ard-*`, `auth-md-*`, `nlweb-*`, `x402/acp/ap2/ucp/mpp`, `skills-sh-*`, `pricing-md`, `mcp-server-card`, `mcp-well-known-discovery`, and others.
- **Forced-bonus IDs, 29.** Non-emerging checks downgraded to bonus: `wikipedia-presence, npm-sdk-package, sitemap-lastmod, schema-type-breadth, chatgpt-app-listed, ax-tree-injection-safe, …`.
- **Excluded** from the rubric entirely: `robots-agent-user-policy`, `robots-ai-policy-quality`. Note: robots.txt policy is _not scored_. Only real reachability with agent user-agents is.
- **Aliases**: `bot-detection` → `agent-crawler-reachability` (results merged).
- **Everything else** → **recommended**.
- **Surfaces** (decide applicability): `y(id)` maps the id prefix `graphql-` → graphql, `mcp-` → mcp, and set membership → `auth` / `api` / `commerce`. Anything else → `web`. **`web` is always active.** Other surfaces activate only if one of their "evidence" checks scored > 0:

```js
const SURFACE_EVIDENCE = {
  api: [
    "public-api",
    "public-api-docs",
    "openapi-spec",
    "api-catalog-rfc9727",
    "api-schema-analysis",
  ],
  auth: [
    "oauth-support",
    "oauth-protected-resource",
    "agent-auth-www-authenticate",
  ],
  mcp: [
    "mcp-server",
    "mcp-tool-listing",
    "mcp-server-identity",
    "mcp-transport-modern",
  ],
  graphql: ["graphql-schema-completeness"],
  commerce: [
    "acp-support",
    "ap2-support",
    "mpp-support",
    "ucp-support",
    "x402-support",
  ],
};
// + mcp if urlKind is mcp/mcp-app or any check has mcpUrl; + auth if mcpAuthRequired
```

This is how "a marketing site is not penalized for omitting an API": API checks drop out of both pools unless an API is detected.

- **"Critical access" groups** (the report's first section). 4 groups, each with a state of `clear` (avg ≥ 0.85), `mixed` (≥ 0.5) or `blocked`:

| Group | Checks |
| --- | --- |
| Agents can reach the site: "Crawler access and bot defenses." | `agent-crawler-reachability` |
| Core content is available: "Useful content remains accessible without a fragile browser-only path." | `content-no-js`, `docs-auth-gate` |
| Navigation fails safely: "Redirects and missing pages give agents a recoverable path." | `agent-friendly-404`, `redirect-hygiene` |
| Controls are understandable: "Forms and interactive controls expose usable names and structure." | `ax-accessible-names`, `ax-document-structure`, `ax-form-labeling`, `ax-native-controls` |

### How individual checks detect things (from evidence strings)

Detection is described by the `details` text Ora returns. The probe code is Ora's and not public. Representative evidence shows the method:

| Check | Evidence string (vercel.com) → method |
| --- | --- |
| `content-no-js` (Essential) | "Homepage: 1009 chars with H1, but 1.0% content ratio is below the 5% target. 4 of 4 sampled inner pages have text without JavaScript (1 skipped)." → raw-HTML fetch, text length ≥ 500 chars, H1, text/markup ratio ≥ 5%, sample of inner pages. Partial = 0.67. |
| `agent-crawler-reachability` | "Site accessible to 4 agent user-agents (ChatGPT-User, OAI-SearchBot, Claude-User, PerplexityBot)." → fetch with spoofed UAs. |
| `redirect-hygiene` | "No meta-refresh or JavaScript-redirect stubs across 22 checked pages" → HTML pattern scan. |
| `agent-friendly-404` | "Nonexistent paths return HTTP 404 with markdown guidance for agents" → request a random path, check status + body. |
| `ax-document-structure` | "main=true, landmarks=4/4, h1=1, maxHeadingSkip=1" → DOM parse of server HTML. |
| `ax-native-controls` | "180 native controls, 2 non-native div-soup affordances (99% native)". |
| `ax-accessible-names` | "180/180 interactive elements have a computable accessible name (100%)". |
| `page-token-budget` | "All 7 measured pages fit an agent context budget (largest ~4K tokens)". |
| `sitemap` / `sitemap-lastmod` | "Valid sitemap … 9372 entries" / "100% of 500 sampled entries carry lastmod". |
| `json-ld` / `org-schema` / `schema-type-breadth` | JSON-LD parse: Organization with name/description/url/sameAs… |
| `metadata-completeness` | "canonical URL, lang="en", og:image, og:type". |
| `trust-anchors` | "About, Contact, Privacy" pages verified. |
| `llms-txt-*` | existence, formatting (lines, links, size), "All 5 probed llms.txt links resolve". |
| `brand-search-accuracy`, `developer-resource-discoverability` | "vercel.com ranks #2 for 'Vercel Agentic infrastructure platform'" → **search-engine queries** (non-deterministic). |
| `wikipedia-presence`, `npm-sdk-package`, `skills-sh-listed`, `chatgpt-app-listed`, `mcp-registry-listed` | third-party registry lookups. |
| `onboarding-friction` | "Verified live: GET …/tlds/supported answered 200 without credentials … Described but not verified live: free tier…" → mix of live probe + **text extraction** (likely LLM). Partial 0.5. |
| `agentic-search-usecase` | `na` with "in beta … before it counts toward your score". This is a way to ship a check without scoring it. |

Result fractions shown in the UI: `Passed` (≥ 0.999), `Failed` (≤ 0), `Partial (NN%)`.

**Full catalog of the 132 checks** (Ora layer, Ora tier, Ora maxScore, maturity, Is Agentic bucket, surface, vercel status) is in the appendix at the end.

---

## 4. Scoring formula (exact, from the bundle)

De-minified from `buildPreviewReport` (bundle `0a1h9wyly5ifn.js`, module 57555):

```ts
// 1. Per-check fraction from Ora's per-check score
function fraction(c): number | null {
  if (c.status === "na" || c.status === "pending") return null;         // excluded
  if (typeof c.score === "number" && typeof c.maxScore === "number" && c.maxScore > 0)
    return clamp(c.score / c.maxScore, 0, 1);
  return c.status === "pass" ? 1 : c.status === "warning" ? 0.5 : 0;     // fail → 0
}

// 2. Merge duplicates (same id on several MCP surfaces, plus aliases) → average fraction
for (layer of result.layers) for (c of layer.checks) {
  if (EXCLUDED.has(c.id)) continue;
  const f = fraction(c); if (f === null) continue;
  const id = ALIAS.get(c.id) ?? c.id;
  groups[id].fractions.push(f); groups[id].checks.push(c);
}
checks = groups.map(g => ({
  id, tier: REQUIRED.has(id) ? "required" : EMERGING.has(id) ? "emerging" : "recommended",
  bonus: id !== "markdown-negotiation-vary" &&
         (tier === "emerging" || FORCED_BONUS.has(id) || g.checks.some(c => c.bonus === true)),
  fraction: mean(g.fractions),
  details/name: from the worst-scoring occurrence,
  estScoreGain: max(estScoreGain),
}));

// 3. Applicability: keep web checks, checks on active surfaces, and all bonus checks
eligible  = checks.filter(c => surface(c.id) === "web" || activeSurfaces.has(surface(c.id)) || c.bonus);
essential = eligible.filter(c => c.tier === "required"    && !c.bonus);
recommend = eligible.filter(c => c.tier === "recommended" && !c.bonus);
bonusSet  = eligible.filter(c => c.bonus);

// 4. Pools: equal weight inside each pool
const round1 = x => Math.round(10 * x) / 10;
const pool = (cs, pts) => ({ earned: round1((cs.length ? sum(cs.fraction)/cs.length : 0) * pts),
                             available: pts, passing: cs.filter(c => c.fraction >= .999).length, total: cs.length });
E = pool(essential, 80);
R = pool(recommend, 20);
B = round1(Math.min(5, sum(bonusSet.map(c => 0.25 * c.fraction))));   // 0.25 pt per bonus signal, cap 5

// 5. Final
score = (E.total + R.total) > 0 ? Math.round(Math.min(100, E.earned + R.earned + B)) : null;
label = score === null ? "Not enough applicable evidence"
      : score >= 85 ? "Strong technical baseline"
      : score >= 70 ? "Ready with a few material gaps"
      : score >= 50 ? "Important blockers remain"
      :               "Agents are likely to struggle";
```

Notes:

- **No letter grades on Is Agentic.** Ora's own A+..F grade travels in the payload (`grade`, `gradeColor`) but isn't shown. Thresholds are 85 / 70 / 50, reused for per-surface labels: `Strong` / `Ready with gaps` / `Needs work` / `Blocked`. The CLI colors ≥ 80 green, ≥ 60 yellow, else red.
- **Missing data**: N/A or pending → dropped from numerator _and_ denominator. An empty pool earns 0 of its points; for example, if no recommended checks apply, the max is 80 + 5. If both pools are empty, `score = null` with the label "Not enough applicable evidence" (also used for MCP endpoints behind auth).
- **Bonus can't lower the score** and **is capped at 5**: 20 fully-passing bonus signals max it out. So a site at 95 on the pools gets to 100 with 20 bonus signals.
- **Issue ordering** ("Fix these gaps first", top 5): non-bonus checks with fraction < 0.999, sorted by (critical-access first) → (essential before recommended) → (lower fraction first) → (higher `estScoreGain` first).
- **Per-surface scores** ("Public website 98%", "API 92%"…) = mean fraction of non-bonus eligible checks on that surface, ×100, rounded. Captioned "Weighted across N applicable checks".
- **Site-type lenses** (Docs & content / Business / App / Commerce): each lens re-runs `buildPreviewReport` with some bonus checks promoted to non-bonus (`eh[type]`) and some surfaces force-enabled (`ef[type]`). Lenses change **which checks are listed** under "Recommended for <type>" and the issue list. The headline score is not recomputed per lens. The page's own `<meta name="is-agentic-site-type" content="app|business|content|store">` sets the default lens. Otherwise Ora's LLM classifier picks it ("content classification of the homepage and the site's agent docs", `inferenceConfidence: "low"`).

### Verified against live reports

| Target | Essential | Recommended | Bonus | Reconstructed | Shown |
| --- | --- | --- | --- | --- | --- |
| vercel.com | 10 checks, 8 pass + partials 2/3, 0.4 → (8+0.667+0.4)/10×80 = **72.5** | 23 checks, 20 pass + 0.5 + 0.833 → 21.33/23×20 = **18.6** | 40 signals → cap **5** | 96.1 → **96** | 96 "Strong technical baseline" |
| x.com | 46.7 | 13.5 | 5 | 65.2 → 65 | 65 "Important blockers remain" |
| hootsuite.com | 69.7 | 14.1 | 5 | 88.8 → 89 | 89 "Strong…" |
| scriptbyai.com (ScriptByAI review) | 37 | 13.6 | 2.9 | 53.5 → 54 | 54 |

Ora's own score for the same vercel.com scan is **91 / A**, because Ora weights checks by importance. The Ora post says Ora's ranker "scores each check by importance, how much it moves agents in live runs", while "is-agentic weighs the checks in a tier evenly". The two scores are meant to differ.

---

## 5. Report UI structure (`/scan/vercel.com`, top to bottom)

1. **Header**: wordmark "▲ / Is Agentic" plus a CLI hint chip `$ npx is-agentic vercel.com`, the target in mono, a **Share** button, and a light/dark toggle (localStorage).
2. **Score hero**: `<h1>` is the label ("Strong technical baseline"). Big number `96` (`text-7xl sm:text-8xl font-bold tracking-tighter tabular-nums`) next to "/ 100", with an sr-only "Score 96 out of 100". While pending it shows "—" with a shimmer class (`agent-score-glimmer`) and "Finalizing the report".
3. **"Prompt to improve"** button opens a `<dialog>` checklist "What should the prompt cover?". It lists findings grouped into Failures and Warnings, all selected by default, with filters All / None / Recommended, and a "Copy prompt (n)" button. The prompt it copies, verbatim from the bundle:

```
Improve how ready ${target} is for agents.

Current Is Agentic score: ${score}/100 (grade ${grade}, scored by Ora).

Implement the following fixes in priority order (failures first, then warnings):

1. <block per finding>
…

Requirements:
- Inspect the existing codebase before changing files.
- Follow each published protocol or file format exactly.
- Preserve existing product behavior and visual design.
- Add or update tests for every behavior you change.
- Verify every public endpoint and machine-readable file after implementation.
- Finish with a concise change summary, verification results, and any remaining recommendations that require product decisions or credentials.
```

4. **Snapshot line**: "Snapshot Nov 7, 2026, 7:37 AM UTC · Rescan".
5. **Lens tabs**: Docs & content / Business / App / Commerce, with a badge "Inferred App" or "Declared".
6. **Three bucket cards** (anchor links to the evidence below): "Essential checks · 8 of 10 checks passed · 72.5 / 80", "Recommended for App · 16 of 19 · 18.6 / 20", "Bonus signals · 45 positive, never required · +5".
7. **Critical access section**. The heading is computed: "Critical access blockers remain" / "Critical access needs attention" / "Agents can access the public site". It has 4 rows with ✓ / ~ / × and "1 / 2 passed".
8. **Evaluated surfaces**: "The public website is always evaluated. Optional surfaces appear when the scan finds positive evidence that they apply." Each surface row has a label, a state word, a %, a thin progress bar, and "Weighted across N applicable checks".
9. **"Fix these gaps first"**: the top 5 issues numbered 01–05. Each has a tag (Critical access / Other readiness checks, with an info tooltip), the recommendation text with paths auto-wrapped in `code`, and a **Copy fix** button. Each heading has a slug id and a "Link to this heading" anchor.
10. **"Audit the checks behind the score"**: three expandable lists (Essential / Recommended for <type> / Bonus). Each row has the check name, Passed / Partial (NN%) / Failed, the evidence sentence, and on non-pass a "How to pass" block plus Copy fix.
11. **Observed task (journey)**: an intent ("What does vercel.com do and who is it for? Explain it back to me.") and a step graph (`home → docs → docs`, nodes per turn, a Replay button). "Evaluator notes" holds an LLM verdict (`partial`), then "1 observed run · View journey ↗" (links to journey.ora.ai).
12. Footer: "© 2026 Vercel. Powered by Ora." with About / Methodology / Docs / Privacy / Terms / Contact. A Vercel marketing-email signup form also sits on the report page.

**Home page**: h1 "Score how agentic your site is", the URL form, **"Featured scores"** (curated: is-agentic.com 100, vercel.com 96, nuxt.com 94, ora.ai 92, eve.dev 73), and **"Recent scores · Rotates hourly"** (similarweb 60, ugg 30, stripe 70…), each a link row with a favicon (`/api/favicon?host=`) and "NN / 100". There is no full leaderboard or search, and no per-site history UI. History is stored server-side (`/api/history/` is disallowed in robots) and powers "previous score" comparisons only through third-party tools.

**Share / OG**: `/scan/<target>/opengraph-image`, 1200×630 PNG. Left side: "▲ / Is Agentic", the domain in large type, a pie gauge, "96 / 100", "Agentic Score". Right side: a card with the journey trajectory (home → docs → docs). Meta tags: `og:title "vercel.com score"`, description "vercel.com scores 96/100 for agent readiness.", `<title>` "vercel.com scores 96/100 for agent readiness · Is Agentic", `og:image:alt` "vercel.com scored 96 out of 100 on Is Agentic". The Share button uses `navigator.share({text, url})` and falls back to clipboard copy. It is tracked as "Report Share Clicked" / "Report Shared".

**Analytics events** (useful naming template): `Rescan Clicked`, `Report Share Clicked`, `Report Shared`, `Prompt Opened`, `Prompt Copied`, `Recommendation Copied`, `Prompt Copy Failed`, all keyed by `analyticsTarget(target)`.

**Machine-readable report**: `Accept: text/markdown` on `/scan/vercel.com` returns:

```md
# Is Agentic report for vercel.com

Score: 96/100 — Strong technical baseline Scanned: 2026-11-07T07:37:23.153Z Canonical report: https://is-agentic.com/scan/vercel.com

## Score breakdown

- Essential: 72.5/80 (8 of 10 checks passed)
- Recommended: 18.6/20 (20 of 23 checks passed)
- Bonus: +5 from 40 positive signals

## Findings

### 1. Content without JavaScript

- Tier: essential
- Result: partial
- Evidence: …
- Recommended fix: …

## Interpretation

…
```

JSON API (`PublicScanReport`): `{target, display_target, report_url, score|null, score_label, scanned_at, eligible_checks, score_breakdown{essential{earned,available,passing,total}, recommended{…}, bonus{points, positive_signals}}, issues[{id,name,tier:"essential"|"recommended"|"bonus", result:"failed"|"partial", details, recommendation}]}`. Errors use RFC 9457 with `code ∈ invalid_url | report_not_found | method_not_allowed | rate_limit_exceeded | report_temporarily_unavailable | api_route_not_found` and a human `resolution`.

---

## 6. Deterministic vs LLM

| Part | Nature | Evidence |
| --- | --- | --- |
| ~130 checks' pass/warn/fail + score | Mostly **deterministic probes**: HTTP fetches with agent UAs, raw-HTML parsing, DOM/accessibility heuristics, JSON-LD/OpenAPI/llms.txt parsing, well-known files, registry lookups | evidence strings quote counts/ratios ("1.0% content ratio", "180/180", "478 operations") |
| Some checks | **External/non-deterministic**: search-rank checks (brand / developer discoverability), "described but not verified" text extraction in `onboarding-friction` | evidence strings |
| Relevance pass (N/A marking) | **LLM**, async after results (`relevance_assessed` event with per-check `reasons`) | Ora: "relevance pass sets aside what genuinely does not apply" |
| Site-type inference | **LLM classifier** ("content classification of the homepage and the site's agent docs", confidence low/high). It can be overridden by `<meta name="is-agentic-site-type">`. | `siteTypes.selectionSource:"classifier"` |
| `agenticSummary` one-liner, `ctaMessage` | LLM / template | `summary_ready` event |
| Score aggregation, labels, surfaces, issue order, lenses, prompt | **Pure client-shared TS** (`buildPreviewReport`), the same function on server and client | bundle |
| Observed agent journey | **LLM agent**: `{"agent":{"model":"claude-haiku-5-5","harness":"claude-agent-sdk"}}`, WebFetch tool, an intent like `understand-offering`, verdict `partial`, plus LLM "Evaluator notes". **Not in the score.** | RSC payload |

---

## 7. What to copy for Slop Score, and what to avoid

### Copy

1. **URL = report.** `/scan/<host[/path]>` serves an SSR'd stored report, with a canonical link, a dynamic `<title>` and OG card that include the score, and a sitemap of featured reports. A POST form at `/scan` 303-redirects to the canonical path, so it works without JS. In TanStack Start: a `/scan/$` splat route whose loader reads the store, plus a server function / API route for the stream.
2. **Normalize once**: lowercase host, strip scheme and trailing slash. Decide `www` and query handling deliberately. Is Agentic keeps both, which creates duplicate reports (`www.vercel.com` vs `vercel.com`, `?utm=` variants). **Better for Slop Score: strip `www.` and drop the query by default.**
3. **SSE scan stream** with typed events: `scan_init` (roster) → `check_start` / `check_complete` → `scan_complete` → late async events (LLM) → `scan_archived`. This gives a live check-by-check progress UI and also serves a CLI.
4. **Stale-while-revalidate reports**: show the stored score, refresh in the background after a TTL (6 h there), and offer an explicit **Rescan** that keeps the old report visible until the new one is archived.
5. **Pool scoring with equal weights inside each tier and proportional partials.** It is simple, explainable, and can be reproduced by hand from the breakdown, which builds trust. For Slop Score: e.g. "Strong tells" pool 80 + "Weak tells" pool 20. Use fraction-per-check (0..1). Exclude N/A from the denominator. Use `Math.round(min(100, …))`. Expose `earned/available/passing/total` per pool.
6. **Applicability gating by evidence.** Checks only count on surfaces that exist (e.g. don't score "pricing page slop" if there is no pricing page; don't score "testimonial slop" without testimonials).
7. **Separate "beta" checks**: return `na` with a "not scored yet" reason so you can ship and tune a check without it moving scores (`agentic-search-usecase` pattern).
8. **Bonus that only adds, with a cap**: fits "signs of hand-craft" (custom illustrations, non-default fonts…) without punishing their absence.
9. **Labels by threshold, not letters**: 85 / 70 / 50 with plain-language headings, the same thresholds reused for per-category bars.
10. **Report structure**: hero score + label → bucket cards → "critical" category rows → "Fix these first" (top 5, sorted by severity, then fraction, then estimated gain) → full evidence lists with "How to pass" + Copy fix → share. The **"Copy prompt"** dialog (a selectable fixes list turned into one agent-ready prompt) is a strong viral and utility feature. Copy that pattern.
11. **Agent-friendly surfaces almost for free**: `Accept: text/markdown` report, read-only `/api/v1/report?url=` with RFC 9457 errors and RateLimit headers, `npx` CLI, llms.txt. Cheap to build, and other tools cite them.
12. **OG image route per report** (domain + big score + gauge) and Web Share API with clipboard fallback.
13. Ship the **scoring function as a shared pure module** (server + client), as they do. Then test it as a pure function with table tests from real reports.

### Avoid / do differently

1. **Don't let LLM steps silently change the number after the fact.** Their `relevance_assessed` event can flip checks to N/A _after_ the deterministic score is shown, so the score can shift. For Slop Score, either finish the LLM pass before persisting, or keep the LLM verdict out of the number entirely, like their journey.
2. **Non-deterministic inputs in the score** (search ranks, third-party registries) make rescans drift. Keep Slop Score's numeric part to deterministic HTML/CSS/asset heuristics. Pin the methodology version in the stored report (they store `contractVersion`).
3. **Lens confusion**: their site-type tabs change check lists and counts ("16 of 19" in the App lens vs "20 of 23" in the API) but not the score. Readers see mismatched numbers. One view, or make it obvious.
4. **Duplicate reports from `www` / query variants**, see above.
5. **Public-by-default reports of other people's sites.** Fine for agent readiness, but riskier for a "slop" judgment (a reputational label). Consider neutral wording ("template signals"), a methodology page, a corrections/contact path (they have `/contact` "report corrections"), and `noindex` on low scores or on non-featured reports.
6. **Closed source / opaque probes**: the evidence strings carry trust here. Make every check's evidence concrete (counts, matched selectors, a screenshot crop), never just "detected".
7. **Bonus saturates fast** (0.25 pt × 20 signals = cap). Choose the per-signal value so the cap means something.
8. Their score is **Next.js + an external engine**. For TanStack Start you need your own equivalents: route loaders for SSR, a server route for SSE, an image-generation route (Satori/`@vercel/og`-style) for the OG card, and KV/DB storage keyed by the normalized target with `scanned_at` and a version.

---

## Sources

- Live site (fetched 2026-11-07): https://is-agentic.com/, `/llms.txt`, `/docs`, `/methodology`, `/about`, `/robots.txt`, `/sitemap.xml`, `/openapi.json`, `/scan/vercel.com` (HTML, Markdown, OG image), `/api/v1/report?url=…` for vercel.com, x.com, zoominfo.com, hootsuite.com.
- Client bundle: `https://is-agentic.com/_next/static/immutable/chunks/0a1h9wyly5ifn.js` (modules `57555` buildPreviewReport, `LiveScan`, `StaleScanRefresh`, `RouteTargetLabel`, prompt builder). Chunk hashes change per deploy.
- Raw Ora result: RSC payload of `/scan/vercel.com` (`self.__next_f`).
- CLI source: npm `is-agentic@1.0.1`, `bin/is-agentic.js`.
- Agent skill: `vercel/vercel-plugin/skills/is-agentic/upstream/SKILL.md`.
- Ora launch post: https://ora.ai/blog/is-agentic-with-vercel (127 checks across discovery/access/usability/payments; "is-agentic weighs the checks in a tier evenly"; journeys from journey.ora.ai).
- Review: https://www.scriptbyai.com/is-agentic-agent-readiness/ (54 = 37 + 13.6 + 2.9 example).
- Not readable: MarkTechPost (403), Vercel blog (no post found).

---

## Appendix: full check catalog (vercel.com scan, Ora contract 1.38.0)

"Is Agentic bucket" is derived from the hard-coded sets in the bundle. `X→bonus` means the check counts only toward the bonus. Site-type variants can promote some bonus checks back to non-bonus (`states: req|gated`) inside a lens. "surface" decides applicability: `web` always counts, the others only when detected.

| Ora layer | id | name | Ora tier | Ora maxScore | maturity | Is Agentic bucket | surface | vercel.com status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Discovery | ard-catalog | ARD discovery | required | 1 | verified | emerging→bonus | web | pass |
| Discovery | ai-catalog-published | AI Catalog discovery | recommended | 1 | verified | recommended→bonus | web | pass |
| Discovery | ard-entries-valid | ARD entry validity | recommended | 2 | verified | emerging→bonus | web | pass |
| Discovery | ard-trust-manifest | ARD trust manifest | recommended | 2 | verified | emerging→bonus | web | fail |
| Discovery | agentic-search-usecase | Category share of voice | recommended | 6 | verified | emerging→bonus | web | na |
| Discovery | agentic-search-specific | Developer resource discoverability | recommended | 3 | verified | recommended | web | pass |
| Discovery | brand-search-accuracy | Brand name discoverability | required | 3 | verified | recommended | web | pass |
| Discovery | wikipedia-presence | Wikipedia / Wikidata entity presence | recommended | 4 | verified | recommended→bonus | web | pass |
| Discovery | robots-ai-policy-quality | robots.txt AI crawler policy | required | 2 | verified | excluded | web | pass |
| Discovery | mcp-registry-listed | Listed in MCP registries | recommended | 1 | verified | recommended→bonus | mcp | pass |
| Discovery | npm-sdk-package | NPM/PyPI SDK package | recommended | 1 | verified | recommended→bonus | api | pass |
| Discovery | agent-rules-repo | Agent platform configs | emerging | 1 | emerging | emerging→bonus | web | pass |
| Discovery | agent-plugins-repo | Agent Plugins manifest | emerging | 1 | emerging | emerging→bonus | web | fail |
| Discovery | registry-branding | Registry branding | emerging | 2 | emerging | emerging→bonus | web | fail |
| Discovery | chatgpt-app-listed | ChatGPT app listed | recommended | 2 | verified | recommended→bonus | web | pass |
| Discovery | noindex-directives | Homepage not hidden from search | recommended | 1 | verified | recommended | web | pass |
| Access | sitemap | Sitemap exists | required | 2 | verified | recommended | web | pass |
| Access | content-no-js | Content without JavaScript | required | 3 | verified | essential | web | warning |
| Access | bot-detection | Not blocked by bot detection | required | 2 | verified | essential | web | pass |
| Access | agent-discovery-file | Agent discovery file | required | 2 | verified | emerging→bonus | web | pass |
| Access | agent-skills-index-v2 | Agent Skills index conformance (v0.2.0) | emerging | 2 | emerging | emerging→bonus | web | pass |
| Access | a2a-agent-card | A2A / agent-card | recommended | 2 | verified | recommended→bonus | web | fail |
| Access | skills-sh-listed | Listed on skills.sh | emerging | 1 | emerging | emerging→bonus | web | pass |
| Access | pricing-md | pricing.md exists | emerging | 2 | emerging | emerging→bonus | commerce | pass |
| Access | nlweb-schema-feeds | NLWeb Schema Feeds | emerging | 1 | emerging | emerging→bonus | web | fail |
| Access | mcp-well-known-discovery | MCP well-known discovery | recommended | 2 | verified | emerging→bonus | mcp | warning |
| Access | agent-mode-view | Agent mode view | emerging | 2 | emerging | emerging→bonus | web | fail |
| Access | link-headers-discovery | HTTP Link headers (RFC 8288) | required | 1 | verified | recommended→bonus | web | pass |
| Access | markdown-url-fallback | Markdown URL fallback | emerging | 2 | emerging | emerging→bonus | web | fail |
| Access | modular-llms-txt | Modular llms.txt per product area | emerging | 1 | emerging | emerging→bonus | web | pass |
| Access | sitemap-lastmod | Sitemap freshness (lastmod) | recommended | 1 | verified | recommended→bonus | web | pass |
| Access | robots-agent-user-policy | robots.txt agent-user policy | required | 2 | verified | excluded | web | pass |
| Access | llms-txt-exists | llms.txt exists | required | 1 | verified | emerging→bonus | web | pass |
| Access | llms-txt-formatting | llms.txt formatting | recommended | 2 | verified | emerging→bonus | web | pass |
| Access | json-ld | JSON-LD structured data | required | 4 | verified | recommended | web | pass |
| Access | pricing-info | Pricing info accessible | required | 3 | verified | recommended | commerce | pass |
| Access | public-api-docs | Public API/docs linked from homepage | required | 3 | verified | recommended | api | pass |
| Access | agent-instruction | Agent instruction / when-to-use | required | 3 | verified | recommended | web | pass |
| Access | skills-sh-quality | Skills.sh skill quality | emerging | 2 | emerging | emerging→bonus | web | pass |
| Access | json-ld-entity-linking | JSON-LD entity linking (sameAs) | recommended | 2 | verified | recommended→bonus | web | pass |
| Access | metadata-completeness | Metadata completeness | required | 2 | verified | recommended | web | pass |
| Access | org-schema-completeness | Organization schema completeness | recommended | 2 | verified | recommended | web | pass |
| Access | schema-type-breadth | Schema type breadth | recommended | 2 | verified | recommended→bonus | api | warning |
| Access | trust-anchors | Trust anchor pages | required | 2 | verified | recommended | web | pass |
| Access | llms-txt-links-resolve | llms.txt links resolve | recommended | 2 | verified | emerging→bonus | web | pass |
| Access | markdown-link-alternate | Markdown alternate link | emerging | 1 | emerging | emerging→bonus | web | fail |
| Access | markdown-frontmatter | Markdown frontmatter metadata | emerging | 1 | emerging | emerging→bonus | web | fail |
| Access | redirect-hygiene | Redirect hygiene | recommended | 1 | verified | essential | web | pass |
| Access | page-token-budget | Page token budget | recommended | 1 | verified | recommended | web | pass |
| Access | code-fence-validity | Code fence validity | emerging | 1 | emerging | recommended | web | pass |
| Access | docs-auth-gate | Content behind auth | recommended | 2 | verified | essential | web | pass |
| Access | openapi-spec | OpenAPI spec published | required | 7 | verified | essential | api | pass |
| Access | developer-portal | Developer portal | recommended | 6 | verified | recommended | api | pass |
| Access | api-catalog-rfc9727 | API catalog (RFC 9727) | required | 2 | verified | recommended→bonus | api | pass |
| Access | markdown-negotiation | Markdown agent docs | emerging | 1 | emerging | emerging→bonus | web | pass |
| Access | markdown-negotiation-vary | Markdown content negotiation (acceptmarkdown.com) | recommended | 1 | verified | essential | web | pass |
| Access | agent-ua-markdown | Bot-UA markdown serving | emerging | 1 | emerging | emerging→bonus | web | fail |
| Access | agent-crawler-reachability | Agent crawler reachability | recommended | 2 | verified | essential | web | pass |
| Usability | mcp-tool-descriptions | MCP tool descriptions | recommended | 3 | verified | recommended→bonus | mcp | na |
| Usability | mcp-param-schemas | MCP parameter schemas | recommended | 2 | verified | recommended→bonus | mcp | na |
| Usability | mcp-server-identity | MCP server identity | recommended | 1 | verified | essential→bonus | mcp | na |
| Usability | mcp-tool-listing | MCP tool listing | recommended | 3 | verified | recommended→bonus | mcp | na |
| Usability | mcp-tool-naming | MCP tool naming | recommended | 2 | verified | recommended→bonus | mcp | na |
| Usability | public-api | Public API with reachable endpoints | required | 7 | verified | recommended | api | pass |
| Usability | oauth-support | OAuth 2.0 support | required | 5 | verified | essential | auth | pass |
| Usability | scoped-permissions | Scoped permissions | recommended | 5 | verified | essential | auth | warning |
| Usability | mcp-auth-mechanism | MCP auth mechanism | recommended | 2 | verified | essential→bonus | mcp | pass |
| Usability | mcp-oauth-metadata | MCP OAuth metadata | recommended | 2 | verified | essential→bonus | mcp | pass |
| Usability | mcp-pkce-s256 | MCP PKCE S256 support | recommended | 2 | verified | essential→bonus | mcp | pass |
| Usability | onboarding-friction | Agent onboarding friction | recommended | 2 | verified | recommended | auth | warning |
| Usability | web-bot-auth-directory | Web Bot Auth directory | emerging | 2 | emerging | emerging→bonus | web | fail |
| Usability | oauth-protected-resource | OAuth Protected Resource metadata (RFC 9728) | required | 2 | verified | essential→bonus | auth | pass |
| Usability | auth-md-exists | auth.md exists | required | 2 | verified | emerging→bonus | auth | fail |
| Usability | auth-md-structure | auth.md structure | recommended | 2 | verified | emerging→bonus | auth | fail |
| Usability | auth-md-walkthrough-simulation | auth.md walkthrough simulation | recommended | 2 | verified | emerging→bonus | auth | na |
| Usability | agent-auth-discovery-metadata | Agent auth discovery metadata | recommended | 3 | verified | emerging→bonus | auth | warning |
| Usability | agent-auth-www-authenticate | Agent auth WWW-Authenticate hint | recommended | 1 | verified | recommended→bonus | auth | pass |
| Usability | agent-auth-endpoints-reachable | agent_auth endpoints reachable | recommended | 2 | verified | emerging→bonus | auth | fail |
| Usability | pap-discovery | Personal Agent Protocol discovery file | emerging | 2 | emerging | recommended→bonus | web | na |
| Usability | pap-issuer-binding | PAP issuer binding | emerging | 2 | emerging | recommended→bonus | web | na |
| Usability | pap-auth-config | PAP sign-in and extension config | emerging | 2 | emerging | recommended→bonus | web | na |
| Usability | pap-interfaces | PAP API and agent entries | emerging | 2 | emerging | recommended→bonus | web | na |
| Usability | pap-endpoint-enforcement | PAP endpoints reject unauthenticated agents | emerging | 2 | emerging | recommended→bonus | web | na |
| Usability | pap-cross-protocol | PAP agrees with ARD and auth.md | emerging | 2 | emerging | recommended→bonus | web | na |
| Usability | mcp-server | MCP server / manifest | required | 6 | verified | recommended | mcp | warning |
| Usability | mcp-error-handling | MCP error handling | recommended | 2 | verified | essential→bonus | mcp | na |
| Usability | mcp-transport-modern | MCP modern transport | recommended | 1 | verified | essential→bonus | mcp | na |
| Usability | webmcp | WebMCP support | required | 5 | verified | emerging→bonus | web | fail |
| Usability | rate-limit-headers | Rate limit response headers | recommended | 2 | verified | recommended | api | fail |
| Usability | idempotency-key-support | Idempotency-Key support | recommended | 3 | verified | recommended→bonus | api | fail |
| Usability | json-error-responses | JSON error responses | required | 4 | verified | essential | api | pass |
| Usability | api-error-model | REST typed error model | recommended | 3 | verified | recommended | api | pass |
| Usability | api-versioning-policy | REST versioning / deprecation policy | recommended | 3 | verified | recommended | api | pass |
| Usability | pagination-shape | REST pagination pattern | recommended | 2 | verified | recommended→bonus | api | pass |
| Usability | async-job-pattern | REST async-job pattern | recommended | 2 | verified | recommended→bonus | api | pass |
| Usability | cli-tool | CLI tool available | recommended | 3 | verified | recommended | api | pass |
| Usability | rest-sdk-packages | Multi-language SDK packages | recommended | 3 | verified | recommended→bonus | api | warning |
| Usability | nlweb-ask | NLWeb /ask endpoint | emerging | 1 | emerging | emerging→bonus | web | fail |
| Usability | nlweb-streaming | NLWeb streaming support | emerging | 1 | emerging | emerging→bonus | web | fail |
| Usability | response-schema-coverage | REST response schema coverage | recommended | 2 | verified | recommended | api | pass |
| Usability | mcp-tool-annotations | MCP tool annotations | recommended | 2 | verified | recommended→bonus | mcp | na |
| Usability | mcp-server-card | MCP server-card.json | recommended | 2 | verified | emerging→bonus | mcp | fail |
| Usability | mcp-multi-surface-coverage | Product + docs MCP coverage | recommended | 2 | verified | emerging→bonus | mcp | fail |
| Usability | sandbox-environment | Sandbox / test environment | recommended | 2 | verified | recommended→bonus | api | pass |
| Usability | batch-endpoints | REST batch / bulk endpoint | recommended | 2 | verified | recommended→bonus | api | pass |
| Usability | mcp-resource-listing | MCP resources exposed | recommended | 3 | verified | essential | mcp | na |
| Usability | graphql-error-type-definition | GraphQL typed error model | recommended | 3 | verified | recommended | graphql | na |
| Usability | graphql-versioning-policy | GraphQL versioning / deprecation policy | recommended | 2 | verified | recommended | graphql | na |
| Usability | graphql-pagination-pattern | GraphQL pagination pattern | recommended | 2 | verified | recommended | graphql | na |
| Usability | graphql-async-job-pattern | GraphQL async-job pattern | recommended | 2 | verified | recommended | graphql | na |
| Usability | graphql-schema-completeness | GraphQL schema description coverage | recommended | 3 | verified | recommended→bonus | graphql | na |
| Usability | graphql-batch-mutations | GraphQL batch mutations | recommended | 2 | verified | recommended→bonus | graphql | na |
| Usability | agent-friendly-404 | Agent-friendly 404s | recommended | 2 | verified | essential | web | pass |
| Usability | ax-document-structure | Accessible document structure | recommended | 3 | verified | essential→bonus | web | pass |
| Usability | ax-native-controls | Native interactive controls | recommended | 3 | verified | essential→bonus | web | pass |
| Usability | ax-accessible-names | Accessible names on controls | recommended | 2 | verified | essential→bonus | web | pass |
| Usability | ax-form-labeling | Form control labeling | recommended | 2 | verified | essential→bonus | web | pass |
| Usability | ax-tree-injection-safe | Accessibility-tree injection safety (bonus) | recommended | 2 | verified | recommended→bonus | web | pass |
| Usability | mcp-app-registry | MCP Apps support | recommended | 4 | verified | emerging→bonus | mcp | na |
| Usability | a2ui-support | A2UI / generative UI support | emerging | 2 | emerging | emerging→bonus | web | na |
| Usability | mcp-apps-ui-quality | MCP Apps UI quality | recommended | 4 | verified | emerging→bonus | mcp | na |
| Usability | mcp-view-domain | MCP App view reachable | recommended | 4 | verified | essential | mcp | na |
| Usability | mcp-view-csp | MCP App view CSP | recommended | 4 | verified | essential | mcp | na |
| Usability | api-schema-analysis | API schema complexity analysis | recommended | 2 | verified | recommended | api | pass |
| Usability | function-calling-compat | Function calling compatibility | recommended | 2 | verified | recommended | api | pass |
| Usability | mcp-resource-quality | MCP resource quality | recommended | 3 | verified | recommended | mcp | na |
| Payments | mpp-support | MPP payment protocol | required | 2 | verified | emerging→bonus | commerce | na |
| Payments | x402-support | x402 payment protocol | required | 2 | verified | emerging→bonus | commerce | na |
| Payments | ucp-support | UCP - Universal Commerce Protocol | required | 3 | verified | emerging→bonus | commerce | na |
| Payments | acp-support | ACP - Agentic Commerce Protocol | required | 3 | verified | emerging→bonus | commerce | na |
| Payments | acp-delegate-payment | ACP delegate payment | recommended | 3 | verified | emerging→bonus | commerce | na |
| Payments | ap2-support | AP2 - Agent Payments Protocol | recommended | 3 | verified | emerging→bonus | commerce | na |
