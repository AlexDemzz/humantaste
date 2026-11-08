# X audit: Emil Kowalski (@emilkowalski) and Jakub Krehel (@jakubkrehel)

Research date: 2026-10-23. Audience: @AlexDmzz (design engineer who ships shadcn registry components, Claude Code skills and a portfolio at alexandrejoly.me).

## How this was researched

- **The Chrome extension was not connected.** `tabs_context_mcp` failed twice and `list_connected_browsers` returned `[]`. No browser was used and nothing was clicked, liked or posted.
- **Nitter and xcancel are down** (451 errors or an X legal takedown notice). Some mirrors put up a bot challenge, which I did not try to bypass.
- **Data sources:**
  - **X API v2 via Kwern** (read only):
    - Jakub's timeline: 100 original posts, 2026-04-21 → 2026-10-22, excluding replies and reposts.
    - Jakub's pinned post.
    - A full-archive search for Emil's historic launches (Sonner, Vaul, animations.dev).
    - Jakub's 2024–25 hits.
    - Reply samples for both accounts (Emil 2026-10-09 → 10-22, Jakub 2026-10-01 → 10-22).
  - **Coordinator file** `00-x-api-emil.md`: 98 of Emil's original posts, 2026-06-30 → 10-22, with likes, impressions and bookmarks.
  - **Public FxTwitter JSON API** (`api.fxtwitter.com/2/profile/<handle>/statuses`): profile metadata, post types (original, self-thread, quote, repost), media type, video duration and resolution, and posting time.
    - Emil: 118 items, 2026-06-15 → 10-22, plus the pinned post.
    - Jakub: 219 items, 2025-03 → 2026-10.
  - **Media thumbnails and banners** for the top posts, downloaded and viewed.
  - **Sites:** emilkowal.ski, animations.dev, aiforui.dev, jakub.kr, interfaces.dev, and Emil's essay "Building an animation course".
- **Labels used in this file:**
  - **[OBS]** means I saw it in the data or a page.
  - **[INF]** means my interpretation.
  - All numbers come from the API or FxTwitter as of 2026-10-23. "Likes" means likes and "imp" means impressions.
- **Limits:**
  - I saw video thumbnails, not the videos. I could not check sound, captions or the motion itself.
  - The reply ratio comes from a 2–3 week sample.
  - Emil's launch post for his new course (aiforui.dev) is not in the window yet.

---

## 1. Profile and positioning

|  | Emil Kowalski | Jakub Krehel |
| --- | --- | --- |
| Followers [OBS] | 111,084 (following 148) | 24,278 (following 203) |
| Bio [OBS] | **Empty.** No bio, no location. | "At @interfere_, magazine → interfaces.dev" · New York, NY |
| Link [OBS] | emilkowal.ski | jakub.kr |
| Header [OBS] | Plain white banner, unchanged since Dec 2023 | Plain white/off-white banner, updated around Aug 2026 |
| Pinned [OBS] | Since 2024-03-05: an image of the Ira Glass "taste gap" quote with no caption. 2,570 likes, 175k imp, 1,218 bookmarks. | "Introducing Interfaces" launch post (2026-05-13): video, 3,934 likes, 294k imp, 4,277 bookmarks |
| Site positioning [OBS] | emilkowal.ski: "Design Engineer". "Currently taking a break from work." Banner: "enrollment open for aiforui.dev, 7 days left". Project cards: aiforui.dev, Sonner, animations.dev, Vaul. Seven essays. | jakub.kr: "I'm a founding design engineer at Interfere, where we're building the self-healing layer of the internet." Projects: Interfaces, /skills, oklch.fyi. |

**[INF] Positioning in one line.**

- Emil's name is his brand, and the work does the talking. He has no bio, a white header and a pinned post about taste: "I am the taste guy, see for yourself."
- Jakub uses his bio as a funnel: employer, then an arrow to his paid product. The pinned post is the product launch.
- Both keep a minimal, almost empty profile. The whole visual identity lives in the media.

---

## 2. Post formats and mix

### Emil: 77 original and quote posts, 2026-06-15 → 10-22 [OBS, FxTwitter]

| Format                                               | Share | Median likes |
| ---------------------------------------------------- | ----- | ------------ |
| Text only (opinions, lists, workflows)               | 40%   | **1,912**    |
| Video (UI demos, before/after, terminal demos)       | 31%   | 1,136        |
| Link card (mostly the GitHub skills repo)            | 17%   | **2,966**    |
| Photo (ASCII/markdown diagrams, tables, screenshots) | 12%   | 1,204        |

- **Other activity on top of those 77:**
  - 31 self-thread follow-ups: links, "example prompts later today", course details.
  - 10 reposts, mostly Linear company posts and student testimonials.
  - About 25 replies to other people in 13 days (Oct 9–22), roughly 2 a day.
- **[INF] Effective mix:** about 40% original posts, 15% self-thread follow-ups and about 45% replies.
- **[OBS] No polls, no X long-form Articles and almost no multi-post threads.** "Threads" are one main post plus one or two link or detail replies. The longest posts are single long-form posts of 200+ words, e.g. "The reason why my personal site has just one font size…", 2,375 likes and 285k imp.
- **[OBS] The 2026 shift: Emil now wins with skills and opinions, not demos.**
  - Six of his top 10 are text or link posts: "New skill: /…" posts and AI/craft takes.
  - Demos still appear weekly (Linear details, Sonner details), but they sit at the lower median.

### Jakub: 130 original and quote posts, 2025-03 → 2026-10 [OBS, FxTwitter]

| Format                                   | Share   | Median likes |
| ---------------------------------------- | ------- | ------------ |
| Video (UI component demos, before/after) | **72%** | 545          |
| Link card (article, skill, magazine)     | 15%     | **727**      |
| Photo                                    | 8%      | 405          |
| Text only                                | 5%      | 184          |

- **Other activity on top of those 130:**
  - 78 self-thread follow-ups. In 2026 almost every post has one, usually a bare link (median 14–17 likes).
  - About 21 replies to others in 3 weeks (Oct 1–22), roughly 7 a week. Most are short thanks.
- **[OBS] Jakub's model is "demo plus link in the reply".** He almost never posts bare opinions, and when he does they flop (see section 9).

---

## 3. Hooks: verbatim first lines

### Emil: first lines from 2026 posts, ranked by likes [OBS]

1. "New skill: /apple-design" (2026-07-09). 13,049 likes, **2.04M imp**, **22,625 bookmarks**. His best post of the period.
2. "This is my last week at Linear." (10-21). 7,882 likes, 284k imp. Video montage of his work.
3. "New skill: /find-animation-opportunities" (07-15). 6,486 likes, 447k imp, 9,187 bookmarks.
4. "Back in 2021 I interviewed at Vercel and I failed badly." (10-22). 5,566 likes, 392k imp.
5. "Few tricks to make your app feel more native on mobile" (08-11). 5,534 likes, **7,652 bookmarks**. The image is a plain-text Problem | Solution table.
6. "Some of my favorite UI libraries:" (07-06). 4,955 likes, 8,280 bookmarks.
7. "New skill: /improve-animations" (07-11). 4,913 likes, 507k imp.
8. "Added two new skills to my skills repo recently." (10-04). 4,600 likes.
9. "One of my recent favorite AI use cases: asking it to try and break the stuff I built." (09-25). 4,112 likes.
10. "The thing I miss the most about coding by hand is the clarity." (08-24). 3,460 likes.
11. "Don't forget to stagger your animations if you animate a lot of elements." (09-28). 3,415 likes.
12. "The people getting great UI results with AI aren't using a secret model or a magic prompt." (07-16). 3,302 likes.
13. "People DO judge a book by its cover" (08-09). 3,250 likes.
14. "Currently I'm really into markdown graphs with one vibrant accent color" (08-17). 3,169 likes, 374k imp.
15. "Can someone help me understand how shipping 100s PRs a day makes sense?" (10-08). 2,535 likes, **420k imp** (a reach magnet).
16. "The bigger an animated element is, the slower it should move." (10-09). 2,404 likes.
17. "I'm like 98% sure that you should set `text-wrap: pretty;` by default globally in your app." (09-24). 1,982 likes.
18. "One of my favorite details of Sonner:" (08-31 and 10-12). 1,266 and 646 likes. A recurring series.

Historic launches [OBS, API full-archive search]:

- "Introducing Sonner - an opinionated toast component for React." (2023-02-23). 2,004 likes, 202k imp.
- "Introducing Vaul - an unstyled drawer component for React." (2023-07-25). 1,827 likes, 265k imp.
- "Introducing Animations on the web" (2024-01-16). **4,325 likes, 743k imp, 3,914 bookmarks**. A presale announced before the content existed.
- "Introducing Vaul 1.0." (2024-09-26). 1,937 likes.

### Jakub: first lines from 2025–26 posts [OBS]

1. "If you ever feel like the gradients you're using are dull or muddy, try using OKLCH colors instead." (2026-02-02). **7,458 likes**, 284k imp, 6,185 bookmarks. Side-by-side sRGB vs OKLCH demo.
2. "It's incredible that /make-interfaces-feel-better has already been installed more than 30,000 times." (06-21). 6,895 likes, 390k imp, **11,092 bookmarks**.
3. "A couple of before / after examples of the skills I've added last week." (07-28). 4,506 likes, **587k imp**, 5,277 bookmarks.
4. "Introducing Interfaces" (05-13). 3,934 likes. Pinned.
5. "It's incredible that my skills have been installed more than 160,000 times." (09-03). 3,918 likes, 5,017 bookmarks.
6. "Animating opacity, scale and blur in buttons when different icons are shown contextually makes them feel much better." (2025-08-12). 3,099 likes.
7. "In a recent article, I wrote about using skills to encode judgement and understanding into agents." (07-12). 2,893 likes, 4,205 bookmarks.
8. "Details That Make Interfaces Feel Better" (03-10). 2,488 likes, 278k imp. A bare article link.
9. "/make-interfaces-feel-better" (04-19). 2,362 likes, **627k imp**. The post is only the skill name, an `npx skills add …` line and a video.
10. "I've added 4 new skills to the /better collection." (07-24). 2,293 likes, **675k imp**, 4,433 bookmarks.
11. "I've migrated all my projects to `oklch()`." (02-18). 1,981 likes.
12. "One tip from my make-interfaces-feel-better skill is using `font-variant-numeric: tabular-nums` for values that update." (03-23). 1,818 likes.
13. "I made a new skill: /interface-review" (08-11). 1,727 likes.
14. "If elements ever shift unexpectedly by a few pixels during an animation and you can't figure out why, try using the `will-change` CSS property." (05-11). 1,578 likes.
15. "A lot of people asked for a before and after running the skill in the comments." (04-21). 1,575 likes, 183k imp.
16. "Introducing Loading" (09-22). 1,269 likes. A loading-indicator library.
17. "Introducing a new Interfaces issue:" (recurring). About 500–900 likes each.

### Hook patterns that win [INF, from the lists above]

- **Announce with a slash command:** "New skill: /name" (Emil) or "/name" alone with `npx …` (Jakub). It reads like a product and is copy-pasteable.
- **"If you ever [pain] … try [fix]"** (Jakub). A conditional problem statement, then a CSS property or technique.
- **A rule stated as physics:** "The bigger X, the slower it should move." / "Don't forget to stagger…".
- **"Some of my favorite X:"**, then a one-per-line list. These get huge bookmark counts.
- **A gratitude milestone:** "It's incredible that X has been installed more than N times." Jakub's second and fifth best posts.
- **Vulnerable story then lesson:** "Back in 2021 I … failed badly." Emil's fourth best.
- **A genuinely confused question about AI hype:** "Can someone help me understand…". Highest impressions-to-likes ratio, so it travels.
- **Hedged certainty:** "I'm like 98% sure that you should…".

---

## 4. Launch and promotion playbooks

### Emil

**Open source (Sonner, Vaul) [OBS]**

- The launch is a one-liner: "Introducing X - an [adjective] [component] for React." with a link and a video.
- Weekly feature posts follow:
  - "Added nested drawers to Vaul!" (314 likes)
  - "Added snap points to Vaul over the weekend" (399)
  - "Tried building family's tray system on the web… Vaul and framer motion" (1,046), which shows a showcase built on the library
- Ecosystem news: "You can now use Sonner and Vaul in shadcn/ui! Thanks to @shadcn" (579).
- A major version gets a fresh "Introducing Vaul 1.0." (1,937).
- Years later he still posts the series "One of my favorite details of Sonner:" with a short demo and a technical explanation.
- Milestone humble-brags:
  - "thanks for ~50,000,000 weekly downloads!" (1,200)
  - "Updated my 'Building a Toast component' as I recently learned that OpenAI uses Sonner in ChatGPT. Yes, I had to brag about it because it's _so_ cool." (560)

**The animations.dev course [OBS, from posts, his essay and the site]**

- **Launch:** a presale on 2024-01-16 before any content existed: "Introducing Animations on the web" (4,325 likes, 743k imp).
  - His essay says the public deadline kept him going.
  - He lists his 13-month public tease of ui.land as a mistake, because talking about it felt rewarding enough to stop shipping.
- **Enrollment windows:** about four a year, 10 days each. The opener reuses the same wording:
  - "The registration for my animation course is open for the next 10 days." (Jan 2025: 1,840; Apr 2025: 1,428)
  - "You can enroll in my animation course for the next 10 days!" (Jul 2025: 1,366; Oct 2025: 1,866)
- **Pre-window:**
  - New-lesson teaser: "New lesson for upcoming animations.dev enrollment…" (929)
  - Countdown: "After more than 4 months, animations.dev is opening in exactly 7 days." (1,006)
- **Open day (2025-08-25):** a main post (990) plus four self-replies: price and what's inside, a curriculum image, a skills demo, and the closing date and time. The replies got 11–40 likes each.
- **Close:** a milestone and last-call post.
  - "More than 900 designers and engineers have joined my animations course in the last 10 days. That's more than 6,600 students in total since January 2024. Extremely grateful. You still have ~2 hours to join!" (653)
  - Jan 2026 version: "…2,400… 10,400 students…" (1,194)
- **Shareable easter eggs:** "As enrollment gets closer to closing, the butter cube melts more with each hour" (1,145).
- **Free updates for existing students**, announced publicly: "Shipped 12 brand new skills for animations.dev today made out of the course's content" (1,351).
- **Testimonials:**
  - Reposted from X, e.g. "The problem with finally finishing @emilkowalski's animations.dev course is that now I see all the broken animations…".
  - Embedded on the landing page as X-post cards from shadcn, Matt Perry and others.
- **Landing page:** "13,000+ designers and engineers". There is a waitlist with two free preview lessons, and the next window is Nov 10.

**Skills repo (2026) [OBS]**

- A near-weekly "New skill: /x" post with three lines of value and a GitHub link, about 12 between June and October.
- Each one is followed by a self-reply: "Stay up to date with my skills here (sending a few example prompts that work well with this skill later today)", which points to an email signup (26–65 likes).
- Workflow posts chain the skills together: "/find-animation-opportunities → /animate → /review-animations" (2,705 and 3,376 likes).
- Milestones:
  - "My skills repo has gained 8,000 GitHub stars in a week, it surpassed Vaul" (699)
  - "thanks for 1.5 milion downloads and 40k GitHub stars!" (1,176)

**AI for UI course (aiforui.dev), launching now [OBS and INF]**

- 2026-09-15: a teaser self-reply under a workflow post: "if you are interested in the intersection AI and UI… you'll love this one. Sending some interesting previews and skills to the people on the waitlist soon." (74 likes, under a 2,760-like parent).
- 2026-10-21: "This is my last week at Linear." (7,882). He reposted a fan-made guessing site, "Place your bets below! wherewillemilgo.site".
- 2026-10-22: the "failed my Vercel interview" story (5,566). [INF] It is good warm-up content right before a launch.
- The site is live in early access: "AI for Designers and Engineers", $299 (down from $399), 28 UI skills, a "7 days left" banner, and testimonials from shadcn and an Anthropic designer. The X launch post was not yet in the data.
- [INF] The arc goes: skills as free proof of expertise → waitlist → a dramatic personal moment (leaving Linear) → paid course.

### Jakub

**oklch.fyi, a free tool used for audience building [OBS]**

- 2025-03 tool demo (407) → 2025-08 article "What are OKLCH colors?" (989) → 2025-10 revamp (499) → 2026-01 saved palettes (603).
- 2026-02 breakout tip: "If you ever feel like the gradients… dull or muddy" (**7,458**).
- 2026-04 oklch skill (798, then 759).
- The topic was compounded for a year before it broke out.

**The skills ladder, the clearest funnel I found [OBS]**

1. Article: "Details That Make Interfaces Feel Better" (03-10, 2,488).
2. Turned into a skill (03-16, 980): "I turned the tips mentioned in this article… into a skill. Run `npx skills add …`".
3. Tip from the skill (03-23, 1,818).
4. Standalone skill post with a video (04-19, 2,362, 627k imp).
5. "A lot of people asked for a before and after… in the comments" (04-21, 1,575). He answers demand from the replies.
6. **Paid magazine launch:** "Introducing Interfaces" (05-13, 3,934). The original article becomes one of three free issues.
7. Milestone: "installed more than 30,000 times" (06-21, **6,895**).
8. A skills collection (/better-*), then before/afters (07-15, 1,543; 07-28, **4,506**), a cheat sheet (08-16, 1,405; 09-17, 1,143) and a milestone at 160,000 installs (09-03, 3,918).
9. Cross-sell self-reply: "If you want to learn more about the topics covered by these skills, you can subscribe to Interfaces below."

**Interfaces magazine ($7.99/month, $79.99/year, $299 lifetime) [OBS]**

- **No visible public teaser.** It launched cold on 05-13 with a credits self-reply ("A huge thank you to @spoonyvu for the branding and @paulfaivret…").
- **Each issue:** "Introducing a new Interfaces issue: [Title]" with a one-line why, a video demo of the issue's interactive content and a self-reply link (500–900 likes).
- **Platform updates sold as craft:** "The Interfaces platform itself is an example of what you can learn in the magazine." (462); "One of my favorite features I've added to Interfaces recently is the ⌘K menu." (726)
- **Milestone and discount:** "Interfaces now has more than 1,200 subscribers… my goal was to reach at least 500… use the code INTERFACES50 to get 50% off… for the next 3 months. It's available to the first 100 people who use it." (380 likes)
- **Community:**
  - Guest issue: "4 Principles of Transition by @Jakubantalik".
  - Sponsoring indie projects: "sponsoring great projects in the space… is also a great way to give Interfaces visibility. What other projects should Interfaces sponsor?"
- **Engagement device:** a quiz issue, "Can you tell the difference?", with "you'll get a scorecard… I'm curious to see yours!"
- **Landing page:** "What makes an interface feel great?", a list of companies (Anthropic, Vercel, Stripe…), nine testimonials and three free issues.

---

## 5. Visual identity of the media

Based on video metadata and the thumbnails of the top 7 media posts per person [OBS].

**Jakub**

- Almost always **light mode**: a single component centered on a pure white or very light gray canvas with a lot of empty space.
- Clean macOS cursor or pointing hand visible, no window chrome and no captions burned in.
- **Comparison layout:** two or three variants side by side, labeled with small pill tags ("sRGB" / "oklch"). Or a "Before" pill toggle with pink dashed alignment guides drawn over the UI.
- Font: Inter-like sans with mono labels.
- Videos: median **11 s** (3–78 s), landscape about 16:10, recorded at 2–4K Retina, e.g. 2452×1532.
- Launch videos show the product page annotated like Figma, with measurement badges ("32 px", "font-libre-baskerville", "oklch(0.991 0 0)"). The content shows its own craft.

**Emil**

- **Component demos:** also light mode, centered on white. Example: a members list with a "Demo data / Worst case" segmented control and a hand cursor.
- **Skill demos:** a macOS **Claude Code terminal window** over the default blue macOS wallpaper, with the slash-command autocomplete open.
- **Diagram images:** dark ASCII/markdown "graphs" with a single blue accent, like `[ NESTED RADII ]`, and plain-text Markdown tables (Problem | Solution).
  - He said it himself: "Currently I'm really into markdown graphs with one vibrant accent color" (3,169).
- **Before/after cues are subtle:** "Toast at the bottom right shows whether it's before or after", "with a zoom on the problem, look at the left edge".
- Videos: median **16 s** (4–84 s). The Linear farewell montage is 67 s and the course trailer 84 s.

**Common to both [INF]**

- No faces, no voiceover implied, no music branding and no thumbnails with text overlays.
- The UI is the hero, on a neutral background. Each video shows a single idea.

---

## 6. Cadence

|  | Emil | Jakub |
| --- | --- | --- |
| Top-level posts [OBS] | Jul 19, Aug 25, Sep 13, Oct 13 (to the 22nd). About **4–6 a week**. | About 8–13 a month in 2026, **2–3 a week**. Up from about 1 a week in 2025. |
| Self-thread follow-ups | About 0.4 per post | About 0.6 per post, almost always a link |
| Replies to others (sample) | About 25 in 13 days, ~2 a day | About 21 in 21 days, ~1 a day |
| Time of day [OBS, UTC] | Spread from 09:00 to 21:00, peaking **11:00–14:00 UTC** (European midday) | Very tight: **15:00–17:00 UTC**, 70 of 130 posts (11:00–13:00 New York) |
| Weekday [OBS] | Mon–Fri, Tue highest. Weekend posts are rarer but some big ones landed on weekends (skills posts on Sat and Sun). | **Monday** (39 of 130), then Tue and Thu. Almost never Fri or Sat. |

[INF] Jakub runs a scheduled weekday slot aimed at the US morning. Emil posts when he has something, mostly during his European working day.

---

## 7. Voice

**Emil [OBS quotes, INF characterization]**

- **Conversational first person, plain words, and visible typos** ("milion", "reallly", "prreventing", "IIn a few years"). It reads human and unpolished.
- **Opinionated, but hedged and humble.** "I'm like 98% sure…", "I might sound old, but…", "I might just not be AI-pilled enough to understand the need for it yet, so I'm genuinely trying to understand it."
- **Calls himself a non-designer.** "most design engineers (including me) are just engineers that care about design". This builds trust.
- **Explains why, often with physics:** "it feels heavier".
- **Ends essays on an imperative:** "Invite friction to your work.", "Be allergic to the talkers.", "Don't give up!", "Make your text big if you want it to be read."
- **Light humor:** hand-coding competitions to "center a div". Self-aware bragging: "Yes, I had to brag about it".
- **Emoji are rare:** 😃 and 😁 in replies only.
- **Recurring themes:** craft and taste in the AI era, proof of work, judgement.

**Jakub**

- **Calm, instructional and declarative.** Short sentences, little opinion.
- **Typical openers:** "A couple of…", "Some of my favorite…", "I made…", "Introducing…", "It's incredible that…".
- **Teaches the mechanism:** "two identical copies of the heading stacked… One is blurred, the other isn't and they have opposite masks."
- **Credits the designer almost every time:** "Designed by @paulfaivret".
- **Emoji are rare** (🫶, 👀, ":)"), mostly in replies.
- **Gratitude and wonder** frame his milestones: "absolutely crazy to me", "beyond anything I expected".

---

## 8. Engagement tactics

**Emil [OBS]**

- **Answers questions under his own posts**, mostly from accounts with 28–500 followers. He invites follow-ups: "I'm curious, why is that?" He also states what he will improve: "Good suggestion, will update!", "I should write a guide for it."
- **Talks peer to peer with big accounts:** Karri Saarinen (94k), Ridd (77k), Julian Lehr, Josh tried coding (23k).
- **Credits his influences publicly:** "Inspired by @shadcn's improve skill", "mainly thanks to @mattpocockuk's tweets and wisdom", "Josh had a good take on it as well".
- **Praises colleagues with specifics** in quote posts: "Nice work, @yangit".
- **Reposts student testimonials and community-made things** (wherewillemilgo.site).
- **Recommends other people's libraries** in list posts (4,955 likes). It is generous and it gets shared.

**Jakub [OBS]**

- **Short, warm replies:** "Very cool, congrats on the launch!", "🫶", "Glad to be sponsoring, Cuelume is great!"
- **Uses replies as product research:** "That's a pretty cool idea! Gonna look into expanding the skill to add that."
- **Sponsors indie projects**, runs guest issues and asks the community: "What other projects should Interfaces sponsor?", "Let us know if you enjoy posts like these".

---

## 9. What clearly underperforms [OBS]

**Emil**

- **Self-reply link and CTA posts:** "Stay up to date with my skills here…" (26–65 likes). Course-detail replies such as price, curriculum or "Enrollment closes Friday" (11–40 likes).
  - [INF] This is fine: their job is to convert the readers who click through, not to get reach.
- **The course "enroll now" post** (990) sits below his median of about 1,800. The same goes for later enrollment openers versus his opinion posts.
- **Work showcases for his employer** (Linear Data Report graphs 562, the /now page 795, a Linear Agent toast fix 845), and quote posts praising colleagues (389).
- **Reposts of company announcements:** 95–1,005 likes, and none of the reach is his.

**Jakub**

- **Bare-link self-replies:** median about 15 likes. Mini-threads that list Interfaces features: 12–20 likes each.
- **Text-only opinions without a demo:**
  - "If you're not striving for greatness in the things you create, what's the point?" (154)
  - "Animating everything is tempting…" (202)
  - "Building eye candy components for social media and building an intuitive interface… are two very different things." (215)
- **Career announcements:** "Today is my last day at @opensea" (316), "first day as a founding design engineer at @interfere_" (333), hiring post (381).
  - Compare Emil's "This is my last week at Linear" (7,882), which came with a **portfolio montage**.
- **Employer marketing pages:** about 300–450 likes, unless the post teaches a technique.

[INF] The pattern for both: posts about what you can learn or install beat posts about me or my company. Personal news works only when it carries a story or a showcase.

---

## 10. Ten lessons for @AlexDmzz

1. **Name every deliverable like a command and put the install line in the post.**
   - "New component: Name" plus a three-line value statement plus `npx shadcn add @alexandrejoly/name`, or "New skill: /name" plus `npx skills add …`.
   - Both creators' biggest 2026 posts are just this format. It makes a post read like a product and lets it travel without context.
2. **Optimize for bookmarks, not likes.**
   - Their top posts have more bookmarks than likes: Jakub 11,092 bookmarks vs 6,895 likes; Emil 22,625 vs 13,049.
   - Reference formats get this: cheat-sheet tables, "favorite libraries" lists, rules with numbers.
   - Make a "shadcn details" or "registry gotchas" table image in Emil's Markdown style.
3. **Before/after is the best demo.**
   - Show the same component without and with your detail or skill, either side by side or with a "Before" pill toggle and guides.
   - Keep it 8–16 s, light mode, one component centered on white, Retina, cursor visible, no text overlay.
4. **Build a ladder like Jakub's.**
   - Blog post on alexandrejoly.me → the same knowledge as a registry component or skill → a tip from it → before/after → a milestone post → the paid or bigger thing.
   - Each step reuses the last one, and the original article becomes free lead content.
5. **Post install and star milestones as gratitude with an origin story.**
   - "It's incredible that X has been installed N times. I originally built it for myself… That's the kind I try to build."
   - This was Jakub's second-best post. Track real numbers (registry installs, GitHub stars) so you have them.
6. **One craft opinion a week, earned by shipped work.**
   - Emil's text posts beat his demos (median 1,912 vs 1,136).
   - Use the "rule stated as physics" form ("The bigger…, the slower…") or a hedged contrarian question about AI hype.
   - Jakub's bare opinions flop. Emil's land because his proof of work is famous, so anchor yours in your own components.
7. **Put links in a self-reply and keep the main post self-contained.**
   - Jakub does this almost every time. Emil keeps GitHub links in the main post for skills and still wins.
   - [INF] Use the reply for the site, newsletter or course, and the main post for a GitHub or install link.
8. **Run recurring series with fixed first lines.**
   - Examples: "New skill: /…", "One of my favorite details of Sonner:", "Introducing a new Interfaces issue:".
   - For you: "One detail in [component]:" or "Registry drop: …". Repetition trains the audience.
9. **Pick a time slot and keep it.**
   - Jakub posts 15:00–17:00 UTC on weekdays, Monday first. That is 16:00–18:00 in Paris in winter and 17:00–19:00 in summer, and it reaches the US morning and Europe together.
   - Ship launches on Monday or Tuesday.
10. **Reply like Emil, credit like Jakub.**
    - Answer every question under your posts with a concrete answer or "will update".
    - Credit @shadcn and your influences by handle when you build on their ideas. Both creators visibly credit shadcn, and shadcn amplifies.
    - Avoid long public teasing. Emil's lesson: ship, or presell with a deadline. A teaser for a waitlist should come at most a few weeks before launch.

Bonus [INF]:

- Keep the profile minimal and turn the bio into a funnel ("Design engineer · shadcn registry → alexandrejoly.me").
- Pin your best product post, not an intro.
- Emil's empty bio only works at 111k followers.

---

## 11. Five post templates from their best posts

**T1: New tool drop** (from Emil's "New skill: /apple-design" and Jakub's "/make-interfaces-feel-better")

```
New component: <Name>

<What it does in one sentence, user benefit first.>

<One line on the detail most people miss, e.g. "Interruptible, respects reduced motion, works with any shadcn theme.">

npx shadcn add @alexandrejoly/<name>
```

Attach an 8–15 s light-mode demo. Self-reply: the docs or demo link, plus "I'll share a few use cases later today."

**T2: Before/after detail** (from Jakub's "A couple of before / after examples…" and Emil's "Don't forget to stagger…")

```
Don't forget to <technique> when <situation>.

Here's the difference it makes:
```

Attach a side-by-side or toggled video with a "Before" pill. Optional second paragraph: the exact CSS or prop, in backticks.

**T3: Rule stated as physics** (from Emil's "The bigger an animated element is, the slower it should move.")

```
The <more X> an element is, the <more Y> it should <behave>.

Notice how <thing on the right> <does Z> compared to <thing on the left>. That's because <real-world reason>.

The same applies to <second dimension>.
```

**T4: Favorites list** (from Emil's "Some of my favorite UI libraries:", 8,280 bookmarks)

```
Some of my favorite <category>:

<Tool> for <job>.
<Tool> for <job>.
<Tool> for <job>.
...
<Your own thing> for <job>.
```

Self-reply: "And yes, I included my own because I like that one too 😃". That is Emil's exact move.

**T5: Milestone gratitude and origin** (from Jakub's "It's incredible that my skills have been installed more than 160,000 times.")

```
It's incredible that <project> has been <installed/starred> more than <N> times.

I originally built it for myself. <The concrete frustration that made you build it.>

<Honest line about the category, e.g. "Most registry components are copy-paste demos.">

That's the kind I try to build.
```

Attach a short montage of the project. Self-reply with the link.

---

## Raw data in the scratchpad

- `/private/tmp/claude-501/-Users-alexandrejoly-Documents-git-repositories-alexandrejoly-me/a6c2d9a7-5011-44e6-8e36-48c9d4f77da8/scratchpad/x-audit/raw/emil.tsv`
- `/private/tmp/claude-501/-Users-alexandrejoly-Documents-git-repositories-alexandrejoly-me/a6c2d9a7-5011-44e6-8e36-48c9d4f77da8/scratchpad/x-audit/raw/jakub.tsv`
  - Both TSVs: per-post date (UTC), type, likes, views, bookmarks, media, video seconds, resolution, text and URL. The summary stats are at the top.
- `/private/tmp/claude-501/-Users-alexandrejoly-Documents-git-repositories-alexandrejoly-me/a6c2d9a7-5011-44e6-8e36-48c9d4f77da8/scratchpad/x-audit/thumbs/`: thumbnails of the top media and both banners.
- `/private/tmp/claude-501/-Users-alexandrejoly-Documents-git-repositories-alexandrejoly-me/a6c2d9a7-5011-44e6-8e36-48c9d4f77da8/scratchpad/x-audit/00-x-api-emil.md`: the coordinator's API pull for Emil.
