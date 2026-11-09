import listedSkills from "./data/taste-skills.json" with { type: "json" };

export interface TasteSkill {
  name: string;
  what: string;
  href: string;
  stars: number;
}

/** Live counts by `owner/name`. */
export type StarCounts = Readonly<Record<string, number>>;

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

export const rankSkills = (skills: readonly TasteSkill[]): TasteSkill[] =>
  skills.toSorted(
    (a, b) => b.stars - a.stars || a.name.localeCompare(b.name, "en")
  );

/** Sources and reasons for the first entries: docs/research/anti-slop-skills.md and docs/research/skills-sh-sweep.md. */
export const TASTE_SKILLS: readonly TasteSkill[] = rankSkills(listedSkills);

/** A skill without a live count keeps the one the build shipped with. */
export const withLiveStars = (
  skills: readonly TasteSkill[],
  live: StarCounts
): TasteSkill[] =>
  rankSkills(
    skills.map((skill) => ({
      ...skill,
      stars: live[repoOf(skill.href)] ?? skill.stars,
    }))
  );

/** A page past the end shows the last one, so an old link still lands on a list. */
export const skillsPage = (
  skills: readonly TasteSkill[],
  requested: number
): { skills: TasteSkill[]; page: number; pageCount: number } => {
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
