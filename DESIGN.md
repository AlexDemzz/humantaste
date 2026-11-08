---
source:
  reference: the Column direction of the layout prototypes, chosen 2026-11-08
  renders: none, the app is the reference
  sampled: none, every colour is a token computed from its oklch value in src/styles/globals.css
  estimated: none
  modes: light, dark
colors:
  paper: "#FBFAF9"
  paper-dark: "#110F0E"
  ink: "#1C1A18"
  ink-dark: "#F0EEEC"
  surface: "#FEFDFC"
  surface-dark: "#191715"
  wash: "#F1F0EE"
  wash-dark: "#1C1A18"
  prose: "#66625E"
  prose-dark: "#A19E9A"
  faint: "#716E6B"
  faint-dark: "#83807C"
  rule: "#E3E1DE"
  rule-dark: "#2A2826"
  field: "#8F8C88"
  field-dark: "#6B6865"
  meter-off: "#DCDAD8"
  meter-off-dark: "#343230"
  danger: "#B63325"
  danger-dark: "#EF806F"
  card-ink: "#191715"
  foil-gold: "#FFCF77"
  foil-pink: "#F4A5EC"
  foil-blue: "#A0BAFF"
  foil-cyan: "#76E2E7"
  foil-green: "#ADEB9F"
typography:
  body: { family: system-ui, size: 16px, weight: 400, line-height: 1.625 }
  statement: { family: system-ui, size: 20px, weight: 400, line-height: 1.4 }
  section-title: { family: system-ui, size: 16px, weight: 500, line-height: 1.625 }
  row: { family: system-ui, size: 14px, weight: 500, line-height: 20px }
  control: { family: system-ui, size: 14px, weight: 500, line-height: 20px }
  dense: { family: system-ui, size: 14px, weight: 400, line-height: 1.625 }
  evidence: { family: ui-monospace, size: 12px, weight: 400, line-height: 1.625 }
  wordmark: { family: Kanit, size: 20px, weight: 900, line-height: 1, tracking: -0.025em }
  score: { family: Kanit, size: "250 card units", weight: 900, line-height: 1, tracking: -0.05em }
rounded: { control: 9999px, mark: 8px, tooltip: 6px, block: 14px, card: "36 card units" }
spacing: { column: 688px, gutter: 24px, page-top: 24px, page-bottom: 64px, section-gap: 64px, title-gap: 16px, control: 40px, row-y: 10px }
components:
  button-primary: { fill: "{colors.ink}", text: "{colors.paper}", radius: "{rounded.control}", height: 40px }
  button-icon: { fill: "{colors.paper}", border: "{colors.rule}", text: "{colors.ink}", radius: "{rounded.control}", size: 40px }
  input: { border: "{colors.field}", text: "{colors.ink}", placeholder: "{colors.faint}", radius: "{rounded.control}", height: 40px }
  tooltip: { fill: "{colors.ink}", text: "{colors.paper}", radius: "{rounded.tooltip}" }
  accordion-row: { text: "{colors.ink}", value: "{colors.prose}", rule: "{colors.rule}" }
  meter: { on: "{colors.ink}", off: "{colors.meter-off}", ticks: 20 }
  logo-mark: { fill: "{colors.card-ink}", letter: "{colors.ink-dark}", radius: "{rounded.mark}", size: 28px }
  score-card: { fill: "{colors.card-ink}", radius: "{rounded.card}" }
shadcnMapping:
  "--background": ["#FBFAF9", "#110F0E"]
  "--foreground": ["#1C1A18", "#F0EEEC"]
  "--card": ["#FEFDFC", "#191715"]
  "--card-foreground": ["#1C1A18", "#F0EEEC"]
  "--popover": ["#FEFDFC", "#191715"]
  "--popover-foreground": ["#1C1A18", "#F0EEEC"]
  "--primary": ["#1C1A18", "#F0EEEC"]
  "--primary-foreground": ["#FBFAF9", "#110F0E"]
  "--secondary": ["#F1F0EE", "#1C1A18"]
  "--secondary-foreground": ["#1C1A18", "#F0EEEC"]
  "--muted": ["#F1F0EE", "#1C1A18"]
  "--muted-foreground": ["#66625E", "#A19E9A"]
  "--faint-foreground": ["#716E6B", "#83807C"]
  "--accent": ["#F1F0EE", "#1C1A18"]
  "--accent-foreground": ["#1C1A18", "#F0EEEC"]
  "--destructive": ["#B63325", "#EF806F"]
  "--border": ["#E3E1DE", "#2A2826"]
  "--input": ["#8F8C88", "#6B6865"]
  "--ring": ["#66625E", "#A19E9A"]
  "--meter-off": ["#DCDAD8", "#343230"]
  "--radius": "0.5rem"
---

# DESIGN — humantaste

humantaste scores how much of a website a person chose. The site has to pass its own test: every choice below is deliberate, and nothing here is a generator default. `src/styles/globals.css` holds the values; this file says what each one is for.

## Overview

One reading column on warm paper. The logo, a one-sentence statement, the URL field, then sections whose titles sit above ruled rows. On a report, the score card fills the column and is the only thing in colour: everything else is ink, prose grey and hairlines. The card is the product, the page is the paperwork behind it.

## Colour

- Neutrals carry hue 70 at chroma ≤ 0.008, too low to read as a colour, so the paper is warm without looking beige. `destructive` is the only saturated token, kept for errors.
- The foil ink (`foil-*`) belongs to the score card and the logo mark alone. It never tints a page surface, a button or text.
- Prose is `muted-foreground` by default. Titles, links and values switch to `foreground` to stand out.
- `faint-foreground` is for the quietest text that is still read: the evidence inside a pattern, the How it works footer, the placeholder. It holds 4.5:1 on the page in both modes.
- `border` draws hairlines (rows, accordion rules, outline buttons). `input` is the field's edge and holds 3:1 on the page, so the URL field reads as a field.
- `meter-off` is the unlit tick of a meter.
- Dark mode follows `prefers-color-scheme`, with no toggle. The score card stays dark in both modes.

## Typography

- System UI stack for everything people read. No webfont for text, no Inter, no Geist.
- Kanit Black Italic is the display face, kept to two jobs: the score on the card and the wordmark. It never sets a heading or a sentence.
- 16px is the reading size. The home statement steps up to 20px. Controls, accordion rows, metadata and the footer step down to 14px; evidence is 12px monospace.
- Weight carries hierarchy within a size: 500 for section titles and controls, 400 for prose. Counts, points, scores and elapsed seconds use `tabular-nums`.
- Typographic punctuation in copy: curly apostrophes, ×, ÷, the ellipsis character.

## Shape and depth

- Controls are pills: buttons, icon buttons and the URL field (`rounded-full`, set in the Button and Input primitives).
- Surfaces sit flat on the page. The one exception is the score card, which has its own depth, light and tilt (`src/components/holo-card/`).
- Code-like blocks (the prompt, the screenshot) are 14px-radius blocks on `muted`. The screenshot gets a 1px pure black or white outline at 10%.
- Icons are Phosphor, regular weight, 16px inside controls.

## Layout

- **Column**: `max-w-column` (688px, a 640px measure inside the 24px gutters), 24px from the top, 64px at the bottom. Sections sit 64px apart; a section's title sits 16px above its content.
- **Header**: the logo at the leading edge, an outline GitHub button (GitHub mark, opens the repository in a new tab) at the trailing edge, both on one line.
- **Home**: the statement and the form, then Recently scored.
- **Report**: the score card (the column's full width), then directly under it the share row and the scan line, then What gave it away, then the details accordion, then Score another site.
- **Footer**: How it works, the methodology in two short paragraphs.

## Components

- **Share row**: one primary button, `Copy prompt for your agent`, then two outline icon buttons, `Copy share link` and `Copy image`. Each icon button has a tooltip saying what it is for; after a copy its icon turns to a check and the tooltip says what was copied. The primary button keeps its width when its label changes.
- **Pattern rows**: one accordion item per pattern found, heaviest first. Closed, a row shows the title and its points; open, the evidence (monospace, faint) and the why with its fix.
- **Details accordion**: How we got to N (the score in plain steps), the prompt for your agent, N patterns not found, the screenshot we scored.
- **Recently scored**: rows of host, a 20-tick meter and the score. The whole row is the link.
- **Meter**: 20 ticks, 2px wide, `foreground` up to the score and `meter-off` after.
- **Logo**: the mark (the card in miniature: a dark rounded square, an italic h, five foil ticks) beside the wordmark.

## States

- Focus: the primitives' ring (`ring`, 3px at 50%) on every control, links included.
- Hover only where a pointer can hover (`can-hover:`): link underlines darken from `border` to `muted-foreground`, outline buttons fill with `muted`.
- Copied: the icon cross-fades to a check (scale 0.25 → 1, 4px blur, 300ms `ease-swap`), the tooltip opens with the result, and an `<output>` announces it. Under reduced motion the icon swaps without moving.
- Loading: the card shows its back and sways; a line under it counts the seconds.
- Errors: one sentence in `destructive` that says what to do next.

## Do / Don't

- Do let pages lay out primitives; the look lives in the theme and in the primitives. A className on a primitive carries layout only.
- Do keep the foil for the card and the mark.
- Don't add gradients, glows, blur, emoji, pills above headings or tracked uppercase labels. humantaste scores sites down for each of these.
- Don't centre the column's content, and don't let anything break out of the column.
- Don't add a second display face or use Kanit for anything but the score and the wordmark.
