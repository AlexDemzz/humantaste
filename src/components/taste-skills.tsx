import { ArrowUpRightIcon, StarIcon } from "@phosphor-icons/react";
import { Link, useLoaderData, useSearch } from "@tanstack/react-router";

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  compactStars,
  pageSlots,
  skillsPage,
  spokenStars,
  TASTE_SKILLS,
  withLiveStars,
} from "@/lib/taste-skills";

/** Stays where the reader is: the list changes in place, and the report above it does not reload. */
const linkToPage = (page: number, disabled = false) => (
  <Link
    from="/scan/$"
    to="."
    search={{ page: page > 1 ? page : undefined }}
    activeOptions={{ exact: true }}
    resetScroll={false}
    preload={false}
    disabled={disabled}
  />
);

/** Where to go once the patterns are fixed: skills written by people with taste. */
export const TasteSkills = () => {
  const { page: requested = 1 } = useSearch({ from: "/scan/$" });
  const { stars } = useLoaderData({ from: "/scan/$" });
  const { skills, page, pageCount } = skillsPage(
    withLiveStars(TASTE_SKILLS, stars),
    requested
  );

  return (
    <section className="flex flex-col gap-4" aria-labelledby="taste">
      <h2 id="taste" className="text-foreground font-semibold">
        Skills that give your agent taste
      </h2>
      <ul className="flex flex-col gap-2">
        {skills.map((skill) => (
          <li key={skill.href}>
            <Item
              variant="outline"
              render={
                <a
                  href={skill.href}
                  target="_blank"
                  rel="noopener"
                  aria-label={`${skill.name} on GitHub, ${spokenStars(skill.stars)}, opens in a new tab`}
                />
              }
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
      {pageCount > 1 && (
        <Pagination aria-label="Skills pages">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious render={linkToPage(page - 1, page === 1)} />
            </PaginationItem>
            {pageSlots(page, pageCount).map((slot) => (
              <PaginationItem key={slot}>
                {typeof slot === "number" ? (
                  <PaginationLink
                    aria-label={`Go to page ${slot}`}
                    isActive={slot === page}
                    render={linkToPage(slot)}
                  >
                    {slot}
                  </PaginationLink>
                ) : (
                  <PaginationEllipsis />
                )}
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                render={linkToPage(page + 1, page === pageCount)}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </section>
  );
};
