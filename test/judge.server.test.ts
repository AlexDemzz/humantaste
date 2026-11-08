import { beforeEach, expect, it, vi } from "vitest";

import { sleep } from "@/lib/deadline";
import { visualRead } from "@/lib/judge.server";

vi.mock("@/lib/deadline", async (original) => ({
  ...(await original<object>()),
  sleep: vi.fn(() => Promise.resolve()),
}));

const SHOT = Buffer.from("pixels");
const URL_READ = "https://example.com/";
const fetchMock = vi.fn<typeof fetch>();

const answered = () =>
  Response.json({
    model: "jev-preview",
    answers: { default_look: { score: 2, confidence: 0.9 } },
  });
const failed = (status: number, headers?: HeadersInit) =>
  new Response("", { status, headers });

beforeEach(() => {
  vi.mocked(sleep).mockClear();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("TYPESAFE_API_KEY", "key");
});

it.each([429, 500, 503])("asks again after a %s", async (status) => {
  fetchMock.mockResolvedValueOnce(failed(status));
  fetchMock.mockResolvedValueOnce(answered());
  await expect(visualRead(SHOT, URL_READ)).resolves.toMatchObject({ look: 2 });
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

it("asks again after a network error", async () => {
  fetchMock.mockRejectedValueOnce(new TypeError("network lost"));
  fetchMock.mockResolvedValueOnce(answered());
  await expect(visualRead(SHOT, URL_READ)).resolves.toMatchObject({ look: 2 });
});

it("does not ask again after a 400", async () => {
  fetchMock.mockResolvedValueOnce(failed(400));
  await expect(visualRead(SHOT, URL_READ)).rejects.toThrow("Jev answered 400");
  expect(fetchMock).toHaveBeenCalledOnce();
});

it("stops after the second ask", async () => {
  fetchMock.mockImplementation(() => Promise.resolve(failed(503)));
  await expect(visualRead(SHOT, URL_READ)).rejects.toThrow("Jev answered 503");
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

it("waits as long as Retry-After asks", async () => {
  fetchMock.mockResolvedValueOnce(failed(429, { "retry-after": "3" }));
  fetchMock.mockResolvedValueOnce(answered());
  await visualRead(SHOT, URL_READ);
  expect(sleep).toHaveBeenCalledWith(3000);
});

it("gives up when Retry-After is longer than a scan can wait", async () => {
  fetchMock.mockResolvedValueOnce(failed(429, { "retry-after": "60" }));
  await expect(visualRead(SHOT, URL_READ)).rejects.toThrow("Jev answered 429");
  expect(fetchMock).toHaveBeenCalledOnce();
});
