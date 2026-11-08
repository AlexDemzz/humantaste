---
source:
  reference: "case study: https://acedesign.io/work/alpaca"
  renders: .scratch/design-ref/alpaca/
  sampled: colours (magick point samples and reduced-colour crops of 10, 02, 09, 11, 13, 16, 20)
  estimated: sizes, radii (measured on renders shown at about 2x)
  modes: light, dark
colors:
  paper: "#FFFFFF"
  paper-dark: "#101010"
  surface: "#F5F5F5"
  surface-dark: "#1E1E1E"
  ink: "#242424"
  ink-dark: "#DEDEDE"
  button: "#333333"
  button-dark: "#DEDEDE"
  wash: "#EBEBEB"
  wash-dark: "#262626"
  prose: "#565656"
  prose-dark: "#AFAFAF"
  faint: "#6B6B6B"
  faint-dark: "#8C8C8C"
  hairline: "#EBEBEB"
  hairline-dark: "#202020"
  field: "#8F8F8F"
  field-dark: "#6E6E6E"
  signal-blue: "#0092FF"
  alert-red: "#CB274C"
  alert-red-dark: "#F0708A"
  meter-off: "#D6D6D6"
  meter-off-dark: "#333333"
  card-ink: "#191715"
  foil-gold: "#FFCF77"
  foil-pink: "#F4A5EC"
  foil-blue: "#A0BAFF"
  foil-cyan: "#76E2E7"
  foil-green: "#ADEB9F"
typography:
  body: { family: system-ui, size: 16px, weight: 400, line-height: 1.625 }
  statement: { family: system-ui, size: 20px, weight: 400, line-height: 1.4 }
  section-title: { family: system-ui, size: 16px, weight: 600, line-height: 1.625 }
  row: { family: system-ui, size: 14px, weight: 500, line-height: 20px }
  control: { family: system-ui, size: 14px, weight: 500, line-height: 20px }
  dense: { family: system-ui, size: 14px, weight: 400, line-height: 1.625 }
  evidence: { family: ui-monospace, size: 12px, weight: 400, line-height: 1.625 }
  wordmark: { family: Poppins, size: 24px, weight: "550 (500 stroked 0.013em)", tracking: -0.05em, outlined: true }
  score: { family: Kanit, size: "250 card units", weight: 900, line-height: 1, tracking: -0.05em }
rounded: { control: 9999px, tooltip: 8px, row-card: 16px, block: 16px, card: "36 card units" }
spacing: { column: 688px, gutter: 24px, page-top: 24px, page-bottom: 64px, section-gap: 64px, title-gap: 16px, card-gap: 8px, card-x: 16px, control: 40px, row-y: 12px }
components:
  button-primary: { fill: "{colors.button}", text: "{colors.paper}", radius: "{rounded.control}", height: 40px }
  button-outline: { fill: "{colors.surface}", border: none, text: "{colors.ink}", hover: "{colors.wash}", radius: "{rounded.control}", shadow: xs }
  input: { fill: "{colors.surface}", border: none, text: "{colors.ink}", placeholder: "{colors.faint}", radius: "{rounded.control}", height: 40px, shadow: xs }
  tooltip: { fill: "{colors.ink}", text: "{colors.paper}", radius: "{rounded.tooltip}" }
  row-card: { fill: "{colors.surface}", border: none, radius: "{rounded.row-card}", gap: 8px, hover: "{colors.wash}" }
  accordion-item: { fill: "{colors.surface}", border: none, radius: "{rounded.row-card}", padding-x: 16px }
  tabs: { fill: "{colors.surface}", indicator: "{colors.wash}", radius: "{rounded.control}", height: 40px, shadow: xs }
  focus-ring: { colour: "{colors.signal-blue}", width: 3px, opacity: 50% }
  meter: { on: "{colors.ink}", off: "{colors.meter-off}", ticks: 20 }
  logo-mark: { fill: currentColor, size: 0.64em, gap: 0.14em, position: before the word, on the baseline }
  score-card: { fill: "{colors.card-ink}", radius: "{rounded.card}" }
shadcnMapping:
  "--background": ["#FFFFFF", "#101010"]
  "--foreground": ["#242424", "#DEDEDE"]
  "--card": ["#F5F5F5", "#1E1E1E"]
  "--card-foreground": ["#242424", "#DEDEDE"]
  "--popover": ["#F5F5F5", "#1E1E1E"]
  "--popover-foreground": ["#242424", "#DEDEDE"]
  "--primary": ["#333333", "#DEDEDE"]
  "--primary-foreground": ["#FFFFFF", "#101010"]
  "--secondary": ["#EBEBEB", "#262626"]
  "--secondary-foreground": ["#242424", "#DEDEDE"]
  "--muted": ["#EBEBEB", "#262626"]
  "--muted-foreground": ["#565656", "#AFAFAF"]
  "--faint-foreground": ["#6B6B6B", "#8C8C8C"]
  "--accent": ["#EBEBEB", "#262626"]
  "--accent-foreground": ["#242424", "#DEDEDE"]
  "--destructive": ["#CB274C", "#F0708A"]
  "--border": ["#EBEBEB", "#202020"]
  "--input": ["#8F8F8F", "#6E6E6E"]
  "--ring": ["#0092FF", "#0092FF"]
  "--meter-off": ["#D6D6D6", "#333333"]
  "--radius": "0.625rem"
---

# DESIGN — humantaste

humantaste scores how much of a website a person chose. The interface wears the Alpaca system (Ace's case study): pure greys on white, pill controls, and lists made of stacked cards. Surfaces stand out by their fill, never by a border. The score card, the logo and the one-column layout are humantaste's own and sit outside the skin. `src/styles/globals.css` holds the values; this file says what each one is for. The capture ledger is `docs/design/alpaca-skin.md`.

## Overview

One reading column on white. The logo and the GitHub button, a one-sentence statement, the URL field, then sections whose titles sit above stacks of row cards. On a report, the score card fills the column and is the only thing in colour; everything else is ink, grey prose, filled grey cards and one blue reserved for focus. Alpaca's sidebar and app chrome are not part of the skin.

## Colour

- Neutrals are pure greys with no tint, as in the reference: white paper, `#242424` ink, `#565656` prose. Surfaces (`card`: cards, outline buttons, the field) are one step off the page, `#F5F5F5`; `muted` is one step further, `#EBEBEB`, for hover fills and blocks inside a card.
- The reference's dark button `#333333` is `--primary`. In dark mode the primary inverts to `#DEDEDE` on `#101010`: the reference's dark `#252525` button is a quiet fill beside its blue CTA, and humantaste has one primary per view that must read as one.
- The reference's blue `#0092FF` is the focus ring only. White text on it measures 3.2:1, below 4.5:1 for 14px labels, so no button takes it as a fill.
- `faint-foreground` (`#6B6B6B`, 4.9:1 on the `#F5F5F5` card, 5.3:1 on white) carries evidence, the How it works footer and the placeholder. The reference's placeholder grey `#A0A0A0` measures 2.6:1 and is not used for text.
- Nothing has a border. The URL field is a filled pill at 1.09:1 against the page, below the 3:1 WCAG 1.4.11 asks of a field's edge; this is a deliberate choice, and the placeholder, the `Score it` button inside it and the focus ring identify it. `input` stays declared for the disabled and invalid states.
- `destructive` is the reference's alert red `#CB274C`; its dark value has no reference sample and is the light red lifted to 6.7:1 on `#101010`.
- The foil ink (`foil-*`) belongs to the score card alone. The logo is one ink: the text colour, or `muted-foreground` on the card.
- Dark mode follows `prefers-color-scheme`, with no toggle. Its page is `#101010`, darker than the reference's `#1A1A1A`; surfaces step up from it in 7-point grey steps: card `#1E1E1E`, wash `#262626`. The score card stays dark in both modes.

## Typography

- System UI stack for everything people read. The reference sets Inter; humantaste keeps the system face because a page set in Inter alone is one of the patterns it scores down.
- Kanit Black Italic is the display face, kept to one job: the score on the card.
- The wordmark is Poppins Medium, outlined in `src/lib/logo.ts`, so the site loads no Poppins.
- 16px is the reading size; the home statement steps up to 20px. Controls, row cards, metadata and the footer are 14px; evidence is 12px monospace.
- Weight carries hierarchy within a size: 600 for section titles and accordion titles, 500 for row titles and controls, 400 for prose. Counts, points, scores and seconds use `tabular-nums`.

## Shape and depth

- Controls are pills, as in the reference: buttons, icon buttons and the URL field (`rounded-full`).
- No borders on cards, buttons or the field: a surface stands out by its fill alone. Row cards are 16px-radius `card` fills with no shadow, stacked 8px apart. Accordion items and list rows are row cards. Borders stay transparent so the focus ring, the invalid state and forced-colors mode still draw an edge.
- Outline buttons and the field are `card` fills with `shadow-xs`, the soft lift the reference gives its icon buttons and composer.
- Tooltips are ink on paper, 8px radius.
- Code-like blocks (the prompt) are `CodeBlock`s: 16px-radius blocks on `muted`, no header or file label, wrapped lines, folded to 256px under a fade with a `Show more` button below so the page scrolls and not the block, a copy button at the top-right corner that shows on hover or focus. The screenshot gets a 1px pure black or white outline at 10%.
- Icons are Phosphor, regular weight, 16px inside controls.

## Layout

- **Column**: `max-w-column` (688px, a 640px measure inside the 24px gutters), 24px from the top, 64px at the bottom. Sections sit 64px apart; a section's title sits 16px above its content.
- **Header**: the logo at the leading edge, an outline GitHub button at the trailing edge.
- **Home**: the statement and the form, then Recently scored as a stack of row cards.
- **Report**: the score card (the column's full width), then the share row and the scan line, then the patterns as accordion cards, then Behind the score as tabs, then five skills worth installing as link row cards (external links, an arrow at the trailing edge), then Score another site.
- **Footer**: How it works, the methodology in two short paragraphs.
- No sidebar, no app chrome: the reference's shell is out of scope.

## Components

- **Card** (`Card`): a `card` fill with no border or ring; only the loading state uses it.
- **Row card** (`Item variant="outline"`): host, a 20-tick meter and the score in one line; the whole card is the link and fills with `muted` on hover.
- **Accordion card** (`AccordionItem`): closed, the title and its value (points) on one 48px line; open, the content inside the same card, 16px side padding.
- **Tabs** (`Tabs`): a 40px `card` pill with `shadow-xs` holding 32px pill tabs; the active tab sits on a `muted` indicator that slides to it (200ms `ease-out`). The panel has no surface of its own: its content sits on the page, 16px under the pill. The score steps inside are row cards built like the pattern rows: the step in ink at 600, its value in prose grey on the trailing edge, the same 48px line. Behind the score uses them, so the report's details read as one section and not as more pattern cards.
- **Share row**: one primary button, `Copy prompt for your agent`, then two outline icon buttons, `Copy share link` and `Copy image`, each with a tooltip; after a copy the icon turns to a check and the tooltip says what was copied.
- **URL field** (`InputGroup`): one 40px filled pill; the input on the left and the dark `Score it` pill inside it on the right (`InputGroupAddon align="inline-end"`, `InputGroupButton variant="default" size="sm"`, 32px tall, 4px inset). An invalid URL rings the whole pill in `destructive`.
- **Meter**: 20 ticks, 2px wide, `foreground` up to the score and `meter-off` after.
- **Logo** (`Logo`, geometry in `src/lib/logo.ts`): a minimal paint palette (a disc with a filleted thumb bite and a hole at its centre of mass) before the word, in one ink. It sizes off the font size: `text-2xl` in the header. On the score card it sits at the bottom right in `muted-foreground` and fills the card back; the favicon is the mark alone.
- **Score card tiers**: the score picks the inks. Matte (0–44): flat ink, no foil. Chrome (45–74): silver ink over a brushed pattern, under the type and revealed by the light. Holo (75–99): foil ink. Prismatic (100): foil ink over a gold shadow, a thick gold frame, glitter under the type and a foil wash that flares in. The share image draws each tier at rest. The thresholds live in `tierFor` (`src/lib/score.ts`).
- **Score card front**: the score at the top left and the QR code at the top right; the free height between; at the foot, the site, the verdict, the meter, then Jev's read on the left and the logo on the right. The share image (`og.server.tsx`) draws the same layout.

## States

- Focus: a 3px blue ring at 50% (`ring`) on every control, links and cards included.
- Hover only where a pointer can hover: row cards and outline buttons step from `card` to `muted`, link underlines darken. Accordion triggers don't underline.
- Copied: the icon cross-fades to a check (scale 0.25 → 1, 4px blur, 300ms `ease-swap`), the tooltip opens with the result, and an `<output>` announces it.
- Loading: no score card yet. A `Card` the score card's size holds the Scan spinner (40px) above one 20px line, 16px on a phone, that rolls through what the scan checks every 1.7s; the lines run on a clock, not on progress. The current line wears the `shimmer` utility, the one moving gradient allowed outside the score card. When the score is ready the content fades (180ms) and the score card lands on the `Card`, ready to peel.
- Fresh score: a scan that just ran (not one read from the store) lands under a plastic cover printed like the back. The plastic runs past the bottom-right corner into a clear tab, its ink thinning out onto it, and the cover reads "Pull to see the score" beside it, the way packaging says how it opens. A hand shows the pull up to three times once the card is on screen; hovering the tab lifts it a little. Dragging lifts the corner toward the viewer, then folds it back over the cover, its underside bare foil. The cover only shines while it turns: flat and still, it shows its print and no glare. Once a tenth of the cover is off, the reader can swing the tip down or to the right and the peel front pivots after it. At nine tenths the rest lets go and the cover flies off and the front lights up, as it does from a tap on the tab or the keyboard; let go any earlier, however fast, and the cover stays exactly where it was left, so it can be peeled in several pulls, picked up again by the tab or anywhere on its bare back; only a corner that lifted without folding over drops back. Once the reader touches the tab, the cover makes sound: the adhesive crackles as fast as it peels, the tab ticks as it lifts, the corner slaps back when it lands and the sheet flutters off on release; the hint stays silent. Reduced motion skips the cover.
- Motion access: on iOS, where the browser needs a tap before it can read the gyroscope, a reader who hasn't decided gets a `Dialog` as the card arrives (`popover` fill, 16px radius, no border or blur, a 40% black scrim). An `IconStack` above the title and text says what the motion does and that the browser asks next; `Turn on motion` raises the browser's prompt, `Skip for now` holds off for the session. Reduced motion, and browsers with no prompt, never see it.
- Errors: one sentence in `destructive` that says what to do next.

## Do / Don't

- Do lay out primitives; the look lives in the theme and the primitives. A className on a primitive carries layout only.
- Do turn a list into stacked filled row cards, never into ruled flat rows.
- Don't put a border on a card, a button or the field; step the fill instead.
- Do keep the foil for the score card, and blue for focus.
- Don't add gradients, glows, blur, emoji, pills above headings or tracked uppercase labels. humantaste scores sites down for each of these.
- Don't bring in the reference's sidebar, its Inter face or its blue fills.
