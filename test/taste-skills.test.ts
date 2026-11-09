import { describe, expect, it } from "vitest";

import {
  compactStars,
  pageSlots,
  parseSkillsPage,
  rankSkills,
  repoOf,
  SKILLS_PER_PAGE,
  skillsPage,
  spokenStars,
  TASTE_SKILLS,
} from "@/lib/taste-skills";
import type { TasteSkill } from "@/lib/taste-skills";

const skill = (name: string, stars: number): TasteSkill => ({
  name,
  stars,
  what: "Does a thing.",
  href: `https://github.com/acme/${name}`,
});

const skillsNamed = (count: number) =>
  Array.from({ length: count }, (_, index) => skill(`s${index + 1}`, 0));

describe("the skills list contributors edit", () => {
  it("links every skill to a GitHub repository", () => {
    for (const { href } of TASTE_SKILLS) {
      expect(() => repoOf(href)).not.toThrow();
    }
  });

  it("lists each skill once", () => {
    const hrefs = TASTE_SKILLS.map(({ href }) => href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("gives every skill a name, a sentence and a star count", () => {
    for (const { name, what, stars } of TASTE_SKILLS) {
      expect(name.trim()).not.toBe("");
      expect(what.trim()).not.toBe("");
      expect(Number.isInteger(stars) && stars >= 0).toBe(true);
    }
  });
});

describe("repoOf", () => {
  it("reads the repository out of a link to a folder inside it", () => {
    expect(
      repoOf("https://github.com/cursor/plugins/tree/main/pstack/skills/unslop")
    ).toBe("cursor/plugins");
  });

  it("refuses a link outside GitHub", () => {
    expect(() => repoOf("https://example.com/acme/skills")).toThrow(
      "not a link to a GitHub repository"
    );
  });
});

describe("rankSkills", () => {
  it("puts the most starred first and breaks ties by name", () => {
    const ranked = rankSkills([
      skill("low", 1),
      skill("tied-b", 5),
      skill("tied-a", 5),
      skill("high", 9),
    ]);
    expect(ranked.map(({ name }) => name)).toEqual([
      "high",
      "tied-a",
      "tied-b",
      "low",
    ]);
  });
});

describe("skillsPage", () => {
  it("cuts the list into pages of five", () => {
    const second = skillsPage(skillsNamed(12), 2);
    expect(second.skills.map(({ name }) => name)).toEqual([
      "s6",
      "s7",
      "s8",
      "s9",
      "s10",
    ]);
    expect(second.pageCount).toBe(3);
  });

  it("keeps a short last page", () => {
    expect(skillsPage(skillsNamed(12), 3).skills).toHaveLength(2);
  });

  it("does not open a new page for an exact multiple", () => {
    expect(skillsPage(skillsNamed(SKILLS_PER_PAGE), 1).pageCount).toBe(1);
  });

  it("shows the last page for a page past the end", () => {
    const beyond = skillsPage(skillsNamed(12), 99);
    expect(beyond.page).toBe(3);
    expect(beyond.skills.map(({ name }) => name)).toEqual(["s11", "s12"]);
  });

  it("still has one page when the list is empty", () => {
    expect(skillsPage([], 4)).toEqual({ skills: [], page: 1, pageCount: 1 });
  });
});

describe("parseSkillsPage", () => {
  it("keeps a real page number", () => {
    expect(parseSkillsPage(3)).toBe(3);
  });

  it.each([[1], [0], [-2], [1.5], ["2"], [null], [undefined], [1e30]])(
    "leaves %s out of the URL",
    (value) => {
      expect(parseSkillsPage(value)).toBeUndefined();
    }
  );
});

describe("pageSlots", () => {
  it("lists every page when they all fit", () => {
    expect(pageSlots(2, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("collapses the end near the start", () => {
    expect(pageSlots(2, 9)).toEqual([1, 2, 3, "gap-end", 9]);
  });

  it("collapses the start near the end", () => {
    expect(pageSlots(8, 9)).toEqual([1, "gap-start", 7, 8, 9]);
  });

  it("collapses both sides in the middle", () => {
    expect(pageSlots(5, 9)).toEqual([1, "gap-start", 5, "gap-end", 9]);
  });
});

describe("star counts", () => {
  it("shortens large counts", () => {
    expect(compactStars(112_208)).toBe("112.2K");
    expect(compactStars(940)).toBe("940");
  });

  it("spells the count out for screen readers", () => {
    expect(spokenStars(112_208)).toBe("112,208 stars");
    expect(spokenStars(1)).toBe("1 star");
  });
});
