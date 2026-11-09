import { readFileSync, writeFileSync } from "node:fs";

import { fetchRepoStars } from "../src/lib/github-stars.ts";
import { repoOf } from "../src/lib/taste-skills.ts";

const file = new URL("../src/lib/data/taste-skills.json", import.meta.url);

const refresh = async (skill) => {
  const repo = repoOf(skill.href);
  try {
    const stars = await fetchRepoStars(repo, process.env.GITHUB_TOKEN);
    return { ...skill, stars };
  } catch (error) {
    process.stderr.write(
      `${repo}: ${error.message}, keeping ${skill.stars} stars.\n`
    );
    return skill;
  }
};

const skills = JSON.parse(readFileSync(file, "utf-8"));
const refreshed = await Promise.all(skills.map(refresh));
writeFileSync(file, `${JSON.stringify(refreshed, null, 2)}\n`);
