# What X says makes a site look "AI slop": research for Slop Score

Collected 2026-11-07 through twitter241 (read-only). 25 calls: 17 searches (mostly `Top`, one `Latest`) and 8 reply or quote threads. That gave 433 unique posts. Raw responses are in `raw/`. The merged posts are in `all.jsonl` (search plus replies), and `urls.jsonl` maps each post id to its expanded links.

Limits on this data:

- `Top` search favours 2025–2026 posts and engagement-bait accounts that recycle AI-tool content.
- Several viral posts carry the tells **only in an image** (for example @fidexcode and @shellsist), and images can't be read through this API. For those posts the tells come from the replies.
- The counts in section 2 are hand tallies of distinct posts I read that **name** the tell. They are not regex hits. Posts that only say "same purple gradient" count once under purple.

---

## 1. Most-engaged posts

Ranked by likes. Only posts about the topic are kept. Off-topic viral hits (Karpathy and others) are dropped.

| # | Post | Author | Date | Likes / views | Gist |
| --- | --- | --- | --- | --- | --- |
| 1 | https://x.com/teachkunthereal/status/2115596809397514716 | @teachkunthereal | 2026-10-29 | 27.6k / 156k | "they're calling it the most vibecoded website known to man". The joke is X's own broken search (it highlights random letters), so "vibecoded" has become a general insult for janky UI |
| 2 | https://x.com/fuckcomputer/status/2089415478078799992 | @fuckcomputer | 2026-08-17 | 25.6k / 644k | "a dying art: pre ai slop low budget graphic design". Nostalgia for imperfect, human-made design |
| 3 | https://x.com/adamwathan/status/1953510802159219096 | @adamwathan | 2025-08-07 | 22.2k / 1.5M | The Tailwind creator apologises for making every Tailwind UI button `bg-indigo-500`, "leading to every AI generated UI on earth also being indigo". The origin story everyone cites |
| 4 | https://x.com/fidexcode/status/2004930955874803830 | @fidexcode | 2025-12-27 | 9.8k / 455k | "Two signs of AI generated website" (image). The replies name a linear gradient + Lucide icons, and ✅❌ emoji |
| 5 | https://x.com/anvisha/status/2036474296353411290 | @anvisha | 2026-03-24 | 8.0k / 4.55M | "We raised $7.5M to kill AI slop": Moda, a "design agent with taste" |
| 6 | https://x.com/luinlee/status/2113085361836744764 | @luinlee | 2026-10-22 | 7.9k / 572k | One AGENTS.md line against slop: "Avoid unnecessary secondary labels and descriptions. Let the layout do the explaining." |
| 7 | https://x.com/om_patel5/status/2025705776434520284 | @om_patel5 | 2026-02-22 | 7.9k / 656k | "How to vibe code beautiful UI": sketch first, feed references, change the font and icons |
| 8 | https://x.com/sitenley/status/2116916615644057920 | @sitenley | 2026-11-01 | 5.6k / 1.5M | "stop ai slop in your UI" + link (boardui.com). The author reports 16K bookmarks and 105K link clicks |
| 9 | https://x.com/heydamir/status/2116158176336970008 | @heydamir | 2026-10-30 | 5.2k / 630k | Video of a dashboard "unslopping" + a free `unslop` skill (github.com/heydamir/unslop, 8k+ stars in days) |
| 10 | https://x.com/aaayandev/status/2111869611851522121 | @aaayandev | 2026-10-18 | 4.6k / 107k | "best ways to unslop a site: dither, noise, ascii" |
| 11 | https://x.com/asidorenko_/status/2014444151194947642 | @asidorenko_ | 2026-01-22 | 4.5k / 544k | "frontend-design skill" (video demo of Anthropic's skill) |
| 12 | https://x.com/shellsist/status/2091639527190429968 | @shellsist | 2026-08-23 | 4.2k / 64k | "why does every vibecoded website look like #that". The replies list the tells (dark mode, muted colours, serif, emoji icons, bounce-in buttons) |
| 13 | https://x.com/tobiadonadon_/status/2106432288686850124 | @tobiadonadon_ | 2026-10-03 | 4.0k / 350k | A skill to un-slop AI-looking apps: "same cards, same gradients, same generic modern app layout". RT + comment to get it |
| 14 | https://x.com/IroncladDev/status/1970442035199910174 | @IroncladDev | 2025-09-23 | 3.8k / 330k | "code on github… no business model… shadcn ui: this is peak vibe coder slop" |
| 15 | https://x.com/om_patel5/status/2039939578694438979 | @om_patel5 | 2026-04-03 | 3.3k / 405k | "Claude Code is terrible at UI design and everyone knows it" (a design MCP) |
| 16 | https://x.com/okapi_fukugyo/status/2116337353904288234 | @okapi_fukugyo | 2026-10-31 | 3.1k / 340k | Japanese repost of the Frontend Design skill: same fonts, purple gradient, familiar layout, stock hero |
| 17 | https://x.com/jaimintf/status/2117662278686499104 | @jaimintf | 2026-11-03 | 3.0k / 206k | "unslop any app" (Appllama skill + MCP) |
| 18 | https://x.com/reeeesaur/status/2118148558901956968 | @reeeesaur | 2026-11-05 | 2.4k / 307k | "is the new catalog avatar creator UI vibecoded". The accusation as a meme aimed at a big product |
| 19 | https://x.com/matsugfx/status/1905254959077011672 | @matsugfx | 2025-03-27 | 2.3k / 446k | Defends shadcn: "to the guy who claims every shadcn/ui project looks the same, catch this" |
| 20 | https://x.com/shipper_now/status/2110637576935891122 | @shipper_now | 2026-10-15 | 2.1k / 447k | A 927k-character anti-slop .md: no box shadows, no emoji, no "🟢 LIVE" badges, no blue/purple gradients, a ban on the 350 most common AI words |
| 21 | https://x.com/nizamdesign/status/2104924152826409019 | @nizamdesign | 2026-09-29 | 2.0k / 121k | A designer's revamp of a client's "vibe-coded mess" (before/after) |
| 22 | https://x.com/suraj_sharma14/status/2102254059151565233 | @suraj_sharma14 | 2026-09-22 | 1.8k / 142k | **"30 reasons your site looks vibe-coded"**, the most complete one-post checklist (see section 2) |
| 23 | https://x.com/charliejhills/status/2092898653820400076 | @charliejhills | 2026-08-27 | 1.5k / 203k | "15 free skills that kill AI slop", ranked by stars |
| 24 | https://x.com/georgepickett/status/2113317172986753107 | @georgepickett | 2026-10-22 | 1.4k / 92k | "anti-slop design skill" |
| 25 | https://x.com/adiix_official/status/2077760072109666579 | @adiix_official | 2026-07-16 | 1.2k / 649k | "ANTHROPIC JUST CHANGED THE ENTIRE AI-SLOP FRONTEND": Inter, purple gradient, generic startup layout |
| 26 | https://x.com/om_patel5/status/2030310771326861336 | @om_patel5 | 2026-03-07 | 1.0k / 69k | "Lucide is basically the default icon set for AI-coded apps" + 9 alternative icon sets |
| 27 | https://x.com/zack_overflow/status/2114421296604008847 | @zack_overflow | 2026-10-25 | 913 / 99k | "every UI looks the same with this apple/linear minimalist rounded corner tailwind shadcn slop look" |
| 28 | https://x.com/buildwithsid/status/2108552341939266028 | @buildwithsid | 2026-10-09 | 856 / 280k | **URL checker**: "paste your website link… good or just AI slop… drop your scores below" |
| 29 | https://x.com/namyakhann/status/2025265037259276365 | @namyakhann | 2026-02-21 | 827 / 108k | "Purple gradient hero. Sparkle emojis. 'Sarah Chen' testimonials. Same layout." Comment "DESIGN" to get the file |
| 30 | https://x.com/ignaprados/status/2117445464777752810 | @ignaprados | 2026-11-03 | 810 / 158k | **URL checker** (antiwebslop.com): "how vibe-coded your page feels + what to change" |
| 31 | https://x.com/Voxyz_ai/status/2110777729658581409 | @Voxyz_ai | 2026-10-15 | 770 / 48k | taste-skill v2 inspector: all-caps eyebrow, 01/02/03 sections, monospace, cream + terracotta… |
| 32 | https://x.com/vikktorrrre/status/2092618580902728176 | @vikktorrrre | 2026-08-26 | 450 / 108k | "Purple gradient at the top, rounded cards, frosted glass, Inter, emoji as icons" + "Transform your workflow" |
| 33 | https://x.com/sinanyorulmazz/status/2116531845839851723 | @sinanyorulmazz | 2026-10-31 | 374 / 42k | `npx @enmera/ai-design-check`: 70 rules, a deterministic checker, "266 findings → 0" |
| 34 | https://x.com/shao__meng/status/2091834138131370179 | @shao__meng | 2026-08-24 | 248 / 23k | Chinese write-up of the 8 "AI-flavour" patterns in Addy Osmani's Agent Skills, each with _why the model prefers it_ |
| 35 | https://x.com/kloss_xyz/status/2097808934442844307 | @kloss_xyz | 2026-09-09 | 85 / 7k | **A 30-item list ending "none of these are individually wrong. more than five and everyone will know."** Low reach but the richest list |

The five threads opened for replies or quotes: @fidexcode, @shellsist, @suraj_sharma14, @kloss_xyz, @heydamir (comments), @sitenley (quotes), plus @adamwathan and @teachkunthereal.

---

## 2. Tells, deduplicated

The format is **Tell**: number of distinct posts → citations.

### Colours and gradients

- **Purple / indigo / violet as the primary colour, often fading into blue**: 30+ → https://x.com/adamwathan/status/1953510802159219096, https://x.com/vikktorrrre/status/2092618580902728176. Origin story: Tailwind UI's `bg-indigo-500`, shadcn demo themes and Bootstrap's purple. Several posts say GPT-5 "prefers purple" (https://x.com/markjaquith/status/1953585860517277920).
- **Gradients in general** (hero background, buttons, "harsh", "linear", "rainbow"): ~14 → https://x.com/suraj_sharma14/status/2102254059151565233, https://x.com/Sabacodes2/status/2004934359523237996 ("Linear gradient and lucide react", the top reply on @fidexcode)
- **Gradient buttons**: 2 → https://x.com/sinanyorulmazz/status/2116531845839851723, https://x.com/shao__meng/status/2091834138131370179
- **Gradient on the headline text (`bg-clip-text`)**: 3 → https://x.com/kloss_xyz/status/2097808934442844307, https://x.com/alex_prompter/status/2119010352272998434
- **Untouched default Tailwind / shadcn palette**: 4 → https://x.com/tomilola_ng/status/2114078495487729986, https://x.com/kloss_xyz/status/2097808934442844307
- **Neon, rainbow or basic pastel colours**: 2 → https://x.com/suraj_sharma14/status/2102254059151565233, https://x.com/Preshtherealman/status/2004932344101380235
- **Dark mode by default, muted colours**: 2 → https://x.com/shellsist/status/2091641213300642014, https://x.com/aryanXmahajan/status/2114846677421220045
- **Cream background with terracotta** (the newer "Claude look"): 1 → https://x.com/Voxyz_ai/status/2110777729658581409. Related: "it has that telltale look that Claude websites tend to have" https://x.com/mad_mugo/status/2118967954343883173
- **Pure white background**: 1, and disputed → https://x.com/suraj_sharma14/status/2102254059151565233

### Effects

- **Glows: a glowing orb behind the hero, radial orbs, a "gradient blob", edge glow**: 8 → https://x.com/kloss_xyz/status/2097808934442844307, https://x.com/mukparekh/status/2089289308603899992
- **Glassmorphism, frosted or "liquid" glass; a glass card floating over a gradient**: 5 → https://x.com/vikktorrrre/status/2092618580902728176, https://x.com/tomilola_ng/status/2114078495487729986
- **Heavy drop shadows (`shadow-lg`/`xl` everywhere)**: 3 → https://x.com/shao__meng/status/2091834138131370179, https://x.com/shipper_now/status/2110637576935891122
- **Hairline 1px borders and shadows shown without any hover**: 2 → https://x.com/Voxyz_ai/status/2110777729658581409, https://x.com/aryanXmahajan/status/2114846677421220045
- **Dot-grid background**: 2 → https://x.com/kloss_xyz/status/2097808934442844307, https://x.com/suraj_sharma14/status/2102254059151565233
- **Heavy text shadow**: 1 → https://x.com/AshikArtistry/status/2112817162176045434
- Counter-trend: **dither, noise and ASCII** are pitched as the _cure_ (4.6k likes, https://x.com/aaayandev/status/2111869611851522121). Expect them to become the next tell.

### Typography

- **Inter as the only font**: ~17 → https://x.com/maddiedreese/status/1976499720865579240, https://x.com/notEgoyard/status/2094372796814028888. Anthropic's skill bans Inter, Roboto, Arial and Space Grotesk.
- **Geist / Space Grotesk / Instrument Serif**: 4 → https://x.com/suraj_sharma14/status/2102254059151565233, https://x.com/Overlap_AI2/status/2116558466940637481 ("instrument serif and space grotesk everywhere… an 80s kitchen in ten years")
- **Serif display font + dark mode + muted colours**: 1 → https://x.com/shellsist/status/2091641213300642014
- **Monospace for body text or buttons outside code**: 1 → https://x.com/Voxyz_ai/status/2110777729658581409
- **Small all-caps eyebrow above the headline ("FEATURES"), wide-tracked caps**: 3 → https://x.com/Voxyz_ai/status/2110777729658581409, https://x.com/AshikArtistry/status/2112817162176045434
- **Font sizes off any scale; heading and subheading touching**: 2 → https://x.com/sinanyorulmazz/status/2116531845839851723, https://x.com/AshikArtistry/status/2112817162176045434

### Layout and hero

- **3 identical feature cards in a row / a uniform card grid / "cards stacked on cards"**: 11 → https://x.com/kloss_xyz/status/2097808934442844307 ("3 feature cards, identical text length"), https://x.com/shao__meng/status/2091834138131370179
- **Rounded everything (`rounded-2xl` on every element, no radius hierarchy)**: 7 → https://x.com/shao__meng/status/2091834138131370179, https://x.com/zack_overflow/status/2114421296604008847
- **Generic centred hero: big title + subtitle + "Get started" next to "Learn more" over a gradient**: 6 → https://x.com/kloss_xyz/status/2097808934442844307, https://x.com/dravenip/status/2117622535181525381
- **Uniform oversized padding / spacing that drifts off any grid**: 5 → https://x.com/shao__meng/status/2091834138131370179, https://x.com/sinanyorulmazz/status/2116531845839851723
- **Bento grid**: 4 → https://x.com/suraj_sharma14/status/2102254059151565233, https://x.com/pirwot/status/2102256360284999875 ("bento grids and radial orbs date a site")
- **Same section order as 500 other startups (hero, feature grid, info card, CTA)**: 2 → https://x.com/bytegamy/status/2022520831868571864
- **Too many secondary labels and descriptions**: 1, but the post has 7.9k likes → https://x.com/luinlee/status/2113085361836744764
- **Sections numbered 01 / 02 / 03**: 1 → https://x.com/Voxyz_ai/status/2110777729658581409
- **Terminal-window mockup; a coloured left stripe on cards**: 1 → https://x.com/suraj_sharma14/status/2102254059151565233

### Components and sections

- **Fake testimonials and avatars ("Sarah Chen")**: 4 → https://x.com/namyakhann/status/2025265037259276365, https://x.com/kloss_xyz/status/2097808934442844307
- **Fake product screenshot, no real demo, fewer than 4 real pictures, a demo video where the cursor never clicks**: 4 → https://x.com/kloss_xyz/status/2097808934442844307, https://x.com/TH33ORACL3/status/2097820661917819220
- **3 pricing tiers with "Most popular" in the middle, $9 / $29 / $99**: 3 → https://x.com/kloss_xyz/status/2097808934442844307, https://x.com/wolfgangg37/status/2098146531446538359
- **No loading, empty or skeleton states**: 3 → https://x.com/suraj_sharma14/status/2102254059151565233, https://x.com/bytegamy/status/2022520831868571864
- **Unearned "Trusted by" logo strip; a stats row with "10,000+ users, 99.9% uptime"**: 2 → https://x.com/kloss_xyz/status/2097808934442844307, https://x.com/EmmaRodAI/status/2098077810980266376
- **"Powered by AI" badge in the nav, "🟢 LIVE" badges**: 2 → https://x.com/kloss_xyz/status/2097808934442844307, https://x.com/shipper_now/status/2110637576935891122
- **Checkmark bullet lists**: 2 → https://x.com/suraj_sharma14/status/2102254059151565233
- **Dead ends: a waitlist that goes nowhere, a blog link with no blog, no ToS or privacy page**: 3 → https://x.com/kloss_xyz/status/2097808934442844307, https://x.com/pirwot/status/2102256360284999875
- **An FAQ that answers questions nobody asked**: 1 → https://x.com/kloss_xyz/status/2097808934442844307
- **Default favicon; broken link preview; a 4 MB hero image**: 2 → https://x.com/kloss_xyz/status/2097808934442844307, https://x.com/thenowhereway/status/2118578293318578395
- **Leftover lorem ipsum, "Feature 1/2/3"**: 2 → https://x.com/shao__meng/status/2091834138131370179, https://x.com/mukparekh/status/2089289308603899992

### Icons and emoji

- **Emoji as icons or labels (✅❌🚀🔥🦄), emoji in headings**: ~13 → https://x.com/ionleu/status/2025109741505315149 ("signs of ai generated landing page 🔥🚀💥❌✅⛈️🦄"), https://x.com/brldev/status/2004936935513751842
- **A sparkle ✨ icon on anything AI**: 5 → https://x.com/kloss_xyz/status/2097808934442844307, https://x.com/_alphashark_/status/2097930274386444565 ("the sparkle icon is the tell")
- **Lucide icons**: 5 → https://x.com/om_patel5/status/2030310771326861336, https://x.com/Sabacodes2/status/2004934359523237996
- **An icon in a tinted rounded square at the top of each card**: 2 → https://x.com/kloss_xyz/status/2097808934442844307, https://x.com/dravenip/status/2117622535181525381

### Copy

- **Hype or empty headlines** ("Transform your workflow", "Elevate your experience", "Unlock your potential", "Welcome to our platform", "seamless", "revolutionize", "cutting-edge", "Fast. Simple. Powerful."): 9 → https://x.com/vikktorrrre/status/2092618580902728176, https://x.com/tomilola_ng/status/2114078495487729986
- **Em dashes everywhere / em-dash density**: 5 → https://x.com/suraj_sharma14/status/2102254059151565233, https://x.com/k2sbhai/status/2098292249704669482 (an anti-slop rule found 18 in one `index.html`)
- **"It's not X, it's Y"**: 2 → https://x.com/kloss_xyz/status/2097808934442844307
- **Hero copy that never says what the product does**: 2 → https://x.com/kloss_xyz/status/2097808934442844307, https://x.com/tomilola_ng/status/2114078495487729986
- **Feature names made of two nouns ("Seamless Workflow")**: 1 → https://x.com/kloss_xyz/status/2097808934442844307
- **"Welcome back, Alex! 👋", exclamation marks, shouty copy**: 3 → https://x.com/sinanyorulmazz/status/2116531845839851723, https://x.com/OwnYourCompute/status/2116708049825997077

### Motion

- **Mediocre hover and scroll animations everywhere**: buttons that bounce in on load and lift on hover, panels sliding in from the sides while scrolling, animated arrows, endless loops, `transition-all`, hover scale-ups. 7 posts → https://x.com/shellsist/status/2091802949223887225, https://x.com/TheLordFlygon/status/2091701615510380781, https://x.com/alex_prompter/status/2119010352272998434
- **PowerPoint-style entrance animations**: 1 → https://x.com/DivyanshT91162/status/2056819175914652153
- The opposite tell, too little motion ("minimal animation", "fewer than 8 things that move"): 2 → https://x.com/notEgoyard/status/2094372796814028888, https://x.com/Voxyz_ai/status/2110777729658581409

### Non-visual and code fingerprints (only some can be read from a URL)

- Builder fingerprints, meaning the site-builder platform leaves markers in the HTML: https://x.com/mukparekh/status/2089289308603899992
- Stacked Tailwind classes, generic component names (`HeroSection`, `FeatureGrid`, `CtaSection`), copy-pasted SEO defaults: https://x.com/bytegamy/status/2022520831868571864
- A focus ring that was removed: https://x.com/sinanyorulmazz/status/2116531845839851723

**The scoring rule people use:** "none of these are individually wrong. more than five and everyone will know." (https://x.com/kloss_xyz/status/2097808934442844307). @suraj_sharma14 makes the same point: "Inter, gradients, cards and checkmarks were all popular before AI… the tell is how predictably they get combined now" (https://x.com/suraj_sharma14/status/2102617706566729728). So score the **combination**, not single items.

---

## 3. "Not slop" and false accusations

- **Many of these tells predate AI.** "at least half of these things were wildly popular before ai" (https://x.com/Cortright_ok/status/2102616201037787183). "Half of this was a problem before vibe coding" (https://x.com/ArtifactLab618/status/2097835294070600121). Before AI there was "SV slop" (https://x.com/metrohyena/status/2091676930374353037). Bootstrap, DaisyUI and shadcn sites always looked alike (https://x.com/ledevultime/status/2099463212744008104). Outsourced design gave the same results (https://x.com/amix3k/status/2063133516179874018).
- **People defend individual items:**
  - Purple: "favourite colour for 25 years" (https://x.com/ryancharleston/status/2097924419520016425), "not every purple gradient is AI slop" (https://x.com/blankhoss/status/2092971545983332653), a brand that has been purple since 2021 (https://x.com/gongjoonamu/status/2092679201920852431).
  - Inter: https://x.com/CrystalTaggart/status/2078072170513908185
  - Geist: https://x.com/AleSchrammel/status/2102262845295804579
  - Liquid glass: https://x.com/HyperSalesman/status/2102294310561656843
  - White background: https://x.com/mjrode/status/2102471142673924497
  - 3 tiers, soft corners, cards: https://x.com/CaffeinaitedMax/status/2102366019503423872
  - "So if I use this colour I'm AI?": https://x.com/EluroGodst91538/status/2004939305652027595
  - Hand-coded sites use glass, white backgrounds and 3 tiers too: https://x.com/Lamka_Labs/status/2102504176383365250
- **False positives on human work.** A hand-drawn game got "screams AI" (305 likes, https://x.com/krakenberrypie/status/2054168485157126188). "Kids now assume all buggy apps are vibecoded" (https://x.com/venturetwins/status/2111308509442871358). "This isn't AI slop" (https://x.com/avstudiosng/status/2102697109409440174). A redesign video was accused of being staged (https://x.com/DzPromptx/status/2116169990009168004).
- **The slop is the defaults, not the tool.** "Shadcn looks the same if you don't care" (https://x.com/jvrsanch/status/2046991300944437494). shadcn sites can look great (https://x.com/matsugfx/status/1905254959077011672). AI slop is "objectively good design through unopinionated prompting" (https://x.com/designcoursecom/status/2080802781087089047).
- **Anti-slop tools make new slop.**
  - "Any tools made to stop AI UI slop eventually becomes the slop" (76 likes, https://x.com/__adewale/status/2117014900576747637)
  - "give it 6 months and every site running the anti slop skill looks the same" (https://x.com/hamarshehmhmd/status/2116460733747671043)
  - "Premium slop": dark mode, Inter, Lucide, 12 cards with 1px borders (https://x.com/aryanXmahajan/status/2114846677421220045)
  - Frontend Design output "just started repeating" (https://x.com/fawnunwrap/status/2091733721959350666)
  - "ai slop bitti. shadcn slop başladı" (Turkish: "AI slop is over, shadcn slop has started"): https://x.com/serhanbaydi/status/2118099837526675680
  - The unslop skill "overcorrects" Claude designs (https://x.com/repalash/status/2116583732257914981)
  - taste-skill's own blind test was nearly a tie: 7.7 with the skill vs 7.8 without (https://x.com/Voxyz_ai/status/2110777729658581409)
- **Function over looks.** Fix the tells that hurt users and ignore the rest (https://x.com/suraj_sharma14/status/2102438012257005954). "Pure white + a real product. That's a site." (https://x.com/suraj_sharma14/status/2102578799774986635). Missing legal pages and fake testimonials cost customers, while orbs only date a site (https://x.com/pirwot/status/2102256360284999875).

What this means for scoring:

- Weight trust-killing tells (fake testimonials, a fake demo, dead links) differently from merely dated ones (orbs, bento).
- Look at the combination of tells, not single items.
- Never cap a site's score because of one default.
- Show the receipts so owners can argue with the result.

---

## 4. Existing tools that score or detect AI-slop sites

| Tool | Link | How it scores | Traction seen |
| --- | --- | --- | --- |
| **Slopdar** | http://slopdar.com, https://github.com/Slopdar/slopdar | Paste a URL and get a **"Slop Score" from 0 to 100**. **A high score means slop, the opposite direction to ours, and it uses the same name.** It shows the "receipts": builder fingerprints, leftover lorem ipsum, the shared gradient blob, em-dash density. Each signal is a small TypeScript rule with a public weight and tests. No AI involved; built on Node, MySQL and Redis. MIT licence, 1,700+ sites scanned | 7 likes (https://x.com/mukparekh/status/2089289308603899992) |
| **antiwebslop.com** | https://antiwebslop.com | Shows "how vibe-coded your page feels" and what to change. The author replies to people with their "slop score" | 810 likes / 158k views (https://x.com/ignaprados/status/2117445464777752810) |
| **AI Slop Checker** | https://ai-slop-checker.vercel.app | Paste a link and learn whether the site is "good or just AI slop" as a score. Built on Frevana | 856 likes / 280k views (https://x.com/buildwithsid/status/2108552341939266028) |
| **slop-score** | https://github.com/finalowler/slop-score | Gives a % for how unslopped a UI is. Based on fil.ai's unslop skill | 7 likes (https://x.com/linazfowler/status/2115311862313320801) |
| **"AI Slop Score" Chrome extension** | link not captured | Scans the current site and judges whether it is "just another AI wrapper or something more original" | 11 likes (https://x.com/Jacob_Rhodes_/status/2070494866174271859) |
| **@enmera/ai-design-check** | http://github.com/enmerasoftware/ai-design-check | 70 rules and a deterministic checker with no AI. Counts **findings**: off-4px-grid spacing, off-scale font sizes, gradient buttons, emoji icons, "Welcome back 👋", a removed focus ring. Rules were checked against 16 top Dribbble/Behance dashboards. Works on source code, not URLs | 374 likes (https://x.com/sinanyorulmazz/status/2116531845839851723) |
| **taste-skill v2 `inspect.mjs`** | skills.sh/Leonxlnx/taste-skill | Opens pages at desktop, tablet and phone widths and lists AI-website tells as FAIL/WARN: eyebrow caps, 01/02/03 sections, monospace, ever-present shadows, cream + terracotta or violet, fewer than 4 real pictures, fewer than 8 moving things | 770 likes (https://x.com/Voxyz_ai/status/2110777729658581409) |
| **unslop (heydamir)** | https://github.com/heydamir/unslop | An agent skill. It audits a local codebase or a live URL, lists each sign of slop and where it lives, then fixes it in passes. A Spanish fork, "unslop-anything", runs a ~60-rule Python scanner (https://x.com/FrannRivarola/status/2118186084655829268) | 5.2k likes |
| **anti-slop** | http://github.com/miqdadbadjuber/anti-slop, http://anti-slop.design | 38 rules and a "Delivery Gate" report. Rule R-02 counts em dashes | 240 likes (https://x.com/rammcodes/status/2105017332137677104) |
| **Hallmark** | https://github.com/Nutlope/hallmark | Has a `/hallmark audit <path>` mode that critiques a design without changing it | 152 likes (https://x.com/tom_doerr/status/2059755798348136908) |
| **mshumer/unslop** | https://github.com/mshumer/unslop | Generates hundreds of sites, finds the recurring "slop" patterns, and writes them into a skill | 523 likes (https://x.com/mattshumer_/status/2034357815171813546) |
| An unnamed "AI slop detector" | – | Unknown | https://x.com/tadasgedgaudas/status/2025489416957862038 |

Gap: the URL scorers that got traction (antiwebslop, ai-slop-checker) don't publish their method in their posts. The transparent one (Slopdar) has public rules but got almost no traction. No tool in this sample both scores visual tells from a rendered URL with published weights _and_ gets shared widely.

---

## 5. Marketing angle: what made these posts spread

1. **A short tell list you can copy.** "30 reasons your site looks vibe-coded" (1.8k likes / 142k views) closes with "Give this to Claude/ChatGPT before shipping." @kloss_xyz ends with "what other dead giveaways did I miss?" to pull in replies. Numbered, bookmarkable and pasteable into an agent.
2. **A before→after, ideally a ≤10 s video.** @heydamir's unslop video got 5.2k likes and 630k views; a later post claims the video passed 1.9M views with bookmarks close to likes (https://x.com/alex_prompter/status/2119010352272998434). Also @yasirahmadnoori (659 likes / 94k), @nizamdesign (2k), and @enisco's "vibe-coded website 2025 vs 2026" (515).
3. **A few words + a visual or link.** "Two signs of AI generated website" + an image (9.8k). "why does every vibecoded website look like #that" (4.2k). "stop ai slop in your UI" + link (5.6k likes / 1.5M views / 105K link clicks; the author says there was no launch video: https://x.com/sitenley/status/2117345918928478400). The picture does the explaining and the replies do the listing.
4. **An insider confessing or explaining where it came from.** Adam Wathan's `bg-indigo-500` apology (22k likes / 1.5M views) is the best-performing post that is purely about the topic. "Distributional convergence" and "statistical average design" explanations also travel well.
5. **"Paste your URL, get a score, drop yours below."** Both URL checkers passed 150k views: @buildwithsid and @ignaprados. The author answering each reply with that site's score keeps the thread alive. The service-offer version works the same way: "drop your link, we'll fix it in 48h" (https://x.com/sonia_axion/status/2118765249524535620), "I'll unslop 3 lucky ones" (https://x.com/heydamir/status/2118327473360211974).
6. **Gated freebies** ("RT + comment 'stop slop'", "comment DESIGN and I'll DM it"): 4k and 827 likes. They work for reach but read as bait.
7. **"ANTHROPIC JUST…" hype reposts quoting star and install counts**, reposted in Japanese, Chinese and Spanish (3.1k, 1.2k, 621 likes…). The topic spreads well beyond English.
8. **What flopped:** text-only tool launches with no visual and no score shown. Slopdar got 7 likes even though it does almost exactly what Slop Score does; the Chrome extension got 11; slop-score got 7.

Hooks to reuse:

- "Is it built, or is it slop?"
- "none of these are individually wrong. more than five and everyone will know"
- a before/after of a famous site's score
- a public leaderboard of well-known AI-built launches
- "drop your URL, I'll reply with your score"
- the Tailwind indigo origin story as the explainer

Positioning: Slopdar already uses "Slop Score" for a 0–100 scale where 100 means slop. Our scale runs the other way (100 = handcrafted). That needs a clear one-line explanation, or a different name.
