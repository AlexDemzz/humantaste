import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import {
  CaretLeftIcon,
  CaretRightIcon,
  DotsThreeIcon,
} from "@phosphor-icons/react";
import type { VariantProps } from "class-variance-authority";
import { cn } from "cn";
import * as React from "react";

import { buttonVariants } from "@/components/ui/button";

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-wrap items-center gap-0.5", className)}
      {...props}
    />
  );
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />;
}

type PaginationLinkProps = useRender.ComponentProps<"a"> &
  Pick<VariantProps<typeof buttonVariants>, "size"> & {
    isActive?: boolean;
  };

function PaginationLink({
  className,
  isActive,
  size = "icon-lg",
  render,
  ...props
}: PaginationLinkProps) {
  return useRender({
    defaultTagName: "a",
    render,
    props: mergeProps<"a">(
      {
        "aria-current": isActive ? "page" : undefined,
        className: cn(
          buttonVariants({ variant: isActive ? "outline" : "ghost", size }),
          "aria-disabled:pointer-events-none aria-disabled:opacity-50",
          className
        ),
      },
      props
    ),
    state: { slot: "pagination-link", active: isActive },
  });
}

function PaginationPrevious({
  className,
  children = "Previous",
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      className={cn("gap-1.5 sm:w-auto sm:ps-3 sm:pe-4", className)}
      {...props}
    >
      <CaretLeftIcon />
      <span className="hidden sm:block">{children}</span>
    </PaginationLink>
  );
}

function PaginationNext({
  className,
  children = "Next",
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      className={cn("gap-1.5 sm:w-auto sm:ps-4 sm:pe-3", className)}
      {...props}
    >
      <span className="hidden sm:block">{children}</span>
      <CaretRightIcon />
    </PaginationLink>
  );
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden="true"
      data-slot="pagination-ellipsis"
      className={cn(
        "flex size-10 items-center justify-center [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <DotsThreeIcon />
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
