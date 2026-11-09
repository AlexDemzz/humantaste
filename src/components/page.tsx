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
  <div className="max-w-column mx-auto flex w-full flex-col gap-16 px-6 pt-12 pb-16">
    <div className={cn("flex flex-col", opensOnStatement ? "gap-6" : "gap-12")}>
      <SiteHeader />
      <main className="flex flex-col gap-12">{children}</main>
    </div>
    <HowItWorks />
  </div>
);
