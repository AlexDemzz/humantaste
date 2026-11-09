import {
  CheckIcon,
  ImageIcon,
  LinkIcon,
  XLogoIcon,
} from "@phosphor-icons/react";
import { useState } from "react";
import type { ReactNode } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
    } catch {
      setState("failed");
    }
    window.setTimeout(() => setState("idle"), COPIED_MS);
  };
  return [state, run] as const;
};

const tipFor = (state: CopyState, hint: string, doneHint: string) => {
  if (state === "done") {
    return doneHint;
  }
  return state === "failed" ? BLOCKED : hint;
};

const cardBlob = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("The card image did not load.");
  }
  return response.blob();
};

/** Two icons in one cell: the idle one gives way to a check once the copy lands. */
const SwapIcon = ({ done, icon }: { done: boolean; icon: ReactNode }) => (
  <span className="grid *:col-start-1 *:row-start-1">
    <span
      className={cn(
        "ease-swap grid motion-safe:transition motion-safe:duration-300",
        done && "scale-25 opacity-0 blur-xs"
      )}
    >
      {icon}
    </span>
    <span
      className={cn(
        "ease-swap grid motion-safe:transition motion-safe:duration-300",
        !done && "scale-25 opacity-0 blur-xs"
      )}
    >
      <CheckIcon />
    </span>
  </span>
);

const CopyIconButton = ({
  label,
  hint,
  doneHint,
  icon,
  copy,
}: {
  label: string;
  hint: string;
  doneHint: string;
  icon: ReactNode;
  copy: () => Promise<void>;
}) => {
  const [state, run] = useCopied();
  const [hovered, setHovered] = useState(false);
  return (
    <>
      <Tooltip open={state !== "idle" || hovered} onOpenChange={setHovered}>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              aria-label={label}
              onClick={async () => {
                await run(copy);
              }}
            />
          }
        >
          <SwapIcon done={state === "done"} icon={icon} />
        </TooltipTrigger>
        <TooltipContent className="max-w-60">
          {tipFor(state, hint, doneHint)}
        </TooltipContent>
      </Tooltip>
      <output className="sr-only">{state === "done" ? doneHint : ""}</output>
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
    <div className="flex items-center gap-2">
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
        hint="Copy a link to this report. It unfurls with the score card."
        doneHint="Link copied"
        icon={<LinkIcon />}
        copy={() => navigator.clipboard.writeText(reportUrl(result.slug))}
      />
      <CopyIconButton
        label="Copy image"
        hint="Copy the score card as an image, to paste into a post or a chat."
        doneHint="Image copied"
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
