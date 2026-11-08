import type { ReactNode } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { agentPrompt } from "@/lib/prompt";
import { HALF_AT } from "@/lib/score";
import { lookWords, shotPath } from "@/lib/share";
import type { AnalysisResult } from "@/lib/types";

const found = (result: AnalysisResult) =>
  result.signals.filter((signal) => signal.hit);

const patternsHeading = (count: number) => {
  if (count === 0) {
    return "No AI patterns found";
  }
  return `${count === 1 ? "AI pattern" : "AI patterns"} found (${count})`;
};

export const scoredAt = (result: AnalysisResult) =>
  `${new Date(result.analyzedAt).toUTCString().slice(5, 22)} UTC`;

/** What gave the page away: one fold per pattern, closed to its points, open to the evidence and the fix. */
export const Patterns = ({ result }: { result: AnalysisResult }) => {
  const patterns = found(result);
  return (
    <section className="flex flex-col gap-4" aria-labelledby="patterns">
      <h2 id="patterns" className="text-foreground font-medium">
        {patternsHeading(patterns.length)}
      </h2>
      {patterns.length === 0 && (
        <p className="text-sm">
          Every check came back clean, so the score stays at 100.
        </p>
      )}
      {patterns.length > 0 && (
        <div className="border-y">
          <Accordion multiple>
            {patterns.map((signal) => (
              <AccordionItem key={signal.id} value={signal.id}>
                <AccordionTrigger>
                  <span className="flex flex-1 gap-4 pr-4">
                    <span className="text-foreground flex-1">
                      {signal.title}
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      {signal.points} pts
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-faint-foreground font-mono text-xs break-all">
                    {signal.hit?.evidence} ({signal.hit?.source})
                  </p>
                  <p>
                    {signal.why}{" "}
                    <strong className="text-foreground font-medium">
                      Fix:
                    </strong>{" "}
                    {signal.fix}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}
    </section>
  );
};

const Step = ({ value, children }: { value: string; children: ReactNode }) => (
  <li className="flex items-baseline justify-between gap-4">
    <span>{children}</span>
    <span className="text-foreground shrink-0 tabular-nums">{value}</span>
  </li>
);

/** The score in plain steps, the prompt, the checks that came back clean and what the renderer saw. */
export const Details = ({ result }: { result: AnalysisResult }) => {
  const count = found(result).length;
  const clean = result.signals.filter(
    (signal) => !signal.hit && signal.checked
  );
  return (
    <div className="border-y">
      <Accordion multiple>
        <AccordionItem value="maths">
          <AccordionTrigger>How we got to {result.score}</AccordionTrigger>
          <AccordionContent>
            <ol className="flex flex-col gap-2">
              <Step value={`${result.rawPoints} pts`}>
                {count} {count === 1 ? "pattern adds" : "patterns add"} up to
              </Step>
              {result.credits.map((credit) => (
                <Step key={credit.id} value={`×${credit.factor}`}>
                  {credit.title}: {credit.evidence}
                </Step>
              ))}
              <Step value={`×${result.visual?.factor ?? 1}`}>
                {result.visual
                  ? `Jev looked at the screenshot and called it ${lookWords(result.visual)}`
                  : "No look at the screenshot this time, so the points stand"}
              </Step>
              <Step value={`= ${result.score}`}>
                {result.points} pts on a curve where {HALF_AT} pts is a score of
                50: one pattern costs little, five cost most of the score
              </Step>
            </ol>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="prompt">
          <AccordionTrigger>The prompt for your agent</AccordionTrigger>
          <AccordionContent>
            <pre className="bg-muted text-foreground max-h-72 overflow-auto rounded-2xl px-5 py-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
              {agentPrompt(result)}
            </pre>
          </AccordionContent>
        </AccordionItem>
        {clean.length > 0 && (
          <AccordionItem value="clean">
            <AccordionTrigger>
              {clean.length} patterns not found
            </AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc columns-2xs gap-8 pl-5">
                {clean.map((signal) => (
                  <li key={signal.id}>{signal.title}</li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        )}
        {result.hasScreenshot && (
          <AccordionItem value="shot">
            <AccordionTrigger>The screenshot we scored</AccordionTrigger>
            <AccordionContent>
              <img
                className="rounded-2xl outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
                src={`${shotPath(result.slug)}?v=${Date.parse(result.analyzedAt)}`}
                width={1280}
                height={800}
                alt={`Screenshot of ${result.slug} at 1280 by 800`}
                loading="lazy"
              />
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
};
