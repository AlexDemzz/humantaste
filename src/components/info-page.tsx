import { Link } from "@tanstack/react-router";
import { Fragment, useId } from "react";

import { Page } from "@/components/page";
import type {
  InfoPage,
  InfoParagraph,
  InfoPart,
  InfoSection,
} from "@/lib/info-pages";

const partKey = (part: InfoPart) =>
  typeof part === "string" ? part : part.text;

const Part = ({ part }: { part: InfoPart }) => {
  if (typeof part === "string") {
    return part;
  }
  if ("to" in part) {
    return (
      <Link className="text-link" to={part.to}>
        {part.text}
      </Link>
    );
  }
  return (
    <a
      className="text-link"
      href={part.href}
      rel="noopener noreferrer"
      target="_blank"
    >
      {part.text}
    </a>
  );
};

const Paragraphs = ({ paragraphs }: { paragraphs: InfoParagraph[] }) =>
  paragraphs.map((paragraph) => (
    <p key={paragraph.map(partKey).join("")}>
      {paragraph.map((part) => (
        <Fragment key={partKey(part)}>
          <Part part={part} />
        </Fragment>
      ))}
    </p>
  ));

const Section = ({ section }: { section: InfoSection }) => {
  const id = useId();
  return (
    <section className="flex flex-col gap-4" aria-labelledby={id}>
      <h2 id={id} className="text-foreground font-semibold">
        {section.title}
      </h2>
      <Paragraphs paragraphs={section.paragraphs} />
    </section>
  );
};

export const InfoPageView = ({ page }: { page: InfoPage }) => (
  <Page>
    <section className="flex flex-col gap-4">
      <h1 className="text-foreground font-semibold">{page.title}</h1>
      <Paragraphs paragraphs={page.intro} />
    </section>
    {page.sections.map((section) => (
      <Section key={section.title} section={section} />
    ))}
  </Page>
);
