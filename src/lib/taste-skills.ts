import listedSkills from "./data/taste-skills.json" with { type: "json" };

export interface TasteSkill {
  name: string;
  what: string;
  href: string;
}

/** GitHub's counts by `owner/name`. */
export type StarCounts = Readonly<Record<string, number>>;

export interface RankedSkill extends TasteSkill {
  /** Undefined until GitHub has answered for the repository. */
  stars: number | undefined;
}

export type PageSlot = number | "gap-start" | "gap-end";

export const SKILLS_PER_PAGE = 5;

const MAX_PAGE_SLOTS = 5;
const GITHUB_REPO = /^https:\/\/github\.com\/(?<repo>[\w.-]+\/[\w.-]+)/u;

const compactNumber = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const fullNumber = new Intl.NumberFormat("en");

/** The `owner/name` a skill's link points into, even a link to a folder of a larger repository. */
export const repoOf = (href: string): string => {
  const repo = GITHUB_REPO.exec(href)?.groups?.repo;
  if (!repo) {
    throw new Error(`${href} is not a link to a GitHub repository.`);
  }
  return repo;
};

/** Sources and reasons for the first entries: docs/research/anti-slop-skills.md and docs/research/skills-sh-sweep.md. */
export const TASTE_SKILLS: readonly TasteSkill[] = listedSkills;

const UNCOUNTED = -1;

/** Most starred first, ties in name order, and a skill GitHub has not counted yet goes last. */
export const rankSkills = (
  skills: readonly TasteSkill[],
  counts: StarCounts
): RankedSkill[] =>
  skills
    .map((skill) => ({ ...skill, stars: counts[repoOf(skill.href)] }))
    .toSorted(
      (a, b) =>
        (b.stars ?? UNCOUNTED) - (a.stars ?? UNCOUNTED) ||
        a.name.localeCompare(b.name, "en")
    );

/** A page past the end shows the last one, so an old link still lands on a list. */
export const skillsPage = <Skill>(
  skills: readonly Skill[],
  requested: number
): { skills: Skill[]; page: number; pageCount: number } => {
  const pageCount = Math.max(1, Math.ceil(skills.length / SKILLS_PER_PAGE));
  const page = Math.min(requested, pageCount);
  const start = (page - 1) * SKILLS_PER_PAGE;
  return {
    skills: skills.slice(start, start + SKILLS_PER_PAGE),
    page,
    pageCount,
  };
};

/** The `page` search param, or undefined for page 1 and anything unusable, which keeps the URL bare. */
export const parseSkillsPage = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isSafeInteger(value) && value > 1
    ? value
    : undefined;

/** At most five slots, so the row of 40px controls fits a phone. */
export const pageSlots = (page: number, pageCount: number): PageSlot[] => {
  if (pageCount <= MAX_PAGE_SLOTS) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }
  if (page <= 2) {
    return [1, 2, 3, "gap-end", pageCount];
  }
  if (page >= pageCount - 1) {
    return [1, "gap-start", pageCount - 2, pageCount - 1, pageCount];
  }
  return [1, "gap-start", page, "gap-end", pageCount];
};

export const compactStars = (stars: number): string =>
  compactNumber.format(stars);

export const spokenStars = (stars: number): string =>
  `${fullNumber.format(stars)} ${stars === 1 ? "star" : "stars"}`;

export const skillLinkLabel = ({ name, stars }: RankedSkill): string => {
  const counted = stars === undefined ? "" : `, ${spokenStars(stars)}`;
  return `${name} on GitHub${counted}, opens in a new tab`;
};
