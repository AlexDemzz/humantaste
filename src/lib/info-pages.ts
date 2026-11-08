export const REPO_URL = "https://github.com/AlexDemzz/humantaste";
const MAKER_CONTACT_URL = "https://alexandrejoly.me/contact";

export type InfoPart =
  | string
  | { href: string; text: string }
  | { to: "/contact" | "/privacy"; text: string };
export type InfoParagraph = InfoPart[];

export interface InfoSection {
  paragraphs: InfoParagraph[];
  title: string;
}

export interface InfoPage {
  description: string;
  intro: InfoParagraph[];
  sections: InfoSection[];
  title: string;
}

export const INFO_PAGE_SLUGS = ["contact", "privacy"] as const;
export type InfoPageSlug = (typeof INFO_PAGE_SLUGS)[number];

export const isInfoPageSlug = (slug: string): slug is InfoPageSlug =>
  (INFO_PAGE_SLUGS as readonly string[]).includes(slug);

export const INFO_PAGES: Record<InfoPageSlug, InfoPage> = {
  contact: {
    description:
      "How to reach humantaste: report a wrong score or a bug on GitHub, ask to remove a report about your site, or write to its maker, Alexandre Joly.",
    intro: [
      [
        "humantaste is made by ",
        { href: "https://alexandrejoly.me/", text: "Alexandre Joly" },
        ".",
      ],
    ],
    sections: [
      {
        paragraphs: [
          [
            "Open an issue on ",
            { href: `${REPO_URL}/issues`, text: "the GitHub repository" },
            " with the address you scored and what looks wrong.",
          ],
        ],
        title: "A wrong score or a bug",
      },
      {
        paragraphs: [
          [
            "Write through ",
            {
              href: MAKER_CONTACT_URL,
              text: "Alexandre Joly’s contact page",
            },
            " with the address of the report. Send it from an email at that site’s domain, so it’s clear the site is yours. Anyone can score the site again afterwards, so a removed report can come back.",
          ],
        ],
        title: "Remove a report about your site",
      },
      {
        paragraphs: [
          [
            "Use the same ",
            { href: MAKER_CONTACT_URL, text: "contact page" },
            ", or find Alexandre on ",
            { href: "https://x.com/AlexDmzz", text: "X as @AlexDmzz" },
            ".",
          ],
        ],
        title: "Anything else",
      },
    ],
    title: "Contact",
  },
  privacy: {
    description:
      "What humantaste collects: no cookies, no analytics, no account. Sites you score become public reports, and your IP address is used for limits and hosting.",
    intro: [
      [
        "humantaste sets no cookies, runs no analytics or advertising scripts and needs no account. This page explains what still happens when you visit or score a site.",
      ],
    ],
    sections: [
      {
        paragraphs: [
          [
            "Scoring an address makes it public, whether you enter it here or open a humantaste link to it. Its score, its report and a screenshot of the page get their own link, can appear under Recently scored and are listed for search engines. If the address redirects, the report also includes where it landed. A report has no end date: scoring that address again replaces it, and a report made with an older version of the score stops showing until someone scores it again. Enter public pages only, and no address with a secret in it.",
          ],
          [
            "To score a page, humantaste loads it in a browser run by Cloudflare and sends the screenshot and the address it landed on to ",
            { href: "https://typesafe.ai/", text: "TypeSafe" },
            ", whose model Jev reads how the page looks. Nothing about you goes with them.",
          ],
        ],
        title: "The sites you score",
      },
      {
        paragraphs: [
          [
            "Your IP address limits how many pages you can score each minute and each day. The daily count stores a hash of the address mixed with the date instead of the address itself. Those rows are deleted when the first page of a later day is scored, and can remain in database backups for up to 30 days.",
          ],
        ],
        title: "Limits on scoring",
      },
      {
        paragraphs: [
          [
            "The site runs on ",
            {
              href: "https://www.cloudflare.com/privacypolicy/",
              text: "Cloudflare",
            },
            ", which processes each request, including your IP address and browser details, to serve the page and protect it from abuse. Request logs, which include the page addresses requested, are kept for up to seven days to debug errors and are not used to profile visitors.",
          ],
        ],
        title: "Hosting",
      },
      {
        paragraphs: [
          [
            "Fonts and images come from this domain. On a phone, the light on the score card follows your device’s motion, and iPhones ask for access first; that data stays on your device. If you skip it, your browser’s session storage remembers that for the visit. Session storage also keeps your scroll position between pages. Neither leaves your browser.",
          ],
        ],
        title: "Your browser",
      },
      {
        paragraphs: [
          [
            "Share on X and links to other sites open them under their own privacy policies. To remove a report about your site, or for any question about your data, use the ",
            { to: "/contact", text: "contact page" },
            ".",
          ],
        ],
        title: "Questions",
      },
    ],
    title: "Privacy",
  },
};
