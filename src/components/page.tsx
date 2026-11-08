import type { ReactNode } from "react";

import { HowItWorks } from "@/components/how-it-works";
import { SiteHeader } from "@/components/site-header";

/** The one column every page sits in: the header, the page's sections 64px apart, then how it works. */
export const Page = ({ children }: { children: ReactNode }) => (
  <div className="max-w-column mx-auto flex w-full flex-col gap-16 px-6 pt-6 pb-16">
    <SiteHeader />
    <main className="flex flex-col gap-16">{children}</main>
    <HowItWorks />
  </div>
);
