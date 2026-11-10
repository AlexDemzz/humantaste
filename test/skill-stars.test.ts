import { beforeEach, expect, it, vi } from "vitest";

import { loadSkillStars } from "@/lib/skill-stars.server";
import { repoOf, TASTE_SKILLS } from "@/lib/taste-skills";

const { background, kv } = vi.hoisted(() => ({
  background: [] as Promise<unknown>[],
  kv: { get: vi.fn(), put: vi.fn() },
}));

vi.mock("cloudflare:workers", () => ({
  env: { SKILL_STARS: kv },
  waitUntil: (promise: Promise<unknown>) => background.push(promise),
}));

const NOW = Date.UTC(2026, 10, 9, 12);
const HOUR = 60 * 60 * 1000;
const REPOS = [...new Set(TASTE_SKILLS.map(({ href }) => repoOf(href)))];
const [FIRST_REPO = "", SECOND_REPO = ""] = REPOS;
const KNOWN = Object.fromEntries(REPOS.map((repo) => [repo, 10]));
const { [FIRST_REPO]: _uncounted, ...ALL_BUT_FIRST } = KNOWN;
const MINUTE = 60 * 1000;

const github = vi.fn<typeof fetch>();

const answerWithStars = (stars: number) =>
  github.mockImplementation(() =>
    Promise.resolve(Response.json({ stargazers_count: stars }))
  );

const storedCopy = (age: number, stars = KNOWN) =>
  kv.get.mockResolvedValue({ stars, fetchedAt: NOW - age });

const backgroundWork = () => Promise.all(background);

const written = () => JSON.parse(kv.put.mock.calls[0]?.[1] as string);

beforeEach(() => {
  vi.useFakeTimers({ now: NOW, toFake: ["Date"] });
  vi.stubGlobal("fetch", github);
  background.length = 0;
  github.mockReset();
  kv.get.mockReset();
  kv.put.mockReset();
});

it("serves a fresh copy without asking GitHub", async () => {
  storedCopy(HOUR);

  await expect(loadSkillStars()).resolves.toEqual(KNOWN);

  expect(github).not.toHaveBeenCalled();
  expect(background).toHaveLength(0);
});

it("serves a stale copy without waiting for GitHub to answer", async () => {
  storedCopy(7 * HOUR);
  github.mockReturnValue(Promise.withResolvers<Response>().promise);

  await expect(loadSkillStars()).resolves.toEqual(KNOWN);

  expect(background).toHaveLength(1);
});

it("stores what GitHub answers once the copy goes stale", async () => {
  storedCopy(7 * HOUR);
  answerWithStars(99);

  await loadSkillStars();
  await backgroundWork();

  expect(written()).toEqual({
    stars: Object.fromEntries(REPOS.map((repo) => [repo, 99])),
    fetchedAt: NOW,
  });
});

it("keeps the stored count of a repository GitHub could not answer for", async () => {
  storedCopy(7 * HOUR);
  github.mockImplementation((url) =>
    Promise.resolve(
      String(url).endsWith(FIRST_REPO)
        ? new Response(null, { status: 403 })
        : Response.json({ stargazers_count: 99 })
    )
  );

  await loadSkillStars();
  await backgroundWork();

  expect(written().stars[FIRST_REPO]).toBe(10);
  expect(written().stars[SECOND_REPO]).toBe(99);
});

it("leaves the store alone when GitHub is down", async () => {
  storedCopy(7 * HOUR);
  github.mockRejectedValue(new Error("network down"));

  await expect(loadSkillStars()).resolves.toEqual(KNOWN);
  await backgroundWork();

  expect(kv.put).not.toHaveBeenCalled();
});

it("asks GitHub within minutes for a listed skill the copy has no count for", async () => {
  storedCopy(11 * MINUTE, ALL_BUT_FIRST);
  answerWithStars(42);

  await expect(loadSkillStars()).resolves.toEqual(ALL_BUT_FIRST);
  await backgroundWork();

  expect(written().stars[FIRST_REPO]).toBe(42);
});

it("does not ask GitHub on every page while a skill stays without a count", async () => {
  storedCopy(9 * MINUTE, ALL_BUT_FIRST);

  await loadSkillStars();

  expect(github).not.toHaveBeenCalled();
});

it("fills an empty store in the background and answers with no counts", async () => {
  kv.get.mockResolvedValue(null);
  answerWithStars(5);

  await expect(loadSkillStars()).resolves.toEqual({});
  await backgroundWork();

  expect(written().stars[FIRST_REPO]).toBe(5);
});

it("answers with no counts when the store cannot be read", async () => {
  kv.get.mockRejectedValue(new Error("KV unavailable"));

  await expect(loadSkillStars()).resolves.toEqual({});
});
