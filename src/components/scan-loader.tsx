import { useEffect, useRef, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STEPS = [
  "Fetching the HTML and CSS",
  "Rendering in headless Chrome",
  "Measuring what painted",
  "Showing the screenshot to Jev",
];

const PATTERNS = [
  "Looking for gradients as decoration",
  "Looking for frosted glass",
  "Looking for coloured glows",
  "Looking for three cards in a row",
  "Looking for a pill above the headline",
  "Looking for emoji standing in for icons",
  "Looking for words a model reaches for",
  "Looking for template marketing phrases",
  "Looking for bouncy easing",
];

const LINE_EVERY_MS = 1700;
const LEAVE_MS = 180;

const lineAt = (step: number) =>
  step < STEPS.length
    ? STEPS[step]
    : PATTERNS[(step - STEPS.length) % PATTERNS.length];

/** The Scan spinner from loading.dev (MIT, © 2026 Jakub Krehel). */
const ScanSpinner = () => (
  <svg
    className="size-10"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <rect
      height="18"
      opacity="0.2"
      rx="4"
      strokeWidth="2"
      width="18"
      x="3"
      y="3"
    />
    <line
      className="motion-safe:animate-scan-sweep motion-reduce:[transform:translateY(5.5px)]"
      strokeLinecap="round"
      strokeWidth="2.5"
      x1="7.5"
      x2="16.5"
      y1="6.5"
      y2="6.5"
    />
  </svg>
);

const placeOf = (line: number, step: number) => {
  if (line < step) {
    return "-translate-y-full opacity-0";
  }
  return line > step ? "translate-y-full opacity-0" : "opacity-100";
};

/** The lines run on a clock, not on progress: the scan reports nothing until it ends. */
const RollingLine = ({ running }: { running: boolean }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!running) {
      return;
    }
    const id = window.setInterval(
      () => setStep((current) => current + 1),
      LINE_EVERY_MS
    );
    return () => window.clearInterval(id);
  }, [running]);

  return (
    <div className="relative h-8 w-full overflow-clip text-base leading-8 sm:text-xl">
      {[step - 1, step, step + 1]
        .filter((line) => line >= 0)
        .map((line) => (
          <div
            className={cn(
              "ease-roll absolute inset-x-0 top-0 truncate text-center transition duration-420 motion-reduce:transition-opacity",
              placeOf(line, step)
            )}
            key={line}
          >
            <span
              className={line === step ? "shimmer inline-block" : undefined}
            >
              {lineAt(line)}
            </span>
          </div>
        ))}
    </div>
  );
};

/**
 * The wait for a fresh scan, in a Card the size of the score card. Once `finishing`, its content fades and `onFinished`
 * fires so the score card can land; the empty Card stays under it until `covered` has had time to take effect.
 */
export const ScanLoader = ({
  finishing,
  covered,
  onFinished,
}: {
  finishing: boolean;
  covered: boolean;
  onFinished: () => void;
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!finishing) {
      return;
    }
    const content = contentRef.current;
    if (
      !content ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      onFinished();
      return;
    }
    const leaving = content.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: LEAVE_MS,
      easing: "ease-out",
      fill: "forwards",
    });
    leaving.onfinish = onFinished;
    return () => {
      leaving.onfinish = null;
    };
  }, [finishing, onFinished]);

  return (
    <div
      className="size-full transition-opacity delay-560 duration-200 data-covered:opacity-0"
      data-covered={covered || undefined}
      aria-hidden="true"
    >
      <Card className="size-full justify-center">
        {!covered && (
          <CardContent>
            <div
              className="text-muted-foreground grid justify-items-center gap-4"
              ref={contentRef}
            >
              <ScanSpinner />
              <RollingLine running={!finishing} />
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};
