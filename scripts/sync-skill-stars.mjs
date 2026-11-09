import { readFileSync, writeFileSync } from "node:fs";

import { repoOf } from "../src/lib/taste-skills.ts";

const file = new URL("../src/lib/data/taste-skills.json", import.meta.url);
const token = process.env.GITHUB_TOKEN;
const headers = {
  accept: "application/vnd.github+json",
  "user-agent": "humantaste",
  ...(token && { authorization: `Bearer ${token}` }),
};

const refresh = async (skill) => {
  const repo = repoOf(skill.href);
  try {
    const response = await fetch(`https://api.github.com/repos/${repo}`, {
      headers,
    });
    if (!response.ok) {
      throw new Error(`GitHub answered ${response.status}`);
    }
    const { stargazers_count: stars } = await response.json();
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
