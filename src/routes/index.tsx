import { createFileRoute } from "@tanstack/react-router";

import { Page } from "@/components/page";
import { RecentScans } from "@/components/recent-scans";
import { ScanForm } from "@/components/scan-form";
import { recentScansFn } from "@/lib/scan.functions";

const Home = () => {
  const { scans } = Route.useLoaderData();
  return (
    <Page>
      <section className="flex flex-col gap-6">
        <h1 className="text-muted-foreground text-xl">
          <strong className="text-foreground font-medium">humantaste</strong>{" "}
          scores how much of a website a person chose, from 0 for a pure AI
          template to 100 when every choice was made on purpose. You get the
          patterns it found and what to change.
        </h1>
        <ScanForm />
      </section>
      <RecentScans scans={scans} />
    </Page>
  );
};

export const Route = createFileRoute("/")({
  loader: async () => ({ scans: await recentScansFn() }),
  component: Home,
});
