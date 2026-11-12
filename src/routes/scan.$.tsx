import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";

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
import { skillStarsFn } from "@/lib/skill-stars.functions";
import { parseTarget } from "@/lib/target";
import { parseSkillsPage } from "@/lib/taste-skills";
import type { AnalysisResult } from "@/lib/types";
import { cn } from "@/lib/utils";

import scoreFont from "../../assets/fonts/display/Kanit-BlackItalic-digits.woff2?url";
import cardScene from "../../assets/images/card-scene.webp?url";

import holoCardCss from "@/components/holo-card/holo-card.css?url";

/**
 * The card's font and drawing are named inside stylesheets, so the browser would only ask for them once the CSS is
 * parsed and paint the card without them first. Preloaded, they arrive with the CSS. Fonts and CSS masks are both
 * fetched in CORS mode, and a preload is only reused when its mode matches.
 *
 * Each file must be the one its stylesheet names (the @font-face in globals.css, the masks in holo-card.css): a
 * preload of any other file is fetched for nothing and the card paints without it again.
 */
const CARD_PRELOADS = [
  {
    rel: "preload",
    as: "font",
    type: "font/woff2",
    href: scoreFont,
    crossOrigin: "anonymous",
  },
  {
    rel: "preload",
    as: "image",
    type: "image/webp",
    href: cardScene,
    crossOrigin: "anonymous",
  },
] as const;

const failure = (error: unknown): ScanOutcome => ({
  ok: false,
  error:
    error instanceof Error
      ? error.message
      : "Unable to score this page. Try again in a minute.",
});

const CARD_LIFT_MS = 300;
const EVIDENCE_FADE_MS = 180;
/** `--ease-out` in globals.css. */
const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";
/** The two ends of `card-land` in globals.css: a card leaves by the way it landed. */
const CARD_FLAT = "perspective(1600px) translateY(0) rotateX(0deg) scale(1)";
const CARD_TILTED =
  "perspective(1600px) translateY(28px) rotateX(16deg) scale(0.96)";

const EVIDENCE_ARRIVES =
  "motion-safe:animate-in motion-safe:fade-in motion-safe:fill-mode-both motion-safe:delay-600 motion-safe:duration-300";

/**
 * A rescored report's old card tips back and its evidence fades. Both are held out of sight once gone, until the new
 * report replaces them. Reduced motion keeps the card's fade alone.
 */
const leaveReport = async (
  card: HTMLElement | null,
  evidence: HTMLElement | null
) => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fade = {
    duration: EVIDENCE_FADE_MS,
    easing: "ease-out",
    fill: "forwards",
  } as const;
  const leaving = reduced
    ? [card?.animate({ opacity: [1, 0] }, fade)]
    : [
        card?.animate(
          { opacity: [1, 0], transform: [CARD_FLAT, CARD_TILTED] },
          { duration: CARD_LIFT_MS, easing: EASE_OUT, fill: "forwards" }
        ),
        evidence?.animate({ opacity: [1, 0] }, fade),
      ];
  await Promise.all(leaving.map((animation) => animation?.finished));
};

/** The counts, when the scan ran, and a way to run it again. */
const ScanMeta = ({
  result,
  onRescored,
}: {
  result: AnalysisResult;
  onRescored: () => Promise<void>;
}) => {
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
    await onRescored();
    setRescan({ busy: false, error: null });
  };

  return (
    <>
      <p className="text-sm tabular-nums">
        {patterns} of {result.signals.length} patterns found.{" "}
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
  const router = useRouter();
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
  const cardRef = useRef<HTMLDivElement>(null);
  const evidenceRef = useRef<HTMLDivElement>(null);
  /** The report still on screen while its card leaves, whatever the route has loaded since. */
  const [leaving, setLeaving] = useState<AnalysisResult | null>(null);
  /** Each rescore deals a new card: it remounts, so it lands under its cover like a fresh scan's. */
  const [redeals, setRedeals] = useState(0);

  const redeal = async (old: AnalysisResult) => {
    setLeaving(old);
    await Promise.all([
      leaveReport(cardRef.current, evidenceRef.current),
      router.invalidate(),
    ]);
    setRedeals((count) => count + 1);
    setLeaving(null);
  };

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

  const scanned = leaving ?? outcome?.result ?? null;
  const result = revealed ? scanned : null;
  const arrivedOnReport = initial?.ok === true;
  const underCover = initial === null || redeals > 0;
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
                "origin-bottom",
                underCover &&
                  "motion-safe:animate-card-land motion-reduce:animate-in motion-reduce:fade-in motion-reduce:duration-200"
              )}
              key={redeals}
              ref={cardRef}
            >
              <HoloCard card={cardFromResult(result)} sealed={underCover} />
            </div>
          )}
        </div>
        {result && (
          <>
            <ShareActions result={result} />
            <ScanMeta result={result} onRescored={() => redeal(result)} />
          </>
        )}
      </section>
      {result && (
        <div
          className={cn(
            "flex flex-col gap-12",
            initial === null && EVIDENCE_ARRIVES
          )}
        >
          {/* Only what a rescore changes leaves with the old card: the forms under it keep what the reader typed. */}
          <div
            className={cn(
              "flex flex-col gap-12",
              redeals > 0 && EVIDENCE_ARRIVES
            )}
            key={redeals}
            ref={evidenceRef}
          >
            <Patterns result={result} />
            <Details result={result} />
          </div>
          {arrivedOnReport && <ScoreSite title="Score your site" />}
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
  validateSearch: (search: Record<string, unknown>): { page?: number } => ({
    page: parseSkillsPage(search.page),
  }),
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
      return { slug: raw, stored: null, stars: {}, invalid };
    }
    if (slug !== raw) {
      throw redirect({ to: "/scan/$", params: { _splat: slug } });
    }
    const [stored, stars] = await Promise.all([
      peekScanFn({ data: slug }),
      skillStarsFn(),
    ]);
    return { slug, stored, stars, invalid: null };
  },
  head: ({ loaderData }) => {
    const links = [{ rel: "stylesheet", href: holoCardCss }];
    if (!loaderData) {
      return { links };
    }
    const { slug, stored } = loaderData;
    const head = stored ? reportHead(stored) : unscoredHead(slug);
    // Only a stored report paints its card first: a fresh scan's card mounts later, under the cover.
    const preloads = stored ? CARD_PRELOADS : [];
    return { ...head, links: [...head.links, ...links, ...preloads] };
  },
  component: ScanPage,
});
