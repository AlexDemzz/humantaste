import { CaretDownIcon } from "@phosphor-icons/react";
import { useId, useState } from "react";
import type { ReactNode } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockFooter,
} from "@/components/ui/code-block";
import { Item, ItemActions, ItemContent } from "@/components/ui/item";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      <h2 id="patterns" className="text-foreground font-semibold">
        {patternsHeading(patterns.length)}
      </h2>
      {patterns.length === 0 && (
        <p className="text-sm">
          Every check came back clean, so the score stays at 100.
        </p>
      )}
      {patterns.length > 0 && (
        <Accordion multiple>
          {patterns.map((signal) => (
            <AccordionItem key={signal.id} value={signal.id}>
              <AccordionTrigger>
                <span className="flex flex-1 gap-4 pr-4">
                  <span className="flex-1">{signal.title}</span>
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
                  <strong className="text-foreground font-medium">Fix:</strong>{" "}
                  {signal.fix}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </section>
  );
};

const Step = ({ value, children }: { value: string; children: ReactNode }) => (
  <li>
    <Item variant="outline">
      <ItemContent>
        <span className="text-foreground font-semibold">{children}</span>
      </ItemContent>
      <ItemActions>
        <span className="text-muted-foreground font-semibold tabular-nums">
          {value}
        </span>
      </ItemActions>
    </Item>
  </li>
);

/** The prompt, folded to its first lines so the page scrolls, not the block. */
const PromptBlock = ({ prompt }: { prompt: string }) => {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  return (
    <CodeBlock size="sm">
      <CodeBlockActions>
        <CodeBlockCopyButton value={prompt} />
      </CodeBlockActions>
      <CodeBlockContent id={id} wrap collapsed={!expanded}>
        {prompt}
      </CodeBlockContent>
      <CodeBlockFooter className="justify-center">
        <Button
          variant="ghost"
          size="xs"
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => setExpanded(!expanded)}
        >
          <CaretDownIcon className="transition-transform duration-200 ease-out in-aria-expanded:rotate-180 aria-expanded:rotate-180" />
          {expanded ? "Show less" : "Show more"}
        </Button>
      </CodeBlockFooter>
    </CodeBlock>
  );
};

/** The score in plain steps, the prompt, the checks that came back clean and what the renderer saw, one at a time. */
export const Details = ({ result }: { result: AnalysisResult }) => {
  const count = found(result).length;
  const clean = result.signals.filter(
    (signal) => !signal.hit && signal.checked
  );
  return (
    <section className="flex flex-col gap-4" aria-labelledby="details">
      <h2 id="details" className="text-foreground font-semibold">
        Behind the score
      </h2>
      <Tabs defaultValue={result.hasScreenshot ? "shot" : "maths"}>
        <TabsList aria-label="Details of the score">
          {result.hasScreenshot && (
            <TabsTrigger value="shot">Screenshot</TabsTrigger>
          )}
          <TabsTrigger value="maths">Math</TabsTrigger>
          {clean.length > 0 && (
            <TabsTrigger value="clean">
              Not found <span className="tabular-nums">({clean.length})</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="prompt">Prompt</TabsTrigger>
        </TabsList>
        <TabsContent value="maths">
          <div className="flex flex-col gap-4">
            <ol className="flex flex-col gap-2">
              <Step value={`${result.rawPoints} pts`}>
                {count === 1 ? "1 pattern found" : `${count} patterns found`}
              </Step>
              {result.credits.map((credit) => (
                <Step key={credit.id} value={`×${credit.factor}`}>
                  {credit.title}: {credit.evidence}
                </Step>
              ))}
              <Step value={`×${result.visual?.factor ?? 1}`}>
                {result.visual
                  ? `Jev says ${lookWords(result.visual)}`
                  : "Jev didn't look at the screenshot"}
              </Step>
              <Step value={`${result.points} pts`}>Points left</Step>
              <Step value={`${result.score}`}>Score out of 100</Step>
            </ol>
            <p className="text-muted-foreground text-sm">
              Fewer points, higher score: 0 pts scores 100 and {HALF_AT} pts
              scores 50.
            </p>
          </div>
        </TabsContent>
        <TabsContent value="prompt">
          <PromptBlock prompt={agentPrompt(result)} />
        </TabsContent>
        {clean.length > 0 && (
          <TabsContent value="clean">
            <ul className="list-disc columns-2xs gap-8 pl-5">
              {clean.map((signal) => (
                <li key={signal.id}>{signal.title}</li>
              ))}
            </ul>
          </TabsContent>
        )}
        {result.hasScreenshot && (
          <TabsContent value="shot">
            <img
              className="rounded-2xl outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
              src={`${shotPath(result.slug)}?v=${Date.parse(result.analyzedAt)}`}
              width={1280}
              height={800}
              alt={`Screenshot of ${result.slug} at 1280 by 800`}
              loading="lazy"
            />
          </TabsContent>
        )}
      </Tabs>
    </section>
  );
};
