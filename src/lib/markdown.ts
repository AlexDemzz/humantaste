import { INFO_PAGES } from "./info-pages";
import type { InfoPageSlug, InfoParagraph, InfoPart } from "./info-pages";
import {
  JEV_MAX_POINTS,
  OWN_FACE_POINTS,
  pointsBack,
  pointsOff,
} from "./score";
import {
  absolute,
  HOME_MARKDOWN_PATH,
  reportMarkdownPath,
  SITE_DESCRIPTION,
} from "./seo";
import { reportUrl, scoreLine } from "./share";
import type { AnalysisResult } from "./types";

const BACKTICKS = /`/gu;
const LINE_BREAKS = /\s*\n\s*/gu;
const LINK_TEXT_SPECIAL = /[[\]\\]/gu;

/** Evidence is text lifted from the scored site, so it stays in code and on one line. */
const quoted = (evidence: string) =>
  `\`${evidence.replaceAll(BACKTICKS, "'").replaceAll(LINE_BREAKS, " ")}\``;

export const reportMarkdown = (result: AnalysisResult) => {
  const found = result.signals
    .filter((signal) => signal.hit)
    .toSorted((a, b) => b.points - a.points);
  const patterns = found.map(
    (signal) =>
      `### ${signal.title} (${signal.points} off)\n\nEvidence: ${quoted(signal.hit?.evidence ?? "")}\n\n${signal.why}\n\nFix: ${signal.fix}`
  );
  const heading =
    found.length === 0
      ? "No AI patterns found"
      : `AI patterns found (${found.length})`;
  return `# ${scoreLine(result.slug, result.score)}

- Score: ${result.score} out of 100, where 0 is a pure AI template and 100 shows no sign of one.
- Sum: 100, minus ${pointsOff(found)} for the patterns found, plus ${pointsBack(result.credits, result.visual)} given back, kept between 0 and 100.
- Scored: ${result.analyzedAt}
- Report: ${reportUrl(result.slug)}

## ${heading}

${patterns.length > 0 ? patterns.join("\n\n") : "Every check came back clean."}
`;
};

export const missingReportMarkdown = (slug: string) => `# No report for ${slug}

Nobody has scored this site yet. Open ${reportUrl(slug)} to score it.
`;

const partMarkdown = (part: InfoPart) => {
  if (typeof part === "string") {
    return part;
  }
  return `[${part.text}](${"to" in part ? absolute(part.to) : part.href})`;
};

const paragraphsMarkdown = (paragraphs: InfoParagraph[]) =>
  paragraphs
    .map((paragraph) => paragraph.map(partMarkdown).join(""))
    .join("\n\n");

export const infoPageMarkdown = (slug: InfoPageSlug) => {
  const { intro, sections, title } = INFO_PAGES[slug];
  const body = sections
    .map(
      (section) =>
        `## ${section.title}\n\n${paragraphsMarkdown(section.paragraphs)}`
    )
    .join("\n\n");
  return `# ${title}\n\n${paragraphsMarkdown(intro)}\n\n${body}\n`;
};

const HOW_IT_WORKS = `humantaste looks for the patterns AI generators reach for when nobody chose otherwise. Code reads the HTML and CSS, renders the page in headless Chrome and measures what painted. Every page starts at 100, and each pattern found takes points off, up to its weight, with the evidence for it. Signs of a human hand give some back: a model's look at the screenshot up to ${JEV_MAX_POINTS}, a typeface of the site's own ${OWN_FACE_POINTS}. Nothing else moves the score, which stays between 0 and 100.`;

export const homeMarkdown = (reports: { slug: string; score: number }[]) => {
  const list = reports
    .map(
      ({ slug, score }) =>
        `- [${slug.replaceAll(LINK_TEXT_SPECIAL, (char) => `\\${char}`)}](${absolute(reportMarkdownPath(slug))}): ${score}/100`
    )
    .join("\n");
  return `# humantaste

> ${SITE_DESCRIPTION}

To score a site, open ${absolute("/scan/")}<site>, for example ${absolute("/scan/linear.app")}.

## How it works

${HOW_IT_WORKS}
${list ? `\n## Recently scored\n\n${list}\n` : ""}`;
};

export const llmsTxt = () => `# humantaste

> ${SITE_DESCRIPTION}

Every report is also served as Markdown: send \`Accept: text/markdown\` to its page, or fetch \`/md/<site>.md\`. The home page is at \`${HOME_MARKDOWN_PATH}\`.

## When to use it

- **Check how much of a website looks like an untouched AI template.** Read its report, then use the patterns and their fixes.
- **Compare a site before and after a redesign.** Each report says when it was scored.

## Reports

- [Home](${absolute(HOME_MARKDOWN_PATH)}): what humantaste is, how the score works and the sites scored most recently
- [Sitemap](${absolute("/sitemap.xml")}): every report
- [Contact](${absolute("/contact.md")}): how to report a wrong score or ask to remove a report
- [Privacy](${absolute("/privacy.md")}): what happens to the addresses scored and to visitors' data

## API

\`GET ${absolute("/api/report/")}<site>\` returns a report as JSON. A site nobody has scored yet gets scored first, which can take a couple of minutes and counts toward a daily limit.
`;
