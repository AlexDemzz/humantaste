# skills.sh sweep: anti-slop, unslop and AI-tells skills the first pass missed

Swept on 2026-11-07. Goal: rules that a landing-page scanner (DOM, computed CSS, visible-text regex) can apply, beyond what Slop Score already has.

## How the sweep was done

- skills.sh exposes a JSON search endpoint: `https://skills.sh/api/search?q=<term>` (returns `id`, `source`, `installs`). I queried: slop, unslop, deslop, anti-slop, ai writing, humanize, humanizer, ai tells, design, frontend, landing, landing page, copywriting, taste, generic, ai design, writing style, de-ai, web design, ui design. Also read `https://skills.sh/trending` and `https://skills.sh/hot`.
- GitHub code search (`gh search code '"AI slop" filename:SKILL.md'`, `'"ai tells" filename:SKILL.md'`, `unslop`, `"de-slop"`, `humanizer`, `"generic AI" landing`) to catch skills inside monorepos.
- Every rule below was read from the primary file (SKILL.md, reference files, or detector source), not from a README summary. Raw downloads live next to this file in `research/dl/`.
- Wikipedia's "Signs of AI writing" was read as raw wikitext (`action=raw`), revision of 2026-11-06T22:56Z.

Install counts are skills.sh's own numbers on 2026-11-07. Some are clearly inflated by mirrors or install bots (several near-identical `superpowers/landing-page-design` forks each claim 30K-60K), so stars and the content itself matter more than raw installs.

---

## 1. Sources

### Read in full, contributes new rules

| # | Skill | Repo + file(s) read | skills.sh installs | Repo stars | File last changed |
| --- | --- | --- | --- | --- | --- |
| S1 | no-ai-slop | `petergyang/no-ai-slop` `skills/no-ai-slop/SKILL.md`, `eval.md` | 30,000 | 13,204 | 2026-09-02 |
| S2 | stop-slop | `hardikpandya/stop-slop` `SKILL.md`, `references/phrases.md`, `references/structures.md` | 19,171 | 18,711 | 2026-03-17 |
| S3 | humanizer (Wikipedia-based) | `blader/humanizer` `SKILL.md` (v3.1.0) | 12,183 | 65,854 | 2026-09-28 |
| S4 | Wikipedia: Signs of AI writing | `en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing` (raw wikitext) | n/a | n/a | rev 2026-11-06 |
| S5 | antislop (core) + antislop-ui + antislop-copywriting | `miqdadbadjuber/anti-slop` `skills/antislop/SKILL.md`, `skills/antislop-ui/SKILL.md`, `skills/antislop-copywriting/SKILL.md` | 9,358 / 8,201 / 7,882 | 8,560 | 2026-11-05 |
| S6 | avoid-ai-writing (skill + JS detector) | `conorbronsdon/avoid-ai-writing` `skills/avoid-ai-writing/SKILL.md`, `detector/CATEGORIES.md`, `detector/patterns.js` | 4,995 | 5,465 | 2026-11-04 |
| S7 | unslop (writing) | `theclaymethod/unslop` `SKILL.md`, `references/taboo-phrases.md` | 5,733 | 987 | 2026-08-05 |
| S8 | frontend-design-deslop | `samber/cc-skills` `skills/frontend-design-deslop/references/slop-checklist.md`, `typography.md`, `iconography.md`, `color-oklch.md`, `imagery.md` | 5,757 | 242 | 2026-09-02 |
| S9 | kill-ai-slop | `yetone/kill-ai-slop` `skill/SKILL.md`, `skill/references/detection.md`, `skill/references/taxonomy.md` | 3,412 | 1,417 | 2026-07-26 |
| S10 | no-ai-design-slop + audit-ai-design-slop | `mengto/skills` `agent-skills/ui/no-ai-design-slop/SKILL.md`, `ARTICLE.md`, `agent-skills/ui/audit-ai-design-slop/SKILL.md` | 1,763 / 1,533 | 7,291 | 2026-08-28 |
| S11 | avoid-ai-design | `funboy322/avoid-ai-design` `SKILL.md`, `references/ai-tells-catalog.md` | 818 | 147 | 2026-09-24 |
| S12 | unslop-ui (Reddit-mined ranking) | `JCarterJohnson/vibecoded-design-tells` `skill/SKILL.md`, `skill/references/tells.md` | 177 | 534 | 2026-06-20 |
| S13 | unslop (UI) | `heydamir/unslop` `skills/unslop/SKILL.md`, `references/signs.md` | 1,458 | 11,105 | 2026-10-29 |
| S14 | ce-noslop | `EveryInc/compound-engineering-plugin` `skills/ce-noslop/SKILL.md`, `references/patterns.md` | 433 | 25,967 | 2026-11-02 |
| S15 | sloptrim | `seyedehsanhadi/sloptrim` `SKILL.md`, `references/patterns.md` | 49 | 418 | 2026-10-22 |
| S16 | no-ai-slop (writing rules) | `realrossmanngroup/no_ai_slop_writing_rules` `skills/no-ai-slop/references/ai-writing-detection.md` | 444 | 709 | 2026-05-26 |
| S17 | anti-ai-slop-writing | `jalaalrd/anti-ai-slop-writing` `skills/anti-ai-slop-writing/references/banned-words.md` | 1,005 | 593 | 2026-03-27 |
| S18 | ui-craft | `educlopez/ui-craft` `.agents/skills/ui-craft/SKILL.md` | 1,553 | 437 | 2026-08-17 |
| S19 | taste-design (Stitch) | `google-labs-code/stitch-skills` `plugins/stitch-utilities/skills/taste-design/SKILL.md` | 20,890 | 8,692 | 2026-05-10 |
| S20 | huashu-design | `alchaincyf/huashu-design` `references/content-guidelines.md` | 52,615 | 28,927 | 2026-10-17 |
| S21 | writing-guidelines (Vercel) | `vercel-labs/agent-skills` `skills/writing-guidelines/SKILL.md`, which fetches `vercel-labs/writing-guidelines` `command.md` | 120,246 | 33,671 | 2026-05-30 |

### Checked and set aside (duplicates, wrong domain, or no checkable rules)

| Skill | installs | Why set aside |
| --- | --- | --- |
| `uizze.sh/ui-taste` (`uizze/uizze` `skills/anti-ui-slop`) | 1.0M (ui-taste), 828 | Its own `MODIFICATIONS.md` says it adapts Impeccable (v4.1.1 and 4.4.0 commits). Already covered. Content is workflow, not rules. |
| `github/awesome-copilot/anti-ui-slop` | 1,174 | Same Uizze package (Impeccable derivative). |
| `backnotprop/pstack/unslop` | 9,592 | `diff` against `cursor/plugins` `pstack/skills/unslop/SKILL.md` is empty: identical copy of Cursor's unslop. Already covered. |
| `cursor/plugins/deslop` | 10,096 | Code slop (comments, try/catch, `any` casts). Not landing pages. |
| `dmmulroy/anti-slop/install-anti-slop` | 15,662 | ESLint/stylistic config installer for code. |
| `proseify.xyz/anti-prose-slop` | 53,198 | Book-writing pipeline that requires the Proseify MCP; no standalone rules. |
| `op7418/humanizer-zh` | 57,043 | Chinese adaptation of S3. Only relevant if Slop Score scans Chinese pages. |
| `zenstory-ai/oh-story-claudecode/story-deslop` | 18,248 | Chinese fiction. |
| `autonnel/.../landing-page-conversion-audit`, `*/superpowers/landing-page-design` | 118K, 30-63K | CRO advice; nothing about AI or template tells. Repos have 8-20 stars, install counts look botted. |
| `leonxlnx/taste-skill/*` sub-skills, `anthropics/skills/frontend-design`, Impeccable, ui-ux-pro-max, Hallmark, marketingskills |  | Already covered per brief. S19 is a Stitch port of Taste Skill; only its items not in Taste Skill are listed below. |

---

## 2. New checkable rules

"Check" says how to detect it on a live page. Every row cites its sources. Rules in Section 5 ("already covered") are left out here.

### 2.1 Copy: phrase and word lists (visible-text regex)

#### A. AI vocabulary, tiered by density (strongest structure found)

S6 ships a real detector with three tiers. This is the most rigorous word model in the sweep and worth copying as-is.

- **Tier 1, flag on one hit** (`detector/patterns.js` `TIER1`, weight 5): delve, tapestry, paradigm, beacon, robust, comprehensive, cutting-edge, pivotal, meticulous, meticulously, seamless, seamlessly, game-changer, game-changing, nestled, vibrant, thriving, bustling, intricate, intricacies, ever-evolving, enduring, daunting, holistic, holistically, actionable, impactful, learnings, synergy, synergies, interplay, symphony, embrace. Tier 1 phrases (`TIER1_PHRASES`): `delve into`, `landscape` (filtered), `realm`, `testament to`, `leverag(e|es|ing|ed)`, `watershed moment`, `marking a pivotal moment`, `the future looks bright`, `only time will tell`, `despite challenges ... continue(s) to thrive`, `deep dive`, `dive into`, `unpack(ing)`, `complexities`, `thought leader(ship)`, `best practices`, `at its core`, `showcas(e|es|ing|ed)`, `embark(s|ing|ed)`, `underscor(es|ing|ed)`.
- **Tier 2, flag at 2+ per paragraph** (`TIER2`, weight 3): harness, navigate, navigating, foster, elevate, unleash, streamline, empower, bolster, spearhead, resonate, resonates, revolutionize, facilitate, facilitates, underpin, nuanced, crucial, multifaceted, ecosystem, myriad, plethora, encompass, catalyze, reimagine, galvanize, augment, cultivate, illuminate, elucidate, juxtapose, transformative, transformation, cornerstone, paramount, poised, burgeoning, nascent, quintessential, overarching, quietly, underpinning(s), paradigm-shifting. Conditional: `deeply` only in `deeply (integrated|committed|rooted|personal|human|flawed|resonant|transformative|interconnected|ingrained|embedded|meaningful)`.
- **Tier 3, flag by density** at `max(3, floor(wordCount × 0.03))` uses of one form (weight 2): significant(ly), innovative, innovation, effective(ly), dynamic(s), scalable, scalability, compelling, unprecedented, exceptional(ly), remarkable, remarkably, sophisticated, instrumental, world-class, state-of-the-art, best-in-class, verbatim.
- **Context switch**: in "technical" mode S6 suppresses robust, comprehensive, seamless, ecosystem, leverage, facilitate, underpin, streamline (they have literal engineering meanings). A dev-tool landing page should get this mode.
- Score normalization: raw weighted score divided by `log2(wordCount / 50)` so long pages don't accumulate (`patterns.js` header comment).

Era-dated vocabulary from S4 (Wikipedia "High density of AI vocabulary words", the box is restricted to words "corroborated by at least one reliable, non-pop-science external source"):

- 2023 to mid-2024 (GPT-4): Additionally, boasts, bolstered, crucial, delve, emphasizing, enduring, garner, intricate/intricacies, interplay, key, landscape, meticulously, pivotal, underscore, tapestry, testament, valuable, vibrant.
- Mid-2024 to mid-2025 (GPT-4o): align with, bolstered, crucial, emphasizing, enhance, enduring, fostering, highlighting, pivotal, showcasing, underscore, vibrant.
- Mid-2025 to mid-2026 (GPT-5): emphasizing, enhance, highlighting, showcasing.
- **Mid-2026 on (GPT-6): challenge, clearer, dependable, echoed, foster, leverage, matters, multifaceted, practical, prioritize, quietly, steady, universally**, "with much more period and comma usage and shorter sentences around a strict 8-20 word limit". This is the newest dated list in any source and none of it is in Slop Score yet.
- Grok overuses "scientific" words: causal, empirical, correlate, underscore.
- S4 warns: "a word being overused by AI does not imply that its synonyms are also overused", and one or two hits "may be coincidental".

Model-dialect clusters (S15 §2, fires only at 2+ combined hits): Claude family `genuinely`, `fascinating`, `nuanced`, `refreshingly`, `quietly powerful`; GPT family `game-changer`, `supercharge`, `skyrocket`, `unlock the potential`, `take X to the next level`, `dive deeper into`.

Metaphorical nouns (S16 "Overused Metaphorical Nouns (2025-2026)"): tapestry, symphony, beacon, realm, testament, only when figurative.

Abstract metaphor nouns for a mechanism (S14 rule 20): vector, surface (as "API surface"), primitive (noun), lever, wedge, north star, flywheel, substrate, gold-plating, ratchet, endgame, evacuate (code).

#### B. Generic CTA labels

- `Get Started`, `Learn More`, `Try Now`, `Explore`, `Discover` as default CTAs. S5 `antislop/SKILL.md` R-15 (FORBIDDEN) and Delivery Gate line 692.
- `Get started`, `Learn more`, `Submit`, `Click here`. S11 CP6.
- `Learn more`, `Click here`. S18 Anti-Slop Test, Major.
- **Two CTA labels with the same intent on one page** ("Get in touch" + "Let's talk"). S18 Major. Check: collect button/link texts, cluster by intent synonyms (contact: get in touch, let's talk, contact us, talk to us, book a call; start: get started, start free, try free, sign up).
- **Three or more buttons in the hero**, or chips/avatars stacked under the buttons. S13 `signs.md` "Landing pages and heroes".
- Trailing periods on labels and buttons. S13 `signs.md` Copy.

#### C. Arrow glyphs stapled to labels

- Unicode arrows (→ ← ↑ ↓ ↗) in button labels, links or headings: "Get started →", "Learn more →", "Read the docs →". S11 CP3 (P1). S5 `antislop-ui` "Small Arrows on Every Button" (`→` or `↗` "on almost every button"). S20 lists "CTA 按钮里的 →" (emoji arrows) as slop.
- Check: share of `<a>`/`<button>` whose text ends in `[→↗›»]` or contains an inline arrow SVG; flag when most CTAs have one.

#### D. Headline templates

- **Vague aspirational headline**: "Build the future of work." "Your all-in-one platform." "Scale without limits." "Elevate your workflow." "Transform your X." "Unleash the power of." "Build faster. Ship smarter." S11 CP1. "Transform your X", "Supercharge", "Unleash", "Effortlessly", "Your X, reimagined" S12 §11. "Supercharge your workflow with AI" S13.
- **Launch intros** (S6 `LAUNCH_INTROS`, weight 8):
  - `(?<=^|[.!?]\s|\n)Meet\s+[A-Z][\w'-]{1,29}\s*,\s*(your new (favorite|go-to)|the new (home of|way to|standard (in|for)))`
  - `(?<=^|[.!?]\s|\n)[Tt]hink\s+[A-Z][\w'-]{1,29}\s+meets\s+[A-Z][\w'-]{1,29}\b`
  - Plus "Say goodbye to", "meet your new", "in seconds, not" (S9 tell 14 regex: `not just .{1,40}\bit'?s\b|say goodbye to|meet your new|supercharge|unlock the power|in seconds, not`).
  - "✨ Introducing X 2.0" pill (S13).
- **Headline slogan cadence** (S7 `taboo-phrases.md` "Slogan & Template Cadence"): any standalone line built only from 2-4 short sentences, each ≤5 words ("One command. A real URL." / "Reviewers click. The agent fixes."). **Fires only when ≥3 such lines appear in one document**; one is voice. Related shapes: two-beat imperative ("Emit 1,100 tokens. Ship 237KB."), repeated "<plural noun> that <verb>." (2+ per doc), numeric parallelism "One X, N Y.", "abstraction ships inside".
- **Three-word staccato**: "Fast. Beautiful. Yours." S9 tell 14. **Tricolon adjectives**: "Faster, smarter, simpler." S11 CP4. Check: `^\s*(\w+[.,]\s*){3}$` on headings/subheads.
- **Setup-reversal copy**: "Ten features. Zero headaches." "Everything changed. Your invoice didn't." S14 rule 6.
- **"No X, just Y"**: "No fluff, just results", "No jargon, just clarity". S15 §18.
- **Negation chain** (S6 `NEGATION_CHAIN`, weight 5): three or more sentence-initial "No ..." items: `No setup, no config, no hassle.` Two-item chains stay judgment.
- **Full-sentence display headline**: 10+ words at display size, wrapping to 3+ lines. S9 tell 11; S8 slop-checklist ("A punchy one- or two-word headline at that size is fine; a long headline is the problem"). Check: H1 word count ≥10 AND rendered line count ≥3 AND font-size ≥ ~48px.

#### E. Stock marketing phrases not in Slop Score yet

- **Canonical marketing-slop phrases** (S15 §69, "near-absent from genuine human writing ... one or two in a paragraph is the strongest single-phrase slop signal"): `unlock the full potential`, `navigate the complexities of`, `a testament to the power of`, `stay ahead of the curve`, `turn challenges into opportunities`, `the future is full of possibilities`, `something for everyone`, `whether you are a beginner or a pro`, `the key takeaway`, `seamlessly integrate`, `take it to the next level`, `working smarter, not harder`, `more important than ever`, `drive meaningful impact`.
- **"Simple yet X"**: simple yet effective / powerful / profound / elegant / transformative. S15 §5. Also "powerful yet simple", "thoughtfully designed" S14 rule 3.
- **Hyphenated cliché pairs** (S15 §4): mission-critical, battle-tested, out-of-the-box, enterprise-grade, best-of-breed, plug-and-play, industry-leading, purpose-built, bleeding-edge, turn-key, value-added, first-class, laser-focused, tried-and-true, ready-made, best-in-class, future-proof, cutting-edge, results-driven, customer-centric. (S15: do not touch technical compounds like thin-walled, signal-to-noise.)
- **Banned phrases** (S17 `banned-words.md`): "This is where X comes in", "Bridge the gap", "Move the needle", "Buckle up", "In a nutshell", "Here's the deal", "pain points", "value proposition", "rest assured", "it goes without saying", "Firstly... Secondly... Thirdly...".
- **Feeling instead of mechanism** (S14 rule 21): "Deploys feel effortless", "errors are handled gracefully", "the API gets out of your way". Cursor-unslop covers the same idea; the concrete phrases are new. Regex: `\b(feels?|feel) (effortless|magical|natural|instant)\b|gets? out of your way|handled gracefully|just works`.
- **"X theater"** dismissal: `\b(growth|security|process|privacy|productivity|compliance|feature|innovation) theater\b`. S9 tell 14; S8 slop-checklist Copy.
- **Formulaic openers** (S6 `FORMULAIC_OPENERS`, weight 8): `in the (rapidly |ever-)?(evolving|changing|expanding|growing|shifting) (world|landscape|realm|space|field|domain|era) of`, `in (a|an|the) (digital )?age (where|of)`, `as (we|the world|society|industries?) (continue|move|navigate|enter) (to )?(evolve|forward|into|through)`, `has emerged as (a|the|one of) (leading|key|major|critical|essential|fundamental|pivotal|prominent|dominant|important) \w+`, `has become increasingly (important|critical|popular|relevant|prominent|essential)`.
- **Speculative opener** (S6, weight 8): `(imagine|picture|envision)(, ..., )? a (world|future|reality) (where|in which)`.
- **Template phrases** (S6): `an? (meaningful|significant|major|crucial|important|big|huge|bold|giant|monumental|pivotal|critical|key|vital|massive|tremendous|substantial|decisive|landmark|historic|exciting|transformative) step (towards?|forward)`; `whether you're \w+ or \w+` (already in Slop Score).
- **Crowd contrast** (S6, weight 6): `while (everyone else|the (industry|market|competition)|others) (was|were|is|are) still (busy )?(debating|deliberating|hesitating|theorizing|speculating|arguing|...)`, `... writing think-pieces`, `... playing catch-up`.
- **Significance inflation** (S6 `SIGNIFICANCE_INFLATION`; S4 box): `marking a (pivotal|significant|important) moment`, `a watershed moment for`, `(moment|milestone|chapter|era|turning point|inflection point|leap|new phase) in the evolution of`, `a (pivotal|defining) moment in`; S4 words-to-watch: stands/serves as, is a testament/reminder, a crucial/pivotal/vital/significant/key role/moment, underscores/highlights its importance, reflects broader, symbolizing its ongoing/enduring/lasting, setting the stage for, marking/shaping the, represents/marks a shift, key turning point, evolving landscape, focal point, indelible mark, deeply rooted.
- **Inflated symbolism phrases** with frequency ratios vs human text (S16, citing isgpt.org 2025 corpus): "provide a valuable insight" (468x), "left an indelible mark" (317x), "play a significant role in shaping" (207x), "an unwavering commitment" (202x), "open a new avenue" (174x), "a stark reminder" (166x), "gain a comprehensive understanding" (120x).
- **Generic conclusions** (S6): `the future looks bright`, `only time will tell`, `one thing is certain`, `as we move forward`; S3: "exciting times ahead", "a step in the right direction".
- **Novelty / faux insight** (S6 `NOVELTY_INFLATION`; S1; S14 rule 7): `the failure mode nobody's naming`, `a problem nobody talks about`, `the insight everyone's missing`, `what nobody tells you`, "The part everyone misses", "What most people get wrong", "the real question is".
- **Performed insight** (S6 `PERFORMED_INSIGHT`): `that's not nothing`, `you already know the answer`, `don't take my word for it`, sentence-initial `Turns out`, `('s|is|was) the (whole|entire) (point|game|trick|pitch|idea|play|business model|value proposition)`, `the only \w+ that (matters|counts)`.
- **Colon reveal / setup labels** (S1; S7 "Colon Overuse"; S14 rule 28): "The best part: ...", "The key takeaway: ...", "The bottom line: ...", "The answer is: ...". Regex idea: `\b(the )?(best part|key takeaway|bottom line|answer|catch|kicker|secret|result|twist)\s*:` followed by lowercase.
- **Superficial -ing riders** (S7 regex): `,\s+(highlighting|showcasing|underscoring|fostering|demonstrating|reflecting|signaling|paving the way)`; S3 adds emphasizing, ensuring, symbolizing, contributing to, cultivating, encompassing.
- **Copula avoidance** (S4; S7 regex `(serves as a|stands as a|represents a|constitutes a|functions as a|operates as a)`; S6 `boasts`, `features` as verb only).
- **Vague attribution** (S6): `experts (believe|say|suggest|agree)`, `studies (show|suggest|indicate)`, `research (shows|suggests|indicates)`, `industry leaders (agree|believe|say)`; S7 adds "is widely regarded as", "a growing body of".
- **Promotional language** (S3 §16; S15 §3): rich (figurative), profound, exemplifies, commitment to, natural beauty, nestled, in the heart of, groundbreaking, renowned, featuring, diverse array, breathtaking, must-visit, picturesque, charming, idyllic, premier, leading, top-tier, unparalleled, "a hidden gem".
- **Fabricated trust claims**: "SOC 2 compliant", "ISO 27001", "Enterprise-grade security", "300% faster" with no evidence. S5 core Part 1 + R-36. Check: claim present with no link to a trust page or report.
- **Fake stats beyond Slop Score's list**: `10K+ Users`, `500M Requests`, `120+ Countries` (S5 Part 1); `\b[0-9]+[km]\+`, `24/7` (S9 tell 29); "99.98% UPTIME SLA", "124ms AVG. RESPONSE", "18.5k DEPLOY CYCLES" (S19); `$123,456` (S13). S9's rule of thumb: "Real numbers are odd and specific".
- **Fake metric section titles**: "BY THE NUMBERS", "KEY STATISTICS", "SYSTEM PERFORMANCE METRICS" (S19).
- **Template section headings**: "Everything you need", "Why (you'll love|choose|teams)" (S9 tell 28 regex `everything you need|why (you.?ll love|choose|teams)`).
- **Irrelevant template FAQ**: "Is my data secure?", "Can I cancel anytime?" with no product-specific answer (S5 Part 1 "Irrelevant FAQ").
- **Scroll cues**: "Scroll to explore", "Swipe down", scroll arrow icons, bouncing chevrons (S19; S18 Major).
- **`LABEL // YEAR`** formatting: "SYSTEM // 2024", "METRICS // 2025" (S19).
- **Changes without a reference**: `+12%!!`, `3 less!!` (S13 Copy). Colored pills on trend percentages (S18 Major).
- **Greeting headline**: "Welcome back, X! 👋" (S13); "Good (morning|afternoon|evening)," as H1 (S9 tell 35, `>\s*Good (morning|afternoon|evening),`).
- **Exclamation density**: more than one "!" per several paragraphs; "!" after every list item (S7 "Exclamation Mark Overuse"). S13: "Exclamation marks and `!!` → plain statement".
- **Wordy placeholders**: `Search anything...` (S13).
- **Excessive quotation marks / scare quotes** clustered (S5 copywriting "Excessive Quotation Marks").
- **All-caps emphasis clauses** inside body paragraphs (S5 copywriting; "a single all-caps word used once as an accent can keep its caps").

#### F. Leftovers and machine artifacts (near-zero false positive)

- **Chatbot residue on the page** (S6 `CHATBOT_ARTIFACTS`, weight 8; `SYCOPHANTIC` weight 8; S4 "Collaborative communication"): `i hope this helps`, `certainly!`, `absolutely!`, `great question!`, `excellent point!`, `feel free to reach out`, `let me know if you need anything`, `in this article, we will explore`, `let's dive in`, `you're absolutely right`, `that's a great question`, `is there anything else`, `here is a`.
- **Knowledge-cutoff / model self-reference** (S6 `CUTOFF_DISCLAIMERS`, weight 10): `as of my last update`, `as of my (knowledge )?(cut-?off|last training)`, `i don't have access to real-time (data|information)`, `based on available information`, `as an? (ai|large language) (language )?model`, `my training data (only )?(goes up to|extends to|ends in)`.
- **Unfilled placeholders** (S6 `AI_PLACEHOLDERS`, weight 10; S15 §63; S4 "Phrasal templates and placeholder text"):
  - `\[(Your|Insert|Add|Enter|Describe|Specify|Choose|Pick)[^\]\n]{1,80}\]`
  - `\[(Recipient|Sender|Topic|Subject|Salutation|Closing|Position|Department|Project Name|Company Name|Date)( [^\]\n]{0,60})?\]`
  - `\[(INSERT|FILL IN|ADD|TODO|TBD|PLACEHOLDER)[^\]\n]{0,80}\]`
  - `\b(19|20)\d{2}-XX-XX\b`, `\bXX/XX/(19|20)\d{2}\b`
  - `<!--\s*(add|fill in|insert|todo|placeholder)[^>]{0,120}-->` (in HTML source)
  - `INSERT_SOURCE_URL_\d+`, `INSERT_WEBSITE_URL_HERE` (S4 "URL placeholders"); `[COMPANY]`, `[XX]`, `{{first_name}}` (S15).
  - "Acme", "Nexus" as generic names (S19). (John Doe/Acme already covered.)
- **Chatbot citation markup leak** (S6 `AI_CITATION_MARKUP`, weight 15, the heaviest in the detector; S15 §64): `cite(turn|news|search|navigation)\d+(search|turn|news|navigation)\d+`, `contentReference\s*\[oaicite:[^\]]+\]\s*\{[^}]*\}`, `oai_citation`, `\[attached_file:\d+\]`, `grok_card`, `【\d+†source】`, `navlist`.
- **AI tracking params in links** (S6 weight 12; S15 §65): `[?&]utm_source=(chatgpt|openai|copilot|claude|grok|gemini|perplexity)(\.com|\.ai)?`, `[?&]referrer=(chatgpt|copilot|grok|claude|gemini|perplexity)\.(com|ai)`, plus `utm_source=gemini.google.com`, `copilot.microsoft.com`. Check every `href` on the page. S15 caveat: it "records where the link was copied from, and nothing about who wrote the text around it".
- **Raw Markdown rendered as text** (S4: Markdown presence is listed among "the most common signs of newly AI-generated text" as of October 2026): literal `**bold**`, `## Heading`, ` ``` ` fences, `[text](url)` visible in the rendered DOM text. Check: regex on `innerText` for `\*\*[^*\n]+\*\*`, `^#{1,6} `, ` ``` `.
- **Invisible / zero-width and bidi characters** in visible text (S15 §62; S6 `normalization-flag`, weight 9): U+200B, U+200C, U+200D, U+2060, U+FEFF (mid-text), U+200E/U+200F, U+202A-U+202E, U+2066-U+2069, U+2061-U+2064, TAG block U+E0000-U+E007F, U+00AD. S15: presence "does not identify a source".
- **Homoglyphs**: a Latin word containing Cyrillic а/е/о/р/с/х (S6 `CYRILLIC_LOOKALIKES`; S15 §66). Only inside mixed-script tokens.
- **Degenerate repetition**: share of 6-word spans occurring more than once; fires above 20% (S15 §71, calibrated: no PubMed/textbook/web human arm reaches 13% at p99).

#### G. Typographic casing

- **Title Case in feature bullets, card titles, headings** (S5 copywriting "Title Case in List Elements"; S3 §20; S11 CP5; S14 rule 32). S6 regex: `^(#{1,6} )?([A-Z][a-z]+( ([A-Z][a-z]+|A|I|[A-Z]{2,}|and|or|of|the|in|for|to|a|an))+ [A-Z][a-z]+)\s*$` (weight 4, skipped in technical mode). For a page: share of H2/H3/card titles where every major word is capitalized; flag at near-total uniformity (S11: "with total uniformity").
- **Emoji at the start of a heading or list item** (S4 Style; S3 §20; S14 rule 33). Slop Score covers emoji icons; the heading/bullet-prefix position is the specific check.
- **"OR" divider in caps** between auth options (S18 Major).

### 2.2 Visual, CSS and DOM rules

#### H. Palette and color

- **Accent hue band, precise**: accent in OKLCH hue ~250-320 (S8 `color-oklch.md`); HSL hue ~255-280 for `--primary`/`--brand` (S12 tell 2). Specific hexes: `#6366f1`, `#7c3aed`, `#8b5cf6`, `#a855f7`, `#6d28d9` (S12); purple glows `shadow-(purple|violet|indigo)-\d+/\d+` (S9 tell 01). Slop Score has "purple"; these give exact thresholds.
- **Emerald/teal fallback accent** ("with purple ruled out, emerald is the next reflex"): emerald or teal as the single accent on an otherwise neutral page with no brand reason (S11 SD8).
- **Near-black + one acid-green / lime / vermilion accent**, ground `#0B0B0B` to `#111` (S11 SD2). Cyan accents on dark (S10 ARTICLE §5). Neon text `text-(cyan|green|fuchsia)-400` on `bg-black`/`bg-slate-950` with glow (S12 tell 6).
- **Cream + display serif + sage/forest green** ("the 2026 tell", S12 tell 0): page bg `#faf8f5`, `#f5f1e8`, `#f3eee3`, `#fdfbf7`, `#f7f3ec`, Tailwind `bg-stone-50/100`, `bg-amber-50`, `bg-orange-50`; heading font Instrument Serif, Fraunces, Playfair Display, Spectral, Cormorant, DM Serif; primary `#15573a`, `#1a4d3a` or green/emerald 700-900. "The combination of any two of those three is the strong signal." Slop Score has cream+terracotta; the sage-green variant and the any-2-of-3 rule are new.
- **One hue pretending to be two**: primary and accent within ~20° of hue (S11 C8).
- **Too many colors**: 5-7 distinct non-neutral colors on one page; cap is 2-3 core + 1 accent, neutrals don't count (S5 R-29).
- **Accent placement budget**: one accent, **3-5 placements per above-the-fold viewport**; ">5 dilutes the focal point" (S18 Quick Start rule 10). S5 "Excessive Accent Color": accent on buttons, icons, badges, links, lines, backgrounds and glows at once.
- **Gray text on a tinted/colored surface** (S8 Color; S9 tell 03 regex `text-(gray|slate|zinc|neutral)-(400|500)[^"]{0,60}bg-(amber|stone|orange|rose|blue|indigo|green)-`).
- **Default semantic palette**: three or four stock `-50/-600` pairs together (info=blue, tip=amber, success=green, error=red) unrelated to the brand (S9 tell 04).
- **One-hue status box**: border, text, and `/10` background all the same hue (S9 tell 05: `border-(red|amber|yellow|green|blue)-\d+[^"]*text-\1-\d+`, `bg-(red|amber|yellow|green)-\d+/(5|10|15|20)`).
- **Per-card accent wash**: bento cards each tinted with their own accent gradient (S9 tell 06: `bg-gradient-to-(br|tr|bl|tl) ... from-(emerald|green|teal|cyan|purple|violet|fuchsia)-\d+/(5|10|15|20|25)`).
- **Repeating gradient stripes** as surface decoration: `repeating-(linear|radial)-gradient` (S8 Visual detail; S9 tell 06).
- **Default dark SaaS card**: `bg-zinc-950`/`bg-gray-900` with `border-white/10` hairlines and a faint shadow (S11 K9). "VibeCode purple" dark: dark bg + low-contrast grey body + purple accent (S11 C3).
- **Muted text below 4.5:1** (S11 C9) and pure `#161616` page + Inter + white text + one brand-colored button as the post-cleanup "template look" (S13 "Template look").

#### I. Typography

- **Font roster additions** (Slop Score's default/second-wave lists may already hold some; check): Manrope, Plus Jakarta Sans (S9 tell 33, with the stock pairing "Space Grotesk display + Inter body"); Montserrat, Poppins, Lato, Open Sans as primary/display face (S8 `typography.md` §18); Syne, Sora, Cal Sans, Instrument Serif, Fraunces (S11 T2, "~15.8% of analyzed sites used one of this small set"); Spectral, Cormorant, DM Serif Display, Playfair as the "tasteful" serif default (S12 tell 8); Geist Mono, JetBrains Mono, Fira Code as mono default (S5 antislop-ui).
- **Geist untouched on a Next.js site**: `GeistSans`/`GeistMono` from `next/font` as the only faces (S11 T4).
- **Typeface declared but never loaded**: CSS names a family with no matching `@font-face`, font `<link>`, or `next/font` (S11 T7). On a live page: compare `font-family` declared vs `document.fonts` loaded faces; flag when the first family never loads.
- **Big italic serif display headline** as the default hero (S8 Typography; S9 tell 08 `font-serif[^"]{0,60}(italic|text-[4-9]xl)`).
- **Crushed tracking**: `letter-spacing` ≤ -0.05em on display type (S9 tell 11 `letter-spacing:\s*-0?\.0[5-9]`); S8 puts the floor at "roughly no tighter than -0.02em on large headlines". Negative tracking on small text (S13 Type).
- **Heading weight 800/900** everywhere (S13 Type: "Headings at weight 800 or 900 → 400 to 500").
- **Monospace on non-code chrome**: large monospace headings; mono for small data labels (S5 "Generic AI Typography"; S11 SD4m; S9 tell 34). ASCII banners `[╔╗╚╝║═▓▒░]` as decoration (S9 tell 34).
- **Middle-dot meta strings** `A · B · C` and **`WORD — fragment` labels** (S11 SD4d/SD4w; S20, both quoting Anthropic frontend-design's "template chrome" cluster). Source is covered, but Slop Score's list has no rule for these two.
- **Highlighted keywords**: multiple colored or `font-semibold` spans inside one body paragraph; `<mark>` (S9 tell 13: "One accented phrase is fine").
- **Decorative strikes/highlights**: `line-through` or `<s>/<del>/<u>/<mark>` on text that isn't a deletion or link (S9 tell 09).
- **Numbers in mixed formats** (`$48,210` next to `$124,860.40`, or `07`) and no `tabular-nums` on stat rows (S13 Type; S18 Minor).
- **Flat type hierarchy**: adjacent heading steps under ~1.25x (S9 tell 12; S8 Typography ">= 1.25 for general UI, marketing, and editorial").

#### J. Shape, surface, depth

- **Radius ceiling**: radius > 16px on small cards; 24px+ "the unmistakable case"; full-pill reserved for tags and buttons (S8 Visual detail). `rounded-full` on cards/inputs (S9 tell 19). Every element pill-shaped (S5 "Excessive Border Radius"). Check: computed `border-radius` per element class; flag uniform large radius across buttons, inputs, cards, badges.
- **Uniform radius** (`rounded-2xl` reflex, 16px everywhere): count distinct computed radii; one value on everything = flag (S8; S18 Quick Start rule 3 suggests "6px inputs, 10px cards, 14px modals").
- **Corners that don't nest**: outer and inner box with the same large radius (S9 tell 21). Check: child radius ≥ parent radius while child is inset by padding.
- **Ghost card**: hairline border AND wide diffuse shadow on the same element (S8; S9 tell 20; S11 K2; S10 §3).
- **Oversized shadow**: blur/spread ≥ 60px on a small element (S9 tell 20 `box-shadow:[^;{}]*\b([6-9][0-9]|[0-9]{3,})px`). Every component shadowed (S5 "Overly Soft Shadows").
- **`rounded-2xl shadow-lg` on everything**, or a 1px grey border on every card ("2026 write-ups single out the grey box on every card as the most common card tell", S11 K2).
- **Cards nested 3+ deep**, each with its own border/radius/shadow (S9 tell 31; S10; S11 K11). Check in DOM: ancestors with border+radius+background chain depth ≥3.
- **Glass with white inner highlight + colored shadow** (S13 Surfaces). Glass on nav, cards, modals and sidebar at once; dose cap 1-2 elements (S5 R-10).
- **Neon or high-contrast colored borders** where a 6-10% opacity hairline would do (S13).
- **Thick accent ring around one card** (pricing tier "pop") fighting the rounded corners: `border-2 ... border-(indigo|purple|violet|blue|pink|green)-\d+` (S9 tell 17).

#### K. Components and page chrome

- **Arrows on every button** (see C).
- **Badge/pill spam**: several decorative pills reading `new|beta|hot|popular|pro|coming soon`, optionally prefixed ✨🔥🎉🚀 (S9 tell 23 regex `>(\s*[✨🔥🎉🚀]\s*)?(new|beta|hot|popular|pro|coming soon)\s*<`). "AI Powered", "Beta", "New" capsules with pill + thin border + glow + dot + uppercase (S5 "AI Capsule Badges"). `PRO`, `New ✨`, `Beta 🚀` everywhere (S13).
- **Decorative status dot**: small dot with `animate-ping`/`animate-pulse` or glow beside a heading, eyebrow or "● Ready / Online / Live" where nothing is live (S5; S9 tell 16; S10 §7 "Static status uses a pulsing dot to pretend that data is live"; S8 Motion).
- **"Most Popular" middle tier + exactly 3 pricing columns** (S5 "'Most Popular' Pricing Card" / "3 Pricing Tiers"; S11 L7). Check: 3 sibling pricing cards, middle one scaled/ringed or carrying "Most Popular|Recommended|Best value".
- **Four-column template footer**: Product / Company / Resources / Legal, plus newsletter input and social icon row (S5; S11 L8).
- **Fake window chrome / fake terminal**: macOS traffic-light dots (three small red/yellow/green circles), a prompt line, typed-out commands as the hero visual (S5 "Fake Terminal Window"; S11 SD7). Fake blinking caret on non-editable copy (S8 Motion; S10 §8).
- **Fake product screenshot from divs**: skeleton/grey bars as the "product shot" (S5 "Skeleton Preview as Product Shot"); `aspect-video bg-muted rounded-xl` standing in for a demo (S11 IM4); "Fake product screenshots built from styled `<div>` rectangles" (S18 Major). Check: hero visual is a DOM subtree of empty divs with background fills and no `<img>/<video>/<canvas>`.
- **Logo wall as text wordmarks**: company "logos" rendered as styled `<span>` text (S18 Major). Grayscale logo walls of non-customers (S11 L4).
- **Placeholder identities**: DiceBear, boring-avatars, `pravatar.cc` avatars (S11 IM4); `picsum.photos`, Unsplash hotlinks (S19 tells models to use picsum, so picsum itself is a generated-page fingerprint); broken image `src` (S10 §6, S19). Rows of avatar dots or five stars without a source (S13).
- **Generator signature left in**: `lovable-tagger`, `gpt-engineer` leftovers, v0 / Bolt / Lovable meta tags or attribution (S11 F1). Overlaps Slop Score's Lovable-tokens rule; the meta/attribution check may be new.
- **Logo mark as gradient tile with sparkle**, gradient wordmark, glossy orb or glowing dot as the mark (S13 Components).
- **Hand-coded SVG mascot/scene**: inline `<svg>` blob with dot eyes or cartoon creature from primitives (`<circle r=...>`) as the product mark or hero (S9 tell 24; S8; S20 "AI 画的SVG imagery一眼就是AI味").
- **Generic AI iconography**: sparkle, star, magic wand, lightning, diamond, cube, robot, AI orb as feature icons (S5 "Generic AI Icons"); robots, glowing brains, circuit lines, holograms for anything AI (S13 Visuals; S20 critique-guide "渐变圆球、数字雨、蓝色电路板、机器人脸"). Overused Lucide set: `Sparkles`, `ArrowRight`, `Zap`, `Rocket`, `Shield`, `BarChart3`, `Check`/`CheckCircle2`, `Star`; ✦/✨ as the universal "AI" badge (S11 I3).
- **Icon library default stroke**: unmodified 2px Lucide/Heroicons stroke (S8 `iconography.md` §7, "a 1.5px or 2.5px stroke instantly looks less like the 2px default"). Check: SVG `stroke-width="2"` + `stroke-linecap="round"` on all icons.
- **Giant decorative line icon parked in a card**: `<svg>` 96px+ (S9 tell 18 `<svg[^>]*(width|height)="(9[6-9]|[1-9][0-9]{2})"`).
- **Charts as decoration**: rainbow bars, glowing bars, pill-shaped bars, sparklines on every stat card (S13 Components); "Overview"/"Performance" chart titles (S5 "Charts Without a Question").
- **Carousels without narrative purpose** (S18 Major).
- **Dead navigation**: nav links to `#` or to anchors/pages that don't exist (S5 "Dead Navigation", R-24). Check: `href="#"`, `href=""`, in-page anchors with no matching `id`, 404s.
- **Missing Terms/Privacy on a page that collects signups or payment** (S5 "Demo Without a Product"). Check: email/payment form present and no footer link matching `terms|privacy`.
- **Text baked into an image** (fake buttons, fake logo inside a raster hero) (S13 Visuals).

#### L. Layout and structure

- **Section waterfall**: hero, logos, features, how it works, testimonials, stats, pricing, FAQ, CTA, footer in that order. S11 L9 scanner "flags a page carrying six or more of these stock sections". S5 "Monotonous Template Layout". S10 §9. Check: classify sections by heading text and component shape; count stock sections; flag ≥6.
- **Uniform section rhythm**: every section is centered title + subtitle + identical card grid (S5); identical vertical padding on every section (S10 §2). Check: computed `padding-block` of top-level sections; flag when all equal.
- **Alternating background is the only variation** between sections (S5 Part 1).
- **One gap everywhere**: one spacing value (`gap-4`/`p-4`/`space-y-4`) for both within-group and between-group distances; heading equidistant from its own body and the previous section (S9 tell 32; S8 Spacing; S10 §2 "Headings sit closer to the previous section than to the content they introduce"). Check: for each heading, compare margin-top vs margin-bottom; flag when top ≤ bottom.
- **Default page shell**: every section in `container mx-auto px-4` or `max-w-7xl mx-auto` and nothing else (S11 L6). Check: all top-level sections share one max-width and are centered.
- **Hero-metric triptych**: big number + small label + three supporting stats + gradient accent (S8 Layout). Slop Score's "stat banner" likely covers; the "gradient accent" combo is the specific form.
- **Count-up stat animation**: `NumberTicker`, `CountUp` on the stat strip (S11 M5).
- **Walls of text**: any landing section with more than 2-3 sentences (S18 Major).
- **Long centered paragraphs** (S10 §4; S8 Quality gates "Long-form measure 65-75ch, left-aligned").
- **Every section has a visual** (S13 Visuals: "one visual where it helps, usually only the hero").
- **Dashboard-in-hero filler**: a decorative dashboard, code window, browser frame or device mockup that doesn't show real product behavior (S10 §6).
- **Eyebrow budget**: max one tracked-caps eyebrow per 3 sections (S18 Major). Slop Score covers tracked caps; this is a threshold.

#### M. Motion

- **Springy hover**: `hover:scale-1[01][0-9]`, `hover:-translate-y-*`, `whileHover={{ scale: 1.05 }}` across cards, buttons and images; image scale/rotate on hover (S9 tell 26; S12 tell 4; S8 Visual detail).
- **`transition: all`** as the default (S9 tell 26; S18 Major; S13 Motion). Check computed `transition-property: all`.
- **Overshoot easing**: `cubic-bezier(...,1.2+...)`, `easeOutBack` (S9 tell 26 regex `cubic-bezier\([^)]*,\s*1\.[2-9][0-9]*`). Slop Score has bounce easing; the numeric y>1.2 check is the precise form.
- **Animating layout properties**: width/height/margin/padding/top/left in transitions or keyframes (S9 tell 26; S8 Motion; S13).
- **Content invisible at rest**: elements at `opacity: 0` waiting on an observer; "never leave it at `opacity: 0` waiting on a handler that might not run" (S8 Build correctness; S10 §8). Check: load with JS disabled or before scroll; measure share of text nodes with computed opacity 0.
- **No `prefers-reduced-motion` handling** while animations exist (S11 M6; S8 Motion).
- **Perpetual loops**: elements that pulse, bounce, or float forever with no trigger (`animation-iteration-count: infinite` on non-loader elements) (S5 "Endless Pulses and Loops"); auto-scrolling marquee/ticker (S8; S10 §8).
- **Scrolljacking / parallax** wired to the whole page (S12 tell 4; S13 Motion).

### 2.3 Statistical text metrics (whole visible text)

Use with care on landing pages: copy is short and fragmented. Most thresholds below were calibrated on prose of 200+ words.

| Metric | Threshold | Source |
| --- | --- | --- |
| Sentence-length coefficient of variation | flag when CV < 0.25 and mean > 10 words, needs ≥5 sentences | S6 `patterns.js` §23 |
| Sentence-length CV target | human ≥ ~0.35; at least one sentence < 10 words per paragraph | S15 §40 |
| Mechanical alternation (short-long-short-long) | share of successive length-difference sign flips near 1.0 over ≥6 sentences | S15 §41 (`cadence_zigzag`) |
| Sentence length band | AI clusters 15-20 words; a 500-word block with no sentence < 8 or > 30 words "lacks burstiness" | S16 |
| Newest-model band | "strict 8-20 word limit" with heavy period/comma use (mid-2026 on) | S4 |
| Paragraph uniformity | all paragraphs within ±1 sentence of the mean and mean ≥ 3 (needs ≥4 paragraphs) | S6 §24 |
| Paragraph uniformity (alt) | all paragraphs within 15% word count; CV > ~0.4 is human | S16; S15 §44 |
| Punctuation-density uniformity | per-paragraph density of `[,;:—()]` per word, CV < 0.25 and mean ≥ 0.04, ≥4 paragraphs | S6 `punct-distribution` (weight 6) |
| Vocabulary diversity | 200-token moving-average TTR < 0.40 (human median 0.62-0.64) | S6 `low-ttr` |
| Contrasting parallelisms | > 2 per 500 words | S16 |
| Negative parallelism gate | plain "isn't X, it's Y" flags only when a second frame starts within 3 sentences in the same paragraph; "isn't just/merely/simply X, it's Y" flags alone | S6 CATEGORIES.md |
| Hedging density | > 3 hedges in one paragraph, or > 8 per 1,000 words in declarative sections | S16 |
| Transition-led paragraphs | > 30% of paragraphs open with a transition | S16 |
| Same opener | 3+ sentences in a paragraph with identical two-word frame; 3+ consecutive paragraphs with the same opener | S15 §42; S16 |
| Em dashes (UI strings) | 3+ em dashes in visible UI copy is "prose grammar leaking into interface grammar" | S18 Major |
| Em dashes (prose) | > 1 per 1,000 words (but authorship weight set to 0, see Section 4) | S6 §22 |
| Bold overuse | > 3 `**bold**` spans (Markdown text) | S6 §25 |
| Confidence stacking | only when 3+ instances | S6 |
| Bullet-NP list | ≥5 bullets, ≥75% bare noun phrases ≤6 words with no verb (weight 10) | S6 `bullet-np-list` (see false positives) |
| Horizontal rules | ≥3 standalone rules in ≥25 lines | S15 §70 |

---

## 3. Judgment-only rules (need a human or an LLM)

These were stated by the sources as needing a read of intent, or the sources tried a regex and reverted it.

- **Portability test**: "If a sentence could move unchanged to another person, company, country, or product, it is probably filler" (S1). Same idea: "if the sentence could appear unchanged in another project's docs, it says nothing" (Cursor unslop, also S14 rule 21). For a landing page: would the hero headline fit a competitor with the name swapped (S13 "Template look"; S10 §1).
- **First viewport doesn't say what the product does** (S10 §1; Uizze `new-work.md`).
- **No visual identity**: swap the logo and the design still fits any product (S5 Part 1 "No Visual Identity"). **Clone of a popular product** (Linear, Vercel, Stripe, Notion) without being asked (S5 R-30). The "Linear glow": dark hero with blurred animated gradient behind a product shot (S11 M3).
- **Silhouette test**: reduce the page to a 200px-wide black-and-white block silhouette, compare with five competitors; if you can't pick yours out, the structure is slop (S11 L9). Could be automated with a perceptual hash against a corpus, but the sources leave it manual.
- **Wireframe-strip check**: strip color, texture, type and compare bare structure to the category default (S8 `divergence.md` §6).
- **Bento grid used because it's trendy**, not because content has varied importance (S5; S11 L3, marked 🧠).
- **"How it works" always 3 steps** when the real process isn't 3 steps (S5; S11 L5 marked 🧠).
- **Sections that fill a template**: a section exists because "every AI landing page has one" (S5). "If the product has no testimonials, there is no testimonials section."
- **Fake proof**: whether logos, testimonials, metrics, ratings, activity, awards are real (S10 audit; S5 R-17/R-18/R-36). Code can flag round numbers; only judgment can say whether "1,847" is real.
- **Testimonials with random names and job titles**, AI avatars (S5 R-18).
- **Irrelevant icons**: icon glyph unrelated to the feature text (S5 R-04; S9 tell 18).
- **Illustrations with no connection to the product** (Undraw, Storyset, 3D blob characters, Corporate Memphis) (S5; S8 `imagery.md`; S11 IM3, which says Corporate Memphis is "pre-AI context, not evidence"). AI 3D glossy blobs (S11 IM2), raw default-Midjourney renders (S8). Stock "diverse team at a laptop" (S11 IM1) is already in Slop Score as stock photos.
- **Generated imagery defects**: anatomy, text, logos, lighting (S10 §6).
- **Dark mode nobody asked for** (S11 C7 🧠; S5 R-21). Slop Score covers "default dark"; sources stress only the unprompted glow is the tell (Section 4).
- **Broadsheet cosplay**: hairline rules, zero radius, newspaper columns on a non-publication (S11 SD3, 👁).
- **Editorial dashboard**: serif greeting + serif numerals + cream + tracked-caps kicker on an operational surface (S9 tell 35).
- **Timid, evenly distributed palette** (S11 C4).
- **False agency / inanimate subject + human verb**: "The dashboard understands what your team needs" (S5 copywriting; S2 "False Agency"). S6 keeps it LLM-only.
- **Synonym cycling** ("The checkout is fast. The process is quick. The flow is speedy.") (S5 copywriting; S6 LLM-only).
- **False ranges**: "From first touch to final invoice, and everything in between" (S5; S14 rule 15). S6 lists as LLM-only because "from X to Y" is often literal.
- **Rule of three, forced triads** (S3 §6; S5). S6 keeps "Colon into a triple" as judgment: "three-item lists are often simply true".
- **Aphorism formulas** ("X is the language of Y", "X is not a tool but a mirror") (S5; S3 §3). S6: a regex for "X is the Y of Z" would flag "Paris is the capital of France".
- **Stacked rhetorical questions** (S6: "interviews, FAQs, and dialogue stack questions legitimately").
- **Manufactured punchlines / staccato drama / fake-profound kickers** (S1; S2; S6 LLM-only).
- **Heading that teases instead of describes**: "The [Concept] Trap", "The Hidden Danger", "The Silent Killer", "Why X Destroys Everything", "The Risk You Overlook" (S16 "Banned Heading Structures"). Regex is possible (`^The \w+ (Trap|Killer|Danger)$`) but the source frames it as a judgment test ("Could this heading serve as a thriller chapter title?").
- **Spec-sheet voice** ("provides", "is configurable"), **cold-open paragraphs**, **reused framing** ("The question most teams face is whether...") (S21 "AI-generated tells").
- **Uniform emotional register**, both-sidesism, preview/recap symmetry (S7 "Macro Structure").
- **Heading restated in the first sentence** (S3 §24; S14 rule 25).
- **Design-system drift across pages**: font/palette/radius/nav/footer changes between pages of one site (S11 X1, P0). Only visible when comparing pages side by side. Relevant if Slop Score ever crawls more than one URL.
- **Clean but generic ("Sterile Default")**: flat white, thin grey borders, small radius, generic font. S5 says "It is not slop, but it is not design either". Worth a separate low-weight "no identity" signal rather than a slop hit.

---

## 4. False-positive guidance

### Calibration statements from the sources

- **Clusters, not single hits.** "A single em dash means nothing. Em dashes plus rule of three plus 'vibrant tapestry' plus a generic conclusion is a confession." (S5 copywriting "What NOT to flag"). "Judge combinations, not single hits. One accented headline word on an otherwise authored page is a nit. SD1 + SD4 + SD5 + SD6 together is a template." (S11). S3: patterns marked _weak alone_ need company. S14: "A single device is a choice, not a tell."
- **Slop is "a choice made by reflex rather than for the product."** Treat a choice as suspect only when several are true: pastable into an unrelated product, repeats a familiar pattern, conflicts with local system, communicates nothing, competes with content (S10 Core Judgment).
- **Don't claim authorship.** S10 audit: "Do not guess whether AI made the design. Do not assign a numeric slop score." S11: "A tell is evidence of a default nobody chose, not proof that a model made the page... Never accuse; fix." S1 detect mode: "Do not ... guess whether AI wrote it. AI detectors guess. Named patterns are evidence the user can check." S4: humans detect AI text at roughly chance (2025 studies). Uizze: "Do not create a novelty score". Implication for Slop Score: frame the score as "template/default-ness" with cited evidence per hit, not as "probability AI-made".
- **"It's just Tailwind" is true and beside the point**: the most common pushback; fix defaults whoever shipped them (S11). S12: "shadcn / Tailwind themselves: the defaults are the tell, not the tools. A themed shadcn site is invisible to this complaint."

### Rules the empirical data says to down-weight (S12, Reddit corpus of ~3.2M posts / 3,033 on-topic comments; echoed by S11)

- **Bento grids**: "dead last at 0.1%, and people actively defend them. Not a tell."
- **Mesh / blob / aurora backgrounds**: "investigated and rejected as a keyword artifact". S11: aurora "was rejected on verification".
- **Glassmorphism**: 0.2%, "low signal and contested. Allowed."
- **Dark mode itself**: "only the unprompted glow is flagged, not dark mode."
- **Animations**: ~1.1%, "minor and noisier signal".
- Strongest by comment share: default shadcn/Tailwind look (2.5%), AI purple (2.3%), gradients/gradient text (2.0%), then animations, rounded corners (0.8%), dark+neon glow (0.7%), emoji as icons (0.5%), generic sans (0.4%, "understated"), hero+3 cards+CTA skeleton (0.4% of comments, 1.6% of posts). Plus the rising "cream + serif + sage" default.
- Spacing (S11 S1) "is a soft signal. Do not lead an audit with it."
- Corporate Memphis "is pre-AI context, not evidence a model made something" (S11).

### Em dash: the signal is decaying

- S4 moved "Overuse of em dashes" into **Historical indicators**, dated **2022 to September 2026**: latest models "have more and more often been found to be hard coded to not use em dashes at all", which makes "commas and periods ... more likely now than even human text" and that "has become its own sign" (marked citation needed). A July 2026 study cited there: of contemporary models only Claude used em dashes more than professional writers; ChatGPT used them less.
- S6 sets `em-dash` weight to **0**: "Writing-quality guidance whose authorship polarity changes across model generations. Keep the flag visible without moving authorship outputs."
- S4: AI em dashes "are usually surrounded by spaces, contrary to common typographic guidelines". A spaced em dash is a better sub-signal than raw count.
- S6 excludes separator-position dashes (list-marker `- **Label** — text`, version headings) and `--` used as CLI flags or YAML `---`.
- Recommendation for Slop Score: keep em-dash density as a low-weight style signal; don't let it carry the copy score. Consider the inverse signal (very low punctuation variety in long copy) only as an experiment, since S4 marks it unsourced.

### Promotional tone is also historical for prose (but not for landing pages)

- S4 moved "Promotional and advertisement-like language" to **Historical (2023-2025)**: "no longer common in newer LLM output unless a user specifically asks for it." A landing page is exactly where a user asks for it, so sales vocabulary on a landing page is weak evidence by itself. Weight the structural and template tells higher.

### Context and exclusion zones

- Don't flag text inside quotations, titles, proper names, code, or passages that discuss the phrase (S3 "When not to act"; S5; S14; S16 "Exclusion Zones").
- **Metaphorical vs literal**: ecosystem ("Apple's software ecosystem" OK), landscape ("Arizona landscape" OK), navigate ("navigate the website" OK), tapestry ("medieval tapestry" OK) (S16). `underscore` can be literal (S4). `features` is a noun on most product pages; S6 ships a long `featuresIsNoun()` to avoid flagging "three new features" or a "Features" heading. **Slop Score must not flag the noun "features".**
- Adjacent named entities lower severity ("comprehensive audit by the FTC in 2024") (S16).
- Technical context: robust, comprehensive, seamless, ecosystem, leverage, facilitate, underpin, streamline have literal engineering senses (S6 technical mode). Use this for developer-tool sites.
- Compound modifiers with real meaning (thin-walled, load-bearing, signal-to-noise) are not clichés (S15 §4).
- **Bullet-NP lists**: S6 flags ≥5 bare-noun-phrase bullets, but pricing-plan feature lists and spec sheets are always noun phrases. Don't port this rule to pricing cards.
- **Title case**: Vercel's own guide uses title case for nav labels and sentence case for headings (S21). Flag title case on headings/body/bullets only, never on nav.
- **Curly quotes conflict**: S3/S4/S14 call curly quotes a weak tell; S21 (Vercel) and S18 (ui-craft Minor) _require_ curly quotes and flag straight ones. S5: "macOS, Word, and most CMSes auto-curl by default." **Don't use quote style as a signal.**
- **Inter is not always slop**: S18 lists "Inter/Geist/DM Sans are safe fallbacks when no brand font exists"; S9: "A team that tried others and landed on Inter made a choice"; S5: "Popular fonts like Inter are still valid if there's a reason". S19 (Stitch) bans Inter but _recommends_ Geist, Outfit, Cabinet Grotesk, Satoshi, Fraunces, Instrument Serif, which other sources (S8, S11, S12) list as the new tells. Sources contradict each other on the "good" fonts; trust the ubiquity data, not any single list.
- **Tracking**: S18 recommends `-0.02em`+ on headings above 24px; S8 says no tighter than about -0.02em; S9 flags only ≤ -0.05em. Use -0.05em as the flag threshold.
- **Centering alone is not a tell**: "the badge + centered hero + three-card combo is" (S11 L1). S18: "center is fine if asymmetric supporting elements break the symmetry".
- **One gradient tied to the brand is not slop** (S11). Branded hero metric with gradient may be the brand expression (S18 "When Rules Break").
- **Emoji**: allowed when the brand uses emoji (Notion, Slack) (S20), in user content/reactions (S18), and in genuine body copy (S12: weight emoji-as-icon, not emoji in copy).
- **Numbered markers**: legitimate for install steps, changelogs, timelines, indexed catalogs (S9 tell 30; S11 SD6).
- **Kickers/eyebrows**: legitimate when they add a real dimension (category, date, number in a sequence) (S9 tell 10); 10-13px category labels in editorial layouts (S18).
- **Monospace**: legitimate for real code and tabular data; terminal look legitimate for a real CLI with a real screenshot (S5; S9 tell 34).
- **Passive voice**: right when the actor is unknown or irrelevant ("the server was restarted at 03:00") (S5 copywriting).
- **All caps**: a single all-caps word used once as an accent is fine (S5).
- **One short sentence** for emphasis is human; flag only runs of fragments (S5; S14).
- **Restraint**: "A confident, intentional design that happens to be minimal is not 'timid.' Restraint executed well is a decision. Reward it." (S11).
- **Text written before 2022-11-30 is not AI-written** (S3; S4 "Age of text relative to ChatGPT launch"). Wayback Machine snapshots older than that date could serve as a negative-control corpus for calibrating Slop Score thresholds.
- **Signs of human writing to reward** (S3; S5; S4 "Syntax"): specific unusual detail; mixed feelings; dated references; real asides and self-corrections; simple is/has phrases ("there is a", "it has a"); superlatives like "is the only", "was the first"; plain verbs (wrote, used, tried) over authored/utilized/attempted; intensifiers like "very", "perhaps".
- **Ineffective indicators per S4** (don't build rules on these): perfect grammar, mixed casual/formal register, "bland" or "robotic" prose, "fancy/formal" prose in general, transition words in isolation, unsourced content.
- **Over-scrubbing is its own tell**: "Copy with no voice is as obviously machine-made as copy full of AI tells" (S5 copywriting); "Removing slop is only half the job. A screen that is clean but could belong to any product is the next template" (S13). Third-order default already forming: grain, hand-drawn type, scrapbook collage as an "anti-AI" reflex (S11).

---

## 5. Already covered by Slop Score (skip)

| Slop Score rule | Same tell in new sources |
| --- | --- |
| Buzzwords (seamless, supercharge, unlock the, revolutionize, next-gen, effortless, elevate your, empower, streamline, the future of, cutting-edge, game-changing, stunning, reimagine, harness the power, world-class, industry-leading, enterprise-grade, future-proof, in today's fast-paced, whether you're X or Y) | S1 banned list, S5 R-16 ("AI Powered", "Next Generation", "Revolutionary", "Seamless", "Cutting Edge"), S6 tier lists, S9 tell 14, S11 CP2, S13, S17, S19. **New from these:** "AI Powered", "Intelligent", "Ultimate", "Powerful" (S5 R-16), "blazing fast", "next-level" (S9), "magic" (S13), "Unleash" (S11, S19). |
| Proof boilerplate (trusted by N+, loved by, 99.9% uptime, 4.9/5, no credit card required) | S5, S9 tell 29, S11 L4, S13, S19. New numeric forms listed in 2.1 E. |
| Em-dash density | S2, S3 §8, S5 R-02, S6, S7, S14 rule 29, S21. See Section 4 for the decay evidence. |
| "It's not X, it's Y" | S1, S2, S3 §1, S6 `negative-parallelism`, S14 rule 12, S15 §17. **New:** S6's gating rule (Section 2.3) and the reversed "Y rather than X" form (S4, "particularly common in recent LLM output"). |
| Placeholders (lorem ipsum, John Doe, Acme Inc, Feature 1) | S5 ("John Doe", `johndoe@example.com`, "Let's build something"), S15 §63, S19. **New:** the bracket/date/URL placeholder regexes in 2.1 F. |
| Default fonts, second-wave fonts | S5, S8, S9 tell 33, S11 T1/T2, S12 tell 8, S20. New names to check in 2.2 I. |
| Accent word in headline | S11 SD5, T3 (serif-italic), S9 tell 07. |
| Gradient text | S9 tell 02, S11 C6, S12 tell 3, S13, S19. |
| Eyebrow pill | S5 "Eyebrow Badge Above the Headline", S11 K5, S13, S8. |
| Tracked caps labels | S5, S9 tell 10, S11 T5/SD4, S13, S18 (budget threshold is new). |
| Purple | S5, S8 (OKLCH band new), S9 tell 01, S11 C1/C2, S12 tell 2, S19, S20. |
| Gradient washes | S5, S8, S9 tell 06, S13. |
| Default dark | S5 "Dark Mode Default for No Reason", S11 C7, S12 tell 6. |
| Cream + terracotta | S11 SD1, S20 cluster 1. Sage-green variant is new (2.2 H). |
| 3-card row, icon tiles | S5, S8, S9 tell 18/25/28, S11 L2/K6, S12 tell 9, S18, S19. |
| Stat banner | S5, S8 triptych, S9 tell 29, S11 L4. |
| 01/02/03 | S8, S9 tell 30, S11 SD6, S18 ("01 · About"). |
| Centered | S8, S11 L1, S12 tell 9, S19. |
| Side stripe | S5 "Colored Left Stripe", S8, S9 tell 17, S11 K4, S18, S20. |
| Glass | S5 R-10, S8, S9 tell 19, S11 K3, S13. |
| Glow | S5 R-13, S8, S11 C5, S12 tell 6, S13, S19. |
| Orbs | S5, S8, S13, S20. |
| Dot/grid background | S5 "Background Grid", S8, S10 §5. |
| Emoji icons | S5, S9 tell 15, S11 I2, S12 tell 7, S13, S20. |
| Sparkles | S11 I3, S13, S9 tell 23. |
| Lucide | S5 "Lucide Icons", S8, S11 I3/K6. |
| Reveal on scroll | S8 ("no identical fade-in-up on 4+ sections"), S11 M1 (`initial={{ opacity: 0, y: 20 }}` + `whileInView`, `data-aos="fade-up"`), S12 tell 4. |
| Bounce easing | S8, S9 tell 26, S11 M4, S18. |
| shadcn stock tokens | S11 K1/K8 (`--radius` 0.5rem or 0.625rem), S12 tell 1 (`rounded-lg border bg-card text-card-foreground shadow-sm`, `baseColor: "slate"`/`"zinc"`). |
| Lovable tokens | S11 F1 (partial overlap; see 2.2 K). |
| Magic UI effects | S11 K10: Spotlight, Background Beams, Animated Beam, Shimmer Button, 3D Card, Meteors, Border Beam, Number Ticker, Marquee, Sparkles (Aceternity + Magic UI). |
| Stock photos | S8 `imagery.md`, S11 IM1, S13. |

---

## 6. Highest-value additions, ranked

1. **Machine-artifact checks** (2.1 F): chatbot citation markup, `utm_source=chatgpt.com`-style links, unfilled `[Your ...]`/`XX-XX` placeholders, chatbot residue, model self-reference, raw Markdown in rendered text, zero-width/bidi characters. Near-zero false positives; S6 weights them 10-15, its heaviest.
2. **S6's tiered vocabulary with density gates** plus S4's dated era lists (especially the mid-2026 list: challenge, clearer, dependable, echoed, foster, leverage, matters, multifaceted, practical, prioritize, quietly, steady, universally). Replaces a flat buzzword list with tiers and a technical-mode switch.
3. **Headline cadence rules**: slogan cadence (≥3 lines of 2-4 sentences ≤5 words each), "Meet X, your new...", "Think X meets Y", "No X, just Y", negation chains, setup-reversal ("Ten features. Zero headaches."), tricolon adjectives.
4. **Generic CTA labels + arrows on every CTA + duplicate CTA intent + 3+ hero buttons.**
5. **Section waterfall ≥6 stock sections**, "Most Popular" middle tier of 3, 4-column Product/Company/Resources/Legal footer, default `max-w-7xl` shell on every section.
6. **Fake product visuals**: traffic-light window chrome, div/skeleton "screenshots", text-span logo walls, DiceBear/pravatar/picsum avatars, decorative pulsing status dots, `New/Beta/Pro` pill spam.
7. **Second- and third-order palettes**: emerald fallback, near-black + acid green/vermilion, cream + serif + sage (any 2 of 3), OKLCH 250-320 accent band, primary/accent within 20° hue, accent > 5 placements above the fold.
8. **Down-weight with evidence**: em dash (weight 0 in S6, "historical" in S4), bento, glass, aurora/mesh, dark mode per se, curly quotes. Add a "features (noun)" guard.
