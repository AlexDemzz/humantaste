import {
  CheckIcon,
  ImageIcon,
  LinkIcon,
  WarningIcon,
  XLogoIcon,
} from "@phosphor-icons/react";
import { useState } from "react";
import type { ReactNode } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cardPath, reportUrl, shareOnXUrl } from "@/lib/share";
import type { AnalysisResult } from "@/lib/types";
import { cn } from "@/lib/utils";

const COPIED_MS = 1600;
const BLOCKED = "Your browser blocked the copy. Try again.";

type CopyState = "idle" | "done" | "failed";

const useCopied = () => {
  const [state, setState] = useState<CopyState>("idle");
  const run = async (copy: () => Promise<void>) => {
    try {
      await copy();
      setState("done");
      window.setTimeout(
        () => setState((current) => (current === "done" ? "idle" : current)),
        COPIED_MS
      );
    } catch {
      setState("failed");
    }
  };
  return [state, run] as const;
};

const announcementFor = (state: CopyState, doneMessage: string) => {
  if (state === "done") {
    return doneMessage;
  }
  return state === "failed" ? BLOCKED : "";
};

const cardBlob = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("The card image did not load.");
  }
  return response.blob();
};

const SwapLayer = ({
  shown,
  children,
}: {
  shown: boolean;
  children: ReactNode;
}) => (
  <span
    className={cn(
      "ease-swap grid motion-safe:transition motion-safe:duration-300",
      !shown && "scale-25 opacity-0 blur-xs"
    )}
  >
    {children}
  </span>
);

/** Icons in one cell: the idle one gives way to a check once the copy lands, or a warning if it is blocked. */
const SwapIcon = ({ state, icon }: { state: CopyState; icon: ReactNode }) => (
  <span className="grid *:col-start-1 *:row-start-1">
    <SwapLayer shown={state === "idle"}>{icon}</SwapLayer>
    <SwapLayer shown={state === "done"}>
      <CheckIcon />
    </SwapLayer>
    <SwapLayer shown={state === "failed"}>
      <WarningIcon />
    </SwapLayer>
  </span>
);

const CopyIconButton = ({
  label,
  doneMessage,
  icon,
  copy,
}: {
  label: string;
  doneMessage: string;
  icon: ReactNode;
  copy: () => Promise<void>;
}) => {
  const [state, run] = useCopied();
  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="icon-lg"
        aria-label={label}
        onClick={async () => {
          await run(copy);
        }}
      >
        <SwapIcon state={state} icon={icon} />
      </Button>
      <output
        className={
          state === "failed"
            ? "text-destructive order-last basis-full text-sm"
            : "sr-only"
        }
      >
        {announcementFor(state, doneMessage)}
      </output>
    </>
  );
};

/** An incomplete report isn't stored, so a link to it would lead to another scan. */
export const ShareActions = ({ result }: { result: AnalysisResult }) => {
  if (result.degraded) {
    return null;
  }
  const version = Date.parse(result.analyzedAt);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <h2 className="sr-only">Share this report</h2>
      <a
        className={cn(buttonVariants({ size: "lg" }))}
        href={shareOnXUrl(result.slug, result.score)}
        rel="noopener noreferrer"
        target="_blank"
      >
        <XLogoIcon data-icon="inline-start" />
        Share on X
      </a>
      <CopyIconButton
        label="Copy share link"
        doneMessage="Link copied"
        icon={<LinkIcon />}
        copy={() => navigator.clipboard.writeText(reportUrl(result.slug))}
      />
      <CopyIconButton
        label="Copy image"
        doneMessage="Image copied"
        icon={<ImageIcon />}
        copy={() =>
          navigator.clipboard.write([
            new ClipboardItem({
              "image/png": cardBlob(`${cardPath(result.slug)}?v=${version}`),
            }),
          ])
        }
      />
    </div>
  );
};
