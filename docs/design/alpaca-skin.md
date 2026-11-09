# Alpaca skin

- **Reference**: case study, https://acedesign.io/work/alpaca (Ace). 22 screens, light and dark.
- **Renders**: `.scratch/design-ref/alpaca/` (not tracked).
- **Visual authority**: `DESIGN.md`.
- **Before the skin**: commit `31620f1`.

## Scope

The design system and the shadcn primitives only. The page layout (one column), the score card (`src/components/holo-card/`) and the logo mark stay as they were. The reference's sidebar and app shell are out of scope by request. The wish behind the skin: Alpaca's card spirit, lists as stacked hairline cards in place of flat ruled rows.

No iso page: the reference's screens are an app shell humantaste does not have. The app's own home and report are the proof, since together they render every skinned primitive.

## Phase 1: capture

Colours are point samples and reduced-colour crops with `magick`; sizes are estimates on renders shown at about 2x.

| Sample | Light | Dark | Where |
| --- | --- | --- | --- |
| Page | `#FFFFFF` | `#1A1A1A` | 10, 20 |
| Card and composer fill | `#FFFFFF` | `#212121` | 10, 20 |
| Card hairline | `#E7E7E7` to `#EBEBEB` | `#282828` | 11, 10, 20 |
| Ink (titles) | `#242424` | `#DEDEDE` | 10, 20 |
| Prose | `#565656` | `#AFAFAF` | 10, 20 |
| Placeholder | `#A0A0A0` | `#A2A2A2` | 10, 20 |
| Icon grey | `#777777` | `#AAAAAA` | 10, 20 |
| Chip, tag, hover row | `#F5F5F5`, `#F6F6F6` | n/a | 10, 09, 13 |
| Dark button | `#333333` | `#252525` with `#C9C9C9` text | 02, 16 |
| Blue CTA | `#0092FF` | `#0092FF` | 02, 16 |
| Tooltip | `#313131` | n/a | 09 |
| "New" blue text | `#4A87E1` | `#1F75CC` on `#162559` | 10, 20 |
| "New" red text and wash | `#CB274C` on `#FEF1F2` | n/a | 13 |

Shapes: pill text buttons (02, 12), 16px-radius cards with a hairline and no shadow (10, 11), a soft lift on the composer and the icon buttons (10), 8px tooltips (09), stacked cards 8px apart (11).

## Phase 2: tokens

`src/styles/globals.css`, OKLCH from `scripts/oklch.mjs`.

| Variable | Light | Dark |
| --- | --- | --- |
| `--background` | `#FFFFFF` `oklch(1 0 0)` | `#101010` `oklch(0.173 0 0)` |
| `--foreground` | `#242424` `oklch(0.26 0 0)` | `#DEDEDE` `oklch(0.901 0 0)` |
| `--card`, `--popover` | `#FFFFFF` | `#171717` `oklch(0.205 0 0)` |
| `--primary` | `#333333` `oklch(0.321 0 0)` | `#DEDEDE` |
| `--primary-foreground` | `#FFFFFF` | `#101010` |
| `--secondary`, `--muted`, `--accent` | `#F5F5F5` `oklch(0.97 0 0)` | `#1E1E1E` `oklch(0.235 0 0)` |
| `--muted-foreground` | `#565656` `oklch(0.453 0 0)` | `#AFAFAF` `oklch(0.754 0 0)` |
| `--faint-foreground` | `#737373` `oklch(0.556 0 0)` | `#8C8C8C` `oklch(0.64 0 0)` |
| `--destructive` | `#CB274C` `oklch(0.552 0.197 14.8)` | `#F0708A` `oklch(0.704 0.159 9.4)` |
| `--border` | `#EBEBEB` `oklch(0.94 0 0)` | `#202020` `oklch(0.244 0 0)` |
| `--input` | `#8F8F8F` `oklch(0.65 0 0)` | `#6E6E6E` `oklch(0.538 0 0)` |
| `--ring` | `#0092FF` `oklch(0.654 0.191 251.2)` | same |
| `--meter-off` | `#EBEBEB` | `#2A2A2A` |
| `--radius` and ramp | `0.625rem`; `sm` 6px, `md` 8px, `lg` 10px, `xl` 16px, `2xl` 20px | same |

Deviations from the reference, each measured:

- **Dark page is `#101010`** by request, darker than the reference's `#1A1A1A`. Every dark step keeps its distance from the page in the reference: card +7, wash +14, hairline +16, meter-off +26. Measured on `#101010`: prose 8.7:1, faint 5.7:1, field edge 3.7:1.
- **Dark `--primary`** inverts to `#DEDEDE` on `#101010` (14.1:1). The reference's dark button (`#252525`) is a quiet fill beside its blue CTA, and humantaste needs one primary that reads as one.
- **Blue is the ring only.** White on `#0092FF` is 3.2:1, below 4.5:1 for a 14px label.
- **`--faint-foreground` is `#737373`** (4.7:1 on white). The reference's placeholder grey `#A0A0A0` is 2.6:1, and humantaste sets evidence and the footer in this token.
- **`--input` is `#8F8F8F`** (3.2:1) where the reference uses the hairline, so the field's edge meets WCAG 1.4.11.
- **Dark `--destructive`** has no sample. It is the light red lifted to 6.7:1 on `#101010`.
- **Font**: the reference sets Inter. humantaste keeps system UI, because a page set in Inter alone is one of the patterns it scores down.
- **Placeholder neutrals**: none. Chart and sidebar slots are not declared, since nothing uses them.

## Phase 3: primitives

Installed: `item` (with its `separator` dependency) for the row cards. `card` came with it and was removed unused.

Skinned, inside `src/components/ui/` only:

| Primitive | Change | DESIGN.md rule |
| --- | --- | --- |
| `button` outline | `bg-card shadow-xs`, dark overrides removed (tokens carry the mode) | Shape and depth: soft lift |
| `button` | pill on every size (from the previous skin) | Shape and depth: pills |
| `input` | `bg-card shadow-xs`, dark tint removed | Shape and depth: soft lift |
| `accordion` | root `gap-2`; item `rounded-xl border bg-card px-4` in place of `not-last:border-b`; trigger `py-3.5`, `text-foreground`, no hover underline; panel `pb-4` | Components: accordion card |
| `item` | `rounded-xl`; outline `bg-card`; default size `px-4 py-3`; title `text-foreground`; `itemVariants` exported | Components: row card |
| `tooltip` | unchanged: ink on paper, 8px radius already | Shape and depth: tooltips |

Variant substance: no variant was added. Every change is a base string or an existing variant's string.

Consumers: `src/components/report.tsx` drops the `border-y` wrappers around both accordions. `src/components/recent-scans.tsx` renders each scan as `Item variant="outline"` rendered as the router `Link`, inside a `ul`/`li` list (the stock `ItemGroup` is a `div` with `role="list"` whose items carry no `listitem` role).

Seam tests: `test/primitives.test.ts` (outline button on `bg-card` with `shadow-xs` and no dark input tint, pill buttons, outline item as a 16px row card).

Lint: the stock `item.tsx` `ItemGroup` (`role="list"` on a `div`) is exempted in `oxlint.config.ts`, as in alexandrejoly.me.

## Screenshots

`.scratch/design-check/alpaca/`: `home-light.png`, `home-dark.png`, `scan-light.png`, `scan-dark.png` (1440 wide, first pattern open). No horizontal overflow at 320px, no console errors.

## Revision: filled surfaces, no borders

By request, cards, outline buttons and the field lose their borders and stand out by fill. The surface steps one grey lighter so it still reads against the page.

| Variable | Light | Dark |
| --- | --- | --- |
| `--card`, `--popover` | `#F5F5F5` `oklch(0.97 0 0)` | `#1E1E1E` `oklch(0.235 0 0)` |
| `--secondary`, `--muted`, `--accent` | `#EBEBEB` `oklch(0.94 0 0)` | `#262626` `oklch(0.269 0 0)` |
| `--faint-foreground` | `#6B6B6B` `oklch(0.528 0 0)` (`#737373` measured 4.35:1 on the new card) | unchanged |
| `--meter-off` | `#D6D6D6` `oklch(0.876 0 0)` | `#333333` `oklch(0.321 0 0)` |

Primitives: `button` outline drops `border-border`; `input` drops `border-input` for `border-transparent`; `item` outline is `border-transparent bg-card`; `accordion` item drops `border`. The transparent border stays so the focus ring, `aria-invalid` and forced-colors mode keep an edge.

Accepted trade-off: the field's fill measures 1.09:1 against the page (WCAG 1.4.11 asks 3:1 of a field's boundary). The placeholder, the `Score it` button inside it and the focus ring identify it.

## Revision: the URL field is an input group

The form is `InputGroup` > `InputGroupInput` + `InputGroupAddon align="inline-end"` > `InputGroupButton type="submit" variant="default" size="sm"`, the docs' button-in-input pattern. `input-group` was installed without overwriting the skinned `button` and `input`; `textarea` came with it as a dependency.

Skin, `src/components/ui/input-group.tsx`: the group is `h-10 rounded-full border-transparent bg-card shadow-xs` (it was `h-8 rounded-lg border-input` with a dark input tint), and the `sm` button size is `px-3.5` so `Score it` keeps the pill's side padding. Lint: the stock `role="group"` divs and the addon's focus-on-click are exempted in `oxlint.config.ts`.

## Revision: a darker dark ramp

The dark page moves to `#0A0A0A` by request. Surfaces keep the separation they measured on `#101010`, so they are set by contrast and not by a fixed step. Replaces the dark column of the tables above.

| Variable | Dark |
| --- | --- |
| `--background`, `--primary-foreground` | `#0A0A0A` `oklch(0.145 0 0)` |
| `--card`, `--popover`, `--secondary` | `#1A1A1A` `oklch(0.219 0 0)`, 1.14:1 on the page |
| `--muted`, `--accent` | `#232323` `oklch(0.256 0 0)`, 1.11:1 on the card |
| `--muted-foreground` | `#A1A1A1` `oklch(0.71 0 0)` |
| `--faint-foreground` | `#868686` `oklch(0.62 0 0)`, 4.77:1 on the card |
| `--border` | `#1D1D1D` `oklch(0.229 0 0)` |
| `--input` | `#636363` `oklch(0.5 0 0)` |
| `--meter-off` | `#303030` `oklch(0.31 0 0)`, 1.32:1 on the card |

`--underline` is new, `#C4C4C4` light and `#4D4D4D` dark. Link underlines borrowed `--border` and measured 1.13:1 on the dark page.

`tooltip` is removed with its provider: its one consumer, the copy buttons, now answers with the icon.

Filled buttons without a border are `secondary`, not `outline`: the GitHub button, the copy buttons, the current page and the dialog actions move over. `--secondary` takes the card's value (`#F5F5F5`, `#1A1A1A`) and `outline` goes back to a real outline, used nowhere for now. The field and these buttons drop `shadow-xs`, so they match the row cards exactly.

## Revision: two text levels

`--faint-foreground` is removed: text is `foreground` or `muted-foreground`, as in shadcn. Evidence, the How it works footer and the placeholder move to `muted-foreground`. The input's value is set to `foreground`, because shadcn leaves it to inherit and the body here is `muted-foreground`.
