import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { HoloCard } from "@/components/holo-card/holo-card";
import { Page } from "@/components/page";
import { Details, Patterns, scoredAt } from "@/components/report";
import { ScanForm } from "@/components/scan-form";
import { ShareActions } from "@/components/share-actions";
import { TasteSkills } from "@/components/taste-skills";
import { peekScanFn, runScanFn } from "@/lib/scan.functions";
import type { ScanOutcome } from "@/lib/scan.functions";
import { cardFromResult, cardPath, SITE_HOST } from "@/lib/share";
import { parseTarget } from "@/lib/target";
import type { AnalysisResult } from "@/lib/types";
import { cn } from "@/lib/utils";

import holoCardCss from "@/components/holo-card/holo-card.css?url";

const SITE_URL = import.meta.env.VITE_SITE_URL ?? `https://${SITE_HOST}`;

const failure = (error: unknown): ScanOutcome => ({
  ok: false,
  error:
    error instanceof Error
      ? error.message
      : "Unable to score this page. Try again in a minute.",
});

const Elapsed = ({ slug }: { slug: string }) => {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const started = Date.now();
    const id = window.setInterval(
      () => setElapsed(Math.floor((Date.now() - started) / 1000)),
      500
    );
    return () => window.clearInterval(id);
  }, []);
  return (
    <p className="text-sm tabular-nums">
      Scoring {slug}: fetching the HTML and CSS, rendering in headless Chrome,
      measuring what painted. {elapsed}s, usually under 20.
    </p>
  );
};

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

/**
 * One card for the whole scan, so the same element turns over when the result lands.
 * A stored scan is known from the first render and starts on the front.
 */
const Scan = () => {
  const { slug, stored, invalid, pending } = Route.useLoaderData();
  // oxlint-disable-next-line react/hook-use-state -- the first outcome is fixed for this mount; it decides whether the evidence fades in
  const [initial] = useState<ScanOutcome | null>(
    () => invalid ?? (stored ? { ok: true, result: stored } : null)
  );
  const [outcome, setOutcome] = useState(initial);

  useEffect(() => {
    let live = true;
    const settle = async () => {
      let next: ScanOutcome;
      try {
        next = await pending;
      } catch (error) {
        next = failure(error);
      }
      if (live) {
        setOutcome(next);
      }
    };
    settle();
    return () => {
      live = false;
    };
  }, [pending]);

  if (outcome && !outcome.ok) {
    return (
      <section className="flex flex-col gap-4">
        <h1 className="text-foreground font-semibold">
          Unable to score {slug}
        </h1>
        <p className="text-destructive text-sm" role="alert">
          {outcome.error}
        </p>
      </section>
    );
  }

  const result = outcome?.result ?? null;
  return (
    <>
      <section className="flex flex-col gap-4" aria-live="polite">
        <h1 className="sr-only">
          {result
            ? `${slug} scores ${result.score} out of 100`
            : `Scoring ${slug}`}
        </h1>
        <HoloCard
          slug={slug}
          card={result && cardFromResult(result)}
          sealed={initial === null}
        />
        {result ? (
          <>
            <ShareActions result={result} />
            <ScanMeta result={result} />
          </>
        ) : (
          <Elapsed slug={slug} />
        )}
      </section>
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
    </>
  );
};

const ScanPage = () => {
  const { slug } = Route.useLoaderData();
  return (
    <Page>
      <Scan key={slug} />
      <section className="flex flex-col gap-4" aria-labelledby="again">
        <h2 id="again" className="text-foreground font-semibold">
          Score another site
        </h2>
        <ScanForm key={slug} examples={false} />
      </section>
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
      return {
        slug: raw,
        stored: null,
        invalid,
        pending: Promise.resolve(invalid),
      };
    }
    if (slug !== raw) {
      throw redirect({ to: "/scan/$", params: { _splat: slug } });
    }
    const stored = await peekScanFn({ data: slug });
    const pending: Promise<ScanOutcome> = stored
      ? Promise.resolve({ ok: true, result: stored })
      : runScanFn({ data: { slug } });
    return { slug, stored, invalid: null, pending };
  },
  head: ({ loaderData }) => {
    const links = [{ rel: "stylesheet", href: holoCardCss }];
    if (!loaderData) {
      return { links };
    }
    const { slug, stored } = loaderData;
    const title = stored
      ? `${slug} scores ${stored.score}/100 on humantaste`
      : `${slug} on humantaste`;
    const description =
      stored?.verdict ??
      "How much of this page did a person choose? 0 is a pure AI template, 100 is every choice made on purpose.";
    const image = `${SITE_URL}${cardPath(slug)}`;
    const imageMeta = stored
      ? [
          { property: "og:image", content: image },
          { property: "og:image:width", content: "1200" },
          { property: "og:image:height", content: "630" },
          { name: "twitter:card", content: "summary_large_image" },
          { name: "twitter:image", content: image },
        ]
      : [{ name: "twitter:card", content: "summary" }];
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { name: "twitter:title", content: title },
        ...imageMeta,
      ],
      links,
    };
  },
  component: ScanPage,
});
