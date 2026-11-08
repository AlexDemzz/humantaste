import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { HoloCard } from "@/components/holo-card/holo-card";
import { Page } from "@/components/page";
import { Details, Patterns, scoredAt } from "@/components/report";
import { ScanForm } from "@/components/scan-form";
import { ScanLoader } from "@/components/scan-loader";
import { ShareActions } from "@/components/share-actions";
import { TasteSkills } from "@/components/taste-skills";
import { peekScanFn, runScanFn } from "@/lib/scan.functions";
import type { ScanOutcome } from "@/lib/scan.functions";
import { reportHead, unscoredHead } from "@/lib/seo";
import { cardFromResult } from "@/lib/share";
import { parseTarget } from "@/lib/target";
import type { AnalysisResult } from "@/lib/types";
import { cn } from "@/lib/utils";

import holoCardCss from "@/components/holo-card/holo-card.css?url";

const failure = (error: unknown): ScanOutcome => ({
  ok: false,
  error:
    error instanceof Error
      ? error.message
      : "Unable to score this page. Try again in a minute.",
});

/** The counts, when the scan ran, and a way to run it again. */
const ScanMeta = ({ result }: { result: AnalysisResult }) => {
  const router = useRouter();
  const [rescan, setRescan] = useState<{ busy: boolean; error: string | null }>(
    { busy: false, error: null }
  );
  const patterns = result.signals.filter((signal) => signal.hit).length;

  const onRescan = async () => {
    setRescan({ busy: true, error: null });
    const outcome = await runScanFn({
      data: { fresh: true, slug: result.slug },
    });
    if (!outcome.ok) {
      setRescan({ busy: false, error: outcome.error });
      return;
    }
    if (outcome.result.degraded) {
      setRescan({
        busy: false,
        error:
          "That new score came back incomplete, so this report stays as it was. Try again in a minute.",
      });
      return;
    }
    await router.invalidate();
    setRescan({ busy: false, error: null });
  };

  return (
    <>
      <p className="text-sm tabular-nums">
        {patterns} of {result.signals.length} patterns found.{" "}
        {result.rendered
          ? ""
          : "Rendering failed, so only the static checks ran. "}
        {result.notes.length > 0 && `${result.notes.join(" ")} `}Scored{" "}
        <time dateTime={result.analyzedAt}>{scoredAt(result)}</time>.{" "}
        <button
          type="button"
          className="text-link disabled:cursor-progress"
          onClick={onRescan}
          disabled={rescan.busy}
        >
          {rescan.busy ? "Scoring…" : "Score again"}
        </button>
      </p>
      {rescan.error && (
        <p className="text-destructive text-sm" role="alert">
          {rescan.error}
        </p>
      )}
    </>
  );
};

const ScoreSite = ({ title }: { title: string }) => (
  <section className="flex flex-col gap-4" aria-labelledby="again">
    <h2 id="again" className="text-foreground font-semibold">
      {title}
    </h2>
    <ScanForm examples={false} />
  </section>
);

/**
 * A fresh scan waits in the loader and its card only exists once it is ready to peel.
 * A stored scan is known from the first render and shows its card at once.
 */
const Scan = () => {
  const { slug, stored, invalid } = Route.useLoaderData();
  // oxlint-disable-next-line react/hook-use-state -- the first outcome is fixed for this mount; it decides whether the evidence fades in
  const [initial] = useState<ScanOutcome | null>(
    () => invalid ?? (stored ? { ok: true, result: stored } : null)
  );
  const [settled, setSettled] = useState(initial);
  // "Score again" reloads the route, so a stored report is always the newest one.
  const outcome: ScanOutcome | null = stored
    ? { ok: true, result: stored }
    : settled;
  const [revealed, setRevealed] = useState(initial !== null);
  const reveal = useCallback(() => setRevealed(true), []);

  // The browser asks for the scan itself: a promise streamed from SSR dies with the stream's 60s serialization timeout.
  useEffect(() => {
    if (initial) {
      return;
    }
    let live = true;
    const settle = async () => {
      let next: ScanOutcome;
      try {
        next = await runScanFn({ data: { slug } });
      } catch (error) {
        next = failure(error);
      }
      if (live) {
        setSettled(next);
      }
    };
    settle();
    return () => {
      live = false;
    };
  }, [initial, slug]);

  if (outcome && !outcome.ok) {
    return (
      <>
        <section className="flex flex-col gap-4">
          <h1 className="text-foreground font-semibold">
            Unable to score {slug}
          </h1>
          <p className="text-destructive text-sm" role="alert">
            {outcome.error}
          </p>
        </section>
        <ScoreSite title="Score another site" />
      </>
    );
  }

  const scanned = outcome?.result ?? null;
  const result = revealed ? scanned : null;
  const arrivedOnReport = initial?.ok === true;
  return (
    <>
      <section className="flex flex-col gap-4" aria-live="polite">
        <h1 className="sr-only">
          {result
            ? `${slug} scores ${result.score} out of 100`
            : `Scoring ${slug}`}
        </h1>
        <div
          className="grid aspect-1200/630 *:[grid-area:1/1]"
          aria-busy={!result}
        >
          {initial === null && (
            <ScanLoader
              finishing={scanned !== null}
              covered={revealed}
              onFinished={reveal}
            />
          )}
          {result && (
            <div
              className={cn(
                initial === null &&
                  "motion-safe:animate-card-land motion-reduce:animate-in motion-reduce:fade-in origin-bottom motion-reduce:duration-200"
              )}
            >
              <HoloCard
                card={cardFromResult(result)}
                sealed={initial === null}
              />
            </div>
          )}
        </div>
        {result && (
          <>
            <ShareActions result={result} />
            <ScanMeta result={result} />
          </>
        )}
      </section>
      {arrivedOnReport && <ScoreSite title="Score your site" />}
      {result && (
        <div
          className={cn(
            "flex flex-col gap-16",
            initial === null &&
              "motion-safe:animate-in motion-safe:fade-in motion-safe:fill-mode-both motion-safe:delay-600 motion-safe:duration-300"
          )}
        >
          <Patterns result={result} />
          <Details result={result} />
          <TasteSkills />
        </div>
      )}
      {!arrivedOnReport && <ScoreSite title="Score another site" />}
    </>
  );
};

const ScanPage = () => {
  const { slug } = Route.useLoaderData();
  return (
    <Page>
      <Scan key={slug} />
    </Page>
  );
};

export const Route = createFileRoute("/scan/$")({
  loader: async ({ params }) => {
    const raw = params._splat ?? "";
    let slug: string;
    try {
      ({ slug } = parseTarget(raw));
    } catch (error) {
      const invalid: ScanOutcome = {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Enter a web address, like linear.app.",
      };
      return { slug: raw, stored: null, invalid };
    }
    if (slug !== raw) {
      throw redirect({ to: "/scan/$", params: { _splat: slug } });
    }
    const stored = await peekScanFn({ data: slug });
    return { slug, stored, invalid: null };
  },
  head: ({ loaderData }) => {
    const links = [{ rel: "stylesheet", href: holoCardCss }];
    if (!loaderData) {
      return { links };
    }
    const { slug, stored } = loaderData;
    const head = stored ? reportHead(stored) : unscoredHead(slug);
    return { ...head, links: [...head.links, ...links] };
  },
  component: ScanPage,
});
