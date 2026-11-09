import { createFileRoute } from "@tanstack/react-router";

import { Page } from "@/components/page";
import { RecentScans } from "@/components/recent-scans";
import { ScanForm } from "@/components/scan-form";
import { recentScansFn } from "@/lib/scan.functions";
import { homeHead } from "@/lib/seo";

const Home = () => {
  const { scans } = Route.useLoaderData();
  return (
    <Page opensOnStatement>
      <section className="flex flex-col gap-5">
        <h1 className="text-muted-foreground text-xl leading-relaxed">
          <strong className="text-foreground font-medium">humantaste</strong>{" "}
          scores how human your website looks, from 0 for a pure AI template to
          100 for no sign of one. You get the patterns it found and what to
          change.
        </h1>
        <ScanForm />
      </section>
      <RecentScans scans={scans} />
    </Page>
  );
};

export const Route = createFileRoute("/")({
  loader: async () => ({ scans: await recentScansFn() }),
  head: homeHead,
  component: Home,
});
