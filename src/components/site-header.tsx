import { Link } from "@tanstack/react-router";

import { GitHubIcon } from "@/components/github-icon";
import { Logo } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const REPO_URL = "https://github.com/AlexDemzz/humantaste";

export const SiteHeader = () => (
  <header className="flex items-center justify-between">
    <Link to="/" className="rounded-md" aria-label="humantaste home">
      <Logo />
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
