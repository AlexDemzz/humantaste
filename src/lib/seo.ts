import type { ComponentProps } from "react";

import { INFO_PAGE_SLUGS, INFO_PAGES } from "./info-pages";
import type { InfoPageSlug } from "./info-pages";
import {
  cardPath,
  pathSlug,
  reportUrl,
  scanPath,
  scoreLine,
  SITE_URL,
} from "./share";
import type { AnalysisResult } from "./types";

const X_HANDLE = "@AlexDmzz";
const SITE_ID = `${SITE_URL}/#website`;
const CREATOR = {
  "@type": "Person",
  "@id": "https://alexandrejoly.me/#person",
  name: "Alexandre Joly",
  url: "https://alexandrejoly.me/",
};

const SITE_TITLE = "How human does your website look? | humantaste";
export const SITE_DESCRIPTION =
  "Paste a URL to see how human your website looks. Get a score out of 100, the AI patterns behind it and what to change.";
export const SITE_CARD = {
  question: "How human does your website look?",
  answer: "Get a score out of 100, the AI patterns found and what to change.",
};
const SITE_CARD_PATH = "/og.png";
export const HOME_MARKDOWN_PATH = "/index.md";

export const absolute = (path: string) => new URL(path, SITE_URL).href;
export const reportMarkdownPath = (slug: string) => `/md/${pathSlug(slug)}.md`;

interface PageImage {
  alt: string;
  path: string;
}

const SITE_IMAGE: PageImage = {
  alt: `humantaste: ${SITE_CARD.question} ${SITE_CARD.answer}`,
  path: SITE_CARD_PATH,
};

interface PageHeadOptions {
  description: string;
  image?: PageImage;
  /** Absent on a page with no Markdown twin. */
  markdownPath?: string;
  modified?: string;
  /** Keeps the page out of search, and with it the canonical link, whose signal would contradict that. */
  noindex?: boolean;
  path: string;
  title: string;
  type: "article" | "website";
}

interface PageHead {
  links: ComponentProps<"link">[];
  meta: ComponentProps<"meta">[];
  scripts?: { children: string; type: string }[];
}

/** Canonical and Markdown links plus the description, Open Graph and X card tags every page shares. */
const pageHead = ({
  description,
  image = SITE_IMAGE,
  markdownPath,
  modified,
  noindex = false,
  path,
  title,
  type,
}: PageHeadOptions): PageHead => {
  const url = absolute(path);
  const links: ComponentProps<"link">[] = [];
  if (!noindex) {
    links.push({ rel: "canonical", href: url });
  }
  if (markdownPath) {
    links.push({
      rel: "alternate",
      type: "text/markdown",
      href: absolute(markdownPath),
    });
  }
  const meta: ComponentProps<"meta">[] = [
    { title },
    { name: "description", content: description },
    { property: "og:type", content: type },
    { property: "og:url", content: url },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:locale", content: "en_US" },
    { property: "og:image", content: absolute(image.path) },
    { property: "og:image:type", content: "image/png" },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: image.alt },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:site", content: X_HANDLE },
    { name: "twitter:creator", content: X_HANDLE },
  ];
  if (modified) {
    meta.push({ property: "article:modified_time", content: modified });
  }
  if (noindex) {
    meta.push({ name: "robots", content: "noindex" });
  }
  return { links, meta };
};

// Written with fromCodePoint so no formatter can collapse the escape back into the character it replaces.
const LESS_THAN_ESCAPE = `${String.fromCodePoint(92)}u003c`;

/** A site's evidence reaches this JSON, so `<` is escaped to keep it from closing the script. */
const jsonLd = (data: unknown) => ({
  type: "application/ld+json",
  children: JSON.stringify(data).replaceAll("<", LESS_THAN_ESCAPE),
});

export const homeHead = (): PageHead => ({
  ...pageHead({
    description: SITE_DESCRIPTION,
    markdownPath: HOME_MARKDOWN_PATH,
    path: "/",
    title: SITE_TITLE,
    type: "website",
  }),
  scripts: [
    jsonLd({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": SITE_ID,
          url: absolute("/"),
          name: "humantaste",
          description: SITE_DESCRIPTION,
          inLanguage: "en",
          creator: CREATOR,
        },
        {
          "@type": "WebApplication",
          "@id": `${SITE_URL}/#app`,
          url: absolute("/"),
          name: "humantaste",
          description: SITE_DESCRIPTION,
          applicationCategory: "DeveloperApplication",
          operatingSystem: "Any",
          browserRequirements: "Requires JavaScript",
          isAccessibleForFree: true,
          creator: CREATOR,
        },
      ],
    }),
  ],
});

const patternsSentence = (result: AnalysisResult) => {
  const found = result.signals.filter((signal) => signal.hit);
  const [biggest] = found.toSorted((a, b) => b.points - a.points);
  if (!biggest) {
    return `No AI patterns found in ${result.signals.length} checks.`;
  }
  if (found.length === 1) {
    return `1 AI pattern found: ${biggest.title}. See the evidence and the fix.`;
  }
  return `${found.length} AI patterns found, the biggest: ${biggest.title}. See the evidence and the fixes.`;
};

/** Each report gets its own description: the patterns found are what set it apart. */
export const reportDescription = (result: AnalysisResult) =>
  `${result.slug} scores ${result.score}/100, where 0 is a pure AI template. ${patternsSentence(result)}`;

export const reportHead = (result: AnalysisResult): PageHead => {
  const { analyzedAt, finalUrl, score, slug } = result;
  const title = scoreLine(slug, score);
  const description = reportDescription(result);
  const url = reportUrl(slug);
  const image = {
    alt: `Score card: ${slug} scores ${score} out of 100.`,
    path: cardPath(slug),
  };
  return {
    ...pageHead({
      description,
      image,
      markdownPath: reportMarkdownPath(slug),
      modified: analyzedAt,
      path: scanPath(slug),
      title,
      type: "article",
    }),
    scripts: [
      jsonLd({
        "@context": "https://schema.org",
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: title,
        description,
        inLanguage: "en",
        dateModified: analyzedAt,
        isPartOf: { "@id": SITE_ID },
        about: { "@type": "WebSite", name: slug, url: finalUrl },
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: absolute(image.path),
          width: 1200,
          height: 630,
        },
      }),
    ],
  };
};

export const infoPageHead = (slug: InfoPageSlug): PageHead =>
  pageHead({
    description: INFO_PAGES[slug].description,
    markdownPath: `/${slug}.md`,
    path: `/${slug}`,
    title: `${INFO_PAGES[slug].title} | humantaste`,
    type: "website",
  });

/** A site nobody has scored yet has nothing to index: its page is only a loader. */
export const unscoredHead = (slug: string): PageHead =>
  pageHead({
    description:
      "How human does this page look? 0 is a pure AI template, 100 shows no sign of one.",
    noindex: true,
    path: scanPath(slug),
    title: `${slug} on humantaste`,
    type: "website",
  });

const XML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};
const XML_SPECIAL = /[&<>"']/gu;
const escapeXml = (text: string) =>
  text.replaceAll(XML_SPECIAL, (char) => XML_ESCAPES[char] ?? char);

interface SitemapReport {
  slug: string;
  analyzedAt: string;
}

const sitemapUrl = (location: string, lastModified?: string) => {
  const modified = lastModified ? `<lastmod>${lastModified}</lastmod>` : "";
  return `<url><loc>${escapeXml(location)}</loc>${modified}</url>`;
};

export const sitemapXml = (reports: SitemapReport[]) => {
  const urls = [
    sitemapUrl(absolute("/")),
    ...INFO_PAGE_SLUGS.map((slug) => sitemapUrl(absolute(`/${slug}`))),
    ...reports.map(({ slug, analyzedAt }) =>
      sitemapUrl(reportUrl(slug), analyzedAt)
    ),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>\n`;
};
