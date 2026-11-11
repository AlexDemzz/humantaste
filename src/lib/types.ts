export interface CssVar {
  name: string;
  value: string;
}

export interface StaticFacts {
  /** Every custom property declaration found in linked and inline CSS. */
  cssVars: CssVar[];
  /** Families named in @font-face rules and font-family declarations, lowercased. */
  declaredFamilies: string[];
  /** Visible text of the body (scripts and styles removed), whitespace collapsed. */
  text: string;
  /** Visible text without code samples (pre, code, kbd, samp, textarea), so documentation doesn't read as leftovers. */
  prose: string;
  lang: string;
  h1: string;
  /** Text of list items and small headings, used to spot emoji bullets. */
  bulletTexts: string[];
  /** Labels of list items that open with a bold “Label:” lead-in. */
  labelledItems: string[];
  classTokens: string[];
  /** What the page says about itself in <head>: the tab, the description and the share tags. */
  head: HeadFacts;
  /** Raw CSS joined, lowercased, used for a few literal checks. */
  cssLower: string;
  htmlLower: string;
}

export interface HeadFacts {
  title: string;
  description: string;
  author: string;
  twitterSite: string;
  ogImage: string;
  /** href of every link rel="icon". */
  icons: string[];
}

export interface RenderedFont {
  family: string;
  glyphs: number;
  /** Loaded with @font-face rather than installed on the machine. */
  webfont: boolean;
}

export interface RenderedGradient {
  css: string;
  tag: string;
  area: number;
  isText: boolean;
  top: number;
  size: string;
}

export interface RenderedFacts {
  lang: string;
  /** Faces that painted body text, by glyph count. */
  fonts: RenderedFont[];
  /** Faces that painted the h1 and h2s. */
  headingFonts: RenderedFont[];
  pageBackground: string;
  h1: {
    text: string;
    color: string;
    fontStyle: string;
    centered: boolean;
  } | null;
  gradients: RenderedGradient[];
  backdropBlur: {
    tag: string;
    px: number;
    width: number;
    navBar: boolean;
    bgAlpha: number;
  }[];
  shadows: { css: string; count: number; example: string }[];
  orbs: { tag: string; blur: number; size: string; background: string }[];
  patterns: { tag: string; size: string; css: string }[];
  stripes: { tag: string; color: string; width: number; radius: number }[];
  trackedLabels: string[];
  buttonFills: { css: string; count: number }[];
  hiddenAtRest: { count: number; examples: string[] };
  headlineAccent: {
    word: string;
    colour: string | null;
    italic: boolean;
    font: string | null;
    gradient: boolean;
  } | null;
  /** First family named in the computed font-family of the headline and of body text. */
  faceNames: { heading: string; body: string };
  centered: { total: number; centered: number };
  cardGrids: { radius: number; shadow: boolean; example: string }[];
  iconTiles: { count: number; lucide: number; example: string };
  pill: { text: string; href: string | null } | null;
  statBanner: string[] | null;
  numbered: string[] | null;
  emojiIcons: string[];
  sparkles: number;
  lucideLogo: boolean;
  /** A square of CSS gradient at the start of the header, where the logo goes. */
  logoTile: { css: string; size: number; sparkle: boolean } | null;
  /** Dot-sized elements looping Tailwind's pulse or ping animation. */
  pulsingDots: { count: number; example: string };
  viewport: { width: number; height: number };
}

export interface Facts {
  url: string;
  static: StaticFacts;
  rendered: RenderedFacts | null;
}

export type SignalSource = "static" | "rendered";

export interface SignalHit {
  /** 0..1, how strongly the signal fired. */
  strength: number;
  evidence: string;
  source: SignalSource;
}

export type Category =
  | "type"
  | "colour"
  | "layout"
  | "effects"
  | "icons"
  | "copy"
  | "motion"
  | "fingerprint";

export interface SignalResult {
  id: string;
  category: Category;
  title: string;
  weight: number;
  fix: string;
  why: string;
  hit: SignalHit | null;
  points: number;
  /** False when the signal needs the rendered page and rendering failed. */
  checked: boolean;
}

/** Evidence that someone made a deliberate choice; it gives points back. */
export interface Credit {
  id: string;
  title: string;
  evidence: string;
  /** Whole points given back to the score. */
  points: number;
}

/** Jev's read of the screenshot. It can give points back, never take any off. */
export interface VisualRead {
  /** 0 = clearly hand-designed, outOf = straight out of a generator. */
  look: number;
  outOf: number;
  confidence: number;
  /** Whole points given back to the score, 0 to JEV_MAX_POINTS. */
  points: number;
  model: string;
}

export interface AnalysisResult {
  /** The clean path after /scan/. */
  slug: string;
  /** The checks and weights that scored this scan. Bumped whenever they change; "Score again" brings a report up to date. */
  methodology: string;
  url: string;
  finalUrl: string;
  /** 100, minus each found pattern's points, plus the credits' and the visual read's, kept between 0 and 100. */
  score: number;
  signals: SignalResult[];
  credits: Credit[];
  visual: VisualRead | null;
  rendered: boolean;
  /** Raw measurements from the rendered page, for anyone who wants to check the maths. */
  renderedFacts: RenderedFacts | null;
  hasScreenshot: boolean;
  /** The render or the visual read broke, so this result was shown but not stored. Absent on reports stored before this flag existed. */
  degraded?: boolean;
  notes: string[];
  analyzedAt: string;
}
