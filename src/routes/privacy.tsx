import { createFileRoute } from "@tanstack/react-router";

import { InfoPageView } from "@/components/info-page";
import { INFO_PAGES } from "@/lib/info-pages";
import { infoPageHead } from "@/lib/seo";

const PrivacyPage = () => <InfoPageView page={INFO_PAGES.privacy} />;

export const Route = createFileRoute("/privacy")({
  head: () => infoPageHead("privacy"),
  component: PrivacyPage,
});
