// PROTOTYPE: the production pages, laid out exactly as they are, with a slot for the logo and one for the score card.
// Page and SiteHeader are copied here only because the real ones import the logo directly.
import {
  CaretDownIcon,
  ArrowUpRightIcon,
  StarIcon,
} from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { useId, useState } from "react";
import type { ComponentType, ReactNode } from "react";

import { GitHubIcon } from "@/components/github-icon";
import { HowItWorks } from "@/components/how-it-works";
import { RecentScans } from "@/components/recent-scans";
import { Patterns, scoredAt } from "@/components/report";
import { ScanForm } from "@/components/scan-form";
import { ShareActions } from "@/components/share-actions";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockFooter,
} from "@/components/ui/code-block";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { REPO_URL } from "@/lib/info-pages";
import { agentPrompt } from "@/lib/prompt";
import { JEV_MAX_POINTS, OWN_FACE_POINTS, tierFor } from "@/lib/score";
import { cardFromResult, lookWords } from "@/lib/share";
import {
  compactStars,
  SKILLS_PER_PAGE,
  TASTE_SKILLS,
} from "@/lib/taste-skills";
import type { AnalysisResult } from "@/lib/types";
import { cn } from "@/lib/utils";

import type { CardProps } from "./card";
import { RECENT, RESULT } from "./fixture";

export interface Skin {
  key: string;
  name: string;
  Logo: ComponentType<{ className?: string }>;
  Card: ComponentType<CardProps>;
}

export type PageKey = "report" | "home";

/** One card to print on the report: its score, and a line above it when several levels are shown together. */
export interface Print {
  score: number;
  caption?: string;
}

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

const Details = ({ result }: { result: AnalysisResult }) => {
  const patterns = result.signals.filter((signal) => signal.hit);
  const clean = result.signals.filter(
    (signal) => !signal.hit && signal.checked
  );
  return (
    <section className="flex flex-col gap-4" aria-labelledby="details">
      <h2 id="details" className="text-foreground font-semibold">
        Behind the score
      </h2>
      <Tabs defaultValue="maths">
        <TabsList aria-label="Details of the score">
          <TabsTrigger value="maths">Math</TabsTrigger>
          <TabsTrigger value="clean">
            Not found <span className="tabular-nums">({clean.length})</span>
          </TabsTrigger>
          <TabsTrigger value="prompt">Prompt</TabsTrigger>
        </TabsList>
        <TabsContent value="maths">
          <div className="flex flex-col gap-4">
            <ol className="flex flex-col gap-2">
              <Step value="100">Every page starts at</Step>
              {patterns.map((signal) => (
                <Step key={signal.id} value={`−${signal.points}`}>
                  {signal.title}
                </Step>
              ))}
              <Step value={`+${result.visual?.points ?? 0}`}>
                {result.visual
                  ? `Jev says ${lookWords(result.visual)}`
                  : "Jev didn't look at the screenshot"}
              </Step>
              <Step value={`${result.score}`}>Score out of 100</Step>
            </ol>
            <p className="text-muted-foreground text-sm">
              Each pattern found takes its points off 100. Jev’s look at the
              screenshot gives back up to {JEV_MAX_POINTS}, and a typeface of
              the site’s own gives back {OWN_FACE_POINTS}. The score never goes
              above 100 or below 0.
            </p>
          </div>
        </TabsContent>
        <TabsContent value="clean">
          <ul className="list-disc gap-8 pl-5 sm:columns-2">
            {clean.map((signal) => (
              <li key={signal.id}>{signal.title}</li>
            ))}
          </ul>
        </TabsContent>
        <TabsContent value="prompt">
          <PromptBlock prompt={agentPrompt(result)} />
        </TabsContent>
      </Tabs>
    </section>
  );
};

const Skills = () => (
  <section className="flex flex-col gap-4" aria-labelledby="taste">
    <h2 id="taste" className="text-foreground font-semibold">
      Skills that give your agent taste
    </h2>
    <ul className="flex flex-col gap-2">
      {TASTE_SKILLS.slice(0, SKILLS_PER_PAGE).map((skill) => (
        <li key={skill.href}>
          <Item
            variant="outline"
            render={<a href={skill.href} target="_blank" rel="noopener" />}
          >
            <ItemContent>
              <ItemTitle>{skill.name}</ItemTitle>
              <ItemDescription>{skill.what}</ItemDescription>
            </ItemContent>
            <ItemActions>
              <span className="text-muted-foreground flex items-center gap-1 tabular-nums">
                <StarIcon aria-hidden="true" />
                {compactStars(skill.stars)}
              </span>
              <ArrowUpRightIcon
                className="text-muted-foreground"
                aria-hidden="true"
              />
            </ItemActions>
          </Item>
        </li>
      ))}
    </ul>
  </section>
);

const Report = ({ skin, prints }: { skin: Skin; prints: Print[] }) => {
  const result = RESULT;
  const patterns = result.signals.filter((signal) => signal.hit).length;
  return (
    <>
      <section className="flex flex-col gap-4">
        <h1 className="sr-only">
          {result.slug} scores {prints[0]?.score} out of 100
        </h1>
        {prints.map(({ score, caption }) => (
          <div key={score} className="flex flex-col gap-2">
            {caption && <p className="text-sm">{caption}</p>}
            <div className="grid aspect-1200/630 *:[grid-area:1/1]">
              <skin.Card
                card={{ ...cardFromResult(result), score }}
                tier={tierFor(score)}
              />
            </div>
          </div>
        ))}
        <ShareActions result={result} />
        <p className="text-sm tabular-nums">
          {patterns} of {result.signals.length} patterns found. Scored{" "}
          <time dateTime={result.analyzedAt}>{scoredAt(result)}</time>.{" "}
          <button type="button" className="text-link">
            Score again
          </button>
        </p>
      </section>
      <div className="flex flex-col gap-12">
        <Patterns result={result} />
        <Details result={result} />
        <section className="flex flex-col gap-4" aria-labelledby="again">
          <h2 id="again" className="text-foreground font-semibold">
            Score your site
          </h2>
          <ScanForm examples={false} />
        </section>
        <Skills />
      </div>
    </>
  );
};

const Home = () => (
  <>
    <section className="flex flex-col gap-5">
      <h1 className="text-muted-foreground text-xl leading-relaxed">
        <strong className="text-foreground font-medium">humantaste</strong>{" "}
        scores how human your website looks, from 0 for a pure AI template to
        100 for no sign of one. You get the patterns it found and what to
        change.
      </h1>
      <ScanForm />
    </section>
    <RecentScans scans={RECENT} />
  </>
);

/** `Page` and `SiteHeader`, class for class, wearing one skin. */
export const Shell = ({
  skin,
  page,
  prints,
}: {
  skin: Skin;
  page: PageKey;
  prints: Print[];
}) => (
  <div className="skin grid min-h-svh grid-cols-1" data-skin={skin.key}>
    <div
      aria-hidden
      className="footer-panorama col-start-1 row-start-1 aspect-3/1 min-h-56 w-full self-end"
    />
    <div className="max-w-column footer-panorama-clearance col-start-1 row-start-1 mx-auto flex w-full flex-col gap-16 px-6 pt-12">
      <div
        className={cn("flex flex-col", page === "home" ? "gap-6" : "gap-12")}
      >
        <header className="flex min-h-10 items-center justify-between">
          <Link to="/" className="rounded-md" aria-label="humantaste home">
            <skin.Logo className="text-foreground text-xl" />
          </Link>
          <a
            className={cn(buttonVariants({ variant: "secondary" }))}
            href={REPO_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            <GitHubIcon data-icon="inline-start" />
            GitHub
          </a>
        </header>
        <main className="flex flex-col gap-12">
          {page === "home" ? <Home /> : <Report skin={skin} prints={prints} />}
        </main>
      </div>
      <HowItWorks />
    </div>
  </div>
);
