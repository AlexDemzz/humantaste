# Anti-slop rules for web UI — catalogue for Slop Score

Research date: 2026-11-07. Primary files only (SKILL.md, reference files, detector source, system prompts). Star counts come from the GitHub API on 2026-11-07.

Checkability codes: **D** = DOM / computed CSS, **S** = screenshot / vision, **C** = copy text, **N** = not automatically checkable. `n=` = number of independent sources stating the rule (a family of files from one author counts once).

> **Name collision.** "Slop Score" is already in use: EQ-Bench's text-slop metric (eqbench.com/slop-score.html, cited in marketingskills `ai-tells.md`) and Slopdar ("Slop Score 0–100", peerlist.io/mukundparekh69/project/slopdar). Check the name before launch.

---

## 1. Sources

| Key | Source | Primary file(s) | Popularity | Date | Kind |
| --- | --- | --- | --- | --- | --- |
| **FD** | Anthropic `frontend-design` (current) | local `~/.claude/plugins/cache/claude-plugins-official/frontend-design/1.1.1/skills/frontend-design/SKILL.md` = github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md (commit 41bbe19d1a) | anthropics/skills 188k★; ships as an official Claude Code plugin | 2026-09-03 | Ban list + "calibration clusters" |
| **FD0** | Anthropic `frontend-design` original, plus cookbook `DISTILLED_AESTHETICS_PROMPT` | anthropics/skills @ ef740771ac `skills/frontend-design/SKILL.md`; github.com/anthropics/claude-cookbooks/blob/main/coding/prompting_for_frontend_aesthetics.ipynb | same repo; the cookbook is the origin of "AI slop aesthetic" as a term for prompts | 2025-12 | First-gen ban list (Inter, purple gradient) |
| **I** | Impeccable (pbakaus) v4.8 | local `~/.claude/skills/impeccable/reference/craft-floor.md`, `reference/new-work.md` §65–69; detector registry github.com/pbakaus/impeccable/blob/main/crates/live/assets/antipatterns.json (62 rules, 30 tagged `slop`); thresholds `crates/core/src/checks/rules.rs`; font and buzzword lists `crates/detect/src/regex_matchers.rs`; older DON'T list `source/skills/frontend-design/SKILL.md` @ f30475cdf4 | 105k★, Apache-2.0 | 2026-11-07 | Skill + **deterministic browser detector** |
| **T** | Taste Skill (Leonxlnx) | v1 `skills/taste-skill/SKILL.md` @ 3206dd44fc (§7 "AI TELLS"); v2.5 github.com/Leonxlnx/taste-skill/blob/main/skills/taste-skill/SKILL.md + `references/copy.md` | 111k★, MIT | v1 2026-03-20, v2.5 2026-11 | Ban list; v2.5 is a generator kit with its own checker |
| **H** | Hallmark (Nutlope / Together AI) | github.com/Nutlope/hallmark/blob/main/skills/hallmark/references/gates.md (numbered gates), `references/fonts.md` | 49.9k★, MIT | 2026-11-05 | 65+ gates, `sloplint.mjs` and pass/fail fixtures |
| **U** | Uncodixfy (cyxzdev) | github.com/cyxzdev/Uncodixfy/blob/main/SKILL.md | 2.7k★, MIT | 2026-03-18 | "Codex UI" ban list (app UI focus) |
| **SC** | Design Slop Cop (AdrianKrebs) | github.com/AdrianKrebs/design-slop-cop `src/patterns/*.js`, `src/lib/{color,slop-fonts}.js`, README | 19★, but the HN front page (item 47864393); live at slopcop.adriankrebs.ch | 2026-07-07 | **The closest existing product**: headless browser, 14 DOM patterns, 165 labels, ~5–10% FP |
| **V0** | v0 system prompt (leaked) | github.com/x1xhlol/system-prompts-and-models-of-ai-tools `v0 Prompts and Tools/Prompt.txt` §Design Guidelines | repo 144k★ | 2026-10 | Generator's own bans + defaults (fingerprint) |
| **SD** | Same.dev system prompt (leaked) | same repo `Same.dev/Prompt.txt` l.99–102 | — | — | Generator bans |
| **LV** | Lovable agent prompt (leaked) | same repo `Lovable/Agent Prompt.txt` l.206–260 | — | — | Generator **defaults** = fingerprint |
| **BO** | Bolt template `.bolt/prompt` | e.g. github.com/takeyamayuki/NonMouse/blob/main/website/.bolt/prompt (stock Bolt starter text, committed in many repos) | — | — | Generator defaults = fingerprint |
| **OR** | Orchids system prompt (leaked) | same repo `Orchids.app/System Prompt.txt` l.251–314 | — | — | Defaults (lucide, tw-animate-css) |
| **EX** | Expo "Native Slop: 20 tells" | local `~/.claude/plugins/cache/claude-plugins-official/expo/1.13.9/skills/expo-design-system/references/native-slop.md` | official Claude plugin | 2026 | Native, but several tells carry over to the web |
| **MS** | marketingskills `copywriting/references/ai-tells.md` | local `~/.claude/plugins/cache/marketingskills/marketing-skills/2.14.0/skills/copywriting/references/ai-tells.md` | Claude plugin marketplace | 2026 | Copy ban/cap list |
| **MU** | Magic UI registry | github.com/magicuidesign/magicui `registry/magicui/*.tsx` | 23k★ | 2026-11-05 | Component fingerprint (no rules) |
| **SH** | shadcn/ui defaults | github.com/shadcn-ui/ui `apps/v4/registry/themes.ts` (neutral), `apps/v4/app/globals.css` | — | 2026-11 | Token fingerprint |
| **E** | emil-design-eng | local `~/.claude/skills/emil-design-eng/SKILL.md` (review checklist l.659–671) | emilkowalski/skills 54k★ | 2026-11 | Motion craft, not slop |
| **BX** | better-ui / -typography / -colors / -layout / -interface, interface-review | local `~/.claude/skills/better-*/` | — | — | Craft; mostly useful for false-positive guards |
| **VG** | vercel-design-guidelines | local `~/.claude/commands/vercel-design-guidelines.md` (points to vercel.com/design/guidelines) | vercel-labs/web-interface-guidelines 1.1k★ | — | Craft/a11y checklist |
| **UX** | ui-ux-pro-max | github.com/nextlevelbuilder/ui-ux-pro-max-skill `.claude/skills/ui-ux-pro-max/SKILL.md` | 146k★ | 2026-11-05 | Only "no emoji icons"; its style DB _recommends_ glass/aurora (a slop source, not a filter) |

Found but not read (low adoption): wwewtech/anti-slop-design (4★), Vinayak-Shukla-03/anti-ai-slop (10★), iamneilroberts/claude-skills `unslop-ui` (34★). Other URL scorers (not open source, so not checked): slop-detect.com, ismyappslop.com, SlopCheckr (Product Hunt), lightsite.ai AI Slop Detector (an SEO/content tool).

---

## 2. Rule catalogue

Format: **rule** — short quote(s) [sources] · `n` · check · notes/thresholds.

### 2.1 Typography

| # | Rule | Sources | n | Check | Thresholds / notes |
| --- | --- | --- | --- | --- | --- |
| T1 | **Default workhorse font as the page face.** FD0: "NEVER use … overused font families (Inter, Roboto, Arial, system fonts)"; T v1: "NO Inter Font: Banned"; H gate 1: "Inter, Roboto, Open Sans, Poppins, Lato or a system face as the display"; U: "No Segoe UI, Trebuchet MS, Arial, Inter, Roboto"; EX #6 "Inter Everywhere" | FD0, I, T, H, U, SC, EX, (FD: "not the default families you would reach for") | 8 | D | I list: Inter, Roboto, Open Sans, Lato, Montserrat, Arial, Helvetica. H fonts.md adds Poppins, Source Sans, Nunito, Raleway, Work Sans, DM Sans, Plus Jakarta, system-ui. SC only fires **centered hero + generic sans** together. Mode-dependent: see FP traps. |
| T2 | **Second-wave "tasteful" display faces** (the first fix became the new default). FD0: "converge on common choices (Space Grotesk, for example)"; I new-work: "Fraunces, Playfair Display, Cormorant, Lora, Crimson, Newsreader, Syne, Space Grotesk, Space Mono, IBM Plex, Inter-as-display, DM Sans, DM Serif, Outfit, Plus Jakarta Sans, Instrument Sans … mean you stopped looking" | FD0, I, H ("Saturated"), SC | 4 | D | SC list: Space Grotesk, Instrument Serif, Fraunces, Bricolage Grotesque, Sora, Young Serif, Bodoni, Syne; fires if it is the heading font or ≥25% of text. I detector adds Geist (+Mono), Mona Sans, Recoleta, Instrument Sans/Serif. H "Saturated": Playfair, Cormorant Garamond, DM Serif Display, Fraunces, Instrument Serif, Recoleta, Space Grotesk, Hubot Sans, Bebas Neue, Unbounded; Geist/Instrument Sans/Mona Sans as body. **Geist is disputed**: SC removed it from its list; T v1 and V0 _recommend_ it. |
| T3 | **One accented word in the headline** (italic, different colour, gradient, second font). FD: "Accenting just a single word or phrase in a headline … the commonest tells of a generated page"; H 38i: "One italic word inside an otherwise roman heading" (Floor) | FD, H, SC (hero-font-mix), I (italic-serif-display) | 4 | D | SC: an h1 ≥32px, ≤140 chars, whose child runs differ in font-family / font-style / colour / `background-clip:text`. |
| T4 | **Gradient text** (`background-clip: text`). I: "decorative rather than meaningful — a common AI tell, especially on headings and metrics"; T v1: "NO Excessive Gradient Text"; H 2a/2b | I, T, H, SC, U ("no gradient text") | 5 | D | H 2b exempts a single-hue ramp (stops within 40° hue). |
| T5 | **Eyebrow / kicker / pill chip above the H1 or a section heading.** I: "banned outright … no brief earns it back"; FD: "a tracked-out ALL-CAPS eyebrow label above every heading"; H 54 "The eyebrow … House rule"; U: "Eyebrow labels ('MARCH SNAPSHOT' uppercase with letter-spacing)"; SC "Headline badge" | FD, I, H, U, SC | 5 | D | SC: a pill 40–600×16–56px with 3–80 chars, ≤220px above the h1, background alpha ≥0.05 or border ≥1px at alpha ≥0.15. H legal exceptions: `<figcaption>`, `<th>`, `<label>`, `<time>`, a byline, a live `role=status` chip, one linked announcement. |
| T6 | **Tracked uppercase small labels in general.** FD: "Using all caps for labels"; H 67: "text at 15px or under set uppercase … or letter-spaced past 0.03em" (Floor); U: "Muted labels with uppercase + letter-spacing"; T v2.5 copy.md "Banned: … all-caps labels" | FD, H, U, T, I (kicker) | 5 | D | `text-transform:uppercase` or `letter-spacing > 0.03em` on text ≤15px. Count occurrences per page, don't flag each one. |
| T7 | **Italic serif display hero** (Fraunces/Recoleta/Playfair/Newsreader italic). I: "has become the universal AI-startup landing page hero"; H 38ii "An italic display system" | I, H, FD (cluster 1 serif display) | 3 | D | h1 `font-style: italic` + serif family. |
| T8 | **Oversized H1** (a full-sentence headline at display size). T v1: "NO Oversized H1s"; I oversized-h1: "full-sentence headline … dominating the viewport" | T, I | 2 | D | Long text × large size; a 1–2-word headline is fine (I). |
| T9 | **Flat type hierarchy.** I: heading and body "separated by less than 1.25× at every step" | I, FD0 cookbook ("Size jumps of 3x+, not 1.5x") | 2 | D | Ratio of the computed sizes of h1/h2/p roles. |
| T10 | **Monospace as costume** for small labels and meta. FD: "a monospace face for small data labels"; I: "Monospace as a costume for 'technical'"; H 64 | FD, I, H | 3 | D | Mono on labels/captions while neither display nor body is mono and the content is not code or numbers. |
| T11 | **Too many families.** V0: "NEVER use more than two font families"; H 37: "More than three"; FD: "one family or two" | V0, H, FD | 3 | D | Count distinct `font-family` on visible text. Weak slop signal. |
| T12 | **Serif headline + system sans as a "premium" shortcut.** U: "No serif headline + system sans fallback combo" | U, (FD cluster 1) | 2 | D |  |
| T13 | Line length > ~75–80ch (craft) | FD, I, H 25, T v1 (65ch) | 4 | D | Quality, not authorship; weight low. |
| T14 | Crushed tracking below −0.04em | I (`extreme-negative-tracking`, craft-floor) | 1 | D | T v1 _recommends_ `tracking-tighter` (−0.05em); that clash is itself a fingerprint of T-v1 output. |

### 2.2 Colour and gradients

| # | Rule | Sources | n | Check | Thresholds / notes |
| --- | --- | --- | --- | --- | --- |
| C1 | **Purple / violet / indigo accent, purple→blue or purple→pink gradient.** FD0: "particularly purple gradients on white backgrounds"; old I: "purple-to-blue gradients on white — it's the #1 'AI slop' tell"; T v1 "THE LILA BAN"; T v2.5 "never violet: deal again"; V0: "NEVER use purple or violet prominently"; SD: "Avoid using purple, indigo, or blue colors"; H 2a (Floor); EX #4 "Purple-Gradient Hero" | FD0, I, T, H, SC, V0, SD, EX | **8** | D | SC `isPurple`: HSL h 250–300°, s >0.25, 0.15< l <0.85, alpha ≥0.3, on a filled CTA/link bg or border. I: hue 250–320° for gradients; 260–310° for headings. **The generators themselves ban it**, so in 2026 this marks older or unprompted output. |
| C2 | **Near-black ground + one neon / cyan / acid-green accent.** FD cluster 2: "near-black background with a single bright acid-green or vermilion accent"; I ai-color-palette: "cyan-on-dark"; H 2a; U: "'Premium dark mode' that really means blue-black gradients plus cyan accents"; T v1 "NO Neon" | FD, I, H, U, T | 5 | D | I: flat neon on dark counts only when a second tell hue joins it. |
| C3 | **Perma-dark with muted grey body text.** SC: "Dark background with muted grey body text"; U: "Overuse of muted gray-blue text"; "No generic dark SaaS UI composition" | SC, U, FD (cluster 2), I (calibration) | 4 | D | SC: ≥12% of body samples (12–20px, weight ≤600) below AAA on surfaces with luminance <0.2, or ≥70% of body text on dark surfaces. |
| C4 | **Decorative gradient washes / backgrounds.** FD: "gradient washes as decoration"; V0: "Avoid gradients entirely unless explicitly asked"; U: "No soft corporate gradients used to fake taste"; I craft-floor: "Gradients, glass, generic icon tiles … the gap wearing chrome" | FD, V0, U, I, SC, H 29, T v2.5 ("no … gradient" on product/service) | **7** | D | SC: ≥4 visible background gradients, or a gradient-clipped h1. Ignore no-op gradients (all stops transparent). LV _prescribes_ `--gradient-primary: linear-gradient(135deg, primary, primary-glow)`, a direct fingerprint. |
| C5 | **Cream / beige ground + high-contrast serif + terracotta accent** (the "Claude look"). FD: "warm cream background (near #F4F1EA) … terracotta … (often near #D97757 — Anthropic's own … accent)"; I cream-palette; H 65 | FD, I, H | 3 | D | H: paper OKLCH L ≥90, hue 55–105; accent hue 15–55. Require 2 of 3 axes (bg, serif display, accent). |
| C6 | **Gray text on a coloured background.** old I: "it looks washed out"; H 41 | I (`gray-on-color`), H | 2 | D | I: bg channel spread ≥40; skip pale tints (OKLCH L ≥0.9, C ≤0.09). |
| C7 | **Framework stock swatch** (Tailwind indigo-500, violet-600, slate-900; #E5E7EB borders). H 74; EX #9 "usually Tailwind's #E5E7EB from web muscle memory" | H, EX | 2 | D | Exact match against the Tailwind palette. T v1 _prescribes_ Zinc/Slate, so it fights this rule. |
| C8 | **Untouched shadcn defaults.** T v1: "NEVER in its generic default state"; SD: "NEVER stay with default shadcn/ui components"; LV: "Shadcn components are made to be customized!" | T, SD, LV | 3 | D | Fingerprint values from SH (neutral): `--radius: 0.625rem`; bg `oklch(1 0 0)`; fg `oklch(0.145 0 0)`; primary `oklch(0.205 0 0)`; muted/secondary/accent `oklch(0.97 0 0)`; muted-fg `oklch(0.556 0 0)`; border/input `oklch(0.922 0 0)`; ring `oklch(0.708 0 0)`; destructive `oklch(0.577 0.245 27.325)`. Read the CSS custom properties on `:root`; computed colours alone also match an ordinary neutral site. |
| C9 | Pure #000 / #fff | T v1 ("Never use #000000"), old I, H 7a/7b | 3 | D | **Contradicted**: FD lists "tinted near-black (#0B0B0B, #111) standing in for black" as a tell, and BX says a pure gray ramp is a good default. Don't score it. |
| C10 | Max 1 accent, max 3–5 colours | T v1, V0 | 2 | D | A constraint generators follow, so meeting it is a weak _slop_ signal, not a clean one. Skip. |

### 2.3 Layout and hero

| # | Rule | Sources | n | Check | Thresholds / notes |
| --- | --- | --- | --- | --- | --- |
| L1 | **Three equal cards in a row (icon + heading + text) as page structure.** FD: "the SaaS-card kit: content chopped into identical rounded cards"; I: "Same-size cards of icon plus heading plus text as the page structure. Cards are the lazy container"; T v1: "NO 3-Column Card Layouts"; H 3; EX #7 "Everything's a Card"; old I "Wrap everything in cards" | FD, I, T, H, EX, U ("metric-card grid as the first instinct") | **6** | D | Sibling set of 3 (or 4) with equal width/height, each holding an svg/icon + heading + p. |
| L2 | **Hero-metric / stat banner** ("10K+ users · 99.9% uptime · 4.9★"). FD: "a big number with a small label, supporting stats, and a gradient accent is the default treatment"; I: "The hero-metric template"; SC "Stat banner"; H 46b; U "KPI cards in a grid as the default" | FD, I, SC, H, U | 5 | D | SC: a row ≥300px wide with 3–6 children, each a numeric token ≤10 chars at ≥22px (`\d[\d,.]_\s_(k | m | b | % | x | \+)?`); ignore pure ordinals. |
| L3 | **Numbered markers 01 / 02 / 03** when the content is not a real sequence. FD: "only appropriate if the content actually is a sequence"; I `numbered-section-labels`; SC "1 · 2 · 3 steps"; H 66 ("`01 / 4` count on tiles") | FD, I, SC, H | 4 | D (+C for "is it a sequence") | SC: a run of ≥3 consecutive digits ≥14px, or in badges ≥24px. |
| L4 | **Centered hero** (title, lede, CTA, mark on one axis), especially with a generic sans. SC "Centered + Inter"; T v1 "ANTI-CENTER BIAS"; H 6b; old I "Center everything" | SC, T, H, I | 4 | D | SC: centered h1 + ≥40% of the hero centered + generic heading font. **Centered alone is canon**; only flag it combined with other tells. |
| L5 | **The AI template order**: hero → 3 features → CTA → footer. H 8: "The AI template (hero, three features, call to action, footer)"; T v1/I/U imply it | H, I, T, U | 4 | D (section sequence) |  |
| L6 | **AI nav / AI footer chrome**: "wordmark left, inline links, button right, hairline under"; "four link columns, social row, copyright" | H 42 | 1 | D | Very common on human sites too, so weight it near zero. |
| L7 | **Monotonous spacing** / every section the same gap. I `monotonous-spacing`; H 9/59 ("every gap the same"); EX #12 "16-Everything"; old I | I, H, EX | 3 | D | Variance of the gaps between sections; share of `padding` values equal to a single value. |
| L8 | **FAQ accordion near the bottom** (≥3 Q&As under a "Frequently asked questions" heading) | SC | 1 | D | Weak; H treats a conversational FAQ as a valid macrostructure. |
| L9 | **Stock close**: email sign-up as the last section | H 85 | 1 | D |  |
| L10 | **Hero sized in `vh`** / `h-screen` | H 6a, T v1 | 2 | D | Craft (mobile jump), not authorship. |
| L11 | **Drawn product mock / browser chrome** (traffic lights, URL pill), or a "product UI" of styled divs | H 47a/47c, T v2.5 ("never a generic dashboard") | 2 | D/S | Detect three coloured 8–14px circles in a row top-left of a box. |
| L12 | **Hero inside an internal app / dashboard**; decorative copy as page header | U, H 66 | 2 | D/C | Operate surfaces only. |
| L13 | **Dead band / sparse section** (more than 160px of nothing below the hero content) | H 79, T v2.5 ("nothing sparse") | 2 | D | Quality. |

### 2.4 Components, cards, icons

| # | Rule | Sources | n | Check | Thresholds / notes |
| --- | --- | --- | --- | --- | --- |
| K1 | **Emoji as icons / emoji-prefixed nav, bullets or headings.** T v1: "ANTI-EMOJI POLICY [CRITICAL] … Emojis are BANNED"; V0: "NEVER use emojis as icons"; SD: "NEVER use emojis in your web application"; LV: "Minimize emoji use"; I: "Unicode glyphs or emoji standing in for an icon system"; H 30a (Floor); EX #3; MS "Emoji as structure (Ban in B2B): 🚀 ✨ ✅"; UX "Emoji as icons" | T, V0, SD, LV, I, H, SC, EX, MS, UX | **10** | D/C | SC: ≥40% of ≥3 sidebar/nav links contain emoji. Regex `[\p{Emoji_Presentation}\x{FE0F}]` (EX). Scope to headings, nav, buttons, list-item starts; emoji inside prose or UGC is not the tell. |
| K2 | **Nested cards.** I: "nested cards are always wrong"; H 4 (Floor); EX #7; T v2.5 "two boxes deep at most" | I, H, EX, T | 4 | D | Box with border/shadow/bg inside another such box. |
| K3 | **Icon in a rounded-square tile above a heading.** I icon-tile-stack: "the universal AI feature-card template — every generator outputs this exact shape"; H 3; old I "large icons with rounded corners above every heading"; U "no decorative icon backgrounds" | I, H, U | 3 | D | I: tile background alpha ≥0.05, roughly square, directly above an h2–h4. |
| K4 | **Side-stripe accent border** on cards/callouts. I side-tab: "the most recognizable tell of AI-generated UIs"; craft-floor: "colored border-left or border-right above 1px"; SC "Accent stripe"; H 3 | I, SC, H | 3 | D | SC: one side 2–10px, colour saturation ≥0.2, other sides thin, element ≥40×20, not blockquote/table/hr. I: the stripe on a radius ≥4px is worse (`border-accent-on-rounded`). |
| K5 | **Glassmorphism** (backdrop-blur translucent panels) as default language. I: "Glass and blur as decoration"; U: "No floating glassmorphism shells"; SC "Glassmorphism" | I, U, SC, H 29 (wash) | 4 | D | SC: `backdrop-filter` blur ≥2px, bg alpha 0.02–0.9, 150–820px wide, not a full-width sticky nav (≥85% width within 20px of the top is excluded). T v1 _prescribes_ "Liquid Glass" (fingerprint). |
| K6 | **Hairline border + wide soft shadow on every card** ("ghost card"); same `rgba(0,0,0,.1)` shadow everywhere. I gpt-thin-border-wide-shadow; FD: "the same soft grey shadow (rgba(0,0,0,.1)) under each" | I, FD | 2 | D | T v1 _prescribes_ exactly this (`border-slate-200/50` + `shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]`, `rounded-[2.5rem]`, bg `#f9fafb`), so that combination fingerprints T-v1 output. |
| K7 | **Oversized radius / one radius on everything / pill overload.** FD: "one border-radius on everything regardless of hierarchy"; U: "Border radii in the 20px to 32px range across everything", "No pill overload"; I: "Card radii stay at 12–16px; pills are for small controls" | FD, U, I | 3 | D | Histogram of computed `border-radius`: one dominant value on cards, buttons and panels alike; radius ≥20px on cards. |
| K8 | **Template punctuation**: middle-dot meta strings (`A · B · C`), arrow glued to link/CTA (`Learn more →`), `WORD — fragment` labels. FD tells; H 63 (Floor) | FD, H, MS ("Unicode decoration … arrows") | 3 | C/D | H fires from 2 dots in one string; a byline or caption gets one dot. |
| K9 | **Pulsing / decorative status dots.** I pulsing-dot; H 63 "decorative status dots before labels"; U "Status indicators with ::before pseudo-elements creating colored dots" | I, H, U | 3 | D | Small circle + infinite `animation`. T v1 _prescribes_ "breathing status indicators". |
| K10 | **Generic CTA pair** (_Learn more_, _Get started_, _Book a demo_ as the second action) | H 19, T v2.5 copy ("Never 'Learn more', 'Read more', 'Discover', 'Explore'") | 2 | C |  |
| K11 | **Lucide icons / a lucide icon as the logo** (generator default) | BO ("Use icons from lucide-react for logos"), OR, V0/shadcn stack | fingerprint | D | `svg.lucide` / `class="lucide lucide-*"`; a lucide glyph inside the brand link next to the wordmark is the strongest version. |
| K12 | Two icon libraries on one page | H 30b, BX better-ui icons.md | 2 | D | Craft. |
| K13 | Hard offset shadows (`4px 4px 0`) outside a real neobrutalist world | I (craft-floor, `hard-offset-shadow`, "a review prompt, not evidence") | 1 | D | I itself marks it non-evidence. Weight low. |

### 2.5 Effects: blur, glow, shadows, backgrounds

| # | Rule | Sources | n | Check | Thresholds / notes |
| --- | --- | --- | --- | --- | --- |
| X1 | **Coloured glow shadows** (zero-offset chromatic halo, or coloured blur on dark). I dark-glow: "the default 'cool' look of AI-generated UIs"; T v1 "NO Neon/Outer Glows"; U "no colored shadows", "UI cards using glows instead of hierarchy"; SC "Colored glow"; H 29 | I, T, U, SC, H | 5 | D | SC: saturated `box-shadow` colour with blur ≥15px on ≥2 elements. I: strength ≥3px, colour lifts ≥20 over its surface; a dark shadow within 50° hue of its surface is shade, not glow. LV _prescribes_ `--shadow-glow: 0 0 40px hsl(var(--primary-glow) / 0.4)`. |
| X2 | **Radial halo / spotlight / aurora / mesh blobs / floating blurred orbs.** I radial-halo, radial-spotlight-glow; H 29 "aurora or mesh blobs behind text, floating blurred orbs"; V0 "NEVER generate abstract shapes like gradient circles, blurry squares, or decorative blobs as filler"; U "No random glows, blur haze" | I, H, V0, U | 4 | D | `radial-gradient` saturated centre → transparent behind the hero; large absolutely positioned elements with `filter: blur(≥40px)`. MU ships aurora-text, light-rays, backlight, meteors, sparkles, warp-background: these are fingerprints too. |
| X3 | **Decorative grid / dot / line-field background.** I codex-grid-background: "hairline linear-gradient layers tiled by a fixed pixel cell"; craft-floor "two-axis grid overlays need an actual canvas, map, blueprint" | I, H 47c | 2 | D | `background-image` with two linear-gradients + `background-size` in px; SVG `<pattern>`. MU: grid-pattern, dot-pattern, retro-grid, flickering-grid, animated-grid-pattern, hexagon-pattern, striped-pattern. |
| X4 | **Repeating-gradient stripes** as surface decoration | I | 1 | D | `repeating-linear-gradient`. |
| X5 | **Shape-assembled / drawn SVG illustration** at hero size. I: "reads as placeholder clip art"; H 80 "an SVG of 120px or more with three curv[es]…"; V0 "NEVER create SVGs directly for complex illustrations" | I, H, V0 | 3 | D | Large inline SVG with many primitive children; I also flags `loose-sketch`/`doodle` class names and `feTurbulence` grain. |
| X6 | **Many-vertex `clip-path` faking an organic edge** | I `organic-clip-path`, H 47c | 2 | D | polygon with many vertices, or `path()`. |
| X7 | **Dramatic drop shadows** (`0 24px 60px rgba(0,0,0,.35)`, opacity ≥0.15 & blur ≥10 on white) | U, EX #8 | 2 | D |  |
| X8 | **Empty gradient block where an image belongs** (≥300×200 showing only its wash) | H 81, I craft-floor | 2 | D/S |  |
| X9 | Grain/noise overlay | **disputed**: FD0 cookbook & T v1 recommend grain/noise; I bans `feTurbulence` grain as amateur | — | D | Don't score. |

### 2.6 Motion

| # | Rule | Sources | n | Check | Thresholds / notes |
| --- | --- | --- | --- | --- | --- |
| M1 | **Fade-and-slide-up entrance on every section** / staggered reveal everywhere. FD: "fade-and-slide-up entrances on each section and hover transitions on every card are the generic default and read as AI-generated"; I: "not one identical entrance on every section"; T v2.5 Never: "a reveal, fade-in or parallax"; EX #14 "The Grand Entrance" | FD, I, T(v2.5), EX | 4 | D (+time) | Count sections whose content starts at `opacity:0` + translateY and is toggled by IntersectionObserver classes (`data-aos`, `.reveal`, framer `initial`). **FD0 and T v1 told models to do this** ("one well-orchestrated page load with staggered reveals"), which is why it became a tell. |
| M2 | **Bounce / elastic / overshoot easing.** I: "feel dated and tacky"; H 12; U "no bouncy animations"; BX better-ui "`bounce:` set to anything but 0"; E "Avoid bounce in most UI contexts" | I, H, U, BX, E | 5 | D | cubic-bezier with y1 or y2 outside [0,1]; keyframes named bounce/elastic; hard to see with JS springs. T v1 prescribes springs `stiffness:100, damping:20` (an underdamped overshoot). |
| M3 | **Same hover lift/scale on every card.** FD (above); H 11 "the same lift or scale on every card"; U "Transform animations on hover (translateX(2px) on nav links)"; EX #13 "The Squish Reflex" | FD, H, U, EX | 4 | D (simulate `:hover`) | **Contradicted** by T v2.5 house rule 5 (a linked card lifts 2px). |
| M4 | **`transition: all`** | E, BX, VG, H 10a | 4 | D | Craft, but LV's exact string `all 0.3s cubic-bezier(0.4, 0, 0.2, 1)` and T v1's `all 0.3s cubic-bezier(0.16,1,0.3,1)` are fingerprints. |
| M5 | **Auto-scrolling marquee** (logo strip) | I marquee, H 18 (pause control), MU `marquee` | 2 | D | `@keyframes` translateX(-50%/-100%) loop on a duplicated row. T v1 and H's macrostructure list both include marquees. |
| M6 | **Decorative blinking cursor / typewriter hero** | I blinking-cursor | 1 | D | T v1 prescribes it ("Typewriter Effect … blinking cursor"). MU `typing-animation`, `hyper-text`, `word-rotate`, `morphing-text`. |
| M7 | **Content invisible at rest** (a failed reveal leaves text at opacity 0) | I content-hidden-at-rest, H 62 (Floor) | 2 | D | After scrolling the full page and waiting, share of text at opacity 0 or `visibility:hidden`. A strong quality signal of vibe-coded pages. |
| M8 | Custom mouse cursor | T v1 | 1 | D | `cursor:none` + follower element. |
| M9 | No `prefers-reduced-motion` handling | H 27, VG, FD | 3 | D | Quality. |

### 2.7 Copy and microcopy

| # | Rule | Sources | n | Check | Thresholds / notes |
| --- | --- | --- | --- | --- | --- |
| P1 | **Buzzwords.** I list: "streamline your, empower your, supercharge your, unleash the power, leverage the power, built for the modern, trusted by leading, best-in-class, industry-leading, world-class, enterprise-grade, next-generation, cutting-edge, transform your business, revolutionize, game-changer, mission-critical, future-proof, seamless experience, seamlessly integrate, drive engagement/growth/results, harness the power"; H 19 adds robust, elevate, effortless, unlock; T v2.5: "seamless, effortless, cutting-edge, unlock, elevate, supercharge, reimagine, next-generation, game-changing, powerful, robust"; MS ban + cap tiers | I, H, T, MS, FD ("no filler") | 5 | C | MS rule: two cap-tier words in one paragraph = rewrite; ban tier = delve, tapestry, testament, realm, embark, beacon, multifaceted, paradigm, synergy, myriad, plethora, meticulous, utilize, leverage (verb), supercharge, turbocharge. |
| P2 | **Rebuttal / contrast cadence** ("Not X. Y.", "X. No Y.", "X. Just Y.", "Not a feature. A platform."). I aphoristic-cadence: "Three or more sections"; MS #1 "(Ban)"; H 19 "three or more times" | I, MS, H | 3 | C | Fire on ≥3 occurrences per page (I and H agree on 3). |
| P3 | **Em-dash density.** I: "at least 8 em-dashes … near one per 500 characters of body text"; MS: "Ban in short copy; cap at 1–2 per page in long copy"; H 19 lists "em or en dashes" | I, MS, H, T (repo purged its own em dashes as a tell) | 4 | C | Use I's threshold; never flag single dashes (BX better-typography _prescribes_ the em dash over `--`). |
| P4 | **Placeholder names and brands** (Jane Doe, John Doe, Acme, Nexus, SmartFlow), lorem ipsum, `[brackets]`, `href="#"` | T v1, H 19, T v2.5 copy ("no square brackets, lorem ipsum … no link to `#`") | 3 | C/D |  |
| P5 | **Round fake stats and proof** (99.99%, 10K+, 4.9★, "Join thousands of happy customers", "Trusted by leading teams" + logo wall) | T v1 ("NO Fake Numbers"), H 46a, MS, SC (stat banner) | 4 | C | Authorship can't be proved from the URL; score the pattern. |
| P6 | **Era / filler openers**: "In today's fast-paced world", "Built for the modern team", "Whether you're a solo founder or a Fortune 500", "Imagine…" | MS, H 19, I ("built for the modern") | 3 | C |  |
| P7 | **Rhetorical-question and colon reveals** ("The result? …", "The best part: it learns."); questions as headlines | MS #4/#5, T v2.5 ("questions as headlines") | 2 | C |  |
| P8 | **Hype punctuation / exclamation marks; Title Case Everywhere** | MS, T v2.5 ("exclamation marks") | 2 | C |  |
| P9 | **Reflexive threes / fragment drumbeat** ("Simple. Fast. Done.", "Fast, secure, and scalable") | MS (cap 1/section) | 1 | C |  |
| P10 | **Decorative self-describing copy** ("Operational clarity without the clutter"), "where X meets Y", invented Capitalised Concepts ("the Proof Layer") | U, T v2.5, MS ("Invented labels") | 3 | C |  |
| P11 | **"Theater" framing** ("security theater") | I `theater-slop-phrase` | 1 | C |  |
| P12 | **Tidy closer / wisdom-shaped sentence** ("Because your team deserves better.") | MS second-gen tells | 1 | C | An LLM judge works better than a regex here. |

### 2.8 Imagery, emoji, icons

| # | Rule | Sources | n | Check | Notes |
| --- | --- | --- | --- | --- | --- |
| G1 | Emoji as icons | see K1 | 10 | D/C |  |
| G2 | **Stock / hotlinked placeholder photos.** BO: "Use stock photos from unsplash"; SD: "use unsplash images"; T v1: "Do not use Unsplash. Use … picsum.photos/seed/…"; H 76 "a free stock hotlink is a WARN"; T v2.5 "Stock photographs passed off as the client's product" | BO, SD, T, H | fingerprint + 2 bans | D | Hosts `images.unsplash.com`, `source.unsplash.com`, `picsum.photos`, `placehold.co`, `via.placeholder.com`, `ui-avatars.com`, `i.pravatar.cc`, `randomuser.me`. |
| G3 | **Broken / empty-src images** | I broken-image, H 76, V0 ("Do NOT leave placeholder images"), T v2.5 ("Every visual renders") | 4 | D | `naturalWidth === 0` after load. |
| G4 | **Generic avatars** (egg SVG, lucide `User`) | T v1 | 1 | D |  |
| G5 | **Fake illustration** (see X5) | I, H, V0 | 3 | D |  |
| G6 | Photo wall: photos covering more than ⅓ of the page below the hero | H 83 | 1 | S | Disputed: T v2.5 _wants_ 12–20 photos on a place page. |

### 2.9 Generator and library fingerprints (not bans, they identify the source)

| Fingerprint | Source | Check |
| --- | --- | --- |
| shadcn neutral tokens, `--radius: 0.625rem` (see C8); `data-slot="button"` etc. on shadcn v4 components | SH, V0 (pre-installed new-york), SD, OR | D |
| Geist + Geist Mono via `next/font` (`__variable_*` classes, `--font-geist-sans`) | V0 example layout; T v1 recommends Geist | D |
| Lovable tokens: `--gradient-primary` (135deg primary → primary-glow), `--shadow-elegant: 0 10px 30px -10px primary/.3`, `--shadow-glow: 0 0 40px primary-glow/.4`, `--transition-smooth: all 0.3s cubic-bezier(0.4,0,0.2,1)`, hero button `bg-white/10 border-white/20`, all HSL triplets | LV | D (custom-property names survive in the CSS) |
| `tw-animate-css` classes (`animate-in fade-in slide-in-from-bottom-*`) | OR, shadcn v4 | D |
| `lucide` svg classes; a lucide icon as the logo | BO, OR | D |
| Magic UI / Aceternity component signatures: border-beam, shimmer-button, shine-border, animated-gradient-text, aurora-text, number-ticker, marquee, bento-grid, globe, orbiting-circles, meteors, sparkles-text, dot/grid/retro-grid patterns, spotlight | MU registry | D (class names, keyframe names, structure) |
| T v1 Bento 2.0: bg `#f9fafb`, white cards, `border-slate-200/50`, `rounded-[2.5rem]`, `shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]`, labels under cards, perpetual loops, magnetic buttons, Satoshi/Cabinet Grotesk/Outfit | T v1 §3, §9 | D |
| Picsum seeds (`picsum.photos/seed/…`), "messy" fake numbers (`47.2%`, `+1 (312) 847-1928`) | T v1 | D/C |
| Hallmark stamp comment in the first CSS lines | H 20 | D (`/* hallmark` …) |
| Impeccable contract never shipped (new-work l.75 forbids it) | I | — |

---

## 3. Top rules ranked by consensus × checkability

Score = n (independent sources) × check factor (D = 1.0, C = 0.8, S = 0.6), adjusted down for rules that sources contradict. "Weight hint" is a suggestion for Slop Score.

| Rank | Rule | n | Check | Weight hint | Detector reference to copy |
| --- | --- | --- | --- | --- | --- |
| 1 | Emoji as icons / emoji-prefixed nav, buttons, headings (K1) | 10 | D/C | high | SC `sidebar-emoji.js`; EX regex |
| 2 | Purple/violet/indigo accent or purple→blue/pink gradient (C1) | 8 | D | high | SC `color.js isPurple` (h 250–300); I `ai-color-palette` |
| 3 | Decorative gradient backgrounds / washes (C4) | 7 | D | medium (only ≥4 gradients) | SC `gradients.js` |
| 4 | Default workhorse font as the page face (T1) | 8 | D | medium, **only combined** (mode-sensitive) | I `overused-font`; SC `centered-hero.js` |
| 5 | Three equal icon+heading+text cards as structure (L1) | 6 | D | high | I `icon-tile-stack` + layout heuristic |
| 6 | Gradient text (T4) | 5 | D | high | I `gradient-text`; SC `gradients.js` |
| 7 | Eyebrow / pill badge above the H1 (T5) | 5 | D | high | SC `hero-eyebrow-pill.js`; I `hero-eyebrow-chip`, `kicker-above-heading` |
| 8 | Coloured glow shadows (X1) | 5 | D | high | SC `colored-glows.js`; I `dark-glow` |
| 9 | Hero-metric / stat banner (L2) | 5 | D | medium-high | SC `stat-banner.js` |
| 10 | Tracked uppercase small labels (T6) | 5 | D | medium (count density) | H 67 thresholds |
| 11 | Near-black + neon/cyan accent (C2) | 5 | D | medium | I `ai-color-palette` |
| 12 | Bounce/elastic easing (M2) | 5 | D | medium | I `bounce-easing` |
| 13 | Buzzword phrases (P1) | 5 | C | medium-high | I `BUZZWORDS` list |
| 14 | Second-wave display faces: Space Grotesk, Instrument Serif, Fraunces, Syne… (T2) | 4 | D | medium | SC `slop-fonts.js` (≥25% or heading) |
| 15 | Accented word in the headline (T3) | 4 | D | high | SC `hero-font-mix.js` |
| 16 | Nested cards (K2) | 4 | D | medium | I `nested-cards` |
| 17 | Glassmorphism panels (K5) | 4 | D | medium | SC `glassmorphism.js` |
| 18 | Numbered 01/02/03 markers (L3) | 4 | D | medium | SC `numbered-steps.js`; I `numbered-section-labels` |
| 19 | Perma-dark + muted grey body text (C3) | 4 | D | medium | SC `perma-dark-mode.js` |
| 20 | Radial halo / aurora / blurred orbs (X2) | 4 | D | medium | I `radial-halo`, `radial-spotlight-glow` |
| 21 | Fade-up entrance on every section (M1) | 4 | D+time | medium | I `content-hidden-at-rest` logic, extended |
| 22 | Centered hero + generic sans (L4) | 4 | D | low alone | SC `centered-hero.js` |
| 23 | Em-dash density (P3) | 4 | C | low-medium | I `em-dash-overuse` (≥8, ~1/500 chars) |
| 24 | Fake round stats / invented proof (P5) | 4 | C | medium | SC stat-banner + regex |
| 25 | Same hover lift on every card (M3) | 4 | D (:hover sim) | low (disputed by T v2.5) | — |
| 26 | Side-stripe accent border (K4) | 3 | D | high (I: "most recognizable") | SC `accent-stripe.js`; I `side-tab` |
| 27 | Icon tile above heading (K3) | 3 | D | high | I `icon-tile-stack` |
| 28 | Cream + serif + terracotta "Claude look" (C5) | 3 | D | medium | I `cream-palette`; H 65 ranges |
| 29 | Template punctuation: `A · B · C`, `Learn more →` (K8) | 3 | C/D | medium | H 63 (fires from 2 dots) |
| 30 | Monotonous section spacing (L7) | 3 | D | low | I `monotonous-spacing` |
| + | Fingerprints (§2.9): shadcn untouched tokens, Lovable tokens, Unsplash/picsum hosts, lucide-as-logo, Magic UI signatures | — | D | low each, high stacked | — |

The quality signals that vibe-coded pages trip most often, worth a separate "broken" sub-score: content hidden at rest (M7), broken images (G3), text overflow/occlusion (I `text-overflow`, `text-occlusion`), script errors on load (I `script-error`), horizontal scroll (H 34).

---

## 4. False-positive traps and "this is NOT slop" statements

1. **The brief or brand wins everywhere.** FD: "the brief's own words always win, including when it asks for one of these looks"; I: "These are the category's defaults, not bans: the brief's own words can earn any of them"; EX: "A card, font, gradient, or onboarding flow is not a defect by itself". From a URL you cannot see the brief, so **score co-occurrence, never single tells.** SC's own data: ~5–10% FP on 150 labelled sites, and a reviewer notes disciplined minimalist systems (Material, Tailwind) can score high.
2. **System fonts and Inter are fine for app UI and docs.** I new-work: "Operate and Read surfaces are well served by system stacks and workhorse UI faces"; BX better-typography: sans-serif "Default for most interfaces (Helvetica, Inter, Geist)"; U lists "system fonts or simple sans-serif" as _normal_; EX: "System type (SF / Roboto) by default". Weight T1 only on marketing pages (Persuade), and only with other tells. Inter on a dashboard, or Apple/GitHub-style system stacks, must not score.
3. **Minimalism and plain neutrals are not slop.** BX better-colors: "A pure gray ramp is a perfectly good default"; U wants calm, standard layouts ("Think Linear … Stripe … GitHub"); SC scores news.ycombinator.com 0/100. But beware: _untouched_ shadcn neutral is a fingerprint (C8). Detect the exact token set, not "is grey".
4. **Pure black/white**: T v1 and old I ban #000/#fff, while FD calls tinted near-black (#0B0B0B, #111) the tell. Score neither.
5. **Rules that contradict each other across skills (don't score, or score only as a source fingerprint):** staggered reveals (FD0 and T v1 prescribe them; FD, I and T v2.5 ban them); grain/noise (FD0, T v1 yes; I no); springs and magnetic buttons (T v1 yes; I, H no bounce); hover lift (T v2.5 requires a 2px lift; FD, H, U flag it); glass (T v1 "Liquid Glass" yes; I, U, SC no); Geist (T v1, V0 recommend it; I and H flag it; SC dropped it); bento grid (T v1 prescribes it; H lists it as a valid macrostructure); marquee and typewriter (T v1 prescribes them; I flags them); Uncodixfy's own "pick from" palettes include violets (#a78bfa, #bb86fc, #a855f7).
6. **Second-generation slop.** The antidote lists turned into defaults: the cookbook's recommended faces (Space Grotesk, Fraunces, Playfair, IBM Plex, Newsreader, Bricolage, Satoshi, Cabinet Grotesk) are now on I's, SC's and H's flag lists. Expect the "clean" anti-slop look (cream editorial, broadsheet hairlines, mono labels, tracked caps) to be the 2026 fingerprint. FD and I calibration clusters name it explicitly. Keep the font and palette lists versioned and data-driven.
7. **Centered hero, FAQ, nav/footer layout and 3-step "how it works" are canon** on human sites. Only count them stacked with others (H itself treats FAQ and centered "atmospheric/playful" posters as legitimate).
8. **Legit uses of flagged devices**, per the skills: numbering when the content _is_ a sequence (FD, I); hairline grids on real canvas, map or blueprint surfaces (I); monospace for code, data or measurements (I, H 64); one dot in a byline or caption, a live status chip, a `<figcaption>`/`<th>`/`<label>` above content (H 54, H 63); a pulse on genuinely live data (I); bounce on a literal bouncing object (I hooks.md); a neobrutalist site's hard shadows (I calls `hard-offset-shadow` "not evidence of AI authorship"); gradient text in a single-hue ramp (H 2b); one "No card required" (MS "Still fine").
9. **Em dashes**: the typography craft skill (BX) _recommends_ the real em dash over `--`. Flag density only (I: ≥8 at ~1/500 chars), never presence.
10. **Emoji in content ≠ emoji as icon.** EX: "content strings may contain emoji; glyph-as-icon is the tell". Restrict K1 to nav, buttons, headings, list-item leading glyphs and feature-card icon slots.
11. **Sticky glass navs.** SC excludes full-width (≥85%) blurred bars at the top edge. A frosted sticky header is a standard OS/web pattern, not glassmorphism-as-language.
12. **Dark mode by user preference.** Load with `prefers-color-scheme: light` _and_ dark; only score "perma-dark" (C3) when the light render is also dark.
13. **Copy rules depend on language.** The buzzword and cadence lists are English-only; skip them, or localise them, for other `lang` values.
14. **Craft rules aren't authorship rules.** `transition: all`, line length, contrast, reduced motion and heading skips (E, VG, BX, H Floor gates) fire on plenty of human sites. Keep them in a separate "quality" axis so they don't inflate the slop score (I's detector already separates `category: slop` from `category: quality`).

---

## 5. Notes for building Slop Score

- **Reusable open code**: SC (MIT) has 14 browser-side `extract(ctx)` functions with thresholds, a labelling UI and an eval harness (165 labels). I (Apache-2.0) ships `crates/live/assets/detect-antipatterns-browser.js` (3.2MB bundle, 62 rules) plus readable Rust source with thresholds. H (MIT) ships pass/fail HTML fixtures (`skills/hallmark/scripts/fixtures/eyebrow-pass|fail`, exemplars per genre) that work as regression tests.
- **SC scoring** is `round(100 × flagged / 14)`, with tiers 5+ High, 3–4 Medium, 1–2 Low. That is unweighted; weighting by the consensus column above, and requiring ≥2 co-occurring tells, should cut false positives.
- **Viewport set** used by the skills' checkers: 1440×900 (H, T), 1280×800 (H 44b), 1920×1080 (H 44d), 390/320 mobile. Above-the-fold rules (eyebrow, hero font mix, stat banner) need the 1440×900 first viewport.

---

## 6. Addendum: Cursor `unslop` (missed in the first pass)

Source: github.com/cursor/plugins `pstack/skills/unslop/SKILL.md` (same file at `harness/pstack/claude-code/skills/unslop/SKILL.md`). 33K installs on skills.sh, repo 15.6k★. History: added 2026-05-23 (24bd6eb895), distilled 2026-10-10 (00b14f1df3), last change 2026-10-12 (bc697d0a5a). Full copies: `research/unslop.md` (current), versions read via `gh api …?ref=`.

It is a **prose** skill (any writing), not a UI skill. Numbered rules are stable ids; the current file keeps 3, 5, 7–20, 22–33. The original version also had #1 significance inflation, #2 notability name-dropping, #4 promotional language, #6 formulaic challenges, #21 cutoff disclaimers, plus an "add soul" section; these were cut in later versions.

Mapped into Slop Score (methodology 2026-11-07.6):

- `ai-vocabulary` (new, weight 4, English only): #7 AI vocabulary, #8 copula avoidance, #1 significance inflation, #4 promotional words, #25 generic conclusions, #26 metaphor nouns, #31 fancy words. Each term counts once, weighted 0.3–1; fires from 2.0.
- `contrast-cadence`: adds #9 "not just X, but Y".
- `placeholders`: adds #20 chatbot phrases, #22 sycophancy, #21 cutoff disclaimers.
- `labelled-items` (new, weight 3): #16 inline-header lists, i.e. ≥4 `<li>` opening with a bold "Label:"; a bold lead-in ending in a full stop is exempt, as the skill says.
- Already covered: #13 em dashes (density only, since an outright ban would hit careful human typography), #18 decorative emoji.
- Not scored: #17 title case (US house style on many hand-made sites), #19 curly quotes (correct typography on the web), #3 -ing phrases, #5 vague attributions, #10–12, #14, #15, #23–24, #27–33 (need judgment or have too many false positives on short copy).

Calibration (44 sites, 2026-11-07): the new copy rules fired on none of them. The vocabulary peaked at 0.6 on human sites (tailwindcss "vibrant", are.na "foster") and was 0 on generated landing pages: generator landing copy uses marketing template phrases (`buzzwords`), not model prose vocabulary. Expect hits on generated About pages, blogs and portfolios, not heroes.

## 7. Jev on copy: tried and rejected (2026-11-07)

Scripts: `calib/copyjudge.mjs` (per-line Score "could this line appear unchanged on another product's site?", 3 levels) and `calib/copyvoice.mjs` (one Score per site, "who wrote this copy?", 5 levels listing the unslop habits). 26 calibration sites, jev-latest, 500–5,500 input tokens per site.

- Per-line genericness is inverted: brands write short slogans on purpose (linear 1.48, basecamp 1.68, raycast 1.52 mean), while generators spell out features (freesubtitlemaker.lovable.app 0.89, shadcnblocks 0.79).
- Holistic authorship does not separate: resend 3.15, tailwindcss 3.12, raycast 3.07 and vercel 2.62 sit among the generated pages (makeurquiz 3.47, startup-template 3.21), with confidence 0–0.5. Polished marketing copy and model copy have converged.
- Decision: Jev stays on the screenshot only; copy stays on regex rules that quote their evidence.

Also removed in 2026-11-07.7: the last site-specific exception (`FONT_HOMES`, Geist on vercel.com, Inter on rsms.me). Every site is held to the same rules: vercel.com 99 → 94, rsms.me 99.

## 8. False-positive triage (methodology 2026-11-07.8)

17 hand-made reference sites, 47 rule hits. 44 were true detections, meaning the pattern really is on the page (Stripe's purple gradients and stat row, Raycast's glass and dark-only theme, Resend's multi-hue gradient text and news pill). These stay: the score measures how template a page looks, not who made it. 3 were detector misreads, now fixed:

- eyebrow-pill kicker branch read `text-8xl`, a code label in Tailwind's hero demo, as a kicker. The kicker detection is removed and only framed, rounded pills count.
- glow counted 4 small coloured demo squares on tailwindcss.com. The minimum is now 6 elements; generated sites show 17–91.
- gradient-washes counted 4 chart bars in Linear's product mock. The minimum is now 6 surfaces; generated sites show 15–56. Generated sites' scores are unchanged (±1, Jev noise). Hand-made: tailwindcss 79 → 89, linear 98.

## 9. skills.sh sweep follow-up (methodology 2026-11-07.9)

Full sweep: `research/skills-sh-sweep.md` (21 new sources). Rule kept for adding anything: it must not fire on any of the 17 hand-made reference sites.

- Added to `placeholders` (renamed "Leftovers from a template or a chat"): chatbot citation markup (citeturn…, oaicite, oai_citation, 【n†source】), links carrying utm_source/referrer=chatgpt|claude|perplexity…, unfilled dates (2026-XX-XX) and INSERT_… tokens, and raw Markdown (≥2 of **bold**, "## ", [text](url)) in prose. Prose means visible text minus pre/code/kbd/samp/textarea, so documentation sites don't trip it; tailwindcss.com stays clean. 0 hits on hand-made sites, 0 new hits on generated sites: these artifacts are rare but near-certain.
- Not added, because they also appear on hand-made sites: generic CTAs ("Get started", Stripe and Vercel), three pricing tiers with "Most popular", macOS window frames (Linear, Raycast), staccato headline fragments, the mid-2026 vocabulary list ("practical", "matters", "clearer"), zero-width characters (emoji ZWJ sequences), radius, shadow, letter-spacing and `transition: all` thresholds (craft, not authorship).
- Em dash: the sweep says to weaken it, because the newest models avoid it. It stays at weight 3 with density only, and fires on no hand-made site.

**Decision (2026-11-07):** the em-dash rule stays. It counts density only, weighs 3, and fired on none of the 17 hand-made sites.
