import { ArrowUpRightIcon } from "@phosphor-icons/react";

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";

/** Sources and reasons: docs/research/anti-slop-skills.md and docs/research/skills-sh-sweep.md. */
const SKILLS = [
  {
    name: "Emil Kowalski",
    what: "Motion and interaction: when to animate, which curve, how long.",
    href: "https://github.com/emilkowalski/skills",
  },
  {
    name: "Jakub Krehel",
    what: "Type, colour, layout and accessibility, with exact values to use.",
    href: "https://github.com/jakubkrehel/skills",
  },
  {
    name: "Unslop, by Cursor",
    what: "Cuts AI habits from your copy: stock words, em dashes, chatbot phrases.",
    href: "https://github.com/cursor/plugins/tree/main/pstack/skills/unslop",
  },
  {
    name: "Impeccable, by Paul Bakaus",
    what: "A design skill with a detector that flags AI patterns before you ship.",
    href: "https://github.com/pbakaus/impeccable",
  },
  {
    name: "Taste Skill, by Leonxlnx",
    what: "Art direction for your agent: reference images and a browser check.",
    href: "https://github.com/Leonxlnx/taste-skill",
  },
] as const;

/** Where to go once the patterns are fixed: skills written by people with taste. */
export const TasteSkills = () => (
  <section className="flex flex-col gap-4" aria-labelledby="taste">
    <h2 id="taste" className="text-foreground font-semibold">
      Skills that give your agent taste
    </h2>
    <ul className="flex flex-col gap-2">
      {SKILLS.map((skill) => (
        <li key={skill.href}>
          <Item
            variant="outline"
            render={
              <a
                href={skill.href}
                target="_blank"
                rel="noopener"
                aria-label={`${skill.name} on GitHub, opens in a new tab`}
              />
            }
          >
            <ItemContent>
              <ItemTitle>{skill.name}</ItemTitle>
              <ItemDescription>{skill.what}</ItemDescription>
            </ItemContent>
            <ItemActions>
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
