import { Link } from "@tanstack/react-router";

import { GitHubIcon } from "@/components/github-icon";
import { Logo } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";
import { REPO_URL } from "@/lib/info-pages";
import { cn } from "@/lib/utils";

export const SiteHeader = () => (
  <header className="flex items-center justify-between">
    <Link to="/" className="rounded-md" aria-label="humantaste home">
      <Logo className="text-foreground text-xl" />
    </Link>
    <a
      className={cn(buttonVariants({ variant: "outline" }))}
      href={REPO_URL}
      rel="noopener noreferrer"
      target="_blank"
    >
      <GitHubIcon data-icon="inline-start" />
      GitHub
    </a>
  </header>
);
