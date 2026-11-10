import { env, waitUntil } from "cloudflare:workers";

import { fetchRepoStars } from "./github-stars";
import { repoOf, TASTE_SKILLS } from "./taste-skills";
import type { StarCounts } from "./taste-skills";

// Bump the version whenever the stored entry changes shape.
const STORE_KEY = "skill-stars/v1";
const FRESH_FOR_MS = 6 * 60 * 60 * 1000;
const RETRY_UNCOUNTED_AFTER_MS = 10 * 60 * 1000;

interface StoredStars {
  stars: StarCounts;
  fetchedAt: number;
}

const liveCount = async (repo: string): Promise<readonly [string, number]> => [
  repo,
  await fetchRepoStars(repo, process.env.GITHUB_TOKEN),
];

const listedRepos = (): string[] => [
  ...new Set(TASTE_SKILLS.map(({ href }) => repoOf(href))),
];

const refreshStars = async (
  repos: readonly string[],
  known: StarCounts
): Promise<void> => {
  const answers = await Promise.allSettled(repos.map(liveCount));
  const live = answers.flatMap((answer) =>
    answer.status === "fulfilled" ? [answer.value] : []
  );
  if (live.length === 0) {
    return;
  }

  const stored: StoredStars = {
    stars: { ...known, ...Object.fromEntries(live) },
    fetchedAt: Date.now(),
  };
  try {
    await env.SKILL_STARS.put(STORE_KEY, JSON.stringify(stored));
  } catch {
    // Concurrent refreshes may hit KV's one-write-per-second limit.
  }
};

/**
 * GitHub is the only source of the counts, and KV holds one copy of them for
 * every Cloudflare location, so a page never waits on GitHub: past a few hours
 * the stored copy is still served while GitHub refreshes it in the background.
 * A repository the copy has no count for, a skill just added to the list, is
 * asked for again within minutes.
 */
export const loadSkillStars = async (): Promise<StarCounts> => {
  try {
    const stored = await env.SKILL_STARS.get<Partial<StoredStars>>(
      STORE_KEY,
      "json"
    );
    const known = stored?.stars ?? {};
    const repos = listedRepos();
    const allCounted = repos.every((repo) => Object.hasOwn(known, repo));
    const freshFor = allCounted ? FRESH_FOR_MS : RETRY_UNCOUNTED_AFTER_MS;
    // A missing date reads as `NaN`, which is stale too.
    const fresh = Date.now() - Number(stored?.fetchedAt) < freshFor;
    if (!fresh) {
      waitUntil(refreshStars(repos, known));
    }
    return known;
  } catch {
    return {};
  }
};
