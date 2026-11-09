import { env, waitUntil } from "cloudflare:workers";

import { fetchRepoStars } from "./github-stars";
import { repoOf, TASTE_SKILLS } from "./taste-skills";
import type { StarCounts } from "./taste-skills";

// Bump the version whenever the stored entry changes shape.
const STORE_KEY = "skill-stars/v1";
const FRESH_FOR_MS = 6 * 60 * 60 * 1000;

interface StoredStars {
  stars: StarCounts;
  fetchedAt: number;
}

const liveCount = async (repo: string): Promise<readonly [string, number]> => [
  repo,
  await fetchRepoStars(repo, process.env.GITHUB_TOKEN),
];

const refreshStars = async (known: StarCounts): Promise<void> => {
  const repos = new Set(TASTE_SKILLS.map(({ href }) => repoOf(href)));
  const answers = await Promise.allSettled([...repos].map(liveCount));
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
 * KV holds one copy for every Cloudflare location, and the build ships counts
 * for anything it lacks, so a page never waits on GitHub: past a few hours the
 * stored copy is still served while GitHub refreshes it in the background.
 */
export const loadSkillStars = async (): Promise<StarCounts> => {
  try {
    const stored = await env.SKILL_STARS.get<Partial<StoredStars>>(
      STORE_KEY,
      "json"
    );
    const known = stored?.stars ?? {};
    // A missing date reads as `NaN`, which is stale too.
    const fresh = Date.now() - Number(stored?.fetchedAt) < FRESH_FOR_MS;
    if (!fresh) {
      waitUntil(refreshStars(known));
    }
    return known;
  } catch {
    return {};
  }
};
