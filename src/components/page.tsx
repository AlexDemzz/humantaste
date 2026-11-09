import type { ReactNode } from "react";

import { HowItWorks } from "@/components/how-it-works";
import { SiteHeader } from "@/components/site-header";
import { cn } from "@/lib/utils";

/** The one column every page sits in. A page that opens on the statement keeps it close under the header, as one block. */
export const Page = ({
  children,
  opensOnStatement = false,
}: {
  children: ReactNode;
  opensOnStatement?: boolean;
}) => (
  <div className="grid min-h-svh grid-cols-1">
    <div
      aria-hidden
      className="footer-panorama col-start-1 row-start-1 aspect-3/1 min-h-56 w-full self-end"
    />
    <div className="max-w-column footer-panorama-clearance col-start-1 row-start-1 mx-auto flex w-full flex-col gap-16 px-6 pt-12">
      <div
        className={cn("flex flex-col", opensOnStatement ? "gap-6" : "gap-12")}
      >
        <SiteHeader />
        <main className="flex flex-col gap-12">{children}</main>
      </div>
      <HowItWorks />
    </div>
  </div>
);
