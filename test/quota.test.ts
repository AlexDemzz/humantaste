import { env } from "cloudflare:workers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { reserveDailyScan } from "@/lib/quota.server";

vi.mock("cloudflare:workers", () => ({
  env: { DB: { batch: vi.fn(), prepare: vi.fn() } },
}));

const DAY_ONE = "2026-11-08";
const DAY_TWO = "2026-11-09";

interface Statement {
  sql: string;
  args: unknown[];
}

let ran: Statement[] = [];
let siteRow: { used: number } | null = { used: 1 };

const statement = (sql: string, args: unknown[]) => ({
  sql,
  args,
  first: () => Promise.resolve(siteRow),
  run: () => {
    ran.push({ sql, args });
    return Promise.resolve();
  },
});

const giveBacks = () => ran.filter(({ sql }) => sql.startsWith("UPDATE"));

beforeEach(() => {
  vi.useFakeTimers({ now: new Date(`${DAY_ONE}T23:59:00Z`) });
  ran = [];
  siteRow = { used: 1 };
  vi.mocked(env.DB.prepare).mockImplementation(
    (sql: string) =>
      ({
        bind: (...args: unknown[]) => statement(sql, args),
      }) as unknown as D1PreparedStatement
  );
  vi.mocked(env.DB.batch).mockImplementation((statements) => {
    ran.push(...(statements as unknown as Statement[]));
    return Promise.resolve([
      { results: [] },
      { results: [{ used: 1 }] },
    ]) as never;
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("reserveDailyScan", () => {
  it("gives back both scopes on the day the reservation was taken", async () => {
    const reservation = await reserveDailyScan("8.8.8.8");
    if (!reservation.ok) {
      throw new Error("expected a reservation");
    }
    vi.setSystemTime(new Date(`${DAY_TWO}T00:01:00Z`));
    await reservation.release();

    const scopes = giveBacks().map(({ args }) => args);
    expect(scopes).toHaveLength(2);
    expect(scopes.map(([day]) => day)).toEqual([DAY_ONE, DAY_ONE]);
    expect(scopes.map(([, scope]) => scope)).toEqual([
      expect.stringMatching(/^client:[0-9a-f]{32}$/u),
      "site",
    ]);
  });

  it("gives the client's charge back when the site refuses", async () => {
    siteRow = null;
    await expect(reserveDailyScan("8.8.8.8")).resolves.toEqual({
      ok: false,
      refusedBy: "site",
    });
    expect(giveBacks().map(({ args }) => args[1])).toEqual([
      expect.stringMatching(/^client:/u),
    ]);
  });
});
