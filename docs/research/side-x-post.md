# Side check: the "12 things your vibe coded site is missing" post

Source: https://x.com/PratikSinhatwt/status/2118994341276582302 (2026-11-07, 1,084 likes, 63.7k views), read with twitter241 `tweet`. The attached image in the thread payload is an unrelated Discord screenshot from a reply.

The post lists 12 things that are missing from a vibe-coded site: custom 404, CTA above the fold, meta title per page, meta description per page, Open Graph image, favicon set, robots.txt, sitemap.xml, alt text on every image, loading states, privacy policy page, analytics.

These are hygiene checks, not look tells. Slop Score scores "how templated it looks", so an item counts only when a reading of it separates the generated sites from the 17 hand-made reference sites with zero hits on the hand-made ones. None of the 12 is covered by an existing signal. The nearest are the dead `#` links and template leftovers inside `placeholders`.

## Method

Script: `scratchpad/xside/probe.mjs`. For each of the 43 calibration sites (`calib/sites.txt`, minus the two that fail with 402 and 429), it fetches the home HTML, `/favicon.ico` and the first icon link, `/robots.txt`, `/sitemap.xml`, and a random 404 URL rendered in Chrome. It also renders the home page to count images without `alt`, and to look for an analytics script and a link to a privacy page. The raw data is in `scratchpad/xside/probe.json`.

Hand-made reference set (17): alexandrejoly.me, vercel.com, linear.app, stripe.com, rauno.me, emilkowal.ski, paco.me, posthog.com, basecamp.com, raycast.com, resend.com, are.na, danluu.com, joshwcomeau.com, tailwindcss.com, kevinkern.dev, rsms.me.

## Rejected: whether an item is missing does not separate the two groups

| Item | Hand-made sites that would fail it (false positives) |
| --- | --- |
| Meta description missing | danluu, paco, rauno, rsms |
| OG image missing | danluu, rsms |
| sitemap.xml missing | are.na, emilkowal.ski, joshwcomeau, kevinkern, paco, stripe, tailwindcss |
| robots.txt missing | emilkowal.ski, paco, tailwindcss |
| Images without alt | posthog (1), tailwindcss (2) |
| No analytics | alexandrejoly.me, linear, paco, vercel |
| No privacy link | emilkowal.ski, paco, posthog, rauno, resend, rsms, tailwindcss |
| Default Next.js 404 ("This page could not be found.") | rauno.me |
| Vercel platform 404 (`404 NOT_FOUND`) | none in the set, but it is the same "no custom 404" case that rauno.me shows on a hand-made site; it also needs an extra request for a page the scan never looks at |
| CTA above the fold, loading states | no reliable check from a page load; not a template tell either |

The Lovable starter's 404 copy ("404 Oops! Page not found … Return to Home") is exact template text. It shows up on makeurquiz only, which is already at 7, and catching it costs an extra request. Leave it out unless a later sample shows it on otherwise clean sites.

## Candidate: head tags left as the starter wrote them (0 false positives)

The post's "meta title", "favicon" and "OG image" items do work as tells in one reading: the tab title, favicon or share tags still hold the values a scaffolder or site builder writes. That is a template default left in place, the same thing the score already counts with `default-font` and `stock-tokens`.

The defaults were checked against their sources:

- create-vite 6.5.0 and 9.3.4 index.html titles (`Vite + React`, `Vite + Vue + TS`…).
- The icon `/vite.svg` (create-vite ≤ 6; 9 uses `/favicon.svg`, so only its byte hash identifies it).
- The create-next-app favicon: the v13–v15 file is sha256 `2b8ad2d3…`, 25,931 bytes, and the App Router serves it as `favicon.ico?favicon.0b3bf435.ico`. The v16.4.5 file is `c28fdd2a…`, 15,086 bytes.
- The Lovable starter `index.html`, read from a public repo and from the leaked Lovable system prompt: `description`/`og:*` set to "Lovable Generated Project", `author` "Lovable", `twitter:site` "@lovable_dev", and `og:image` `lovable.dev/opengraph-image-p98pqg.png`. Live Lovable sites now show `twitter:site` "@Lovable".

Results (`scratchpad/xside/starter-head.mjs`):

| Site | Hits |
| --- | --- |
| project-dwbzk.vercel.app | tab title "Vite + React", `/vite.svg` |
| dax-in.vercel.app | `favicon.ico?favicon.0b3bf435.ico` |
| supahero.io | `favicon.ico?favicon.0b3bf435.ico` |
| freesubtitlemaker.lovable.app | author "Lovable", `twitter:site` @Lovable |
| makeurquiz.lovable.app | `twitter:site` @Lovable |
| startup-template-sage.vercel.app | only with the byte-hash variant: `/favicon.ico` is the create-next-app file |
| 17 hand-made sites | none |

The static variant needs no extra request, because everything comes from the home HTML. It catches 5 of the 26 other sites. The byte-hash variant adds startup-template-sage but costs one request for the favicon.

Proposed placement: a new signal, not part of `placeholders`. Two head tags from one starter should not stack into two findings, and the category is the page's chrome, not its copy.

## Proposed code (static variant)

`types.ts`, in `StaticFacts`:

```ts
  /** Head tags a scaffolder or site builder fills in. */
  head: { title: string; description: string; author: string; twitterSite: string; ogImage: string; icons: string[] };
```

`extract.ts`, read from `$raw` (the unstripped document) and returned with the other facts:

```ts
const meta = (selector: string) =>
  ($raw(selector).attr("content") ?? "").trim();
const head = {
  title: $raw("head title").first().text().trim(),
  description: meta('meta[name="description"]'),
  author: meta('meta[name="author"]'),
  twitterSite: meta('meta[name="twitter:site"]'),
  ogImage: meta('meta[property="og:image"]'),
  icons: $raw('link[rel~="icon"]')
    .map((_, el) => $raw(el).attr("href") ?? "")
    .get()
    .filter(Boolean),
};
```

`signals.ts`:

```ts
/** Head values written by create-vite, create-next-app, create-react-app and the Lovable starter, checked against their templates. */
const STARTER_TITLES = /^(vite \+ (react|vue|svelte|preact|lit|solid|qwik|js|ts)( \+ ts)?|vite app|react app|create next app|lovable generated project)$/;
const STARTER_DESCRIPTIONS = /^(generated by create next app|web site created using create-react-app|lovable generated project)$/;
/** Vite's old public icon, and the App Router URL of create-next-app's favicon (the query is a hash of the file). */
const STARTER_ICON = /(^|\/)vite\.svg$|favicon\.ico\?favicon\.0b3bf435\.ico/;

  {
    id: "starter-head",
    category: "fingerprint",
    title: "The starter's tab title, favicon or share tags",
    weight: 4,
    why: "The tab title, favicon and share card are the first things anyone sees of a page, and these are still the values the scaffolder or site builder wrote.",
    fix: "Give the page its own title, description, favicon and share tags.",
    detect: ({ static: s }) => {
      const { head } = s;
      const found: string[] = [];
      if (STARTER_TITLES.test(head.title.toLowerCase())) found.push(`tab title “${head.title}”`);
      if (STARTER_DESCRIPTIONS.test(head.description.toLowerCase())) found.push(`description “${head.description}”`);
      const icon = head.icons.find((href) => STARTER_ICON.test(href.toLowerCase()));
      if (icon) found.push(`starter favicon ${icon}`);
      if (/^lovable$/i.test(head.author)) found.push("author “Lovable”");
      if (/^@lovable(_dev)?$/i.test(head.twitterSite)) found.push(`twitter:site ${head.twitterSite}`);
      if (/lovable\.dev\/opengraph-image/i.test(head.ogImage)) found.push("Lovable's share image");
      return found.length > 0 ? { strength: 1, evidence: found.join(", "), source: "static" } : null;
    },
  },
```

Tests to add: a test that fires on the Lovable starter head and on `<title>Vite + React</title>` with `<link rel="icon" href="/vite.svg">`, and a test that does not fire on a custom title or on an Astro `generator` meta tag. Bump `METHODOLOGY`.
