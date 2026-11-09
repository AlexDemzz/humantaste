import type { CSSProperties } from "react";

import { LOGO, LOGO_HEIGHT_EM } from "@/lib/logo";
import { cn } from "@/lib/utils";

/** The logo in one ink. It sizes off the font size, so a text class sets it like the word it is. */
export const Logo = ({ className }: { className?: string }) => (
  <svg
    className={cn(
      "block h-(--logo-height) w-auto shrink-0 overflow-visible",
      className
    )}
    style={{ "--logo-height": `${LOGO_HEIGHT_EM}em` } as CSSProperties}
    viewBox={LOGO.viewBox}
    fill="currentColor"
    // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- inline so it takes the text colour; an <img> can't
    role="img"
    aria-label="humantaste"
  >
    <path fillRule="evenodd" d={LOGO.mark} />
    <path
      d={LOGO.word}
      stroke="currentColor"
      strokeWidth={LOGO.stroke}
      strokeLinejoin="round"
    />
  </svg>
);

/** The palette alone, 1em square. */
export const LogoMark = ({ className }: { className?: string }) => (
  <svg
    className={cn("block size-[1em] shrink-0", className)}
    viewBox={LOGO.markViewBox}
    fill="currentColor"
    // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- inline so it takes the text colour; an <img> can't
    role="img"
    aria-label="humantaste"
  >
    <path fillRule="evenodd" d={LOGO.mark} />
  </svg>
);
